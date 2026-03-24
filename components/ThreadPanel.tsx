"use client";

import { memo, useEffect, useState } from "react";
import { Message } from "@/types";

interface ThreadPanelProps {
  currentMessage: Message;
  messages: Message[];
  messageById: Map<string, Message>;
  onClose: () => void;
  onNavigateTo: (message: Message) => void;
}

function ThreadPanel({ currentMessage, messages, messageById, onClose, onNavigateTo }: ThreadPanelProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  // Build thread hierarchy: find all ancestors (parent chain) and descendants (replies)
  const thread = (() => {
    const ancestors: Message[] = [];
    const current = currentMessage;

    // Find parent chain
    let parentId: string | null | undefined = current.reply_to_id;
    const visited = new Set<string>();

    while (parentId && !visited.has(parentId)) {
      visited.add(parentId);
      const parent = messageById.get(parentId);
      if (parent) {
        ancestors.unshift(parent);
        parentId = parent.reply_to_id;
      } else {
        break;
      }
    }

    // Find all direct and indirect replies
    const replies = messages.filter((msg) => {
      if (msg.id === current.id) return false;
      let checkId: string | null | undefined = msg.reply_to_id;
      while (checkId) {
        if (checkId === current.id) return true;
        const parent = messageById.get(checkId);
        if (parent) {
          checkId = parent.reply_to_id;
        } else {
          break;
        }
      }
      return false;
    });

    // Sort replies chronologically
    const sortedReplies = replies.sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    return {
      ancestors,
      current,
      replies: sortedReplies,
    };
  })();

  function formatTime(dateStr: string): string {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diff = Math.floor((now - then) / 1000);
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${new Date(dateStr).toLocaleDateString()}`;
  }

  function renderMessage(msg: Message, isCurrent: boolean, depth: number = 0) {
    return (
      <div
        key={msg.id}
        onClick={() => onNavigateTo(msg)}
        style={{
          display: "flex",
          gap: "12px",
          padding: "12px",
          background: isCurrent ? `${msg.author_color}22` : "transparent",
          borderLeft: isCurrent ? `3px solid ${msg.author_color}` : `3px solid ${msg.author_color}44`,
          borderRadius: "8px",
          marginBottom: "8px",
          cursor: "pointer",
          transition: "background 0.2s ease, border-color 0.2s ease",
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? "translateX(0)" : "translateX(-10px)",
        }}
        onMouseOver={(e) => {
          if (!isCurrent) {
            e.currentTarget.style.background = `${msg.author_color}11`;
          }
        }}
        onMouseOut={(e) => {
          if (!isCurrent) {
            e.currentTarget.style.background = "transparent";
          }
        }}
      >
        {/* Avatar */}
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            background: msg.author_color,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 600,
            color: "#000",
            fontSize: "0.85rem",
          }}
        >
          {msg.author_name.charAt(0).toUpperCase()}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "4px",
            }}
          >
            <span style={{ color: msg.author_color, fontWeight: 600, fontSize: "0.9rem" }}>
              {msg.author_name}
            </span>
            {isCurrent && (
              <span
                style={{
                  background: "#6366f1",
                  color: "#fff",
                  fontSize: "0.7rem",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  fontWeight: 500,
                }}
              >
                Current
              </span>
            )}
            <span style={{ color: "#666", fontSize: "0.75rem", marginLeft: "auto" }}>
              {formatTime(msg.created_at)}
            </span>
          </div>
          <p
            style={{
              color: "#e5e5e5",
              fontSize: "0.9rem",
              lineHeight: 1.4,
              margin: 0,
              wordBreak: "break-word",
              whiteSpace: "pre-wrap",
            }}
          >
            {msg.content}
          </p>
        </div>
      </div>
    );
  }

  const hasContent = thread.ancestors.length > 0 || thread.replies.length > 0;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.5)",
          backdropFilter: "blur(2px)",
          zIndex: 2000,
          opacity: isVisible ? 1 : 0,
          transition: "opacity 0.3s ease",
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: "fixed",
          top: 56, // Below toolbar
          right: 0,
          bottom: 0,
          width: "400px",
          maxWidth: "90vw",
          background: "rgba(15, 15, 15, 0.98)",
          borderLeft: "1px solid #2a2a2a",
          zIndex: 2001,
          display: "flex",
          flexDirection: "column",
          transform: isVisible ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s ease",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #2a2a2a",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h2
            style={{
              margin: 0,
              color: "#e5e5e5",
              fontSize: "1.1rem",
              fontWeight: 600,
            }}
          >
            Thread
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#888",
              fontSize: "1.5rem",
              cursor: "pointer",
              padding: 0,
              lineHeight: 1,
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "6px",
              transition: "background 0.2s",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "#2a2a2a";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px 20px",
          }}
        >
          {!hasContent ? (
            <div
              style={{
                textAlign: "center",
                color: "#666",
                padding: "40px 20px",
              }}
            >
              <p style={{ margin: 0, fontSize: "0.9rem" }}>
                No replies or parent message found
              </p>
            </div>
          ) : (
            <>
              {/* Ancestors */}
              {thread.ancestors.length > 0 && (
                <div style={{ marginBottom: "24px" }}>
                  <h3
                    style={{
                      margin: "0 0 12px 0",
                      color: "#666",
                      fontSize: "0.8rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      fontWeight: 600,
                    }}
                  >
                    {thread.ancestors.length === 1 ? "Parent" : "Parent Messages"}
                  </h3>
                  {thread.ancestors.map((msg) => renderMessage(msg, false))}
                </div>
              )}

              {/* Current message */}
              <div style={{ marginBottom: "24px" }}>
                <h3
                  style={{
                    margin: "0 0 12px 0",
                    color: "#6366f1",
                    fontSize: "0.8rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    fontWeight: 600,
                  }}
                >
                  This Message
                </h3>
                {renderMessage(thread.current, true)}
              </div>

              {/* Replies */}
              {thread.replies.length > 0 && (
                <div>
                  <h3
                    style={{
                      margin: "0 0 12px 0",
                      color: "#666",
                      fontSize: "0.8rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      fontWeight: 600,
                    }}
                  >
                    {thread.replies.length === 1 ? "1 Reply" : `${thread.replies.length} Replies`}
                  </h3>
                  {thread.replies.map((msg) => renderMessage(msg, false))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer hint */}
        <div
          style={{
            padding: "12px 20px",
            borderTop: "1px solid #2a2a2a",
            color: "#555",
            fontSize: "0.75rem",
            textAlign: "center",
          }}
        >
          Click any message to jump to it on the canvas · Press Escape to close
        </div>
      </div>
    </>
  );
}

export default memo(ThreadPanel);
