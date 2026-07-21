"use client";

import { useState, useCallback } from "react";
import { TshirtPreview } from "@/components/design/TshirtPreview";
import { ImageUploadZone } from "@/components/design/ImageUploadZone";
import { SizeSelector } from "@/components/design/SizeSelector";
import { GenderSelector } from "@/components/design/GenderSelector";
import { MaterialSelector } from "@/components/design/MaterialSelector";
import { Button } from "@/components/ui/Button";
import { ShoppingCart, LogIn } from "lucide-react";
import { getDesglose, calcularSubtotal, formatCOP } from "@/lib/utils/pricing";
import { useCartStore } from "@/stores/cartStore";
import { cn } from "@/lib/utils/cn";
import { uploadDesignAndSave } from "./actions";
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
  { name: "Rojo", value: "#DC2626", slug: "rojo" },
  { name: "Azul", value: "#2563EB", slug: "azul" },
  { name: "Amarillo", value: "#EAB308", slug: "amarillo" },
  { name: "Verde", value: "#16A34A", slug: "verde" },
  { name: "Naranja", value: "#EA580C", slug: "naranja" },
  { name: "Morado", value: "#7C3AED", slug: "morado" },
];

const ZONES: { key: DesignZone; label: string; description: string; side: "front" | "back" }[] = [
  { key: "pechoBolsillo", label: "Pecho bolsillo", description: "Pequeña, arriba a la izquierda (~10×10 cm)", side: "front" },
  { key: "abdominalGrande", label: "Pecho grande", description: "Grande, centro del frente (~30×35 cm)", side: "front" },
  { key: "espaldaGrande", label: "Espalda grande", description: "Grande, centrada en la espalda (~30×35 cm)", side: "back" },
];

type BgRemovalStatus = "idle" | "processing" | "done" | "error";

interface ZoneState {
  file: File | null;
  preview: string | null;
  originalFile: File | null;
  originalPreview: string | null;
  bgRemovalStatus: BgRemovalStatus;
  bgRemovalError: string | null;
}

type ZonesMap = Record<DesignZone, ZoneState>;

const emptyZone: ZoneState = {
  file: null,
  preview: null,
  originalFile: null,
  originalPreview: null,
  bgRemovalStatus: "idle",
  bgRemovalError: null,
};

const emptyZones: ZonesMap = {
  pechoBolsillo: { ...emptyZone },
  abdominalGrande: { ...emptyZone },
  espaldaGrande: { ...emptyZone },
};

function fileToBase64Thumbnail(file: File, maxSize = 200): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas context unavailable"));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/webp", 0.7));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function CrearPage() {
  const [genero, setGenero] = useState<TshirtGenero | null>(null);
  const [material, setMaterial] = useState<TshirtMaterial | null>(null);
  const [selectedColor, setSelectedColor] = useState<ColorOption>(PRESET_COLORS[0]);
  const [size, setSize] = useState<TshirtSize | null>(null);
  const [side, setSide] = useState<"front" | "back">("front");
  const [zones, setZones] = useState<ZonesMap>({ ...emptyZones });
  const [pechoTransform, setPechoTransform] = useState<ZoneTransform>({ offsetX: 0, offsetY: 0, scale: 1 });
  const [abdominalTransform, setAbdominalTransform] = useState<ZoneTransform>({ offsetX: 0, offsetY: 0, scale: 1 });
  const [espaldaTransform, setEspaldaTransform] = useState<ZoneTransform>({ offsetX: 0, offsetY: 0, scale: 1 });
  const [isUploading, setIsUploading] = useState(false);
  const [added, setAdded] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const addItem = useCartStore((s) => s.addItem);

  const hasAnyImage = zones.pechoBolsillo.file || zones.abdominalGrande.file || zones.espaldaGrande.file;
  const canAddToCart = !!genero && !!material && !!size && !!hasAnyImage;

  const activeZones: DesignZone[] = [];
  if (zones.pechoBolsillo.file) activeZones.push("pechoBolsillo");
  if (zones.abdominalGrande.file) activeZones.push("abdominalGrande");
  if (zones.espaldaGrande.file) activeZones.push("espaldaGrande");
  const breakdown = getDesglose(material, genero, activeZones);
  const subtotal = genero && material ? calcularSubtotal(material, genero, activeZones) : 0;

  // Removing or replacing a zone's image without resetting its transform
  // left the next image inheriting the previous one's drag offset/scale —
  // it would appear pre-shifted, making it look like "moving" was broken.
  // Every new image in a zone now starts back at dead center, 100% scale.
  const resetZoneTransform = useCallback((zone: DesignZone) => {
    const defaultTransform: ZoneTransform = { offsetX: 0, offsetY: 0, scale: 1 };
    if (zone === "pechoBolsillo") setPechoTransform(defaultTransform);
    if (zone === "abdominalGrande") setAbdominalTransform(defaultTransform);
    if (zone === "espaldaGrande") setEspaldaTransform(defaultTransform);
  }, []);

  const handleFileSelect = useCallback((zone: DesignZone, file: File) => {
    const preview = URL.createObjectURL(file);
    setZones((prev) => {
      if (prev[zone].preview) URL.revokeObjectURL(prev[zone].preview!);
      if (prev[zone].originalPreview) URL.revokeObjectURL(prev[zone].originalPreview!);
      return {
        ...prev,
        [zone]: { file, preview, originalFile: null, originalPreview: null, bgRemovalStatus: "idle" as BgRemovalStatus, bgRemovalError: null },
      };
    });
    resetZoneTransform(zone);
  }, [resetZoneTransform]);

  const handleRemove = useCallback((zone: DesignZone) => {
    setZones((prev) => {
      if (prev[zone].preview) URL.revokeObjectURL(prev[zone].preview!);
      if (prev[zone].originalPreview) URL.revokeObjectURL(prev[zone].originalPreview!);
      return { ...prev, [zone]: { ...emptyZone } };
    });
    resetZoneTransform(zone);
  }, [resetZoneTransform]);

  const handleRemoveBg = useCallback(async (zone: DesignZone) => {
    const zoneState = zones[zone];
    if (!zoneState.file) return;

    setZones((prev) => ({
      ...prev,
      [zone]: { ...prev[zone], bgRemovalStatus: "processing" as BgRemovalStatus, bgRemovalError: null },
    }));

    try {
      // @ts-expect-error -- CDN import bypasses webpack bundling to avoid WASM/import.meta issues
      const { pipeline, env, RawImage } = await import(/* webpackIgnore: true */ "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3");
      env.allowLocalModels = false;

      const segmenter = await pipeline("image-segmentation", "briaai/RMBG-1.4", {
        device: "wasm",
        dtype: "q8",
      });

      const imgUrl = URL.createObjectURL(zoneState.file!);
      const output = await segmenter(imgUrl, { threshold: 0 });
      URL.revokeObjectURL(imgUrl);

      const img = await RawImage.fromBlob(zoneState.file!);
      const rawMask = output[0].mask;
      const mask = (rawMask.width !== img.width || rawMask.height !== img.height)
        ? rawMask.resize(img.width, img.height)
        : rawMask;

      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      const imageData = ctx.createImageData(img.width, img.height);

      for (let i = 0; i < img.width * img.height; i++) {
        const ch = img.channels;
        imageData.data[i * 4] = img.data[i * ch];
        imageData.data[i * 4 + 1] = img.data[i * ch + 1];
        imageData.data[i * 4 + 2] = img.data[i * ch + 2];
        imageData.data[i * 4 + 3] = mask.data[i];
      }

      ctx.putImageData(imageData, 0, 0);

      // Cap output resolution — an uncompressed alpha PNG at full phone-camera
      // resolution can hit tens of MB and blow past upload limits. 3000px is
      // still well above what's needed for a ~35cm print at print quality.
      const MAX_DIM = 3000;
      let outputCanvas: HTMLCanvasElement = canvas;
      if (canvas.width > MAX_DIM || canvas.height > MAX_DIM) {
        const scale = MAX_DIM / Math.max(canvas.width, canvas.height);
        const resized = document.createElement("canvas");
        resized.width = Math.round(canvas.width * scale);
        resized.height = Math.round(canvas.height * scale);
        resized.getContext("2d")!.drawImage(canvas, 0, 0, resized.width, resized.height);
        outputCanvas = resized;
      }

      const blob = await new Promise<Blob>((resolve) =>
        outputCanvas.toBlob((b) => resolve(b!), "image/png")
      );

      const newFile = new File([blob], zoneState.file!.name.replace(/\.\w+$/, ".png"), { type: "image/png" });
      const newPreview = URL.createObjectURL(blob);
      setZones((prev) => ({
        ...prev,
        [zone]: {
          file: newFile,
          preview: newPreview,
          originalFile: prev[zone].originalFile ?? prev[zone].file,
          originalPreview: prev[zone].originalPreview ?? prev[zone].preview,
          bgRemovalStatus: "done" as BgRemovalStatus,
          bgRemovalError: null,
        },
      }));
    } catch (err) {
      console.error("[remove-bg] Error:", err);
      setZones((prev) => ({
        ...prev,
        [zone]: {
          ...prev[zone],
          bgRemovalStatus: "error" as BgRemovalStatus,
          bgRemovalError: `Error al quitar el fondo: ${err instanceof Error ? err.message : "error desconocido"}`,
        },
      }));
    }
  }, [zones]);

  const handleRestoreBg = useCallback((zone: DesignZone) => {
    setZones((prev) => {
      const z = prev[zone];
      if (!z.originalFile || !z.originalPreview) return prev;
      if (z.preview) URL.revokeObjectURL(z.preview);
      return {
        ...prev,
        [zone]: {
          file: z.originalFile,
          preview: z.originalPreview,
          originalFile: null,
          originalPreview: null,
          bgRemovalStatus: "idle" as BgRemovalStatus,
          bgRemovalError: null,
        },
      };
    });
  }, []);

  const handleSideChange = useCallback((newSide: "front" | "back") => {
    setSide(newSide);
  }, []);

  const [showAuthModal, setShowAuthModal] = useState(false);

  async function handleAddToCart() {


    if (!canAddToCart || isUploading) return;

    setUploadError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.set("genero", genero!);
      formData.set("material", material!);
      formData.set("color", selectedColor.slug);
      formData.set("talla", size!);

      for (const zone of ZONES) {
        const zoneState = zones[zone.key];
        if (!zoneState.file) continue;
        formData.set(`zone_${zone.key}`, zoneState.file);
        if (zone.key === "pechoBolsillo") {
          formData.set(`transform_${zone.key}`, JSON.stringify(pechoTransform));
        }
        if (zone.key === "abdominalGrande") {
          formData.set(`transform_${zone.key}`, JSON.stringify(abdominalTransform));
        }
        if (zone.key === "espaldaGrande") {
          formData.set(`transform_${zone.key}`, JSON.stringify(espaldaTransform));
        }
      }


      const result = await uploadDesignAndSave(formData);


      if (result.error) {
        if (result.error === "Debes iniciar sesión.") {
          setShowAuthModal(true);
          setIsUploading(false);
          return;
        }
        setUploadError(result.error);
        setIsUploading(false);
        return;
      }

      const primaryFile =
        zones.pechoBolsillo.file ??
        zones.abdominalGrande.file ??
        zones.espaldaGrande.file;
      let previewBase64: string | undefined;
      if (primaryFile) {
        try {
          previewBase64 = await fileToBase64Thumbnail(primaryFile);
        } catch {
          console.warn("[Crear] No se pudo generar thumbnail");
        }
      }

      addItem({
        productId: "camiseta-clasica-algodon",
        designId: result.designId!,
        designImageUrl: result.primaryImageUrl!,
        designPrompt: "",
        genero: genero!,
        material: material!,
        color: selectedColor.slug,
        size: size!,
        printPosition: "pecho",
        designConfig: result.config as DesignZoneConfig,
        previewBase64,
        quantity: 1,
        unitPrice: subtotal,
      });


      setAdded(true);
      setTimeout(() => setAdded(false), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      console.error("[Crear] Error:", message);
      setUploadError(message);
    } finally {
      setIsUploading(false);
    }
  }

  function getButtonLabel(): string {
    if (added) return "¡Agregado al carrito!";
    if (isUploading) return "Subiendo imágenes...";
    if (!genero) return "Elige un género";
    if (!material) return "Elige un material";
    if (!size) return "Elige una talla";
    if (!hasAnyImage) return "Sube al menos una imagen";
    return `Agregar al carrito — ${formatCOP(subtotal)}`;
  }

  const bottomBar = (
    <div className="shrink-0 border-t border-white/[0.06] bg-void/90 px-4 py-3 space-y-2.5 shadow-[0_-8px_30px_rgba(10,10,15,0.6)] backdrop-blur-xl">
      {uploadError && (
        <div className="rounded-xl border border-magenta/20 bg-magenta/[0.07] px-3 py-2.5 text-xs text-magenta">
          {uploadError}
        </div>
      )}

      {added && (
        <div className="rounded-xl border border-cyan/20 bg-cyan/[0.07] px-3 py-2.5 text-xs text-cyan text-center">
          ¡Agregado al carrito!
        </div>
      )}

      {breakdown.items.length > 0 && (
        <div className="space-y-1">
          {breakdown.items.map((line) => (
            <div key={line.label} className="flex justify-between text-xs">
              <span className={line.type === "estampado" ? "text-cyan" : line.type === "envio" ? "text-text-muted" : "text-text-secondary"}>
                {line.label}
              </span>
              <span className="font-mono text-text-muted">{formatCOP(line.price)}</span>
            </div>
          ))}
          <div className="border-t border-elevated pt-1">
            <div className="flex justify-between text-xs">
              <span className="font-medium text-text-primary">Total</span>
              <span className="font-mono font-medium text-text-primary">{formatCOP(breakdown.total)}</span>
            </div>
          </div>
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
  );

  return (
    <div className="relative mx-auto flex h-[calc(100vh-4.25rem)] max-w-7xl flex-col">
      {showAuthModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-void/70 backdrop-blur-xl">
          <div className="gradient-border mx-4 w-full max-w-sm rounded-2xl bg-surface/50 p-8 text-center shadow-2xl shadow-void/60 backdrop-blur-xl">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan/10 text-cyan">
              <LogIn className="h-7 w-7" />
            </div>
            <h2 className="font-heading text-xl font-medium text-text-primary">
              Inicia sesión para continuar
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              Necesitas una cuenta para guardar tus diseños y hacer pedidos.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <Link href="/auth/login?redirect=/crear">
                <Button className="w-full">Iniciar sesión</Button>
              </Link>
              <Link href="/auth/registro?redirect=/crear">
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

      {/* Page title */}
      <div className="border-b border-white/[0.06] bg-deep/40 px-4 py-3 backdrop-blur-sm sm:px-6">
        <h1 className="text-center font-heading text-lg font-medium text-cyan sm:text-xl">
          Crea tu camiseta
        </h1>
      </div>

      {/*
        Two full layouts below, both always mounted and sharing the same
        state — Tailwind's `lg:` breakpoint (not JS) decides which one is
        visible, so resizing across the breakpoint never loses in-progress
        selections or uploads. Keep it that way rather than branching in JS
        on a resize listener. `bottomBar` is defined once above and reused
        by both so the price/cart UI can't drift between them.
      */}
      {/* Desktop layout — config panel + separate read-only preview panel */}
      <div className="hidden flex-1 overflow-hidden lg:flex">
        {/* Left panel — Configuration */}
        <div className="flex w-full flex-col border-r border-white/[0.06] bg-gradient-to-b from-deep/80 to-void/90 lg:w-[420px] lg:min-w-[380px]">
          <div className="flex-1 overflow-y-auto p-4">
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
                      onClick={() => setSelectedColor(c)}
                      className={cn(
                        "h-7 w-7 rounded-full border-2 transition-all duration-200",
                        selectedColor.slug === c.slug
                          ? "border-cyan shadow-glow-cyan scale-110"
                          : "border-elevated hover:border-text-muted hover:scale-105",
                      )}
                      style={{ backgroundColor: c.value }}
                      aria-label={c.name}
                      title={c.name}
                    />
                  ))}
                </div>

                <div className="flex shrink-0 overflow-hidden rounded-xl border border-elevated/60 bg-deep/50">
                  <button
                    type="button"
                    onClick={() => setSide("front")}
                    className={cn(
                      "px-3.5 py-1.5 text-xs font-medium transition-all duration-200",
                      side === "front"
                        ? "bg-cyan/[0.08] text-cyan"
                        : "text-text-muted hover:text-text-secondary",
                    )}
                  >
                    Frente
                  </button>
                  <button
                    type="button"
                    onClick={() => setSide("back")}
                    className={cn(
                      "px-3.5 py-1.5 text-xs font-medium transition-all duration-200",
                      side === "back"
                        ? "bg-cyan/[0.08] text-cyan"
                        : "text-text-muted hover:text-text-secondary",
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
                  onRemoveBg={() => handleRemoveBg(zone.key)}
                  onRestoreBg={() => handleRestoreBg(zone.key)}
                  bgRemovalStatus={zones[zone.key].bgRemovalStatus}
                  hasBgRemoved={zones[zone.key].bgRemovalStatus === "done"}
                  bgRemovalError={zones[zone.key].bgRemovalError}
                />
              ))}
            </div>
          </div>
          </div>

          {bottomBar}
        </div>

        {/* Right panel — Preview */}
        <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto p-4">
          <div className="gradient-border flex h-full flex-col rounded-2xl bg-deep/60 backdrop-blur-sm">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
              <p className="text-sm font-medium text-text-primary font-heading">Preview</p>
              <p className="font-mono text-[11px] text-text-muted">
                {size ?? "—"} / {selectedColor.name}
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
                color={selectedColor.value}
                side={side}
                onSideChange={handleSideChange}
                pechoTransform={pechoTransform}
                onPechoTransformChange={setPechoTransform}
                abdominalTransform={abdominalTransform}
                onAbdominalTransformChange={setAbdominalTransform}
                espaldaTransform={espaldaTransform}
                onEspaldaTransformChange={setEspaldaTransform}
              />
            </div>

            {/* Zone indicators */}
            <div className="border-t border-white/[0.06] px-5 py-3">
              <div className="flex flex-wrap gap-2">
                {ZONES.map((zone) => {
                  const hasImage = !!zones[zone.key].file;
                  return (
                    <span
                      key={zone.key}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] transition-colors duration-200",
                        hasImage
                          ? "border-cyan/20 bg-cyan/5 text-cyan"
                          : "border-elevated/60 text-text-muted",
                      )}
                    >
                      <span className={cn(
                        "h-1.5 w-1.5 rounded-full transition-colors duration-200",
                        hasImage ? "bg-cyan shadow-[0_0_6px_rgba(0,240,255,0.5)]" : "bg-text-muted/50",
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

      {/*
        Mobile layout — config on top, t-shirt preview with tap-to-upload
        zones right below. Passing pechoUpload/abdominalUpload/espaldaUpload
        is what switches TshirtPreview into interactive upload mode (see the
        doc comment on those props in TshirtPreview.tsx); the desktop panel
        below intentionally omits them to stay read-only.
      */}
      <div className="flex flex-1 flex-col overflow-hidden lg:hidden">
        <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-3 p-4">
          <GenderSelector value={genero} onChange={setGenero} />
          <MaterialSelector value={material} onChange={setMaterial} />

          <div>
            <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-text-muted">Color</p>
            <div className="flex flex-wrap items-center gap-1.5">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c.slug}
                  type="button"
                  onClick={() => setSelectedColor(c)}
                  className={cn(
                    "h-7 w-7 rounded-full border-2 transition-all duration-200",
                    selectedColor.slug === c.slug
                      ? "border-cyan shadow-glow-cyan scale-110"
                      : "border-elevated hover:border-text-muted hover:scale-105",
                  )}
                  style={{ backgroundColor: c.value }}
                  aria-label={c.name}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          <SizeSelector value={size} onChange={setSize} />
        </div>

        {/* T-shirt preview — upload, move and resize the print directly on the shirt */}
        <div className="flex flex-col items-center px-4 pb-1">
          <p className="mb-2 self-start text-[10px] font-medium uppercase tracking-wider text-text-muted">
            Toca la camiseta para agregar tu diseño
          </p>
          <TshirtPreview
            zones={{
              pechoBolsillo: zones.pechoBolsillo.preview,
              abdominalGrande: zones.abdominalGrande.preview,
              espaldaGrande: zones.espaldaGrande.preview,
            }}
            color={selectedColor.value}
            side={side}
            onSideChange={handleSideChange}
            pechoTransform={pechoTransform}
            onPechoTransformChange={setPechoTransform}
            abdominalTransform={abdominalTransform}
            onAbdominalTransformChange={setAbdominalTransform}
            espaldaTransform={espaldaTransform}
            onEspaldaTransformChange={setEspaldaTransform}
            pechoUpload={{
              onFileSelect: (file) => handleFileSelect("pechoBolsillo", file),
              onRemove: () => handleRemove("pechoBolsillo"),
              onRemoveBg: () => handleRemoveBg("pechoBolsillo"),
              onRestoreBg: () => handleRestoreBg("pechoBolsillo"),
              bgStatus: zones.pechoBolsillo.bgRemovalStatus,
              bgError: zones.pechoBolsillo.bgRemovalError,
              disabled: isUploading,
            }}
            abdominalUpload={{
              onFileSelect: (file) => handleFileSelect("abdominalGrande", file),
              onRemove: () => handleRemove("abdominalGrande"),
              onRemoveBg: () => handleRemoveBg("abdominalGrande"),
              onRestoreBg: () => handleRestoreBg("abdominalGrande"),
              bgStatus: zones.abdominalGrande.bgRemovalStatus,
              bgError: zones.abdominalGrande.bgRemovalError,
              disabled: isUploading,
            }}
            espaldaUpload={{
              onFileSelect: (file) => handleFileSelect("espaldaGrande", file),
              onRemove: () => handleRemove("espaldaGrande"),
              onRemoveBg: () => handleRemoveBg("espaldaGrande"),
              onRestoreBg: () => handleRestoreBg("espaldaGrande"),
              bgStatus: zones.espaldaGrande.bgRemovalStatus,
              bgError: zones.espaldaGrande.bgRemovalError,
              disabled: isUploading,
            }}
          />
        </div>
        </div>

        {bottomBar}
      </div>
    </div>
  );
}
