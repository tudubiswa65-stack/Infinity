"use client";

import { useState, FormEvent } from "react";
import { CanvasMode } from "@/hooks/useCanvas";
import { Identity } from "@/types";

const COLOR_PALETTE = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7",
  "#DDA0DD", "#98D8C8", "#F7B267", "#A8D8EA", "#FF8B94",
];

interface ToolbarProps {
  identity: Identity | null;
  mode: CanvasMode;
  onModeChange: (mode: CanvasMode) => void;
  brushColor: string;
  onBrushColorChange: (color: string) => void;
  brushSize: number;
  onBrushSizeChange: (size: number) => void;
  onNameEdit: (name: string) => void;
  isConnected: boolean;
  onJumpTo: (x: number, y: number) => void;
}

const MODES: { key: CanvasMode; label: string; title: string }[] = [
  { key: "write", label: "✏️ Write", title: "Write mode: click to add text" },
  { key: "draw",  label: "🖊️ Draw",  title: "Draw mode: drag to draw freehand" },
  { key: "pan",   label: "🖐 Pan",   title: "Pan mode: drag to move the canvas" },
];

const MODE_HINTS: Record<CanvasMode, string> = {
  write: "Click to write · Drag/Middle-click to pan · Scroll to zoom",
  draw:  "Drag to draw · Space/Middle-click to pan · Scroll to zoom",
  pan:   "Drag to pan · Scroll to zoom",
};

export default function Toolbar({
  identity,
  mode,
  onModeChange,
  brushColor,
  onBrushColorChange,
  brushSize,
  onBrushSizeChange,
  onNameEdit,
  isConnected,
  onJumpTo,
}: ToolbarProps) {
  const [coordInput, setCoordInput] = useState("");
  const [coordError, setCoordError] = useState(false);

  function handleNameClick() {
    const newName = prompt("Enter your display name:", identity?.name ?? "");
    if (newName && newName.trim()) {
      onNameEdit(newName.trim());
    }
  }

  function handleJumpSubmit(e: FormEvent) {
    e.preventDefault();
    setCoordError(false);
    const parts = coordInput.split(",").map((s) => s.trim());
    if (parts.length !== 2) { setCoordError(true); return; }
    const x = parseFloat(parts[0]);
    const y = parseFloat(parts[1]);
    if (isNaN(x) || isNaN(y)) { setCoordError(true); return; }
    onJumpTo(x, y);
    setCoordInput("");
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 56,
        background: "rgba(15,15,15,0.95)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid #2a2a2a",
        display: "flex",
        alignItems: "center",
        padding: "0 1rem",
        gap: "1rem",
        zIndex: 100,
        userSelect: "none",
      }}
    >
      {/* Brand */}
      <span style={{ color: "#6366f1", fontWeight: 700, fontSize: "1.1rem", flexShrink: 0 }}>
        ∞
      </span>

      {/* Mode Toggle */}
      <div style={{ display: "flex", gap: 4, background: "#1a1a1a", borderRadius: 8, padding: 3 }}>
        {MODES.map(({ key, label, title }) => (
          <button
            key={key}
            onClick={() => onModeChange(key)}
            title={title}
            style={{
              background: mode === key ? "#6366f1" : "transparent",
              color: mode === key ? "#fff" : "#888",
              border: "none",
              borderRadius: 6,
              padding: "4px 12px",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: 600,
              transition: "all 0.15s",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Color Palette (write + draw modes) */}
      {mode !== "pan" && (
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          {COLOR_PALETTE.map((color) => (
            <button
              key={color}
              onClick={() => onBrushColorChange(color)}
              title={color}
              style={{
                width: 20,
                height: 20,
                borderRadius: "50%",
                background: color,
                border: brushColor === color ? "2px solid #fff" : "2px solid transparent",
                cursor: "pointer",
                padding: 0,
                transition: "transform 0.15s, border-color 0.15s",
                transform: brushColor === color ? "scale(1.2)" : "scale(1)",
              }}
            />
          ))}
        </div>
      )}

      {/* Brush Size (draw mode only) */}
      {mode === "draw" && (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ color: "#888", fontSize: "0.8rem" }}>Size:</span>
          <input
            type="range"
            min={1}
            max={20}
            value={brushSize}
            onChange={(e) => onBrushSizeChange(parseInt(e.target.value))}
            style={{ width: 80, accentColor: "#6366f1" }}
          />
          <span style={{ color: "#888", fontSize: "0.8rem", minWidth: 20 }}>{brushSize}</span>
        </div>
      )}

      <div style={{ flex: 1 }} />

      {/* Coordinate Jump */}
      <form
        onSubmit={handleJumpSubmit}
        title="Jump to coordinate (x,y)"
        style={{ display: "flex", gap: 4, alignItems: "center", flexShrink: 0 }}
      >
        <input
          type="text"
          value={coordInput}
          onChange={(e) => { setCoordInput(e.target.value); setCoordError(false); }}
          placeholder="x,y"
          style={{
            width: 100,
            background: coordError ? "rgba(248,113,113,0.1)" : "#1a1a1a",
            border: `1px solid ${coordError ? "#f87171" : "#2a2a2a"}`,
            borderRadius: 6,
            padding: "3px 8px",
            color: "#e5e5e5",
            fontSize: "0.8rem",
            outline: "none",
            transition: "border-color 0.15s",
          }}
          onFocus={(e) => { if (!coordError) e.target.style.borderColor = "#6366f1"; }}
          onBlur={(e) => { if (!coordError) e.target.style.borderColor = "#2a2a2a"; }}
        />
        <button
          type="submit"
          title="Jump to coordinate"
          style={{
            background: "#6366f1",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            padding: "3px 10px",
            fontSize: "0.8rem",
            fontWeight: 600,
            cursor: "pointer",
            whiteSpace: "nowrap",
            transition: "background 0.15s",
            flexShrink: 0,
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = "#4f52d6")}
          onMouseOut={(e) => (e.currentTarget.style.background = "#6366f1")}
        >
          Go →
        </button>
      </form>

      {/* Hint */}
      <span style={{ color: "#444", fontSize: "0.75rem", flexShrink: 0 }}>
        {MODE_HINTS[mode]}
      </span>

      {/* Connection indicator */}
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: isConnected ? "#4ade80" : "#f87171",
          flexShrink: 0,
        }}
        title={isConnected ? "Connected" : "Offline"}
      />

      {/* User Identity */}
      {identity && (
        <button
          onClick={handleNameClick}
          title="Click to change name"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "transparent",
            border: "1px solid #2a2a2a",
            borderRadius: 6,
            padding: "4px 10px",
            cursor: "pointer",
            transition: "border-color 0.15s",
            flexShrink: 0,
          }}
          onMouseOver={(e) => (e.currentTarget.style.borderColor = "#6366f1")}
          onMouseOut={(e) => (e.currentTarget.style.borderColor = "#2a2a2a")}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: identity.color,
              flexShrink: 0,
            }}
          />
          <span style={{ color: "#e5e5e5", fontSize: "0.85rem" }}>{identity.name}</span>
        </button>
      )}
    </div>
  );
}
