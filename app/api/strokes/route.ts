import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase";
import { strokeLimiter } from "@/lib/redis";
import { getClientIp } from "@/lib/getClientIp";

export async function GET(request: NextRequest) {
  const supabase = createSupabaseClient("anon");
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "100"), 500);

  const { data, error } = await supabase
    .from("strokes")
    .select("*")
    .eq("board_code", "main")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ strokes: data });
}

export async function POST(request: NextRequest) {
  const userId = request.headers.get("X-User-Id");
  if (!userId || userId.length < 4 || userId.length > 64) {
    return NextResponse.json({ error: "Valid X-User-Id header required" }, { status: 400 });
  }

  if (strokeLimiter) {
    const ip = getClientIp(request);
    const result = await strokeLimiter.limit(ip);
    if (!result.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Max 5 strokes per minute." },
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

  const { points, author_color, stroke_width } = body as Record<string, unknown>;

  if (!Array.isArray(points) || points.length < 2 || points.length > 2000) {
    return NextResponse.json({ error: "points must be an array of 2-2000 items" }, { status: 400 });
  }
  for (const pt of points) {
    if (
      typeof pt !== "object" ||
      pt === null ||
      typeof (pt as Record<string, unknown>).x !== "number" ||
      typeof (pt as Record<string, unknown>).y !== "number"
    ) {
      return NextResponse.json({ error: "Each point must have numeric x and y" }, { status: 400 });
    }
  }
  const colorRegex = /^#[0-9a-fA-F]{6}$/;
  if (typeof author_color !== "string" || !colorRegex.test(author_color)) {
    return NextResponse.json({ error: "author_color must be a valid hex color" }, { status: 400 });
  }
  const width = typeof stroke_width === "number" ? Math.min(Math.max(stroke_width, 1), 50) : 2;

  const supabase = createSupabaseClient("service");
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { data, error } = await supabase
    .from("strokes")
    .insert({
      board_code: "main",
      points,
      author_id: userId,
      author_color,
      stroke_width: width,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ stroke: data }, { status: 201 });
}
