import { Suspense } from "react";
import CanvasPageClient from "./CanvasPageClient";

export default function CanvasPage() {
  return (
    <Suspense fallback={
      <div
        style={{
          width: "100vw",
          height: "100vh",
          background: "#050505",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1.5rem",
        }}
      >
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to   { transform: rotate(360deg); }
          }
          @keyframes spin-rev {
            from { transform: rotate(0deg); }
            to   { transform: rotate(-360deg); }
          }
          @keyframes pulse-glow {
            0%, 100% { opacity: 0.6; filter: drop-shadow(0 0 12px rgba(99,102,241,0.5)); }
            50% { opacity: 1; filter: drop-shadow(0 0 24px rgba(99,102,241,0.8)); }
          }
          .loader-ring-1 { animation: spin 1.8s linear infinite; }
          .loader-ring-2 { animation: spin-rev 2.6s linear infinite; }
          .loader-symbol { animation: pulse-glow 2s ease-in-out infinite; }
        `}</style>
        <div style={{ position: "relative", width: 64, height: 64 }}>
          <div
            className="loader-ring-1"
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              border: "1.5px solid transparent",
              borderTopColor: "#6366f1",
              borderRightColor: "rgba(99,102,241,0.3)",
            }}
          />
          <div
            className="loader-ring-2"
            style={{
              position: "absolute",
              inset: 10,
              borderRadius: "50%",
              border: "1px solid transparent",
              borderBottomColor: "#7c3aed",
              borderLeftColor: "rgba(124,58,237,0.3)",
            }}
          />
          <div
            className="loader-symbol"
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.4rem",
              color: "#6366f1",
            }}
          >
            ∞
          </div>
        </div>
        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.78rem", letterSpacing: "0.2em", textTransform: "uppercase" }}>
          Loading canvas
        </p>
      </div>
    }>
      <CanvasPageClient />
    </Suspense>
  );
}
