import type { DesignZone, DesignZoneConfig } from "@/types/design";

export const ZONE_PRICES: Record<DesignZone, { label: string; price: number }> = {
  pechoBolsillo: { label: "Pecho bolsillo", price: 5000 },
  abdominalGrande: { label: "Abdominal grande", price: 10000 },
  espaldaGrande: { label: "Espalda grande", price: 10000 },
};

export const BASE_PRICE = 25000;

export interface PriceLineItem {
  label: string;
  price: number;
}

export function calculatePrice(activeZones: DesignZone[]): number {
  return BASE_PRICE + activeZones.reduce((sum, z) => sum + ZONE_PRICES[z].price, 0);
}

export function getPriceBreakdown(activeZones: DesignZone[]): { items: PriceLineItem[]; total: number } {
  const items: PriceLineItem[] = [{ label: "Camiseta base", price: BASE_PRICE }];
  for (const zone of activeZones) {
    items.push({ label: ZONE_PRICES[zone].label, price: ZONE_PRICES[zone].price });
  }
  return { items, total: calculatePrice(activeZones) };
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
