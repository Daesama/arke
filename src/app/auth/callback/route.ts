import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/crear";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const url = new URL(next, origin);
      if (next === "/crear") {
        url.searchParams.set("welcome", "true");
      }
      return NextResponse.redirect(url);
    }
  }

  const loginUrl = new URL("/auth/login", origin);
  loginUrl.searchParams.set("error", "verification");
  return NextResponse.redirect(loginUrl);
}
