"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import StarField from "@/components/hero/StarField";
import FogLayer from "@/components/hero/FogLayer";
import FloatingGlyphs from "@/components/hero/FloatingGlyphs";

// Cryptic rotating fragments shown beneath the sigil
const CRYPTIC_FRAGMENTS = [
  "∂ₓ · Ω ≠ ∅",
  "0x1F → ∞",
  "7743 ∴ ?",
  "NaN ∈ [∅,∞)",
  "Ψ² − Δθ = §",
  "αβγ · ⌖ · dt⁻¹",
  "∑ₙ≥0 ⊕ ◈",
  "⟦ ∴ ⟧ ≈ ∞",
  "Λ · Φ · Ξ",
  "???.?? ∵ ???.??",
];

export default function Dashboard() {
  const router = useRouter();
  const [coords, setCoords] = useState({ x: "???.??", y: "???.??" });
  const [hasInteracted, setHasInteracted] = useState(false);
  const [fragment, setFragment] = useState(CRYPTIC_FRAGMENTS[0]);
  const fragmentIdx = useRef(0);

  // Rotate cryptic fragments
  useEffect(() => {
    const id = setInterval(() => {
      fragmentIdx.current = (fragmentIdx.current + 1) % CRYPTIC_FRAGMENTS.length;
      setFragment(CRYPTIC_FRAGMENTS[fragmentIdx.current]);
    }, 3200);
    return () => clearInterval(id);
  }, []);

  // Track cursor → show as raw numbers, no label
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      document.documentElement.style.setProperty("--mouse-x", `${x}%`);
      document.documentElement.style.setProperty("--mouse-y", `${y}%`);

      setCoords({
        x: x.toFixed(2).padStart(6, "0"),
        y: y.toFixed(2).padStart(6, "0"),
      });

      if (!hasInteracted) setHasInteracted(true);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [hasInteracted]);

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
        @keyframes fragment-swap {
          0%   { opacity: 0; transform: translateY(4px); }
          15%  { opacity: 1; transform: translateY(0); }
          85%  { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-4px); }
        }
        @keyframes noise-flicker {
          0%, 100% { opacity: 1; }
          92%      { opacity: 1; }
          93%      { opacity: 0.4; }
          94%      { opacity: 1; }
          97%      { opacity: 0.7; }
          98%      { opacity: 1; }
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
        .cryptic-fragment {
          animation: fragment-swap 3.2s ease-in-out infinite;
          font-family: 'SF Mono', 'Fira Code', monospace;
          font-size: 0.7rem;
          letter-spacing: 0.28em;
        }
        .coords-display {
          font-family: 'SF Mono', 'Fira Code', monospace;
          font-size: 0.7rem;
          letter-spacing: 0.25em;
          transition: color 0.4s ease;
          animation: noise-flicker 8s ease-in-out infinite;
        }
        .hero-label {
          font-family: 'SF Mono', 'Fira Code', monospace;
          font-size: 0.6rem;
          letter-spacing: 0.55em;
          animation: noise-flicker 12s ease-in-out infinite;
        }
      `}</style>

      <StarField />
      <FogLayer />
      <FloatingGlyphs />

      <div className="hero-content">
        {/* ── Animated sigil (three rings + symbol) ── */}
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
            {/* Central symbol — ∞ */}
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

        {/* ── Anonymous identifier ── */}
        <div
          className="fade-in"
          style={{ animationDelay: "0.3s", opacity: 0, marginBottom: "0.75rem" }}
        >
          <span
            className="hero-label"
            style={{
              fontWeight: 500,
              color: "rgba(99,102,241,0.55)",
              textTransform: "uppercase",
            }}
          >
            ∅ · Ω · ∞ · § · ?
          </span>
        </div>

        {/* ── Cryptic headline ── */}
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
            fontFamily: "'SF Mono', 'Fira Code', monospace",
          }}
        >
          ∴ &nbsp; unknown &nbsp; ∴
        </h1>

        {/* ── Rotating cryptic fragments ── */}
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
            key={fragment}
            className="cryptic-fragment"
            style={{ color: "rgba(139,92,246,0.45)" }}
          >
            {fragment}
          </span>
        </div>

        {/* ── CTA — opaque symbol button ── */}
        <div
          className="fade-in"
          style={{ animationDelay: "1s", opacity: 0, marginBottom: "2rem" }}
        >
          <button
            className="hero-enter-btn"
            onClick={() => router.push("/canvas")}
            title="▶"
            aria-label="Enter"
          >
            ▶&ensp;∞
          </button>
        </div>

        {/* ── Raw coordinate stream ── */}
        <div
          className="fade-in"
          style={{ animationDelay: "1.4s", opacity: 0, marginTop: "2.5rem" }}
        >
          <p
            className="coords-display"
            style={{
              color: hasInteracted
                ? "rgba(99,102,241,0.4)"
                : "rgba(80,80,100,0.35)",
            }}
          >
            {coords.x}&nbsp;∴&nbsp;{coords.y}
          </p>
        </div>
      </div>

      {/* ── Footer ── */}
      <div
        className="hero-footer fade-in"
        style={{
          animationDelay: "1.8s",
          opacity: 0,
          color: "rgba(255,255,255,0.15)",
          letterSpacing: "0.5em",
          textTransform: "uppercase",
          fontSize: "0.6rem",
          fontFamily: "'SF Mono', 'Fira Code', monospace",
          bottom: "2.5rem",
        }}
      >
        ∅ &nbsp; · &nbsp; Ω &nbsp; · &nbsp; ∞ &nbsp; · &nbsp; §
      </div>
    </main>
  );
}
