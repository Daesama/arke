-- ============================================
-- CATÁLOGO: diseños propios de ARKE
--
-- La tabla designs ya tenía is_catalog / category / is_public desde
-- 001, pero le faltaba lo necesario para presentarlos como catálogo:
-- un nombre visible, la zona de estampado para la que fue pensado el
-- arte, y un orden manual para destacar los que queramos.
--
-- Esta migración es 100% ADITIVA: no borra ni modifica ningún objeto
-- existente, no toca ninguna fila. Solo agrega columnas nuevas (vacías),
-- un CHECK sobre una de esas columnas nuevas, y un índice.
--
-- El endurecimiento de la política RLS se movió a 005, que es opcional
-- y se puede correr después.
-- ============================================

BEGIN;

ALTER TABLE public.designs
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS default_zone TEXT,
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

-- Las 3 zonas son las mismas que usa /crear (DesignZone en types/design.ts).
-- Se agrega dentro de un bloque condicional en vez de DROP + ADD para que
-- el archivo siga siendo re-ejecutable sin usar DROP.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'designs_default_zone_check'
      AND conrelid = 'public.designs'::regclass
  ) THEN
    ALTER TABLE public.designs
      ADD CONSTRAINT designs_default_zone_check
      CHECK (
        default_zone IS NULL
        OR default_zone IN ('pechoBolsillo', 'abdominalGrande', 'espaldaGrande')
      );
  END IF;
END $$;

-- Orden del grid del catálogo: destacados primero, luego más recientes.
CREATE INDEX IF NOT EXISTS idx_designs_catalog_order
  ON public.designs (sort_order DESC, created_at DESC)
  WHERE is_catalog = true;

COMMIT;
