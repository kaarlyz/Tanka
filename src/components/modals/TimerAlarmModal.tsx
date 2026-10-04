import { BellRing } from "lucide-react";

export interface TimerAlarmModalProps {
  isAlarmActive: boolean;
  setIsAlarmActive: (val: boolean) => void;
  timerMode: "focus" | "break";
  setTimerMode: (mode: "focus" | "break") => void;
  timerDurationMinutes: number;
  setTimerSeconds: (sec: number) => void;
  setIsTimerRunning: (val: boolean) => void;
  showNotice: (msg: string) => void;
}

export function TimerAlarmModal({
  isAlarmActive,
  setIsAlarmActive,
  timerMode,
  setTimerMode,
  timerDurationMinutes,
  setTimerSeconds,
  setIsTimerRunning,
  showNotice
}: TimerAlarmModalProps) {
  if (!isAlarmActive) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(24, 33, 30, 0.65)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
        padding: 20
      }}
    >
      <div
        className="modal-scale-in"
        style={{
          backgroundColor: "#ffffff",
          borderRadius: 16,
          maxWidth: 420,
          width: "100%",
          padding: "28px 24px",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.25)",
          textAlign: "center",
          border: "2px solid #c8e6a0"
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            backgroundColor: "#f4f8ed",
            border: "2px solid #a3e635",
            margin: "0 auto 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: "pulseGlow 1.5s infinite"
          }}
        >
          <BellRing size={32} color="#4b6623" />
        </div>

        <span
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: "#166534",
            backgroundColor: "#dcfce7",
            padding: "3px 9px",
            borderRadius: 999,
            letterSpacing: "0.06em"
          }}
        >
          WAKTU {timerMode === "focus" ? "BELAJAR" : "ISTIRAHAT"} TUNTAS
        </span>

        <h2 style={{ fontSize: 20, fontWeight: 800, color: "#18211e", margin: "10px 0 6px" }}>
          {timerMode === "focus" ? "Sesi Fokus Selesai!" : "Waktu Istirahat Selesai!"}
        </h2>

        <p style={{ fontSize: 13, color: "#52625b", lineHeight: 1.5, margin: "0 0 20px" }}>
          {timerMode === "focus"
            ? `Hebat! Anda telah menyelesaikan fokus ${timerDurationMinutes} menit. Saatnya meregangkan badan dan istirahat 10 menit agar otak tetap segar.`
            : "Pikiran Anda sudah segar kembali. Siap untuk melanjutkan sesi fokus berikutnya?"}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {timerMode === "focus" ? (
            <>
              <button
                onClick={() => {
                  setIsAlarmActive(false);
                  setTimerMode("break");
                  setTimerSeconds(600); // 10 mins break
                  setIsTimerRunning(true);
                  showNotice("Sesi istirahat 10 menit dimulai");
                }}
                style={{
                  backgroundColor: "#c8f064",
                  color: "#18211e",
                  border: "none",
                  borderRadius: 10,
                  padding: "12px",
                  fontSize: 13.5,
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6
                }}
              >
                <span>☕ Mulai Istirahat (10 Menit)</span>
              </button>
              <button
                onClick={() => {
                  setIsAlarmActive(false);
                  setTimerMode("focus");
                  setTimerSeconds(timerDurationMinutes * 60);
                  setIsTimerRunning(true);
                  showNotice(`Sesi fokus baru ${timerDurationMinutes} menit dimulai`);
                }}
                style={{
                  backgroundColor: "#f4f8ed",
                  color: "#4b6623",
                  border: "1px solid #c8e6a0",
                  borderRadius: 10,
                  padding: "10px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                <span>⚡ Lanjut Fokus {timerDurationMinutes} Menit Lagi</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                setIsAlarmActive(false);
                setTimerMode("focus");
                setTimerSeconds(timerDurationMinutes * 60);
                setIsTimerRunning(true);
                showNotice(`Sesi fokus ${timerDurationMinutes} menit dimulai`);
              }}
              style={{
                backgroundColor: "#c8f064",
                color: "#18211e",
                border: "none",
                borderRadius: 10,
                padding: "12px",
                fontSize: 13.5,
                fontWeight: 800,
                cursor: "pointer"
              }}
            >
              <span>Mulai Sesi Fokus ({timerDurationMinutes}m)</span>
            </button>
          )}

          <button
            onClick={() => setIsAlarmActive(false)}
            style={{
              backgroundColor: "transparent",
              color: "#6b7280",
              border: "none",
              padding: "8px",
              fontSize: 12.5,
              cursor: "pointer"
            }}
          >
            Tutup Alarm
          </button>
        </div>
      </div>
    </div>
  );
}
