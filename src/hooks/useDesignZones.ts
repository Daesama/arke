"use client";

import { useCallback, useState } from "react";
import { PRINT_ZONES } from "@/lib/utils/constants";
import type { BgRemovalStatus, DesignZone, ZoneTransform } from "@/types/design";

/**
 * Estado de las 3 zonas de estampado: archivo, preview, transform y
 * remoción de fondo.
 *
 * Vive acá y no dentro de un componente porque lo comparten dos
 * editores que hacen cosas distintas con el resultado:
 *  - /crear (CrearClient): el cliente arma su camiseta y la manda al carrito.
 *  - /admin/catalogo (CatalogShirtBuilder): el admin arma una camisa ya
 *    hecha y la guarda como item de catálogo.
 * La UI difiere; el manejo de imágenes es idéntico.
 */

export interface ZoneState {
  file: File | null;
  preview: string | null;
  originalFile: File | null;
  originalPreview: string | null;
  bgRemovalStatus: BgRemovalStatus;
  bgRemovalError: string | null;
}

export type ZonesMap = Record<DesignZone, ZoneState>;

const emptyZone: ZoneState = {
  file: null,
  preview: null,
  originalFile: null,
  originalPreview: null,
  bgRemovalStatus: "idle",
  bgRemovalError: null,
};

function makeEmptyZones(): ZonesMap {
  return {
    pechoBolsillo: { ...emptyZone },
    abdominalGrande: { ...emptyZone },
    espaldaGrande: { ...emptyZone },
  };
}

const DEFAULT_TRANSFORM: ZoneTransform = { offsetX: 0, offsetY: 0, scale: 1 };

export function useDesignZones() {
  const [zones, setZones] = useState<ZonesMap>(makeEmptyZones);
  const [pechoTransform, setPechoTransform] = useState<ZoneTransform>(DEFAULT_TRANSFORM);
  const [abdominalTransform, setAbdominalTransform] = useState<ZoneTransform>(DEFAULT_TRANSFORM);
  const [espaldaTransform, setEspaldaTransform] = useState<ZoneTransform>(DEFAULT_TRANSFORM);

  // Quitar o reemplazar la imagen de una zona sin resetear su transform
  // hacía que la siguiente imagen heredara el offset/escala de la anterior:
  // aparecía corrida y parecía que "mover" estaba roto. Cada imagen nueva
  // arranca centrada y al 100%.
  const resetZoneTransform = useCallback((zone: DesignZone) => {
    if (zone === "pechoBolsillo") setPechoTransform(DEFAULT_TRANSFORM);
    if (zone === "abdominalGrande") setAbdominalTransform(DEFAULT_TRANSFORM);
    if (zone === "espaldaGrande") setEspaldaTransform(DEFAULT_TRANSFORM);
  }, []);

  const handleFileSelect = useCallback(
    (zone: DesignZone, file: File) => {
      const preview = URL.createObjectURL(file);
      setZones((prev) => {
        if (prev[zone].preview) URL.revokeObjectURL(prev[zone].preview!);
        if (prev[zone].originalPreview) URL.revokeObjectURL(prev[zone].originalPreview!);
        return {
          ...prev,
          [zone]: {
            file,
            preview,
            originalFile: null,
            originalPreview: null,
            bgRemovalStatus: "idle" as BgRemovalStatus,
            bgRemovalError: null,
          },
        };
      });
      resetZoneTransform(zone);
    },
    [resetZoneTransform],
  );

  const handleRemove = useCallback(
    (zone: DesignZone) => {
      setZones((prev) => {
        if (prev[zone].preview) URL.revokeObjectURL(prev[zone].preview!);
        if (prev[zone].originalPreview) URL.revokeObjectURL(prev[zone].originalPreview!);
        return { ...prev, [zone]: { ...emptyZone } };
      });
      resetZoneTransform(zone);
    },
    [resetZoneTransform],
  );

  const handleRemoveBg = useCallback(
    async (zone: DesignZone) => {
      const zoneState = zones[zone];
      if (!zoneState.file) return;

      setZones((prev) => ({
        ...prev,
        [zone]: {
          ...prev[zone],
          bgRemovalStatus: "processing" as BgRemovalStatus,
          bgRemovalError: null,
        },
      }));

      try {
        // El @ts-expect-error tiene que quedar en la MISMA línea que la URL:
        // si el import se parte en varias, deja de cubrir el error y tsc falla.
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
        const mask =
          rawMask.width !== img.width || rawMask.height !== img.height
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

        // Cap de resolución — un PNG con alfa a resolución de cámara de
        // celular puede pesar decenas de MB y reventar el límite de subida.
        // 3000px sigue muy por encima de lo necesario para un estampado
        // de ~35cm a calidad de impresión.
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
          outputCanvas.toBlob((b) => resolve(b!), "image/png"),
        );

        const newFile = new File([blob], zoneState.file!.name.replace(/\.\w+$/, ".png"), {
          type: "image/png",
        });
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
            bgRemovalError: `Error al quitar el fondo: ${
              err instanceof Error ? err.message : "error desconocido"
            }`,
          },
        }));
      }
    },
    [zones],
  );

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

  const previews = {
    pechoBolsillo: zones.pechoBolsillo.preview,
    abdominalGrande: zones.abdominalGrande.preview,
    espaldaGrande: zones.espaldaGrande.preview,
  };

  const transforms: Record<DesignZone, ZoneTransform> = {
    pechoBolsillo: pechoTransform,
    abdominalGrande: abdominalTransform,
    espaldaGrande: espaldaTransform,
  };

  const activeZones = PRINT_ZONES.filter((z) => zones[z.key].file).map((z) => z.key);
  const hasAnyImage = activeZones.length > 0;

  return {
    zones,
    previews,
    transforms,
    activeZones,
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
    handleRestoreBg,
  };
}
