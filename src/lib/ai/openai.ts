import OpenAI from "openai";
import type { GenerateOptions, GenerateResult } from "@/types/design";

function buildSafePrompt(original: string): string {
  const styleWords: string[] = [];
  const stylePatterns = [
    /\b(anime|cartoon|realistic|pixel art|watercolor|minimalist|retro|vintage|neon|cyberpunk|steampunk|abstract|geometric|flat design|3d render|oil painting|sketch|comic|pop art|graffiti|tribal|mandala|psychedelic|kawaii|chibi|low poly|vaporwave|gothic|art deco|art nouveau)\b/gi,
  ];
  const colorPatterns = [
    /\b(red|blue|green|yellow|purple|pink|orange|black|white|gold|silver|cyan|magenta|teal|turquoise|navy|pastel|neon|vibrant|monochrome|colorful|rainbow)\b/gi,
  ];
  const subjectPatterns = [
    /\b(cat|dog|wolf|lion|tiger|eagle|dragon|phoenix|owl|bear|fox|deer|horse|whale|dolphin|butterfly|snake|fish|bird|rabbit|panda|elephant|octopus)\b/gi,
    /\b(skull|moon|sun|star|mountain|ocean|forest|flower|rose|tree|cloud|lightning|fire|flame|crystal|diamond|crown|heart|eye|wings|feather|leaf|mushroom|planet|galaxy|space|astronaut|robot|alien|skeleton|compass|anchor|rocket|castle|sword|shield)\b/gi,
    /\b(samurai|ninja|warrior|knight|wizard|witch|angel|demon|mermaid|vampire|pirate|cowboy|viking|explorer|adventurer|hero|villain)\b/gi,
  ];

  for (const pattern of stylePatterns) {
    const matches = original.match(pattern);
    if (matches) styleWords.push(...matches.map((m) => m.toLowerCase()));
  }
  for (const pattern of colorPatterns) {
    const matches = original.match(pattern);
    if (matches) styleWords.push(...matches.map((m) => m.toLowerCase()));
  }
  const subjects: string[] = [];
  for (const pattern of subjectPatterns) {
    const matches = original.match(pattern);
    if (matches) subjects.push(...matches.map((m) => m.toLowerCase()));
  }

  const style = [...new Set(styleWords)].slice(0, 5).join(", ") || "vibrant, detailed";
  const subject = [...new Set(subjects)].slice(0, 3).join(" and ") || "creative abstract design";

  return `Digital art illustration, t-shirt design, ${subject}, ${style} style, isolated design on transparent background, suitable for t-shirt print, high quality, clean edges`;
}

function isModerationError(error: unknown): boolean {
  const err = error as { code?: string; error?: { code?: string }; message?: string };
  return (
    err.code === "moderation_blocked" ||
    err.error?.code === "moderation_blocked" ||
    (typeof err.message === "string" && err.message.includes("safety system"))
  );
}

export async function generateWithOpenAI(
  prompt: string,
  _options?: GenerateOptions,
): Promise<GenerateResult> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  const start = Date.now();

  console.log("[OpenAI] Prompt:", prompt);

  try {
    return await callOpenAI(openai, prompt, start);
  } catch (error) {
    if (isModerationError(error)) {
      const safe = buildSafePrompt(prompt);
      console.log("[OpenAI] Blocked. Retry with safe prompt:", safe);
      return await callOpenAI(openai, safe, start);
    }
    throw error;
  }
}

async function callOpenAI(
  openai: OpenAI,
  prompt: string,
  start: number,
): Promise<GenerateResult> {
  const response = await openai.images.generate({
    model: "gpt-image-1.5",
    prompt,
    n: 1,
    size: "1024x1024",
    quality: "medium",
    moderation: "low",
  });

  const imageData = response.data?.[0];
  if (!imageData) throw new Error("No image returned by OpenAI");

  let imageUrl: string;

  if (imageData.b64_json) {
    imageUrl = `data:image/png;base64,${imageData.b64_json}`;
  } else if (imageData.url) {
    imageUrl = imageData.url;
  } else {
    throw new Error("No image URL or base64 in OpenAI response");
  }

  return {
    imageUrl,
    imagePath: "",
    provider: "openai",
    model: "gpt-image-1.5",
    generationTimeMs: Date.now() - start,
  };
}
