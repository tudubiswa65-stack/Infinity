import { NextRequest } from "next/server";

/**
 * Extracts the real client IP address from the request, respecting
 * X-Forwarded-For (set by proxies/load-balancers) and X-Real-IP headers.
 *
 * Note: X-Forwarded-For can be spoofed by clients unless the deployment
 * platform is configured to strip/override it (e.g. Vercel, Railway, Fly.io
 * all do this automatically). Ensure your reverse proxy only forwards
 * headers from trusted upstream sources.
 */
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}
