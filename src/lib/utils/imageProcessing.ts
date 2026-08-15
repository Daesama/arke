/**
 * Utilidades de imagen del editor, pensadas para lo que hace un celular:
 * fotos de 12MP recién salidas de la cámara.
 *
 * Todo lo pesado de acá evita el patrón "recorrer píxel por píxel en JS":
 * una imagen de cámara son ~12 millones de píxeles y cualquier bucle sobre
 * ellos bloquea el hilo principal el tiempo suficiente para que el navegador
 * móvil parezca colgado. Se usa composición de canvas, que la hace el
 * navegador (normalmente en GPU) sin frenar la UI.
 */

/**
 * Tope de lado mayor para cualquier imagen que entre al editor.
 *
 * 2048px es holgado para un estampado de ~35cm (≈150 DPI reales sobre tela,
 * muy por encima de lo que resuelve la impresión textil) y a cambio recorta
 * memoria, tiempo de subida con datos móviles y peso del PNG con alfa que
 * sale de quitar fondo — que a resolución de cámara puede pasar de 20MB.
 */
export const MAX_IMAGE_DIM = 2048;

/**
 * Lado mayor de la imagen que se le manda al modelo de segmentación.
 *
 * NO es la resolución de inferencia: el export ONNX de RMBG-1.4 tiene el
 * input fijo en 1024×1024 (pedirle 512 aborta con "Got invalid dimensions
 * for input: input ... Got: 512 Expected: 1024"), así que el costo del
 * modelo es constante y no hay nada que optimizar ahí.
 *
 * Lo que sí depende de este número es todo lo que rodea a la inferencia: la
 * máscara vuelve del pipeline reescalada al tamaño de lo que se le pasó, y
 * de ese tamaño salen el bucle por píxel de `applyAlphaMask`, el ImageData
 * que aloca y el buffer que cruza entre hilos. Mandarle una foto de 12MP
 * significaba una máscara de 12M bytes y un ImageData de 48MB en el hilo
 * principal; a 1024 son ~1M y ~4MB. El recorte final igual se compone a
 * resolución completa, así que la calidad del estampado no cambia.
 */
export const SEGMENTATION_MAX_DIM = 1024;

/**
 * Decodifica un blob a algo dibujable en canvas.
 *
 * `imageOrientation: "from-image"` es lo que evita que las fotos verticales
 * de celular (que traen la rotación en EXIF, no en los píxeles) queden
 * acostadas al pasar por canvas. Va con reintento porque no todos los
 * navegadores aceptan el diccionario de opciones.
 */
async function decodeImage(blob: Blob): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(blob, { imageOrientation: "from-image" });
    } catch {
      try {
        return await createImageBitmap(blob);
      } catch {
        // cae al camino con <img>
      }
    }
  }

  const url = URL.createObjectURL(blob);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("No se pudo leer la imagen"));
      img.src = url;
    });
  } finally {
    // El bitmap ya está decodificado en memoria; el object URL solo servía
    // para el decode.
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

function dimsOf(img: ImageBitmap | HTMLImageElement) {
  return img instanceof HTMLImageElement
    ? { width: img.naturalWidth, height: img.naturalHeight }
    : { width: img.width, height: img.height };
}

function release(img: ImageBitmap | HTMLImageElement) {
  if (typeof ImageBitmap !== "undefined" && img instanceof ImageBitmap) img.close();
}

function canvasToPngFile(canvas: HTMLCanvasElement, name: string): Promise<File> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) return reject(new Error("No se pudo generar la imagen"));
      resolve(new File([blob], name, { type: "image/png" }));
    }, "image/png");
  });
}

/**
 * Reduce el lado mayor a `maxDim`. Devuelve el archivo original sin tocar si
 * ya está por debajo — no tiene sentido re-encodear (y perder calidad de un
 * JPG) una imagen que ya sirve.
 */
export async function downscaleImageFile(
  file: File,
  maxDim: number = MAX_IMAGE_DIM,
): Promise<File> {
  let img: ImageBitmap | HTMLImageElement;
  try {
    img = await decodeImage(file);
  } catch {
    // Si no se puede decodificar acá, se deja pasar el archivo tal cual:
    // este paso es una optimización, no una validación.
    return file;
  }

  try {
    const { width, height } = dimsOf(img);
    if (!width || !height || Math.max(width, height) <= maxDim) return file;

    const scale = maxDim / Math.max(width, height);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // PNG y no JPG: la imagen puede traer transparencia (un logo que el
    // usuario ya subió recortado) y pasarla por JPG le pintaría el fondo.
    return await canvasToPngFile(canvas, file.name.replace(/\.\w+$/, ".png"));
  } catch {
    return file;
  } finally {
    release(img);
  }
}

export interface DecodedRgba {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

/**
 * Decodifica un archivo a píxeles RGBA planos, capando el lado mayor.
 *
 * Existe para que el worker de segmentación NO tenga que decodificar nada.
 * `RawImage.fromBlob` de transformers.js resuelve el blob con un único
 * camino —`createImageBitmap` + `OffscreenCanvas`, sin alternativa— y
 * cuando ese camino falla el navegador tira "The source image could not be
 * decoded", que era el error que veía el usuario. Acá, en cambio, se
 * decodifica con `decodeImage`, que sí tiene cadena de respaldo, y encima
 * es el mismo decode que ya probó funcionar al pintar el preview.
 *
 * Beneficio extra: una sola decodificación significa una sola
 * interpretación de la orientación EXIF. Con dos (una por lado) alcanzaba
 * con que los defaults difirieran para que la máscara volviera rotada
 * respecto de la imagen — un recorte destruido, sin ningún error.
 */
export async function decodeToRgba(
  file: File,
  maxDim: number = SEGMENTATION_MAX_DIM,
): Promise<DecodedRgba> {
  const img = await decodeImage(file);

  try {
    const { width, height } = dimsOf(img);
    if (!width || !height) throw new Error("La imagen no tiene dimensiones válidas");

    const scale = Math.min(1, maxDim / Math.max(width, height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("No se pudo preparar el lienzo");

    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return { data, width: canvas.width, height: canvas.height };
  } finally {
    release(img);
  }
}

/**
 * Aplica una máscara de opacidad a una imagen y devuelve el PNG recortado.
 *
 * La máscara llega del worker al tamaño con el que se corrió la
 * segmentación (`SEGMENTATION_MAX_DIM` como mucho), que casi nunca coincide
 * con el de la imagen. En vez de reescalarla a mano píxel por píxel, se
 * pinta en un canvas chico y se deja que `drawImage` la estire: el
 * navegador interpola, lo que además suaviza el borde del recorte, y
 * `destination-in` recorta usando solo el canal alfa.
 */
export async function applyAlphaMask(
  file: File,
  mask: Uint8Array,
  maskWidth: number,
  maskHeight: number,
): Promise<File> {
  const img = await decodeImage(file);

  try {
    const { width, height } = dimsOf(img);
    if (!width || !height) throw new Error("La imagen no tiene dimensiones válidas");

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No se pudo preparar el lienzo");
    ctx.drawImage(img, 0, 0, width, height);

    // Máscara → canvas con la opacidad en el canal alfa. Este es el único
    // bucle por píxel del proceso y corre sobre la máscara (≤1024² ≈ 1M),
    // no sobre la imagen (hasta 2048² ≈ 4.2M). El cap de `decodeToRgba` es
    // lo que sostiene esa cuenta: sin él la máscara vuelve del tamaño de la
    // foto original y este bucle es el que congela la página.
    const maskCanvas = document.createElement("canvas");
    maskCanvas.width = maskWidth;
    maskCanvas.height = maskHeight;
    const maskCtx = maskCanvas.getContext("2d");
    if (!maskCtx) throw new Error("No se pudo preparar la máscara");

    const maskData = maskCtx.createImageData(maskWidth, maskHeight);
    for (let i = 0; i < mask.length; i++) {
      maskData.data[i * 4 + 3] = mask[i];
    }
    maskCtx.putImageData(maskData, 0, 0);

    ctx.imageSmoothingQuality = "high";
    ctx.globalCompositeOperation = "destination-in";
    ctx.drawImage(maskCanvas, 0, 0, width, height);
    ctx.globalCompositeOperation = "source-over";

    return await canvasToPngFile(canvas, file.name.replace(/\.\w+$/, ".png"));
  } finally {
    release(img);
  }
}
