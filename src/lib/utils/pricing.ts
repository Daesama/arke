import type { DesignZone, DesignZoneConfig } from "@/types/design";
import type { TshirtGenero, TshirtMaterial } from "@/types/database";

/**
 * Precios vigentes desde el 2026-08-17 (+$2.000 sobre la lista anterior,
 * tanto en prenda como en estampado; el envío quedó igual).
 *
 * Los estampados son redondos a propósito: como la prenda termina en 900,
 * el total que ve el cliente conserva ese final (hombre + algodón + pecho
 * grande + envío = $49.900, justo debajo de la barrera de los 50 mil, que
 * es el número que de verdad se mira en el checkout). Si algún día se
 * mueven estos valores, revisar que el pedido típico no cruce esa marca.
 */
const PRECIOS_CAMISETA: Record<TshirtMaterial, Record<TshirtGenero, number>> = {
  piel_de_durazno: { mujer: 23900, hombre: 25900 },
  algodon_licrado: { mujer: 24900, hombre: 25900 },
  seda_fria: { mujer: 28900, hombre: 30900 },
};

const PRECIOS_ESTAMPADO: Record<DesignZone, { label: string; price: number }> = {
  pechoBolsillo: { label: "Estampado pecho bolsillo", price: 12000 },
  abdominalGrande: { label: "Estampado pecho grande", price: 19000 },
  espaldaGrande: { label: "Estampado espalda grande", price: 23000 },
};

export const ENVIO = 5000;

const MATERIAL_LABELS: Record<TshirtMaterial, string> = {
  piel_de_durazno: "Piel de Durazno",
  algodon_licrado: "Algodón Licrado",
  seda_fria: "Seda Fría",
};

const GENERO_LABELS: Record<TshirtGenero, string> = {
  mujer: "Mujer",
  hombre: "Hombre",
};

export interface PriceLineItem {
  label: string;
  price: number;
  type: "camiseta" | "estampado" | "envio";
}

export interface PriceBreakdown {
  items: PriceLineItem[];
  subtotal: number;
  envio: number;
  total: number;
}

export function getPrecioCamiseta(material: TshirtMaterial, genero: TshirtGenero): number {
  return PRECIOS_CAMISETA[material][genero];
}

export function getPrecioEstampados(zones: DesignZone[]): number {
  return zones.reduce((sum, z) => sum + PRECIOS_ESTAMPADO[z].price, 0);
}

export function calcularSubtotal(
  material: TshirtMaterial,
  genero: TshirtGenero,
  zones: DesignZone[],
): number {
  return getPrecioCamiseta(material, genero) + getPrecioEstampados(zones);
}

export function calcularTotal(
  material: TshirtMaterial,
  genero: TshirtGenero,
  zones: DesignZone[],
): number {
  return calcularSubtotal(material, genero, zones) + ENVIO;
}

export function getDesglose(
  material: TshirtMaterial | null,
  genero: TshirtGenero | null,
  zones: DesignZone[],
  incluirEnvio = false,
): PriceBreakdown {
  const items: PriceLineItem[] = [];
  let subtotal = 0;

  if (material && genero) {
    const precio = getPrecioCamiseta(material, genero);
    items.push({
      label: `Camiseta ${MATERIAL_LABELS[material]} (${GENERO_LABELS[genero]})`,
      price: precio,
      type: "camiseta",
    });
    subtotal += precio;
  }

  for (const zone of zones) {
    const { label, price } = PRECIOS_ESTAMPADO[zone];
    items.push({ label, price, type: "estampado" });
    subtotal += price;
  }

  const envio = incluirEnvio ? ENVIO : 0;

  if (incluirEnvio) {
    items.push({ label: "Envío Bogotá", price: ENVIO, type: "envio" });
  }

  return {
    items,
    subtotal,
    envio,
    total: subtotal + envio,
  };
}

export function getActiveZonesFromConfig(config?: DesignZoneConfig): DesignZone[] {
  if (!config) return [];
  const zones: DesignZone[] = [];
  if (config.pechoBolsillo?.enabled) zones.push("pechoBolsillo");
  if (config.abdominalGrande?.enabled) zones.push("abdominalGrande");
  if (config.espaldaGrande?.enabled) zones.push("espaldaGrande");
  return zones;
}

export function formatCOP(amount: number): string {
  return "$" + amount.toLocaleString("es-CO");
}
