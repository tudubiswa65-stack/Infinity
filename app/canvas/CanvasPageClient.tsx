"use client";

import { useSearchParams } from "next/navigation";
import InfiniteCanvas from "@/components/InfiniteCanvas";

export default function CanvasPageClient() {
  const searchParams = useSearchParams();
  const x = parseFloat(searchParams.get("x") ?? "0");
  const y = parseFloat(searchParams.get("y") ?? "0");

  return <InfiniteCanvas initialX={isNaN(x) ? 0 : x} initialY={isNaN(y) ? 0 : y} />;
}
