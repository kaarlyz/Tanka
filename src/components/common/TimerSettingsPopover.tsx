import React from "react";
import { Sliders, Bell } from "lucide-react";
import { playTimerAlarmSound } from "../../utils/sound";

interface TimerSettingsPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  workMinutes: number;
  onSetWorkMinutes: (minutes: number) => void;
  timerMode: "work" | "break";
}

export function TimerSettingsPopover({
  isOpen,
  onClose,
  workMinutes,
  onSetWorkMinutes,
  timerMode
}: TimerSettingsPopoverProps) {
  if (!isOpen) return null;

  const presets = [
    { m: 5, label: "5 Menit (Kilat)" },
    { m: 10, label: "10 Menit (Fokus 10/10)" },
    { m: 15, label: "15 Menit (Sedang)" },
    { m: 25, label: "25 Menit (Pomodoro)" },
    { m: 45, label: "45 Menit (Simulasi)" },
    { m: 60, label: "60 Menit (1 Jam)" }
  ];

  return (
    <>
      <div
        style={{ position: "fixed", inset: 0, zIndex: 9998 }}
        onClick={onClose}
      />
      <div
        className="modal-scale-in"
        style={{
          position: "absolute",
          top: 48,
          right: 0,
          width: 270,
          backgroundColor: "#ffffff",
          borderRadius: 14,
          border: "1px solid #dce2da",
          boxShadow: "0 14px 35px rgba(24, 34, 31, 0.12)",
          padding: "16px",
          zIndex: 9999
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Sliders size={14} color="#566b36" />
            <strong style={{ fontSize: 12.5, color: "#18211e" }}>Durasi Fokus</strong>
          </div>
          <span style={{ fontSize: 10, backgroundColor: "#f0fdf4", color: "#166534", padding: "1px 6px", borderRadius: 4, fontWeight: 700 }}>
            {timerMode === "work" ? "Aktif" : "Istirahat"}
          </span>
        </div>

        {/* Quick Presets */}
        <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 14 }}>
          {presets.map((p) => {
            const isSelected = workMinutes === p.m;
            return (
              <button
                key={p.m}
                type="button"
                onClick={() => {
                  onSetWorkMinutes(p.m);
                  onClose();
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "6px 10px",
                  borderRadius: 7,
                  border: `1px solid ${isSelected ? "#566b36" : "#e5e7eb"}`,
                  backgroundColor: isSelected ? "#f0fdf4" : "#ffffff",
                  color: isSelected ? "#166534" : "#374151",
                  fontSize: 12,
                  fontWeight: isSelected ? 800 : 500,
                  cursor: "pointer",
                  textAlign: "left"
                }}
              >
                <span>{p.label}</span>
                {isSelected && <span style={{ fontSize: 11 }}>✓</span>}
              </button>
            );
          })}
        </div>

        {/* Custom Input */}
        <div style={{ borderTop: "1px solid #edf0eb", paddingTop: 12, marginBottom: 12 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#6b7280", marginBottom: 6 }}>
            Atur Menit Bebas:
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button
              type="button"
              onClick={() => onSetWorkMinutes(Math.max(1, workMinutes - 1))}
              style={{
                width: 32,
                height: 32,
                borderRadius: 7,
                border: "1px solid #dce2da",
                backgroundColor: "#f9fafb",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              -
            </button>
            <input
              type="number"
              min={1}
              max={180}
              value={workMinutes}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (Number.isFinite(val) && val > 0) onSetWorkMinutes(val);
              }}
              style={{
                flex: 1,
                height: 32,
                textAlign: "center",
                border: "1px solid #dce2da",
                borderRadius: 7,
                fontSize: 13,
                fontWeight: 800,
                color: "#18211e"
              }}
            />
            <button
              type="button"
              onClick={() => onSetWorkMinutes(Math.min(180, workMinutes + 1))}
              style={{
                width: 32,
                height: 32,
                borderRadius: 7,
                border: "1px solid #dce2da",
                backgroundColor: "#f9fafb",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              +
            </button>
          </div>
        </div>

        {/* Test Alarm Sound Button */}
        <button
          type="button"
          onClick={() => playTimerAlarmSound()}
          style={{
            width: "100%",
            padding: "7px 10px",
            borderRadius: 7,
            border: "1px dashed #c8e6a0",
            backgroundColor: "#f7faf2",
            color: "#4b6623",
            fontSize: 11.5,
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6
          }}
        >
          <Bell size={13} />
          <span>Uji Suara Alarm 🔔</span>
        </button>
      </div>
    </>
  );
}
