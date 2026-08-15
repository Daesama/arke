/**
 * Worker de "quitar fondo" — corre RMBG-1.4 fuera del hilo principal.
 *
 * POR QUÉ ESTE ARCHIVO VIVE EN /public Y NO EN /src:
 * es un module worker cargado por URL (`new Worker("/remove-bg-worker.js",
 * { type: "module" })`), así que webpack no lo toca. El paquete
 * @huggingface/transformers trae WASM + import.meta y bundlearlo dentro de
 * Next daba problemas; cargándolo así el `import()` del CDN es un import
 * nativo del navegador y no hay bundler de por medio. Si algún día esto se
 * mueve a /src, hay que resolver el bundling de WASM primero.
 *
 * QUÉ NO HACE:
 *
 * 1. No decodifica imágenes. Recibe píxeles RGBA ya decodificados por el
 *    hilo principal. `RawImage.fromBlob` resuelve el blob con un solo
 *    camino (`createImageBitmap` + `OffscreenCanvas`) y sin respaldo: si
 *    falla —típicamente por memoria, con una foto de celular de 12MP dentro
 *    de un worker— el navegador tira "The source image could not be
 *    decoded" y no hay nada que reintentar desde acá. El hilo principal
 *    tiene cadena de fallbacks y ya decodificó esa misma imagen para
 *    pintar el preview, así que es el lugar correcto para hacerlo.
 *
 * 2. No compone la imagen final. Devuelve solo la máscara de opacidad y el
 *    hilo principal la aplica con composición de canvas. Componer acá
 *    obligaría a mandar de vuelta un PNG completo; la máscara es 1 byte por
 *    píxel y viaja como buffer transferible, sin copia.
 *
 * Protocolo:
 *   main → worker  { type: "remove-bg", id, rgba: ArrayBuffer, width, height }
 *   worker → main  { type: "progress", id, phase: "model"|"inference", pct }
 *                  { type: "mask", id, mask: ArrayBuffer, width, height }
 *                  { type: "error", id, message }
 */

const MODEL_ID = "briaai/RMBG-1.4";

let libPromise = null;
let segmenterPromise = null;

function loadLib() {
  if (!libPromise) {
    libPromise = import("https://cdn.jsdelivr.net/npm/@huggingface/transformers@3");
  }
  return libPromise;
}

/**
 * El pipeline se cachea entre llamadas: el usuario suele quitarle el fondo a
 * las 3 zonas de la camiseta, y recargar 44MB de pesos cada vez era gran
 * parte del tiempo de espera. Los pesos además quedan en la Cache API del
 * navegador, así que la segunda visita al editor ni siquiera los baja.
 */
function getSegmenter(onModelProgress) {
  if (!segmenterPromise) {
    segmenterPromise = (async () => {
      const { pipeline, env } = await loadLib();

      env.allowLocalModels = false;
      // Sin cabeceras COOP/COEP la página no es cross-origin isolated, así que
      // ORT no puede usar SharedArrayBuffer y corre en un solo hilo igual.
      // Fijarlo evita que intente levantar workers que no puede levantar.
      env.backends.onnx.wasm.numThreads = 1;
      // Ya estamos dentro de un worker: el proxy interno de ORT sería un
      // worker dentro de otro worker, sin ganancia.
      env.backends.onnx.wasm.proxy = false;

      return pipeline("image-segmentation", MODEL_ID, {
        // q8 (~44MB) y no fp32 (~176MB) a propósito: esto se descarga con
        // datos móviles. La diferencia de calidad en un recorte para
        // estampado no justifica cuadruplicar la descarga.
        dtype: "q8",
        device: "wasm",
        progress_callback: onModelProgress,
        // Lo que hace viable esto en un celular. Medido en el mismo modelo:
        // con el arena de memoria por defecto una inferencia pide ~776MB de
        // pico; sin él, ~69MB. Once veces menos, a cambio de ~35% más de
        // tiempo. En un desktop la diferencia no se nota; en un teléfono es
        // la diferencia entre andar y que el navegador mate la pestaña.
        session_options: {
          enableCpuMemArena: false,
          enableMemPattern: false,
          executionMode: "sequential",
        },
      });
    })().catch((err) => {
      // Un fallo de carga no puede dejar la promesa cacheada en estado
      // rechazado para siempre: sin esto, "Reintentar" fallaba instantáneo
      // con el error viejo y no volvía a intentar la descarga.
      segmenterPromise = null;
      throw err;
    });
  }
  return segmenterPromise;
}

self.addEventListener("message", async (e) => {
  const { type, id, rgba, width, height } = e.data || {};
  if (type !== "remove-bg") return;

  try {
    // Progreso de descarga por archivo. transformers.js emite un evento por
    // cada archivo del modelo; nos quedamos con el máximo visto de cada uno
    // para que la barra no salte hacia atrás entre archivos.
    const seen = new Map();
    let lastSent = -1;

    const onModelProgress = (p) => {
      if (p?.status !== "progress" || !p.total) return;
      seen.set(p.file, Math.min(1, (p.loaded || 0) / p.total));
      let sum = 0;
      for (const v of seen.values()) sum += v;
      const pct = Math.round((sum / seen.size) * 100);
      // Un postMessage por cada chunk satura el canal; solo avisamos cuando
      // el número que va a ver el usuario realmente cambió.
      if (pct !== lastSent) {
        lastSent = pct;
        self.postMessage({ type: "progress", id, phase: "model", pct });
      }
    };

    const segmenter = await getSegmenter(onModelProgress);
    self.postMessage({ type: "progress", id, phase: "inference", pct: 0 });

    // NO se toca el tamaño del processor. El export ONNX de RMBG-1.4 tiene
    // el input fijo en 1024×1024 y ORT aborta con "Got invalid dimensions
    // for input" ante cualquier otro valor, así que la inferencia cuesta lo
    // mismo pase lo que pase. Lo que sí se controla es el tamaño de lo que
    // entra: el hilo principal capa la imagen antes de mandarla, y de ahí
    // sale una máscara chica en vez de una del tamaño de la foto original.
    const { RawImage } = await loadLib();
    // 4 canales porque es lo que devuelve getImageData; es exactamente el
    // mismo RawImage que construiría fromBlob, sin el decode de por medio.
    const image = new RawImage(new Uint8ClampedArray(rgba), width, height, 4);
    const output = await segmenter(image, { threshold: 0 });

    const mask = output?.[0]?.mask;
    if (!mask) throw new Error("El modelo no devolvió una máscara");

    // La máscara es 1 byte por píxel. Se transfiere (no se copia) y el hilo
    // principal la escala al tamaño real de la imagen con drawImage.
    const buffer = mask.data.buffer;
    self.postMessage(
      { type: "mask", id, mask: buffer, width: mask.width, height: mask.height },
      [buffer],
    );
  } catch (err) {
    self.postMessage({
      type: "error",
      id,
      message: err instanceof Error ? err.message : "Error desconocido",
    });
  }
});
