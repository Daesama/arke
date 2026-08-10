import type { DesignCategory, TshirtColor, TshirtGenero, TshirtMaterial, TshirtSize } from "./database";

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

/**
 * Una camisa ya hecha por ARKE, tal como la consume el catálogo.
 *
 * A diferencia de un diseño de /crear, acá el admin deja armada la prenda
 * completa: color y estampado (arte + posición + escala de cada zona) son
 * FIJOS. El cliente solo elige género, material y talla, que es de donde
 * sale el precio.
 */
export interface CatalogDesign {
  id: string;
  title: string;
  /** Color de la camiseta, en hex — fijado por el admin. */
  colorHex: string;
  /** Slug del color, para guardarlo en el pedido. */
  colorSlug: TshirtColor;
  /** Zonas con su arte, transform incluido. Fijo. */
  zones: DesignZoneConfig;
  /** Primera imagen con arte — snapshot para el pedido. */
  imageUrl: string;
  category: DesignCategory | null;
  isPublic: boolean;
  sortOrder: number;
  createdAt: string;
}

/**
 * Una camisa que ya armó el equipo ARKE (desde /admin/pedido-gratis o
 * desde /crear estando logueado como admin) y que puede reutilizarse como
 * item de catálogo. Trae la prenda entera: color y todas sus zonas con su
 * arte y posición, que es justo lo que un item de catálogo necesita.
 */
export interface ReusableShirt {
  /** Id del diseño ORIGINAL, no del item de catálogo que salga de él. */
  sourceDesignId: string;
  colorSlug: TshirtColor;
  colorHex: string;
  zones: DesignZoneConfig;
  /** Path en el bucket `designs` por zona: es lo que se copia al importar. */
  sourcePaths: Partial<Record<DesignZone, string>>;
  createdAt: string;
  /** Ya existe un item de catálogo copiado de esta camisa. */
  alreadyInCatalog: boolean;
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
