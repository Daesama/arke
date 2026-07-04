# ARKE — Del Prompt al Estampado

## Proyecto
Plataforma e-commerce colombiana de camisetas personalizadas con IA. Los usuarios describen su diseño a un chatbot con IA, la IA genera la imagen, el usuario la previsualiza sobre un mockup de camiseta, y puede ordenarla. El admin recibe el diseño separado (PNG de alta resolución) para enviarlo al estampador.

## Stack Técnico
- **Framework**: Next.js 14+ (App Router, Server Components, Server Actions)
- **Lenguaje**: TypeScript estricto
- **Base de datos**: Supabase (PostgreSQL + Auth + Storage)
- **IA Imágenes**: Google Gemini API (Nano Banana 2.5 Flash — modelo `gemini-2.5-flash-preview-image-generation`) con fallback a fal.ai Flux 2
- **Chatbot**: Anthropic Claude API (claude-sonnet-4-20250514) para conversación + orquestación de prompts
- **Pagos**: Wompi (PSE, Nequi, Daviplata, tarjetas) + opción contraentrega
- **Estilos**: Tailwind CSS 3 con config custom de ARKE
- **Fuentes**: Space Grotesk (títulos), Inter (cuerpo), JetBrains Mono (tagline/técnico)
- **Animaciones**: Framer Motion
- **Email**: Resend (transaccional)
- **Deploy**: VPS propio del cliente (ya tiene hosting)

## Identidad de Marca

### Colores (OBLIGATORIO seguir regla 60-25-15)
```
Primarios (neones):
  cyan:    #00F0FF  — 60% — CTAs, links, highlights, iconografía
  violet:  #8B5CF6  — 25% — Acentos, badges IA, hover states
  magenta: #FF2D95  — 15% — Alertas, promos, atención máxima

Fondos oscuros:
  void:     #0A0A0F  — Fondo principal
  deep:     #12121A  — Superficies elevadas
  surface:  #1C1C28  — Cards, modales
  elevated: #2A2A3A  — Bordes, separadores

Texto:
  primary:   #EEEEF0  — Títulos, contenido importante
  secondary: #9999A8  — Descripciones, cuerpo
  muted:     #5A5A6E  — Placeholders, metadata
```

### Tipografía
```
H1: Space Grotesk 500, 28-32px, color #EEEEF0
H2: Space Grotesk 500, 22-26px, color #00F0FF
Cuerpo: Inter 400, 14-16px, color #9999A8
Tagline: JetBrains Mono 400, 12-14px, color #00F0FF, UPPERCASE, letter-spacing amplio
Datos técnicos: JetBrains Mono 400, 12-13px, color #5A5A6E
Solo pesos 400 y 500. NUNCA Bold (700) ni Light (300).
```

### Tono de Voz
Directo, gamer, futurista, cercano. NUNCA corporativo.
- SÍ: "Tu diseño está listo. Quedó increíble."
- NO: "Estimado usuario, le informamos que su diseño ha sido procesado."
- SÍ: "Imaginalo. La IA lo crea. Tú lo vistes."

### Logo
Archivos en `/public/brand/`:
- `logo-horizontal-color.svg` — Header web (desktop)
- `logo-completo-color.svg` — Versión vertical
- `isotipo-color.png` — Avatar, mobile header
- `logo-monocromatico.svg` — Estampados, fondos ruidosos
- `favicon.png` — 512x512

El isotipo puede usarse como loader animado (fragmentos aparecen uno a uno).

### Reglas Inviolables
- La identidad OSCURA no se negocia. Fondos SIEMPRE oscuros.
- Nunca usar los tres neones en proporciones iguales (regla 60-25-15).
- Nunca fondos claros, ni versiones "pastel" de los neones.
- Logo mínimo: 32px alto en digital.

## Estructura del Proyecto

```
arke/
├── public/
│   ├── brand/                    # Logos SVG/PNG
│   ├── mockups/                  # Mockups de camisetas (front/back)
│   └── fonts/                    # Space Grotesk, JetBrains Mono si self-hosted
├── src/
│   ├── app/
│   │   ├── layout.tsx            # Root layout con fuentes + metadata
│   │   ├── page.tsx              # Landing page / Home
│   │   ├── globals.css           # Tailwind + variables custom
│   │   ├── catalogo/
│   │   │   └── page.tsx          # Catálogo de diseños pre-hechos
│   │   ├── crear/
│   │   │   └── page.tsx          # Chatbot + editor de diseño (CORE)
│   │   ├── carrito/
│   │   │   └── page.tsx          # Carrito de compras
│   │   ├── checkout/
│   │   │   └── page.tsx          # Checkout con Wompi
│   │   ├── pedidos/
│   │   │   └── page.tsx          # Mis pedidos (usuario)
│   │   ├── auth/
│   │   │   ├── login/page.tsx
│   │   │   └── registro/page.tsx
│   │   ├── admin/
│   │   │   ├── layout.tsx        # Layout admin con sidebar
│   │   │   ├── page.tsx          # Dashboard
│   │   │   ├── pedidos/page.tsx  # Gestión de pedidos
│   │   │   ├── productos/page.tsx# CRUD productos
│   │   │   └── disenos/page.tsx  # Ver/descargar diseños
│   │   └── api/
│   │       ├── chat/route.ts     # Streaming chat con Claude
│   │       ├── generate/route.ts # Generar imagen con IA
│   │       ├── webhooks/
│   │       │   └── wompi/route.ts# Webhook de pagos
│   │       └── admin/
│   │           └── [...]/route.ts
│   ├── components/
│   │   ├── ui/                   # Componentes base (Button, Input, Card, Modal...)
│   │   ├── layout/               # Header, Footer, Sidebar, MobileNav
│   │   ├── chat/                 # (legacy — ya no se usa en /crear)
│   │   ├── design/               # TshirtPreview, ImageUploadZone, ColorSelector, SizeSelector
│   │   ├── cart/                 # CartItem, CartSummary
│   │   └── admin/               # OrderTable, ProductForm, DesignDownloader
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts         # Browser client
│   │   │   ├── server.ts         # Server client
│   │   │   └── admin.ts          # Service role client
│   │   ├── ai/
│   │   │   ├── provider.ts       # Adapter pattern — switch entre Gemini/fal.ai
│   │   │   ├── gemini.ts         # Google Gemini implementation
│   │   │   ├── fal.ts            # fal.ai Flux implementation (fallback)
│   │   │   └── prompts.ts        # System prompts para Claude chatbot
│   │   ├── wompi/
│   │   │   ├── client.ts         # Wompi API client
│   │   │   └── webhook.ts        # Verificación de webhooks
│   │   └── utils/
│   │       ├── constants.ts
│   │       └── helpers.ts
│   ├── hooks/
│   │   ├── useChat.ts            # Hook para el chatbot
│   │   ├── useCart.ts            # Hook para carrito (Zustand)
│   │   └── useDesign.ts          # Hook para estado del diseño
│   ├── stores/
│   │   └── cartStore.ts          # Zustand store para carrito
│   └── types/
│       ├── database.ts           # Types generados de Supabase
│       ├── chat.ts
│       └── design.ts
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
├── tailwind.config.ts
├── next.config.ts
├── .env.local.example
├── package.json
└── tsconfig.json
```

## Base de Datos (Supabase PostgreSQL)

El esquema SQL completo está en `supabase/migrations/001_initial_schema.sql`.

### Tablas principales:
- **profiles** — Datos del usuario (se extiende de auth.users)
- **products** — Tipos de camiseta (material, tallas, colores, precio)
- **designs** — Diseños del usuario (imagen URL, config JSON con zonas de estampado)
- **orders** — Pedidos completos
- **order_items** — Items de cada pedido
- **chat_sessions** — Sesiones del chatbot por usuario

### Storage Buckets:
- `designs` — Imágenes subidas por el usuario para estampado (público)
- `brand` — Assets de marca (público)

## Páginas Principales

### 1. Landing Page (`/`)
Hero section con animación del isotipo (fragmentos aparecen uno a uno). Título grande: "Imaginalo. La IA lo crea. Tú lo vistes." CTA principal al chatbot. Sección de cómo funciona (3 pasos). Galería de diseños destacados. Footer con links y redes.

### 2. Editor de Camiseta (`/crear`) — PÁGINA CORE
Split layout: configuración a la izquierda, preview en tiempo real a la derecha.

**Panel izquierdo — Configuración:**
- Selector de color de camiseta (negro, blanco, gris, navy)
- Toggle de vista: Frente / Espalda
- 3 zonas de carga de imagen (el usuario sube sus propias imágenes):
  - "Pecho bolsillo" — imagen pequeña arriba a la izquierda del frente (~10×10cm)
  - "Abdominal grande" — imagen grande en el centro del frente (~30×35cm)
  - "Espalda grande" — imagen grande centrada en la espalda (~30×35cm)
- Cada zona: botón subir (jpg/png/webp), preview thumbnail, botón eliminar
- El usuario puede usar 1, 2 o las 3 zonas
- Selector de talla (XS–XXL)
- Botón "Agregar al carrito"

**Panel derecho — Preview:**
- Mockup SVG de camiseta que cambia de color
- Vista frontal muestra pecho bolsillo (arriba-izq, pequeña) + abdominal (centro, grande)
- Vista trasera muestra espalda grande (centro)
- Las imágenes se renderizan sobre la camiseta en tiempo real

**Flujo:**
1. Usuario sube imágenes a las zonas deseadas
2. Preview se actualiza en tiempo real
3. Elige color y talla
4. Click "Agregar al carrito"
5. Imágenes ORIGINALES se suben a Supabase Storage (sin modificar)
6. Se crea registro en tabla designs con config JSON de zonas
7. El admin descarga las imágenes puras para enviar al estampador

**NO se usa IA para procesar imágenes.** Las imágenes del usuario se colocan tal cual.

### 3. Catálogo (`/catalogo`)
Grid de diseños pre-hechos por ARKE. Filtros por categoría (gaming, anime, abstracto, pop culture). Click en un diseño → lo muestra en preview de camiseta → agregar al carrito.

### 4. Carrito (`/carrito`)
Lista de items con preview, talla, color, precio. Botón de checkout.

### 5. Checkout (`/checkout`)
Resumen del pedido. Datos de envío (dirección en Colombia). Selección de método de pago: Wompi (tarjeta/PSE/Nequi) o contraentrega. Integración con Wompi Widget/Checkout.

### 6. Admin (`/admin`)
Protegido con role check. Dashboard con stats. Tabla de pedidos con estados (pendiente → pagado → en producción → enviado → entregado). Botón de descarga del diseño individual (PNG alta resolución, fondo transparente) para enviar al estampador. CRUD de productos.

## API Routes

### POST `/api/chat`
Streaming chat con Claude. El system prompt le dice a Claude que es el asistente creativo de ARKE y debe:
- Entender qué quiere el usuario
- Hacer preguntas si falta info (colores, estilo, posición)
- Generar un prompt optimizado para la IA de imágenes
- Responder en español, tono gamer/cercano
- Cuando el prompt está listo, devolver un JSON action para trigger la generación

### POST `/api/generate`
Recibe el prompt optimizado. Llama a Gemini (o fal.ai como fallback). Sube la imagen a Supabase Storage. Devuelve la URL.

### POST `/api/webhooks/wompi`
Recibe notificación de Wompi cuando un pago es aprobado/rechazado. Actualiza el estado del pedido.

## Adapter de IA (IMPORTANTE)

```typescript
// lib/ai/provider.ts
// Patrón adapter para poder cambiar de proveedor fácilmente

interface ImageProvider {
  generate(prompt: string, options?: GenerateOptions): Promise<GenerateResult>;
}

// Cambiar provider es cambiar UNA línea:
const ACTIVE_PROVIDER: 'gemini' | 'fal' = 'gemini';
```

## Variables de Entorno (.env.local)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# IA - Gemini (primario)
GOOGLE_AI_API_KEY=

# IA - fal.ai (fallback)
FAL_KEY=

# Chatbot
ANTHROPIC_API_KEY=

# Pagos
WOMPI_PUBLIC_KEY=
WOMPI_PRIVATE_KEY=
WOMPI_EVENTS_SECRET=
WOMPI_SANDBOX=true

# Email
RESEND_API_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_AI_PROVIDER=gemini
```

## Instrucciones para Claude Code

### Orden de implementación:
1. `npm create next-app@latest arke -- --typescript --tailwind --app --src-dir`
2. Instalar dependencias: `npm i @supabase/supabase-js @supabase/ssr ai @ai-sdk/anthropic @google/genai zustand framer-motion lucide-react`
3. Configurar Tailwind con los colores de ARKE
4. Copiar logos a `/public/brand/`
5. Crear schema de Supabase
6. Implementar componentes UI base
7. Construir layout principal (Header + Footer)
8. Landing page
9. Sistema de auth
10. Chatbot + generación de imágenes
11. Preview de camiseta
12. Carrito + checkout
13. Panel admin
14. Integración Wompi

### Principios de código:
- TypeScript estricto, NO `any`
- Server Components por defecto, `'use client'` solo cuando sea necesario
- Server Actions para mutaciones de datos
- Manejo de errores robusto con try/catch
- Loading states y skeletons en toda la app
- Mobile-first responsive
- Accesibilidad básica (aria labels, semántica HTML)
- SEO con metadata API de Next.js

### Principios de diseño:
- SIEMPRE fondos oscuros (#0A0A0F base)
- Efecto glow con los neones (box-shadow con cyan/violet/magenta)
- Bordes sutiles con #2A2A3A
- Hover states con transiciones suaves (200ms)
- Micro-animaciones con Framer Motion en entradas de elementos
- El chatbot debe sentirse como un chat de gaming (estilo Discord oscuro)
- Cards con borde sutil y hover glow
- Botones primarios: fondo cyan con texto oscuro
- Inputs: fondo #12121A, borde #2A2A3A, focus borde cyan
