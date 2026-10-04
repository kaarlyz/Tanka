import { Bell, Sparkles, Coffee } from "lucide-react";

interface AudioAlarmModalProps {
  isOpen: boolean;
  timerMode: "work" | "break";
  onStartBreak: () => void;
  onStartFocus: () => void;
  onClose: () => void;
}

export function AudioAlarmModal({
  isOpen,
  timerMode,
  onStartBreak,
  onStartFocus,
  onClose
}: AudioAlarmModalProps) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(6px)",
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20
      }}
    >
      <div
        className="modal-scale-in"
        style={{
          backgroundColor: "#ffffff",
          borderRadius: 20,
          padding: "32px 28px",
          maxWidth: 420,
          width: "100%",
          textAlign: "center",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          border: "2px solid #566b36"
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            backgroundColor: "#f0fdf4",
            border: "2px solid #86efac",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
            animation: "pulseGlow 2s infinite"
          }}
        >
          <Bell size={32} color="#16a34a" />
        </div>

        <h2 style={{ fontSize: 21, fontWeight: 800, color: "#17201d", margin: "0 0 6px" }}>
          {timerMode === "work" ? "🎉 Sesi Fokus Tuntas!" : "⚡ Waktu Istirahat Selesai!"}
        </h2>

        <p style={{ fontSize: 13.5, color: "#4b5563", margin: "0 0 24px", lineHeight: 1.5 }}>
          {timerMode === "work"
            ? "Luar biasa! Otak Anda telah bekerja maksimal. Ambil jeda 10 menit untuk mengendapkan memori sebelum lanjut."
            : "Pikiran Anda sudah segar kembali! Siap melangkah ke materi atau latihan soal berikutnya?"}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {timerMode === "work" ? (
            <>
              <button
                type="button"
                onClick={onStartBreak}
                style={{
                  width: "100%",
                  padding: "13px 18px",
                  borderRadius: 12,
                  backgroundColor: "#566b36",
                  color: "#ffffff",
                  border: "none",
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  boxShadow: "0 4px 14px rgba(86, 107, 54, 0.25)"
                }}
              >
                <Coffee size={17} />
                <span>Mulai Istirahat (10 Menit)</span>
              </button>

              <button
                type="button"
                onClick={onStartFocus}
                style={{
                  width: "100%",
                  padding: "11px 18px",
                  borderRadius: 12,
                  backgroundColor: "#f4f6f2",
                  color: "#374151",
                  border: "1px solid #dce2da",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                Lanjut Sesi Fokus Baru
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onStartFocus}
              style={{
                width: "100%",
                padding: "13px 18px",
                borderRadius: 12,
                backgroundColor: "#18221f",
                color: "#c8f064",
                border: "none",
                fontSize: 14,
                fontWeight: 800,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8
              }}
            >
              <Sparkles size={17} />
              <span>Mulai Sesi Fokus Sekarang</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#9ca3af",
              fontSize: 12.5,
              fontWeight: 600,
              cursor: "pointer",
              marginTop: 4
            }}
          >
            Tutup Alarm
          </button>
        </div>
      </div>
    </div>
  );
}
