"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { TshirtColor, TshirtSize, TshirtGenero, TshirtMaterial, PrintPosition } from "@/types/database";
import type { DesignZoneConfig } from "@/types/design";

export interface CartItem {
  id: string;
  productId: string;
  designId: string;
  designImageUrl: string;
  designPrompt: string;
  genero: TshirtGenero;
  material: TshirtMaterial;
  color: TshirtColor;
  size: TshirtSize;
  printPosition: PrintPosition;
  designConfig?: DesignZoneConfig;
  previewBase64?: string;
  quantity: number;
  unitPrice: number;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const id = crypto.randomUUID();
        set((state) => ({ items: [...state.items, { ...item, id }] }));
      },

      removeItem: (id) => {
        set((state) => ({ items: state.items.filter((i) => i.id !== id) }));
      },

      updateQuantity: (id, quantity) => {
        if (quantity < 1) return;
        set((state) => ({
          items: state.items.map((i) => (i.id === id ? { ...i, quantity } : i)),
        }));
      },

      clearCart: () => set({ items: [] }),

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      totalPrice: () =>
        get().items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),
    }),
    {
      name: "arke-cart",

      // `unitPrice` queda congelado en el momento en que se agregó el item,
      // pero `createOrder` recalcula el precio del lado del servidor antes
      // de cobrar (a propósito: el carrito vive en localStorage y no se
      // puede confiar en él). Con eso, un carrito armado antes de un cambio
      // de precios mostraría un total y cobraría otro.
      //
      // Por eso: al tocar la lista de precios se sube esta versión y los
      // carritos viejos se vacían solos. Molesta menos volver a armar el
      // carrito que descubrir la diferencia en el resumen de pago.
      version: 1,
      migrate: () => ({ items: [] }),
      partialize: (state) => ({ items: state.items }),
    },
  ),
);
