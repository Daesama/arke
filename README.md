# ARKE — Del prompt al estampado

Plataforma de camisetas personalizadas. El usuario sube sus imágenes, las posiciona en la camiseta (pecho bolsillo, abdominal grande, espalda grande), elige material, color, talla y la ordena.

## Stack técnico
- **Framework**: Next.js 14 (App Router, TypeScript)
- **Base de datos**: Supabase (PostgreSQL + Auth + Storage)
- **Estilos**: Tailwind CSS
- **Pagos**: Wompi (PSE, Nequi, tarjetas, Bancolombia)
- **Deploy**: VPS propio

## Estructura
- `/src/app` — Páginas y API routes
- `/src/components` — Componentes React
- `/src/lib` — Utilidades, clientes de Supabase, integración Wompi
- `/src/stores` — Estado global (Zustand)
- `/src/types` — Tipos TypeScript

## Variables de entorno
Copiar `.env.local.example` como `.env.local` y llenar las keys.

## Desarrollo
```bash
npm install
npm run dev
```

## Estado
MVP en desarrollo — Solo Bogotá, Colombia.
