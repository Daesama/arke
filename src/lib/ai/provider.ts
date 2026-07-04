import type { GenerateOptions, GenerateResult } from "@/types/design";
import { generateWithOpenAI } from "./openai";
import { generateWithGemini } from "./gemini";
import { generateWithFal } from "./fal";

export interface ImageProvider {
  generate(prompt: string, options?: GenerateOptions): Promise<GenerateResult>;
}

type ProviderName = "openai" | "gemini" | "fal";

const ACTIVE_PROVIDER: ProviderName =
  (process.env.NEXT_PUBLIC_AI_PROVIDER as ProviderName) || "openai";

const providers: Record<ProviderName, (prompt: string, options?: GenerateOptions) => Promise<GenerateResult>> = {
  openai: generateWithOpenAI,
  gemini: generateWithGemini,
  fal: generateWithFal,
};

const fallbackOrder: Record<ProviderName, ProviderName[]> = {
  openai: ["gemini", "fal"],
  gemini: ["openai", "fal"],
  fal: ["openai", "gemini"],
};

export async function generateImage(
  prompt: string,
  options?: GenerateOptions,
): Promise<GenerateResult> {
  try {
    return await providers[ACTIVE_PROVIDER](prompt, options);
  } catch (error) {
    console.warn(`${ACTIVE_PROVIDER} failed:`, error);

    for (const fallback of fallbackOrder[ACTIVE_PROVIDER]) {
      try {
        console.log(`Trying fallback: ${fallback}`);
        return await providers[fallback](prompt, options);
      } catch (fbError) {
        console.warn(`${fallback} fallback also failed:`, fbError);
      }
    }

    throw error;
  }
}
