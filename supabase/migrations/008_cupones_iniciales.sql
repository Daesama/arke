-- ============================================
-- CUPONES INICIALES
--
-- Requiere 007_codigos_descuento.sql aplicado antes.
--
-- Los dos porcentajes se calculan sobre el SUBTOTAL de las camisetas,
-- sin incluir el envío de $5.000 (ver resolveDiscount en
-- src/lib/discounts.ts). Sobre un pedido de $40.000 + envío:
--   FAMILIA (10%)      → descuenta $4.000, total $41.000
--   INAUGURACION (20%) → descuenta $8.000, total $37.000
--
-- Re-ejecutable: si el código ya existe, actualiza sus valores en vez
-- de fallar. NO reinicia los usos ya consumidos, porque esos se cuentan
-- sobre la tabla orders, no acá.
-- ============================================

BEGIN;

INSERT INTO public.discount_codes
  (code, type, value, max_uses, max_uses_per_user, note)
VALUES
  -- 10%, 3 canjes en total. max_uses_per_user = 3 (igual al tope global)
  -- significa que NO hay límite extra por persona: los 3 usos pueden ser
  -- de la misma cuenta o de tres personas distintas. Para volverlo
  -- "una vez cada uno", bajar max_uses_per_user a 1.
  ('FAMILIA', 'percent', 10, 3, 3, 'familia — 10%, 3 usos en total'),

  -- 20%, un solo canje en toda la tienda.
  ('INAUGURACION', 'percent', 20, 1, 1, 'inauguracion — 20%, un solo uso')

ON CONFLICT (code) DO UPDATE SET
  type              = EXCLUDED.type,
  value             = EXCLUDED.value,
  max_uses          = EXCLUDED.max_uses,
  max_uses_per_user = EXCLUDED.max_uses_per_user,
  note              = EXCLUDED.note,
  is_active         = TRUE;

COMMIT;

-- Verificación:
--   SELECT code, type, value, max_uses, max_uses_per_user, is_active
--   FROM public.discount_codes ORDER BY code;
