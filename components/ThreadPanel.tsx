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

interface ReplyTreeNode {
  msg: Message;
  children: ReplyTreeNode[];
}

// Maximum nesting depth rendered in the thread panel. Deeper replies still exist
// in the data but are collapsed to avoid excessive DOM depth and visual clutter.
const MAX_REPLY_DEPTH = 5;

// Must match the panel background so the "clip" trick for the vertical thread
// line looks seamless on the last reply row.
const PANEL_BG = "rgba(15, 15, 15, 0.98)";

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

    // Build a tree of direct replies (recursive, up to 5 levels deep)
    function buildTree(parentId: string, depth: number = 0): ReplyTreeNode[] {
      if (depth >= MAX_REPLY_DEPTH) return [];
      return messages
        .filter((m) => m.reply_to_id === parentId && m.id !== current.id)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .map((msg) => ({ msg, children: buildTree(msg.id, depth + 1) }));
    }

    const replyTree = buildTree(current.id);

    // Count total replies (all descendants)
    function countNodes(nodes: ReplyTreeNode[]): number {
      return nodes.reduce((sum, n) => sum + 1 + countNodes(n.children), 0);
    }

    return {
      ancestors,
      current,
      replyTree,
      totalReplies: countNodes(replyTree),
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

  function renderAncestorMessage(msg: Message, isCurrent: boolean) {
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

  // Render a YouTube-style threaded reply with vertical connector line
  function renderReplyTree(nodes: ReplyTreeNode[], threadColor: string, depth: number = 0) {
    if (nodes.length === 0) return null;
    const avatarSize = depth === 0 ? 32 : 26;
    const indent = depth * 20;

    return (
      <div style={{ position: "relative", marginLeft: indent }}>
        {/* Vertical thread line */}
        <div
          style={{
            position: "absolute",
            left: avatarSize / 2,
            top: 0,
            bottom: 12,
            width: 2,
            background: `${threadColor}33`,
            borderRadius: 1,
          }}
        />

        {nodes.map((node, i) => {
          const isLast = i === nodes.length - 1;
          return (
            <div key={node.msg.id} style={{ position: "relative" }}>
              {/* Short horizontal connector from vertical line to avatar */}
              <div
                style={{
                  position: "absolute",
                  left: avatarSize / 2,
                  top: avatarSize / 2,
                  width: 12,
                  height: 2,
                  background: `${threadColor}33`,
                }}
              />
              {/* Clip the vertical line after the last item by overlaying the panel background */}
              {isLast && (
                <div
                  style={{
                    position: "absolute",
                    left: avatarSize / 2,
                    top: avatarSize,
                    bottom: 0,
                    width: 2,
                    background: PANEL_BG,
                    zIndex: 1,
                  }}
                />
              )}

              <div
                onClick={() => onNavigateTo(node.msg)}
                style={{
                  display: "flex",
                  gap: "10px",
                  paddingLeft: avatarSize + 14,
                  paddingTop: "8px",
                  paddingBottom: "8px",
                  paddingRight: "8px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  transition: "background 0.15s ease",
                  opacity: isVisible ? 1 : 0,
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = `${node.msg.author_color}11`;
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                {/* Avatar — absolutely positioned to sit on the thread line */}
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: avatarSize,
                    height: avatarSize,
                    borderRadius: "50%",
                    background: node.msg.author_color,
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    color: "#000",
                    fontSize: depth === 0 ? "0.8rem" : "0.7rem",
                    zIndex: 2,
                    boxShadow: "0 0 0 2px rgba(15,15,15,0.98)",
                  }}
                >
                  {node.msg.author_name.charAt(0).toUpperCase()}
                </div>

                {/* Text content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      marginBottom: "2px",
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        color: node.msg.author_color,
                        fontWeight: 600,
                        fontSize: depth === 0 ? "0.88rem" : "0.82rem",
                      }}
                    >
                      {node.msg.author_name}
                    </span>
                    <span style={{ color: "#555", fontSize: "0.75rem" }}>
                      {formatTime(node.msg.created_at)}
                    </span>
                  </div>
                  <p
                    style={{
                      color: "#ccc",
                      fontSize: depth === 0 ? "0.88rem" : "0.82rem",
                      lineHeight: 1.4,
                      margin: 0,
                      wordBreak: "break-word",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {node.msg.content}
                  </p>
                </div>
              </div>

              {/* Nested replies */}
              {node.children.length > 0 && (
                <div style={{ paddingLeft: avatarSize + 14 }}>
                  {renderReplyTree(node.children, node.msg.author_color, depth + 1)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  const hasContent = thread.ancestors.length > 0 || thread.totalReplies > 0;

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
          background: PANEL_BG,
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
                <div style={{ marginBottom: "16px" }}>
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
                  {thread.ancestors.map((msg) => renderAncestorMessage(msg, false))}
                </div>
              )}

              {/* Current message — rendered as the root of the YouTube-style thread */}
              <div style={{ marginBottom: "4px" }}>
                {thread.ancestors.length > 0 && (
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
                )}
                {renderAncestorMessage(thread.current, true)}
              </div>

              {/* Replies — YouTube-style threaded view below the current message */}
              {thread.totalReplies > 0 && (
                <div style={{ marginTop: "4px" }}>
                  <div
                    style={{
                      color: "#6366f1",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      marginBottom: "8px",
                      paddingLeft: "4px",
                    }}
                  >
                    {thread.totalReplies === 1 ? "1 reply" : `${thread.totalReplies} replies`}
                  </div>
                  {renderReplyTree(thread.replyTree, thread.current.author_color)}
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
