"use client";

import { memo, useEffect, useRef, useState } from "react";
import { Toast, ToastSeverity } from "@/types";

interface ToastProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

const SEVERITY_COLORS: Record<ToastSeverity, { bg: string; border: string; icon: string }> = {
  success: { bg: "rgba(74, 222, 128, 0.15)", border: "#4ade80", icon: "✓" },
  error: { bg: "rgba(248, 113, 113, 0.15)", border: "#f87171", icon: "✕" },
  warning: { bg: "rgba(251, 191, 36, 0.15)", border: "#fbbf24", icon: "⚠" },
  info: { bg: "rgba(99, 102, 241, 0.15)", border: "#6366f1", icon: "ℹ" },
};

function ToastItem({ toast, onRemove }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const duration = toast.duration ?? 4000;

  useEffect(() => {
    // Animate in
    requestAnimationFrame(() => setIsVisible(true));

    // Auto-dismiss after duration
    if (duration > 0) {
      timerRef.current = setTimeout(() => {
        setIsLeaving(true);
        setTimeout(() => onRemove(toast.id), 300);
      }, duration);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [toast.id, toast.duration, onRemove]);

  const severity = SEVERITY_COLORS[toast.severity];

  const handleClick = () => {
    setIsLeaving(true);
    setTimeout(() => onRemove(toast.id), 300);
  };

  return (
    <div
      onClick={handleClick}
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        background: severity.bg,
        border: `1px solid ${severity.border}44`,
        borderRadius: "10px",
        padding: "12px 16px",
        marginBottom: "10px",
        backdropFilter: "blur(12px)",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
        cursor: "pointer",
        opacity: isVisible && !isLeaving ? 1 : 0,
        transform: isVisible && !isLeaving ? "translateY(0)" : "translateY(20px)",
        transition: "opacity 0.3s ease, transform 0.3s ease",
        maxWidth: "400px",
        minWidth: "280px",
      }}
    >
      {/* Icon */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "24px",
          height: "24px",
          borderRadius: "50%",
          background: severity.border,
          color: "#000",
          fontSize: "14px",
          fontWeight: "bold",
          flexShrink: 0,
        }}
      >
        {severity.icon}
      </div>

      {/* Message */}
      <span
        style={{
          flex: 1,
          color: "#e5e5e5",
          fontSize: "0.9rem",
          lineHeight: 1.4,
          wordBreak: "break-word",
        }}
      >
        {toast.message}
      </span>

      {/* Progress bar for auto-dismiss */}
      {duration > 0 && !isLeaving && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            height: "3px",
            background: severity.border,
            borderRadius: "0 0 10px 10px",
            animation: `toast-progress ${duration}ms linear forwards`,
          }}
        />
      )}

      <style jsx>{`
        @keyframes toast-progress {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
}

export default memo(ToastItem);
