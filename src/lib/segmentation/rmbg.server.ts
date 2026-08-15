import "server-only";

/**
 * Segmentación de fondo del lado servidor.
 *
 * Existe como red de seguridad del worker del navegador: en un celular la
 * inferencia puede fallar por memoria, porque el runtime WASM no arranca, o
 * porque el CDN del modelo está bloqueado — y cada una de esas fallas se ve
 * distinta y ninguna se puede arreglar desde nuestro código. Acá el resultado
 * no depende del dispositivo del cliente.
 *
 * Contrato deliberadamente igual al del worker: entra una imagen, sale una
 * máscara. La composición a resolución completa la sigue haciendo el
 * navegador, que ya tiene el archivo original — así el servidor nunca toca la
 * foto de 12MP ni la devuelve, y el tráfico se mantiene chico.
 */

import type { RawImage as RawImageType } from "@huggingface/transformers";

/** Cota del lado mayor de lo que se acepta procesar. Ver SEGMENTATION_MAX_DIM. */
export const MAX_INPUT_DIM = 1024;

/** Tope de subida. Una imagen capada a 1024px en JPEG no llega ni cerca. */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

const MODEL_ID = "briaai/RMBG-1.4";

type Segmenter = (
  input: RawImageType,
  options?: Record<string, unknown>,
) => Promise<{ mask: RawImageType }[]>;

let segmenterPromise: Promise<Segmenter> | null = null;

async function getSegmenter(): Promise<Segmenter> {
  if (!segmenterPromise) {
    segmenterPromise = (async () => {
      const { pipeline, env } = await import("@huggingface/transformers");
      env.allowLocalModels = false;

      // Por defecto los pesos se cachean dentro de node_modules, que un
      // redeploy borra: el primer pedido después de cada despliegue vuelve a
      // bajar ~44MB. Apuntando RMBG_CACHE_DIR a una carpeta persistente del
      // VPS eso se paga una sola vez. Es opcional — sin la variable, el
      // comportamiento es el de siempre.
      if (process.env.RMBG_CACHE_DIR) env.cacheDir = process.env.RMBG_CACHE_DIR;

      return (await pipeline("image-segmentation", MODEL_ID, {
        dtype: "q8",
        // Sin esto una sola inferencia pide ~776MB de pico y puede tumbar el
        // proceso de Node en un VPS chico. Con el arena desactivado son
        // ~69MB, a cambio de ~35% más de tiempo (medido: 936ms → 1298ms).
        session_options: {
          enableCpuMemArena: false,
          enableMemPattern: false,
          executionMode: "sequential",
        },
      })) as unknown as Segmenter;
    })().catch((err) => {
      // Un fallo de carga no puede quedar cacheado como rechazo permanente:
      // el siguiente pedido tiene que poder reintentar la descarga.
      segmenterPromise = null;
      throw err;
    });
  }
  return segmenterPromise;
}

/**
 * Cola serial de inferencias.
 *
 * Aun con el arena desactivado, dos inferencias simultáneas duplican el pico
 * y compiten por los mismos núcleos sin terminar antes. Serializar mantiene
 * el uso de memoria acotado y predecible, que es lo que importa en un VPS
 * compartido con el resto de la tienda.
 */
let queue: Promise<unknown> = Promise.resolve();

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const result = queue.then(task, task);
  queue = result.catch(() => undefined);
  return result;
}

export interface MaskResult {
  /** PNG cuyo canal alfa ES la máscara: el navegador lo dibuja y listo. */
  png: Buffer;
  width: number;
  height: number;
}

/**
 * Devuelve la máscara de opacidad de `imageBytes` como PNG.
 *
 * El alfa del PNG lleva la máscara y el RGB va en negro. Se eligió así para
 * que el cliente no tenga que recorrer píxeles: dibuja el PNG en un canvas y
 * el alfa ya está donde tiene que estar.
 */
export async function segmentToMaskPng(imageBytes: Uint8Array): Promise<MaskResult> {
  const { RawImage } = await import("@huggingface/transformers");

  const source = await RawImage.fromBlob(new Blob([imageBytes]));

  // El cliente ya manda la imagen capada, pero el servidor no puede confiar
  // en eso: un pedido armado a mano con una imagen enorme haría trabajar de
  // más a todo el mundo que esté en la cola.
  const largest = Math.max(source.width, source.height);
  const input =
    largest > MAX_INPUT_DIM
      ? await source.resize(
          Math.max(1, Math.round((source.width * MAX_INPUT_DIM) / largest)),
          Math.max(1, Math.round((source.height * MAX_INPUT_DIM) / largest)),
        )
      : source;

  return enqueue(async () => {
    const segmenter = await getSegmenter();
    const output = await segmenter(input, { threshold: 0 });

    const mask = output?.[0]?.mask;
    if (!mask) throw new Error("El modelo no devolvió una máscara");

    const { width, height } = mask;
    const rgba = new Uint8ClampedArray(width * height * 4);
    for (let i = 0; i < width * height; i++) {
      // RGB en negro, alfa = máscara.
      rgba[i * 4 + 3] = mask.data[i];
    }

    // Esto viaja a un celular con datos móviles, y el servidor tiene CPU de
    // sobra comparado con esa red: se paga la compresión máxima.
    const png = await new RawImage(rgba, width, height, 4)
      .toSharp()
      .png({ compressionLevel: 9, effort: 10 })
      .toBuffer();
    return { png, width, height };
  });
}
