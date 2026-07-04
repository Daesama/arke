-- ============================================
-- ARKE — Esquema de Base de Datos
-- Supabase PostgreSQL
-- ============================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PERFILES DE USUARIO
-- ============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  department TEXT,  -- Departamento de Colombia
  postal_code TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger para crear perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- PRODUCTOS (tipos de camiseta)
-- ============================================
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,                    -- "Camiseta clásica algodón"
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  base_price INTEGER NOT NULL,           -- Precio en COP (centavos)
  material TEXT NOT NULL,                -- "Algodón 100%", "Dry-fit", etc.
  available_colors JSONB NOT NULL DEFAULT '["negro", "blanco"]',
  available_sizes JSONB NOT NULL DEFAULT '["S", "M", "L", "XL"]',
  print_positions JSONB NOT NULL DEFAULT '["pecho", "espalda", "pecho-pequeño"]',
  mockup_images JSONB,                   -- URLs de mockups por color
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- DISEÑOS GENERADOS POR IA
-- ============================================
CREATE TABLE public.designs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  prompt TEXT NOT NULL,                   -- Prompt original del usuario
  ai_prompt TEXT,                         -- Prompt optimizado enviado a la IA
  ai_provider TEXT NOT NULL DEFAULT 'gemini', -- 'gemini' | 'fal'
  ai_model TEXT,                          -- Modelo específico usado
  image_url TEXT NOT NULL,                -- URL en Supabase Storage
  image_path TEXT NOT NULL,               -- Path en el bucket
  thumbnail_url TEXT,
  config JSONB DEFAULT '{}',              -- Color camiseta, posición, etc.
  is_catalog BOOLEAN NOT NULL DEFAULT false, -- Si es diseño pre-hecho del catálogo
  category TEXT,                          -- 'gaming', 'anime', 'abstracto', 'pop'
  tags TEXT[],
  is_public BOOLEAN NOT NULL DEFAULT false,
  generation_time_ms INTEGER,             -- Tiempo que tardó la IA
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_designs_user ON public.designs(user_id);
CREATE INDEX idx_designs_catalog ON public.designs(is_catalog) WHERE is_catalog = true;
CREATE INDEX idx_designs_category ON public.designs(category);

-- ============================================
-- SESIONES DE CHAT
-- ============================================
CREATE TABLE public.chat_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'Nuevo diseño',
  messages JSONB NOT NULL DEFAULT '[]',   -- Array de mensajes {role, content, timestamp}
  design_id UUID REFERENCES public.designs(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chat_user ON public.chat_sessions(user_id);

-- ============================================
-- PEDIDOS
-- ============================================
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number SERIAL,                    -- Número legible: ARKE-0001
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,

  -- Estado del pedido
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',        -- Esperando pago
    'paid',           -- Pago confirmado
    'in_production',  -- En estampado
    'shipped',        -- Enviado
    'delivered',      -- Entregado
    'cancelled',      -- Cancelado
    'refunded'        -- Reembolsado
  )),

  -- Datos de envío
  shipping_name TEXT NOT NULL,
  shipping_phone TEXT NOT NULL,
  shipping_address TEXT NOT NULL,
  shipping_city TEXT NOT NULL,
  shipping_department TEXT NOT NULL,
  shipping_postal_code TEXT,
  shipping_notes TEXT,                    -- "Apartamento 301", "Llamar antes"

  -- Pago
  payment_method TEXT NOT NULL CHECK (payment_method IN (
    'wompi_card',     -- Tarjeta crédito/débito
    'wompi_pse',      -- PSE
    'wompi_nequi',    -- Nequi
    'wompi_daviplata',-- Daviplata
    'cash_on_delivery'-- Contraentrega
  )),
  payment_reference TEXT,                 -- ID de transacción Wompi
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN (
    'pending', 'approved', 'declined', 'voided', 'error'
  )),

  -- Montos (en centavos COP)
  subtotal INTEGER NOT NULL,
  shipping_cost INTEGER NOT NULL DEFAULT 0,
  discount INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL,

  -- Timestamps
  paid_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_user ON public.orders(user_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_number ON public.orders(order_number);

-- ============================================
-- ITEMS DE PEDIDO
-- ============================================
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  design_id UUID NOT NULL REFERENCES public.designs(id) ON DELETE RESTRICT,

  quantity INTEGER NOT NULL DEFAULT 1,
  size TEXT NOT NULL,
  color TEXT NOT NULL,
  print_position TEXT NOT NULL DEFAULT 'espalda',
  unit_price INTEGER NOT NULL,            -- Precio unitario en centavos COP

  -- Snapshot del diseño al momento de la compra
  design_snapshot JSONB NOT NULL,         -- {prompt, image_url, config}

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON public.order_items(order_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Profiles: usuarios ven/editan solo su perfil, admin ve todos
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admin reads all profiles" ON public.profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Products: todos leen, solo admin modifica
CREATE POLICY "Anyone reads active products" ON public.products FOR SELECT USING (is_active = true);
CREATE POLICY "Admin manages products" ON public.products FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Designs: usuario ve las suyas + catálogo público
CREATE POLICY "Users read own designs" ON public.designs FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Anyone reads catalog designs" ON public.designs FOR SELECT USING (is_catalog = true);
CREATE POLICY "Users create designs" ON public.designs FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admin reads all designs" ON public.designs FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Chat: usuario ve solo sus chats
CREATE POLICY "Users manage own chats" ON public.chat_sessions FOR ALL USING (user_id = auth.uid());

-- Orders: usuario ve sus pedidos, admin ve todos
CREATE POLICY "Users read own orders" ON public.orders FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users create orders" ON public.orders FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admin manages all orders" ON public.orders FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Order items: misma política que orders
CREATE POLICY "Users read own order items" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_items.order_id AND user_id = auth.uid())
);
CREATE POLICY "Users create order items" ON public.order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_items.order_id AND user_id = auth.uid())
);
CREATE POLICY "Admin manages all order items" ON public.order_items FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================
-- STORAGE BUCKETS
-- ============================================
-- Ejecutar en Supabase Dashboard > Storage:
-- 1. Crear bucket "designs" (público)
-- 2. Crear bucket "brand" (público)
-- 3. Crear bucket "mockups" (público)

-- ============================================
-- FUNCIONES AUXILIARES
-- ============================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_chat_sessions_updated_at BEFORE UPDATE ON public.chat_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- SEED DATA: producto inicial de ejemplo
-- ============================================
INSERT INTO public.products (name, slug, description, base_price, material, available_colors, available_sizes, print_positions) VALUES
(
  'Camiseta clásica algodón',
  'camiseta-clasica-algodon',
  'Camiseta 100% algodón premium, perfecta para cualquier diseño. Tela suave y duradera.',
  4500000, -- $45,000 COP en centavos
  'Algodón 100% pre-encogido, 180g/m²',
  '["negro", "blanco", "gris", "navy"]',
  '["XS", "S", "M", "L", "XL", "XXL"]',
  '["pecho", "espalda", "pecho-pequeño"]'
);
