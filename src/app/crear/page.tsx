"use client";

import { useState, useCallback } from "react";
import { TshirtPreview } from "@/components/design/TshirtPreview";
import { ImageUploadZone } from "@/components/design/ImageUploadZone";
import { SizeSelector } from "@/components/design/SizeSelector";
import { GenderSelector } from "@/components/design/GenderSelector";
import { MaterialSelector } from "@/components/design/MaterialSelector";
import { Button } from "@/components/ui/Button";
import { ShoppingCart, Settings2, Eye, LogIn } from "lucide-react";
import { ColorPicker } from "@/components/design/ColorPicker";
import { calculatePrice, getPriceBreakdown, formatCOP } from "@/lib/utils/pricing";
import { useCartStore } from "@/stores/cartStore";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";
import type { TshirtColor, TshirtSize, TshirtGenero, TshirtMaterial } from "@/types/database";
import type { DesignZone, DesignZoneConfig, ZoneTransform } from "@/types/design";
import Link from "next/link";

interface ColorOption {
  name: string;
  value: string;
  slug: TshirtColor;
}

const PRESET_COLORS: ColorOption[] = [
  { name: "Negro", value: "#1a1a1a", slug: "negro" },
  { name: "Blanco", value: "#f5f5f5", slug: "blanco" },
  { name: "Gris", value: "#6B7280", slug: "gris" },
  { name: "Navy", value: "#1E3A5F", slug: "navy" },
];

const ZONES: { key: DesignZone; label: string; description: string; side: "front" | "back" }[] = [
  { key: "pechoBolsillo", label: "Pecho bolsillo", description: "Pequeña, arriba a la izquierda (~10×10 cm)", side: "front" },
  { key: "abdominalGrande", label: "Abdominal grande", description: "Grande, centro del frente (~30×35 cm)", side: "front" },
  { key: "espaldaGrande", label: "Espalda grande", description: "Grande, centrada en la espalda (~30×35 cm)", side: "back" },
];

interface ZoneState {
  file: File | null;
  preview: string | null;
}

type ZonesMap = Record<DesignZone, ZoneState>;

const emptyZones: ZonesMap = {
  pechoBolsillo: { file: null, preview: null },
  abdominalGrande: { file: null, preview: null },
  espaldaGrande: { file: null, preview: null },
};

export default function CrearPage() {
  const [genero, setGenero] = useState<TshirtGenero | null>(null);
  const [material, setMaterial] = useState<TshirtMaterial | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<ColorOption | null>(PRESET_COLORS[0]);
  const [customColor, setCustomColor] = useState("#8B5CF6");
  const colorHex = selectedPreset?.value ?? customColor;
  const colorName = selectedPreset?.name ?? customColor.toUpperCase();
  const colorSlug: TshirtColor = selectedPreset?.slug ?? customColor;
  const [size, setSize] = useState<TshirtSize | null>(null);
  const [side, setSide] = useState<"front" | "back">("front");
  const [zones, setZones] = useState<ZonesMap>({ ...emptyZones });
  const [activeTab, setActiveTab] = useState<"config" | "preview">("config");
  const [abdominalTransform, setAbdominalTransform] = useState<ZoneTransform>({ offsetX: 0, offsetY: 0, scale: 1 });
  const [espaldaTransform, setEspaldaTransform] = useState<ZoneTransform>({ offsetX: 0, offsetY: 0, scale: 1 });
  const [isUploading, setIsUploading] = useState(false);
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);

  const hasAnyImage = zones.pechoBolsillo.file || zones.abdominalGrande.file || zones.espaldaGrande.file;
  const hasColor = selectedPreset !== null || customColor !== "#8B5CF6";
  const canAddToCart = !!genero && !!material && hasColor && !!size && !!hasAnyImage;

  const activeZones: DesignZone[] = [];
  if (zones.pechoBolsillo.file) activeZones.push("pechoBolsillo");
  if (zones.abdominalGrande.file) activeZones.push("abdominalGrande");
  if (zones.espaldaGrande.file) activeZones.push("espaldaGrande");
  const priceBreakdown = getPriceBreakdown(activeZones);
  const totalPrice = calculatePrice(activeZones);

  const handleFileSelect = useCallback((zone: DesignZone, file: File) => {
    const preview = URL.createObjectURL(file);
    setZones((prev) => ({
      ...prev,
      [zone]: { file, preview },
    }));
  }, []);

  const handleRemove = useCallback((zone: DesignZone) => {
    setZones((prev) => {
      if (prev[zone].preview) URL.revokeObjectURL(prev[zone].preview!);
      return { ...prev, [zone]: { file: null, preview: null } };
    });
  }, []);

  const handleSideChange = useCallback((newSide: "front" | "back") => {
    setSide(newSide);
  }, []);

  const [showAuthModal, setShowAuthModal] = useState(false);

  async function handleAddToCart() {
    if (!canAddToCart || isUploading) return;

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    setIsUploading(true);
    try {
      const designId = crypto.randomUUID();
      const config: DesignZoneConfig = {};
      let primaryImageUrl = "";

      for (const zone of ZONES) {
        const zoneState = zones[zone.key];
        if (!zoneState.file) continue;

        const ext = zoneState.file.name.split(".").pop() ?? "png";
        const path = `${user.id}/${designId}/${zone.key}.${ext}`;

        const { error } = await supabase.storage
          .from("designs")
          .upload(path, zoneState.file, { contentType: zoneState.file.type });

        if (error) throw error;

        const { data: urlData } = supabase.storage
          .from("designs")
          .getPublicUrl(path);

        config[zone.key] = {
          imageUrl: urlData.publicUrl,
          enabled: true,
          ...(zone.key === "abdominalGrande" ? { transform: abdominalTransform } : {}),
          ...(zone.key === "espaldaGrande" ? { transform: espaldaTransform } : {}),
        };

        if (!primaryImageUrl) primaryImageUrl = urlData.publicUrl;
      }

      const { error: dbError } = await supabase.from("designs").insert({
        id: designId,
        user_id: user.id,
        prompt: "",
        image_url: primaryImageUrl,
        image_path: `${user.id}/${designId}`,
        config: {
          genero,
          material,
          color: colorSlug,
          talla: size,
          zones: config,
        },
        is_catalog: false,
        is_public: false,
      });

      if (dbError) throw dbError;

      addItem({
        productId: "camiseta-clasica-algodon",
        designId,
        designImageUrl: primaryImageUrl,
        designPrompt: "",
        genero: genero!,
        material: material!,
        color: colorSlug,
        size: size!,
        printPosition: "pecho",
        designConfig: config,
        quantity: 1,
        unitPrice: totalPrice,
      });

      setAdded(true);
      setTimeout(() => setAdded(false), 2500);
    } catch (err) {
      console.error("Error al subir diseño:", err);
    } finally {
      setIsUploading(false);
    }
  }

  function getButtonLabel(): string {
    if (added) return "¡Agregado al carrito!";
    if (isUploading) return "Subiendo imágenes...";
    if (!genero) return "Elegí un género";
    if (!material) return "Elegí un material";
    if (!size) return "Elegí una talla";
    if (!hasAnyImage) return "Subí al menos una imagen";
    return `Agregar al carrito — ${formatCOP(totalPrice)}`;
  }

  return (
    <div className="relative mx-auto flex h-[calc(100vh-4rem)] max-w-7xl flex-col">
      {showAuthModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-void/80 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-xl border border-elevated bg-surface p-6 text-center shadow-glow-cyan">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-cyan/10 text-cyan">
              <LogIn className="h-7 w-7" />
            </div>
            <h2 className="font-heading text-xl font-medium text-text-primary">
              Iniciá sesión para continuar
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              Necesitás una cuenta para guardar tus diseños y hacer pedidos.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <Link href="/auth/login">
                <Button className="w-full">Iniciar sesión</Button>
              </Link>
              <Link href="/auth/registro">
                <Button variant="secondary" className="w-full">
                  Crear cuenta
                </Button>
              </Link>
              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                className="mt-1 text-sm text-text-muted hover:text-text-secondary transition-colors"
              >
                Seguir diseñando
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile tabs */}
      <div className="flex border-b border-elevated lg:hidden">
        <button
          type="button"
          onClick={() => setActiveTab("config")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 py-3 text-sm transition-colors",
            activeTab === "config"
              ? "border-b-2 border-cyan text-cyan"
              : "text-text-secondary",
          )}
        >
          <Settings2 className="h-4 w-4" />
          Configurar
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("preview")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 py-3 text-sm transition-colors",
            activeTab === "preview"
              ? "border-b-2 border-cyan text-cyan"
              : "text-text-secondary",
          )}
        >
          <Eye className="h-4 w-4" />
          Preview
          {hasAnyImage && <span className="h-2 w-2 rounded-full bg-cyan" />}
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel — Configuration */}
        <div
          className={cn(
            "flex flex-col border-r border-elevated lg:w-[420px] lg:min-w-[380px]",
            activeTab === "config" ? "flex w-full" : "hidden lg:flex",
          )}
        >
          <div className="flex-1 overflow-y-auto p-3">
          <div className="flex flex-col gap-3">
            {/* 1. Gender */}
            <GenderSelector value={genero} onChange={setGenero} />

            {/* 2. Material */}
            <MaterialSelector value={material} onChange={setMaterial} />

            {/* 3. Color + View toggle row */}
            <div>
              <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-text-muted">Color</p>
              <div className="flex items-center gap-3">
                <div className="flex flex-1 flex-wrap items-center gap-1.5">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c.slug}
                      type="button"
                      onClick={() => setSelectedPreset(c)}
                      className={cn(
                        "h-7 w-7 rounded-full border-2 transition-all duration-200",
                        selectedPreset?.slug === c.slug
                          ? "border-cyan shadow-glow-cyan scale-110"
                          : "border-elevated hover:border-text-muted hover:scale-105",
                      )}
                      style={{ backgroundColor: c.value }}
                      aria-label={c.name}
                      title={c.name}
                    />
                  ))}

                  {!selectedPreset && (
                    <button
                      type="button"
                      className="h-7 w-7 rounded-full border-2 border-cyan shadow-glow-cyan scale-110 transition-all duration-200"
                      style={{ backgroundColor: customColor }}
                      aria-label="Color personalizado seleccionado"
                      title={customColor}
                    />
                  )}

                  <ColorPicker
                    value={customColor}
                    onChange={(hex) => {
                      setCustomColor(hex);
                      setSelectedPreset(null);
                    }}
                  />
                </div>

                <div className="flex shrink-0 overflow-hidden rounded-lg border border-elevated">
                  <button
                    type="button"
                    onClick={() => setSide("front")}
                    className={cn(
                      "px-3 py-1.5 text-xs transition-all",
                      side === "front"
                        ? "bg-cyan/10 text-cyan"
                        : "text-text-secondary hover:text-text-primary",
                    )}
                  >
                    Frente
                  </button>
                  <button
                    type="button"
                    onClick={() => setSide("back")}
                    className={cn(
                      "px-3 py-1.5 text-xs transition-all",
                      side === "back"
                        ? "bg-cyan/10 text-cyan"
                        : "text-text-secondary hover:text-text-primary",
                    )}
                  >
                    Espalda
                  </button>
                </div>
              </div>
            </div>

            {/* 4. Size selector */}
            <SizeSelector value={size} onChange={setSize} />

            {/* 5. Upload zones */}
            <div className="space-y-2">
              <p className="text-[10px] font-medium uppercase tracking-wider text-text-muted">Zonas de estampado</p>
              {ZONES.map((zone) => (
                <ImageUploadZone
                  key={zone.key}
                  label={zone.label}
                  description={zone.description}
                  imagePreview={zones[zone.key].preview}
                  onFileSelect={(file) => handleFileSelect(zone.key, file)}
                  onRemove={() => handleRemove(zone.key)}
                  disabled={isUploading}
                />
              ))}
            </div>
          </div>
          </div>

          {/* Bottom — Price + Add to cart */}
          <div className="shrink-0 border-t border-elevated bg-void px-3 py-2.5 space-y-2">
            {hasAnyImage && (
              <div className="flex items-center justify-between text-xs">
                <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                  {priceBreakdown.items.map((item) => (
                    <span key={item.label} className="text-text-muted">
                      {item.label}: <span className="font-mono">{formatCOP(item.price)}</span>
                    </span>
                  ))}
                </div>
                <span className="shrink-0 font-mono font-medium text-cyan">{formatCOP(priceBreakdown.total)}</span>
              </div>
            )}

            <Button
              onClick={handleAddToCart}
              className="w-full"
              variant={added ? "secondary" : "primary"}
              disabled={!canAddToCart || isUploading}
              isLoading={isUploading}
            >
              {!isUploading && <ShoppingCart className="h-4 w-4" />}
              {getButtonLabel()}
            </Button>
          </div>
        </div>

        {/* Right panel — Preview */}
        <div
          className={cn(
            "flex flex-1 flex-col items-center justify-center overflow-y-auto p-4 lg:block",
            activeTab === "preview" ? "block" : "hidden",
          )}
        >
          <div className="flex h-full flex-col rounded-xl border border-elevated bg-deep">
            <div className="flex items-center justify-between border-b border-elevated px-4 py-3">
              <p className="text-sm font-medium text-text-primary font-heading">Preview</p>
              <p className="font-mono text-xs text-text-muted">
                {size ?? "—"} / {colorName}
                {genero ? ` / ${genero === "mujer" ? "Mujer" : "Hombre"}` : ""}
              </p>
            </div>

            <div className="flex flex-1 items-center justify-center p-6">
              <TshirtPreview
                zones={{
                  pechoBolsillo: zones.pechoBolsillo.preview,
                  abdominalGrande: zones.abdominalGrande.preview,
                  espaldaGrande: zones.espaldaGrande.preview,
                }}
                color={colorHex}
                side={side}
                onSideChange={handleSideChange}
                abdominalTransform={abdominalTransform}
                onAbdominalTransformChange={setAbdominalTransform}
                espaldaTransform={espaldaTransform}
                onEspaldaTransformChange={setEspaldaTransform}
              />
            </div>

            {/* Zone indicators */}
            <div className="border-t border-elevated px-4 py-3">
              <div className="flex flex-wrap gap-2">
                {ZONES.map((zone) => {
                  const hasImage = !!zones[zone.key].file;
                  return (
                    <span
                      key={zone.key}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px]",
                        hasImage
                          ? "border-cyan/30 bg-cyan/5 text-cyan"
                          : "border-elevated text-text-muted",
                      )}
                    >
                      <span className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        hasImage ? "bg-cyan" : "bg-text-muted",
                      )} />
                      {zone.label}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
