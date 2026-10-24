import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

const EASE = [0.16, 1, 0.3, 1] as const;
const BG_LIME = "#c8f064";
const INK_DARK = "#121a17";
const INK_MUTED = "#36473b";

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
    <div
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
      {/* Main Center Focus Block */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          maxWidth: 380,
          width: "100%",
          textAlign: "center"
        }}
      >
        {/* Crisp Monogram Pod */}
        <motion.div
          style={{
            position: "relative",
            width: 64,
            height: 64,
            borderRadius: 18,
            backgroundColor: INK_DARK,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 20
          }}
          animate={{
            scale: [1, 1.03, 1]
          }}
          transition={{
            duration: 2.4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <span
            style={{
              fontFamily: "'DM Mono', monospace",
              fontWeight: 800,
              fontSize: 32,
              color: BG_LIME,
              lineHeight: 1
            }}
          >
            t
          </span>
          {/* Solid Lime Dot on Corner */}
          <div
            style={{
              position: "absolute",
              bottom: 6,
              right: 6,
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: BG_LIME
            }}
          />
        </motion.div>

        {/* Clean Editorial Status Badge (Zero Glow, Crisp Border) */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "5px 14px",
            borderRadius: 999,
            backgroundColor: "rgba(18, 26, 23, 0.08)",
            border: "1.5px solid rgba(18, 26, 23, 0.2)",
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

        {/* Main Clean Headline */}
        <h2
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800,
            fontSize: 23,
            letterSpacing: "-0.03em",
            color: INK_DARK,
            margin: "0 0 16px 0"
          }}
        >
          {label}
        </h2>

        {/* Crisp Progress Track */}
        <div
          style={{
            width: 200,
            height: 4,
            borderRadius: 999,
            backgroundColor: "rgba(18, 26, 23, 0.15)",
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

        {/* Friendly Subtitle - Pure Opacity Fade (Zero Vertical Shift) */}
        <div style={{ height: 20, lineHeight: "20px", position: "relative", width: "100%", overflow: "hidden" }}>
          <AnimatePresence mode="wait">
            <motion.p
              key={activeSublabel}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 13,
                fontWeight: 500,
                color: INK_MUTED,
                margin: 0
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
