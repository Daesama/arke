"use client";

import { useRef, useCallback, useState, useId } from "react";
import { cn } from "@/lib/utils/cn";
import { RotateCcw, Move, Minus, Plus, Upload, X, Loader2, Undo2, Eraser } from "lucide-react";
import type { ZoneTransform, BgRemovalStatus } from "@/types/design";

interface ZoneImages {
  pechoBolsillo: string | null;
  abdominalGrande: string | null;
  espaldaGrande: string | null;
}

interface ZoneUploadHandlers {
  onFileSelect: (file: File) => void;
  onRemove: () => void;
  onRemoveBg?: () => void;
  onRestoreBg?: () => void;
  bgStatus?: BgRemovalStatus;
  bgError?: string | null;
  disabled?: boolean;
}

interface TshirtPreviewProps {
  zones: ZoneImages;
  color: string;
  side: "front" | "back";
  onSideChange: (side: "front" | "back") => void;
  pechoTransform?: ZoneTransform;
  onPechoTransformChange?: (transform: ZoneTransform) => void;
  abdominalTransform?: ZoneTransform;
  onAbdominalTransformChange?: (transform: ZoneTransform) => void;
  espaldaTransform?: ZoneTransform;
  onEspaldaTransformChange?: (transform: ZoneTransform) => void;
  captureMode?: boolean;
  /**
   * Presence of these props is the on/off switch for "interactive upload" mode.
   * Pass them (from the mobile layout in crear/page.tsx) to get a tap-to-upload
   * placeholder drawn directly on the shirt for an empty zone, plus a remove
   * button and a background-removal toggle on an already-uploaded image.
   * Omit them (desktop's read-only right-hand preview panel) to fall back to
   * the plain "Sube una imagen..." text and no upload/remove affordances —
   * same SVG and drag/scale logic either way, just without the upload UI.
   */
  pechoUpload?: ZoneUploadHandlers;
  abdominalUpload?: ZoneUploadHandlers;
  espaldaUpload?: ZoneUploadHandlers;
}

function UploadPlaceholder({
  label,
  compact,
  disabled,
  onFileSelect,
}: {
  label: string;
  compact?: boolean;
  disabled?: boolean;
  onFileSelect: (file: File) => void;
}) {
  return (
    <label
      className={cn(
        "flex h-full w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-cyan/40 bg-void/50 text-center backdrop-blur-sm transition-all duration-200 active:scale-95 active:border-cyan/70",
        disabled && "pointer-events-none opacity-40",
      )}
    >
      <Upload className={compact ? "h-3 w-3 text-cyan/70" : "h-4 w-4 text-cyan/70"} />
      {!compact && (
        <span className="px-1 text-[9px] font-medium leading-tight text-cyan/70">{label}</span>
      )}
      <input
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFileSelect(file);
          e.target.value = "";
        }}
        aria-label={`Agregar imagen para ${label}`}
      />
    </label>
  );
}

const DEFAULT_TRANSFORM: ZoneTransform = { offsetX: 0, offsetY: 0, scale: 1 };
const SCALE_MIN = 0.4;
const SCALE_MAX = 1.6;
const SCALE_STEP = 0.05;

type DragZone = "pecho" | "abdominal" | "espalda" | null;

function adjustColor(hex: string, amount: number): string {
  const n = parseInt(hex.replace("#", "").slice(0, 6), 16) || 0;
  const r = Math.max(0, Math.min(255, ((n >> 16) & 0xff) + amount));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 0xff) + amount));
  const b = Math.max(0, Math.min(255, (n & 0xff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

export function TshirtPreview({
  zones,
  color,
  side,
  onSideChange,
  pechoTransform,
  onPechoTransformChange,
  abdominalTransform,
  onAbdominalTransformChange,
  espaldaTransform,
  onEspaldaTransformChange,
  captureMode,
  pechoUpload,
  abdominalUpload,
  espaldaUpload,
}: TshirtPreviewProps) {
  // Desktop and mobile layouts both mount a TshirtPreview at the same time
  // (visibility toggled via CSS, see crear/page.tsx) — a hardcoded gradient
  // id would collide between the two instances and one of them would fail
  // to paint its fill. useId keeps each instance's gradient unique.
  const gradId = `tshirtGrad-${useId().replace(/:/g, "")}`;

  const hasAnyFrontImage = zones.pechoBolsillo || zones.abdominalGrande;
  const hasBackImage = !!zones.espaldaGrande;

  const pechoT = pechoTransform ?? DEFAULT_TRANSFORM;
  const abdT = abdominalTransform ?? DEFAULT_TRANSFORM;
  const espT = espaldaTransform ?? DEFAULT_TRANSFORM;

  const containerRef = useRef<HTMLDivElement>(null);
  const activeZoneRef = useRef<DragZone>(null);
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });
  const [draggingZone, setDraggingZone] = useState<DragZone>(null);

  const getHandler = useCallback((zone: DragZone) => {
    if (zone === "pecho") return { transform: pechoT, onChange: onPechoTransformChange };
    if (zone === "abdominal") return { transform: abdT, onChange: onAbdominalTransformChange };
    if (zone === "espalda") return { transform: espT, onChange: onEspaldaTransformChange };
    return null;
  }, [pechoT, abdT, espT, onPechoTransformChange, onAbdominalTransformChange, onEspaldaTransformChange]);

  const handlePointerDown = useCallback(
    (zone: DragZone, e: React.PointerEvent) => {
      const h = getHandler(zone);
      if (!h?.onChange) return;
      e.preventDefault();
      e.stopPropagation();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      activeZoneRef.current = zone;
      setDraggingZone(zone);
      dragStart.current = { x: e.clientX, y: e.clientY, ox: h.transform.offsetX, oy: h.transform.offsetY };
    },
    [getHandler],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const zone = activeZoneRef.current;
      if (!zone || !containerRef.current) return;
      const h = getHandler(zone);
      if (!h?.onChange) return;
      e.preventDefault();
      const rect = containerRef.current.getBoundingClientRect();
      const dx = ((e.clientX - dragStart.current.x) / rect.width) * 100;
      const dy = ((e.clientY - dragStart.current.y) / rect.height) * 100;
      h.onChange({
        ...h.transform,
        offsetX: Math.round(Math.max(-20, Math.min(20, dragStart.current.ox + dx)) * 10) / 10,
        offsetY: Math.round(Math.max(-20, Math.min(40, dragStart.current.oy + dy)) * 10) / 10,
      });
    },
    [getHandler],
  );

  const handlePointerUp = useCallback(() => {
    activeZoneRef.current = null;
    setDraggingZone(null);
  }, []);

  const handleScale = useCallback(
    (zone: DragZone, delta: number) => {
      const h = getHandler(zone);
      if (!h?.onChange) return;
      const newScale = Math.max(SCALE_MIN, Math.min(SCALE_MAX, h.transform.scale + delta));
      h.onChange({ ...h.transform, scale: Math.round(newScale * 100) / 100 });
    },
    [getHandler],
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (side === "front" && zones.abdominalGrande && onAbdominalTransformChange) {
        e.preventDefault();
        handleScale("abdominal", e.deltaY > 0 ? -SCALE_STEP : SCALE_STEP);
      } else if (side === "back" && zones.espaldaGrande && onEspaldaTransformChange) {
        e.preventDefault();
        handleScale("espalda", e.deltaY > 0 ? -SCALE_STEP : SCALE_STEP);
      }
    },
    [side, zones, onAbdominalTransformChange, onEspaldaTransformChange, handleScale],
  );

  const showPechoScale = side === "front" && !!zones.pechoBolsillo && !!onPechoTransformChange;
  const showAbdominalScale = side === "front" && !!zones.abdominalGrande && !!onAbdominalTransformChange;
  const showEspaldaScale = side === "back" && !!zones.espaldaGrande && !!onEspaldaTransformChange;

  const scaleControls: { key: "pecho" | "abdominal" | "espalda"; label: string; transform: ZoneTransform; onChange: (t: ZoneTransform) => void; upload?: ZoneUploadHandlers }[] = [];
  if (showPechoScale) scaleControls.push({ key: "pecho", label: "Pecho bolsillo", transform: pechoT, onChange: onPechoTransformChange!, upload: pechoUpload });
  if (showAbdominalScale) scaleControls.push({ key: "abdominal", label: "Pecho grande", transform: abdT, onChange: onAbdominalTransformChange!, upload: abdominalUpload });
  if (showEspaldaScale) scaleControls.push({ key: "espalda", label: "Espalda grande", transform: espT, onChange: onEspaldaTransformChange!, upload: espaldaUpload });

  const shadow = adjustColor(color, -30);
  const highlight = adjustColor(color, 12);
  const seam = adjustColor(color, -45);
  const collar = adjustColor(color, -60);
  const collarInner = adjustColor(color, -80);

  // Realistic t-shirt outline — sleeves drape naturally at ~45° angle
  const bodyPath =
    "M124,62 C108,56 84,62 68,76" +          // left collar → left shoulder
    " Q42,96 20,140" +                         // left sleeve outer — natural 45° drape
    " C12,158 16,168 28,164" +                 // left sleeve tip — rounded hem
    " Q50,152 70,168" +                         // left sleeve inner → armpit
    " C66,230 62,310 62,385" +                 // left body side
    " Q62,405 80,406" +                         // left hem corner
    " L240,406" +                               // bottom hem
    " Q258,405 258,385" +                       // right hem corner
    " C258,310 254,230 250,168" +              // right body side
    " Q270,152 292,164" +                       // right armpit → right sleeve inner
    " C304,168 308,158 300,140" +              // right sleeve tip — rounded hem
    " Q278,96 252,76" +                         // right sleeve outer
    " C236,62 212,56 196,62";                   // right shoulder → right collar

  const frontCollar =
    " C190,78 178,90 160,92" +
    " C142,90 130,78 124,62 Z";

  const backCollar =
    " C192,72 180,78 160,80" +
    " C140,78 128,72 124,62 Z";

  return (
    <div className="relative flex flex-col items-center">
      {!captureMode && (
        <div className="mb-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => onSideChange("front")}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs transition-all",
              side === "front"
                ? "bg-cyan/10 text-cyan border border-cyan"
                : "border border-elevated text-text-secondary hover:border-text-muted",
            )}
          >
            Frente
          </button>
          <button
            type="button"
            onClick={() => onSideChange("back")}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs transition-all",
              side === "back"
                ? "bg-cyan/10 text-cyan border border-cyan"
                : "border border-elevated text-text-secondary hover:border-text-muted",
            )}
          >
            Espalda
          </button>
          <button
            type="button"
            onClick={() => onSideChange(side === "front" ? "back" : "front")}
            className="ml-1 rounded-lg border border-elevated p-1.5 text-text-muted transition-colors hover:border-text-muted hover:text-text-secondary"
            aria-label="Voltear camiseta"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/*
        touch-none (touch-action: none) below and on each draggable zone is
        required for a usable drag on touch devices: without it, the browser
        treats a finger-down-and-move here as a page-scroll gesture and the
        image drag loses the touch mid-gesture. The Move badge on each image
        is also marked pointer-events-none so a touch starting exactly on
        that little overlay hits the zone div underneath instead of the
        badge — one consistent drag target instead of two nested ones with
        their own touch-action/pointer-capture edge cases.
      */}
      <div
        ref={containerRef}
        className={cn("relative aspect-[3/4] w-full touch-none", !captureMode && "max-w-[320px]")}
        onWheel={handleWheel}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <svg
          viewBox="0 0 320 420"
          className="h-full w-full"
          style={{ filter: "drop-shadow(0 6px 20px rgba(0,0,0,0.35))" }}
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={shadow} />
              <stop offset="18%" stopColor={color} />
              <stop offset="45%" stopColor={highlight} />
              <stop offset="82%" stopColor={color} />
              <stop offset="100%" stopColor={shadow} />
            </linearGradient>
          </defs>

          {/* Main shape */}
          <path
            d={bodyPath + (side === "front" ? frontCollar : backCollar)}
            fill={`url(#${gradId})`}
            stroke={seam}
            strokeWidth="1"
            strokeLinejoin="round"
          />

          {/* Collar ring */}
          {side === "front" ? (
            <>
              <path
                d="M124,62 C130,78 142,90 160,92 C178,90 190,78 196,62 C192,58 182,54 160,54 C138,54 128,58 124,62 Z"
                fill={collar}
                stroke={seam}
                strokeWidth="0.6"
              />
              <path
                d="M130,64 C135,76 146,86 160,88 C174,86 185,76 190,64 C186,60 176,58 160,58 C144,58 134,60 130,64 Z"
                fill={collarInner}
              />
            </>
          ) : (
            <path
              d="M124,62 C128,72 140,78 160,80 C180,78 192,72 196,62 C192,58 182,54 160,54 C138,54 128,58 124,62 Z"
              fill={collar}
              stroke={seam}
              strokeWidth="0.6"
            />
          )}

          {/* Subtle center seam */}
          <line x1="160" y1={side === "front" ? "92" : "80"} x2="160" y2="400" stroke={seam} strokeWidth="0.3" strokeDasharray="6,10" opacity="0.25" />

          {/* Bottom hem seam */}
          <path d="M80,404 Q160,410 240,404" stroke={seam} strokeWidth="0.5" fill="none" opacity="0.35" />

          {/* Sleeve hem seams */}
          <path d="M20,140 C24,158 28,164 28,164" stroke={seam} strokeWidth="0.4" fill="none" opacity="0.3" />
          <path d="M300,140 C296,158 292,164 292,164" stroke={seam} strokeWidth="0.4" fill="none" opacity="0.3" />
        </svg>

        {/*
          Design overlays — top/left/width below are hand-tuned percentages of
          this container, eyeballed against the bodyPath SVG above (viewBox
          320x420), not derived from it. The same numbers are reused for both
          the empty-zone upload placeholder and the uploaded image, so each
          zone only has one "home" position to keep in sync. If bodyPath ever
          changes shape, re-check these visually — nothing enforces the match.
        */}
        {side === "front" && (
          <>
            {zones.pechoBolsillo && (
              <div
                className={cn(
                  "absolute select-none touch-none",
                  draggingZone === "pecho" ? "cursor-grabbing" : "cursor-grab",
                  draggingZone !== "pecho" && "transition-all duration-150",
                )}
                style={{
                  top: `calc(24% + ${pechoT.offsetY}%)`,
                  left: `calc(27% + ${pechoT.offsetX}%)`,
                  width: `${15 * pechoT.scale}%`,
                }}
                onPointerDown={(e) => handlePointerDown("pecho", e)}
              >
                <img
                  src={zones.pechoBolsillo}
                  alt="Pecho bolsillo"
                  className="pointer-events-none h-auto w-full object-contain drop-shadow-lg"
                  draggable={false}
                />
                {onPechoTransformChange && !captureMode && (
                  <div className="pointer-events-none absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-cyan/80 text-void shadow-md">
                    <Move className="h-3 w-3" />
                  </div>
                )}
                {pechoUpload && !captureMode && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); pechoUpload.onRemove(); }}
                    onPointerDown={(e) => e.stopPropagation()}
                    disabled={pechoUpload.disabled}
                    className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-elevated bg-void/90 text-text-muted shadow-md transition-colors hover:border-magenta/40 hover:text-magenta"
                    aria-label="Eliminar pecho bolsillo"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            )}
            {!zones.pechoBolsillo && pechoUpload && (
              <div className="absolute aspect-square" style={{ top: "24%", left: "27%", width: "15%" }}>
                <UploadPlaceholder
                  label="Pecho bolsillo"
                  compact
                  disabled={pechoUpload.disabled}
                  onFileSelect={pechoUpload.onFileSelect}
                />
              </div>
            )}
            {zones.abdominalGrande && (
              <div
                className={cn(
                  "absolute left-1/2 select-none touch-none",
                  draggingZone === "abdominal" ? "cursor-grabbing" : "cursor-grab",
                  draggingZone !== "abdominal" && "transition-all duration-150",
                )}
                style={{
                  top: `calc(36% + ${abdT.offsetY}%)`,
                  width: `${40 * abdT.scale}%`,
                  transform: `translateX(calc(-50% + ${abdT.offsetX}%))`,
                }}
                onPointerDown={(e) => handlePointerDown("abdominal", e)}
              >
                <img
                  src={zones.abdominalGrande}
                  alt="Pecho grande"
                  className="pointer-events-none h-auto w-full object-contain drop-shadow-lg"
                  draggable={false}
                />
                {onAbdominalTransformChange && !captureMode && (
                  <div className="pointer-events-none absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-cyan/80 text-void shadow-md">
                    <Move className="h-3 w-3" />
                  </div>
                )}
                {abdominalUpload && !captureMode && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); abdominalUpload.onRemove(); }}
                    onPointerDown={(e) => e.stopPropagation()}
                    disabled={abdominalUpload.disabled}
                    className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-elevated bg-void/90 text-text-muted shadow-md transition-colors hover:border-magenta/40 hover:text-magenta"
                    aria-label="Eliminar pecho grande"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            )}
            {!zones.abdominalGrande && abdominalUpload && (
              <div
                className="absolute left-1/2 aspect-[6/7] -translate-x-1/2"
                style={{ top: "36%", width: "40%" }}
              >
                <UploadPlaceholder
                  label="Pecho grande"
                  disabled={abdominalUpload.disabled}
                  onFileSelect={abdominalUpload.onFileSelect}
                />
              </div>
            )}
          </>
        )}

        {side === "back" && zones.espaldaGrande && (
          <div
            className={cn(
              "absolute left-1/2 select-none touch-none",
              draggingZone === "espalda" ? "cursor-grabbing" : "cursor-grab",
              draggingZone !== "espalda" && "transition-all duration-150",
            )}
            style={{
              top: `calc(28% + ${espT.offsetY}%)`,
              width: `${48 * espT.scale}%`,
              transform: `translateX(calc(-50% + ${espT.offsetX}%))`,
            }}
            onPointerDown={(e) => handlePointerDown("espalda", e)}
          >
            <img
              src={zones.espaldaGrande}
              alt="Espalda grande"
              className="pointer-events-none h-auto w-full object-contain drop-shadow-lg"
              draggable={false}
            />
            {onEspaldaTransformChange && !captureMode && (
              <div className="pointer-events-none absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-cyan/80 text-void shadow-md">
                <Move className="h-3 w-3" />
              </div>
            )}
            {espaldaUpload && !captureMode && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); espaldaUpload.onRemove(); }}
                onPointerDown={(e) => e.stopPropagation()}
                disabled={espaldaUpload.disabled}
                className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-elevated bg-void/90 text-text-muted shadow-md transition-colors hover:border-magenta/40 hover:text-magenta"
                aria-label="Eliminar espalda grande"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        )}
        {side === "back" && !zones.espaldaGrande && espaldaUpload && (
          <div
            className="absolute left-1/2 aspect-[6/7] -translate-x-1/2"
            style={{ top: "28%", width: "48%" }}
          >
            <UploadPlaceholder
              label="Espalda grande"
              disabled={espaldaUpload.disabled}
              onFileSelect={espaldaUpload.onFileSelect}
            />
          </div>
        )}

        {side === "front" && !hasAnyFrontImage && !pechoUpload && !abdominalUpload && (
          <div className="absolute left-1/2 top-[42%] -translate-x-1/2 text-center">
            <p className="text-xs text-text-muted/50">Sube una imagen para el frente</p>
          </div>
        )}

        {side === "back" && !hasBackImage && !espaldaUpload && (
          <div className="absolute left-1/2 top-[42%] -translate-x-1/2 text-center">
            <p className="text-xs text-text-muted/50">Sube una imagen para la espalda</p>
          </div>
        )}
      </div>

      {/* Scale controls — one row per draggable zone visible on this side */}
      {!captureMode && scaleControls.length > 0 && (
        <div className="mt-3 flex flex-col gap-2">
          {scaleControls.map((c) => {
            const bgProcessing = c.upload?.bgStatus === "processing";
            const bgDone = c.upload?.bgStatus === "done";
            const bgError = c.upload?.bgStatus === "error";
            return (
              <div key={c.key} className="flex flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2 rounded-lg border border-elevated bg-surface px-3 py-2 sm:gap-3">
                  <span className="w-20 shrink-0 truncate text-[10px] text-text-muted sm:w-24">{c.label}</span>
                  <button
                    type="button"
                    onClick={() => handleScale(c.key, -SCALE_STEP)}
                    disabled={c.transform.scale <= SCALE_MIN}
                    className="rounded p-0.5 text-text-muted transition-colors hover:text-cyan disabled:opacity-30"
                    aria-label={`Reducir tamaño de ${c.label}`}
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <input
                    type="range"
                    min={SCALE_MIN}
                    max={SCALE_MAX}
                    step={SCALE_STEP}
                    value={c.transform.scale}
                    onChange={(e) => c.onChange({ ...c.transform, scale: parseFloat(e.target.value) })}
                    className="h-1 w-16 cursor-pointer appearance-none rounded-full bg-elevated accent-cyan [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan sm:w-24"
                  />
                  <button
                    type="button"
                    onClick={() => handleScale(c.key, SCALE_STEP)}
                    disabled={c.transform.scale >= SCALE_MAX}
                    className="rounded p-0.5 text-text-muted transition-colors hover:text-cyan disabled:opacity-30"
                    aria-label={`Aumentar tamaño de ${c.label}`}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                  <span className="ml-auto font-mono text-[10px] text-text-muted">
                    {Math.round(c.transform.scale * 100)}%
                  </span>
                </div>
                {/*
                  Deliberately a full labeled button under the scale row,
                  not just an icon next to it — an icon-only trigger here
                  went unnoticed, and quitar fondo is a feature worth
                  surfacing plainly rather than making users discover it.
                */}
                {c.upload?.onRemoveBg && (
                  <button
                    type="button"
                    onClick={bgDone ? c.upload.onRestoreBg : c.upload.onRemoveBg}
                    disabled={bgProcessing || c.upload.disabled}
                    className={cn(
                      "flex w-full items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all duration-200",
                      bgDone
                        ? "border-violet/25 bg-violet/5 text-violet hover:border-violet/40 hover:bg-violet/10"
                        : bgError
                          ? "border-magenta/30 bg-magenta/5 text-magenta"
                          : "border-cyan/25 bg-cyan/5 text-cyan hover:border-cyan/40 hover:bg-cyan/10",
                    )}
                    aria-label={bgDone ? `Restaurar fondo de ${c.label}` : `Quitar fondo de ${c.label}`}
                  >
                    {bgProcessing ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : bgDone ? (
                      <Undo2 className="h-3.5 w-3.5" />
                    ) : (
                      <Eraser className="h-3.5 w-3.5" />
                    )}
                    {bgProcessing
                      ? "Quitando fondo..."
                      : bgDone
                        ? "Restaurar fondo original"
                        : bgError
                          ? "Reintentar quitar fondo"
                          : "Quitar fondo"}
                  </button>
                )}
                {bgError && c.upload?.bgError && (
                  <p className="px-1 text-[10px] text-magenta/80">{c.upload.bgError}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
