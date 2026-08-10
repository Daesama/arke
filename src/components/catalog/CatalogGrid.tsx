"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { TshirtPreviewThumbnail } from "@/components/design/TshirtPreviewThumbnail";
import { cn } from "@/lib/utils/cn";
import { DESIGN_CATEGORIES } from "@/lib/utils/constants";
import type { CatalogDesign } from "@/types/design";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    // El delay se satura para que un catálogo grande no tarde
    // segundos en terminar de aparecer.
    transition: { delay: Math.min(i, 8) * 0.06, duration: 0.4 },
  }),
};

export function CatalogGrid({ designs }: { designs: CatalogDesign[] }) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Solo se ofrecen filtros de categorías que realmente tienen camisas:
  // un filtro que siempre devuelve vacío se siente roto.
  const availableCategories = useMemo(() => {
    const present = new Set(designs.map((d) => d.category).filter(Boolean));
    return DESIGN_CATEGORIES.filter((cat) => present.has(cat.value));
  }, [designs]);

  const visible = useMemo(
    () =>
      activeCategory
        ? designs.filter((d) => d.category === activeCategory)
        : designs,
    [designs, activeCategory],
  );

  if (designs.length === 0) {
    return (
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
          Pronto habrá camisas acá
        </p>
        <p className="mt-2 max-w-sm text-sm text-text-secondary">
          Estamos preparando una colección increíble. Mientras tanto, puedes
          crear la tuya con tu propio diseño.
        </p>
        <Link href="/crear" className="mt-6">
          <Button size="md">Crear mi camiseta</Button>
        </Link>
      </motion.div>
    );
  }

  return (
    <>
      {availableCategories.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          <FilterChip
            active={activeCategory === null}
            onClick={() => setActiveCategory(null)}
          >
            Todas
          </FilterChip>
          {availableCategories.map((cat) => (
            <FilterChip
              key={cat.value}
              active={activeCategory === cat.value}
              onClick={() => setActiveCategory(cat.value)}
            >
              {cat.label}
            </FilterChip>
          ))}
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visible.map((design, i) => (
          <motion.div
            key={design.id}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={i}
          >
            <Link
              href={`/catalogo/${design.id}`}
              className="group gradient-border gradient-border-subtle block overflow-hidden rounded-2xl bg-surface/40 backdrop-blur-xl transition-all duration-300 hover:shadow-[0_0_50px_rgba(0,240,255,0.08)]"
            >
              <div className="bg-deep/70 p-3 transition-transform duration-300 group-hover:scale-[1.03]">
                <TshirtPreviewThumbnail
                  zoneConfig={design.zones}
                  colorHex={design.colorHex}
                  className="relative aspect-[3/4] w-full"
                />
              </div>
              <div className="space-y-2 p-4">
                <p className="truncate font-heading text-sm font-medium text-text-primary">
                  {design.title}
                </p>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-cyan opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    Pedir →
                  </span>
                  {design.category && (
                    <Badge variant="violet">
                      {DESIGN_CATEGORIES.find((c) => c.value === design.category)
                        ?.label ?? design.category}
                    </Badge>
                  )}
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg border px-4 py-2 text-sm transition-all",
        active
          ? "border-cyan bg-cyan/10 text-cyan"
          : "border-elevated text-text-secondary hover:border-text-muted",
      )}
    >
      {children}
    </button>
  );
}
