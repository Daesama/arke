"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ImageUploadZone } from "@/components/design/ImageUploadZone";
import { TshirtPreview } from "@/components/design/TshirtPreview";
import { Gift, CheckCircle, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { createFreeOrder } from "./actions";
import type { DesignZone } from "@/types/design";
import type { TshirtGenero, TshirtMaterial } from "@/types/database";

const MATERIALES: { value: TshirtMaterial; label: string }[] = [
  { value: "piel_de_durazno", label: "Piel de Durazno" },
  { value: "algodon_licrado", label: "Algodón Licrado" },
  { value: "seda_fria", label: "Seda Fría" },
];

const GENEROS: { value: TshirtGenero; label: string }[] = [
  { value: "mujer", label: "Mujer" },
  { value: "hombre", label: "Hombre" },
];

const COLORES = [
  { name: "Negro", value: "#1a1a1a", slug: "negro" },
  { name: "Blanco", value: "#f5f5f5", slug: "blanco" },
  { name: "Gris", value: "#6B7280", slug: "gris" },
  { name: "Rojo", value: "#DC2626", slug: "rojo" },
  { name: "Azul", value: "#2563EB", slug: "azul" },
  { name: "Amarillo", value: "#EAB308", slug: "amarillo" },
  { name: "Verde", value: "#16A34A", slug: "verde" },
  { name: "Naranja", value: "#EA580C", slug: "naranja" },
  { name: "Morado", value: "#7C3AED", slug: "morado" },
];

const TALLAS = ["XS", "S", "M", "L", "XL", "XXL"];

const ZONES: { key: DesignZone; label: string; description: string }[] = [
  { key: "pechoBolsillo", label: "Pecho bolsillo", description: "~10×10 cm" },
  { key: "abdominalGrande", label: "Pecho grande", description: "~30×35 cm" },
  { key: "espaldaGrande", label: "Espalda grande", description: "~30×35 cm" },
];

const LOCALIDADES_BOGOTA = [
  "Usaquén", "Chapinero", "Santa Fe", "San Cristóbal", "Usme",
  "Tunjuelito", "Bosa", "Kennedy", "Fontibón", "Engativá",
  "Suba", "Barrios Unidos", "Teusaquillo", "Los Mártires",
  "Antonio Nariño", "Puente Aranda", "La Candelaria",
  "Rafael Uribe Uribe", "Ciudad Bolívar", "Sumapaz",
];

interface ZoneState {
  file: File | null;
  preview: string | null;
}

export default function PedidoGratisPage() {
  const [material, setMaterial] = useState<TshirtMaterial | "">("");
  const [genero, setGenero] = useState<TshirtGenero | "">("");
  const [color, setColor] = useState("negro");
  const [talla, setTalla] = useState("");
  const [zones, setZones] = useState<Record<DesignZone, ZoneState>>({
    pechoBolsillo: { file: null, preview: null },
    abdominalGrande: { file: null, preview: null },
    espaldaGrande: { file: null, preview: null },
  });
  const [shipping, setShipping] = useState({
    name: "",
    phone: "",
    address: "",
    barrio: "",
    localidad: "",
    notes: "",
  });
  const [previewSide, setPreviewSide] = useState<"front" | "back">("front");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<number | null>(null);

  const selectedColor = COLORES.find((c) => c.slug === color)?.value ?? "#1a1a1a";
  const previewZones = {
    pechoBolsillo: zones.pechoBolsillo.preview,
    abdominalGrande: zones.abdominalGrande.preview,
    espaldaGrande: zones.espaldaGrande.preview,
  };

  function handleFileSelect(zone: DesignZone, file: File) {
    const url = URL.createObjectURL(file);
    setZones((prev) => ({
      ...prev,
      [zone]: { file, preview: url },
    }));
  }

  function handleRemove(zone: DesignZone) {
    if (zones[zone].preview) URL.revokeObjectURL(zones[zone].preview!);
    setZones((prev) => ({
      ...prev,
      [zone]: { file: null, preview: null },
    }));
  }

  const hasAnyImage = Object.values(zones).some((z) => z.file);
  const canSubmit = material && genero && talla && hasAnyImage &&
    shipping.name && shipping.phone && shipping.address &&
    shipping.barrio && shipping.localidad;

  async function handleSubmit() {
    if (!canSubmit || loading) return;
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.set("genero", genero);
    formData.set("material", material);
    formData.set("color", color);
    formData.set("talla", talla);
    formData.set("shipping_name", shipping.name);
    formData.set("shipping_phone", shipping.phone);
    formData.set("shipping_address", shipping.address);
    formData.set("shipping_barrio", shipping.barrio);
    formData.set("shipping_localidad", shipping.localidad);
    formData.set("shipping_notes", shipping.notes);

    for (const zone of ZONES) {
      const zoneState = zones[zone.key];
      if (zoneState.file) {
        formData.set(`zone_${zone.key}`, zoneState.file);
      }
    }

    const result = await createFreeOrder(formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setSuccess(result.orderNumber!);
    setLoading(false);
  }

  function handleReset() {
    Object.values(zones).forEach((z) => {
      if (z.preview) URL.revokeObjectURL(z.preview);
    });
    setMaterial("");
    setGenero("");
    setColor("negro");
    setTalla("");
    setZones({
      pechoBolsillo: { file: null, preview: null },
      abdominalGrande: { file: null, preview: null },
      espaldaGrande: { file: null, preview: null },
    });
    setShipping({ name: "", phone: "", address: "", barrio: "", localidad: "", notes: "" });
    setError(null);
    setSuccess(null);
  }

  if (success) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <Card className="max-w-md text-center">
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="rounded-2xl bg-green-400/10 p-4">
              <CheckCircle className="h-10 w-10 text-green-400" />
            </div>
            <h2 className="font-heading text-xl font-medium text-text-primary">
              Pedido creado
            </h2>
            <p className="text-sm text-text-secondary">
              Pedido <span className="font-mono text-cyan">#{success}</span> creado
              como gratuito. Ya aparece en la sección de pedidos.
            </p>
            <div className="flex gap-3 pt-2">
              <Button variant="secondary" onClick={handleReset}>
                <Gift className="mr-2 h-4 w-4" />
                Crear otro
              </Button>
              <a href="/admin/pedidos">
                <Button>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Ver pedidos
                </Button>
              </a>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-violet/10 p-2.5">
            <Gift className="h-5 w-5 text-violet" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-medium text-cyan">
              Pedido gratis
            </h1>
            <p className="mt-0.5 text-sm text-text-secondary">
              Crea pedidos sin pasar por la pasarela de pago
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-magenta/20 bg-magenta/[0.07] px-4 py-3 text-sm text-magenta">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Datos de la camiseta */}
        <Card>
          <h2 className="mb-4 font-heading text-lg font-medium text-text-primary">
            Camiseta
          </h2>

          <div className="space-y-4">
            {/* Material */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-medium uppercase tracking-wider text-text-muted">
                Material
              </label>
              <div className="flex flex-wrap gap-2">
                {MATERIALES.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setMaterial(m.value)}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-xs font-medium transition-all duration-200",
                      material === m.value
                        ? "border-cyan bg-cyan/10 text-cyan"
                        : "border-elevated bg-deep text-text-secondary hover:border-cyan/30 hover:text-text-primary",
                    )}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Genero */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-medium uppercase tracking-wider text-text-muted">
                Genero
              </label>
              <div className="flex gap-2">
                {GENEROS.map((g) => (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => setGenero(g.value)}
                    className={cn(
                      "rounded-lg border px-4 py-2 text-xs font-medium transition-all duration-200",
                      genero === g.value
                        ? "border-cyan bg-cyan/10 text-cyan"
                        : "border-elevated bg-deep text-text-secondary hover:border-cyan/30 hover:text-text-primary",
                    )}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Color */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-medium uppercase tracking-wider text-text-muted">
                Color
              </label>
              <div className="flex flex-wrap gap-1.5">
                {COLORES.map((c) => (
                  <button
                    key={c.slug}
                    type="button"
                    onClick={() => setColor(c.slug)}
                    className={cn(
                      "h-8 w-8 rounded-full border-2 transition-all duration-200",
                      color === c.slug
                        ? "border-cyan shadow-glow-cyan scale-110"
                        : "border-elevated hover:border-text-muted hover:scale-105",
                    )}
                    style={{ backgroundColor: c.value }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            {/* Talla */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-medium uppercase tracking-wider text-text-muted">
                Talla
              </label>
              <div className="flex flex-wrap gap-2">
                {TALLAS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTalla(t)}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-xs font-medium transition-all duration-200",
                      talla === t
                        ? "border-cyan bg-cyan/10 text-cyan"
                        : "border-elevated bg-deep text-text-secondary hover:border-cyan/30 hover:text-text-primary",
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Zonas de estampado */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-medium uppercase tracking-wider text-text-muted">
                Zonas de estampado
              </label>
              <div className="space-y-2">
                {ZONES.map((zone) => (
                  <ImageUploadZone
                    key={zone.key}
                    label={zone.label}
                    description={zone.description}
                    imagePreview={zones[zone.key].preview}
                    onFileSelect={(file) => handleFileSelect(zone.key, file)}
                    onRemove={() => handleRemove(zone.key)}
                  />
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Preview de la camiseta */}
        <Card>
          <h2 className="mb-4 font-heading text-lg font-medium text-text-primary">
            Preview
          </h2>
          <TshirtPreview
            zones={previewZones}
            color={selectedColor}
            side={previewSide}
            onSideChange={setPreviewSide}
          />
        </Card>

        {/* Datos de envío */}
        <Card>
          <h2 className="mb-4 font-heading text-lg font-medium text-text-primary">
            Datos de envío
          </h2>

          <div className="space-y-4">
            <Input
              id="name"
              label="Nombre completo"
              placeholder="Nombre del destinatario"
              value={shipping.name}
              onChange={(e) => setShipping((p) => ({ ...p, name: e.target.value }))}
              required
            />
            <Input
              id="phone"
              label="WhatsApp"
              type="tel"
              placeholder="300 123 4567"
              value={shipping.phone}
              onChange={(e) => setShipping((p) => ({ ...p, phone: e.target.value }))}
              required
            />
            <Input
              id="address"
              label="Dirección"
              placeholder="Calle 123 #45-67"
              value={shipping.address}
              onChange={(e) => setShipping((p) => ({ ...p, address: e.target.value }))}
              required
            />
            <Input
              id="barrio"
              label="Barrio"
              placeholder="Nombre del barrio"
              value={shipping.barrio}
              onChange={(e) => setShipping((p) => ({ ...p, barrio: e.target.value }))}
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
                onChange={(e) => setShipping((p) => ({ ...p, localidad: e.target.value }))}
                className="w-full rounded-lg border border-elevated/60 bg-deep/80 px-4 py-3 text-sm text-text-primary backdrop-blur-sm transition-all duration-300 focus:border-cyan/50 focus:outline-none focus:ring-2 focus:ring-cyan/20"
                required
              >
                <option value="" disabled>
                  Selecciona la localidad
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
              placeholder="Apto 301, edificio azul..."
              value={shipping.notes}
              onChange={(e) => setShipping((p) => ({ ...p, notes: e.target.value }))}
            />
          </div>

          <div className="mt-6 rounded-lg border border-violet/20 bg-violet/[0.06] px-4 py-3">
            <p className="text-xs text-violet">
              Este pedido se creará con total $0 y estado "pagado". No pasará por Wompi.
            </p>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            isLoading={loading}
            className="mt-6 w-full"
          >
            <Gift className="mr-2 h-4 w-4" />
            Crear pedido gratis
          </Button>
        </Card>
      </div>
    </div>
  );
}
