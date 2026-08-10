-- ============================================
-- OPCIONAL — endurecer RLS del catálogo
--
-- El catálogo funciona perfectamente sin correr esto: getCatalogDesigns
-- ya filtra is_public = true en la propia consulta, así que /catalogo
-- nunca muestra borradores.
--
-- Lo que arregla: la política de 001 deja leer por API cualquier fila con
-- is_catalog = true, aunque sea borrador (is_public = false). O sea, un
-- diseño sin publicar no sale en la web, pero alguien que consulte la API
-- de Supabase directamente sí podría verlo.
--
-- Correr esto solo si te importa esconder los borradores. Es un DROP +
-- CREATE de política (por eso Supabase avisa "destructive"), pero no toca
-- ninguna fila y el resultado es MÁS restrictivo, nunca más permisivo.
-- ============================================

BEGIN;

DROP POLICY IF EXISTS "Anyone reads catalog designs" ON public.designs;

CREATE POLICY "Anyone reads published catalog designs" ON public.designs
  FOR SELECT USING (is_catalog = true AND is_public = true);

COMMIT;
