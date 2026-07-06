import { NextResponse } from "next/server";

const WOMPI_BASE_URL = process.env.WOMPI_SANDBOX === "false"
  ? "https://production.wompi.co/v1"
  : "https://sandbox.wompi.co/v1";

export async function POST(req: Request) {
  try {
    const { name, description, amountInCents, reference, redirectUrl } =
      await req.json();

    const privateKey = process.env.WOMPI_PRIVATE_KEY;
    if (!privateKey) {
      return NextResponse.json(
        { error: "WOMPI_PRIVATE_KEY no configurado" },
        { status: 500 },
      );
    }

    if (!amountInCents || !reference) {
      return NextResponse.json(
        { error: "amountInCents y reference son requeridos" },
        { status: 400 },
      );
    }

    const response = await fetch(`${WOMPI_BASE_URL}/payment_links`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${privateKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: name || "Pedido ARKE",
        description: description || "Camiseta personalizada ARKE",
        single_use: true,
        collect_shipping: false,
        currency: "COP",
        amount_in_cents: amountInCents,
        sku: reference,
        redirect_url: redirectUrl,
      }),
    });

    const data = await response.json();
    console.log("[Wompi] Link response:", JSON.stringify(data));

    if (data.data?.id) {
      return NextResponse.json({
        paymentUrl: `https://checkout.wompi.co/l/${data.data.id}`,
        linkId: data.data.id,
      });
    }

    return NextResponse.json({ error: data }, { status: 500 });
  } catch (error) {
    console.error("[Wompi] Create link error:", error);
    return NextResponse.json(
      { error: "Error creando link de pago" },
      { status: 500 },
    );
  }
}
