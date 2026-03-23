import { Suspense } from "react";
import CanvasPageClient from "./CanvasPageClient";

export default function CanvasPage() {
  return (
    <Suspense fallback={
      <div style={{ width: "100vw", height: "100vh", background: "#0f0f0f", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#888" }}>Loading canvas...</p>
      </div>
    }>
      <CanvasPageClient />
    </Suspense>
  );
}
