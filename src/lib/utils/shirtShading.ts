/**
 * Shading maths for the SVG t-shirt mockups — TshirtPreview and
 * TshirtPreviewThumbnail draw the same shirt at two sizes and both shade it
 * from a single base colour.
 *
 * They used to do it with a plain per-channel add clamped at 0, which broke
 * down on the catalogue's "Negro" (#1a1a1a): every shade collapsed to pure
 * black — the gradient's side stops, the outline stroke and the collar all
 * came out #000000, darker than the app background behind them — so the
 * silhouette dissolved into the page and the shirt read as a vague smudge.
 *
 * The fix is to shade *away* from the base colour instead of always downward.
 * Once there is no room left below, the shirt is lit from the sides rather
 * than shadowed, which is how product photography handles black garments
 * anyway. Everything from a dark red upwards keeps the old behaviour exactly.
 */

/** Luminance band over which shading flips from shadow to light. */
const RIM_START = 40; // at or below this luma, shade entirely with light
const RIM_END = 70; //   at or above this luma, shade entirely with shadow (old behaviour)
const RIM_GAIN = 0.75; // how much of the requested amount is spent going up
const RIM_MAX_LIFT = 52; // keeps a black shirt from turning mid-grey at the collar

/** Luma at which a shirt no longer needs help separating from the dark UI. */
const CONTRAST_PIVOT = 110;

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

/** Rec. 709 luma, 0-255. */
export function luminance(hex: string): number {
  const n = parseInt(hex.replace("#", "").slice(0, 6), 16) || 0;
  return (
    0.2126 * ((n >> 16) & 0xff) +
    0.7152 * ((n >> 8) & 0xff) +
    0.0722 * (n & 0xff)
  );
}

/**
 * Shift `hex` by `amount` per channel. Negative amounts darken, as before —
 * except on a shirt too dark to darken, where the shift is spent going up so
 * the shade stays distinguishable from both the fabric and the background.
 *
 * The flip is ramped across RIM_START..RIM_END rather than switched at a
 * threshold, so dragging the custom colour picker through the dark greys does
 * not snap. The cost is one luma (~#353535) where the two directions cancel
 * and the fabric shading goes flat; the contrast outline below covers it.
 */
export function shade(hex: string, amount: number): string {
  const n = parseInt(hex.replace("#", "").slice(0, 6), 16) || 0;
  let eff = amount;

  if (amount < 0) {
    const dark =
      1 - clamp((luminance(hex) - RIM_START) / (RIM_END - RIM_START), 0, 1);
    if (dark > 0) {
      const lift = Math.min(-amount * RIM_GAIN, RIM_MAX_LIFT);
      eff = Math.round(amount * (1 - dark) + lift * dark);
    }
  }

  const r = clamp(((n >> 16) & 0xff) + eff, 0, 255);
  const g = clamp(((n >> 8) & 0xff) + eff, 0, 255);
  const b = clamp((n & 0xff) + eff, 0, 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

/**
 * 0-1: how much extra separation a shirt of this colour needs against the
 * dark UI. 1 for black, 0 for anything grey or lighter. Drives the contrast
 * outline and the ambient glow, both of which fade out continuously so a
 * mid-tone shirt is drawn exactly as it was before.
 */
export function contrastNeed(hex: string): number {
  return clamp((CONTRAST_PIVOT - luminance(hex)) / CONTRAST_PIVOT, 0, 1);
}
