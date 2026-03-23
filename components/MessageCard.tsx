"use client";

import { Message } from "@/types";

interface MessageCardProps {
  message: Message;
  screenX: number;
  screenY: number;
  scale: number;
}

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function MessageCard({ message, screenX, screenY, scale }: MessageCardProps) {
  const fontSize = Math.min(Math.max(12 * scale, 9), 18);
  const padding = Math.max(6 * scale, 4);

  return (
    <div
      style={{
        position: "absolute",
        left: screenX,
        top: screenY,
        transform: "translate(-50%, -50%)",
        maxWidth: Math.min(280 * scale, 280),
        minWidth: Math.min(120 * scale, 120),
        background: "rgba(26, 26, 26, 0.92)",
        border: `1px solid ${message.author_color}44`,
        borderRadius: Math.max(8 * scale, 6),
        padding: `${padding}px ${padding * 1.5}px`,
        backdropFilter: "blur(12px)",
        boxShadow: `0 4px 24px rgba(0,0,0,0.5), 0 0 0 1px ${message.author_color}22`,
        pointerEvents: "auto",
        cursor: "default",
        userSelect: "text",
        zIndex: 10,
      }}
    >
      <p
        style={{
          color: "#e5e5e5",
          fontSize,
          lineHeight: 1.5,
          marginBottom: Math.max(4 * scale, 3),
          wordBreak: "break-word",
          whiteSpace: "pre-wrap",
        }}
      >
        {message.content}
      </p>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: Math.max(4 * scale, 3),
          marginTop: Math.max(4 * scale, 3),
        }}
      >
        <div
          style={{
            width: Math.max(6 * scale, 5),
            height: Math.max(6 * scale, 5),
            borderRadius: "50%",
            background: message.author_color,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            color: message.author_color,
            fontSize: Math.max(fontSize * 0.8, 8),
            fontWeight: 600,
          }}
        >
          {message.author_name}
        </span>
        <span style={{ color: "#555", fontSize: Math.max(fontSize * 0.75, 8) }}>
          · {relativeTime(message.created_at)}
        </span>
      </div>
    </div>
  );
}
