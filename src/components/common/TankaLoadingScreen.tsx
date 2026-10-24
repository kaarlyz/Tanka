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
        padding: "24px",
        overflow: "hidden"
      }}
      role="status"
      aria-live="polite"
    >
      {/* Warm Ambient Lime Aura (Calm Study Vibe, Anti-Rigid Tech) */}
      <div
        style={{
          position: "absolute",
          width: 380,
          height: 380,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(200, 240, 100, 0.08) 0%, rgba(18, 26, 23, 0) 70%)",
          filter: "blur(40px)",
          pointerEvents: "none"
        }}
      />

      {/* Main Focus Capsule */}
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
        {/* Breathing Logo Capsule with Glowing Aura */}
        <motion.div
          style={{
            position: "relative",
            width: 64,
            height: 64,
            borderRadius: 18,
            backgroundColor: "#18221f",
            border: "1.5px solid #2d3d34",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 20,
            boxShadow: "0 12px 32px -8px rgba(0, 0, 0, 0.4)"
          }}
          animate={{
            scale: [1, 1.03, 1],
            boxShadow: [
              "0 0 0 0 rgba(200, 240, 100, 0.25), 0 12px 32px -8px rgba(0,0,0,0.4)",
              "0 0 0 14px rgba(200, 240, 100, 0), 0 16px 36px -6px rgba(0,0,0,0.5)",
              "0 0 0 0 rgba(200, 240, 100, 0), 0 12px 32px -8px rgba(0,0,0,0.4)"
            ]
          }}
          transition={{
            duration: 2.8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <span
            style={{
              fontFamily: "'DM Mono', monospace",
              fontWeight: 800,
              fontSize: 30,
              color: "#fcfdfa",
              lineHeight: 1
            }}
          >
            t
          </span>
          {/* Active Lime Glow Dot */}
          <motion.div
            style={{
              position: "absolute",
              bottom: 6,
              right: 6,
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: LIME,
              boxShadow: `0 0 10px ${LIME}`
            }}
            animate={{
              opacity: [0.6, 1, 0.6],
              scale: [0.9, 1.25, 0.9]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </motion.div>

        {/* Soft Glowing Status Badge (Scanning Effect) */}
        <motion.div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "5px 14px",
            borderRadius: 999,
            backgroundColor: "#192420",
            border: "1px solid #2e3e35",
            marginBottom: 14,
            position: "relative",
            overflow: "hidden"
          }}
        >
          {/* Soft Lime Glow Scanner Bar */}
          <motion.div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              width: "40%",
              background: `linear-gradient(90deg, transparent, rgba(200, 240, 100, 0.25), transparent)`,
              pointerEvents: "none"
            }}
            animate={{
              x: ["-100%", "260%"]
            }}
            transition={{
              duration: 2.4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
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
              fontFamily: "'Inter', sans-serif",
              fontSize: 11.5,
              fontWeight: 600,
              color: LIME,
              letterSpacing: "0.02em"
            }}
          >
            Mempersiapkan
          </span>
        </motion.div>

        {/* Main Clean Headline */}
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

        {/* Smooth Organic Loading Track */}
        <div
          style={{
            width: 200,
            height: 4,
            borderRadius: 999,
            backgroundColor: "#1b2722",
            border: "1px solid #2a3a31",
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
              background: `linear-gradient(90deg, transparent, ${LIME}, transparent)`
            }}
            animate={{
              x: ["-100%", "260%"]
            }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
              ease: EASE
            }}
          />
        </div>

        {/* Friendly Natural Subtitle with Crossfade */}
        <div style={{ height: 20, position: "relative", width: "100%", overflow: "hidden" }}>
          <AnimatePresence mode="wait">
            <motion.p
              key={activeSublabel}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.35, ease: EASE }}
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 12.5,
                color: SAGE,
                margin: 0,
                letterSpacing: "0.01em"
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
