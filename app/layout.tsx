import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "InfiniteBoard — Infinite Canvas",
  description: "A shared infinite canvas. Write and draw anywhere, forever.",
  keywords: ["infinite canvas", "collaborative", "drawing", "notes"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body style={{ background: "#0f0f0f", color: "#e5e5e5", fontFamily: "Inter, system-ui, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
