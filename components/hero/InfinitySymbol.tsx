export default function InfinitySymbol() {
  return (
    <div className="infinity-container">
      <svg
        viewBox="0 0 200 80"
        className="infinity-symbol"
        style={{
          width: "200px",
          height: "80px",
          position: "relative",
          zIndex: 2,
        }}
      >
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="infinityGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
        </defs>
        <path
          d="M 50 40
             C 30 40, 10 20, 10 40
             C 10 60, 30 40, 50 40
             C 70 40, 80 20, 100 40
             C 120 20, 130 40, 150 40
             C 170 40, 190 20, 190 40
             C 190 60, 170 40, 150 40
             C 130 40, 120 60, 100 40
             C 80 60, 70 40, 50 40 Z"
          fill="none"
          stroke="url(#infinityGradient)"
          strokeWidth="3"
          strokeLinecap="round"
          filter="url(#glow)"
        />
      </svg>
      <style jsx>{`
        .infinity-container {
          animation: float 6s ease-in-out infinite;
        }
        .infinity-symbol {
          animation: pulse-glow 4s ease-in-out infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes pulse-glow {
          0%, 100% { filter: url(#glow) drop-shadow(0 0 10px rgba(99, 102, 241, 0.5)); }
          50% { filter: url(#glow) drop-shadow(0 0 25px rgba(99, 102, 241, 0.8)); }
        }
      `}</style>
    </div>
  );
}
