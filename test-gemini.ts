import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY });

const MODELS_TO_TEST = [
  "gemini-2.5-flash-image",
  "gemini-2.0-flash",
  "imagen-4.0-generate-001",
];

async function testModel(model: string) {
  console.log(`\n--- Testing: ${model} ---`);
  try {
    const response = await ai.models.generateContent({
      model,
      contents: "Generate an image of a red dragon, anime style, transparent background",
      config: {
        responseModalities: ["TEXT", "IMAGE"],
      },
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          console.log("✅ Imagen generada");
          console.log("  Tipo:", part.inlineData.mimeType);
          console.log("  Tamaño:", Math.round(part.inlineData.data.length / 1024), "KB");
        }
        if (part.text) {
          console.log("  Texto:", part.text.slice(0, 100));
        }
      }
    } else {
      console.log("⚠️ Sin partes en response");
    }
  } catch (error: unknown) {
    const err = error as { message?: string; status?: number };
    const msg = err.message || String(error);
    const short = msg.length > 150 ? msg.slice(0, 150) + "..." : msg;
    console.error(`❌ Error (${err.status || "?"}):`, short);
  }
}

async function main() {
  console.log("API Key:", process.env.GOOGLE_AI_API_KEY ? "✅ Existe" : "❌ No encontrada");
  for (const model of MODELS_TO_TEST) {
    await testModel(model);
  }
}

main();
