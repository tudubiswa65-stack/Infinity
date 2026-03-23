"use client";

import { useState, useCallback, useRef } from "react";

export type CanvasMode = "write" | "draw";

export interface CanvasState {
  offsetX: number;
  offsetY: number;
  scale: number;
  mode: CanvasMode;
}

export function useCanvas(initialX = 0, initialY = 0) {
  const [offset, setOffset] = useState({ x: -initialX, y: -initialY });
  const [scale, setScale] = useState(1);
  const [mode, setMode] = useState<CanvasMode>("write");

  const isPanning = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  const startPan = useCallback((clientX: number, clientY: number) => {
    isPanning.current = true;
    lastMouse.current = { x: clientX, y: clientY };
  }, []);

  const updatePan = useCallback((clientX: number, clientY: number) => {
    if (!isPanning.current) return false;
    const dx = clientX - lastMouse.current.x;
    const dy = clientY - lastMouse.current.y;
    lastMouse.current = { x: clientX, y: clientY };
    setOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
    return true;
  }, []);

  const endPan = useCallback(() => {
    isPanning.current = false;
  }, []);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale((prev) => Math.min(Math.max(prev * delta, 0.1), 5));
  }, []);

  // Convert screen coordinates to world coordinates
  const screenToWorld = useCallback(
    (screenX: number, screenY: number) => {
      return {
        x: (screenX - offset.x) / scale,
        y: (screenY - offset.y) / scale,
      };
    },
    [offset, scale]
  );

  // Convert world coordinates to screen coordinates
  const worldToScreen = useCallback(
    (worldX: number, worldY: number) => {
      return {
        x: worldX * scale + offset.x,
        y: worldY * scale + offset.y,
      };
    },
    [offset, scale]
  );

  return {
    offset,
    scale,
    mode,
    setMode,
    startPan,
    updatePan,
    endPan,
    handleWheel,
    screenToWorld,
    worldToScreen,
    isPanning,
  };
}
