export default function FogLayer() {
  return (
    <>
      <style>{`
        @keyframes drift {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -20px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
        }
        .nebula-1 {
          animation: drift 30s ease-in-out infinite;
        }
        .nebula-2 {
          animation: drift 40s ease-in-out infinite reverse;
        }
      `}</style>

      {/* Bottom fog layer */}
      <div
        className="fog-bottom"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: "40vh",
          background: "linear-gradient(to top, rgba(15, 15, 15, 0.9), transparent)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />
      {/* Top vignette */}
      <div
        className="vignette"
        style={{
          position: "fixed",
          inset: 0,
          background: "radial-gradient(circle at center, transparent 0%, rgba(15, 15, 15, 0.4) 100%)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />
      {/* Animated nebula clouds */}
      <div
        className="nebula-1"
        style={{
          position: "fixed",
          top: "10%",
          left: "-10%",
          width: "50%",
          height: "50%",
          background: "radial-gradient(ellipse, rgba(99, 102, 241, 0.08) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <div
        className="nebula-2"
        style={{
          position: "fixed",
          bottom: "20%",
          right: "-10%",
          width: "60%",
          height: "60%",
          background: "radial-gradient(ellipse, rgba(139, 92, 246, 0.06) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
    </>
  );
}
