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
        borderRadius: 14,
        padding: "24px 20px",
        boxShadow: "0 10px 30px rgba(24, 34, 31, 0.06)",
        maxWidth: 560,
        margin: "16px auto",
        width: "100%"
      }}
    >
      {/* Header with animated orb */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            backgroundColor: "#f4f8ed",
            border: "1.5px solid #c8e6a0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            flexShrink: 0
          }}
        >
          <Sparkles size={22} color={accentColor} style={{ animation: "spinSlow 12s linear infinite" }} />
          <span
            style={{
              position: "absolute",
              top: -3,
              right: -3,
              width: 9,
              height: 9,
              borderRadius: "50%",
              backgroundColor: "#779f2f",
              boxShadow: "0 0 8px #779f2f"
            }}
          />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: "#3f6212",
                backgroundColor: "#ecfccb",
                padding: "2px 7px",
                borderRadius: 4,
                letterSpacing: "0.06em",
                fontFamily: "'DM Mono', monospace"
              }}
            >
              {badge.toUpperCase()}
            </span>
            <span style={{ fontSize: 11, color: "#78857f", fontFamily: "'DM Mono', monospace" }}>
              {progress}% SELESAI
            </span>
          </div>
          <h3 style={{ margin: 0, fontSize: 15.5, fontWeight: 800, color: "#17201d", letterSpacing: "-0.02em" }}>
            {title}
          </h3>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: "#6f7975" }}>
            {subtitle}
          </p>
        </div>
      </div>

      {/* Animated Linear Progress Bar */}
      <div style={{ marginBottom: 16 }}>
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
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
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
                padding: "8px 12px",
                borderRadius: 8,
                backgroundColor: isCurrent ? "#f6faf0" : isDone ? "#fafbf9" : "transparent",
                border: `1px solid ${isCurrent ? "#c8e6a0" : isDone ? "#e2e8df" : "#edf0eb"}`,
                transition: "all 0.25s ease",
                opacity: isDone || isCurrent ? 1 : 0.4
              }}
            >
              <div
                style={{
                  width: 20,
                  height: 20,
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
                  <Check size={11} strokeWidth={3} />
                ) : isCurrent ? (
                  <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#566b36", animation: "pulse 1s infinite" }} />
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: isCurrent ? 800 : 600, color: isCurrent ? "#1f3810" : "#2d3833", display: "flex", alignItems: "center", gap: 6 }}>
                  <span>{st.label}</span>
                  {isCurrent && (
                    <span style={{ fontSize: 9, padding: "1px 5px", backgroundColor: "#dcfce7", color: "#166534", borderRadius: 4, fontWeight: 700, letterSpacing: "0.04em" }}>
                      PROSES
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: "#6f7975", marginTop: 2, lineHeight: 1.35 }}>
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
          padding: "10px 12px",
          backgroundColor: "#f7f9f5",
          border: "1px dashed #d5ded1",
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
          gap: 9
        }}
      >
        <div style={{ fontSize: 14 }}>💡</div>
        <div style={{ flex: 1, minWidth: 0, fontSize: 11.5, color: "#4f5e57", lineHeight: 1.4 }}>
          <strong style={{ color: "#24322c" }}>Tahukah Anda? </strong>
          {tips[tipIndex]}
        </div>
      </div>
    </div>
  );
}
