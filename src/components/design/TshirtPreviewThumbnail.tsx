"use client";

import { useId } from "react";
import type { DesignZoneConfig } from "@/types/design";

interface TshirtPreviewThumbnailProps {
  zoneConfig: DesignZoneConfig;
  colorHex: string;
  className?: string;
  forceSide?: "front" | "back";
}

function adjustColor(hex: string, amount: number): string {
  const n = parseInt(hex.replace("#", "").slice(0, 6), 16) || 0;
  const r = Math.max(0, Math.min(255, ((n >> 16) & 0xff) + amount));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 0xff) + amount));
  const b = Math.max(0, Math.min(255, (n & 0xff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

const bodyPath =
  "M124,62 C108,56 84,62 68,76" +
  " Q42,96 20,140" +
  " C12,158 16,168 28,164" +
  " Q50,152 70,168" +
  " C66,230 62,310 62,385" +
  " Q62,405 80,406" +
  " L240,406" +
  " Q258,405 258,385" +
  " C258,310 254,230 250,168" +
  " Q270,152 292,164" +
  " C304,168 308,158 300,140" +
  " Q278,96 252,76" +
  " C236,62 212,56 196,62";

const frontCollar =
  " C190,78 178,90 160,92" +
  " C142,90 130,78 124,62 Z";

const backCollar =
  " C192,72 180,78 160,80" +
  " C140,78 128,72 124,62 Z";

export function TshirtPreviewThumbnail({
  zoneConfig,
  colorHex,
  className,
  forceSide,
}: TshirtPreviewThumbnailProps) {
  const id = useId();
  const gradId = `tshirtGrad-${id}`;

  const pecho = zoneConfig.pechoBolsillo?.enabled ? zoneConfig.pechoBolsillo : null;
  const abdominal = zoneConfig.abdominalGrande?.enabled ? zoneConfig.abdominalGrande : null;
  const espalda = zoneConfig.espaldaGrande?.enabled ? zoneConfig.espaldaGrande : null;

  const hasFront = !!(pecho || abdominal);
  const side = forceSide ?? (hasFront ? "front" : espalda ? "back" : "front");

  const shadow = adjustColor(colorHex, -30);
  const highlight = adjustColor(colorHex, 12);
  const seam = adjustColor(colorHex, -45);
  const collar = adjustColor(colorHex, -60);
  const collarInner = adjustColor(colorHex, -80);

  const abdScale = abdominal?.transform?.scale ?? 1;
  const abdOffX = abdominal?.transform?.offsetX ?? 0;
  const abdOffY = abdominal?.transform?.offsetY ?? 0;
  const espScale = espalda?.transform?.scale ?? 1;
  const espOffX = espalda?.transform?.offsetX ?? 0;
  const espOffY = espalda?.transform?.offsetY ?? 0;

  return (
    <div className={className ?? "relative aspect-[3/4] h-[110px]"}>
      <div className="relative h-full w-full">
        <svg
          viewBox="0 0 320 420"
          className="h-full w-full"
          style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.3))" }}
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={shadow} />
              <stop offset="18%" stopColor={colorHex} />
              <stop offset="45%" stopColor={highlight} />
              <stop offset="82%" stopColor={colorHex} />
              <stop offset="100%" stopColor={shadow} />
            </linearGradient>
          </defs>

          <path
            d={bodyPath + (side === "front" ? frontCollar : backCollar)}
            fill={`url(#${gradId})`}
            stroke={seam}
            strokeWidth="1"
            strokeLinejoin="round"
          />

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
        </svg>

        {side === "front" && (
          <>
            {pecho?.imageUrl && (
              <div className="absolute top-[24%] left-[27%] w-[15%]">
                <img
                  src={pecho.imageUrl}
                  alt=""
                  className="h-auto w-full object-contain"
                  draggable={false}
                />
              </div>
            )}
            {abdominal?.imageUrl && (
              <div
                className="absolute left-1/2"
                style={{
                  top: `calc(32% + ${abdOffY}%)`,
                  width: `${40 * abdScale}%`,
                  transform: `translateX(calc(-50% + ${abdOffX}%))`,
                }}
              >
                <img
                  src={abdominal.imageUrl}
                  alt=""
                  className="h-auto w-full object-contain"
                  draggable={false}
                />
              </div>
            )}
          </>
        )}

        {side === "back" && espalda?.imageUrl && (
          <div
            className="absolute left-1/2"
            style={{
              top: `calc(24% + ${espOffY}%)`,
              width: `${48 * espScale}%`,
              transform: `translateX(calc(-50% + ${espOffX}%))`,
            }}
          >
            <img
              src={espalda.imageUrl}
              alt=""
              className="h-auto w-full object-contain"
              draggable={false}
            />
          </div>
        )}
      </div>
    </div>
  );
}
