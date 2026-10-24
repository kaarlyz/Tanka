import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

const EASE = [0.16, 1, 0.3, 1] as const;
const BG_LIME = "#c8f064";
const INK_DARK = "#121a17";
const INK_MUTED = "#334739";

export interface TankaLoadingScreenProps {
  label?: string;
  sublabel?: string;
  fullScreen?: boolean;
}

const WARM_STEPS = [
  "Memuat pembelajaran kamu...",
  "Menyiapkan catatan & materi...",
  "Menghubungkan ruang belajar Nara..."
];

export function TankaLoadingScreen({
  label = "Menyiapkan ruang belajar...",
  sublabel,
  fullScreen = true
}: TankaLoadingScreenProps) {
  const [stepIdx, setStepIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStepIdx((prev) => (prev + 1) % WARM_STEPS.length);
    }, 2200);
    return () => clearInterval(timer);
  }, []);

  const activeSublabel = sublabel || WARM_STEPS[stepIdx];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.3, ease: EASE }}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: fullScreen ? "100vh" : "100%",
        minHeight: fullScreen ? "100vh" : "360px",
        backgroundColor: BG_LIME,
        color: INK_DARK,
        position: fullScreen ? "fixed" : "relative",
        top: fullScreen ? 0 : "auto",
        left: fullScreen ? 0 : "auto",
        right: fullScreen ? 0 : "auto",
        bottom: fullScreen ? 0 : "auto",
        zIndex: fullScreen ? 99999 : 10,
        boxSizing: "border-box",
        padding: "24px",
        overflow: "hidden",
        touchAction: "none",
        overscrollBehavior: "none",
        userSelect: "none",
        WebkitUserSelect: "none"
      }}
      role="status"
      aria-live="polite"
    >
      {/* Frosted Glass Floating Card on Bright Green Lime Background */}
      <motion.div
        initial={{ scale: 0.97, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.35, ease: EASE }}
        style={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          maxWidth: 390,
          width: "100%",
          textAlign: "center",
          backgroundColor: "rgba(255, 255, 255, 0.45)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1.5px solid rgba(255, 255, 255, 0.65)",
          boxShadow: "0 16px 48px -10px rgba(18, 26, 23, 0.14)",
          borderRadius: 24,
          padding: "36px 36px 32px 36px",
          boxSizing: "border-box"
        }}
      >
        {/* Tactile Dark Monogram Pod */}
        <div
          style={{
            position: "relative",
            width: 62,
            height: 62,
            borderRadius: 18,
            backgroundColor: INK_DARK,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 20
          }}
        >
          <span
            style={{
              fontFamily: "'DM Mono', monospace",
              fontWeight: 800,
              fontSize: 31,
              color: BG_LIME,
              lineHeight: 1
            }}
          >
            t
          </span>
          <div
            style={{
              position: "absolute",
              bottom: 6,
              right: 6,
              width: 7,
              height: 7,
              borderRadius: "50%",
              backgroundColor: BG_LIME
            }}
          />
        </div>

        {/* Clean Editorial Status Badge (Zero Glow) */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            padding: "5px 14px",
            borderRadius: 999,
            backgroundColor: "rgba(18, 26, 23, 0.08)",
            border: "1.5px solid rgba(18, 26, 23, 0.18)",
            marginBottom: 14
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              backgroundColor: INK_DARK
            }}
          />
          <span
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 11.5,
              fontWeight: 700,
              color: INK_DARK,
              letterSpacing: "0.03em",
              textTransform: "uppercase"
            }}
          >
            Mempersiapkan
          </span>
        </div>

        {/* Clean Headline */}
        <h2
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800,
            fontSize: 22,
            letterSpacing: "-0.03em",
            color: INK_DARK,
            margin: "0 0 16px 0"
          }}
        >
          {label}
        </h2>

        {/* Precision Progress Track */}
        <div
          style={{
            width: 200,
            height: 4,
            borderRadius: 999,
            backgroundColor: "rgba(18, 26, 23, 0.14)",
            overflow: "hidden",
            position: "relative",
            marginBottom: 16
          }}
        >
          <motion.div
            style={{
              width: "40%",
              height: "100%",
              borderRadius: 999,
              backgroundColor: INK_DARK
            }}
            animate={{
              x: ["-100%", "260%"]
            }}
            transition={{
              duration: 1.6,
              repeat: Infinity,
              ease: EASE
            }}
          />
        </div>

        {/* Subtitle - Pure Opacity Crossfade (Locked Height, Zero Vertical Shift) */}
        <div style={{ height: 20, lineHeight: "20px", position: "relative", width: "100%", overflow: "hidden" }}>
          <AnimatePresence mode="wait">
            <motion.p
              key={activeSublabel}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.28 }}
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 12.5,
                fontWeight: 600,
                color: INK_MUTED,
                margin: 0
              }}
            >
              {activeSublabel}
            </motion.p>
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default TankaLoadingScreen;
