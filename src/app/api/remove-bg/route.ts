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
