"use client";

import { useEffect, useRef } from "react";

const GLYPHS = [
  "∞", "∅", "Ω", "Ψ", "Σ", "Δ", "Λ", "Φ", "Θ", "Ξ",
  "⊕", "⊗", "∴", "∵", "≈", "≠", "∈", "∉", "⊂", "⊄",
  "α", "β", "γ", "δ", "ε", "ζ", "η", "ι", "κ", "λ",
  "§", "¶", "†", "‡", "※", "‰", "℃", "℉", "№", "℗",
  "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
  "⌖", "⌗", "⌘", "⌛", "⌜", "⌝", "⌞", "⌟",
  "▲", "▼", "◆", "●", "■", "▸", "◂", "◈",
  "⟨", "⟩", "⟦", "⟧", "⟮", "⟯",
  "?", "!", "#", "@", "%", "&", "*",
  "7743", "∞²", "0x0F", "NaN", "∂ₓ", "dt⁻¹",
  "⁰", "¹", "²", "³", "⁴", "⁵", "⁶", "⁷", "⁸", "⁹",
];

interface Glyph {
  el: HTMLSpanElement;
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
  const glyphsRef = useRef<Glyph[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const MAX_GLYPHS = 28;

    function spawnGlyph() {
      if (!container) return;
      const text = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      const el = document.createElement("span");
      el.textContent = text;
      const size = 0.55 + Math.random() * 0.65;
      const opacity = 0.08 + Math.random() * 0.18;
      const hue = Math.random() < 0.6 ? "rgba(99,102,241," : "rgba(139,92,246,";
      el.style.cssText = `
        position: absolute;
        font-size: ${size}rem;
        color: ${hue}${opacity});
        font-family: 'SF Mono', 'Fira Code', monospace;
        pointer-events: none;
        user-select: none;
        white-space: nowrap;
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
      const glyph: Glyph = {
        el,
        x,
        y,
        vx: (Math.random() - 0.5) * 0.003,
        vy: (Math.random() - 0.5) * 0.003,
        life: 0,
        maxLife,
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

      // Spawn new glyphs
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

    // Seed initial glyphs
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
