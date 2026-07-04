import type { TshirtColor } from "./database";

export type DesignZone = "pechoBolsillo" | "abdominalGrande" | "espaldaGrande";

export interface DesignZoneEntry {
  imageUrl: string;
  enabled: boolean;
}

export interface DesignZoneConfig {
  pechoBolsillo?: DesignZoneEntry;
  abdominalGrande?: DesignZoneEntry;
  espaldaGrande?: DesignZoneEntry;
}

export interface DesignConfig {
  color: TshirtColor;
  zones: DesignZoneConfig;
}

export interface GenerateResult {
  imageUrl: string;
  imagePath: string;
  provider: "gemini" | "fal" | "openai";
  model: string;
  generationTimeMs: number;
}

export interface GenerateOptions {
  width?: number;
  height?: number;
  style?: string;
}
