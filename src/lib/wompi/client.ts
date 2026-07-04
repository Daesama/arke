const WOMPI_BASE_URL = process.env.WOMPI_SANDBOX === "true"
  ? "https://sandbox.wompi.co/v1"
  : "https://production.wompi.co/v1";

export async function getTransaction(transactionId: string) {
  const res = await fetch(`${WOMPI_BASE_URL}/transactions/${transactionId}`, {
    headers: {
      Authorization: `Bearer ${process.env.WOMPI_PRIVATE_KEY}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Wompi API error: ${res.status}`);
  }

  return res.json();
}

export function getAcceptanceToken() {
  return fetch(`${WOMPI_BASE_URL}/merchants/${process.env.WOMPI_PUBLIC_KEY}`)
    .then((r) => r.json())
    .then((data) => data.data.presigned_acceptance.acceptance_token);
}
