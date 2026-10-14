import { useState, useEffect } from "react";
import { Sparkles, Check } from "lucide-react";

export interface AIProcessStep {
  label: string;
  detail: string;
}

export interface AIProcessLoaderProps {
  title: string;
  subtitle: string;
  badge?: string;
  steps: AIProcessStep[];
  tips?: string[];
  accentColor?: string;
}

export function AIProcessLoader({
  title,
  subtitle,
  badge = "Tanka AI Engine",
  steps,
  tips = [
    "Teknik active recall menguatkan koneksi sinapsis otak hingga 2x lipat dibanding sekadar membaca ulang.",
    "Jeda 10 menit setelah 10 menit fokus menjaga konsentrasi tetap tajam tanpa rasa jenuh atau lelah.",
    "Menjelaskan materi dengan bahasa sendiri (Metode Feynman) adalah cara tercepat menguji pemahaman sejati.",
    "Miskonsepsi yang langsung diperbaiki saat latihan soal menghasilkan retensi memori jangka panjang."
  ],
  accentColor = "#4b6623"
}: AIProcessLoaderProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(18);
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 2400);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 94) return 94;
        const diff = 95 - prev;
        return prev + Math.max(1, Math.floor(diff / 5));
      });
    }, 400);

    const tipInterval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % tips.length);
    }, 3800);

    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
      clearInterval(tipInterval);
    };
  }, [steps.length, tips.length]);

  return (
    <div
      className="ai-process-container modal-scale-in"
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid #dce2da",
        borderRadius: 16,
        padding: "28px 24px 20px 24px",
        boxShadow: "0 14px 40px rgba(24, 34, 31, 0.07)",
        maxWidth: 580,
        margin: "18px auto",
        width: "100%",
        boxSizing: "border-box"
      }}
    >
      {/* Symmetrical & Centered AI Header */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginBottom: 20 }}>
        {/* Animated Glowing AI Orb */}
        <div
          style={{
            width: 54,
            height: 54,
            borderRadius: "50%",
            backgroundColor: "#f4f8ed",
            border: "2px solid #c8e6a0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            marginBottom: 12,
            boxShadow: "0 0 24px rgba(119, 159, 47, 0.22)"
          }}
        >
          <Sparkles size={26} color={accentColor} style={{ animation: "spinSlow 12s linear infinite" }} />
          <span
            style={{
              position: "absolute",
              top: 1,
              right: 1,
              width: 9,
              height: 9,
              borderRadius: "50%",
              backgroundColor: "#779f2f",
              boxShadow: "0 0 8px #779f2f",
              animation: "pulse 2s infinite"
            }}
          />
        </div>

        {/* Badge & Progress Chips */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap", justifyContent: "center" }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              color: "#3f6212",
              backgroundColor: "#ecfccb",
              padding: "3px 9px",
              borderRadius: 6,
              letterSpacing: "0.06em",
              fontFamily: "'DM Mono', monospace"
            }}
          >
            {badge.toUpperCase()}
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#475950",
              backgroundColor: "#f3f5ee",
              border: "1px solid #dce2d7",
              padding: "2px 8px",
              borderRadius: 6,
              fontFamily: "'DM Mono', monospace"
            }}
          >
            {progress}% SELESAI
          </span>
        </div>

        <h3 style={{ margin: "2px 0 0", fontSize: 17.5, fontWeight: 800, color: "#17201d", letterSpacing: "-0.02em", lineHeight: 1.3 }}>
          {title}
        </h3>
        <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "#6f7975", maxWidth: 440, lineHeight: 1.5 }}>
          {subtitle}
        </p>
      </div>

      {/* Animated Linear Progress Bar */}
      <div style={{ marginBottom: 18 }}>
        <div
          style={{
            width: "100%",
            height: 6,
            backgroundColor: "#eef2eb",
            borderRadius: 999,
            overflow: "hidden",
            position: "relative"
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: "100%",
              backgroundColor: "#566b36",
              borderRadius: 999,
              transition: "width 0.35s ease",
              position: "relative",
              overflow: "hidden"
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(90deg, transparent, rgba(200, 240, 100, 0.75), transparent)",
                animation: "shimmerSweep 1.6s infinite"
              }}
            />
          </div>
        </div>
      </div>

      {/* Steps Timeline */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
        {steps.map((st, idx) => {
          const isDone = idx < currentStep;
          const isCurrent = idx === currentStep;

          return (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                padding: "9px 13px",
                borderRadius: 10,
                backgroundColor: isCurrent ? "#f6faf0" : isDone ? "#fafbf9" : "transparent",
                border: `1px solid ${isCurrent ? "#c8e6a0" : isDone ? "#e2e8df" : "#edf0eb"}`,
                transition: "all 0.25s ease",
                opacity: isDone || isCurrent ? 1 : 0.4
              }}
            >
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: isDone ? "#566b36" : isCurrent ? "#ffffff" : "#e5eae2",
                  border: `2px solid ${isDone ? "#566b36" : isCurrent ? "#566b36" : "#cbd5cb"}`,
                  color: isDone ? "#ffffff" : "#566b36",
                  fontSize: 10.5,
                  fontWeight: 800,
                  flexShrink: 0,
                  marginTop: 1
                }}
              >
                {isDone ? (
                  <Check size={12} strokeWidth={3} />
                ) : isCurrent ? (
                  <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#566b36", animation: "pulse 1s infinite" }} />
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: isCurrent ? 800 : 600, color: isCurrent ? "#1f3810" : "#2d3833", display: "flex", alignItems: "center", gap: 6 }}>
                  <span>{st.label}</span>
                  {isCurrent && (
                    <span style={{ fontSize: 9, padding: "1px 6px", backgroundColor: "#dcfce7", color: "#166534", borderRadius: 4, fontWeight: 700, letterSpacing: "0.04em" }}>
                      PROSES
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 11.5, color: "#6f7975", marginTop: 2, lineHeight: 1.4 }}>
                  {st.detail}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Rotating Study Tip Banner */}
      <div
        style={{
          padding: "10px 14px",
          backgroundColor: "#f7f9f5",
          border: "1px dashed #d5ded1",
          borderRadius: 10,
          display: "flex",
          alignItems: "center",
          gap: 10
        }}
      >
        <div style={{ fontSize: 14 }}>💡</div>
        <div style={{ flex: 1, minWidth: 0, fontSize: 11.5, color: "#4f5e57", lineHeight: 1.45 }}>
          <strong style={{ color: "#24322c" }}>Tahukah Anda? </strong>
          {tips[tipIndex]}
        </div>
      </div>
    </div>
  );
}
