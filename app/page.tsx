"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import StarField from "@/components/hero/StarField";
import FogLayer from "@/components/hero/FogLayer";

export default function Dashboard() {
  const router = useRouter();
  const [coords, setCoords] = useState({ x: "00.00", y: "00.00" });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      document.documentElement.style.setProperty("--mouse-x", `${x}%`);
      document.documentElement.style.setProperty("--mouse-y", `${y}%`);
      
      setCoords({
        x: x.toFixed(2).padStart(6, '0'),
        y: y.toFixed(2).padStart(6, '0')
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <main className="hero-container" style={{ background: "#050505" }}>
      <style>{`
        @keyframes cryptic-pulse {
          0%, 100% {
            opacity: 0.2;
            filter: blur(2px) drop-shadow(0 0 5px rgba(99, 102, 241, 0.2));
          }
          50% {
            opacity: 0.5;
            filter: blur(0px) drop-shadow(0 0 20px rgba(99, 102, 241, 0.4));
          }
        }
        .sigil-anim {
          animation: cryptic-pulse 10s ease-in-out infinite;
        }
      `}</style>
      
      <StarField />
      <FogLayer />

      <div className="hero-content">
        <div
          className="fade-in"
          style={{ 
            animationDelay: "0.2s", 
            opacity: 0, 
            marginBottom: "4rem",
            display: "flex",
            justifyContent: "center"
          }}
        >
          <div 
            className="sigil-anim"
            style={{
              fontSize: "5rem",
              color: "rgba(99, 102, 241, 0.4)",
              userSelect: "none",
              fontFamily: "serif",
            }}
          >
            ∞
          </div>
        </div>

        <h1
          className="hero-title fade-in"
          style={{ 
            animationDelay: "0.5s", 
            opacity: 0,
            fontSize: "1rem",
            letterSpacing: "1em",
            fontWeight: 200,
            color: "rgba(255, 255, 255, 0.5)",
            textTransform: "uppercase",
            marginRight: "-1em"
          }}
        >
          They are waiting
        </h1>

        <p
          className="hero-subtitle fade-in"
          style={{ 
            animationDelay: "0.8s", 
            opacity: 0,
            fontFamily: "monospace",
            fontSize: "0.75rem",
            color: "#2a2a2a",
            marginTop: "2rem",
            letterSpacing: "0.3em"
          }}
        >
          {coords.x} ∴ {coords.y}
        </p>

        <div 
          className="fade-in"
          style={{ animationDelay: "1.2s", opacity: 0, marginTop: "6rem" }}
        >
          <button
            onClick={() => router.push("/canvas")}
            style={{ 
              background: "transparent",
              border: "1px solid rgba(255, 255, 255, 0.05)",
              padding: "1rem 3.5rem",
              fontSize: "0.7rem",
              letterSpacing: "0.5em",
              color: "rgba(255, 255, 255, 0.3)",
              cursor: "pointer",
              transition: "all 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
              textTransform: "uppercase",
              position: "relative",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.15)";
              e.currentTarget.style.color = "rgba(255, 255, 255, 0.7)";
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.01)";
              e.currentTarget.style.letterSpacing = "0.6em";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.05)";
              e.currentTarget.style.color = "rgba(255, 255, 255, 0.3)";
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.letterSpacing = "0.5em";
            }}
          >
            Descend
          </button>
        </div>
      </div>

      <div 
        className="hero-footer fade-in" 
        style={{ 
          animationDelay: "2s", 
          opacity: 0, 
          color: "#121212", 
          letterSpacing: "0.8em",
          textTransform: "uppercase",
          fontSize: "0.6rem",
          bottom: "3rem"
        }}
      >
        Leave your trace
      </div>
    </main>
  );
}
