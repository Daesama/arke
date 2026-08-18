-- ============================================
-- AJUSTE DE CUPONES (2026-08-17)
--
-- Requiere 007/008/009 aplicados antes. Solo cambia valores de filas ya
-- existentes: no crea ni borra objetos.
--
--   FAMILIA      → sin cambios (10%, 3 canjes). Se deja acá para que la
--                  foto de los tres códigos quede en un solo archivo.
--   INAUGURACION → de 20% / 1 canje  a  15% / 5 canjes, uno por persona.
--   PRIMIVALE    → de 3 canjes a 1.
--
-- Sobre "uno por persona": max_uses_per_user = 1 con max_uses = 5
-- significa 5 canjes repartidos entre 5 cuentas distintas. Si se quiere
-- que una sola persona pueda gastar los 5, subir max_uses_per_user a 5
-- (que es como está FAMILIA, con 3 y 3).
--
-- Los usos ya consumidos NO se reinician: se cuentan sobre orders
-- (payment_status = 'approved'), no en esta tabla.
-- ============================================

BEGIN;

UPDATE public.discount_codes
   SET value             = 15,
       max_uses          = 5,
       max_uses_per_user = 1,
       note              = 'inauguracion — 15%, 5 usos, uno por persona'
 WHERE code = 'INAUGURACION';

UPDATE public.discount_codes
   SET max_uses          = 1,
       max_uses_per_user = 1,
       note              = 'primi Vale — 12%, un solo uso'
 WHERE code = 'PRIMIVALE';

COMMIT;

-- Verificación:
--   SELECT code, type, value, max_uses, max_uses_per_user, is_active
--   FROM public.discount_codes ORDER BY code;
