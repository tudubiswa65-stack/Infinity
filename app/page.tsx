"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import StarField from "@/components/hero/StarField";
import FogLayer from "@/components/hero/FogLayer";

export default function Dashboard() {
  const router = useRouter();
  const [coords, setCoords] = useState({ x: "00.00", y: "00.00" });
  const [hasInteracted, setHasInteracted] = useState(false);

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
        .sigil-symbol {
          animation: sigil-pulse 5s ease-in-out infinite;
        }
        .sigil-ring-1 {
          animation: ring-spin 18s linear infinite;
        }
        .sigil-ring-2 {
          animation: ring-spin-rev 26s linear infinite;
        }
        .coords-display {
          font-family: 'SF Mono', 'Fira Code', monospace;
          font-size: 0.7rem;
          letter-spacing: 0.25em;
          transition: color 0.4s ease;
        }
      `}</style>

      <StarField />
      <FogLayer />

      <div className="hero-content">
        {/* ── Animated sigil ── */}
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
          <div style={{ position: "relative", width: 110, height: 110 }}>
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
            {/* Inner rotating ring */}
            <div
              className="sigil-ring-2"
              style={{
                position: "absolute",
                inset: 14,
                borderRadius: "50%",
                border: "1px solid rgba(139,92,246,0.18)",
                borderBottomColor: "rgba(139,92,246,0.5)",
              }}
            />
            {/* ∞ symbol */}
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

        {/* ── App name ── */}
        <div
          className="fade-in"
          style={{ animationDelay: "0.3s", opacity: 0, marginBottom: "0.75rem" }}
        >
          <span
            style={{
              fontSize: "0.65rem",
              letterSpacing: "0.55em",
              fontWeight: 500,
              color: "rgba(99,102,241,0.7)",
              textTransform: "uppercase",
            }}
          >
            InfiniteBoard
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
          A canvas without limits
        </h1>

        {/* ── Sub-headline ── */}
        <p
          className="fade-in"
          style={{
            animationDelay: "0.7s",
            opacity: 0,
            fontSize: "0.9rem",
            color: "rgba(180,180,200,0.55)",
            lineHeight: 1.7,
            maxWidth: 420,
            margin: "0 auto 3rem",
            fontWeight: 300,
            letterSpacing: "0.02em",
          }}
        >
          Write, draw, and collaborate on an infinite shared canvas.
          <br />
          Every trace lasts forever.
        </p>

        {/* ── CTA button ── */}
        <div
          className="fade-in"
          style={{ animationDelay: "1s", opacity: 0, marginBottom: "2rem" }}
        >
          <button
            className="hero-enter-btn"
            onClick={() => router.push("/canvas")}
          >
            Enter the canvas
          </button>
        </div>

        {/* ── Coordinate readout ── */}
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
          color: "rgba(255,255,255,0.18)",
          letterSpacing: "0.5em",
          textTransform: "uppercase",
          fontSize: "0.6rem",
          bottom: "2.5rem",
        }}
      >
        Leave your trace
      </div>
    </main>
  );
}
