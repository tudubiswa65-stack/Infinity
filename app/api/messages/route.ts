import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase";
import { messageLimiter } from "@/lib/redis";
import { getClientIp } from "@/lib/getClientIp";

export async function GET(request: NextRequest) {
  const supabase = createSupabaseClient("anon");
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const minX = parseFloat(searchParams.get("minX") ?? "-10000");
  const maxX = parseFloat(searchParams.get("maxX") ?? "10000");
  const minY = parseFloat(searchParams.get("minY") ?? "-10000");
  const maxY = parseFloat(searchParams.get("maxY") ?? "10000");

  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("board_code", "main")
    .gte("coord_x", minX)
    .lte("coord_x", maxX)
    .gte("coord_y", minY)
    .lte("coord_y", maxY)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ messages: data });
}

export async function POST(request: NextRequest) {
  const userId = request.headers.get("X-User-Id");
  if (!userId || userId.length < 4 || userId.length > 64) {
    return NextResponse.json({ error: "Valid X-User-Id header required" }, { status: 400 });
  }

  // Rate limiting — keyed by IP so each device is limited independently
  if (messageLimiter) {
    const ip = getClientIp(request);
    const result = await messageLimiter.limit(ip);
    if (!result.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Max 10 messages per minute." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((result.reset - Date.now()) / 1000)),
          },
        }
      );
    }
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { coord_x, coord_y, author_name, author_color, content, reply_to_id } = body as Record<string, unknown>;

  if (typeof content !== "string" || content.trim().length === 0) {
    return NextResponse.json({ error: "content is required" }, { status: 400 });
  }
  if (content.length > 500) {
    return NextResponse.json({ error: "content must be 500 chars or less" }, { status: 400 });
  }
  if (typeof coord_x !== "number" || typeof coord_y !== "number") {
    return NextResponse.json({ error: "coord_x and coord_y must be numbers" }, { status: 400 });
  }
  if (!isFinite(coord_x) || !isFinite(coord_y)) {
    return NextResponse.json({ error: "coord_x and coord_y must be finite numbers" }, { status: 400 });
  }
  const COORD_LIMIT = 1_000_000_000;
  if (Math.abs(coord_x) > COORD_LIMIT || Math.abs(coord_y) > COORD_LIMIT) {
    return NextResponse.json({ error: `coord_x and coord_y must be within ±${COORD_LIMIT}` }, { status: 400 });
  }
  if (typeof author_name !== "string" || author_name.trim().length === 0 || author_name.length > 64) {
    return NextResponse.json({ error: "author_name is required (max 64 chars)" }, { status: 400 });
  }
  const colorRegex = /^#[0-9a-fA-F]{6}$/;
  if (typeof author_color !== "string" || !colorRegex.test(author_color)) {
    return NextResponse.json({ error: "author_color must be a valid hex color" }, { status: 400 });
  }
  if (reply_to_id !== undefined && reply_to_id !== null && typeof reply_to_id !== "string") {
    return NextResponse.json({ error: "reply_to_id must be a UUID string" }, { status: 400 });
  }
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (typeof reply_to_id === "string" && !uuidRegex.test(reply_to_id)) {
    return NextResponse.json({ error: "reply_to_id must be a valid UUID" }, { status: 400 });
  }

  const supabase = createSupabaseClient("service");
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({
      board_code: "main",
      coord_x,
      coord_y,
      author_id: userId,
      author_name: author_name.trim(),
      author_color,
      content: content.trim(),
      ...(reply_to_id ? { reply_to_id } : {}),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: data }, { status: 201 });
}
