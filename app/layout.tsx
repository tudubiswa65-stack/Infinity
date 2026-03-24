import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "∴",
  description: "They are waiting.",
  keywords: ["void", "threshold", "trace", "null"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body style={{ color: "#e5e5e5", fontFamily: "Inter, system-ui, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
