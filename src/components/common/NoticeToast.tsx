interface NoticeToastProps {
  message: string | null;
  onClose?: () => void;
}

export function NoticeToast({ message, onClose }: NoticeToastProps) {
  if (!message) return null;

  return (
    <div
      className="modal-scale-in"
      style={{
        position: "fixed",
        top: 18,
        left: "50%",
        transform: "translateX(-50%)",
        backgroundColor: "#18211e",
        color: "#f8f9f5",
        padding: "10px 18px",
        borderRadius: 10,
        boxShadow: "0 10px 30px rgba(0,0,0,0.22)",
        zIndex: 99999,
        fontSize: 13,
        fontWeight: 600,
        display: "flex",
        alignItems: "center",
        gap: 12,
        maxWidth: "90vw",
        border: "1px solid #33443e"
      }}
    >
      <span>{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            background: "transparent",
            border: "none",
            color: "#9ca3af",
            fontSize: 16,
            cursor: "pointer",
            padding: 0,
            lineHeight: 1
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}
