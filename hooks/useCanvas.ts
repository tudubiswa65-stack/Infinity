"use client";

import { useState, useCallback, useRef } from "react";

export type CanvasMode = "write" | "draw" | "pan";

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
    if (e.ctrlKey || e.metaKey) {
      // Zoom centered on cursor
      const rect = (e.currentTarget as HTMLElement)?.getBoundingClientRect?.();
      const offsetX = rect ? e.clientX - rect.left : e.clientX;
      const offsetY = rect ? e.clientY - rect.top : e.clientY;
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setScale((prev) => {
        const next = Math.min(Math.max(prev * delta, 0.05), 10);
        const ratio = next / prev;
        setOffset((o) => ({
          x: offsetX - ratio * (offsetX - o.x),
          y: offsetY - ratio * (offsetY - o.y),
        }));
        return next;
      });
    } else {
      // Scroll to pan
      setOffset((prev) => ({
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY,
      }));
    }
  }, []);

  // Apply a zoom factor centered on a screen coordinate (used for pinch-to-zoom)
  const applyZoom = useCallback(
    (factor: number, centerX: number, centerY: number) => {
      setScale((prev) => {
        const next = Math.min(Math.max(prev * factor, 0.05), 10);
        const ratio = next / prev;
        setOffset((o) => ({
          x: centerX - ratio * (centerX - o.x),
          y: centerY - ratio * (centerY - o.y),
        }));
        return next;
      });
    },
    []
  );

  // Jump to a world coordinate (centers the viewport on it)
  const jumpTo = useCallback(
    (worldX: number, worldY: number, viewportWidth: number, viewportHeight: number) => {
      setOffset({
        x: viewportWidth / 2 - worldX * scale,
        y: viewportHeight / 2 - worldY * scale,
      });
    },
    [scale]
  );

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
    jumpTo,
    applyZoom,
    isPanning,
  };
}
