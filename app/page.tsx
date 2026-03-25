"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import StarField from "@/components/hero/StarField";
import FogLayer from "@/components/hero/FogLayer";
import FloatingGlyphs from "@/components/hero/FloatingGlyphs";

const CORE_SYMBOLS = ["⌬", "⊘", "Ξ", "∞", "Ψ", "Ω", "⚛", "∆", "⌀", "⍟"];

const GLITCH_BASE_DURATION = 250;
const GLITCH_RANDOM_DURATION = 100;
const GLITCH_MIN_INTERVAL = 2500;
const GLITCH_INTERVAL_RANGE = 5500;

export default function Dashboard() {
  const router = useRouter();
  const coreRef = useRef<HTMLDivElement>(null);
  const symbolRef = useRef<HTMLSpanElement>(null);
  const symIdxRef = useRef(0);

  // Glitch + symbol cycling effect
  useEffect(() => {
    const core = coreRef.current;
    const sym = symbolRef.current;
    if (!core || !sym) return;

    let glitchTimer: ReturnType<typeof setTimeout>;

    function triggerGlitch() {
      if (!core || !sym) return;
      core.classList.add("core-glitch");
      symIdxRef.current = (symIdxRef.current + 1) % CORE_SYMBOLS.length;
      sym.textContent = CORE_SYMBOLS[symIdxRef.current];
      setTimeout(() => core?.classList.remove("core-glitch"), GLITCH_BASE_DURATION + Math.random() * GLITCH_RANDOM_DURATION);
      glitchTimer = setTimeout(triggerGlitch, GLITCH_MIN_INTERVAL + Math.random() * GLITCH_INTERVAL_RANGE);
    }

    glitchTimer = setTimeout(triggerGlitch, 3000);
    return () => clearTimeout(glitchTimer);
  }, []);

  // Dispatch alignment event on any tap/click
  const handleInteraction = useCallback(() => {
    window.dispatchEvent(new CustomEvent("hero:align"));
  }, []);

  return (
    <main
      className="hero-container"
      onClick={handleInteraction}
      style={{ background: "#050505", cursor: "crosshair" }}
    >
      <style>{`
        @keyframes sigil-pulse {
          0%, 100% {
            opacity: 0.6;
            filter: drop-shadow(0 0 12px rgba(99, 102, 241, 0.5))
                    drop-shadow(0 0 40px rgba(99, 102, 241, 0.2));
          }
          50% {
            opacity: 1;
            filter: drop-shadow(0 0 24px rgba(99, 102, 241, 0.8))
                    drop-shadow(0 0 60px rgba(139, 92, 246, 0.4));
          }
        }
        @keyframes ring-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes ring-spin-rev {
          from { transform: rotate(0deg); }
          to   { transform: rotate(-360deg); }
        }
        @keyframes ring-mid {
          0%   { transform: rotate(0deg) scale(1); }
          50%  { transform: rotate(180deg) scale(1.04); }
          100% { transform: rotate(360deg) scale(1); }
        }
        @keyframes core-glitch-anim {
          0%   { transform: translate(0, 0) skewX(0deg);   opacity: 0.6; }
          15%  { transform: translate(-5px, 2px) skewX(-3deg); opacity: 1;   }
          30%  { transform: translate(5px, -2px) skewX(3deg);  opacity: 0.3; }
          45%  { transform: translate(-3px, 0) skewX(0deg); opacity: 0.9; }
          60%  { transform: translate(3px, 2px) skewX(2deg);  opacity: 0.6; }
          75%  { transform: translate(-2px, -1px) skewX(-1deg); opacity: 1; }
          90%  { transform: translate(2px, 0) skewX(0deg); opacity: 0.7; }
          100% { transform: translate(0, 0) skewX(0deg);   opacity: 0.6; }
        }
        .core-glitch {
          animation: core-glitch-anim 0.28s steps(1) forwards !important;
        }
        .sigil-symbol {
          animation: sigil-pulse 5s ease-in-out infinite;
        }
        .sigil-ring-1 {
          animation: ring-spin 18s linear infinite;
        }
        .sigil-ring-2 {
          animation: ring-spin-rev 26s linear infinite;
        }
        .sigil-ring-3 {
          animation: ring-mid 38s ease-in-out infinite;
        }
      `}</style>

      <StarField />
      <FogLayer />
      <FloatingGlyphs />

      <div className="hero-content">
        {/* ── Animated sigil (three rings + glitching symbol cluster) ── */}
        <div
          className="fade-in"
          style={{
            animationDelay: "0.1s",
            opacity: 0,
            marginBottom: "3rem",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div ref={coreRef} style={{ position: "relative", width: 130, height: 130 }}>
            {/* Outer rotating ring */}
            <div
              className="sigil-ring-1"
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                border: "1px solid rgba(99,102,241,0.22)",
                borderTopColor: "rgba(99,102,241,0.6)",
              }}
            />
            {/* Middle oscillating ring */}
            <div
              className="sigil-ring-3"
              style={{
                position: "absolute",
                inset: 10,
                borderRadius: "50%",
                border: "1px dashed rgba(139,92,246,0.14)",
                borderLeftColor: "rgba(139,92,246,0.4)",
              }}
            />
            {/* Inner counter-rotating ring */}
            <div
              className="sigil-ring-2"
              style={{
                position: "absolute",
                inset: 22,
                borderRadius: "50%",
                border: "1px solid rgba(139,92,246,0.18)",
                borderBottomColor: "rgba(139,92,246,0.5)",
              }}
            />
            {/* Central glitching symbol */}
            <div
              className="sigil-symbol"
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "2.8rem",
                color: "rgba(99,102,241,0.95)",
                userSelect: "none",
                lineHeight: 1,
              }}
            >
              <span ref={symbolRef}>⌬</span>
            </div>
          </div>
        </div>

        {/* ── Cryptic CTA — fades in after delay ── */}
        <div
          className="fade-in"
          style={{ animationDelay: "2.5s", opacity: 0, marginBottom: "2rem" }}
        >
          <button
            className="hero-enter-btn"
            onClick={(e) => {
              e.stopPropagation();
              router.push("/canvas");
            }}
            aria-label="Initialize"
          >
            INIT
          </button>
        </div>
      </div>
    </main>
  );
}
