"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Save, X } from "lucide-react";
import { TshirtPreview } from "@/components/design/TshirtPreview";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils/cn";
import { DESIGN_CATEGORIES, PRINT_ZONES, TSHIRT_COLORS } from "@/lib/utils/constants";
import { useDesignZones } from "@/hooks/useDesignZones";
import { createCatalogShirt } from "@/app/admin/catalogo/actions";
import type { DesignCategory } from "@/types/database";

/**
 * Arma una camisa de catálogo con el MISMO editor que usa el cliente en
 * /crear: se reusa `useDesignZones` para el manejo de imágenes y
 * `TshirtPreview` en modo interactivo (tocar la camiseta para subir,
 * arrastrar para mover, rueda/±  para escalar).
 *
 * La diferencia con /crear es qué se guarda: acá NO se piden género,
 * material ni talla, porque esos los elige el cliente al pedir la camisa
 * y son los que determinan el precio. El admin fija color y estampado.
 */
export function CatalogShirtBuilder({ onCancel }: { onCancel: () => void }) {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<DesignCategory | "">("");
  const [color, setColor] = useState<(typeof TSHIRT_COLORS)[number]>(TSHIRT_COLORS[0]);
  const [publishNow, setPublishNow] = useState(true);
  const [side, setSide] = useState<"front" | "back">("front");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    zones,
    previews,
    hasAnyImage,
    pechoTransform,
    setPechoTransform,
    abdominalTransform,
    setAbdominalTransform,
    espaldaTransform,
    setEspaldaTransform,
    handleFileSelect,
    handleRemove,
    handleRemoveBg,
    handleCancelBg,
    handleRestoreBg,
  } = useDesignZones();

  const handleSideChange = useCallback((s: "front" | "back") => setSide(s), []);

  async function handleSave() {
    if (saving) return;
    setError(null);

    if (!title.trim()) return setError("Ponle un nombre a la camisa.");
    if (!hasAnyImage) return setError("Sube al menos una imagen de estampado.");

    setSaving(true);

    const formData = new FormData();
    formData.set("title", title.trim());
    formData.set("category", category);
    formData.set("color", color.slug);
    formData.set("is_public", String(publishNow));
    formData.set("sort_order", "0");

    const transforms = {
      pechoBolsillo: pechoTransform,
      abdominalGrande: abdominalTransform,
      espaldaGrande: espaldaTransform,
    };

    for (const { key } of PRINT_ZONES) {
      const file = zones[key].file;
      if (!file) continue;
      formData.set(`zone_${key}`, file);
      formData.set(`transform_${key}`, JSON.stringify(transforms[key]));
    }

    const result = await createCatalogShirt(formData);
    setSaving(false);

    if (result.error) return setError(result.error);

    onCancel();
    router.refresh();
  }

  return (
    <div className="gradient-border gradient-border-subtle rounded-2xl bg-surface/40 p-6 backdrop-blur-xl">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="font-heading text-sm font-medium text-text-primary">
            Nueva camisa de catálogo
          </p>
          <p className="mt-0.5 text-xs text-text-secondary">
            Toca la camiseta para subir el arte; arrástralo para moverlo y usa
            ± para escalarlo. El cliente la verá exactamente así.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={saving}>
          <X className="h-4 w-4" />
          Cancelar
        </Button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-magenta/20 bg-magenta/[0.07] px-4 py-3 text-sm text-magenta">
          {error}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,380px)_1fr]">
        {/* Editor de la prenda — mismo componente que /crear */}
        <div className="flex flex-col items-center">
          <TshirtPreview
            zones={previews}
            color={color.value}
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
              onCancelBg: () => handleCancelBg("pechoBolsillo"),
              bgStatus: zones.pechoBolsillo.bgRemovalStatus,
              bgProgress: zones.pechoBolsillo.bgRemovalProgress,
              bgError: zones.pechoBolsillo.bgRemovalError,
              disabled: saving,
            }}
            abdominalUpload={{
              onFileSelect: (file) => handleFileSelect("abdominalGrande", file),
              onRemove: () => handleRemove("abdominalGrande"),
              onRemoveBg: () => handleRemoveBg("abdominalGrande"),
              onRestoreBg: () => handleRestoreBg("abdominalGrande"),
              onCancelBg: () => handleCancelBg("abdominalGrande"),
              bgStatus: zones.abdominalGrande.bgRemovalStatus,
              bgProgress: zones.abdominalGrande.bgRemovalProgress,
              bgError: zones.abdominalGrande.bgRemovalError,
              disabled: saving,
            }}
            espaldaUpload={{
              onFileSelect: (file) => handleFileSelect("espaldaGrande", file),
              onRemove: () => handleRemove("espaldaGrande"),
              onRemoveBg: () => handleRemoveBg("espaldaGrande"),
              onRestoreBg: () => handleRestoreBg("espaldaGrande"),
              onCancelBg: () => handleCancelBg("espaldaGrande"),
              bgStatus: zones.espaldaGrande.bgRemovalStatus,
              bgProgress: zones.espaldaGrande.bgRemovalProgress,
              bgError: zones.espaldaGrande.bgRemovalError,
              disabled: saving,
            }}
          />
        </div>

        {/* Datos de la camisa */}
        <div className="space-y-5">
          <div>
            <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-text-muted">
              Color de la camiseta
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {TSHIRT_COLORS.map((c) => (
                <button
                  key={c.slug}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    "h-8 w-8 rounded-full border-2 transition-all duration-200",
                    color.slug === c.slug
                      ? "scale-110 border-cyan shadow-glow-cyan"
                      : "border-elevated hover:scale-105 hover:border-text-muted",
                  )}
                  style={{ backgroundColor: c.value }}
                  aria-label={c.name}
                  title={c.name}
                />
              ))}
            </div>
            <p className="mt-1.5 text-xs text-text-muted">
              El cliente no puede cambiarlo — elige el que mejor le quede al arte.
            </p>
          </div>

          <Input
            id="shirt-title"
            label="Nombre"
            placeholder="Ej: Neón Samurái"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={80}
          />

          <div>
            <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-text-muted">
              Categoría
            </p>
            <div className="flex flex-wrap gap-2">
              <ChipButton active={category === ""} onClick={() => setCategory("")}>
                Sin categoría
              </ChipButton>
              {DESIGN_CATEGORIES.map((cat) => (
                <ChipButton
                  key={cat.value}
                  active={category === cat.value}
                  onClick={() => setCategory(cat.value)}
                >
                  {cat.label}
                </ChipButton>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-elevated/60 bg-deep/40 px-4 py-3">
            <p className="text-xs text-text-secondary">
              El cliente elegirá <span className="text-cyan">género</span>,{" "}
              <span className="text-cyan">material</span> y{" "}
              <span className="text-cyan">talla</span> al pedirla. El precio se
              calcula con eso más las zonas estampadas.
            </p>
          </div>

          <label className="flex cursor-pointer items-center gap-2.5 text-sm text-text-secondary">
            <input
              type="checkbox"
              checked={publishNow}
              onChange={(e) => setPublishNow(e.target.checked)}
              className="h-4 w-4 accent-cyan"
            />
            Publicar de una vez en /catalogo
          </label>

          <Button onClick={handleSave} isLoading={saving} className="w-full">
            {!saving && <Save className="h-4 w-4" />}
            Guardar camisa
          </Button>
        </div>
      </div>
    </div>
  );
}

function ChipButton({
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
        "rounded-lg border px-3 py-1.5 text-xs transition-all",
        active
          ? "border-cyan bg-cyan/10 text-cyan"
          : "border-elevated text-text-secondary hover:border-text-muted",
      )}
    >
      {children}
    </button>
  );
}
