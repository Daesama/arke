import crypto from "crypto";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { reference, amountInCents } = await req.json();

    const secret = process.env.WOMPI_INTEGRITY_SECRET;

    if (!reference || !amountInCents) {
      return NextResponse.json(
        { error: "reference y amountInCents son requeridos" },
        { status: 400 },
      );
    }

    if (!secret) {
      return NextResponse.json(
        { error: "WOMPI_INTEGRITY_SECRET no configurado" },
        { status: 500 },
      );
    }

    const stringToHash = `${reference}${amountInCents}COP${secret}`;
    const signature = crypto
      .createHash("sha256")
      .update(stringToHash)
      .digest("hex");

    return NextResponse.json({ signature, reference });
  } catch (error) {
    console.error("Wompi sign error:", error);
    return NextResponse.json(
      { error: "Error generando firma" },
      { status: 500 },
    );
  }
}
