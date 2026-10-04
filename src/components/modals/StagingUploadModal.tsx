import React from "react";
import { Upload, Camera, Check, X } from "lucide-react";
import { AIProcessLoader } from "../common/AIProcessLoader";

export interface StagingUploadModalProps {
  isStagingModalOpen: boolean;
  setIsStagingModalOpen: (val: boolean) => void;
  stagedFiles: Array<{ id: string; file: File; name: string; size: number; ext: string; previewUrl?: string }>;
  isUploading: boolean;
  uploadError: string;
  stagedDocTitle: string;
  setStagedDocTitle: (val: string) => void;
  stagedGoal: string;
  setStagedGoal: (val: string) => void;
  stagedCustomInstruction: string;
  setStagedCustomInstruction: (val: string) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  cameraInputRef: React.RefObject<HTMLInputElement | null>;
  handleCancelStaging: () => void;
  handleRemoveStagedFile: (id: string) => void;
  handleConfirmStagedUpload: () => void;
}

export function StagingUploadModal({
  isStagingModalOpen,
  setIsStagingModalOpen,
  stagedFiles,
  isUploading,
  uploadError,
  stagedDocTitle,
  setStagedDocTitle,
  stagedGoal,
  setStagedGoal,
  stagedCustomInstruction,
  setStagedCustomInstruction,
  fileInputRef,
  cameraInputRef,
  handleCancelStaging,
  handleRemoveStagedFile,
  handleConfirmStagedUpload,
}: StagingUploadModalProps) {
  if (!isStagingModalOpen) return null;

  return (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            backgroundColor: "rgba(18, 26, 23, 0.65)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !isUploading) handleCancelStaging();
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: 14,
              width: "100%",
              maxWidth: 520,
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.28)",
              border: "1px solid #dde1da"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #dce2da", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#17201d" }}>
                  Pratinjau Berkas ({stagedFiles.length} item)
                </h3>
                <p style={{ margin: "2px 0 0", fontSize: 11.5, color: "#6f7975" }}>
                  Periksa atau tambah berkas lain sebelum materi dibuat
                </p>
              </div>
              <button
                type="button"
                onClick={handleCancelStaging}
                disabled={isUploading}
                style={{ background: "none", border: "none", color: "#6f7975", cursor: isUploading ? "not-allowed" : "pointer", padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Items Tray */}
            <div style={{ padding: "16px 20px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
              {isUploading ? (
                <div style={{ padding: "8px 0" }}>
                  <AIProcessLoader
                    title="Membaca Berkas & Foto Catatan"
                    subtitle="AI memindai dokumen dan tulisan tangan untuk menyusun modul belajar mandiri."
                    badge="Vision Multimodal"
                    steps={[
                      { label: "Membaca Berkas & Gambar", detail: `Mengurai ${stagedFiles.length} berkas yang Anda pilih...` },
                      { label: "Transkripsi Multimodal Vision", detail: "Mengenali tulisan tangan, rumus matematika KaTeX, diagram, dan tabel." },
                      { label: "Menata Format Pembelajaran Baku", detail: "Menyusun catatan belajar terstruktur dan materi siap dipelajari." }
                    ]}
                  />
                </div>
              ) : (
                <>
                  {/* Staged Items Grid */}
                  <div style={{ display: "grid", gridTemplateColumns: stagedFiles.length === 1 ? "1fr" : "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
                    {stagedFiles.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          backgroundColor: "#fafbf8",
                          border: "1px solid #dce1da",
                          borderRadius: 10,
                          padding: 10,
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          position: "relative"
                        }}
                      >
                        {/* Thumbnail or Badge */}
                        {item.previewUrl ? (
                          <img
                            src={item.previewUrl}
                            alt={item.name}
                            style={{ width: 44, height: 44, borderRadius: 6, objectFit: "cover", flexShrink: 0, border: "1px solid #dce1da" }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: 6,
                              backgroundColor: item.ext === "pdf" ? "#faece8" : "#edf4fc",
                              color: item.ext === "pdf" ? "#c2410c" : "#0284c7",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 800,
                              fontSize: 11,
                              textTransform: "uppercase",
                              flexShrink: 0,
                              fontFamily: "'DM Mono', monospace"
                            }}
                          >
                            {item.ext || "DOC"}
                          </div>
                        )}

                        {/* File Details */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12.5, fontWeight: 700, color: "#17201d", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {item.name}
                          </div>
                          <div style={{ fontSize: 10.5, color: "#78857f", fontFamily: "'DM Mono', monospace", marginTop: 2 }}>
                            {(item.size / 1024).toFixed(1)} KB · {item.ext.toUpperCase()}
                          </div>
                        </div>

                        {/* Delete button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveStagedFile(item.id)}
                          title="Hapus berkas ini"
                          style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", padding: 4 }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add More Buttons */}
                  <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        flex: 1,
                        backgroundColor: "#f4f6f1",
                        border: "1px dashed #779f2f",
                        color: "#3f6212",
                        borderRadius: 8,
                        padding: "8px 12px",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6
                      }}
                    >
                      <Upload size={13} />
                      <span>+ Tambah Berkas / PDF</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      style={{
                        flex: 1,
                        backgroundColor: "#f4f6f1",
                        border: "1px dashed #779f2f",
                        color: "#3f6212",
                        borderRadius: 8,
                        padding: "8px 12px",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6
                      }}
                    >
                      <Camera size={13} />
                      <span>+ Tambah Foto Catatan</span>
                    </button>
                  </div>

                  {/* Title field */}
                  <div style={{ marginTop: 8 }}>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#45544e", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>
                      Judul Materi (Bisa Disesuaikan)
                    </label>
                    <input
                      type="text"
                      value={stagedDocTitle}
                      onChange={(e) => setStagedDocTitle(e.target.value)}
                      placeholder="Beri judul modul..."
                      style={{
                        width: "100%",
                        backgroundColor: "#ffffff",
                        border: "1px solid #dce1da",
                        borderRadius: 8,
                        padding: "9px 12px",
                        fontSize: 13,
                        color: "#17201d",
                        outline: "none"
                      }}
                    />
                  </div>

                  {/* Goal & Custom Intent Suggestion Chips */}
                  <div style={{ marginTop: 12 }}>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#45544e", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                      Tujuan / Mau Diapakan Berkas Ini?
                    </label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                      {[
                        { id: "theory", label: "📖 Pelajari Teori & Konsep", prompt: "Susun modul penjelasan teori konsep dasar secara mendalam." },
                        { id: "solve", label: "✍️ Bahas Tuntas & Kunci Soal", prompt: "Bahas tuntas setiap langkah pengerjaan soal dan berikan kunci jawabannya." },
                        { id: "clone", label: "🔄 Buat Latihan Soal Mirip", prompt: "Buatkan variasi latihan soal kloning (tipe serupa angka beda) untuk uji pemahaman." },
                        { id: "hots", label: "🎯 Bedah Kisi-Kisi / Tantangan HOTS", prompt: "Analisis sebagai kisi-kisi ujian, ekstrak soal, dan siapkan variasi tantangan HOTS." },
                        { id: "summary", label: "⚡ Rangkum Rumus & Intisari", prompt: "Rangkum rumus kunci KaTeX dan poin esensial ringkas tanpa bertele-tele." }
                      ].map((g) => {
                        const isSelected = stagedGoal === g.id;
                        return (
                          <button
                            key={g.id}
                            type="button"
                            onClick={() => {
                              if (stagedGoal === g.id) {
                                setStagedGoal("");
                                setStagedCustomInstruction("");
                              } else {
                                setStagedGoal(g.id);
                                setStagedCustomInstruction(g.prompt);
                              }
                            }}
                            style={{
                              padding: "6px 10px",
                              borderRadius: 7,
                              border: `1.5px solid ${isSelected ? "#566b36" : "#dce2da"}`,
                              backgroundColor: isSelected ? "#f0fdf4" : "#ffffff",
                              color: isSelected ? "#166534" : "#374151",
                              fontSize: 11.5,
                              fontWeight: isSelected ? 800 : 500,
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                              display: "flex",
                              alignItems: "center",
                              gap: 5
                            }}
                          >
                            {isSelected && <Check size={11} strokeWidth={3} />}
                            <span>{g.label}</span>
                          </button>
                        );
                      })}
                    </div>
                    <textarea
                      rows={2}
                      value={stagedCustomInstruction}
                      onChange={(e) => setStagedCustomInstruction(e.target.value)}
                      placeholder="Catatan tambahan (opsional): misal 'fokus ke cara substitusi kuadrat aljabar', 'jelaskan sifat bayangan'..."
                      style={{
                        width: "100%",
                        backgroundColor: "#fafbf8",
                        border: "1px solid #dce1da",
                        borderRadius: 8,
                        padding: "8px 12px",
                        fontSize: 12,
                        color: "#17201d",
                        resize: "vertical",
                        outline: "none",
                        lineHeight: 1.45
                      }}
                    />
                  </div>
                </>
              )}

              {uploadError && (
                <div style={{ padding: "8px 12px", backgroundColor: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 8, color: "#991b1b", fontSize: 12 }}>
                  {uploadError}
                </div>
              )}
            </div>

            {/* Footer Action Bar */}
            {!isUploading && (
              <div style={{ padding: "14px 20px", borderTop: "1px solid #dce2da", display: "flex", justifyContent: "flex-end", gap: 8, backgroundColor: "#fafbf8" }}>
                <button
                  type="button"
                  onClick={handleCancelStaging}
                  style={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #dce1da",
                    color: "#56615d",
                    borderRadius: 8,
                    padding: "9px 16px",
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmStagedUpload}
                  disabled={stagedFiles.length === 0}
                  style={{
                    backgroundColor: "#18221f",
                    color: "#c8f064",
                    border: "none",
                    borderRadius: 8,
                    padding: "9px 18px",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: stagedFiles.length === 0 ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6
                  }}
                >
                  <Check size={14} />
                  <span>Simpan & Buat Materi</span>
                </button>
              </div>
            )}
          </div>
        </div>
  );
}
