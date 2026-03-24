"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function CoordinateInput() {
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
    <form
      onSubmit={handleSearch}
      className="fade-in"
      style={{
        animationDelay: "1.2s",
        opacity: 0,
        marginTop: "3rem",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          maxWidth: "400px",
          margin: "0 auto",
        }}
      >
        <input
          type="text"
          value={coordInput}
          onChange={(e) => setCoordInput(e.target.value)}
          placeholder="Jump to x,y"
          style={{
            flex: 1,
            background: "rgba(26, 26, 26, 0.8)",
            border: "1px solid rgba(42, 42, 42, 0.8)",
            borderRadius: "0.5rem",
            padding: "0.75rem 1rem",
            color: "#e5e5e5",
            fontSize: "0.9rem",
            outline: "none",
            transition: "border-color 0.2s, box-shadow 0.2s",
            backdropFilter: "blur(10px)",
          }}
          onFocus={(e) => {
            e.target.style.borderColor = "#6366f1";
            e.target.style.boxShadow = "0 0 20px rgba(99, 102, 241, 0.3)";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "rgba(42, 42, 42, 0.8)";
            e.target.style.boxShadow = "none";
          }}
        />
        <button
          type="submit"
          style={{
            background: "rgba(99, 102, 241, 0.8)",
            color: "#fff",
            border: "none",
            borderRadius: "0.5rem",
            padding: "0.75rem 1.25rem",
            fontSize: "0.9rem",
            fontWeight: 600,
            cursor: "pointer",
            transition: "background 0.2s, box-shadow 0.2s",
            backdropFilter: "blur(10px)",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = "rgba(99, 102, 241, 1)";
            e.currentTarget.style.boxShadow = "0 0 25px rgba(99, 102, 241, 0.5)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = "rgba(99, 102, 241, 0.8)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          Go →
        </button>
      </div>
      {error && (
        <p
          style={{
            color: "#f87171",
            marginTop: "0.5rem",
            fontSize: "0.8rem",
            textAlign: "center",
          }}
        >
          {error}
        </p>
      )}
    </form>
  );
}
