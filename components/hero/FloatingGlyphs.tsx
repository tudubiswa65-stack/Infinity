"use client";

import { useEffect, useRef } from "react";

interface Particle {
  el: HTMLDivElement;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

export default function FloatingGlyphs() {
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const glyphsRef = useRef<Particle[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const MAX_GLYPHS = 28;

    function spawnGlyph() {
      if (!container) return;
      const el = document.createElement("div");
      const size = 2 + Math.random() * 3;
      const opacity = 0.08 + Math.random() * 0.18;
      const hue = Math.random() < 0.6 ? "rgba(99,102,241," : "rgba(139,92,246,";
      el.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background: ${hue}${opacity});
        pointer-events: none;
        will-change: transform, opacity;
        transition: opacity 1.8s ease;
        opacity: 0;
      `;
      const x = Math.random() * 100;
      const y = Math.random() * 100;
      el.style.left = `${x}%`;
      el.style.top = `${y}%`;
      container.appendChild(el);

      const maxLife = 6000 + Math.random() * 10000;
      const particle: Particle = {
        el,
        x,
        y,
        vx: (Math.random() - 0.5) * 0.003,
        vy: (Math.random() - 0.5) * 0.003,
        life: 0,
        maxLife,
      };
      glyphsRef.current.push(particle);

      // Fade in
      requestAnimationFrame(() => {
        el.style.opacity = String(opacity);
      });
    }

    let last = performance.now();

    function tick(now: number) {
      const dt = now - last;
      last = now;

      // Spawn new particles
      if (glyphsRef.current.length < MAX_GLYPHS && Math.random() < 0.04) {
        spawnGlyph();
      }

      glyphsRef.current = glyphsRef.current.filter((g) => {
        g.life += dt;
        g.x += g.vx * dt;
        g.y += g.vy * dt;
        g.el.style.left = `${g.x}%`;
        g.el.style.top = `${g.y}%`;

        // Start fading out near end of life
        if (g.life > g.maxLife * 0.75) {
          g.el.style.opacity = "0";
        }

        if (g.life > g.maxLife) {
          g.el.remove();
          return false;
        }
        return true;
      });

      animRef.current = requestAnimationFrame(tick);
    }

    // Seed initial particles
    for (let count = 0; count < 16; count++) spawnGlyph();

    animRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animRef.current);
      glyphsRef.current.forEach((g) => g.el.remove());
      glyphsRef.current = [];
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 2,
        overflow: "hidden",
      }}
    />
  );
}
