"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Upload, Palette, Truck } from "lucide-react";
import { Button } from "@/components/ui/Button";

const steps = [
  {
    icon: Upload,
    title: "Sube tu diseño",
    description:
      "Carga tu imagen (JPG, PNG, WebP) y elige en qué zona de la camiseta la quieres estampar.",
  },
  {
    icon: Palette,
    title: "Personaliza tu camiseta",
    description:
      "Elige color, talla y posición del estampado. Previsualiza cómo queda en tiempo real.",
  },
  {
    icon: Truck,
    title: "Te la enviamos",
    description:
      "Haz tu pedido y recibe tu camiseta personalizada en la puerta de tu casa.",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.5, ease: "easeOut" as const },
  }),
};

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center overflow-hidden px-4 text-center">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,240,255,0.12)_0%,transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(139,92,246,0.08)_0%,transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(255,45,149,0.04)_0%,transparent_45%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_30%,#0A0A0F_75%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.03] bg-[linear-gradient(rgba(238,238,240,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(238,238,240,0.5)_1px,transparent_1px)] bg-[size:60px_60px]" />

        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="relative mb-12"
        >
          <div className="absolute -inset-10 rounded-full bg-cyan/8 blur-3xl" />
          <div className="absolute -inset-16 rounded-full border border-cyan/[0.04]" />
          <Image
            src="/brand/isotipo-color.png"
            alt="ARKE isotipo"
            width={100}
            height={100}
            priority
            className="relative drop-shadow-[0_0_30px_rgba(0,240,255,0.15)]"
          />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-6 font-mono text-[11px] uppercase tracking-[0.35em] text-cyan/70"
        >
          Tu Diseño, Tu Estilo
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="max-w-4xl font-heading text-4xl font-medium leading-[1.08] text-text-primary sm:text-5xl md:text-6xl lg:text-7xl"
        >
          Tú diseñas.{" "}
          <span className="bg-gradient-to-r from-cyan via-cyan to-violet/80 bg-clip-text text-transparent">Nosotros estampamos.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-6 max-w-lg text-base leading-relaxed text-text-secondary sm:text-lg"
        >
          Sube tu imagen, elige tu camiseta y recíbela en tu puerta.
          Así de simple.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.5 }}
          className="mt-12 flex flex-col gap-4 sm:flex-row"
        >
          <Link href="/crear">
            <Button size="lg">Crear mi camiseta</Button>
          </Link>
          <Link href="/catalogo">
            <Button variant="secondary" size="lg">
              Ver catálogo
            </Button>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="absolute bottom-8 text-text-muted"
        >
          <div className="flex flex-col items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-widest">Descubre más</span>
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="h-10 w-px bg-gradient-to-b from-elevated/80 to-transparent"
            />
          </div>
        </motion.div>
      </section>

      {/* Cómo funciona */}
      <section className="relative border-t border-elevated/30 bg-deep px-4 py-28 sm:px-6">
        <div className="pointer-events-none absolute inset-0 opacity-[0.02] bg-[linear-gradient(rgba(238,238,240,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(238,238,240,0.5)_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="relative mx-auto max-w-5xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="mb-16 text-center"
          >
            <motion.p
              variants={fadeUp}
              custom={0}
              className="font-mono text-[11px] uppercase tracking-[0.3em] text-violet/70"
            >
              Proceso
            </motion.p>
            <motion.h2
              variants={fadeUp}
              custom={1}
              className="mt-4 font-heading text-2xl font-medium text-text-primary sm:text-3xl md:text-4xl"
            >
              Tres pasos.{" "}
              <span className="bg-gradient-to-r from-cyan to-cyan/80 bg-clip-text text-transparent">Cero complicaciones.</span>
            </motion.h2>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-3 md:gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={fadeUp}
                custom={i + 1}
                className="group relative rounded-2xl border border-elevated/70 bg-surface/80 p-7 transition-all duration-300 hover:border-cyan/20 hover:bg-surface hover:shadow-[0_0_40px_rgba(0,240,255,0.06)]"
              >
                <span className="absolute -top-3.5 right-5 flex h-7 items-center rounded-full border border-elevated/70 bg-deep px-3 font-mono text-[11px] text-text-muted transition-colors group-hover:border-cyan/25 group-hover:text-cyan">
                  0{i + 1}
                </span>
                <div className="mb-5 inline-flex rounded-xl bg-cyan/[0.08] p-3.5 text-cyan transition-colors group-hover:bg-cyan/[0.12]">
                  <step.icon className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <h3 className="mb-2.5 font-heading text-lg font-medium text-text-primary">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-text-secondary">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="relative overflow-hidden px-4 py-32 sm:px-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.08)_0%,transparent_60%),radial-gradient(ellipse_at_top_right,rgba(0,240,255,0.04)_0%,transparent_50%)]" />
        <div className="relative mx-auto max-w-2xl text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            <motion.div variants={fadeUp} custom={0} className="mx-auto mb-8 h-px w-16 bg-gradient-to-r from-transparent via-violet/40 to-transparent" />
            <motion.h2
              variants={fadeUp}
              custom={0}
              className="font-heading text-2xl font-medium leading-snug text-text-primary sm:text-3xl md:text-4xl lg:text-5xl"
            >
              Tu próxima camiseta empieza con{" "}
              <span className="bg-gradient-to-r from-violet via-magenta to-magenta/80 bg-clip-text text-transparent">tu imagen</span>
            </motion.h2>
            <motion.p
              variants={fadeUp}
              custom={1}
              className="mt-6 text-text-secondary sm:text-lg"
            >
              Sube tu diseño, elige cómo lo quieres y nosotros nos encargamos del
              resto.
            </motion.p>
            <motion.div variants={fadeUp} custom={2} className="mt-12">
              <Link href="/crear">
                <Button size="lg">Empezar ahora</Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
