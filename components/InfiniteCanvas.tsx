"use client";

import {
  useRef,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useIdentity } from "@/hooks/useIdentity";
import { useCanvas } from "@/hooks/useCanvas";
import { Message, Stroke } from "@/types";
import MessageCard from "./MessageCard";
import Toolbar from "./Toolbar";

interface InfiniteCanvasProps {
  initialX?: number;
  initialY?: number;
}

const FETCH_BUFFER = 500;
// How far (in world units) the viewport must travel beyond the already-fetched
// region before we issue another DB query. Larger = fewer queries when panning.
const FETCH_CACHE_BUFFER = 1500;
const TOOLBAR_HEIGHT = 56;

export default function InfiniteCanvas({ initialX = 0, initialY = 0 }: InfiniteCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { identity, setName, setColor } = useIdentity();
  const {
    offset,
    scale,
    mode,
    setMode,
    startPan,
    updatePan,
    endPan,
    handleWheel,
    screenToWorld,
    worldToScreen,
    isPanning,
  } = useCanvas(initialX, initialY);

  const [messages, setMessages] = useState<Message[]>([]);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [brushColor, setBrushColor] = useState("#6366f1");
  const [brushSize, setBrushSize] = useState(3);
  const [isConnected, setIsConnected] = useState(false);
  const [dbAvailable, setDbAvailable] = useState(true);

  // Text input state
  const [textInput, setTextInput] = useState<{
    visible: boolean;
    worldX: number;
    worldY: number;
    screenX: number;
    screenY: number;
    value: string;
    replyToId: string | null;
  }>({ visible: false, worldX: 0, worldY: 0, screenX: 0, screenY: 0, value: "", replyToId: null });

  // Drawing state
  const isDrawing = useRef(false);
  const currentStroke = useRef<Array<{ x: number; y: number }>>([]);

  // Track drag distance to distinguish click from drag
  const dragStartPos = useRef({ x: 0, y: 0 });
  const hasDragged = useRef(false);

  // Refs for use inside callbacks to avoid stale closures
  const identityRef = useRef(identity);
  const brushColorRef = useRef(brushColor);
  const brushSizeRef = useRef(brushSize);
  useEffect(() => { identityRef.current = identity; }, [identity]);
  useEffect(() => { brushColorRef.current = brushColor; }, [brushColor]);
  useEffect(() => { brushSizeRef.current = brushSize; }, [brushSize]);

  // Track last-fetched world-space bounds to avoid redundant DB queries
  const fetchedBoundsRef = useRef<{
    minX: number; maxX: number; minY: number; maxY: number; scale: number;
  } | null>(null);
  // Whether a fetch is already in flight
  const isFetchingRef = useRef(false);

  // Fetch messages and strokes on viewport change
  const fetchData = useCallback(async (force = false) => {
    if (!containerRef.current) return;
    if (isFetchingRef.current) return; // skip if already fetching

    const rect = containerRef.current.getBoundingClientRect();
    const topLeft = screenToWorld(-FETCH_BUFFER, -FETCH_BUFFER);
    const bottomRight = screenToWorld(rect.width + FETCH_BUFFER, rect.height + FETCH_BUFFER);

    // Skip if the viewport is still well within the previously fetched region
    // and the zoom level hasn't changed meaningfully.
    if (!force && fetchedBoundsRef.current) {
      const fb = fetchedBoundsRef.current;
      const scaleChanged = fb.scale > 0 && Math.abs(scale - fb.scale) / fb.scale > 0.2;
      const withinCache =
        topLeft.x >= fb.minX &&
        topLeft.y >= fb.minY &&
        bottomRight.x <= fb.maxX &&
        bottomRight.y <= fb.maxY;
      if (!scaleChanged && withinCache) return;
    }

    isFetchingRef.current = true;
    // Expand the query bounds by FETCH_CACHE_BUFFER so we cache ahead of time
    const qMinX = topLeft.x - FETCH_CACHE_BUFFER;
    const qMaxX = bottomRight.x + FETCH_CACHE_BUFFER;
    const qMinY = topLeft.y - FETCH_CACHE_BUFFER;
    const qMaxY = bottomRight.y + FETCH_CACHE_BUFFER;

    try {
      const [msgRes, strokeRes] = await Promise.all([
        fetch(
          `/api/messages?minX=${qMinX}&maxX=${qMaxX}&minY=${qMinY}&maxY=${qMaxY}`
        ),
        fetch(`/api/strokes?limit=300`),
      ]);

      if (msgRes.ok) {
        const data = await msgRes.json();
        setMessages(data.messages ?? []);
        setDbAvailable(true);
        setIsConnected(true);
        // Update cached bounds to the expanded query region
        fetchedBoundsRef.current = { minX: qMinX, maxX: qMaxX, minY: qMinY, maxY: qMaxY, scale };
      } else if (msgRes.status === 503) {
        setDbAvailable(false);
        setIsConnected(false);
      }

      if (strokeRes.ok) {
        const data = await strokeRes.json();
        setStrokes(data.strokes ?? []);
      }
    } catch {
      setIsConnected(false);
    } finally {
      isFetchingRef.current = false;
    }
  }, [screenToWorld, scale]);

  // Initial fetch + refetch on viewport change (debounced)
  const fetchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (fetchTimeout.current) clearTimeout(fetchTimeout.current);
    fetchTimeout.current = setTimeout(fetchData, 300);
    return () => {
      if (fetchTimeout.current) clearTimeout(fetchTimeout.current);
    };
  }, [fetchData, offset, scale]);

  // Supabase Realtime
  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) return;

    let channel: import("@supabase/supabase-js").RealtimeChannel | undefined;

    async function setupRealtime() {
      try {
        const { createClient } = await import("@supabase/supabase-js");
        const supabase = createClient(supabaseUrl!, supabaseKey!);
        channel = supabase
          .channel("board-main")
          .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "messages" },
            (payload: { new: Record<string, unknown> }) => {
              setMessages((prev) => {
                if (prev.find((m) => m.id === payload.new.id)) return prev;
                return [payload.new as unknown as Message, ...prev];
              });
            }
          )
          .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "strokes" },
            (payload: { new: Record<string, unknown> }) => {
              setStrokes((prev) => {
                if (prev.find((s) => s.id === payload.new.id)) return prev;
                return [payload.new as unknown as Stroke, ...prev];
              });
            }
          )
          .subscribe((status: string) => {
            setIsConnected(status === "SUBSCRIBED");
          });
      } catch {
        // Realtime unavailable
      }
    }

    setupRealtime();

    return () => {
      if (channel) {
        channel.unsubscribe().catch(() => {});
      }
    };
  }, []);

  // Draw strokes on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const stroke of strokes) {
      if (stroke.points.length < 2) continue;
      ctx.beginPath();
      ctx.strokeStyle = stroke.author_color;
      ctx.lineWidth = stroke.stroke_width * scale;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      const first = worldToScreen(stroke.points[0].x, stroke.points[0].y);
      ctx.moveTo(first.x, first.y);

      for (let i = 1; i < stroke.points.length; i++) {
        const pt = worldToScreen(stroke.points[i].x, stroke.points[i].y);
        ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();
    }
  }, [strokes, offset, scale, worldToScreen]);

  // Submit a stroke - defined with useCallback to avoid stale closure in event handlers
  const submitStroke = useCallback(async (points: Array<{ x: number; y: number }>) => {
    const id = identityRef.current;
    if (!id || points.length < 2) return;
    try {
      await fetch("/api/strokes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": id.uid,
        },
        body: JSON.stringify({
          points,
          author_color: brushColorRef.current,
          stroke_width: brushSizeRef.current,
        }),
      });
      fetchData(true);
    } catch {
      // Ignore
    }
  }, [fetchData]);

  // Submit a text message
  const submitMessage = useCallback(async (
    content: string,
    worldX: number,
    worldY: number,
    replyToId: string | null = null,
  ) => {
    const id = identityRef.current;
    if (!id || !content.trim()) return;
    setTextInput((prev) => ({ ...prev, visible: false, value: "", replyToId: null }));

    try {
      await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": id.uid,
        },
        body: JSON.stringify({
          coord_x: worldX,
          coord_y: worldY,
          author_name: id.name,
          author_color: brushColorRef.current,
          content: content.trim(),
          ...(replyToId ? { reply_to_id: replyToId } : {}),
        }),
      });
      fetchData(true);
    } catch {
      // Ignore network errors
    }
  }, [fetchData]);

  // Mouse event handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      dragStartPos.current = { x: e.clientX, y: e.clientY };
      hasDragged.current = false;

      if (mode === "draw") {
        isDrawing.current = true;
        const world = screenToWorld(e.clientX, e.clientY - TOOLBAR_HEIGHT); // account for toolbar
        currentStroke.current = [world];
      } else {
        startPan(e.clientX, e.clientY);
      }
    },
    [mode, screenToWorld, startPan]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const dx = e.clientX - dragStartPos.current.x;
      const dy = e.clientY - dragStartPos.current.y;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        hasDragged.current = true;
      }

      if (mode === "draw" && isDrawing.current) {
        const world = screenToWorld(e.clientX, e.clientY - TOOLBAR_HEIGHT);
        currentStroke.current.push(world);

        // Live draw on canvas
        const canvas = canvasRef.current;
        if (canvas && currentStroke.current.length >= 2) {
          const ctx = canvas.getContext("2d");
          if (ctx) {
            const pts = currentStroke.current;
            const prev = worldToScreen(pts[pts.length - 2].x, pts[pts.length - 2].y);
            const curr = worldToScreen(pts[pts.length - 1].x, pts[pts.length - 1].y);
            ctx.beginPath();
            ctx.strokeStyle = brushColorRef.current;
            ctx.lineWidth = brushSizeRef.current * scale;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.moveTo(prev.x, prev.y);
            ctx.lineTo(curr.x, curr.y);
            ctx.stroke();
          }
        }
      } else if (mode === "write") {
        updatePan(e.clientX, e.clientY);
      }
    },
    [mode, screenToWorld, worldToScreen, updatePan, scale]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (mode === "draw") {
        isDrawing.current = false;
        if (currentStroke.current.length >= 2) {
          submitStroke([...currentStroke.current]);
        }
        currentStroke.current = [];
      } else {
        endPan();
        // If it was a click (not a drag), show text input
        if (!hasDragged.current && mode === "write") {
          const screenX = e.clientX;
          const screenY = e.clientY - TOOLBAR_HEIGHT; // toolbar offset
          const world = screenToWorld(screenX, screenY);
          setTextInput({
            visible: true,
            worldX: world.x,
            worldY: world.y,
            screenX: e.clientX,
            screenY: e.clientY,
            value: "",
            replyToId: null,
          });
        }
      }
    },
    [mode, endPan, screenToWorld, submitStroke]
  );

  const handleMouseLeave = useCallback(() => {
    if (mode === "draw" && isDrawing.current) {
      isDrawing.current = false;
      if (currentStroke.current.length >= 2) {
        submitStroke([...currentStroke.current]);
      }
      currentStroke.current = [];
    } else {
      endPan();
    }
  }, [mode, endPan, submitStroke]);

  // Wheel zoom
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  // Resize canvas
  useEffect(() => {
    function onResize() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }
    window.addEventListener("resize", onResize);
    onResize();
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Update brush color when identity first loads
  useEffect(() => {
    if (identity?.color && brushColor === "#6366f1") {
      setBrushColor(identity.color);
    }
    // Only run when identity first becomes available
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identity?.color]);

  // Handle reply: open text input positioned near the original message
  const handleReply = useCallback(
    (msg: Message) => {
      const screen = worldToScreen(msg.coord_x, msg.coord_y);
      setTextInput({
        visible: true,
        worldX: msg.coord_x + 20,
        worldY: msg.coord_y + 20,
        screenX: Math.min(screen.x + 40, window.innerWidth - 160),
        screenY: Math.min(screen.y + TOOLBAR_HEIGHT + 40, window.innerHeight - 160),
        value: "",
        replyToId: msg.id,
      });
    },
    [worldToScreen]
  );

  const cursor = mode === "draw" ? "crosshair" : isPanning.current ? "grabbing" : "crosshair";

  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", background: "#0f0f0f" }}>
      <Toolbar
        identity={identity}
        mode={mode}
        onModeChange={setMode}
        brushColor={brushColor}
        onBrushColorChange={(c) => {
          setBrushColor(c);
          setColor(c);
        }}
        brushSize={brushSize}
        onBrushSizeChange={setBrushSize}
        onNameEdit={setName}
        isConnected={isConnected}
      />

      {!dbAvailable && (
        <div
          style={{
            position: "fixed",
            top: 64,
            left: "50%",
            transform: "translateX(-50%)",
            background: "#1a1a1a",
            border: "1px solid #f87171",
            borderRadius: 8,
            padding: "8px 16px",
            color: "#f87171",
            fontSize: "0.85rem",
            zIndex: 200,
          }}
        >
          ⚠️ Database not configured — canvas is in read-only demo mode
        </div>
      )}

      <div
        ref={containerRef}
        style={{
          position: "absolute",
          top: TOOLBAR_HEIGHT,
          left: 0,
          right: 0,
          bottom: 0,
          cursor,
          overflow: "hidden",
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        {/* Canvas for strokes */}
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
          }}
        />

        {/* Grid dots (background) */}
        <svg
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
          }}
        >
          <defs>
            <pattern
              id="dots"
              x={offset.x % (40 * scale)}
              y={offset.y % (40 * scale)}
              width={40 * scale}
              height={40 * scale}
              patternUnits="userSpaceOnUse"
            >
              <circle cx={1} cy={1} r={0.8} fill="#2a2a2a" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>

        {/* Messages */}
        {messages.map((msg) => {
          const screen = worldToScreen(msg.coord_x, msg.coord_y);
          return (
            <MessageCard
              key={msg.id}
              message={msg}
              screenX={screen.x}
              screenY={screen.y}
              scale={scale}
              allMessages={messages}
              onReply={handleReply}
            />
          );
        })}

        {/* Origin marker */}
        <div
          style={{
            position: "absolute",
            left: offset.x,
            top: offset.y,
            width: 8,
            height: 8,
            background: "#6366f1",
            borderRadius: "50%",
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
            opacity: 0.6,
          }}
        />
      </div>

      {/* Text Input Overlay */}
      {textInput.visible && (
        <div
          style={{
            position: "fixed",
            left: textInput.screenX,
            top: textInput.screenY,
            zIndex: 300,
            transform: "translate(-50%, -50%)",
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div
            style={{
              background: "rgba(26,26,26,0.97)",
              border: "1px solid #6366f1",
              borderRadius: 10,
              padding: "8px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.3)",
              backdropFilter: "blur(12px)",
            }}
          >
            {/* Reply-to context banner */}
            {textInput.replyToId && (() => {
              const parent = messages.find((m) => m.id === textInput.replyToId);
              return parent ? (
                <div
                  style={{
                    borderLeft: "2px solid #6366f1",
                    paddingLeft: 8,
                    marginBottom: 6,
                    opacity: 0.8,
                  }}
                >
                  <span style={{ color: parent.author_color, fontSize: "0.75rem", fontWeight: 600 }}>
                    ↩ Replying to {parent.author_name}
                  </span>
                  <p style={{ color: "#aaa", fontSize: "0.75rem", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 264 }}>
                    {parent.content.slice(0, 80)}{parent.content.length > 80 ? "…" : ""}
                  </p>
                </div>
              ) : null;
            })()}
            <textarea
              autoFocus
              value={textInput.value}
              onChange={(e) =>
                setTextInput((prev) => ({ ...prev, value: e.target.value }))
              }
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submitMessage(textInput.value, textInput.worldX, textInput.worldY, textInput.replyToId);
                }
                if (e.key === "Escape") {
                  setTextInput((prev) => ({ ...prev, visible: false, value: "", replyToId: null }));
                }
              }}
              placeholder="Type your message... (Enter to submit, Shift+Enter for newline)"
              maxLength={500}
              style={{
                background: "transparent",
                border: "none",
                outline: "none",
                color: "#e5e5e5",
                fontSize: "0.95rem",
                width: 280,
                minHeight: 80,
                resize: "vertical",
                fontFamily: "Inter, system-ui, sans-serif",
                lineHeight: 1.5,
              }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 4,
              }}
            >
              <span style={{ color: "#555", fontSize: "0.75rem" }}>
                {textInput.value.length}/500
              </span>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  onClick={() =>
                    setTextInput((prev) => ({ ...prev, visible: false, value: "", replyToId: null }))
                  }
                  style={{
                    background: "transparent",
                    border: "1px solid #333",
                    borderRadius: 6,
                    color: "#888",
                    padding: "3px 10px",
                    cursor: "pointer",
                    fontSize: "0.8rem",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => submitMessage(textInput.value, textInput.worldX, textInput.worldY, textInput.replyToId)}
                  style={{
                    background: "#6366f1",
                    border: "none",
                    borderRadius: 6,
                    color: "#fff",
                    padding: "3px 10px",
                    cursor: "pointer",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                  }}
                >
                  Post
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
