"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const router = useRouter();
  const [coordInput, setCoordInput] = useState("");
  const [error, setError] = useState("");

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    setError("");
    const parts = coordInput.split(",").map((s) => s.trim());
    if (parts.length !== 2) {
      setError("Enter coordinates as x,y (e.g. 100,200)");
      return;
    }
    const x = parseFloat(parts[0]);
    const y = parseFloat(parts[1]);
    if (isNaN(x) || isNaN(y)) {
      setError("Coordinates must be numbers");
      return;
    }
    router.push(`/canvas?x=${x}&y=${y}`);
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0f0f0f",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
      }}
    >
      <div style={{ textAlign: "center", maxWidth: 480, width: "100%" }}>
        {/* Logo / Title */}
        <div style={{ marginBottom: "2rem" }}>
          <h1
            style={{
              fontSize: "3rem",
              fontWeight: 700,
              color: "#e5e5e5",
              letterSpacing: "-0.02em",
              marginBottom: "0.5rem",
            }}
          >
            ∞ InfiniteBoard
          </h1>
          <p style={{ color: "#888", fontSize: "1.1rem" }}>
            A shared infinite canvas. Write and draw anywhere, forever.
          </p>
        </div>

        {/* Coordinate Search */}
        <form onSubmit={handleSearch} style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input
              type="text"
              value={coordInput}
              onChange={(e) => setCoordInput(e.target.value)}
              placeholder="Jump to coordinate: x,y (e.g. 1000,500)"
              style={{
                flex: 1,
                background: "#1a1a1a",
                border: "1px solid #2a2a2a",
                borderRadius: "0.5rem",
                padding: "0.75rem 1rem",
                color: "#e5e5e5",
                fontSize: "0.95rem",
                outline: "none",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
              onBlur={(e) => (e.target.style.borderColor = "#2a2a2a")}
            />
            <button
              type="submit"
              style={{
                background: "#6366f1",
                color: "#fff",
                border: "none",
                borderRadius: "0.5rem",
                padding: "0.75rem 1.25rem",
                fontSize: "0.95rem",
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "background 0.2s",
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = "#4f52d6")}
              onMouseOut={(e) => (e.currentTarget.style.background = "#6366f1")}
            >
              Go →
            </button>
          </div>
          {error && (
            <p style={{ color: "#f87171", marginTop: "0.5rem", fontSize: "0.875rem" }}>
              {error}
            </p>
          )}
        </form>

        {/* Enter Canvas Button */}
        <button
          onClick={() => router.push("/canvas")}
          style={{
            width: "100%",
            background: "transparent",
            color: "#e5e5e5",
            border: "1px solid #2a2a2a",
            borderRadius: "0.5rem",
            padding: "0.875rem 1.5rem",
            fontSize: "1rem",
            fontWeight: 600,
            cursor: "pointer",
            transition: "border-color 0.2s, background 0.2s",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.borderColor = "#6366f1";
            e.currentTarget.style.background = "rgba(99,102,241,0.08)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.borderColor = "#2a2a2a";
            e.currentTarget.style.background = "transparent";
          }}
        >
          Enter Canvas →
        </button>

        <p style={{ marginTop: "2.5rem", color: "#555", fontSize: "0.8rem" }}>
          No account needed. Your identity is generated automatically.
        </p>
      </div>
    </main>
  );
}
