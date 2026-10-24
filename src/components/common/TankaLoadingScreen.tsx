import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

const EASE = [0.16, 1, 0.3, 1] as const;
const LIME = "#c8f064";
const SAGE = "#8da868";

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
      transition={{ duration: 0.35, ease: EASE }}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: fullScreen ? "100vh" : "100%",
        minHeight: fullScreen ? "100vh" : "360px",
        backgroundColor: "rgba(18, 26, 23, 0.75)",
        backdropFilter: "blur(24px) saturate(130%)",
        WebkitBackdropFilter: "blur(24px) saturate(130%)",
        color: "#eff5ec",
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
      {/* Subtle Ambient Lime Light (Matching Landing Hero Backdrop) */}
      <div
        style={{
          position: "absolute",
          width: 440,
          height: 440,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(200, 240, 100, 0.12) 0%, rgba(18, 26, 23, 0) 70%)",
          filter: "blur(50px)",
          pointerEvents: "none"
        }}
      />

      {/* Frosted Glass Floating Card */}
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.45, ease: EASE }}
        style={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          maxWidth: 390,
          width: "100%",
          textAlign: "center",
          backgroundColor: "rgba(24, 34, 31, 0.72)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(200, 240, 100, 0.22)",
          boxShadow: "0 24px 64px -16px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.08)",
          borderRadius: 24,
          padding: "36px 36px 32px 36px",
          boxSizing: "border-box"
        }}
      >
        {/* Tactile Monogram Pod */}
        <div
          style={{
            position: "relative",
            width: 62,
            height: 62,
            borderRadius: 18,
            backgroundColor: "#18221f",
            border: "1px solid rgba(200, 240, 100, 0.3)",
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
              fontSize: 30,
              color: LIME,
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
              backgroundColor: LIME
            }}
          />
        </div>

        {/* Clean Editorial Status Badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            padding: "5px 14px",
            borderRadius: 999,
            backgroundColor: "rgba(200, 240, 100, 0.12)",
            border: "1px solid rgba(200, 240, 100, 0.3)",
            marginBottom: 14
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              backgroundColor: LIME
            }}
          />
          <span
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 11.5,
              fontWeight: 700,
              color: LIME,
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
            color: "#fcfdfa",
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
            backgroundColor: "rgba(255, 255, 255, 0.08)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
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
              backgroundColor: LIME
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

        {/* Subtitle - Pure Opacity Crossfade (Locked Height, Zero Vertical Jump) */}
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
                fontWeight: 500,
                color: SAGE,
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
