import { FileText, Sparkles, X } from "lucide-react";

export interface RawTextModalProps {
  isOpen: boolean;
  onClose: () => void;
  rawTextTitle: string;
  setRawTextTitle: (t: string) => void;
  rawTextContent: string;
  setRawTextContent: (c: string) => void;
  onSubmit: () => Promise<void> | void;
  isSaving?: boolean;
}

export function RawTextModal({
  isOpen,
  onClose,
  rawTextTitle,
  setRawTextTitle,
  rawTextContent,
  setRawTextContent,
  onSubmit,
  isSaving = false
}: RawTextModalProps) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(5px)",
        zIndex: 99990,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16
      }}
    >
      <div
        className="modal-scale-in"
        style={{
          backgroundColor: "#ffffff",
          borderRadius: 16,
          maxWidth: 620,
          width: "100%",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
          overflow: "hidden"
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 22px",
            borderBottom: "1px solid #dde1da",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#fbfcf9"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: "#edf4e3",
                color: "#566b36",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <FileText size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#17201d" }}>
                Tulis / Tempel Materi Baru
              </h3>
              <p style={{ margin: 0, fontSize: 12, color: "#6f7975" }}>
                Ketik teks manual atau salin dari catatan Anda
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#9ca3af",
              cursor: "pointer",
              padding: 4
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <div style={{ padding: "20px 22px", flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#45544e", marginBottom: 6 }}>
              Judul Materi (Opsional)
            </label>
            <input
              type="text"
              value={rawTextTitle}
              onChange={(e) => setRawTextTitle(e.target.value)}
              placeholder="Otomatis dibuatkan AI jika dikosongkan..."
              style={{
                width: "100%",
                backgroundColor: "#fafbf8",
                border: "1px solid #dce1da",
                borderRadius: 8,
                padding: "9px 12px",
                fontSize: 13.5,
                color: "#17201d",
                outline: "none"
              }}
            />
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#45544e", marginBottom: 6 }}>
              Isi Catatan / Ringkasan Materi <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <textarea
              rows={9}
              value={rawTextContent}
              onChange={(e) => setRawTextContent(e.target.value)}
              placeholder="Ketik atau tempel teks materi di sini... Mendukung formula matematika KaTeX ($...$ atau $$...$$)."
              style={{
                width: "100%",
                flex: 1,
                backgroundColor: "#fafbf8",
                border: "1px solid #dce1da",
                borderRadius: 8,
                padding: "12px",
                fontSize: 13.5,
                lineHeight: "1.6",
                color: "#17201d",
                outline: "none",
                resize: "vertical"
              }}
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: "14px 22px",
            borderTop: "1px solid #dde1da",
            backgroundColor: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 10
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              backgroundColor: "#f4f6f2",
              border: "1px solid #dce1da",
              color: "#4b5563",
              fontSize: 12.5,
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            Batal
          </button>

          <button
            type="button"
            onClick={onSubmit}
            disabled={!rawTextContent.trim() || isSaving}
            style={{
              padding: "8px 18px",
              borderRadius: 8,
              backgroundColor: "#18221f",
              color: "#c8f064",
              border: "none",
              fontSize: 12.5,
              fontWeight: 700,
              cursor: !rawTextContent.trim() || isSaving ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            <Sparkles size={14} />
            <span>{isSaving ? "Menyimpan..." : "Simpan Materi"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
