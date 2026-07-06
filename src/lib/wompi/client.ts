import { createHash } from "crypto";

const WOMPI_BASE_URL =
  process.env.NEXT_PUBLIC_WOMPI_ENV === "sandbox"
    ? "https://sandbox.wompi.co/v1"
    : "https://production.wompi.co/v1";

export async function getTransaction(transactionId: string) {
  const res = await fetch(`${WOMPI_BASE_URL}/transactions/${transactionId}`, {
    headers: {
      Authorization: `Bearer ${process.env.WOMPI_PRIVATE_KEY}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Wompi API error: ${res.status}`);
  }

  return res.json();
}

export function generateIntegritySignature(
  reference: string,
  amountInCents: number,
): string {
  const secret = process.env.WOMPI_INTEGRITY_SECRET;
  if (!secret) throw new Error("WOMPI_INTEGRITY_SECRET not configured");

  const integrityString = `${reference}${amountInCents}COP${secret}`;
  return createHash("sha256").update(integrityString).digest("hex");
}
