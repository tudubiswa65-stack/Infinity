"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { RateLimitState } from "@/types";

const MESSAGE_LIMIT = 10;
const STROKE_LIMIT = 5;

interface RateLimitResponse {
  limit: number;
  remaining: number;
  reset: number;
}

export function useRateLimit() {
  const [rateLimits, setRateLimits] = useState<RateLimitState>({
    messages: { limit: MESSAGE_LIMIT, remaining: MESSAGE_LIMIT, resetTime: 0, isLimited: false },
    strokes: { limit: STROKE_LIMIT, remaining: STROKE_LIMIT, resetTime: 0, isLimited: false },
  });

  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Update countdown timers
  useEffect(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }

    const now = Date.now();
    const hasActiveReset = Object.values(rateLimits).some((rl) => rl.resetTime > now);

    if (hasActiveReset) {
      countdownIntervalRef.current = setInterval(() => {
        setRateLimits((prev) => {
          const now = Date.now();
          let updated = false;

          const newLimits = { ...prev };
          for (const [key, limit] of Object.entries(newLimits)) {
            if (limit.resetTime > now && limit.remaining < limit.limit) {
              updated = true;
            } else if (limit.resetTime <= now && limit.remaining < limit.limit) {
              newLimits[key as keyof RateLimitState] = {
                ...limit,
                remaining: limit.limit,
                resetTime: 0,
                isLimited: false,
              };
              updated = true;
            }
          }

          return updated ? newLimits : prev;
        });
      }, 1000);
    }

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [rateLimits]);

  const updateFromResponse = useCallback((type: "messages" | "strokes", headers: Headers) => {
    const limit = parseInt(headers.get("RateLimit-Limit") ?? "0");
    const remaining = parseInt(headers.get("RateLimit-Remaining") ?? "0");
    const reset = parseInt(headers.get("RateLimit-Reset") ?? "0");

    setRateLimits((prev) => ({
      ...prev,
      [type]: {
        limit: limit > 0 ? limit : prev[type].limit,
        remaining: remaining >= 0 ? remaining : prev[type].remaining,
        resetTime: reset > 0 ? reset * 1000 : 0,
        isLimited: remaining === 0,
      },
    }));
  }, []);

  const handleRateLimitError = useCallback((type: "messages" | "strokes", headers: Headers) => {
    const limit = parseInt(headers.get("RateLimit-Limit") ?? "0");
    const reset = parseInt(headers.get("RateLimit-Reset") ?? "0");

    setRateLimits((prev) => ({
      ...prev,
      [type]: {
        limit: limit > 0 ? limit : prev[type].limit,
        remaining: 0,
        resetTime: reset > 0 ? reset * 1000 : Date.now() + 60000,
        isLimited: true,
      },
    }));
  }, []);

  const checkCanProceed = useCallback((type: "messages" | "strokes") => {
    const limit = rateLimits[type];
    if (limit.isLimited) {
      return {
        allowed: false as const,
        secondsUntilReset: Math.max(0, Math.ceil((limit.resetTime - Date.now()) / 1000)),
      };
    }
    return { allowed: true as const };
  }, [rateLimits]);

  const getRemainingTime = useCallback((type: "messages" | "strokes") => {
    const limit = rateLimits[type];
    if (limit.resetTime <= Date.now()) return 0;
    return Math.max(0, Math.ceil((limit.resetTime - Date.now()) / 1000));
  }, [rateLimits]);

  return {
    rateLimits,
    updateFromResponse,
    handleRateLimitError,
    checkCanProceed,
    getRemainingTime,
  };
}
