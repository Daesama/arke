-- ============================================
-- Esconder los borradores del catálogo
--
-- Una camisa guardada sin marcar "Publicar" (is_public = false) ya no
-- aparece en /catalogo, porque getCatalogDesigns la filtra en la propia
-- consulta. Pero la política de 001 deja LEER por la API de Supabase
-- cualquier fila con is_catalog = true, publicada o no: quien consulte
-- la API directamente, saltándose la web, alcanzaría a ver borradores.
--
-- Esto lo cierra a nivel de base: para verse, ahora hay que estar
-- publicada. El panel de admin no se ve afectado porque lee con service
-- role, que salta RLS.
--
-- SIN DROP: usa ALTER POLICY, que reescribe la condición de la política
-- en el lugar. No borra ni crea objetos, no toca ninguna fila.
--
-- El nombre de la política se deja como está ("Anyone reads catalog
-- designs") a propósito: renombrarla no aporta nada y rompería la
-- posibilidad de volver a correr este archivo.
-- ============================================

BEGIN;

ALTER POLICY "Anyone reads catalog designs" ON public.designs
  USING (is_catalog = true AND is_public = true);

COMMIT;
