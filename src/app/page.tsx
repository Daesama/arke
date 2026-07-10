"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Upload, Palette, Truck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";

const steps = [
  {
    icon: Upload,
    title: "1. Sube tu imagen",
    description:
      "Carga tu imagen (JPG, PNG, WebP) y elige en qué zona de la camiseta la quieres estampar.",
    accent: "cyan" as const,
  },
  {
    icon: Palette,
    title: "2. Personaliza tu camiseta",
    description:
      "Elige color, talla y posición del estampado. Previsualiza cómo queda en tiempo real.",
    accent: "violet" as const,
  },
  {
    icon: Truck,
    title: "3. Recíbela en tu puerta",
    description:
      "Haz tu pedido y recibe tu camiseta personalizada en la puerta de tu casa.",
    accent: "magenta" as const,
  },
];

const accentMap = {
  cyan: {
    icon: "bg-cyan/[0.08] text-cyan group-hover:bg-cyan/[0.15]",
    badge: "border-cyan/20 group-hover:border-cyan/40 group-hover:text-cyan",
    glow: "group-hover:shadow-[0_0_50px_rgba(0,240,255,0.08)]",
    border: "group-hover:border-cyan/20",
  },
  violet: {
    icon: "bg-violet/[0.08] text-violet group-hover:bg-violet/[0.15]",
    badge: "border-violet/20 group-hover:border-violet/40 group-hover:text-violet",
    glow: "group-hover:shadow-[0_0_50px_rgba(139,92,246,0.08)]",
    border: "group-hover:border-violet/20",
  },
  magenta: {
    icon: "bg-magenta/[0.08] text-magenta group-hover:bg-magenta/[0.15]",
    badge: "border-magenta/20 group-hover:border-magenta/40 group-hover:text-magenta",
    glow: "group-hover:shadow-[0_0_50px_rgba(255,45,149,0.08)]",
    border: "group-hover:border-magenta/20",
  },
};

const smooth = [0.25, 0.46, 0.45, 0.94] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.15,
      duration: 0.6,
      ease: smooth as unknown as [number, number, number, number],
    },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      delay: i * 0.15,
      duration: 0.6,
      ease: smooth as unknown as [number, number, number, number],
    },
  }),
};

export default function Home() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center overflow-hidden px-4 text-center">
        {/* Gradient layers */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-deep via-void to-void" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_center,rgba(0,240,255,0.15)_0%,transparent_50%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(139,92,246,0.1)_0%,transparent_45%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(255,45,149,0.06)_0%,transparent_40%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_35%,#0A0A0F_70%)]" />

        {/* Animated grid */}
        <div className="pointer-events-none absolute inset-0 animate-grid-breathe bg-[linear-gradient(rgba(0,240,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(0,240,255,0.06)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />

        {/* Floating orbs */}
        <div className="pointer-events-none absolute left-1/4 top-1/4 h-64 w-64 animate-float rounded-full bg-cyan/[0.03] blur-[100px]" />
        <div className="pointer-events-none absolute bottom-1/3 right-1/3 h-48 w-48 animate-float rounded-full bg-violet/[0.04] blur-[80px] [animation-delay:2s]" />
        <div className="pointer-events-none absolute bottom-1/4 left-1/2 h-32 w-32 animate-float rounded-full bg-magenta/[0.03] blur-[60px] [animation-delay:4s]" />

        {/* Isotipo — no background, just the image + glow ring */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="relative z-10 mb-10"
        >
          <div className="absolute -inset-20 rounded-full border border-cyan/[0.06] animate-[spin_20s_linear_infinite]" />
          <div className="absolute -inset-14 rounded-full border border-violet/[0.04] animate-[spin_30s_linear_infinite_reverse]" />
          <Image
            src="/brand/isotipo-color.png"
            alt="ARKE isotipo"
            width={100}
            height={100}
            priority
            className="relative animate-logo-shimmer drop-shadow-[0_0_30px_rgba(0,240,255,0.2)]"
          />
        </motion.div>

        {/* Headline — 3 lines, centered, large */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="relative z-10 font-heading text-4xl font-medium leading-tight text-text-primary md:text-6xl"
        >
          Tu imagen.
          <br />
          <span className="text-cyan">Tu camisa.</span>
          <br />
          Así de simple.
        </motion.h1>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="relative z-10 mt-12"
        >
          <Link href="/crear">
            <Button size="lg" className="animate-glow-cyan-pulse px-10 py-4 text-base">
              Crea tu camiseta
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.8 }}
          className="absolute bottom-8 z-10 text-text-muted"
        >
          <div className="flex flex-col items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-text-muted/60">
              Descubre más
            </span>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="h-12 w-px bg-gradient-to-b from-cyan/30 via-elevated/50 to-transparent"
            />
          </div>
        </motion.div>
      </section>

      {/* ── Cómo funciona ── */}
      <section className="relative border-t border-white/[0.04] px-4 py-32 sm:px-6">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-void via-deep to-void" />
        <div className="pointer-events-none absolute inset-0 animate-grid-breathe bg-[linear-gradient(rgba(139,92,246,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.04)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_80%)]" />

        <div className="relative z-10 mx-auto max-w-5xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="mb-20 text-center"
          >
            <motion.p
              variants={fadeUp}
              custom={0}
              className="font-mono text-[11px] uppercase tracking-[0.3em] text-violet/60"
            >
              Proceso
            </motion.p>
            <motion.h2
              variants={fadeUp}
              custom={1}
              className="mt-4 font-heading text-3xl font-medium text-text-primary sm:text-4xl md:text-5xl"
            >
              Cómo funciona
            </motion.h2>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-3 md:gap-8">
            {steps.map((step, i) => {
              const colors = accentMap[step.accent];
              return (
                <motion.div
                  key={step.title}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-50px" }}
                  variants={scaleIn}
                  custom={i + 1}
                  className={cn(
                    "gradient-border gradient-border-subtle group relative rounded-2xl bg-surface/30 p-8 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:bg-surface/50",
                    colors.glow,
                    colors.border,
                  )}
                >
                  <div
                    className={cn(
                      "mb-6 inline-flex rounded-xl p-4 transition-all duration-300",
                      colors.icon,
                    )}
                  >
                    <step.icon className="h-6 w-6" strokeWidth={1.5} />
                  </div>
                  <h3 className="mb-3 font-heading text-lg font-medium text-text-primary">
                    {step.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-text-secondary">
                    {step.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA Final ── */}
      <section className="relative overflow-hidden px-4 py-36 sm:px-6">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-void via-deep to-void" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.12)_0%,transparent_55%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,240,255,0.06)_0%,transparent_45%)]" />

        <div className="relative z-10 mx-auto max-w-2xl text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            <motion.h2
              variants={fadeUp}
              custom={0}
              className="font-heading text-3xl font-medium leading-snug text-text-primary sm:text-4xl md:text-5xl"
            >
              Tu próxima camiseta empieza con{" "}
              <span className="text-cyan">tu imagen</span>
            </motion.h2>
            <motion.p
              variants={fadeUp}
              custom={1}
              className="mt-6 text-text-secondary sm:text-lg"
            >
              Sube tu diseño, elige cómo lo quieres y nosotros nos encargamos
              del resto.
            </motion.p>
            <motion.div variants={fadeUp} custom={2} className="mt-12">
              <Link href="/crear">
                <Button size="lg" className="animate-glow-cyan-pulse">
                  Empezar ahora
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
