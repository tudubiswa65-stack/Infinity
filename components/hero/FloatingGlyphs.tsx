"use client";

import { useEffect, useRef } from "react";

const SYMBOLS = [
  "∆", "Ω", "Ψ", "Ж", "∞", "Ξ", "⊘", "⌬", "⚛",
  "◈", "⋄", "⌖", "⊛", "⊕", "✦", "⟁", "⌀", "⊞",
  "⋈", "∴", "⌘", "⍟", "⎋", "⌁",
];

interface Glyph {
  el: HTMLDivElement;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  opacity: number;
}

export default function FloatingGlyphs() {
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const glyphsRef = useRef<Glyph[]>([]);
  const alignedRef = useRef<boolean>(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const MAX_GLYPHS = 24;

    function spawnGlyph() {
      if (!container) return;
      const el = document.createElement("div");
      const symbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
      const size = 0.7 + Math.random() * 1.3;
      const opacity = 0.05 + Math.random() * 0.15;
      const hue = Math.random() < 0.6 ? "rgba(99,102,241," : "rgba(139,92,246,";

      el.style.cssText = `
        position: absolute;
        font-family: 'SF Mono', 'Fira Code', monospace;
        font-size: ${size}rem;
        color: ${hue}${opacity});
        pointer-events: none;
        will-change: transform, opacity;
        transition: opacity 2s ease;
        opacity: 0;
        user-select: none;
        line-height: 1;
      `;
      el.textContent = symbol;

      const x = Math.random() * 95;
      const y = Math.random() * 95;
      el.style.left = `${x}%`;
      el.style.top = `${y}%`;
      container.appendChild(el);

      const maxLife = 8000 + Math.random() * 12000;
      const glyph: Glyph = {
        el,
        x,
        y,
        vx: (Math.random() - 0.5) * 0.002,
        vy: (Math.random() - 0.5) * 0.002 - 0.0003,
        life: 0,
        maxLife,
        opacity,
      };
      glyphsRef.current.push(glyph);

      // Fade in
      requestAnimationFrame(() => {
        el.style.opacity = String(opacity);
      });
    }

    let last = performance.now();

    function tick(now: number) {
      const dt = now - last;
      last = now;

      if (!alignedRef.current) {
        // Spawn new glyphs
        if (glyphsRef.current.length < MAX_GLYPHS && Math.random() < 0.03) {
          spawnGlyph();
        }

        glyphsRef.current = glyphsRef.current.filter((g) => {
          g.life += dt;
          g.x += g.vx * dt;
          g.y += g.vy * dt;

          // Wrap around edges
          if (g.x < -5) g.x = 100;
          if (g.x > 102) g.x = -3;
          if (g.y < -5) g.y = 100;
          if (g.y > 102) g.y = -3;

          g.el.style.left = `${g.x}%`;
          g.el.style.top = `${g.y}%`;

          // Start fading out near end of life
          if (g.life > g.maxLife * 0.8) {
            g.el.style.opacity = "0";
          }

          if (g.life > g.maxLife) {
            g.el.remove();
            return false;
          }
          return true;
        });
      }

      animRef.current = requestAnimationFrame(tick);
    }

    function handleAlign() {
      if (alignedRef.current) return;
      alignedRef.current = true;

      const cols = 5;
      glyphsRef.current.forEach((g, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const targetX = 10 + col * 17;
        const targetY = 22 + row * 18;
        g.el.style.transition =
          "left 0.8s cubic-bezier(0.4,0,0.2,1), top 0.8s cubic-bezier(0.4,0,0.2,1), opacity 0.8s ease";
        g.el.style.left = `${targetX}%`;
        g.el.style.top = `${targetY}%`;
        g.el.style.opacity = String(Math.min(g.opacity * 4, 0.45));
        g.x = targetX;
        g.y = targetY;
      });

      setTimeout(() => {
        alignedRef.current = false;
        glyphsRef.current.forEach((g) => {
          g.x = Math.random() * 95;
          g.y = Math.random() * 95;
          g.el.style.transition =
            "left 1.6s ease, top 1.6s ease, opacity 2s ease";
          g.el.style.left = `${g.x}%`;
          g.el.style.top = `${g.y}%`;
          g.el.style.opacity = String(g.opacity);
        });

        setTimeout(() => {
          glyphsRef.current.forEach((g) => {
            g.el.style.transition = "opacity 2s ease";
          });
        }, 1700);
      }, 1500);
    }

    // Seed initial glyphs
    for (let i = 0; i < 18; i++) spawnGlyph();

    animRef.current = requestAnimationFrame(tick);
    window.addEventListener("hero:align", handleAlign as EventListener);

    return () => {
      cancelAnimationFrame(animRef.current);
      glyphsRef.current.forEach((g) => g.el.remove());
      glyphsRef.current = [];
      window.removeEventListener("hero:align", handleAlign as EventListener);
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
