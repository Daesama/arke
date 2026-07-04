"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DESIGN_CATEGORIES } from "@/lib/utils/constants";
import { Sparkles } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4 },
  }),
};

export default function CatalogoPage() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-violet">
          Catálogo
        </p>
        <h1 className="mt-2 font-heading text-2xl font-medium text-cyan sm:text-3xl">
          Diseños pre-hechos
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          Diseños creados por ARKE listos para estampar. Elegí uno y personalizá tu camiseta.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-8 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveCategory(null)}
          className={`rounded-lg border px-4 py-2 text-sm transition-all ${
            activeCategory === null
              ? "border-cyan bg-cyan/10 text-cyan"
              : "border-elevated text-text-secondary hover:border-text-muted"
          }`}
        >
          Todos
        </button>
        {DESIGN_CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            type="button"
            onClick={() => setActiveCategory(cat.value)}
            className={`rounded-lg border px-4 py-2 text-sm transition-all ${
              activeCategory === cat.value
                ? "border-cyan bg-cyan/10 text-cyan"
                : "border-elevated text-text-secondary hover:border-text-muted"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Empty state */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        custom={0}
        className="flex flex-col items-center justify-center rounded-xl border border-dashed border-elevated py-20 text-center"
      >
        <div className="rounded-xl bg-violet/10 p-4 text-violet">
          <Sparkles className="h-8 w-8" />
        </div>
        <p className="mt-4 font-heading text-lg font-medium text-text-primary">
          Pronto habrá diseños acá
        </p>
        <p className="mt-2 max-w-sm text-sm text-text-secondary">
          Estamos preparando una colección increíble. Mientras tanto, podés subir tu propio diseño.
        </p>
        <Button className="mt-6" size="md" onClick={() => window.location.href = "/crear"}>
          Crear mi diseño
        </Button>
      </motion.div>
    </div>
  );
}
