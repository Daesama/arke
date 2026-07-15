import { RateLimiterMemory } from "rate-limiter-flexible";
import { NextResponse } from "next/server";

const limiters = new Map<string, RateLimiterMemory>();

function getLimiter(name: string, points: number, duration: number) {
  const key = `${name}-${points}-${duration}`;
  let limiter = limiters.get(key);
  if (!limiter) {
    limiter = new RateLimiterMemory({ points, duration });
    limiters.set(key, limiter);
  }
  return limiter;
}

function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}

export async function checkRateLimit(
  req: Request,
  name: string,
  points: number,
  durationSeconds: number,
): Promise<NextResponse | null> {
  const limiter = getLimiter(name, points, durationSeconds);
  const ip = getClientIp(req);

  try {
    await limiter.consume(ip);
    return null;
  } catch {
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Intenta en unos momentos." },
      { status: 429 },
    );
  }
}
