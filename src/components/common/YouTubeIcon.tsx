import React from "react";

export function YouTubeIcon({ size = 16, color = "currentColor", className = "" }: { size?: number; color?: string; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ flexShrink: 0 }}
    >
      <rect x="2" y="4" width="20" height="16" rx="5" />
      <polygon points="10 8 16 12 10 16 10 8" fill={color} stroke="none" />
    </svg>
  );
}
