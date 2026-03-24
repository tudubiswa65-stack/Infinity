"use client";

import { useState, useEffect } from "react";
import { Identity } from "@/types";

const COLOR_PALETTE = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#FFEAA7",
  "#DDA0DD",
  "#98D8C8",
  "#F7B267",
  "#A8D8EA",
  "#FF8B94",
];

function randomChars(length: number): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

function loadOrCreate(): Identity {
  let uid = localStorage.getItem("ib_uid");
  if (!uid) {
    uid = randomChars(8);
    localStorage.setItem("ib_uid", uid);
  }

  let name = localStorage.getItem("ib_name");
  if (!name) {
    name = `User-${uid.slice(-4).toUpperCase()}`;
    localStorage.setItem("ib_name", name);
  }

  let color = localStorage.getItem("ib_color");
  if (!color) {
    // Deterministically assign color based on uid
    const idx =
      uid
        .split("")
        .reduce((acc, c) => acc + c.charCodeAt(0), 0) % COLOR_PALETTE.length;
    color = COLOR_PALETTE[idx];
    localStorage.setItem("ib_color", color);
  }

  return { uid, name, color };
}

export function useIdentity() {
  const [identity, setIdentity] = useState<Identity | null>(null);

  useEffect(() => {
    const id = loadOrCreate();
    setIdentity(id);
  }, []);

  function setName(name: string) {
    const trimmed = name.trim().slice(0, 32);
    if (!trimmed) return;
    localStorage.setItem("ib_name", trimmed);
    setIdentity((prev) => (prev ? { ...prev, name: trimmed } : prev));
  }

  function setColor(color: string) {
    localStorage.setItem("ib_color", color);
    setIdentity((prev) => (prev ? { ...prev, color } : prev));
  }

  return { identity, setName, setColor };
}
