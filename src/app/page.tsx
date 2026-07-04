"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { MessageSquare, Sparkles, Shirt } from "lucide-react";
import { Button } from "@/components/ui/Button";

const steps = [
  {
    icon: MessageSquare,
    title: "Describí tu idea",
    description:
      "Chateá con nuestra IA y contale qué diseño querés. Puede ser una frase, un concepto o lo que se te ocurra.",
  },
  {
    icon: Sparkles,
    title: "La IA lo crea",
    description:
      "Nuestra IA genera tu diseño en segundos. Podés pedir ajustes hasta que quede perfecto.",
  },
  {
    icon: Shirt,
    title: "Tú lo vistes",
    description:
      "Previsualizá el diseño sobre la camiseta, elegí talla y color, y recibilo en tu casa.",
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
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,240,255,0.08)_0%,transparent_70%)]" />

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative mb-8"
        >
          <Image
            src="/brand/isotipo-color.png"
            alt="ARKE isotipo"
            width={80}
            height={80}
            priority
          />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-4 font-mono text-xs uppercase tracking-[0.3em] text-cyan"
        >
          Del Prompt al Estampado
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="max-w-3xl font-heading text-3xl font-medium leading-tight text-text-primary sm:text-4xl md:text-5xl"
        >
          Imaginalo. La IA lo crea.{" "}
          <span className="text-cyan">Tú lo vistes.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.5 }}
          className="mt-6 max-w-xl text-base text-text-secondary sm:text-lg"
        >
          Camisetas personalizadas con inteligencia artificial. Describí tu
          diseño, la IA lo genera, y te lo enviamos a tu puerta.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mt-8 flex flex-col gap-3 sm:flex-row"
        >
          <Link href="/crear">
            <Button size="lg">Crear mi diseño</Button>
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
          transition={{ delay: 1, duration: 0.8 }}
          className="absolute bottom-8 text-text-muted"
        >
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs">Scrolleá para saber más</span>
            <div className="h-8 w-px bg-gradient-to-b from-elevated to-transparent" />
          </div>
        </motion.div>
      </section>

      {/* Cómo funciona */}
      <section className="border-t border-elevated bg-deep px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="mb-14 text-center"
          >
            <motion.p
              variants={fadeUp}
              custom={0}
              className="font-mono text-xs uppercase tracking-[0.2em] text-violet"
            >
              Proceso
            </motion.p>
            <motion.h2
              variants={fadeUp}
              custom={1}
              className="mt-3 font-heading text-2xl font-medium text-cyan sm:text-3xl"
            >
              Tres pasos. Cero complicaciones.
            </motion.h2>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={fadeUp}
                custom={i + 1}
                className="group rounded-xl border border-elevated bg-surface p-6 transition-all duration-200 hover:border-cyan/30 hover:shadow-glow-cyan"
              >
                <div className="mb-4 inline-flex rounded-lg bg-cyan/10 p-3 text-cyan transition-colors group-hover:bg-cyan/20">
                  <step.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 font-heading text-lg font-medium text-text-primary">
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
      <section className="relative overflow-hidden px-4 py-20 sm:px-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(139,92,246,0.08)_0%,transparent_70%)]" />
        <div className="relative mx-auto max-w-2xl text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            <motion.h2
              variants={fadeUp}
              custom={0}
              className="font-heading text-2xl font-medium text-text-primary sm:text-3xl"
            >
              Tu próxima camiseta empieza con{" "}
              <span className="text-violet">una idea</span>
            </motion.h2>
            <motion.p
              variants={fadeUp}
              custom={1}
              className="mt-4 text-text-secondary"
            >
              No necesitás saber diseñar. Solo contale a la IA qué querés y
              mirá cómo cobra vida.
            </motion.p>
            <motion.div variants={fadeUp} custom={2} className="mt-8">
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
