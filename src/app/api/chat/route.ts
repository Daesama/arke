import Anthropic from "@anthropic-ai/sdk";
import { CHAT_SYSTEM_PROMPT } from "@/lib/ai/prompts";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

interface IncomingMessage {
  role: "user" | "assistant";
  content: string;
  imageBase64?: string;
}

export async function POST(req: Request) {
  try {
    const { messages, imageBase64 } = (await req.json()) as {
      messages: IncomingMessage[];
      imageBase64?: string;
    };

    const formatted: Anthropic.MessageParam[] = messages.map((msg) => {
      if (msg.role === "user" && msg.imageBase64) {
        const match = msg.imageBase64.match(/^data:(image\/\w+);base64,(.+)$/);
        const mediaType = (match?.[1] ?? "image/jpeg") as
          | "image/jpeg"
          | "image/png"
          | "image/gif"
          | "image/webp";
        const data = match?.[2] ?? msg.imageBase64;

        return {
          role: "user" as const,
          content: [
            { type: "image" as const, source: { type: "base64" as const, media_type: mediaType, data } },
            { type: "text" as const, text: msg.content || "Usá esta imagen como referencia para el diseño." },
          ],
        };
      }

      return { role: msg.role, content: msg.content };
    });

    if (imageBase64 && messages.length > 0) {
      const lastMsg = formatted[formatted.length - 1];
      if (lastMsg.role === "user" && typeof lastMsg.content === "string") {
        const match = imageBase64.match(/^data:(image\/\w+);base64,(.+)$/);
        const mediaType = (match?.[1] ?? "image/jpeg") as
          | "image/jpeg"
          | "image/png"
          | "image/gif"
          | "image/webp";
        const data = match?.[2] ?? imageBase64;

        formatted[formatted.length - 1] = {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data } },
            { type: "text", text: lastMsg.content || "Usá esta imagen como referencia para el diseño." },
          ],
        };
      }
    }

    const stream = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: CHAT_SYSTEM_PROMPT,
      messages: formatted,
      stream: true,
    });

    const readable = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
        } catch (err) {
          console.error("Stream error:", err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ error: "Error en el chat. Intentá de nuevo." }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
