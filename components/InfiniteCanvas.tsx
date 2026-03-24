"use client";

import {
  useRef,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { useIdentity } from "@/hooks/useIdentity";
import { useCanvas } from "@/hooks/useCanvas";
import { useRateLimit } from "@/hooks/useRateLimit";
import { useToast } from "@/hooks/useToast";
import { Message, Stroke } from "@/types";
import MessageCard from "./MessageCard";
import Toolbar from "./Toolbar";
import ThreadPanel from "./ThreadPanel";
import ToastContainer from "./ToastContainer";

function fmt(n: number): string {
  return n.toFixed(0);
}

interface InfiniteCanvasProps {
  initialX?: number;
  initialY?: number;
}

const FETCH_BUFFER = 500;
// How far (in world units) the viewport must travel beyond the already-fetched
// region before we issue another DB query. Larger = fewer queries when panning.
const FETCH_CACHE_BUFFER = 1500;
const TOOLBAR_HEIGHT = 56;

// World-unit offsets used both when placing a new reply and when computing the
// expanded-thread layout, so the two always stay in sync.
const REPLY_STACK_OFFSET_X = 30;   // horizontal indent relative to parent
const REPLY_STACK_OFFSET_Y = 200;  // vertical gap so reply appears below parent card
const REPLY_STACK_SPACING = 160;   // vertical space between consecutive replies

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
    applyZoom,
    jumpTo,
  } = useCanvas(initialX, initialY);
  const { rateLimits, updateFromResponse, handleRateLimitError, checkCanProceed } = useRateLimit();
  const { toasts, removeToast, success, error: showError, warning, info } = useToast();

  const [messages, setMessages] = useState<Message[]>([]);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [brushColor, setBrushColor] = useState("#6366f1");
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const [brushSize, setBrushSize] = useState(3);
  const [isConnected, setIsConnected] = useState(false);
  const [dbAvailable, setDbAvailable] = useState(true);
  const [threadMessage, setThreadMessage] = useState<Message | null>(null);
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());

  // Map each message id to a stacking index (oldest = 1, newest = N) so newer
  // messages always render on top when they overlap with older ones.
  const messageZIndexMap = useMemo(() => {
    const sorted = [...messages].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    return new Map(sorted.map((m, i) => [m.id, i + 1]));
  }, [messages]);

  // O(1) id-to-message lookup used for thread connectors and reply excerpts.
  const messageById = useMemo(
    () => new Map(messages.map((m) => [m.id, m])),
    [messages]
  );

  // Compute reply counts and thread depth for each message
  const replyCounts = useMemo(() => {
    const counts = new Map<string, number>();
    messages.forEach((msg) => {
      counts.set(msg.id, 0);
    });
    messages.forEach((msg) => {
      if (msg.reply_to_id) {
        const count = counts.get(msg.reply_to_id) ?? 0;
        counts.set(msg.reply_to_id, count + 1);
      }
    });
    return counts;
  }, [messages]);

  const messageDepth = useMemo(() => {
    const depths = new Map<string, number>();
    messages.forEach((msg) => {
      depths.set(msg.id, 0);
    });
    // Compute depth for each message by following parent chain
    messages.forEach((msg) => {
      let depth = 0;
      let parentId = msg.reply_to_id;
      const visited = new Set<string>();
      while (parentId && !visited.has(parentId)) {
        visited.add(parentId);
        const parent = messageById.get(parentId);
        if (parent) {
          depth++;
          parentId = parent.reply_to_id;
        } else {
          break;
        }
      }
      depths.set(msg.id, depth);
    });
    return depths;
  }, [messages, messageById]);

  // Pre-filtered list of messages that are replies (have reply_to_id set).
  // Memoized so the thread-connector SVG never re-iterates on unrelated renders.
  const replyMessages = useMemo(
    () => messages.filter((msg) => msg.reply_to_id),
    [messages]
  );

  // Thread expansion: compute positions for replies when a thread is expanded
  const threadLayout = useMemo(() => {
    const layout = new Map<string, { 
      parentId: string; 
      index: number; 
      computedX: number; 
      computedY: number;
    }>();
    
    expandedThreads.forEach(parentId => {
      const parent = messageById.get(parentId);
      if (!parent) return;
      
      // Find all direct replies to this parent
      const replies = messages
        .filter(m => m.reply_to_id === parentId)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      
      // Stack replies vertically below parent with offset
      replies.forEach((reply, index) => {
        layout.set(reply.id, {
          parentId,
          index,
          computedX: parent.coord_x + REPLY_STACK_OFFSET_X,
          computedY: parent.coord_y + REPLY_STACK_OFFSET_Y + (index * REPLY_STACK_SPACING),
        });
      });
    });
    
    return layout;
  }, [expandedThreads, messages, messageById]);

  // Toggle thread expansion for a specific message
  const toggleThreadExpansion = useCallback((messageId: string) => {
    setExpandedThreads(prev => {
      const next = new Set(prev);
      if (next.has(messageId)) {
        next.delete(messageId);
      } else {
        next.add(messageId);
      }
      return next;
    });
  }, []);

  // Check if a thread is expanded
  const isThreadExpanded = useCallback((messageId: string) => {
    return expandedThreads.has(messageId);
  }, [expandedThreads]);

  // Cursor world position for the coordinate HUD
  const [cursorWorld, setCursorWorld] = useState<{ x: number; y: number } | null>(null);

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

  // Temporary pan active (middle-click or Space+drag), overrides current mode
  const isTempPanning = useRef(false);

  // Space key held state
  const spaceHeld = useRef(false);

  // Track drag distance to distinguish click from drag
  const dragStartPos = useRef({ x: 0, y: 0 });
  const hasDragged = useRef(false);

  // Touch state for pinch-to-zoom
  const touchLastDist = useRef<number | null>(null);
  // Whether the current touch gesture started as a two-finger pinch
  const touchIsPinching = useRef(false);

  // Refs for use inside callbacks to avoid stale closures
  const identityRef = useRef(identity);
  const brushColorRef = useRef(brushColor);
  const brushSizeRef = useRef(brushSize);
  const modeRef = useRef(mode);
  useEffect(() => { identityRef.current = identity; }, [identity]);
  useEffect(() => { brushColorRef.current = brushColor; }, [brushColor]);
  useEffect(() => { brushSizeRef.current = brushSize; }, [brushSize]);
  useEffect(() => { modeRef.current = mode; }, [mode]);

  // Sets of known IDs used for O(1) realtime deduplication
  const messageIdsRef = useRef<Set<string>>(new Set());
  const strokeIdsRef = useRef<Set<string>>(new Set());

  // requestAnimationFrame handle for cursor HUD throttling
  const cursorRafRef = useRef<number | null>(null);
  const pendingCursorRef = useRef<{ x: number; y: number } | null>(null);

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
        fetch(
          `/api/strokes?minX=${qMinX}&maxX=${qMaxX}&minY=${qMinY}&maxY=${qMaxY}&limit=300`
        ),
      ]);

      if (msgRes.ok) {
        const data = await msgRes.json();
        const msgs: Message[] = data.messages ?? [];
        messageIdsRef.current = new Set(msgs.map((m) => m.id));
        setMessages(msgs);
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
        const strks: Stroke[] = data.strokes ?? [];
        strokeIdsRef.current = new Set(strks.map((s) => s.id));
        setStrokes(strks);
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
              const id = payload.new.id as string;
              if (messageIdsRef.current.has(id)) return;
              messageIdsRef.current.add(id);
              setMessages((prev) => [payload.new as unknown as Message, ...prev]);
            }
          )
          .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "strokes" },
            (payload: { new: Record<string, unknown> }) => {
              const id = payload.new.id as string;
              if (strokeIdsRef.current.has(id)) return;
              strokeIdsRef.current.add(id);
              setStrokes((prev) => [payload.new as unknown as Stroke, ...prev]);
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

    const newWidth = canvas.offsetWidth;
    const newHeight = canvas.offsetHeight;
    if (canvas.width !== newWidth || canvas.height !== newHeight) {
      // Resizing the canvas automatically clears it
      canvas.width = newWidth;
      canvas.height = newHeight;
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

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

    // Check rate limit first
    const canSubmit = checkCanProceed("strokes");
    if (!canSubmit.allowed) {
      showError(`Rate limited. Try again in ${canSubmit.secondsUntilReset}s.`);
      return;
    }

    try {
      const res = await fetch("/api/strokes", {
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

      if (res.ok) {
        updateFromResponse("strokes", res.headers);
        success("Stroke posted");
        fetchData(true);
      } else if (res.status === 429) {
        handleRateLimitError("strokes", res.headers);
        const data = await res.json() as { error: string };
        showError(data.error);
      } else {
        const data = await res.json() as { error: string };
        showError(data.error || "Failed to post stroke");
      }
    } catch {
      showError("Network error. Please try again.");
    }
  }, [fetchData, checkCanProceed, updateFromResponse, handleRateLimitError, showError, success]);

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

    // Check rate limit first
    const canSubmit = checkCanProceed("messages");
    if (!canSubmit.allowed) {
      showError(`Rate limited. Try again in ${canSubmit.secondsUntilReset}s.`);
      return;
    }

    try {
      const res = await fetch("/api/messages", {
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

      if (res.ok) {
        updateFromResponse("messages", res.headers);
        success("Message posted");
        // Auto-expand the parent thread so the new reply is immediately visible below
        if (replyToId) {
          setExpandedThreads((prev) => new Set([...prev, replyToId]));
        }
        fetchData(true);
      } else if (res.status === 429) {
        handleRateLimitError("messages", res.headers);
        const data = await res.json() as { error: string };
        showError(data.error);
      } else {
        const data = await res.json() as { error: string };
        showError(data.error || "Failed to post message");
      }
    } catch {
      showError("Network error. Please try again.");
    }
  }, [fetchData, checkCanProceed, updateFromResponse, handleRateLimitError, showError, success]);

  // Space key handling — enables temporary pan in any mode
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (
        e.code === "Space" &&
        !e.repeat &&
        !(e.target instanceof HTMLTextAreaElement) &&
        !(e.target instanceof HTMLInputElement)
      ) {
        e.preventDefault();
        spaceHeld.current = true;
      }
    }
    function onKeyUp(e: KeyboardEvent) {
      if (e.code === "Space") {
        spaceHeld.current = false;
        if (isTempPanning.current) {
          isTempPanning.current = false;
          endPan();
        }
      }
      if (e.code === "Escape") {
        setTextInput((prev) => ({ ...prev, visible: false, value: "", replyToId: null }));
        setThreadMessage(null);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [endPan]);

  // Mouse event handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Middle-click: always pan regardless of mode
      if (e.button === 1) {
        e.preventDefault();
        isTempPanning.current = true;
        startPan(e.clientX, e.clientY);
        return;
      }

      if (e.button !== 0) return;

      // Space+left-drag: temporary pan
      if (spaceHeld.current) {
        isTempPanning.current = true;
        startPan(e.clientX, e.clientY);
        return;
      }

      dragStartPos.current = { x: e.clientX, y: e.clientY };
      hasDragged.current = false;

      const m = modeRef.current;
      if (m === "draw") {
        isDrawing.current = true;
        const world = screenToWorld(e.clientX, e.clientY - TOOLBAR_HEIGHT);
        currentStroke.current = [world];
      } else {
        // write or pan: drag to pan
        startPan(e.clientX, e.clientY);
      }
    },
    [screenToWorld, startPan]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      // Throttle cursor HUD updates to once per animation frame to avoid
      // triggering a full React re-render on every mouse-move event.
      pendingCursorRef.current = screenToWorld(e.clientX, e.clientY - TOOLBAR_HEIGHT);
      if (cursorRafRef.current === null) {
        cursorRafRef.current = requestAnimationFrame(() => {
          setCursorWorld(pendingCursorRef.current);
          cursorRafRef.current = null;
        });
      }

      // Temporary pan (middle-click or Space+drag)
      if (isTempPanning.current) {
        updatePan(e.clientX, e.clientY);
        return;
      }

      const dx = e.clientX - dragStartPos.current.x;
      const dy = e.clientY - dragStartPos.current.y;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        hasDragged.current = true;
      }

      const m = modeRef.current;
      if (m === "draw" && isDrawing.current) {
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
      } else if (m === "write" || m === "pan") {
        updatePan(e.clientX, e.clientY);
      }
    },
    [screenToWorld, worldToScreen, updatePan, scale]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      // End temporary pan
      if (isTempPanning.current) {
        isTempPanning.current = false;
        endPan();
        return;
      }

      const m = modeRef.current;
      if (m === "draw") {
        isDrawing.current = false;
        if (currentStroke.current.length >= 2) {
          submitStroke([...currentStroke.current]);
        }
        currentStroke.current = [];
      } else if (m === "pan") {
        endPan();
      } else {
        // write mode
        endPan();
        // If it was a click (not a drag) on the empty canvas, show text input.
        // Clicks that originate from a message card are ignored here so that
        // interacting with a card (including pressing Reply) does not also open
        // a new blank text input that would override the reply context.
        const onMessageCard = !!(e.target as HTMLElement).closest(
          "[data-message-card]"
        );
        if (!hasDragged.current && e.button === 0 && !onMessageCard) {
          const screenX = e.clientX;
          const screenY = e.clientY - TOOLBAR_HEIGHT;
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
    [endPan, screenToWorld, submitStroke]
  );

  const handleMouseLeave = useCallback(() => {
    // Cancel any pending cursor RAF and clear the HUD immediately
    if (cursorRafRef.current !== null) {
      cancelAnimationFrame(cursorRafRef.current);
      cursorRafRef.current = null;
    }
    pendingCursorRef.current = null;
    setCursorWorld(null);
    if (isTempPanning.current) {
      isTempPanning.current = false;
      endPan();
      return;
    }
    const m = modeRef.current;
    if (m === "draw" && isDrawing.current) {
      isDrawing.current = false;
      if (currentStroke.current.length >= 2) {
        submitStroke([...currentStroke.current]);
      }
      currentStroke.current = [];
    } else {
      endPan();
    }
  }, [endPan, submitStroke]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  // Touch handlers for mobile/tablet support
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        dragStartPos.current = { x: touch.clientX, y: touch.clientY };
        hasDragged.current = false;
        touchIsPinching.current = false;
        touchLastDist.current = null;
        const m = modeRef.current;
        if (m === "draw") {
          isDrawing.current = true;
          const world = screenToWorld(touch.clientX, touch.clientY - TOOLBAR_HEIGHT);
          currentStroke.current = [world];
        } else {
          startPan(touch.clientX, touch.clientY);
        }
      } else if (e.touches.length === 2) {
        // Start pinch-to-zoom — stop any ongoing pan or draw
        endPan();
        isDrawing.current = false;
        if (currentStroke.current.length >= 2) {
          submitStroke([...currentStroke.current]);
        }
        currentStroke.current = [];
        touchIsPinching.current = true;
        const dx = e.touches[1].clientX - e.touches[0].clientX;
        const dy = e.touches[1].clientY - e.touches[0].clientY;
        touchLastDist.current = Math.hypot(dx, dy);
      }
    },
    [startPan, endPan, screenToWorld, submitStroke]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 1 && !touchIsPinching.current) {
        const touch = e.touches[0];
        const dx = touch.clientX - dragStartPos.current.x;
        const dy = touch.clientY - dragStartPos.current.y;
        if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
          hasDragged.current = true;
        }
        const m = modeRef.current;
        if (m === "draw" && isDrawing.current) {
          const world = screenToWorld(touch.clientX, touch.clientY - TOOLBAR_HEIGHT);
          currentStroke.current.push(world);
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
        } else {
          updatePan(touch.clientX, touch.clientY);
        }
      } else if (e.touches.length === 2 && touchLastDist.current !== null) {
        // Pinch-to-zoom
        const dx = e.touches[1].clientX - e.touches[0].clientX;
        const dy = e.touches[1].clientY - e.touches[0].clientY;
        const dist = Math.hypot(dx, dy);
        const factor = dist / touchLastDist.current;
        touchLastDist.current = dist;
        const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - TOOLBAR_HEIGHT;
        applyZoom(factor, midX, midY);
      }
    },
    [screenToWorld, worldToScreen, updatePan, scale, applyZoom]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 0) {
        // All fingers lifted
        const m = modeRef.current;
        if (m === "draw") {
          isDrawing.current = false;
          if (currentStroke.current.length >= 2) {
            submitStroke([...currentStroke.current]);
          }
          currentStroke.current = [];
        } else {
          endPan();
          // Tap (not drag, not pinch) in write mode → open message composer.
          // Taps that originate from a message card (e.g. the Reply button) are
          // ignored here so they don't also open a blank composer, mirroring the
          // same guard that exists in handleMouseUp.
          const onMessageCard = !!(e.target as HTMLElement).closest(
            "[data-message-card]"
          );
          if (
            !hasDragged.current &&
            !touchIsPinching.current &&
            m === "write" &&
            e.changedTouches.length === 1 &&
            !onMessageCard
          ) {
            const touch = e.changedTouches[0];
            const screenX = touch.clientX;
            const screenY = touch.clientY - TOOLBAR_HEIGHT;
            const world = screenToWorld(screenX, screenY);
            setTextInput({
              visible: true,
              worldX: world.x,
              worldY: world.y,
              screenX: touch.clientX,
              screenY: touch.clientY,
              value: "",
              replyToId: null,
            });
          }
        }
        touchLastDist.current = null;
        touchIsPinching.current = false;
      } else if (e.touches.length === 1) {
        // One finger lifted from two-finger pinch → resume single-touch pan
        touchLastDist.current = null;
        touchIsPinching.current = false;
        const touch = e.touches[0];
        dragStartPos.current = { x: touch.clientX, y: touch.clientY };
        hasDragged.current = true; // prevent spurious tap after pinch
        startPan(touch.clientX, touch.clientY);
      }
    },
    [endPan, screenToWorld, submitStroke, startPan]
  );


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

  // Handle reply: open text input positioned below the original message
  const handleReply = useCallback(
    (msg: Message) => {
      // Count existing direct replies to determine vertical stacking offset,
      // matching the threadLayout so the stored position aligns with expanded view.
      const existingRepliesCount = messages.filter(m => m.reply_to_id === msg.id).length;
      const replyWorldX = msg.coord_x + REPLY_STACK_OFFSET_X;
      const replyWorldY = msg.coord_y + REPLY_STACK_OFFSET_Y + existingRepliesCount * REPLY_STACK_SPACING;
      const replyScreen = worldToScreen(replyWorldX, replyWorldY);
      // Keep the text-input composer within the visible viewport
      const INPUT_MARGIN = 200;
      setTextInput({
        visible: true,
        worldX: replyWorldX,
        worldY: replyWorldY,
        screenX: Math.min(Math.max(replyScreen.x, INPUT_MARGIN), window.innerWidth - INPUT_MARGIN),
        screenY: Math.min(Math.max(replyScreen.y + TOOLBAR_HEIGHT, TOOLBAR_HEIGHT + 40), window.innerHeight - INPUT_MARGIN),
        value: "",
        replyToId: msg.id,
      });
    },
    [worldToScreen, messages]
  );

  // Handle view thread: open thread panel for the message
  const handleViewThread = useCallback(
    (msg: Message) => {
      setThreadMessage(msg);
    },
    []
  );

  // Navigate to a message: pan the viewport so the message is centered, then briefly highlight it
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleNavigateToMessage = useCallback(
    (msg: Message) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      jumpTo(msg.coord_x, msg.coord_y, rect.width, rect.height);
      // Clear any existing highlight timer
      if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current);
      setHighlightedMessageId(msg.id);
      highlightTimeoutRef.current = setTimeout(() => {
        setHighlightedMessageId(null);
        highlightTimeoutRef.current = null;
      }, 2000);
    },
    [jumpTo]
  );

  // Cursor style based on current interaction state
  const effectivePanning = isPanning.current || isTempPanning.current;
  let cursor: string;
  if (effectivePanning) {
    cursor = "grabbing";
  } else if (mode === "pan" || spaceHeld.current) {
    cursor = "grab";
  } else {
    cursor = "crosshair";
  }

  // Viewport center in world coordinates (for coordinate HUD when cursor is outside)
  const containerEl = containerRef.current;
  const containerWidth = containerEl ? containerEl.offsetWidth : 800;
  const containerHeight = containerEl ? containerEl.offsetHeight : 600;
  const centerWorld = screenToWorld(containerWidth / 2, containerHeight / 2);

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
        rateLimits={rateLimits}
        onJumpTo={(x, y) => {
          if (!containerRef.current) return;
          const rect = containerRef.current.getBoundingClientRect();
          jumpTo(x, y, rect.width, rect.height);
        }}
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
          touchAction: "none",
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onContextMenu={handleContextMenu}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
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

        {/* Thread connectors — draw a dashed line from each reply message back to its parent */}
        <svg
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            overflow: "visible",
          }}
        >
        {/* Regular thread connectors for non-expanded threads */}
          {replyMessages
            .filter(msg => !threadLayout.has(msg.id))
            .map((msg) => {
              const parent = msg.reply_to_id ? messageById.get(msg.reply_to_id) : undefined;
              if (!parent) return null;
              const msgScreen = worldToScreen(msg.coord_x, msg.coord_y);
              const parentScreen = worldToScreen(parent.coord_x, parent.coord_y);
              return (
                <line
                  key={`thread-${msg.id}`}
                  x1={parentScreen.x}
                  y1={parentScreen.y}
                  x2={msgScreen.x}
                  y2={msgScreen.y}
                  stroke={parent.author_color}
                  strokeWidth={1.5}
                  strokeDasharray="5 4"
                  opacity={0.45}
                />
              );
            })}
          
          {/* YouTube-style vertical+horizontal connectors for expanded thread views */}
          {Array.from(threadLayout.entries()).map(([replyId, layout]) => {
            const reply = messageById.get(replyId);
            const parent = messageById.get(layout.parentId);
            if (!reply || !parent) return null;
            
            const replyScreen = worldToScreen(layout.computedX, layout.computedY);
            const parentScreen = worldToScreen(parent.coord_x, parent.coord_y);
            
            // Vertical line goes from just below the parent card down to the reply level,
            // then a short horizontal arm reaches right to the reply card.
            const lineX = parentScreen.x + 8;
            const lineStartY = parentScreen.y + 28 * scale;
            const lineEndY = replyScreen.y;
            const armEndX = replyScreen.x - 10 * scale;

            return (
              <g key={`expanded-thread-${replyId}`}>
                {/* Vertical segment */}
                <line
                  x1={lineX}
                  y1={lineStartY}
                  x2={lineX}
                  y2={lineEndY}
                  stroke={parent.author_color}
                  strokeWidth={2}
                  opacity={0.55}
                  strokeLinecap="round"
                />
                {/* Horizontal arm to reply */}
                <line
                  x1={lineX}
                  y1={lineEndY}
                  x2={armEndX}
                  y2={lineEndY}
                  stroke={parent.author_color}
                  strokeWidth={2}
                  opacity={0.55}
                  strokeLinecap="round"
                />
                {/* Dot at junction with reply */}
                <circle
                  cx={armEndX}
                  cy={lineEndY}
                  r={3}
                  fill={parent.author_color}
                  opacity={0.8}
                />
              </g>
            );
          })}
        </svg>

        {/* Messages — newer messages receive a higher z-index so they always appear on top */}
        {messages.map((msg) => {
          // Check if this message is being displayed as part of an expanded thread
          const threadPos = threadLayout.get(msg.id);
          const isInThreadView = !!threadPos;
          
          // Use computed position if in thread view, otherwise use stored coordinates
          const worldX = threadPos?.computedX ?? msg.coord_x;
          const worldY = threadPos?.computedY ?? msg.coord_y;
          
          const screen = worldToScreen(worldX, worldY);
          return (
            <MessageCard
              key={msg.id}
              message={msg}
              screenX={screen.x}
              screenY={screen.y}
              scale={scale}
              messageById={messageById}
              replyCount={replyCounts.get(msg.id)}
              depth={messageDepth.get(msg.id)}
              onReply={handleReply}
              onNavigateTo={handleNavigateToMessage}
              onViewThread={handleViewThread}
              onToggleThreadExpansion={() => toggleThreadExpansion(msg.id)}
              isThreadExpanded={expandedThreads.has(msg.id)}
              isInThreadView={isInThreadView}
              isHighlighted={msg.id === highlightedMessageId}
              zIndex={messageZIndexMap.get(msg.id) ?? 1}
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
          onTouchStart={(e) => e.stopPropagation()}
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
            {/* Coordinate indicator in message composer */}
            <div style={{ color: "#444", fontSize: "0.7rem", marginBottom: 4, userSelect: "none" }}>
              📍 {fmt(textInput.worldX)}, {fmt(textInput.worldY)}
            </div>

            {/* Reply-to context banner with dismiss button */}
            {textInput.replyToId && (() => {
              const parent = messageById.get(textInput.replyToId);
              return parent ? (
                <div
                  style={{
                    borderLeft: "2px solid #6366f1",
                    paddingLeft: 8,
                    marginBottom: 6,
                    opacity: 0.8,
                    position: "relative",
                  }}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setTextInput((prev) => ({ ...prev, replyToId: null }));
                    }}
                    style={{
                      position: "absolute",
                      right: 0,
                      top: 0,
                      background: "transparent",
                      border: "none",
                      color: "#888",
                      fontSize: "1rem",
                      cursor: "pointer",
                      padding: "0 4px",
                      lineHeight: 1,
                    }}
                    title="Clear reply"
                  >
                    ×
                  </button>
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
              <span
                style={{
                  color: textInput.value.length >= 480 ? "#f87171" : textInput.value.length >= 400 ? "#fbbf24" : "#555",
                  fontSize: "0.75rem",
                }}
              >
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
                  disabled={!textInput.value.trim()}
                  style={{
                    background: !textInput.value.trim() ? "#444" : "#6366f1",
                    border: "none",
                    borderRadius: 6,
                    color: "#fff",
                    padding: "3px 10px",
                    cursor: textInput.value.trim() ? "pointer" : "not-allowed",
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

      {/* Coordinate HUD — bottom-left */}
      <div
        style={{
          position: "fixed",
          bottom: 16,
          left: 16,
          background: "rgba(15,15,15,0.85)",
          border: "1px solid #2a2a2a",
          borderRadius: 8,
          padding: "6px 12px",
          backdropFilter: "blur(8px)",
          zIndex: 150,
          userSelect: "none",
          pointerEvents: "none",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        {cursorWorld ? (
          <span style={{ color: "#6366f1", fontSize: "0.75rem", fontFamily: "monospace" }}>
            cursor {fmt(cursorWorld.x)}, {fmt(cursorWorld.y)}
          </span>
        ) : (
          <span style={{ color: "#888", fontSize: "0.75rem", fontFamily: "monospace" }}>
            center {fmt(centerWorld.x)}, {fmt(centerWorld.y)}
          </span>
        )}
        <span style={{ color: "#555", fontSize: "0.7rem", fontFamily: "monospace" }}>
          zoom {(scale * 100).toFixed(0)}%
        </span>
      </div>

      {/* Thread Panel */}
      {threadMessage && (
        <ThreadPanel
          currentMessage={threadMessage}
          messages={messages}
          messageById={messageById}
          onClose={() => setThreadMessage(null)}
          onNavigateTo={handleNavigateToMessage}
        />
      )}

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
