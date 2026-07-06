import { createHmac, timingSafeEqual } from "crypto";

export function verifyWompiSignature(
  body: string,
  signature: string,
  timestamp: string,
): boolean {
  const secret = process.env.WOMPI_EVENTS_SECRET;
  if (!secret) return false;

  const payload = `${timestamp}${body}`;
  const expectedSignature = createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  try {
    return timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature),
    );
  } catch {
    return false;
  }
}
