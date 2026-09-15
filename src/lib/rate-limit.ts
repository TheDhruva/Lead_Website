const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 5;

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();
let lastSweep = 0;

/**
 * In-memory per-IP rate limit for the contact endpoint.
 *
 * NOTE: This state lives inside one serverless instance. On Vercel a request
 * may hit a different isolate, so this is a best-effort backstop, not a hard
 * guarantee across all edge nodes. A durable store (e.g. Upstash Redis, Vercel
 * KV) is the right upgrade when the form sees real traffic.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}

export function checkRateLimit(ip: string): {
  limited: boolean;
  retryAfterSeconds: number;
} {
  const now = Date.now();

  if (now - lastSweep > WINDOW_MS) {
    for (const [key, entry] of store) {
      if (entry.resetAt < now) store.delete(key);
    }
    lastSweep = now;
  }

  const entry = store.get(ip);
  if (!entry || entry.resetAt < now) {
    store.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { limited: false, retryAfterSeconds: 0 };
  }

  entry.count += 1;
  if (entry.count > MAX_REQUESTS_PER_WINDOW) {
    return {
      limited: true,
      retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
    };
  }

  return { limited: false, retryAfterSeconds: 0 };
}
