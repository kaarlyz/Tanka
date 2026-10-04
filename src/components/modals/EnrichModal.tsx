import React from "react";
import { Globe, Sparkles, Check, X } from "lucide-react";
import { AIProcessLoader } from "../common/AIProcessLoader";

export interface EnrichModalProps {
  isEnrichModalOpen: boolean;
  setIsEnrichModalOpen: (val: boolean) => void;
  activeDocTitle: string;
  isEnriching: boolean;
  enrichSuggestions: Array<any>;
  isLoadingSuggestions: boolean;
  selectedEnrichTitles: string[];
  setSelectedEnrichTitles: React.Dispatch<React.SetStateAction<string[]>>;
  enrichFocus: string;
  setEnrichFocus: (val: string) => void;
  handleEnrichDocument: () => void;
}

export function EnrichModal({
  isEnrichModalOpen,
  setIsEnrichModalOpen,
  activeDocTitle,
  isEnriching,
  enrichSuggestions,
  isLoadingSuggestions,
  selectedEnrichTitles,
  setSelectedEnrichTitles,
  enrichFocus,
  setEnrichFocus,
  handleEnrichDocument,
}: EnrichModalProps) {
  if (!isEnrichModalOpen) return null;

  return (
                <div
                  style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 9999,
                    backgroundColor: "rgba(0, 0, 0, 0.6)",
                    backdropFilter: "blur(6px)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 16
                  }}
                  onClick={() => {
                    if (!isEnriching) setIsEnrichModalOpen(false);
                  }}
                >
                  <div
                    style={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #dde1da",
                      borderRadius: 12,
                      width: "100%",
                      maxWidth: 480,
                      padding: "24px 26px",
                      boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)"
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Globe size={20} color="#4b6623" />
                        <div>
                          <h3 style={{ fontSize: 16, fontWeight: 800, color: "#17201d", margin: 0 }}>
                            Perkaya Materi dari Internet
                          </h3>
                          <div style={{ fontSize: 11, color: "#6f7975", marginTop: 2 }}>
                            {activeDocTitle}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setIsEnrichModalOpen(false)}
                        disabled={isEnriching}
                        style={{ background: "none", border: "none", color: "#6f7975", cursor: "pointer", padding: 4 }}
                      >
                        <X size={18} />
                      </button>
                    </div>

                    {isEnriching ? (
                      <div style={{ padding: "8px 0 16px" }}>
                        <AIProcessLoader
                          title="Sedang Memperkaya Materi dari Internet"
                          subtitle="AI menganalisis kekosongan konsep, mencari referensi kurikulum, dan menyusun studi kasus kontekstual."
                          badge="Riset Akademik"
                          steps={[
                            { label: "Menganalisis Titik Lemah Catatan", detail: `Memindai materi "${activeDocTitle}" untuk menemukan celah konsep.` },
                            { label: "Mencari Referensi & Kasus Nyata", detail: "Meneliti artikel ensiklopedia, jurnal, dan modul akademik." },
                            { label: "Menyaring Miskonsepsi & Analogi", detail: "Menyiapkan contoh kontekstual yang ramah pemahaman." },
                            { label: "Menyisipkan Catatan Tambahan ke Dokumen", detail: "Merapikan rumus KaTeX dan glosarium istilah baru." }
                          ]}
                        />
                      </div>
                    ) : (
                      <>
                        <p style={{ fontSize: 12.5, color: "#45544e", lineHeight: "1.5", marginBottom: 14 }}>
                          AI menganalisis isi materi Anda dan memindai referensi akademik untuk melengkapi bagian yang belum mendalam. Pilih salah satu saran di bawah atau tulis fokus sendiri:
                        </p>

                        {/* AI Smart Contextual Recommendations */}
                        <div style={{ marginBottom: 16 }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: "#17201d", textTransform: "uppercase", letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: 5 }}>
                              <Sparkles size={13} color="#4b6623" />
                              <span>Rekomendasi Cerdas AI</span>
                            </span>
                            {isLoadingSuggestions && (
                              <span style={{ fontSize: 10, color: "#6f7975", fontFamily: "'DM Mono', monospace" }}>
                                Menganalisis materi...
                              </span>
                            )}
                          </div>

                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                            {(() => {
                              const activeSuggestions = enrichSuggestions.length > 0 ? enrichSuggestions : [
                                {
                                  title: "Studi Kasus Konkret",
                                  focus: "Berikan contoh kasus nyata terkini di Indonesia beserta analisis penerapannya",
                                  reason: "Menghubungkan teori ke fenomena nyata agar tidak sekadar hafalan"
                                },
                                {
                                  title: "Miskonsepsi Umum Ujian",
                                  focus: "Jelaskan jebakan soal atau miskonsepsi yang sering mengecoh siswa pada materi ini",
                                  reason: "Melatih kepekaan terhadap pola soal ujian sekolah dan UTBK"
                                },
                                {
                                  title: "Analogi Bebas Jargon",
                                  focus: "Gambarkan konsep inti dengan analogi sederhana sehari-hari",
                                  reason: "Mempermudah pemahaman intuitif bagi pemula"
                                },
                                {
                                  title: "Trik Cepat & Rumus Kunci",
                                  focus: "Rangkum kaidah esensial, jembatan keledai, atau batasan legal aturan",
                                  reason: "Meringkas hafalan ke format padat dan mudah diingat"
                                }
                              ];

                              return activeSuggestions.map((sug, idx) => {
                                const isSelected = selectedEnrichTitles.includes(sug.title);
                                return (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => {
                                      const nextTitles = isSelected
                                        ? selectedEnrichTitles.filter((t) => t !== sug.title)
                                        : [...selectedEnrichTitles, sug.title];
                                      setSelectedEnrichTitles(nextTitles);
                                      if (nextTitles.length === 0) {
                                        setEnrichFocus("");
                                      } else {
                                        const selectedObjs = activeSuggestions.filter((s) => nextTitles.includes(s.title));
                                        const merged = selectedObjs.map((s, i) => `${i + 1}. ${s.title}: ${s.focus}`).join("\n\n");
                                        setEnrichFocus(merged);
                                      }
                                    }}
                                    style={{
                                      textAlign: "left",
                                      backgroundColor: isSelected ? "#f0fdf4" : "#ffffff",
                                      border: `1.5px solid ${isSelected ? "#566b36" : "#dce1da"}`,
                                      borderRadius: 8,
                                      padding: "9px 11px",
                                      cursor: "pointer",
                                      transition: "all 0.15s ease",
                                      display: "flex",
                                      flexDirection: "column",
                                      gap: 3,
                                      boxShadow: isSelected ? "0 2px 8px rgba(86, 107, 54, 0.12)" : "none"
                                    }}
                                  >
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                        <div
                                          style={{
                                            width: 14,
                                            height: 14,
                                            borderRadius: 3,
                                            border: `1.5px solid ${isSelected ? "#566b36" : "#9ca3af"}`,
                                            backgroundColor: isSelected ? "#566b36" : "#ffffff",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center"
                                          }}
                                        >
                                          {isSelected && <Check size={10} color="#ffffff" strokeWidth={3} />}
                                        </div>
                                        <strong style={{ fontSize: 12, color: isSelected ? "#15803d" : "#17201d" }}>
                                          {sug.title}
                                        </strong>
                                      </div>
                                      {isSelected && (
                                        <span style={{ fontSize: 9.5, backgroundColor: "#dcfce7", color: "#166534", padding: "1px 5px", borderRadius: 4, fontWeight: 700 }}>
                                          PILIH
                                        </span>
                                      )}
                                    </div>
                                    <span style={{ fontSize: 10.5, color: "#6f7975", lineHeight: 1.3, marginTop: 2 }}>
                                      {sug.reason}
                                    </span>
                                  </button>
                                );
                              });
                            })()}
                          </div>

                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                            <label style={{ fontSize: 11, fontWeight: 700, color: "#17201d", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                              Fokus Tambahan (Bisa Dibaca Lengkap & Diedit Bebas)
                            </label>
                            {enrichFocus && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEnrichFocus("");
                                  setSelectedEnrichTitles([]);
                                }}
                                style={{ background: "none", border: "none", color: "#6f7975", fontSize: 11, cursor: "pointer", textDecoration: "underline" }}
                              >
                                Bersihkan teks
                              </button>
                            )}
                          </div>
                          <textarea
                            rows={4}
                            value={enrichFocus}
                            onChange={(e) => setEnrichFocus(e.target.value)}
                            placeholder="Klik salah satu rekomendasi di atas untuk mengisi otomatis, atau ketik sendiri penjelasan fokus materi yang ingin ditambah..."
                            style={{
                              width: "100%",
                              backgroundColor: "#fafbf8",
                              border: "1px solid #dce1da",
                              borderRadius: 8,
                              padding: "10px 12px",
                              fontSize: 13.5,
                              lineHeight: "1.55",
                              color: "#17201d",
                              outline: "none",
                              resize: "vertical"
                            }}
                          />
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                          <button
                            onClick={() => setIsEnrichModalOpen(false)}
                            disabled={isEnriching}
                            style={{
                              backgroundColor: "#ffffff",
                              border: "1px solid #dce1da",
                              color: "#56615d",
                              borderRadius: 8,
                              padding: "8px 14px",
                              fontSize: 12.5,
                              fontWeight: 600,
                              cursor: "pointer"
                            }}
                          >
                            Batal
                          </button>
                          <button
                            onClick={handleEnrichDocument}
                            disabled={isEnriching}
                            style={{
                              backgroundColor: "#18221f",
                              border: "none",
                              color: "#c8f064",
                              borderRadius: 8,
                              padding: "8px 16px",
                              fontSize: 12.5,
                              fontWeight: 700,
                              cursor: isEnriching ? "not-allowed" : "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: 6
                            }}
                          >
                            <Globe size={14} />
                            <span>Tambahkan ke Materi Ini</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
  );
}
