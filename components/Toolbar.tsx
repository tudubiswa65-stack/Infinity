"use client";

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
}

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
}: ToolbarProps) {
  function handleNameClick() {
    const newName = prompt("Enter your display name:", identity?.name ?? "");
    if (newName && newName.trim()) {
      onNameEdit(newName.trim());
    }
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
        <button
          onClick={() => onModeChange("write")}
          title="Write mode: click to add text"
          style={{
            background: mode === "write" ? "#6366f1" : "transparent",
            color: mode === "write" ? "#fff" : "#888",
            border: "none",
            borderRadius: 6,
            padding: "4px 12px",
            cursor: "pointer",
            fontSize: "0.85rem",
            fontWeight: 600,
            transition: "all 0.15s",
          }}
        >
          ✏️ Write
        </button>
        <button
          onClick={() => onModeChange("draw")}
          title="Draw mode: drag to draw"
          style={{
            background: mode === "draw" ? "#6366f1" : "transparent",
            color: mode === "draw" ? "#fff" : "#888",
            border: "none",
            borderRadius: 6,
            padding: "4px 12px",
            cursor: "pointer",
            fontSize: "0.85rem",
            fontWeight: 600,
            transition: "all 0.15s",
          }}
        >
          🖊️ Draw
        </button>
      </div>

      {/* Color Palette */}
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

      {/* Hint */}
      <span style={{ color: "#444", fontSize: "0.75rem", flexShrink: 0 }}>
        {mode === "write" ? "Click to write" : "Drag to draw"} · Drag to pan · Scroll to zoom
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
