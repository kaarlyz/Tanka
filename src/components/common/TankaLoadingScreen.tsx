import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

const EASE = [0.16, 1, 0.3, 1] as const;
const LIME = "#c8f064";
const MUTED = "#8da868";

export interface TankaLoadingScreenProps {
  label?: string;
  sublabel?: string;
  fullScreen?: boolean;
}

const TELEMETRY_STEPS = [
  "MEMUAT MODUL & KISI-KISI TKA 2026",
  "KALIBRASI GRAF PRASYARAT MATERI",
  "MENYIAPKAN RUANG BELAJAR NARA AI"
];

export function TankaLoadingScreen({
  label = "Menyiapkan ruang belajar...",
  sublabel,
  fullScreen = true
}: TankaLoadingScreenProps) {
  const [stepIdx, setStepIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStepIdx((prev) => (prev + 1) % TELEMETRY_STEPS.length);
    }, 1800);
    return () => clearInterval(timer);
  }, []);

  const activeSublabel = sublabel || TELEMETRY_STEPS[stepIdx];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: fullScreen ? "100vh" : "100%",
        minHeight: fullScreen ? "100vh" : "380px",
        backgroundColor: "#121a17",
        color: "#eff5ec",
        position: fullScreen ? "fixed" : "relative",
        inset: fullScreen ? 0 : "auto",
        zIndex: fullScreen ? 99999 : 10,
        boxSizing: "border-box",
        padding: "24px",
        overflow: "hidden"
      }}
      role="status"
      aria-live="polite"
    >
      {/* Background Architectural Blueprint Lines (Claude Pattern) */}
      <svg
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          opacity: 0.4
        }}
        viewBox="0 0 1000 600"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <pattern id="tl-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1d2923" strokeWidth="0.8" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#tl-grid)" />
        <circle cx="500" cy="300" r="180" fill="none" stroke="#25352c" strokeWidth="1" strokeDasharray="4 6" />
        <circle cx="500" cy="300" r="260" fill="none" stroke="#1f2c25" strokeWidth="1" />
        <path d="M500 40 V560 M240 300 H760" stroke="#25352c" strokeWidth="0.8" strokeDasharray="2 4" />
      </svg>

      {/* Main Kinetic Assembly Center */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          maxWidth: 420,
          width: "100%",
          textAlign: "center"
        }}
      >
        {/* Kinetic Interactive Logo Stage */}
        <div style={{ position: "relative", width: 140, height: 110, marginBottom: 12 }}>
          <svg width="140" height="110" viewBox="0 0 140 110" fill="none" style={{ overflow: "visible" }}>
            {/* Connected Concept Nodes */}
            <motion.path
              d="M 28 72 Q 70 25 112 72"
              fill="none"
              stroke="#2c3e34"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
            <motion.path
              d="M 28 72 Q 70 25 112 72"
              fill="none"
              stroke={LIME}
              strokeWidth="2"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: [0, 1, 1], opacity: [0, 1, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: EASE }}
            />

            {/* Left Node */}
            <motion.circle
              cx="28"
              cy="72"
              r="7"
              fill="#18221f"
              stroke="#3a4f43"
              strokeWidth="2"
              initial={{ scale: 0.8 }}
              animate={{ scale: [0.8, 1.1, 0.8] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            />
            <circle cx="28" cy="72" r="3" fill={MUTED} />

            {/* Right Node */}
            <motion.circle
              cx="112"
              cy="72"
              r="7"
              fill="#18221f"
              stroke="#3a4f43"
              strokeWidth="2"
              initial={{ scale: 0.8 }}
              animate={{ scale: [0.8, 1.1, 0.8] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
            />
            <circle cx="112" cy="72" r="3" fill={LIME} />

            {/* Center Monogram Pod */}
            <g transform="translate(42, 14)">
              <motion.rect
                width="56"
                height="56"
                rx="16"
                fill="#18221f"
                stroke="#2d3d34"
                strokeWidth="1.5"
                initial={{ scale: 0.95 }}
                animate={{ scale: [0.95, 1.02, 0.95] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.circle
                cx="46"
                cy="12"
                r="4.5"
                fill={LIME}
                initial={{ opacity: 0.6, scale: 0.8 }}
                animate={{ opacity: [0.6, 1, 0.6], scale: [0.8, 1.2, 0.8] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              />
              <text
                x="28"
                y="38"
                textAnchor="middle"
                fill="#fcfdfa"
                fontFamily="'DM Mono', monospace"
                fontWeight="800"
                fontSize="28"
                letterSpacing="-0.02em"
              >
                t
              </text>
            </g>
          </svg>
        </div>

        {/* Brand Typography */}
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "4px 10px",
              borderRadius: 999,
              backgroundColor: "#18221f",
              border: "1px solid #2d3d34",
              marginBottom: 10
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                backgroundColor: LIME,
                boxShadow: `0 0 8px ${LIME}`
              }}
            />
            <span
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 11,
                fontWeight: 600,
                color: "#98a89c",
                letterSpacing: "0.06em"
              }}
            >
              TANKA ENGINE
            </span>
          </div>

          <h2
            style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800,
              fontSize: 22,
              letterSpacing: "-0.03em",
              color: "#fcfdfa",
              margin: "0 0 6px 0"
            }}
          >
            {label}
          </h2>
        </div>

        {/* Precision Progress Track (Claude 1px Border Ledger Style) */}
        <div
          style={{
            width: 220,
            height: 4,
            borderRadius: 999,
            backgroundColor: "#1a2520",
            border: "1px solid #26362e",
            overflow: "hidden",
            position: "relative",
            marginBottom: 16
          }}
        >
          <motion.div
            style={{
              width: "45%",
              height: "100%",
              borderRadius: 999,
              background: `linear-gradient(90deg, transparent, ${LIME}, transparent)`
            }}
            animate={{
              x: ["-100%", "280%"]
            }}
            transition={{
              duration: 1.7,
              repeat: Infinity,
              ease: EASE
            }}
          />
        </div>

        {/* Monospace Step Indicator with Crossfade */}
        <div style={{ height: 18, position: "relative", width: "100%", overflow: "hidden" }}>
          <AnimatePresence mode="wait">
            <motion.p
              key={activeSublabel}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.35, ease: EASE }}
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 10.5,
                color: MUTED,
                letterSpacing: "0.08em",
                margin: 0,
                textTransform: "uppercase"
              }}
            >
              {activeSublabel}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default TankaLoadingScreen;
