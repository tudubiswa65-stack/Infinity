import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase";
import { strokeLimiter } from "@/lib/redis";

export async function GET(request: NextRequest) {
  const supabase = createSupabaseClient("anon");
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "300"), 500);

  // Optional bounding-box filter (same pattern as messages)
  const minX = searchParams.get("minX");
  const maxX = searchParams.get("maxX");
  const minY = searchParams.get("minY");
  const maxY = searchParams.get("maxY");

  let query = supabase
    .from("strokes")
    .select("*")
    .eq("board_code", "main")
    .order("created_at", { ascending: false })
    .limit(limit);

  // Filter strokes whose bounding box overlaps the requested viewport.
  // Strokes without bounding-box data (min_x IS NULL) are always included
  // so legacy rows remain visible.
  if (minX !== null && maxX !== null && minY !== null && maxY !== null) {
    const qMinX = parseFloat(minX);
    const qMaxX = parseFloat(maxX);
    const qMinY = parseFloat(minY);
    const qMaxY = parseFloat(maxY);
    if (!isNaN(qMinX) && !isNaN(qMaxX) && !isNaN(qMinY) && !isNaN(qMaxY)) {
      // Include rows with no bounding box (legacy) OR rows whose box overlaps the viewport.
      // Overlap: stroke.min_x <= qMaxX AND stroke.max_x >= qMinX (same for Y).
      // Supabase does not support OR across multiple columns in a single filter call,
      // so we apply the four comparisons with lte/gte and handle the NULL fallback
      // by fetching all rows that are either unclassified or within bounds.
      query = query
        .or(
          [
            "min_x.is.null",
            `and(min_x.lte.${qMaxX},max_x.gte.${qMinX},min_y.lte.${qMaxY},max_y.gte.${qMinY})`,
          ].join(",")
        );
    }
  }

  const { data, error } = await query;

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

  // Rate limiting — keyed by userId so each user is limited independently
  let rateLimitResult = null;
  if (strokeLimiter) {
    rateLimitResult = await strokeLimiter.limit(userId);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Max 5 strokes per minute." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((rateLimitResult.reset - Date.now()) / 1000)),
            "RateLimit-Limit": "5",
            "RateLimit-Remaining": "0",
            "RateLimit-Reset": String(Math.ceil(rateLimitResult.reset / 1000)),
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
    const p = pt as { x: number; y: number };
    if (!isFinite(p.x) || !isFinite(p.y)) {
      return NextResponse.json({ error: "Point coordinates must be finite numbers" }, { status: 400 });
    }
  }
  const colorRegex = /^#[0-9a-fA-F]{6}$/;
  if (typeof author_color !== "string" || !colorRegex.test(author_color)) {
    return NextResponse.json({ error: "author_color must be a valid hex color" }, { status: 400 });
  }
  const width = typeof stroke_width === "number" ? Math.min(Math.max(stroke_width, 1), 50) : 2;

  // Compute bounding box for viewport-aware queries (single pass)
  let min_x = Infinity, max_x = -Infinity, min_y = Infinity, max_y = -Infinity;
  for (const p of points as Array<{ x: number; y: number }>) {
    if (p.x < min_x) min_x = p.x;
    if (p.x > max_x) max_x = p.x;
    if (p.y < min_y) min_y = p.y;
    if (p.y > max_y) max_y = p.y;
  }

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
      min_x,
      max_x,
      min_y,
      max_y,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Return response with rate limit headers
  const headers: Record<string, string> = {};
  if (rateLimitResult) {
    headers["RateLimit-Limit"] = "5";
    headers["RateLimit-Remaining"] = String(rateLimitResult.remaining);
    headers["RateLimit-Reset"] = String(Math.ceil(rateLimitResult.reset / 1000));
  }

  return NextResponse.json({ stroke: data }, { status: 201, headers });
}
