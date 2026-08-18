"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PRINT_ZONES } from "@/lib/utils/constants";
import { downscaleImageFile, fitForUpload } from "@/lib/utils/imageProcessing";
import { BgRemovalCancelled, removeBackground, type BgProgress } from "@/lib/utils/removeBgClient";
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
  bgRemovalProgress: BgProgress | null;
}

export type ZonesMap = Record<DesignZone, ZoneState>;

const emptyZone: ZoneState = {
  file: null,
  preview: null,
  originalFile: null,
  originalPreview: null,
  bgRemovalStatus: "idle",
  bgRemovalError: null,
  bgRemovalProgress: null,
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

  // Espejo del estado para leerlo dentro de handlers async sin que el
  // callback dependa de `zones`: dependiendo del objeto entero, handleRemoveBg
  // se re-creaba en cada tecla de progreso y podía arrancar con un `file`
  // viejo.
  const zonesRef = useRef(zones);
  zonesRef.current = zones;

  const abortRef = useRef<Partial<Record<DesignZone, AbortController>>>({});

  /**
   * Identidad de "la imagen que el usuario tiene puesta ahora en esta zona".
   *
   * No se puede usar el `File` para eso: el downscale de abajo reemplaza el
   * objeto por otro equivalente a los pocos cientos de ms, y comparar por
   * identidad hacía que un quitar-fondo lanzado antes de ese cambio
   * terminara descartando su propio resultado — y, peor, dejando la zona
   * clavada en "processing" para siempre. El contador solo avanza cuando el
   * usuario de verdad cambia o borra la imagen.
   */
  const tokenRef = useRef<Record<DesignZone, number>>({
    pechoBolsillo: 0,
    abdominalGrande: 0,
    espaldaGrande: 0,
  });

  /** Downscale en vuelo por zona, para que quitar fondo lo espere en vez de correrle por al lado. */
  const optimizingRef = useRef<Partial<Record<DesignZone, Promise<File>>>>({});

  // Un quitar-fondo en curso que ya no le importa a nadie (el usuario se fue
  // de la página) sigue ocupando CPU del dispositivo. Al desmontar se corta.
  useEffect(() => {
    const controllers = abortRef.current;
    return () => {
      Object.values(controllers).forEach((c) => c?.abort());
    };
  }, []);

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
      abortRef.current[zone]?.abort();
      const token = ++tokenRef.current[zone];

      const preview = URL.createObjectURL(file);
      setZones((prev) => {
        if (prev[zone].preview) URL.revokeObjectURL(prev[zone].preview!);
        if (prev[zone].originalPreview) URL.revokeObjectURL(prev[zone].originalPreview!);
        return { ...prev, [zone]: { ...emptyZone, file, preview } };
      });
      resetZoneTransform(zone);

      // Una foto de celular entra al editor con 12MP. Se muestra al instante
      // con el archivo original (arriba) y en paralelo se reduce a 2048px,
      // que es lo que de verdad necesita un estampado. Sin esto, el resto de
      // la sesión arrastra el peso: más RAM de decodificación, más lento el
      // quitar fondo y una subida final de varios MB con datos móviles.
      //
      // El `fitForUpload` de después cierra el otro flanco: 2048px no dice
      // nada del peso en bytes, y una imagen CON fondo pesa varias veces lo
      // que la misma imagen recortada. Ese peso es el que hacía que el POST
      // de "agregar al carrito" muriera en el proxy antes de llegar a la
      // acción.
      const optimizing = downscaleImageFile(file)
        .then((reducida) => fitForUpload(reducida))
        .catch(() => file);
      optimizingRef.current[zone] = optimizing;

      void optimizing.then(async (optimized) => {
        try {
          if (optimized === file) return;

          // Precargar antes de cambiar el src evita el parpadeo del swap.
          const optimizedPreview = URL.createObjectURL(optimized);
          try {
            const img = new Image();
            img.src = optimizedPreview;
            await img.decode();
          } catch {
            // Si el decode falla, el swap igual funciona; solo puede parpadear.
          }

          setZones((prev) => {
            // Dos motivos para descartar el swap: el usuario cambió o borró la
            // imagen (token), o la zona ya no tiene el archivo original porque
            // le quitaron el fondo mientras esto corría — pisarlo con la
            // versión reducida borraría el recorte.
            if (tokenRef.current[zone] !== token || prev[zone].file !== file) {
              URL.revokeObjectURL(optimizedPreview);
              return prev;
            }
            if (prev[zone].preview) URL.revokeObjectURL(prev[zone].preview!);
            return {
              ...prev,
              [zone]: { ...prev[zone], file: optimized, preview: optimizedPreview },
            };
          });
        } finally {
          // Recién acá, con el swap ya aplicado, `zones[zone].file` pasa a ser
          // la fuente de verdad. Soltarla antes haría que un quitar-fondo
          // disparado en el medio volviera a agarrar el archivo de 12MP; no
          // soltarla nunca haría que un quitar-fondo posterior a un recorte
          // trabajara sobre la imagen previa al recorte.
          if (optimizingRef.current[zone] === optimizing) {
            delete optimizingRef.current[zone];
          }
        }
      });
    },
    [resetZoneTransform],
  );

  const handleRemove = useCallback(
    (zone: DesignZone) => {
      abortRef.current[zone]?.abort();
      tokenRef.current[zone]++;
      delete optimizingRef.current[zone];
      setZones((prev) => {
        if (prev[zone].preview) URL.revokeObjectURL(prev[zone].preview!);
        if (prev[zone].originalPreview) URL.revokeObjectURL(prev[zone].originalPreview!);
        return { ...prev, [zone]: { ...emptyZone } };
      });
      resetZoneTransform(zone);
    },
    [resetZoneTransform],
  );

  /**
   * Quitar fondo.
   *
   * El modelo corre en un worker (ver `removeBgClient`), no en el hilo
   * principal como antes: esa era la causa de que la página quedara
   * congelada — no era lentitud, era el hilo de la UI bloqueado por la
   * inferencia, sin forma de scrollear ni de cancelar, y en celulares de
   * gama media terminaba con la pestaña muerta por memoria.
   */
  const handleRemoveBg = useCallback(async (zone: DesignZone) => {
    const zoneState = zonesRef.current[zone];
    if (!zoneState.file || zoneState.bgRemovalStatus === "processing") return;

    const token = tokenRef.current[zone];
    const controller = new AbortController();
    abortRef.current[zone] = controller;

    setZones((prev) => ({
      ...prev,
      [zone]: {
        ...prev[zone],
        bgRemovalStatus: "processing" as BgRemovalStatus,
        bgRemovalError: null,
        bgRemovalProgress: { phase: "model", pct: 0 },
      },
    }));

    try {
      // Si el downscale todavía está en vuelo, se lo espera: correr el
      // modelo sobre la foto de 12MP original en vez de sobre la reducida
      // solo produce un PNG con alfa gigantesco que después hay que subir.
      const pending = optimizingRef.current[zone];
      const sourceFile = pending ? await pending : zoneState.file;
      if (tokenRef.current[zone] !== token) return;

      const recorte = await removeBackground(sourceFile, {
        signal: controller.signal,
        onProgress: (progress) => {
          setZones((prev) =>
            prev[zone].bgRemovalStatus === "processing"
              ? { ...prev, [zone]: { ...prev[zone], bgRemovalProgress: progress } }
              : prev,
          );
        },
      });

      // El recorte suele adelgazar solo (el PNG comprime el transparente a
      // nada), pero un sujeto grande sobre 2048px todavía puede pasarse del
      // presupuesto de subida. Mismo cap que el camino sin quitar fondo.
      const newFile = await fitForUpload(recorte);

      const newPreview = URL.createObjectURL(newFile);
      setZones((prev) => {
        // Si el usuario cambió o borró la imagen mientras el modelo
        // trabajaba, el recorte es de otra foto: se descarta en vez de pisar
        // lo que ve ahora. Esa zona ya quedó en "idle" al reemplazarla, así
        // que salir por acá no deja ningún estado colgado.
        if (tokenRef.current[zone] !== token) {
          URL.revokeObjectURL(newPreview);
          return prev;
        }
        return {
          ...prev,
          [zone]: {
            file: newFile,
            preview: newPreview,
            originalFile: prev[zone].originalFile ?? prev[zone].file,
            originalPreview: prev[zone].originalPreview ?? prev[zone].preview,
            bgRemovalStatus: "done" as BgRemovalStatus,
            bgRemovalError: null,
            bgRemovalProgress: null,
          },
        };
      });
    } catch (err) {
      const cancelled = err instanceof BgRemovalCancelled;
      if (!cancelled) console.error("[remove-bg] Error:", err);
      // La zona ya es de otra imagen: escribirle un error sería un cartel
      // rojo sobre algo que nunca falló.
      if (tokenRef.current[zone] !== token) return;

      setZones((prev) => ({
        ...prev,
        [zone]: {
          ...prev[zone],
          // Cancelar es una decisión del usuario, no una falla: la zona
          // vuelve a "idle" y el botón queda listo para intentar de nuevo,
          // sin cartel rojo.
          bgRemovalStatus: (cancelled ? "idle" : "error") as BgRemovalStatus,
          bgRemovalError: cancelled
            ? null
            : `No se pudo quitar el fondo: ${
                err instanceof Error ? err.message : "error desconocido"
              }`,
          bgRemovalProgress: null,
        },
      }));
    } finally {
      if (abortRef.current[zone] === controller) delete abortRef.current[zone];
    }
  }, []);

  const handleCancelBg = useCallback((zone: DesignZone) => {
    abortRef.current[zone]?.abort();
  }, []);

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
          bgRemovalProgress: null,
        },
      };
    });
  }, []);

  /** Vuelve las 3 zonas a cero. Lo usa el "hacer otro pedido" del panel admin. */
  const resetZones = useCallback(() => {
    PRINT_ZONES.forEach(({ key }) => {
      abortRef.current[key]?.abort();
      tokenRef.current[key]++;
      delete optimizingRef.current[key];
      resetZoneTransform(key);
    });
    setZones((prev) => {
      Object.values(prev).forEach((z) => {
        if (z.preview) URL.revokeObjectURL(z.preview);
        if (z.originalPreview) URL.revokeObjectURL(z.originalPreview);
      });
      return makeEmptyZones();
    });
  }, [resetZoneTransform]);

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
    handleCancelBg,
    handleRestoreBg,
    resetZones,
  };
}
