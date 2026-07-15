"use client";

import { useState, useEffect } from "react";
import { useCartStore } from "@/stores/cartStore";
import { createClient } from "@/lib/supabase/client";
import { TshirtPreview } from "@/components/design/TshirtPreview";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import {
  MapPin,
  Package,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ShieldCheck,
  LogIn,
  UserPlus,
} from "lucide-react";
import Script from "next/script";
import { cn } from "@/lib/utils/cn";
import { formatCOP, getActiveZonesFromConfig, getDesglose, ENVIO } from "@/lib/utils/pricing";
import { createOrder, saveOrderAssets } from "./actions";
import { captureElement } from "@/lib/utils/capturePreview";
import type { DesignZoneConfig } from "@/types/design";

const LOCALIDADES_BOGOTA = [
  "Usaquén",
  "Chapinero",
  "Santa Fe",
  "San Cristóbal",
  "Usme",
  "Tunjuelito",
  "Bosa",
  "Kennedy",
  "Fontibón",
  "Engativá",
  "Suba",
  "Barrios Unidos",
  "Teusaquillo",
  "Los Mártires",
  "Antonio Nariño",
  "Puente Aranda",
  "La Candelaria",
  "Rafael Uribe Uribe",
  "Ciudad Bolívar",
  "Sumapaz",
] as const;

const STEPS = [
  { id: 1, label: "Envío", icon: MapPin },
  { id: 2, label: "Resumen", icon: Package },
  { id: 3, label: "Pago", icon: CreditCard },
];

interface ShippingData {
  name: string;
  whatsapp: string;
  address: string;
  barrio: string;
  localidad: string;
  notes: string;
}

function getZonesFromConfig(config?: DesignZoneConfig) {
  return {
    pechoBolsillo:
      config?.pechoBolsillo?.enabled ? config.pechoBolsillo.imageUrl : null,
    abdominalGrande:
      config?.abdominalGrande?.enabled
        ? config.abdominalGrande.imageUrl
        : null,
    espaldaGrande:
      config?.espaldaGrande?.enabled ? config.espaldaGrande.imageUrl : null,
  };
}

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCartStore();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingStep, setProcessingStep] = useState("");
  const [shipping, setShipping] = useState<ShippingData>({
    name: "",
    whatsapp: "",
    address: "",
    barrio: "",
    localidad: "",
    notes: "",
  });

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setIsAuthenticated(!!data.user));
  }, []);


  const subtotal = totalPrice();
  const total = subtotal + ENVIO;

  function updateField(field: keyof ShippingData, value: string) {
    setShipping((prev) => ({ ...prev, [field]: value }));
    setError(null);
  }

  function validateShipping(): boolean {
    if (!shipping.name.trim()) {
      setError("Ingresa tu nombre completo");
      return false;
    }
    if (!shipping.whatsapp.trim()) {
      setError("Ingresa tu número de WhatsApp");
      return false;
    }
    if (!shipping.address.trim()) {
      setError("Ingresa tu dirección");
      return false;
    }
    if (!shipping.barrio.trim()) {
      setError("Ingresa tu barrio");
      return false;
    }
    if (!shipping.localidad) {
      setError("Selecciona tu localidad");
      return false;
    }
    return true;
  }

  function goToSummary() {
    if (!validateShipping()) return;
    setError(null);
    setStep(2);
  }

  async function captureMockups(): Promise<
    Array<{ itemId: string; front?: Blob; back?: Blob }>
  > {
    const results: Array<{ itemId: string; front?: Blob; back?: Blob }> = [];

    for (const item of items) {
      const zones = getZonesFromConfig(item.designConfig);
      const hasFront = !!zones.pechoBolsillo || !!zones.abdominalGrande;
      const hasBack = !!zones.espaldaGrande;

      let frontBlob: Blob | undefined;
      let backBlob: Blob | undefined;

      if (hasFront) {
        const el = document.querySelector(
          `[data-mockup="${item.id}-front"]`,
        ) as HTMLElement | null;
        if (el) {
          try {
            frontBlob = await captureElement(el);
          } catch (err) {
            console.error("[Checkout] Capture front failed:", err);
          }
        }
      }

      if (hasBack) {
        const el = document.querySelector(
          `[data-mockup="${item.id}-back"]`,
        ) as HTMLElement | null;
        if (el) {
          try {
            backBlob = await captureElement(el);
          } catch (err) {
            console.error("[Checkout] Capture back failed:", err);
          }
        }
      }

      results.push({ itemId: item.id, front: frontBlob, back: backBlob });
    }

    return results;
  }

  function cancelProcessing() {
    setLoading(false);
    setStep(2);
    setProcessingStep("");
  }

  async function handlePay() {
    setLoading(true);
    setError(null);
    setStep(3);

    try {
      // ── Paso 1: Maqueta (opcional, no bloquea) ──
      setProcessingStep("Generando maqueta del diseño...");
      console.log("[Checkout] Paso 1: Generando maqueta...");
      let mockups: Array<{ itemId: string; front?: Blob; back?: Blob }> = [];
      try {
        mockups = await captureMockups();
        console.log("[Checkout] Paso 1 OK: Maquetas capturadas:", mockups.length);
      } catch (err) {
        console.error("[Checkout] Paso 1 SKIP: Error capturando maquetas (no bloquea):", err);
      }

      // ── Paso 2: Crear pedido en Supabase ──
      setProcessingStep("Creando tu pedido...");
      console.log("[Checkout] Paso 2: Creando pedido en base de datos...");
      const cartItems = items.map((item) => ({
        productId: item.productId,
        designId: item.designId,
        designImageUrl: item.designImageUrl,
        designPrompt: item.designPrompt,
        genero: item.genero,
        material: item.material,
        color: item.color,
        size: item.size,
        printPosition: item.printPosition,
        designConfig: item.designConfig as Record<string, unknown> | null,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      }));

      let result;
      try {
        result = await createOrder(shipping, cartItems);
        console.log("[Checkout] Paso 2 OK:", JSON.stringify(result));
      } catch (err) {
        console.error("[Checkout] Paso 2 ERROR: Fallo creando pedido:", err);
        setError("Error al crear el pedido. Intenta de nuevo.");
        setStep(2);
        setLoading(false);
        return;
      }

      if (result.error) {
        console.error("[Checkout] Paso 2 ERROR:", result.error);
        setError(result.error);
        setStep(2);
        setLoading(false);
        return;
      }

      // ── Paso 3: Subir assets (opcional, no bloquea) ──
      if (result.orderId && result.orderNumber) {
        setProcessingStep("Subiendo imagenes del pedido...");
        console.log("[Checkout] Paso 3: Subiendo imagenes a Supabase...");
        try {
          const assetsForm = new FormData();
          assetsForm.set("orderId", result.orderId);
          assetsForm.set("orderNumber", String(result.orderNumber));

          const firstMockup = mockups[0];
          if (firstMockup?.front) {
            assetsForm.set(
              "mockup-frente",
              new File([firstMockup.front], "mockup-frente.png", {
                type: "image/png",
              }),
            );
          }
          if (firstMockup?.back) {
            assetsForm.set(
              "mockup-espalda",
              new File([firstMockup.back], "mockup-espalda.png", {
                type: "image/png",
              }),
            );
          }

          const itemsForAssets = items.map((item) => ({
            designConfig: item.designConfig,
          }));
          assetsForm.set("items", JSON.stringify(itemsForAssets));

          await saveOrderAssets(assetsForm);
          console.log("[Checkout] Paso 3 OK: Assets guardados.");
        } catch (err) {
          console.error("[Checkout] Paso 3 SKIP: Error guardando assets (no bloquea):", err);
        }
      }

      // ── Paso 4: Obtener firma de integridad ──
      setProcessingStep("Conectando con Wompi...");

      const { reference, amountInCents } = result;

      const sigRes = await fetch("/api/wompi/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference, amountInCents }),
      });
      const sigData = await sigRes.json();

      if (!sigData.signature) {
        setError("Error al generar firma de pago. Intenta de nuevo.");
        setStep(2);
        setLoading(false);
        return;
      }

      // ── Paso 5: Abrir Widget de Wompi ──
      setProcessingStep("Abriendo pasarela de pago...");
      setLoading(false);
      setStep(2);

      const supabase = createClient();
      const userEmail = (await supabase.auth.getUser()).data.user?.email ?? "";

      const checkout = new (window as any).WidgetCheckout({
        currency: "COP",
        amountInCents,
        reference,
        publicKey: process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY,
        signature: { integrity: sigData.signature },
        redirectUrl: `${window.location.origin}/pedidos`,
        customerData: {
          email: userEmail,
          fullName: shipping.name,
          phoneNumber: shipping.whatsapp.replace(/\s/g, ""),
          phoneNumberPrefix: "+57",
        },
        shippingAddress: {
          addressLine1: `${shipping.address}, Barrio ${shipping.barrio}`,
          city: "Bogota",
          phoneNumber: shipping.whatsapp.replace(/\s/g, ""),
          region: "Cundinamarca",
          country: "CO",
        },
      });

      checkout.open(function (txResult: { transaction: { id: string } }) {
        clearCart();
        window.location.href = `/pedidos?transaccion=${txResult.transaction.id}`;
      });
    } catch (err) {
      console.error("[Checkout] ERROR GENERAL (catch global):", err);
      setError("Error inesperado. Intenta de nuevo.");
      setStep(2);
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-2">
        <div className="rounded-2xl bg-surface/40 p-5 text-text-muted backdrop-blur-xl">
          <Package className="h-10 w-10" />
        </div>
        <p className="mt-2 text-sm text-text-muted">No hay items en tu carrito.</p>
        <a href="/crear" className="mt-4">
          <Button variant="secondary">Crear diseño</Button>
        </a>
      </div>
    );
  }

  if (isAuthenticated === false) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md items-center px-4">
        <Card className="w-full">
          <div className="flex flex-col items-center py-8 text-center">
            <div className="rounded-2xl bg-cyan/[0.08] p-4">
              <LogIn className="h-10 w-10 text-cyan" />
            </div>
            <h2 className="mt-6 font-heading text-xl font-medium text-text-primary">
              Inicia sesión para completar tu pedido
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              Necesitas una cuenta para procesar tu pago y hacer seguimiento.
            </p>
            <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row">
              <a href="/auth/login?redirect=/checkout" className="flex-1">
                <Button className="w-full">
                  <LogIn className="mr-2 h-4 w-4" />
                  Iniciar sesión
                </Button>
              </a>
              <a href="/auth/registro?redirect=/checkout" className="flex-1">
                <Button variant="secondary" className="w-full">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Crear cuenta
                </Button>
              </a>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <Script src="https://checkout.wompi.co/widget.js" strategy="lazyOnload" />
      {/* Hidden TshirtPreviews for mockup capture */}
      <div
        className="pointer-events-none fixed opacity-0"
        style={{ left: -9999, top: 0, zIndex: -1 }}
        aria-hidden="true"
      >
        {items.map((item) => {
          const zones = getZonesFromConfig(item.designConfig);
          const hasFront = !!zones.pechoBolsillo || !!zones.abdominalGrande;
          const hasBack = !!zones.espaldaGrande;

          return (
            <div key={item.id}>
              {hasFront && (
                <div
                  data-mockup={`${item.id}-front`}
                  style={{ width: 640 }}
                >
                  <TshirtPreview
                    zones={zones}
                    color={item.color}
                    side="front"
                    onSideChange={() => {}}
                    abdominalTransform={
                      item.designConfig?.abdominalGrande?.transform
                    }
                    captureMode
                  />
                </div>
              )}
              {hasBack && (
                <div
                  data-mockup={`${item.id}-back`}
                  style={{ width: 640 }}
                >
                  <TshirtPreview
                    zones={zones}
                    color={item.color}
                    side="back"
                    onSideChange={() => {}}
                    espaldaTransform={
                      item.designConfig?.espaldaGrande?.transform
                    }
                    captureMode
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Stepper */}
      <div className="mb-10 flex items-center justify-center gap-3">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-3">
            <div
              className={cn(
                "flex items-center gap-2 rounded-xl px-4 py-2 text-[13px] font-medium transition-all duration-300",
                step >= s.id
                  ? "border border-cyan/30 bg-cyan/[0.08] text-cyan shadow-[0_0_24px_rgba(0,240,255,0.12)] backdrop-blur-sm"
                  : "border border-white/[0.06] bg-surface/30 text-text-muted backdrop-blur-sm",
              )}
            >
              <s.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "h-px w-8 transition-colors duration-300",
                  step > s.id
                    ? "bg-gradient-to-r from-cyan/60 to-cyan/30"
                    : "bg-elevated/30",
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-6 rounded-xl border border-magenta/20 bg-magenta/[0.07] px-4 py-3 text-sm text-magenta">
          {error}
        </div>
      )}

      {/* ───────── STEP 1: Datos de envío ───────── */}
      {step === 1 && (
        <Card>
          <h2 className="mb-2 font-heading text-xl font-medium text-text-primary">
            Datos de envío
          </h2>
          <p className="mb-6 text-sm text-text-muted">
            Solo realizamos envíos dentro de Bogotá D.C.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="name"
              label="Nombre completo"
              placeholder="Tu nombre y apellido"
              value={shipping.name}
              onChange={(e) => updateField("name", e.target.value)}
              required
            />
            <Input
              id="whatsapp"
              label="WhatsApp"
              type="tel"
              placeholder="300 123 4567"
              value={shipping.whatsapp}
              onChange={(e) => updateField("whatsapp", e.target.value)}
              required
            />
            <Input
              id="address"
              label="Dirección"
              placeholder="Calle 123 #45-67"
              value={shipping.address}
              onChange={(e) => updateField("address", e.target.value)}
              required
              className="sm:col-span-2"
            />
            <Input
              id="barrio"
              label="Barrio"
              placeholder="Nombre del barrio"
              value={shipping.barrio}
              onChange={(e) => updateField("barrio", e.target.value)}
              required
            />
            <div className="space-y-1.5">
              <label
                htmlFor="localidad"
                className="block text-[11px] font-medium uppercase tracking-wider text-text-muted"
              >
                Localidad
              </label>
              <select
                id="localidad"
                value={shipping.localidad}
                onChange={(e) => updateField("localidad", e.target.value)}
                className="w-full rounded-lg border border-elevated/60 bg-deep/80 backdrop-blur-sm px-4 py-3 text-sm text-text-primary transition-all duration-300 focus:border-cyan/50 focus:outline-none focus:ring-2 focus:ring-cyan/20 focus:shadow-[0_0_20px_rgba(0,240,255,0.08)]"
                required
              >
                <option value="" disabled>
                  Selecciona tu localidad
                </option>
                {LOCALIDADES_BOGOTA.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>
            <Input
              id="notes"
              label="Notas de entrega (opcional)"
              placeholder="Apto 301, edificio azul, llamar antes..."
              value={shipping.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              className="sm:col-span-2"
            />
          </div>

          <div className="mt-8 flex justify-end">
            <Button onClick={goToSummary}>
              Continuar
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* ───────── STEP 2: Resumen del pedido ───────── */}
      {step === 2 && (
        <div className="space-y-6">
          <Card>
            <h2 className="mb-4 font-heading text-xl font-medium text-text-primary">
              Resumen del pedido
            </h2>
            <div className="divide-y divide-elevated/50">
              {items.map((item) => {
                const activeZones = getActiveZonesFromConfig(item.designConfig);
                const bd = getDesglose(item.material, item.genero, activeZones);
                return (
                  <div key={item.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex items-start gap-4">
                      {(item.previewBase64 || item.designImageUrl) && (
                        <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-elevated bg-deep">
                          <img
                            src={item.previewBase64 ?? item.designImageUrl}
                            alt="Diseño"
                            className="h-full w-full object-contain p-1"
                          />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-text-primary">
                          Camiseta personalizada
                          {item.quantity > 1 && <span className="text-text-muted"> x{item.quantity}</span>}
                        </p>
                        <div className="mt-1.5 space-y-0.5">
                          {bd.items.map((line) => (
                            <div key={line.label} className="flex justify-between text-[11px]">
                              <span className={line.type === "estampado" ? "text-cyan" : "text-text-muted"}>
                                {line.label}
                              </span>
                              <span className="font-mono text-text-muted">{formatCOP(line.price)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <p className="shrink-0 font-mono text-sm font-medium text-text-primary">
                        {formatCOP(item.unitPrice * item.quantity)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Shipping summary */}
          <Card>
            <h3 className="mb-3 text-sm font-medium text-text-primary">
              Enviar a
            </h3>
            <div className="space-y-1 text-sm text-text-secondary">
              <p>{shipping.name}</p>
              <p>
                {shipping.address}, Barrio {shipping.barrio}
              </p>
              <p>{shipping.localidad}, Bogotá D.C.</p>
              <p>WhatsApp: {shipping.whatsapp}</p>
              {shipping.notes && (
                <p className="text-text-muted">Nota: {shipping.notes}</p>
              )}
            </div>
          </Card>

          {/* Price breakdown */}
          <Card>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Subtotal</span>
                <span className="font-mono text-text-primary">{formatCOP(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Envío Bogotá</span>
                <span className="font-mono text-text-muted">{formatCOP(ENVIO)}</span>
              </div>
              <div className="border-t border-elevated/50 pt-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-text-primary">Total</span>
                  <span className="font-heading text-xl font-medium text-cyan">
                    {formatCOP(total)}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-between gap-4">
            <Button variant="ghost" onClick={() => setStep(1)}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
            <Button onClick={handlePay} isLoading={loading} className="animate-glow-cyan-pulse">
              <ShieldCheck className="mr-2 h-4 w-4" />
              Pagar con Wompi
            </Button>
          </div>

          <p className="text-center font-mono text-[11px] text-text-muted/70">
            Se abrirá la pasarela de pago seguro de Wompi.
          </p>
        </div>
      )}

      {/* ───────── STEP 3: Procesando pago ───────── */}
      {step === 3 && (
        <Card>
          <div className="flex flex-col items-center justify-center py-16">
            <div className="rounded-2xl bg-cyan/[0.06] p-5">
              <Loader2 className="h-8 w-8 animate-spin text-cyan" />
            </div>
            <p className="mt-6 font-heading text-lg font-medium text-text-primary">
              Procesando tu pedido...
            </p>
            <p className="mt-2 text-sm text-text-muted">
              {processingStep || "Preparando..."}
            </p>
            <button
              type="button"
              onClick={cancelProcessing}
              className="mt-8 text-sm text-text-muted transition-colors hover:text-magenta"
            >
              Cancelar
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}
