"use client";

import { useState, FormEvent } from "react";
import { CanvasMode } from "@/hooks/useCanvas";
import { Identity, RateLimitState } from "@/types";

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
  rateLimits?: RateLimitState;
}

const MODES: { key: CanvasMode; label: string; title: string; icon: string }[] = [
  { key: "write", label: "Write", icon: "✏️", title: "Write mode: click to add text" },
  { key: "draw",  label: "Draw",  icon: "🖊️", title: "Draw mode: drag to draw freehand" },
  { key: "pan",   label: "Pan",   icon: "🖐", title: "Pan mode: drag to move the canvas" },
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
  rateLimits,
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

  function getCountdown(resetTime: number): string {
    const seconds = Math.max(0, Math.ceil((resetTime - Date.now()) / 1000));
    if (seconds < 60) return `${seconds}s`;
    return `${Math.floor(seconds / 60)}m`;
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 56,
        background: "rgba(8, 8, 10, 0.96)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(99, 102, 241, 0.12)",
        display: "flex",
        alignItems: "center",
        padding: "0 1rem",
        gap: "0.75rem",
        zIndex: 100,
        userSelect: "none",
        boxShadow: "0 1px 0 rgba(255,255,255,0.04), 0 4px 24px rgba(0,0,0,0.4)",
      }}
    >
      {/* Left section */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          flex: "1 1 0",
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
          <span style={{ color: "#6366f1", fontWeight: 800, fontSize: "1.25rem", lineHeight: 1 }}>
            ∞
          </span>
          <span
            style={{
              color: "rgba(255,255,255,0.55)",
              fontSize: "0.8rem",
              fontWeight: 500,
              letterSpacing: "0.04em",
            }}
          >
            Infinity
          </span>
        </div>

        {/* Separator */}
        <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.08)", flexShrink: 0 }} />

        {/* Mode Toggle */}
        <div
          style={{
            display: "flex",
            gap: 2,
            background: "rgba(255,255,255,0.04)",
            borderRadius: 8,
            padding: 3,
            border: "1px solid rgba(255,255,255,0.06)",
            flexShrink: 0,
          }}
        >
          {MODES.map(({ key, label, title, icon }) => (
            <button
              key={key}
              onClick={() => onModeChange(key)}
              title={title}
              style={{
                background: mode === key
                  ? "linear-gradient(135deg, #6366f1, #7c3aed)"
                  : "transparent",
                color: mode === key ? "#fff" : "rgba(255,255,255,0.45)",
                border: "none",
                borderRadius: 6,
                padding: "4px 11px",
                cursor: "pointer",
                fontSize: "0.78rem",
                fontWeight: mode === key ? 600 : 400,
                transition: "all 0.18s ease",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                boxShadow: mode === key ? "0 1px 8px rgba(99,102,241,0.35)" : "none",
              }}
            >
              <span style={{ fontSize: "0.85rem" }}>{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Color Palette */}
        {mode !== "pan" && (
          <div
            style={{
              display: "flex",
              gap: 5,
              alignItems: "center",
              flexShrink: 0,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 8,
              padding: "4px 8px",
            }}
          >
            {COLOR_PALETTE.map((color) => (
              <button
                key={color}
                onClick={() => onBrushColorChange(color)}
                title={color}
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  background: color,
                  border: brushColor === color
                    ? "2px solid #fff"
                    : "2px solid transparent",
                  cursor: "pointer",
                  padding: 0,
                  transition: "transform 0.15s, border-color 0.15s, box-shadow 0.15s",
                  transform: brushColor === color ? "scale(1.25)" : "scale(1)",
                  boxShadow: brushColor === color ? `0 0 8px ${color}66` : "none",
                  outline: "none",
                }}
              />
            ))}
          </div>
        )}

        {/* Brush Size */}
        {mode === "draw" && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexShrink: 0,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 8,
              padding: "4px 10px",
            }}
          >
            <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.75rem" }}>Size</span>
            <input
              type="range"
              min={1}
              max={20}
              value={brushSize}
              onChange={(e) => onBrushSizeChange(parseInt(e.target.value))}
              style={{ width: 72, accentColor: "#6366f1", cursor: "pointer" }}
            />
            <span
              style={{
                color: "rgba(255,255,255,0.6)",
                fontSize: "0.78rem",
                minWidth: 18,
                textAlign: "center",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {brushSize}
            </span>
          </div>
        )}

        {/* Mode hint */}
        <span
          style={{
            color: "rgba(255,255,255,0.2)",
            fontSize: "0.72rem",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            letterSpacing: "0.01em",
          }}
        >
          {MODE_HINTS[mode]}
        </span>
      </div>

      {/* Right section */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.6rem",
          flexShrink: 0,
        }}
      >
        {/* Coordinate Jump */}
        <form
          onSubmit={handleJumpSubmit}
          title="Jump to coordinate (x,y)"
          style={{ display: "flex", gap: 4, alignItems: "center" }}
        >
          <input
            type="text"
            value={coordInput}
            onChange={(e) => { setCoordInput(e.target.value); setCoordError(false); }}
            placeholder="x , y"
            style={{
              width: 90,
              background: coordError
                ? "rgba(248,113,113,0.08)"
                : "rgba(255,255,255,0.04)",
              border: `1px solid ${coordError ? "#f87171" : "rgba(255,255,255,0.1)"}`,
              borderRadius: 6,
              padding: "4px 8px",
              color: "#e5e5e5",
              fontSize: "0.78rem",
              outline: "none",
              transition: "border-color 0.15s, background 0.15s",
              textAlign: "center",
            }}
            onFocus={(e) => {
              if (!coordError) {
                e.target.style.borderColor = "rgba(99,102,241,0.6)";
                e.target.style.background = "rgba(99,102,241,0.06)";
              }
            }}
            onBlur={(e) => {
              if (!coordError) {
                e.target.style.borderColor = "rgba(255,255,255,0.1)";
                e.target.style.background = "rgba(255,255,255,0.04)";
              }
            }}
          />
          <button
            type="submit"
            title="Jump to coordinate"
            style={{
              background: "linear-gradient(135deg, #6366f1, #7c3aed)",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              padding: "4px 10px",
              fontSize: "0.78rem",
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "opacity 0.15s, transform 0.15s",
              boxShadow: "0 1px 8px rgba(99,102,241,0.3)",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.opacity = "0.85";
              e.currentTarget.style.transform = "scale(0.97)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.opacity = "1";
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            Go →
          </button>
        </form>

        {/* Separator */}
        <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.08)", flexShrink: 0 }} />

        {/* Rate limit indicator */}
        {rateLimits && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "4px 10px",
              background: "rgba(255,255,255,0.03)",
              borderRadius: 6,
              border: "1px solid rgba(255,255,255,0.07)",
              fontSize: "0.75rem",
            }}
            title={`Messages: ${rateLimits.messages.remaining}/${rateLimits.messages.limit} · Strokes: ${rateLimits.strokes.remaining}/${rateLimits.strokes.limit}`}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.8rem" }}>✏️</span>
              <span
                style={{
                  color: rateLimits.messages.isLimited
                    ? "#f87171"
                    : rateLimits.messages.remaining <= 2
                    ? "#fbbf24"
                    : "#4ade80",
                  fontWeight: rateLimits.messages.isLimited ? 600 : 400,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {rateLimits.messages.isLimited
                  ? getCountdown(rateLimits.messages.resetTime)
                  : `${rateLimits.messages.remaining}`}
              </span>
            </div>

            <span style={{ color: "rgba(255,255,255,0.1)" }}>|</span>

            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.8rem" }}>🖊️</span>
              <span
                style={{
                  color: rateLimits.strokes.isLimited
                    ? "#f87171"
                    : rateLimits.strokes.remaining <= 1
                    ? "#fbbf24"
                    : "#4ade80",
                  fontWeight: rateLimits.strokes.isLimited ? 600 : 400,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {rateLimits.strokes.isLimited
                  ? getCountdown(rateLimits.strokes.resetTime)
                  : `${rateLimits.strokes.remaining}`}
              </span>
            </div>
          </div>
        )}

        {/* Connection indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: isConnected ? "#4ade80" : "#f87171",
              flexShrink: 0,
              boxShadow: isConnected
                ? "0 0 6px rgba(74,222,128,0.5)"
                : "0 0 6px rgba(248,113,113,0.5)",
            }}
            title={isConnected ? "Connected" : "Offline"}
          />
          <span style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.7rem" }}>
            {isConnected ? "Live" : "Offline"}
          </span>
        </div>

        {/* User Identity */}
        {identity && (
          <>
            <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.08)", flexShrink: 0 }} />
            <button
              onClick={handleNameClick}
              title="Click to change name"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8,
                padding: "4px 10px",
                cursor: "pointer",
                transition: "border-color 0.18s, background 0.18s",
                flexShrink: 0,
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)";
                e.currentTarget.style.background = "rgba(99,102,241,0.06)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                e.currentTarget.style.background = "rgba(255,255,255,0.03)";
              }}
            >
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: identity.color,
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  color: "#000",
                  boxShadow: `0 0 0 2px ${identity.color}44`,
                }}
              >
                {(identity.name.charAt(0) || "?").toUpperCase()}
              </div>
              <span style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.82rem", fontWeight: 500 }}>
                {identity.name}
              </span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
