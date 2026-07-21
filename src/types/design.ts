import type { TshirtColor, TshirtGenero, TshirtMaterial, TshirtSize } from "./database";

export type DesignZone = "pechoBolsillo" | "abdominalGrande" | "espaldaGrande";

export type BgRemovalStatus = "idle" | "processing" | "done" | "error";

export interface ZoneTransform {
  offsetX: number;
  offsetY: number;
  scale: number;
}

export interface DesignZoneEntry {
  imageUrl: string;
  enabled: boolean;
  transform?: ZoneTransform;
}

export interface DesignZoneConfig {
  pechoBolsillo?: DesignZoneEntry;
  abdominalGrande?: DesignZoneEntry;
  espaldaGrande?: DesignZoneEntry;
}

export interface DesignConfig {
  genero: TshirtGenero;
  material: TshirtMaterial;
  color: TshirtColor;
  talla: TshirtSize;
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
