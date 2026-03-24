"use client";

import { useEffect, useRef } from "react";

export default function StarField() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Create stars with random properties
    const createStars = () => {
      const layers = [
        { count: 50, size: "1px", duration: 60, opacity: 0.3 },
        { count: 40, size: "2px", duration: 45, opacity: 0.5 },
        { count: 30, size: "3px", duration: 30, opacity: 0.7 },
      ];

      layers.forEach((layer, layerIndex) => {
        for (let i = 0; i < layer.count; i++) {
          const star = document.createElement("div");
          star.className = "star";
          star.style.cssText = `
            position: absolute;
            width: ${layer.size};
            height: ${layer.size};
            background: white;
            border-radius: 50%;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            opacity: ${Math.random() * layer.opacity};
            animation: twinkle ${layer.duration + Math.random() * 20}s ease-in-out infinite;
            animation-delay: ${Math.random() * 20}s;
            will-change: opacity;
          `;
          container.appendChild(star);
        }
      });
    };

    createStars();

    return () => {
      if (container) {
        container.innerHTML = "";
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="star-field"
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 0,
        overflow: "hidden",
      }}
    />
  );
}
