import React from "react";
import { Globe, Check, Sparkles, X } from "lucide-react";
import { EnrichSuggestion } from "../../types";

export interface EnrichModalProps {
  isOpen: boolean;
  onClose: () => void;
  suggestions: EnrichSuggestion[];
  selectedTitles: string[];
  onToggleSelect: (title: string, focus: string) => void;
  focusText: string;
  setFocusText: (t: string) => void;
  onApply: (focusText: string) => Promise<void> | void;
  isEnriching: boolean;
  isLoadingSuggestions?: boolean;
}

export function EnrichModal({
  isOpen,
  onClose,
  suggestions,
  selectedTitles,
  onToggleSelect,
  focusText,
  setFocusText,
  onApply,
  isEnriching,
  isLoadingSuggestions = false
}: EnrichModalProps) {
  if (!isOpen) return null;

  const defaultSuggestions: EnrichSuggestion[] = [
    {
      title: "Studi Kasus Konkret",
      focus: "Berikan contoh kasus nyata terkini beserta analisis penerapannya",
      reason: "Menghubungkan teori ke fenomena nyata agar tidak sekadar hafalan"
    },
    {
      title: "Miskonsepsi Umum Ujian",
      focus: "Jelaskan jebakan soal atau miskonsepsi yang sering mengecoh siswa pada materi ini",
      reason: "Melatih kehati-hatian menghadapi tipe soal jebakan di ujian TKA"
    },
    {
      title: "Analogi Bebas Jargon",
      focus: "Jelaskan kembali dengan analogi sederhana yang intuitif dan mudah dipahami",
      reason: "Membantu menancapkan mental model tanpa terbebani istilah kaku"
    },
    {
      title: "Trik Cepat & Rumus Kunci",
      focus: "Tampilkan intisari rumus KaTeX dan pola cepat penyelesaian masalah",
      reason: "Bermanfaat untuk contekan persiapan ujian kilat"
    }
  ];

  const activeSuggestions = suggestions.length > 0 ? suggestions : defaultSuggestions;

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
          maxWidth: 680,
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
                backgroundColor: "#ecfdf5",
                color: "#059669",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <Globe size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#17201d" }}>
                Perkaya Materi dari Web Ilmiah
              </h3>
              <p style={{ margin: 0, fontSize: 12, color: "#6f7975" }}>
                Pilih satu atau beberapa dimensi pengayaan untuk memperdalam materi
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isEnriching}
            style={{ background: "transparent", border: "none", color: "#9ca3af", cursor: isEnriching ? "not-allowed" : "pointer", padding: 4 }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: "18px 22px", flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Recommendation Cards Grid */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#45544e" }}>
                Rekomendasi Fokus Tambahan (Bisa Pilih Lebih dari Satu):
              </span>
              {selectedTitles.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setFocusText("");
                  }}
                  style={{ background: "transparent", border: "none", color: "#6b7280", fontSize: 11, cursor: "pointer" }}
                >
                  Bersihkan Pilihan
                </button>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {activeSuggestions.map((s, idx) => {
                const isSelected = selectedTitles.includes(s.title);
                return (
                  <div
                    key={idx}
                    onClick={() => onToggleSelect(s.title, s.focus)}
                    style={{
                      padding: "12px 14px",
                      borderRadius: 10,
                      border: `1.5px solid ${isSelected ? "#566b36" : "#dce1da"}`,
                      backgroundColor: isSelected ? "#f6f9f2" : "#fafbf8",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between"
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: isSelected ? "#2d4414" : "#17201d" }}>
                          {s.title}
                        </span>
                        <div
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: 4,
                            border: `1.5px solid ${isSelected ? "#566b36" : "#cdd5cb"}`,
                            backgroundColor: isSelected ? "#566b36" : "#ffffff",
                            color: "#ffffff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                          }}
                        >
                          {isSelected && <Check size={12} strokeWidth={3} />}
                        </div>
                      </div>

                      <p style={{ margin: 0, fontSize: 11.5, color: "#5f6b66", lineHeight: 1.45 }}>
                        {s.focus}
                      </p>
                    </div>

                    {s.reason && (
                      <div style={{ marginTop: 8, fontSize: 10.5, color: "#8a9691", fontStyle: "italic" }}>
                        💡 {s.reason}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Combined Custom Focus Textarea */}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#45544e", marginBottom: 6 }}>
              Fokus Pencarian & Pengayaan Gabungan (Dapat diedit bebas):
            </label>
            <textarea
              rows={4}
              value={focusText}
              onChange={(e) => setFocusText(e.target.value)}
              placeholder="Pilih kartu di atas atau ketik aspek spesifik yang ingin diperkaya dari sumber web ilmiah..."
              disabled={isEnriching}
              style={{
                width: "100%",
                backgroundColor: "#fafbf8",
                border: "1px solid #dce1da",
                borderRadius: 8,
                padding: "10px 12px",
                fontSize: 13,
                lineHeight: "1.55",
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
            disabled={isEnriching}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              backgroundColor: "#f4f6f2",
              border: "1px solid #dce1da",
              color: "#4b5563",
              fontSize: 12.5,
              fontWeight: 600,
              cursor: isEnriching ? "not-allowed" : "pointer"
            }}
          >
            Batal
          </button>

          <button
            type="button"
            onClick={() => onApply(focusText)}
            disabled={!focusText.trim() || isEnriching}
            style={{
              padding: "8px 20px",
              borderRadius: 8,
              backgroundColor: "#18221f",
              color: "#c8f064",
              border: "none",
              fontSize: 12.5,
              fontWeight: 700,
              cursor: !focusText.trim() || isEnriching ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            <Sparkles size={14} />
            <span>{isEnriching ? "Mencari & Menyusun..." : "Perkaya Materi Sekarang"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
