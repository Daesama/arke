"use client";

import { cn } from "@/lib/utils/cn";
import { RotateCcw } from "lucide-react";

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
}

export function TshirtPreview({
  zones,
  color,
  side,
  onSideChange,
}: TshirtPreviewProps) {
  const hasAnyFrontImage = zones.pechoBolsillo || zones.abdominalGrande;
  const hasBackImage = !!zones.espaldaGrande;

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

      <div className="relative aspect-[3/4] w-full max-w-[300px]">
        <svg viewBox="0 0 300 400" className="h-full w-full transition-colors duration-300">
          <path
            d="M75,30 L40,70 L0,60 L20,120 L55,105 L55,370 L245,370 L245,105 L280,120 L300,60 L260,70 L225,30 Q200,10 150,10 Q100,10 75,30 Z"
            fill={color}
            stroke="#2A2A3A"
            strokeWidth="1.5"
          />
          <text
            x="150"
            y="25"
            textAnchor="middle"
            fill="#2A2A3A"
            fontSize="8"
            fontFamily="sans-serif"
          >
            {side === "front" ? "FRENTE" : "ESPALDA"}
          </text>
          {side === "back" && (
            <line x1="130" y1="35" x2="170" y2="35" stroke="#2A2A3A" strokeWidth="0.5" />
          )}
        </svg>

        {side === "front" && (
          <>
            {zones.pechoBolsillo && (
              <div className="absolute top-[18%] left-[25%] w-[18%] transition-all duration-300">
                <img
                  src={zones.pechoBolsillo}
                  alt="Pecho bolsillo"
                  className="h-auto w-full object-contain drop-shadow-lg"
                />
              </div>
            )}
            {zones.abdominalGrande && (
              <div className="absolute top-[28%] left-1/2 w-[45%] -translate-x-1/2 transition-all duration-300">
                <img
                  src={zones.abdominalGrande}
                  alt="Abdominal grande"
                  className="h-auto w-full object-contain drop-shadow-lg"
                />
              </div>
            )}
          </>
        )}

        {side === "back" && zones.espaldaGrande && (
          <div className="absolute top-[20%] left-1/2 w-[55%] -translate-x-1/2 transition-all duration-300">
            <img
              src={zones.espaldaGrande}
              alt="Espalda grande"
              className="h-auto w-full object-contain drop-shadow-lg"
            />
          </div>
        )}

        {side === "front" && !hasAnyFrontImage && (
          <div className="absolute left-1/2 top-[35%] -translate-x-1/2 text-center">
            <p className="text-xs text-text-muted">Subí una imagen para el frente</p>
          </div>
        )}

        {side === "back" && !hasBackImage && (
          <div className="absolute left-1/2 top-[35%] -translate-x-1/2 text-center">
            <p className="text-xs text-text-muted">Subí una imagen para la espalda</p>
          </div>
        )}
      </div>
    </div>
  );
}
