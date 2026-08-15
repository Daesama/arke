import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/utils/rateLimit";
import {
  MAX_UPLOAD_BYTES,
  segmentToMaskPng,
} from "@/lib/segmentation/rmbg.server";

/**
 * Quitar fondo del lado servidor.
 *
 * Recibe una imagen y devuelve SOLO la máscara de opacidad como PNG (el alfa
 * lleva la máscara). La composición a resolución completa la hace el
 * navegador con el archivo original, así que por acá nunca pasa la foto
 * grande del usuario ni se guarda nada.
 *
 * Es el camino alternativo del worker del navegador, no su reemplazo: se usa
 * cuando el dispositivo no puede con la inferencia local.
 */

// El modelo vive en memoria del proceso entre pedidos; con runtime edge no
// habría onnxruntime-node ni sharp.
export const runtime = "nodejs";
// Nada que cachear: cada imagen es distinta.
export const dynamic = "force-dynamic";

/**
 * Diagnóstico. Dice en qué escalón se rompe la segmentación del servidor sin
 * tener que entrar a leer los logs del VPS.
 *
 * Las tres respuestas posibles se leen así:
 *  - `sharp` u `onnxruntime` en false → el VPS instaló las dependencias sin
 *    correr sus scripts de instalación, así que los binarios nativos no
 *    están. Se arregla en el despliegue, no en el código.
 *  - ambas en true y `model` con error → el servidor no pudo bajar los pesos
 *    (sin salida a huggingface.co, o disco lleno / no escribible).
 *  - todo en true → la ruta está sana.
 *
 * No expone nada sensible: son capacidades del proceso, no configuración.
 */
export async function GET() {
  const estado: Record<string, unknown> = {};

  for (const dep of ["sharp", "onnxruntime-node"] as const) {
    try {
      await import(/* webpackIgnore: true */ dep);
      estado[dep] = true;
    } catch (err) {
      estado[dep] = false;
      estado[`${dep}_error`] = err instanceof Error ? err.message.slice(0, 200) : "desconocido";
    }
  }

  try {
    // 1x1 transparente: ejercita el camino completo (decodificar, modelo,
    // codificar la máscara) con el trabajo más chico posible.
    const pixel = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
      "base64",
    );
    const t0 = Date.now();
    await segmentToMaskPng(new Uint8Array(pixel));
    estado.model = true;
    estado.model_ms = Date.now() - t0;
  } catch (err) {
    estado.model = false;
    estado.model_error = err instanceof Error ? err.message.slice(0, 200) : "desconocido";
  }

  const sano = estado["sharp"] === true && estado["onnxruntime-node"] === true && estado.model === true;
  return NextResponse.json({ sano, ...estado }, { status: sano ? 200 : 503 });
}

export async function POST(req: Request) {
  // La inferencia es cara y serializada: sin tope, un solo cliente puede
  // llenar la cola y dejar a todos los demás esperando.
  const limited = await checkRateLimit(req, "remove-bg", 12, 60);
  if (limited) return limited;

  let bytes: Uint8Array;
  try {
    const buffer = await req.arrayBuffer();
    if (buffer.byteLength === 0) {
      return NextResponse.json({ error: "No se recibió ninguna imagen." }, { status: 400 });
    }
    if (buffer.byteLength > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: "La imagen es demasiado grande." },
        { status: 413 },
      );
    }
    bytes = new Uint8Array(buffer);
  } catch {
    return NextResponse.json({ error: "No se pudo leer la imagen." }, { status: 400 });
  }

  try {
    const { png, width, height } = await segmentToMaskPng(bytes);

    return new NextResponse(new Uint8Array(png), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Length": String(png.byteLength),
        "X-Mask-Width": String(width),
        "X-Mask-Height": String(height),
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    // El detalle va al log del servidor, no al navegador: el mensaje de ORT
    // no le dice nada al usuario y expone internals.
    console.error("[api/remove-bg] Falló la segmentación:", err);
    return NextResponse.json(
      { error: "No se pudo procesar la imagen." },
      { status: 500 },
    );
  }
}
