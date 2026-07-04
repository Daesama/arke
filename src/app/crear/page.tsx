"use client";

import { useState, useCallback, useEffect } from "react";
import { TshirtPreview } from "@/components/design/TshirtPreview";
import { ImageUploadZone } from "@/components/design/ImageUploadZone";
import { SizeSelector } from "@/components/design/SizeSelector";
import { Button } from "@/components/ui/Button";
import { ShoppingCart, Settings2, Eye, LogIn } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";
import type { TshirtColor, TshirtSize } from "@/types/database";
import type { DesignZone, DesignZoneConfig } from "@/types/design";
import Link from "next/link";

interface ColorOption {
  name: string;
  value: string;
  slug: TshirtColor;
}

const COLORS: ColorOption[] = [
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
  const [color, setColor] = useState(COLORS[0]);
  const [size, setSize] = useState<TshirtSize>("M");
  const [side, setSide] = useState<"front" | "back">("front");
  const [zones, setZones] = useState<ZonesMap>({ ...emptyZones });
  const [activeTab, setActiveTab] = useState<"config" | "preview">("config");
  const [isUploading, setIsUploading] = useState(false);
  const [added, setAdded] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    }).catch(() => {
      setIsAuthenticated(false);
    });
  }, []);

  const hasAnyImage = zones.pechoBolsillo.file || zones.abdominalGrande.file || zones.espaldaGrande.file;

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

  async function handleAddToCart() {
    if (!hasAnyImage || isUploading) return;

    setIsUploading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

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
          zones: config,
          color: color.slug,
          size,
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
        color: color.slug,
        size,
        printPosition: "pecho",
        designConfig: config,
        quantity: 1,
        unitPrice: 4500000,
      });

      setAdded(true);
      setTimeout(() => setAdded(false), 2500);
    } catch (err) {
      console.error("Error al subir diseño:", err);
    } finally {
      setIsUploading(false);
    }
  }

  if (isAuthenticated === null) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex h-[calc(100vh-4rem)] max-w-7xl flex-col">
      {!isAuthenticated && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-void/80 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-xl border border-elevated bg-surface p-6 text-center shadow-glow-cyan">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-cyan/10 text-cyan">
              <LogIn className="h-7 w-7" />
            </div>
            <h2 className="font-heading text-xl font-medium text-text-primary">
              Iniciá sesión para crear
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
            "flex flex-col overflow-y-auto border-r border-elevated p-4 lg:block lg:w-[420px] lg:min-w-[380px]",
            activeTab === "config" ? "block w-full" : "hidden",
          )}
        >
          <div className="space-y-5">
            {/* Color selector */}
            <div>
              <p className="mb-2 text-xs font-medium text-text-secondary">Color de camiseta</p>
              <div className="flex items-center gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c.slug}
                    type="button"
                    onClick={() => setColor(c)}
                    className={cn(
                      "h-8 w-8 rounded-full border-2 transition-all duration-200",
                      color.slug === c.slug
                        ? "border-cyan shadow-glow-cyan scale-110"
                        : "border-elevated hover:border-text-muted hover:scale-105",
                    )}
                    style={{ backgroundColor: c.value }}
                    aria-label={c.name}
                    title={c.name}
                  />
                ))}
                <span className="ml-2 text-xs text-text-muted">{color.name}</span>
              </div>
            </div>

            {/* View toggle */}
            <div>
              <p className="mb-2 text-xs font-medium text-text-secondary">Vista</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSide("front")}
                  className={cn(
                    "rounded-lg border px-4 py-2 text-sm transition-all",
                    side === "front"
                      ? "border-cyan bg-cyan/10 text-cyan"
                      : "border-elevated text-text-secondary hover:border-text-muted",
                  )}
                >
                  Frente
                </button>
                <button
                  type="button"
                  onClick={() => setSide("back")}
                  className={cn(
                    "rounded-lg border px-4 py-2 text-sm transition-all",
                    side === "back"
                      ? "border-cyan bg-cyan/10 text-cyan"
                      : "border-elevated text-text-secondary hover:border-text-muted",
                  )}
                >
                  Espalda
                </button>
              </div>
            </div>

            {/* Upload zones */}
            <div>
              <p className="mb-2 text-xs font-medium text-text-secondary">Zonas de estampado</p>
              <div className="space-y-3">
                {ZONES.map((zone, i) => {
                  const prevSide = i > 0 ? ZONES[i - 1].side : null;
                  const showHeader = zone.side !== prevSide;
                  return (
                    <div key={zone.key}>
                      {showHeader && (
                        <p className="mb-1.5 mt-1 text-[10px] text-text-muted uppercase tracking-wider font-mono">
                          {zone.side === "front" ? "Frente" : "Espalda"}
                        </p>
                      )}
                      <ImageUploadZone
                        label={zone.label}
                        description={zone.description}
                        imagePreview={zones[zone.key].preview}
                        onFileSelect={(file) => handleFileSelect(zone.key, file)}
                        onRemove={() => handleRemove(zone.key)}
                        disabled={isUploading}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Size selector */}
            <SizeSelector value={size} onChange={setSize} />

            {/* Add to cart */}
            <Button
              onClick={handleAddToCart}
              size="lg"
              className="w-full"
              variant={added ? "secondary" : "primary"}
              disabled={!hasAnyImage || isUploading}
              isLoading={isUploading}
            >
              {!isUploading && <ShoppingCart className="h-4 w-4" />}
              {added
                ? "¡Agregado al carrito!"
                : isUploading
                  ? "Subiendo imágenes..."
                  : "Agregar al carrito — $45,000"}
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
                {size} / {color.name}
              </p>
            </div>

            <div className="flex flex-1 items-center justify-center p-6">
              <TshirtPreview
                zones={{
                  pechoBolsillo: zones.pechoBolsillo.preview,
                  abdominalGrande: zones.abdominalGrande.preview,
                  espaldaGrande: zones.espaldaGrande.preview,
                }}
                color={color.value}
                side={side}
                onSideChange={handleSideChange}
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
