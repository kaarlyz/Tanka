import React from "react";
import { UploadCloud, FileText, Image as ImageIcon, Trash2, Sparkles, X, Plus } from "lucide-react";
import { StagedFile } from "../../types";

export interface StagingUploadModalProps {
  isOpen: boolean;
  stagedFiles: StagedFile[];
  onRemoveFile: (id: string) => void;
  onAddMoreFiles: () => void;
  onClose: () => void;
  docTitle: string;
  setDocTitle: (title: string) => void;
  stagedGoal: string;
  setStagedGoal: (goal: string) => void;
  stagedCustomInstruction: string;
  setStagedCustomInstruction: (ins: string) => void;
  onProcess: () => void;
  uploadProcessing: boolean;
  uploadStepIndex: number;
  uploadStepDetail: string;
}

export function StagingUploadModal({
  isOpen,
  stagedFiles,
  onRemoveFile,
  onAddMoreFiles,
  onClose,
  docTitle,
  setDocTitle,
  stagedGoal,
  setStagedGoal,
  stagedCustomInstruction,
  setStagedCustomInstruction,
  onProcess,
  uploadProcessing,
  uploadStepIndex,
  uploadStepDetail
}: StagingUploadModalProps) {
  if (!isOpen) return null;

  const goalOptions = [
    { id: "theory", label: "📖 Pelajari Teori & Konsep", prompt: "Susun panduan materi teori dan konsep dasar secara mendalam." },
    { id: "solve", label: "✍️ Bahas Tuntas & Kunci Soal", prompt: "Bahas tuntas setiap butir soal lengkap dengan langkah pengerjaan dan kunci jawaban." },
    { id: "clone", label: "🔄 Buat Latihan Soal Mirip", prompt: "Buatkan variasi latihan soal kloning (pola sama angka berbeda) untuk menguji pemahaman." },
    { id: "hots", label: "🎯 Bedah Kisi-Kisi / Tantangan HOTS", prompt: "Analisis sebagai kisi-kisi ujian, ekstrak butir soal, dan siapkan variasi tantangan HOTS." },
    { id: "summary", label: "⚡ Rangkum Rumus & Intisari", prompt: "Rangkum poin esensial, rumus kunci KaTeX, dan tabel ringkasan belajar." }
  ];

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
                backgroundColor: "#edf4e3",
                color: "#566b36",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <UploadCloud size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#17201d" }}>
                Unggah & Proses Berkas ({stagedFiles.length} Berkas)
              </h3>
              <p style={{ margin: 0, fontSize: 12, color: "#6f7975" }}>
                AI akan membaca foto/dokumen dan otomatis menentukan topik materi
              </p>
            </div>
          </div>

          {!uploadProcessing && (
            <button
              type="button"
              onClick={onClose}
              style={{ background: "transparent", border: "none", color: "#9ca3af", cursor: "pointer", padding: 4 }}
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Content Body */}
        <div style={{ padding: "18px 22px", flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Staged Files Preview Grid */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#45544e" }}>
                Berkas yang Dipilih
              </span>
              {!uploadProcessing && (
                <button
                  type="button"
                  onClick={onAddMoreFiles}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#566b36",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 4
                  }}
                >
                  <Plus size={13} />
                  <span>Tambah Berkas</span>
                </button>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 10 }}>
              {stagedFiles.map((sf) => (
                <div
                  key={sf.id}
                  style={{
                    backgroundColor: "#f8f9f5",
                    border: "1px solid #dce1da",
                    borderRadius: 8,
                    padding: 8,
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center"
                  }}
                >
                  {!uploadProcessing && (
                    <button
                      type="button"
                      onClick={() => onRemoveFile(sf.id)}
                      style={{
                        position: "absolute",
                        top: 4,
                        right: 4,
                        backgroundColor: "#ffffff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "50%",
                        width: 20,
                        height: 20,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        color: "#ef4444"
                      }}
                      title="Hapus berkas ini"
                    >
                      <Trash2 size={11} />
                    </button>
                  )}

                  {sf.previewUrl ? (
                    <img
                      src={sf.previewUrl}
                      alt={sf.name}
                      style={{ width: "100%", height: 70, objectFit: "cover", borderRadius: 5, marginBottom: 6 }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: 70,
                        backgroundColor: "#edf0ea",
                        borderRadius: 5,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#6b7280",
                        marginBottom: 6
                      }}
                    >
                      <FileText size={26} />
                    </div>
                  )}

                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#18211e",
                      maxWidth: "100%",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis"
                    }}
                    title={sf.name}
                  >
                    {sf.name}
                  </span>
                  <span style={{ fontSize: 9.5, color: "#9ca3af" }}>
                    {(sf.size / 1024).toFixed(0)} KB
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Goal Selector Chips */}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#45544e", marginBottom: 6 }}>
              Pilihan Cepat (Tujuan Belajar)
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {goalOptions.map((g) => {
                const isSelected = stagedGoal === g.prompt;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setStagedGoal(isSelected ? "" : g.prompt)}
                    disabled={uploadProcessing}
                    style={{
                      padding: "5px 11px",
                      borderRadius: 999,
                      fontSize: 11.5,
                      fontWeight: 600,
                      border: `1px solid ${isSelected ? "#18211e" : "#dce1da"}`,
                      backgroundColor: isSelected ? "#18211e" : "#ffffff",
                      color: isSelected ? "#c8f064" : "#45544e",
                      cursor: uploadProcessing ? "not-allowed" : "pointer"
                    }}
                  >
                    {g.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Instruction Box */}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#45544e", marginBottom: 6 }}>
              Catatan / Instruksi Khusus (Opsional)
            </label>
            <textarea
              rows={2}
              value={stagedCustomInstruction}
              onChange={(e) => setStagedCustomInstruction(e.target.value)}
              placeholder="Contoh: Fokus ke cara substitusi kuadrat aljabar, jelaskan kenapa skala bayangan dibalik..."
              disabled={uploadProcessing}
              style={{
                width: "100%",
                backgroundColor: "#fafbf8",
                border: "1px solid #dce1da",
                borderRadius: 8,
                padding: "8px 12px",
                fontSize: 13,
                color: "#18211e",
                outline: "none",
                resize: "vertical"
              }}
            />
          </div>

          {/* Title Override Input */}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#45544e", marginBottom: 6 }}>
              Judul Materi (Kosongkan agar AI otomatis menentukan judul topik resmi)
            </label>
            <input
              type="text"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              placeholder="Otomatis dideteksi AI dari isi materi (atau ketik judul sendiri...)"
              disabled={uploadProcessing}
              style={{
                width: "100%",
                backgroundColor: "#fafbf8",
                border: "1px solid #dce1da",
                borderRadius: 8,
                padding: "9px 12px",
                fontSize: 13,
                color: "#18211e",
                outline: "none"
              }}
            />
          </div>

          {/* Stepper info during processing */}
          {uploadProcessing && (
            <div style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "10px 14px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#166534" }}>
                Sedang Memproses Berkas...
              </div>
              <div style={{ fontSize: 11.5, color: "#15803d", marginTop: 2 }}>
                {uploadStepDetail}
              </div>
            </div>
          )}
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
            disabled={uploadProcessing}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              backgroundColor: "#f4f6f2",
              border: "1px solid #dce1da",
              color: "#4b5563",
              fontSize: 12.5,
              fontWeight: 600,
              cursor: uploadProcessing ? "not-allowed" : "pointer"
            }}
          >
            Batal
          </button>

          <button
            type="button"
            onClick={onProcess}
            disabled={stagedFiles.length === 0 || uploadProcessing}
            style={{
              padding: "8px 20px",
              borderRadius: 8,
              backgroundColor: "#18211e",
              color: "#c8f064",
              border: "none",
              fontSize: 12.5,
              fontWeight: 700,
              cursor: stagedFiles.length === 0 || uploadProcessing ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            <Sparkles size={14} />
            <span>{uploadProcessing ? "Menganalisis & Menyusun..." : "Proses & Buat Materi"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
