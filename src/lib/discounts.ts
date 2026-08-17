import { createAdminClient } from "@/lib/supabase/admin";
import { ENVIO, formatCOP } from "@/lib/utils/pricing";

/**
 * Wompi rechaza transacciones por debajo de ~$1.500 COP, así que el
 * descuento nunca puede dejar el total en cero. Para regalar una
 * camiseta completa está /admin/pedido-gratis, que crea el pedido sin
 * pasar por la pasarela.
 */
export const MIN_TOTAL_WOMPI = 1500;

export type DiscountType = "percent" | "fixed" | "free_shipping";

interface DiscountCodeRow {
  id: string;
  code: string;
  type: DiscountType;
  value: number;
  min_subtotal: number;
  max_uses: number | null;
  max_uses_per_user: number | null;
  starts_at: string | null;
  expires_at: string | null;
  is_active: boolean;
}

export interface AppliedDiscount {
  /** Código ya normalizado, tal cual se guarda en orders.discount_code. */
  code: string;
  /** Pesos a descontar. Ya viene topado, se puede restar directo. */
  amount: number;
  /** Texto corto para mostrar en el resumen ("-20%", "Envío gratis"). */
  label: string;
}

export interface DiscountResult {
  discount?: AppliedDiscount;
  error?: string;
}

/** "  mama 20 " → "MAMA20". Lo que el cliente escribe nunca hace match solo. */
export function normalizeCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

function calcularMonto(
  row: DiscountCodeRow,
  subtotal: number,
): { amount: number; label: string } {
  switch (row.type) {
    case "percent":
      return {
        amount: Math.round((subtotal * row.value) / 100),
        label: `-${row.value}%`,
      };
    case "fixed":
      return {
        amount: Math.min(row.value, subtotal),
        label: `-${formatCOP(row.value)}`,
      };
    case "free_shipping":
      return { amount: ENVIO, label: "Envío gratis" };
  }
}

/**
 * Única fuente de verdad del descuento. La llama tanto la validación que
 * ve el usuario al escribir el código como createOrder al cobrar — y es
 * la segunda la que manda, porque el monto que se le firma a Wompi sale
 * de ahí. Un código inventado desde el navegador no logra nada: el
 * servidor simplemente cobra el precio completo.
 *
 * Usa service role a propósito: discount_codes no es legible con la
 * llave anónima (ver RLS en 007_codigos_descuento.sql).
 */
export async function resolveDiscount(
  rawCode: string | null | undefined,
  subtotal: number,
  userId: string,
): Promise<DiscountResult> {
  if (!rawCode || !rawCode.trim()) {
    return { error: "Escribe un código." };
  }

  const code = normalizeCode(rawCode);
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("discount_codes")
    .select(
      "id, code, type, value, min_subtotal, max_uses, max_uses_per_user, starts_at, expires_at, is_active",
    )
    .eq("code", code)
    .maybeSingle();

  if (error) {
    console.error("[Descuentos] Error consultando código:", error);
    return { error: "No pudimos validar el código. Intenta de nuevo." };
  }

  // Mismo mensaje para "no existe" y "desactivado": no le confirmamos a
  // nadie que un código existe pero está apagado.
  const row = data as DiscountCodeRow | null;
  if (!row || !row.is_active) {
    return { error: "Ese código no existe o ya no está activo." };
  }

  const now = Date.now();
  if (row.starts_at && new Date(row.starts_at).getTime() > now) {
    return { error: "Ese código todavía no está activo." };
  }
  if (row.expires_at && new Date(row.expires_at).getTime() < now) {
    return { error: "Ese código ya venció." };
  }
  if (subtotal < row.min_subtotal) {
    return {
      error: `Este código aplica en compras desde ${formatCOP(row.min_subtotal)}.`,
    };
  }

  // Los usos se cuentan sobre pedidos PAGADOS. Un carrito abandonado no
  // quema el código, y un pedido pendiente lo deja disponible hasta que
  // el pago se apruebe.
  if (row.max_uses !== null || row.max_uses_per_user !== null) {
    const { data: usos, error: usosError } = await supabase
      .from("orders")
      .select("user_id")
      .eq("discount_code", code)
      .eq("payment_status", "approved");

    if (usosError) {
      console.error("[Descuentos] Error contando usos:", usosError);
      return { error: "No pudimos validar el código. Intenta de nuevo." };
    }

    const filas = usos ?? [];
    if (row.max_uses !== null && filas.length >= row.max_uses) {
      return { error: "Ese código ya llegó a su límite de usos." };
    }
    if (row.max_uses_per_user !== null) {
      const propios = filas.filter((u) => u.user_id === userId).length;
      if (propios >= row.max_uses_per_user) {
        return { error: "Ya usaste ese código." };
      }
    }
  }

  const { amount, label } = calcularMonto(row, subtotal);

  // Tope: el total nunca puede quedar por debajo del mínimo de Wompi.
  const maxDescuento = Math.max(0, subtotal + ENVIO - MIN_TOTAL_WOMPI);
  const final = Math.min(amount, maxDescuento);

  if (final <= 0) {
    return { error: "Ese código no aplica a este pedido." };
  }

  return { discount: { code, amount: final, label } };
}
