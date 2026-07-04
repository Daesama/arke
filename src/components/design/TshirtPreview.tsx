"use client";

import { useRef, useCallback, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { RotateCcw, Move, Minus, Plus } from "lucide-react";
import type { ZoneTransform } from "@/types/design";

interface ZoneImages {
  pechoBolsillo: string | null;
  abdominalGrande: string | null;
  espaldaGrande: string | null;
}

interface TshirtPreviewProps {
  zones: ZoneImages;
  color: string;
  side: "front" | "back";
  onSideChange: (side: "front" | "back") => void;
  abdominalTransform?: ZoneTransform;
  onAbdominalTransformChange?: (transform: ZoneTransform) => void;
  espaldaTransform?: ZoneTransform;
  onEspaldaTransformChange?: (transform: ZoneTransform) => void;
}

const DEFAULT_TRANSFORM: ZoneTransform = { offsetX: 0, offsetY: 0, scale: 1 };
const SCALE_MIN = 0.4;
const SCALE_MAX = 1.6;
const SCALE_STEP = 0.05;

type DragZone = "abdominal" | "espalda" | null;

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
  abdominalTransform,
  onAbdominalTransformChange,
  espaldaTransform,
  onEspaldaTransformChange,
}: TshirtPreviewProps) {
  const hasAnyFrontImage = zones.pechoBolsillo || zones.abdominalGrande;
  const hasBackImage = !!zones.espaldaGrande;

  const abdT = abdominalTransform ?? DEFAULT_TRANSFORM;
  const espT = espaldaTransform ?? DEFAULT_TRANSFORM;

  const containerRef = useRef<HTMLDivElement>(null);
  const activeZoneRef = useRef<DragZone>(null);
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });
  const [draggingZone, setDraggingZone] = useState<DragZone>(null);

  const getHandler = useCallback((zone: DragZone) => {
    if (zone === "abdominal") return { transform: abdT, onChange: onAbdominalTransformChange };
    if (zone === "espalda") return { transform: espT, onChange: onEspaldaTransformChange };
    return null;
  }, [abdT, espT, onAbdominalTransformChange, onEspaldaTransformChange]);

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

  const activeTransform = side === "front" ? abdT : espT;
  const activeOnChange = side === "front" ? onAbdominalTransformChange : onEspaldaTransformChange;
  const activeZoneName: DragZone = side === "front" ? "abdominal" : "espalda";
  const showScaleControls =
    (side === "front" && zones.abdominalGrande && onAbdominalTransformChange) ||
    (side === "back" && zones.espaldaGrande && onEspaldaTransformChange);

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

      <div
        ref={containerRef}
        className="relative aspect-[3/4] w-full max-w-[320px]"
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
            <linearGradient id="tshirtGrad" x1="0" y1="0" x2="1" y2="0">
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
            fill="url(#tshirtGrad)"
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

        {/* Design overlays */}
        {side === "front" && (
          <>
            {zones.pechoBolsillo && (
              <div className="absolute top-[24%] left-[27%] w-[15%] transition-all duration-300">
                <img
                  src={zones.pechoBolsillo}
                  alt="Pecho bolsillo"
                  className="h-auto w-full object-contain drop-shadow-lg"
                />
              </div>
            )}
            {zones.abdominalGrande && (
              <div
                className={cn(
                  "absolute left-1/2 select-none",
                  draggingZone === "abdominal" ? "cursor-grabbing" : "cursor-grab",
                  draggingZone !== "abdominal" && "transition-all duration-150",
                )}
                style={{
                  top: `calc(32% + ${abdT.offsetY}%)`,
                  width: `${40 * abdT.scale}%`,
                  transform: `translateX(calc(-50% + ${abdT.offsetX}%))`,
                }}
                onPointerDown={(e) => handlePointerDown("abdominal", e)}
              >
                <img
                  src={zones.abdominalGrande}
                  alt="Abdominal grande"
                  className="pointer-events-none h-auto w-full object-contain drop-shadow-lg"
                  draggable={false}
                />
                {onAbdominalTransformChange && (
                  <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-cyan/80 text-void shadow-md">
                    <Move className="h-3 w-3" />
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {side === "back" && zones.espaldaGrande && (
          <div
            className={cn(
              "absolute left-1/2 select-none",
              draggingZone === "espalda" ? "cursor-grabbing" : "cursor-grab",
              draggingZone !== "espalda" && "transition-all duration-150",
            )}
            style={{
              top: `calc(24% + ${espT.offsetY}%)`,
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
            {onEspaldaTransformChange && (
              <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-cyan/80 text-void shadow-md">
                <Move className="h-3 w-3" />
              </div>
            )}
          </div>
        )}

        {side === "front" && !hasAnyFrontImage && (
          <div className="absolute left-1/2 top-[42%] -translate-x-1/2 text-center">
            <p className="text-xs text-text-muted/50">Subí una imagen para el frente</p>
          </div>
        )}

        {side === "back" && !hasBackImage && (
          <div className="absolute left-1/2 top-[42%] -translate-x-1/2 text-center">
            <p className="text-xs text-text-muted/50">Subí una imagen para la espalda</p>
          </div>
        )}
      </div>

      {/* Scale controls */}
      {showScaleControls && (
        <div className="mt-3 flex items-center gap-3 rounded-lg border border-elevated bg-surface px-3 py-2">
          <button
            type="button"
            onClick={() => handleScale(activeZoneName, -SCALE_STEP)}
            disabled={activeTransform.scale <= SCALE_MIN}
            className="rounded p-0.5 text-text-muted transition-colors hover:text-cyan disabled:opacity-30"
            aria-label="Reducir tamaño"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <input
            type="range"
            min={SCALE_MIN}
            max={SCALE_MAX}
            step={SCALE_STEP}
            value={activeTransform.scale}
            onChange={(e) =>
              activeOnChange?.({ ...activeTransform, scale: parseFloat(e.target.value) })
            }
            className="h-1 w-24 cursor-pointer appearance-none rounded-full bg-elevated accent-cyan [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan"
          />
          <button
            type="button"
            onClick={() => handleScale(activeZoneName, SCALE_STEP)}
            disabled={activeTransform.scale >= SCALE_MAX}
            className="rounded p-0.5 text-text-muted transition-colors hover:text-cyan disabled:opacity-30"
            aria-label="Aumentar tamaño"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          <span className="ml-1 font-mono text-[10px] text-text-muted">
            {Math.round(activeTransform.scale * 100)}%
          </span>
        </div>
      )}
    </div>
  );
}
