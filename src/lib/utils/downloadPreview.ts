import type { DesignZoneConfig } from "@/types/design";

function adjustColor(hex: string, amount: number): string {
  const n = parseInt(hex.replace("#", "").slice(0, 6), 16) || 0;
  const r = Math.max(0, Math.min(255, ((n >> 16) & 0xff) + amount));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 0xff) + amount));
  const b = Math.max(0, Math.min(255, (n & 0xff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

async function urlToBase64(url: string): Promise<string> {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
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
  " C190,78 178,90 160,92 C142,90 130,78 124,62 Z";

const backCollar =
  " C192,72 180,78 160,80 C140,78 128,72 124,62 Z";

export async function downloadTshirtPreview(
  zoneConfig: DesignZoneConfig,
  colorHex: string,
  side: "front" | "back",
  filename: string,
) {
  const shadow = adjustColor(colorHex, -30);
  const highlight = adjustColor(colorHex, 12);
  const seam = adjustColor(colorHex, -45);
  const collar = adjustColor(colorHex, -60);
  const collarInner = adjustColor(colorHex, -80);

  const pecho = zoneConfig.pechoBolsillo?.enabled ? zoneConfig.pechoBolsillo : null;
  const abdominal = zoneConfig.abdominalGrande?.enabled ? zoneConfig.abdominalGrande : null;
  const espalda = zoneConfig.espaldaGrande?.enabled ? zoneConfig.espaldaGrande : null;

  const imageElements: string[] = [];

  if (side === "front") {
    if (pecho?.imageUrl) {
      const b64 = await urlToBase64(pecho.imageUrl);
      imageElements.push(
        `<image href="${b64}" x="86" y="101" width="48" height="48" preserveAspectRatio="xMidYMid meet"/>`,
      );
    }
    if (abdominal?.imageUrl) {
      const b64 = await urlToBase64(abdominal.imageUrl);
      const scale = abdominal.transform?.scale ?? 1;
      const offX = abdominal.transform?.offsetX ?? 0;
      const offY = abdominal.transform?.offsetY ?? 0;
      const w = 128 * scale;
      const h = 128 * scale;
      const x = 160 - w / 2 + (offX / 100) * 320;
      const y = 134 + (offY / 100) * 420;
      imageElements.push(
        `<image href="${b64}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet"/>`,
      );
    }
  }

  if (side === "back" && espalda?.imageUrl) {
    const b64 = await urlToBase64(espalda.imageUrl);
    const scale = espalda.transform?.scale ?? 1;
    const offX = espalda.transform?.offsetX ?? 0;
    const offY = espalda.transform?.offsetY ?? 0;
    const w = 154 * scale;
    const h = 154 * scale;
    const x = 160 - w / 2 + (offX / 100) * 320;
    const y = 101 + (offY / 100) * 420;
    imageElements.push(
      `<image href="${b64}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet"/>`,
    );
  }

  const collarSvg =
    side === "front"
      ? `<path d="M124,62 C130,78 142,90 160,92 C178,90 190,78 196,62 C192,58 182,54 160,54 C138,54 128,58 124,62 Z" fill="${collar}" stroke="${seam}" stroke-width="0.6"/>
         <path d="M130,64 C135,76 146,86 160,88 C174,86 185,76 190,64 C186,60 176,58 160,58 C144,58 134,60 130,64 Z" fill="${collarInner}"/>`
      : `<path d="M124,62 C128,72 140,78 160,80 C180,78 192,72 196,62 C192,58 182,54 160,54 C138,54 128,58 124,62 Z" fill="${collar}" stroke="${seam}" stroke-width="0.6"/>`;

  const svgString = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 320 420" width="800" height="1050">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="${shadow}"/>
        <stop offset="18%" stop-color="${colorHex}"/>
        <stop offset="45%" stop-color="${highlight}"/>
        <stop offset="82%" stop-color="${colorHex}"/>
        <stop offset="100%" stop-color="${shadow}"/>
      </linearGradient>
    </defs>
    <path d="${bodyPath + (side === "front" ? frontCollar : backCollar)}" fill="url(#g)" stroke="${seam}" stroke-width="1" stroke-linejoin="round"/>
    ${collarSvg}
    ${imageElements.join("\n    ")}
  </svg>`;

  const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 1050;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0, 800, 1050);
    URL.revokeObjectURL(url);

    canvas.toBlob((pngBlob) => {
      if (!pngBlob) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(pngBlob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
    }, "image/png");
  };
  img.src = url;
}
