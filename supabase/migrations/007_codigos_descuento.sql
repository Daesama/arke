-- ============================================
-- CÓDIGOS DE DESCUENTO
--
-- Caso de uso: darle un código a familia y amigos. Pocos códigos,
-- uno por persona, con tope de usos para que no se vuelva público si
-- alguien lo reenvía.
--
-- NO hay tabla de canjes: el pedido guarda qué código usó
-- (orders.discount_code), así que los usos se cuentan preguntándole a
-- orders. Menos piezas que mantener sincronizadas, y el webhook de
-- Wompi no necesita ningún cambio.
--
-- Migración 100% ADITIVA: crea una tabla nueva y agrega una columna
-- vacía a orders. No borra ni modifica ningún objeto existente.
-- Re-ejecutable sin usar DROP.
-- ============================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.discount_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Siempre en MAYÚSCULAS (lo garantiza el CHECK de abajo). El código
  -- que escribe el cliente se normaliza antes de comparar.
  code TEXT NOT NULL UNIQUE,

  -- 'percent'       → value = 15  significa 15% sobre el subtotal
  -- 'fixed'         → value = 5000 significa $5.000 off
  -- 'free_shipping' → value se ignora, descuenta el envío completo
  type TEXT NOT NULL DEFAULT 'percent',
  value INTEGER NOT NULL DEFAULT 0,

  -- Compra mínima para que aplique (0 = sin mínimo).
  min_subtotal INTEGER NOT NULL DEFAULT 0,

  -- NULL = ilimitado. Para códigos de familia conviene un número bajo.
  max_uses INTEGER,
  max_uses_per_user INTEGER DEFAULT 1,

  -- NULL en ambos = vigente desde siempre y para siempre.
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,

  -- El interruptor de emergencia si un código se filtra.
  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  -- Para acordarte a quién se lo diste ("mamá", "primo Andrés").
  note TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CHECKs en bloque condicional (mismo patrón que 004) para que el
-- archivo se pueda volver a correr sin DROP.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'discount_codes_type_check'
  ) THEN
    ALTER TABLE public.discount_codes
      ADD CONSTRAINT discount_codes_type_check
      CHECK (type IN ('percent', 'fixed', 'free_shipping'));
  END IF;

  -- Guarda contra insertar 'mama' en minúscula desde el dashboard y
  -- que después el código nunca haga match.
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'discount_codes_code_upper_check'
  ) THEN
    ALTER TABLE public.discount_codes
      ADD CONSTRAINT discount_codes_code_upper_check
      CHECK (code = UPPER(code) AND code <> '');
  END IF;
END $$;

-- Qué código usó cada pedido. Es la única fuente para contar usos.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS discount_code TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_discount_code
  ON public.orders (discount_code)
  WHERE discount_code IS NOT NULL;

-- ============================================
-- RLS: nadie lee esta tabla con la llave pública.
--
-- La validación del código corre en el servidor con service role, que
-- salta RLS. Sin política para anon/authenticated, un curioso con la
-- llave anónima no puede listar los códigos existentes — que es
-- justamente lo que no queremos que pase con códigos de familia.
-- ============================================
ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'discount_codes'
      AND policyname = 'Admin manages discount codes'
  ) THEN
    CREATE POLICY "Admin manages discount codes"
      ON public.discount_codes
      FOR ALL
      USING (public.is_admin());
  END IF;
END $$;

COMMIT;

-- ============================================
-- CÓMO CREAR UN CÓDIGO (correr en el SQL Editor de Supabase)
--
-- 20% para mamá, un solo uso:
--   INSERT INTO public.discount_codes (code, type, value, max_uses, note)
--   VALUES ('MAMA', 'percent', 20, 1, 'mamá');
--
-- $8.000 off para un amigo, hasta 3 usos, vence en un mes:
--   INSERT INTO public.discount_codes (code, type, value, max_uses, expires_at, note)
--   VALUES ('ANDRES', 'fixed', 8000, 3, NOW() + INTERVAL '30 days', 'primo Andrés');
--
-- Envío gratis para la familia, un uso por persona, sin tope global:
--   INSERT INTO public.discount_codes (code, type, max_uses_per_user, note)
--   VALUES ('FAMILIA', 'free_shipping', 1, 'grupo familiar');
--
-- Apagar un código que se filtró:
--   UPDATE public.discount_codes SET is_active = FALSE WHERE code = 'MAMA';
--
-- Ver quién usó qué:
--   SELECT o.discount_code, o.order_number, o.shipping_name,
--          o.discount, o.total, o.payment_status, o.created_at
--   FROM public.orders o
--   WHERE o.discount_code IS NOT NULL
--   ORDER BY o.created_at DESC;
-- ============================================
