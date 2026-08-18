-- ============================================
-- CUPÓN PRIMIVALE
--
-- Requiere 007_codigos_descuento.sql aplicado antes.
--
-- Va en MAYÚSCULAS ('PRIMIVALE') porque el CHECK de la tabla lo exige y
-- porque `normalizeCode` (src/lib/discounts.ts) pasa a mayúsculas lo que
-- escriba el cliente: quien reciba el código puede teclear "PrimiVale",
-- "primivale" o "Primi Vale" y va a hacer match igual.
--
-- 12% sobre el SUBTOTAL de las camisetas, sin incluir el envío de $5.000
-- (ver resolveDiscount). Con la lista de precios vigente:
--   hombre / algodón licrado / pecho grande → subtotal $44.900
--   descuenta $5.388 → total $44.512 con envío
--
-- Tope de 3 usos, como FAMILIA: max_uses_per_user = max_uses significa
-- que NO hay límite extra por persona (los 3 pueden ser de la misma
-- cuenta). Para volverlo "una sola vez", bajar max_uses a 1.
--
-- Re-ejecutable: si el código ya existe, actualiza sus valores en vez
-- de fallar. NO reinicia los usos ya consumidos, porque esos se cuentan
-- sobre la tabla orders, no acá.
-- ============================================

BEGIN;

INSERT INTO public.discount_codes
  (code, type, value, max_uses, max_uses_per_user, note)
VALUES
  ('PRIMIVALE', 'percent', 12, 3, 3, 'primi Vale — 12%, 3 usos en total')

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
