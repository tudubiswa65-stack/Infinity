"use client";

import { memo } from "react";
import { Message } from "@/types";

interface MessageCardProps {
  message: Message;
  screenX: number;
  screenY: number;
  scale: number;
  allMessages?: Message[];
  onReply?: (message: Message) => void;
  onNavigateTo?: (message: Message) => void;
  isHighlighted?: boolean;
  /** Stacking order index (older = lower, newer = higher). Highlighted messages are boosted above all others. */
  zIndex?: number;
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

function MessageCard({
  message,
  screenX,
  screenY,
  scale,
  allMessages,
  onReply,
  onNavigateTo,
  isHighlighted,
  zIndex = 1,
}: MessageCardProps) {
  const fontSize = Math.min(Math.max(12 * scale, 9), 18);
  const padding = Math.max(6 * scale, 4);

  // replyParent is the referenced message (or undefined if not loaded, or null if no reply_to_id)
  const replyParent = message.reply_to_id
    ? allMessages?.find((m) => m.id === message.reply_to_id) ?? null
    : null;
  // True when this message references another but that message isn't available
  const replyMissing = !!message.reply_to_id && replyParent === null && allMessages !== undefined;

  return (
    <div
      data-message-card="true"
      style={{
        position: "absolute",
        left: screenX,
        top: screenY,
        transform: "translate(-50%, -50%)",
        maxWidth: Math.min(280 * scale, 280),
        minWidth: Math.min(120 * scale, 120),
        background: "rgba(26, 26, 26, 0.92)",
        border: isHighlighted
          ? `1px solid ${message.author_color}`
          : `1px solid ${message.author_color}44`,
        borderRadius: Math.max(8 * scale, 6),
        padding: `${padding}px ${padding * 1.5}px`,
        backdropFilter: "blur(12px)",
        boxShadow: isHighlighted
          ? `0 4px 24px rgba(0,0,0,0.5), 0 0 0 3px ${message.author_color}88`
          : `0 4px 24px rgba(0,0,0,0.5), 0 0 0 1px ${message.author_color}22`,
        pointerEvents: "auto",
        cursor: "default",
        userSelect: "text",
        zIndex: isHighlighted ? zIndex + 1000 : zIndex,
        transition: "box-shadow 0.2s ease, border-color 0.2s ease",
      }}
    >
      {/* Reply-to excerpt — clickable to navigate to the original message */}
      {replyParent && (
        <div
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            if (onNavigateTo) onNavigateTo(replyParent);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              if (onNavigateTo) onNavigateTo(replyParent);
            }
          }}
          style={{
            borderLeft: `2px solid ${replyParent.author_color}88`,
            paddingLeft: Math.max(4 * scale, 4),
            marginBottom: Math.max(4 * scale, 4),
            opacity: 0.7,
            cursor: onNavigateTo ? "pointer" : "default",
          }}
          title="Click to jump to original message"
        >
          <span
            style={{
              color: replyParent.author_color,
              fontSize: Math.max(fontSize * 0.75, 8),
              fontWeight: 600,
            }}
          >
            ↩ {replyParent.author_name}
          </span>
          <p
            style={{
              color: "#aaa",
              fontSize: Math.max(fontSize * 0.75, 8),
              margin: 0,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: "100%",
            }}
          >
            {replyParent.content.slice(0, 60)}
            {replyParent.content.length > 60 ? "…" : ""}
          </p>
        </div>
      )}

      {/* Placeholder when referenced message is not found */}
      {replyMissing && (
        <div
          style={{
            borderLeft: "2px solid #555",
            paddingLeft: Math.max(4 * scale, 4),
            marginBottom: Math.max(4 * scale, 4),
            opacity: 0.5,
          }}
        >
          <span style={{ color: "#888", fontSize: Math.max(fontSize * 0.75, 8) }}>
            ↩ Message not found
          </span>
        </div>
      )}

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

        {onReply && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onReply(message);
            }}
            style={{
              marginLeft: "auto",
              background: "transparent",
              border: "none",
              color: "#555",
              fontSize: Math.max(fontSize * 0.75, 8),
              cursor: "pointer",
              padding: "1px 4px",
              borderRadius: 4,
              flexShrink: 0,
            }}
            title="Reply to this message"
          >
            ↩
          </button>
        )}
      </div>
    </div>
  );
}

export default memo(MessageCard);
