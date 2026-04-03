import React from "react";

const feedbackStyles = {
  success: {
    icon: "✅",
    borderColor: "#22c55e",
    backgroundColor: "#f0fdf4",
    titleColor: "#166534",
  },
  progress: {
    icon: "📈",
    borderColor: "#3b82f6",
    backgroundColor: "#eff6ff",
    titleColor: "#1d4ed8",
  },
  streak: {
    icon: "🔥",
    borderColor: "#f97316",
    backgroundColor: "#fff7ed",
    titleColor: "#c2410c",
  },
  summary: {
    icon: "📅",
    borderColor: "#8b5cf6",
    backgroundColor: "#f5f3ff",
    titleColor: "#6d28d9",
  },
  reminder: {
    icon: "⏰",
    borderColor: "#eab308",
    backgroundColor: "#fefce8",
    titleColor: "#a16207",
  },
};

export default function FeedbackMessage({
  type = "progress",
  title,
  message,
  progress,
  actionLabel,
  onAction,
}) {
  const style = feedbackStyles[type] || feedbackStyles.progress;

  return (
    <div
      style={{
        border: `1px solid ${style.borderColor}`,
        backgroundColor: style.backgroundColor,
        borderRadius: "16px",
        padding: "16px",
        maxWidth: "420px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        marginBottom: "16px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span style={{ fontSize: "24px" }}>{style.icon}</span>
        <h3
          style={{
            margin: 0,
            color: style.titleColor,
            fontSize: "18px",
            fontWeight: "700",
          }}
        >
          {title}
        </h3>
      </div>

      <p style={{ marginTop: "10px", marginBottom: "8px", color: "#374151" }}>
        {message}
      </p>

      {progress && (
        <p style={{ margin: "0 0 12px 0", fontWeight: "600", color: "#111827" }}>
          {progress}
        </p>
      )}

      {actionLabel && (
        <button
          onClick={onAction}
          style={{
            padding: "10px 14px",
            borderRadius: "10px",
            border: "none",
            backgroundColor: style.borderColor,
            color: "white",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}