import React from "react";

export interface TankaLoadingScreenProps {
  label?: string;
  sublabel?: string;
  fullScreen?: boolean;
}

export function TankaLoadingScreen({
  label = "Menyiapkan ruang belajar...",
  sublabel = "Memuat modul materi & tutor Nara",
  fullScreen = true
}: TankaLoadingScreenProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: fullScreen ? "100vh" : "100%",
        minHeight: fullScreen ? "100vh" : "360px",
        backgroundColor: "#121a17",
        color: "#eff5ec",
        position: fullScreen ? "fixed" : "relative",
        inset: fullScreen ? 0 : "auto",
        zIndex: fullScreen ? 99999 : 10,
        boxSizing: "border-box",
        padding: "24px"
      }}
      role="status"
      aria-live="polite"
    >
      <style>{`
        @keyframes tankaLogoPulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(200, 240, 100, 0.4); }
          50% { transform: scale(1.04); box-shadow: 0 0 0 12px rgba(200, 240, 100, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(200, 240, 100, 0); }
        }
        @keyframes tankaBarScan {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(30%); }
          100% { transform: translateX(100%); }
        }
        @keyframes tankaShimmer {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }
      `}</style>

      {/* Brand Icon with Breathing Ring */}
      <div
        style={{
          width: 54,
          height: 54,
          borderRadius: 14,
          backgroundColor: "#18221f",
          border: "2px solid #2d3d34",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 20,
          position: "relative",
          animation: "tankaLogoPulse 2.4s ease-in-out infinite"
        }}
      >
        <span
          style={{
            fontFamily: "'DM Mono', monospace",
            fontWeight: 800,
            fontSize: 28,
            color: "#c8f064",
            lineHeight: 1
          }}
        >
          t
        </span>
        <div
          style={{
            position: "absolute",
            bottom: 5,
            right: 5,
            width: 7,
            height: 7,
            borderRadius: "50%",
            backgroundColor: "#c8f064"
          }}
        />
      </div>

      {/* Title & Brand */}
      <div style={{ textAlign: "center", marginBottom: 22 }}>
        <h2
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800,
            fontSize: 20,
            letterSpacing: "-0.03em",
            color: "#fcfdfa",
            margin: "0 0 6px 0"
          }}
        >
          tanka<span style={{ color: "#c8f064" }}>.</span>
        </h2>
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 13,
            color: "#8da868",
            margin: 0
          }}
        >
          {label}
        </p>
      </div>

      {/* Kinetic Progress Bar */}
      <div
        style={{
          width: 180,
          height: 3,
          borderRadius: 999,
          backgroundColor: "#22302b",
          overflow: "hidden",
          position: "relative",
          marginBottom: 16
        }}
      >
        <div
          style={{
            width: "50%",
            height: "100%",
            borderRadius: 999,
            backgroundImage: "linear-gradient(90deg, transparent, #c8f064, transparent)",
            animation: "tankaBarScan 1.6s cubic-bezier(0.16, 1, 0.3, 1) infinite"
          }}
        />
      </div>

      {/* Monospace Micro-telemetry */}
      <span
        style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 10.5,
          color: "#566b60",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          animation: "tankaShimmer 2s ease-in-out infinite"
        }}
      >
        {sublabel}
      </span>
    </div>
  );
}

export default TankaLoadingScreen;
