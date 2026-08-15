/**
 * Cliente de quitar fondo.
 *
 * Hay DOS formas de obtener el recorte y este módulo elige y encadena:
 *
 *  - **worker**: el modelo corre en el navegador, gratis y sin subir nada,
 *    pero baja ~44MB la primera vez y depende de que el dispositivo aguante.
 *  - **servidor**: `/api/remove-bg` devuelve la máscara. Siempre funciona,
 *    sin descarga, a costa de subir la imagen (capada, ~150KB) y de CPU del
 *    VPS.
 *
 * La regla es simple y está en `prefersServer()`: en un teléfono se va
 * primero al servidor, en un escritorio primero al worker, y **si el
 * elegido falla se intenta el otro**. Esa cadena es lo que hace que el
 * usuario obtenga su recorte sin importar por qué falló el primero — un
 * navegador sin memoria, un runtime WASM que no arranca o un CDN bloqueado
 * dan errores distintos e irreconciliables, y ninguno se puede prever.
 *
 * Lo demás que encapsula:
 *  1. el trabajo pesado nunca ocurre en el hilo principal;
 *  2. los pedidos se serializan — dos zonas a la vez competían por el mismo
 *     runtime WASM y solo lograban tardar el doble cada una;
 *  3. hay cancelación y un tope de tiempo, así que la UI no puede quedarse
 *     en "Quitando fondo..." para siempre;
 *  4. la imagen se decodifica una sola vez y de este lado, donde hay
 *     fallbacks — decodificarla de nuevo dentro del worker era de dónde
 *     salía el "The source image could not be decoded".
 */

import {
  applyAlphaMask,
  applyAlphaMaskFromBlob,
  decodeToRgba,
  encodeCappedJpeg,
} from "./imageProcessing";

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

/**
 * ¿Empezamos por el servidor?
 *
 * En un teléfono sí. No es solo por la memoria: aunque la inferencia local
 * ahora entre, hacerle bajar ~44MB con datos móviles para después esperar
 * una inferencia en WASM de un solo hilo es una espera larguísima frente a
 * subir ~150KB y recibir la máscara. En un escritorio la cuenta se da
 * vuelta, y además ahorra CPU del servidor.
 *
 * `deviceMemory` solo lo reporta Chrome; cuando no está, decide el tipo de
 * puntero, que alcanza para distinguir un teléfono de un monitor.
 */
function prefersServer(): boolean {
  if (typeof navigator === "undefined") return true;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  if (typeof memory === "number" && memory <= 4) return true;
  return window.matchMedia?.("(pointer: coarse)").matches ?? false;
}

export function removeBackground(
  file: File,
  options: RemoveBackgroundOptions = {},
): Promise<File> {
  const run = () => runWithFallback(file, options);
  // El .catch() mantiene viva la cadena: sin él, un pedido fallido dejaba la
  // cola rechazada y todos los siguientes se caían sin siquiera intentarlo.
  const result = queue.then(run, run);
  queue = result.catch(() => undefined);
  return result;
}

/**
 * Intenta el camino preferido y, si falla, el otro.
 *
 * Cancelar nunca cae al respaldo: es una decisión del usuario, no una falla.
 */
async function runWithFallback(
  file: File,
  options: RemoveBackgroundOptions,
): Promise<File> {
  const serverFirst = prefersServer();
  const primary = serverFirst ? runOnServer : runInWorker;
  const secondary = serverFirst ? runInWorker : runOnServer;

  try {
    return await primary(file, options);
  } catch (err) {
    if (err instanceof BgRemovalCancelled || options.signal?.aborted) throw err;

    console.warn(
      `[remove-bg] Falló el camino ${serverFirst ? "servidor" : "worker"}, probando el otro:`,
      err,
    );
    return await secondary(file, options);
  }
}

/** Camino servidor: sube la imagen capada y recibe la máscara como PNG. */
async function runOnServer(
  file: File,
  { onProgress, signal }: RemoveBackgroundOptions,
): Promise<File> {
  if (signal?.aborted) throw new BgRemovalCancelled();

  // No hay descarga de modelo que reportar, pero la UI espera una señal para
  // salir de "Preparando...": se marca inferencia directamente.
  onProgress?.({ phase: "inference", pct: 0 });

  const payload = await encodeCappedJpeg(file);
  if (signal?.aborted) throw new BgRemovalCancelled();

  let res: Response;
  try {
    res = await fetch("/api/remove-bg", {
      method: "POST",
      headers: { "Content-Type": "image/jpeg" },
      body: payload,
      signal,
    });
  } catch (err) {
    if (signal?.aborted) throw new BgRemovalCancelled();
    throw err instanceof Error ? err : new Error("No se pudo contactar el servidor");
  }

  if (!res.ok) {
    const detail = await res
      .json()
      .then((body: { error?: string }) => body?.error)
      .catch(() => null);
    throw new Error(detail ?? `El servidor respondió ${res.status}`);
  }

  const maskPng = await res.blob();
  if (signal?.aborted) throw new BgRemovalCancelled();

  return applyAlphaMaskFromBlob(file, maskPng);
}

/** Camino worker: el modelo corre en el navegador del usuario. */
async function runInWorker(
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
