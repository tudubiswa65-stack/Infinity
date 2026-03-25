import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Infinity — Infinite Canvas",
  description: "Write, draw and collaborate on an infinite shared canvas. Every trace lasts forever.",
  keywords: ["infinite canvas", "collaborative", "drawing", "writing", "real-time"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ color: "#e5e5e5", fontFamily: "Inter, system-ui, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
