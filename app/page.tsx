"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import StarField from "@/components/hero/StarField";
import InfinitySymbol from "@/components/hero/InfinitySymbol";
import FogLayer from "@/components/hero/FogLayer";
import CoordinateInput from "@/components/hero/CoordinateInput";

export default function Dashboard() {
  const router = useRouter();

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      document.documentElement.style.setProperty("--mouse-x", `${x}%`);
      document.documentElement.style.setProperty("--mouse-y", `${y}%`);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <main className="hero-container" style={{ background: "#0f0f0f" }}>
      <StarField />
      <FogLayer />

      <div className="hero-content">
        <div
          className="fade-in"
          style={{ animationDelay: "0.2s", opacity: 0, marginBottom: "2rem" }}
        >
          <InfinitySymbol />
        </div>

        <h1
          className="hero-title fade-in"
          style={{ animationDelay: "0.4s", opacity: 0 }}
        >
          InfiniteBoard
        </h1>

        <p
          className="hero-subtitle fade-in"
          style={{ animationDelay: "0.6s", opacity: 0 }}
        >
          A shared infinite canvas where thoughts become constellations.
          <br />
          Write. Draw. Explore. Forever.
        </p>

        <button
          onClick={() => router.push("/canvas")}
          className="enter-button fade-in"
          style={{ animationDelay: "0.8s", opacity: 0 }}
        >
          Enter the Infinite
        </button>

        <CoordinateInput />
      </div>

      <div className="hero-footer fade-in" style={{ animationDelay: "1.4s", opacity: 0 }}>
        No account needed. Your identity is generated automatically.
      </div>
    </main>
  );
}
