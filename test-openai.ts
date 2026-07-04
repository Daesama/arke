import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function test() {
  console.log("API Key:", process.env.OPENAI_API_KEY ? "Existe" : "No encontrada");

  try {
    console.log("Generando imagen con gpt-image-1...");
    const start = Date.now();

    const response = await openai.images.generate({
      model: "gpt-image-1",
      prompt: "A red dragon, anime style, isolated on transparent background, suitable for t-shirt print",
      n: 1,
      size: "1024x1024",
      quality: "low",
    });

    const elapsed = Date.now() - start;
    const data = response.data?.[0];

    if (data?.b64_json) {
      console.log(`Imagen generada en ${elapsed}ms`);
      console.log("Formato: base64");
      console.log("Tamano:", Math.round(data.b64_json.length / 1024), "KB");
    } else if (data?.url) {
      console.log(`Imagen generada en ${elapsed}ms`);
      console.log("URL:", data.url.slice(0, 80) + "...");
    } else {
      console.log("Sin imagen en la respuesta");
      console.log("Response:", JSON.stringify(response).slice(0, 200));
    }
  } catch (error: unknown) {
    const err = error as { message?: string; status?: number; code?: string };
    console.error("Error:", err.message);
    console.error("Status:", err.status);
    console.error("Code:", err.code);
  }
}

test();
