/**
 * Cliente del worker de quitar fondo.
 *
 * Encapsula cuatro cosas que antes no existían y que son la diferencia entre
 * "la página se congeló" y "esto está tardando, lo cancelo":
 *  1. el trabajo pesado ocurre en un worker, nunca en el hilo principal;
 *  2. los pedidos se serializan — dos zonas a la vez competían por el mismo
 *     runtime WASM y solo lograban tardar el doble cada una;
 *  3. hay cancelación y un tope de tiempo, así que la UI no puede quedarse
 *     en "Quitando fondo..." para siempre;
 *  4. la imagen se decodifica una sola vez y de este lado, donde hay
 *     fallbacks — decodificarla de nuevo dentro del worker era de dónde
 *     salía el "The source image could not be decoded".
 */

import { applyAlphaMask, decodeToRgba } from "./imageProcessing";

export interface BgProgress {
  /** "model" = descargando pesos (hay %); "inference" = calculando (sin %). */
  phase: "model" | "inference";
  pct: number;
}

/**
 * Texto de espera. La primera pasada baja ~44MB de pesos y puede ser larga en
 * una red móvil: mostrar el porcentaje real evita que se lea como "se colgó".
 * "Preparando" y no "descargando el modelo" porque al usuario le da igual qué
 * es un modelo — solo quiere saber si tiene que esperar.
 */
export function bgProgressLabel(progress: BgProgress | null): string {
  if (!progress) return "Quitando fondo...";
  if (progress.phase === "model") return `Preparando... ${progress.pct}%`;
  return "Quitando fondo...";
}

export interface RemoveBackgroundOptions {
  onProgress?: (p: BgProgress) => void;
  signal?: AbortSignal;
}

/**
 * Tope duro de una operación. La descarga del modelo son ~44MB: en una red
 * móvil lenta puede tardar más de un minuto legítimamente, así que el tope
 * es generoso. Existe para que un worker trabado termine en un error que el
 * usuario puede reintentar, no en una espera infinita.
 */
const OPERATION_TIMEOUT_MS = 180_000;

export class BgRemovalCancelled extends Error {
  constructor() {
    super("Cancelado");
    this.name = "BgRemovalCancelled";
  }
}

let worker: Worker | null = null;
let nextId = 1;

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker("/remove-bg-worker.js", { type: "module" });
  }
  return worker;
}

/**
 * La inferencia WASM no se puede interrumpir desde afuera: una vez que el
 * worker entró al modelo, ignora cualquier mensaje hasta terminar. Matarlo es
 * la única forma real de que "Cancelar" devuelva el dispositivo al usuario en
 * el acto. El costo es volver a instanciar el pipeline la próxima vez, pero
 * los pesos ya quedaron en la Cache API del navegador, así que no se
 * re-descargan.
 */
function killWorker() {
  worker?.terminate();
  worker = null;
}

/** Cola serial: el WASM es de un solo hilo, paralelizar solo lo hace más lento. */
let queue: Promise<unknown> = Promise.resolve();

export function removeBackground(
  file: File,
  options: RemoveBackgroundOptions = {},
): Promise<File> {
  const run = () => runRemoveBackground(file, options);
  // El .catch() mantiene viva la cadena: sin él, un pedido fallido dejaba la
  // cola rechazada y todos los siguientes se caían sin siquiera intentarlo.
  const result = queue.then(run, run);
  queue = result.catch(() => undefined);
  return result;
}

async function runRemoveBackground(
  file: File,
  { onProgress, signal }: RemoveBackgroundOptions,
): Promise<File> {
  if (signal?.aborted) throw new BgRemovalCancelled();

  // La decodificación va acá y no en el worker a propósito: es el hilo que
  // tiene fallbacks de decode y el que ya leyó esta misma imagen para el
  // preview. Ver `decodeToRgba`.
  const decoded = await decodeToRgba(file);
  if (signal?.aborted) throw new BgRemovalCancelled();

  const id = nextId++;

  return new Promise<File>((resolve, reject) => {
    const w = getWorker();
    let settled = false;

    const cleanup = () => {
      w.removeEventListener("message", onMessage);
      w.removeEventListener("error", onError);
      signal?.removeEventListener("abort", onAbort);
      clearTimeout(timer);
    };

    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      cleanup();
      fn();
    };

    const timer = setTimeout(() => {
      finish(() => {
        killWorker();
        reject(new Error("Tardó demasiado. Probá de nuevo con una imagen más pequeña."));
      });
    }, OPERATION_TIMEOUT_MS);

    const onAbort = () => {
      finish(() => {
        killWorker();
        reject(new BgRemovalCancelled());
      });
    };

    const onError = (e: ErrorEvent) => {
      finish(() => {
        killWorker();
        reject(new Error(e.message || "No se pudo cargar el procesador de imágenes"));
      });
    };

    async function onMessage(e: MessageEvent) {
      const msg = e.data;
      if (!msg || msg.id !== id) return;

      if (msg.type === "progress") {
        onProgress?.({ phase: msg.phase, pct: msg.pct });
        return;
      }

      if (msg.type === "error") {
        finish(() => reject(new Error(msg.message)));
        return;
      }

      if (msg.type === "mask") {
        // Ojo: la composición ocurre acá, en el hilo principal, pero es
        // trabajo de canvas (milisegundos), no de modelo.
        try {
          const out = await applyAlphaMask(
            file,
            new Uint8Array(msg.mask),
            msg.width,
            msg.height,
          );
          finish(() => resolve(out));
        } catch (err) {
          finish(() =>
            reject(err instanceof Error ? err : new Error("No se pudo aplicar el recorte")),
          );
        }
      }
    }

    w.addEventListener("message", onMessage);
    w.addEventListener("error", onError);
    signal?.addEventListener("abort", onAbort);

    // El buffer se transfiere, no se copia: son varios MB y quedarse con una
    // segunda copia de este lado no sirve para nada.
    w.postMessage(
      {
        type: "remove-bg",
        id,
        rgba: decoded.data.buffer,
        width: decoded.width,
        height: decoded.height,
      },
      [decoded.data.buffer],
    );
  });
}
