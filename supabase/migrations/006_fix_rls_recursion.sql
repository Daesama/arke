-- ============================================
-- FIX: recursión infinita en RLS (42P17)
--
-- Reemplaza a 002_fix_rls_admin_recursion.sql, que nunca llegó a
-- aplicarse a esta base (se verificó: la función is_admin() no existía).
-- Síntoma: CUALQUIER lectura con la llave pública sobre profiles,
-- products, designs, orders u order_items devolvía
-- "infinite recursion detected in policy for relation profiles".
--
-- Causa: las políticas de admin preguntan por profiles...
--   USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() ...))
-- ...y profiles tiene esa MISMA política sobre sí misma → bucle.
--
-- Solución: una función SECURITY DEFINER que consulta profiles como su
-- owner, sin que RLS se vuelva a evaluar dentro.
--
-- OJO — los nombres de abajo NO son los de 001/002: se sacaron de
-- pg_policies contra la base real, porque había drift (a `orders` y
-- `order_items` alguien les renombró la política desde el dashboard, y
-- `feedback` llegó después en 002_feedback.sql). Si vuelves a tocar
-- políticas a mano, revisa este archivo antes de reusarlo.
--
-- SIN DROP: usa ALTER POLICY, que reescribe la condición de cada
-- política en el lugar. No borra ni crea objetos, no toca ninguna fila.
--
-- La función además fija `search_path`, que sin eso es un vector de
-- escalada de privilegios en funciones SECURITY DEFINER.
-- ============================================

BEGIN;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Las 6 políticas que hoy recursan (qual referencia profiles).
ALTER POLICY "Admin reads all profiles" ON public.profiles
  USING (public.is_admin());

ALTER POLICY "Admin manages products" ON public.products
  USING (public.is_admin());

ALTER POLICY "Admin reads all designs" ON public.designs
  USING (public.is_admin());

ALTER POLICY "Admin all orders" ON public.orders
  USING (public.is_admin());

ALTER POLICY "Admin all items" ON public.order_items
  USING (public.is_admin());

ALTER POLICY "Admin reads all feedback" ON public.feedback
  USING (public.is_admin());

COMMIT;
