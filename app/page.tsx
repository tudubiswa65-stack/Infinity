"use client";

import { useRouter } from "next/navigation";
import StarField from "@/components/hero/StarField";
import FogLayer from "@/components/hero/FogLayer";
import FloatingGlyphs from "@/components/hero/FloatingGlyphs";

export default function Dashboard() {
  const router = useRouter();

  return (
    <main className="hero-container" style={{ background: "#050505" }}>
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
        {/* ── Animated sigil (three rings + logo symbol) ── */}
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
          <div style={{ position: "relative", width: 130, height: 130 }}>
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
            {/* Central symbol — ∞ logo */}
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
              ∞
            </div>
          </div>
        </div>

        {/* ── Brand label ── */}
        <div
          className="fade-in"
          style={{ animationDelay: "0.3s", opacity: 0, marginBottom: "0.75rem" }}
        >
          <span
            style={{
              fontFamily: "'SF Mono', 'Fira Code', monospace",
              fontSize: "0.6rem",
              letterSpacing: "0.55em",
              fontWeight: 500,
              color: "rgba(99,102,241,0.55)",
              textTransform: "uppercase",
            }}
          >
            InfiniteBoard · v3
          </span>
        </div>

        {/* ── Headline ── */}
        <h1
          className="hero-title fade-in"
          style={{
            animationDelay: "0.5s",
            opacity: 0,
            fontSize: "clamp(1.6rem, 4vw, 2.8rem)",
            letterSpacing: "0.08em",
            fontWeight: 300,
            textTransform: "none",
            marginBottom: "1.1rem",
            lineHeight: 1.2,
          }}
        >
          Write. Draw. Explore.
        </h1>

        {/* ── Subtitle ── */}
        <div
          className="fade-in"
          style={{
            animationDelay: "0.7s",
            opacity: 0,
            margin: "0 auto 3rem",
            height: "1.6rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontFamily: "'SF Mono', 'Fira Code', monospace",
              fontSize: "0.7rem",
              letterSpacing: "0.15em",
              color: "rgba(139,92,246,0.55)",
            }}
          >
            An infinite canvas for everyone
          </span>
        </div>

        {/* ── CTA button ── */}
        <div
          className="fade-in"
          style={{ animationDelay: "1s", opacity: 0, marginBottom: "2rem" }}
        >
          <button
            className="hero-enter-btn"
            onClick={() => router.push("/canvas")}
            aria-label="Enter Canvas"
          >
            Enter Canvas
          </button>
        </div>
      </div>

      {/* ── Footer ── */}
      <div
        className="hero-footer fade-in"
        style={{
          animationDelay: "1.4s",
          opacity: 0,
          color: "rgba(255,255,255,0.15)",
          letterSpacing: "0.5em",
          textTransform: "uppercase",
          fontSize: "0.6rem",
          fontFamily: "'SF Mono', 'Fira Code', monospace",
          bottom: "2.5rem",
        }}
      >
        InfiniteBoard
      </div>
    </main>
  );
}
