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

Archivo: `src/app/crear/page.tsx`. El componente `CrearPage` renderiza **dos layouts completos y mutuamente excluyentes** vía CSS (no hay dos componentes React separados, ni lógica condicional por JS — ambos bloques JSX existen siempre en el DOM y Tailwind decide cuál se ve):

- Bloque desktop: `<div className="hidden flex-1 overflow-hidden lg:flex">` — oculto por debajo de `lg` (1024px), visible en `lg` en adelante.
- Bloque mobile: `<div className="flex flex-1 flex-col overflow-hidden lg:hidden">` — visible por debajo de `lg`, oculto en `lg` en adelante.

Ambos bloques comparten el mismo estado de React (`genero`, `material`, `selectedColor`, `size`, `side`, `zones`, `*Transform`), así que cambiar de tamaño de ventana nunca pierde el progreso del usuario. El bloque de precio + botón "Agregar al carrito" (`bottomBar`) está extraído como una constante JSX y se reutiliza en ambos layouts para no duplicar esa lógica.

**Selectores compartidos** (arriba en ambos layouts): Género (`GenderSelector`), Material (`MaterialSelector`), Color (swatches inline, ver `PRESET_COLORS`), Talla (`SizeSelector`). El precio se recalcula en vivo con `getDesglose`/`calcularSubtotal` (`src/lib/utils/pricing.ts`) en función de material + género + zonas activas.

**Zonas de estampado** (`ZONES` en `page.tsx`, tipo `DesignZone` en `src/types/design.ts`):
| key | label visible | lado | tamaño real aprox. |
|---|---|---|---|
| `pechoBolsillo` | Pecho bolsillo | front | ~10×10 cm |
| `abdominalGrande` | Pecho grande | front | ~30×35 cm |
| `espaldaGrande` | Espalda grande | back | ~30×35 cm |

El usuario puede usar 1, 2 o las 3 zonas — no todas son obligatorias, solo se requiere al menos una (`hasAnyImage`).

**Layout desktop** (`lg:` en adelante) — panel dividido, sin cambios funcionales recientes:
- Panel izquierdo (`lg:w-[420px]`): selectores + lista vertical de `ImageUploadZone` (una fila compacta por zona: thumbnail, nombre, botón subir/eliminar, botón quitar/restaurar fondo) + `bottomBar`.
- Panel derecho: `TshirtPreview` en modo **no interactivo para la carga** (no se le pasan las props `*Upload`) — solo muestra el resultado y permite mover/escalar la imagen ya subida (drag + fila de escala).

**Layout mobile** (`lg:hidden`, ver también sección "Cambios de diseño mobile" abajo) — todo en un solo scroll vertical:
1. Selectores (género → material → color → talla).
2. `TshirtPreview` en **modo interactivo**: se le pasan `pechoUpload` / `abdominalUpload` / `espaldaUpload` (prop `ZoneUploadHandlers` en `TshirtPreview.tsx`). Esto hace que, cuando una zona está vacía, el propio componente dibuje un recuadro punteado tap-to-upload **encima de la silueta de la camiseta, en la posición real de esa zona de estampado** (no hay lista de uploads separada en mobile — subir, mover, escalar y quitar fondo pasa todo directamente sobre la camiseta).
3. `bottomBar` (precio + "Agregar al carrito"), fijo al fondo del layout mobile mientras el contenido de arriba scrollea (mismo patrón que el panel izquierdo desktop: contenedor `flex flex-col` con una zona interna `flex-1 overflow-y-auto` y `bottomBar` como hermano `shrink-0`).

**Cambios de diseño mobile (histórico, 2026-07):** Antes existían pestañas "Configurar"/"Preview" que separaban la config del preview en mobile. Se reemplazaron por el layout unificado de arriba porque la mayoría del tráfico es mobile y separar configuración de la vista previa resultaba poco intuitivo. Las posiciones verticales de las zonas sobre la camiseta (`top: "36%"` para pecho grande, `top: "28%"` para espalda grande, en `TshirtPreview.tsx`) están calibradas a mano contra el `viewBox="0 0 320 420"` del SVG para que los recuadros queden centrados sobre el torso — si se ajusta el dibujo del SVG (`bodyPath`), revisar si esas constantes siguen viéndose centradas.

**Flujo de compra:**
1. Usuario sube imágenes a las zonas deseadas (desde la lista en desktop, o tocando la camiseta en mobile)
2. Preview se actualiza en tiempo real; puede mover (drag) y escalar (+/- o slider) cada imagen dentro de su zona
3. Opcional: "Quitar fondo" corre segmentación client-side (ver `handleRemoveBg` en `page.tsx`, usa `@huggingface/transformers` cargado desde CDN, modelo `briaai/RMBG-1.4`, WASM) — no toca el servidor
4. Elige género, material, color y talla
5. Click "Agregar al carrito" → si no hay sesión, se muestra `showAuthModal` en vez de continuar
6. Imágenes ORIGINALES (o sin fondo, si se aplicó) se suben a Supabase Storage vía `uploadDesignAndSave` (`src/app/crear/actions.ts`) — sin más modificación
7. Se crea registro en tabla `designs` con config JSON de zonas (incluye `ZoneTransform`: offsetX/offsetY/scale de cada zona activa)
8. El admin descarga las imágenes puras para enviar al estampador

**NO se usa IA generativa para procesar imágenes en este flujo.** Las imágenes del usuario se colocan tal cual (la única transformación posible es la remoción de fondo, que es determinística/local, no generativa).

#### Componente `TshirtPreview` (`src/components/design/TshirtPreview.tsx`)

Dibuja la camiseta como un SVG a mano (path `bodyPath`, `viewBox="0 0 320 420"`) y superpone las imágenes de cada zona como `<div>` posicionados en absoluto con `top`/`left` en porcentaje del contenedor. Es el único lugar donde vive la lógica de drag (pointer events) y escala (+/-, slider, rueda del mouse) de las 3 zonas.

Props relevantes para quien lo vaya a tocar:
- `pechoTransform` / `abdominalTransform` / `espaldaTransform` + sus `on*TransformChange`: estado controlado (`ZoneTransform = { offsetX, offsetY, scale }`) que vive en `page.tsx`, no dentro del componente.
- `pechoUpload` / `abdominalUpload` / `espaldaUpload` (tipo `ZoneUploadHandlers`, opcionales): **si se pasan**, el componente se vuelve interactivo para la carga — dibuja el placeholder tap-to-upload cuando la zona está vacía, un botón "✕" para eliminar sobre la imagen ya subida, y un botón de quitar/restaurar fondo en la fila de escala. **Si no se pasan** (como en el panel derecho del layout desktop), el componente queda en modo solo-preview para la carga: no hay placeholders ni botón de eliminar, solo el texto genérico "Sube una imagen para el frente/espalda". Este flag-por-presencia-de-prop es intencional: permite reusar el mismo componente para el panel de preview de desktop (pasivo) y para la superficie interactiva de mobile (activa) sin duplicar el SVG ni la lógica de drag/escala.
- `captureMode`: oculta todos los controles (toggle frente/espalda, botones, fila de escala) — se usa para generar una captura "limpia" de la camiseta sin UI.

Las coordenadas `top`/`left`/`width` de cada zona (pecho bolsillo: `top:24%, left:27%, width:15%`; pecho grande: `top:36%, width:40%`, centrado; espalda grande: `top:28%, width:48%`, centrado) están calibradas a ojo contra el `bodyPath` del SVG, no derivadas matemáticamente. Si se cambia el dibujo de la camiseta, hay que reajustar estos números visualmente (no hay una fórmula que los relacione).

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
