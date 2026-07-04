export const SITE_NAME = "ARKE";
export const SITE_TAGLINE = "Del Prompt al Estampado";
export const SITE_DESCRIPTION =
  "Camisetas personalizadas con IA. Describí tu diseño, la IA lo crea, tú lo vistes.";

export const NAV_LINKS = [
  { label: "Inicio", href: "/" },
  { label: "Crear", href: "/crear" },
  { label: "Catálogo", href: "/catalogo" },
] as const;

export const TSHIRT_COLORS = [
  { name: "Negro", value: "#1a1a1a", slug: "negro" },
  { name: "Blanco", value: "#f5f5f5", slug: "blanco" },
  { name: "Gris", value: "#6B7280", slug: "gris" },
  { name: "Navy", value: "#1E3A5F", slug: "navy" },
  { name: "Rojo", value: "#DC2626", slug: "rojo" },
  { name: "Borgoña", value: "#7F1D1D", slug: "borgona" },
  { name: "Verde", value: "#16A34A", slug: "verde" },
  { name: "Oliva", value: "#4D7C0F", slug: "oliva" },
  { name: "Azul", value: "#2563EB", slug: "azul" },
  { name: "Celeste", value: "#38BDF8", slug: "celeste" },
  { name: "Morado", value: "#7C3AED", slug: "morado" },
  { name: "Rosa", value: "#EC4899", slug: "rosa" },
  { name: "Naranja", value: "#EA580C", slug: "naranja" },
  { name: "Amarillo", value: "#EAB308", slug: "amarillo" },
  { name: "Beige", value: "#D4C5A9", slug: "beige" },
  { name: "Arena", value: "#C2B280", slug: "arena" },
] as const;

export const TSHIRT_SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;

export const PRINT_POSITIONS = [
  { label: "Pecho", value: "pecho" },
  { label: "Espalda completa", value: "espalda" },
  { label: "Pecho pequeño", value: "pecho-pequeño" },
] as const;

export const DESIGN_CATEGORIES = [
  { label: "Gaming", value: "gaming" },
  { label: "Anime", value: "anime" },
  { label: "Abstracto", value: "abstracto" },
  { label: "Pop Culture", value: "pop" },
] as const;

export const ORDER_STATUSES = {
  pending: { label: "Pendiente", color: "text-yellow-400" },
  paid: { label: "Pagado", color: "text-cyan" },
  in_production: { label: "En producción", color: "text-violet" },
  shipped: { label: "Enviado", color: "text-blue-400" },
  delivered: { label: "Entregado", color: "text-green-400" },
  cancelled: { label: "Cancelado", color: "text-red-400" },
  refunded: { label: "Reembolsado", color: "text-text-muted" },
} as const;
