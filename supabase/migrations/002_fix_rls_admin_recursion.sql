-- ============================================
-- FIX: Recursión infinita en políticas RLS de admin
--
-- Problema: las políticas de admin en todas las tablas hacen
-- EXISTS(SELECT 1 FROM profiles WHERE role='admin'), pero
-- profiles también tiene RLS con la misma subquery → recursión.
--
-- Solución: función SECURITY DEFINER que consulta profiles
-- sin que RLS se aplique dentro de ella (corre como el owner).
-- ============================================

-- 1. Crear función SECURITY DEFINER para verificar admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 2. Eliminar TODAS las políticas de admin que causan recursión

-- profiles
DROP POLICY IF EXISTS "Admin reads all profiles" ON public.profiles;

-- products
DROP POLICY IF EXISTS "Admin manages products" ON public.products;

-- designs
DROP POLICY IF EXISTS "Admin reads all designs" ON public.designs;

-- orders
DROP POLICY IF EXISTS "Admin manages all orders" ON public.orders;

-- order_items
DROP POLICY IF EXISTS "Admin manages all order items" ON public.order_items;

-- 3. Recrear políticas usando public.is_admin()

CREATE POLICY "Admin reads all profiles" ON public.profiles
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admin manages products" ON public.products
  FOR ALL USING (public.is_admin());

CREATE POLICY "Admin reads all designs" ON public.designs
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admin manages all orders" ON public.orders
  FOR ALL USING (public.is_admin());

CREATE POLICY "Admin manages all order items" ON public.order_items
  FOR ALL USING (public.is_admin());
