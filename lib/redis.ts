import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

function createRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    return null;
  }
  try {
    return new Redis({ url, token });
  } catch {
    return null;
  }
}

const redis = createRedis();

export const messageLimiter: Ratelimit | undefined = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "1 m"),
      analytics: false,
      prefix: "ib:msg",
    })
  : undefined;

export const strokeLimiter: Ratelimit | undefined = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "1 m"),
      analytics: false,
      prefix: "ib:strk",
    })
  : undefined;
