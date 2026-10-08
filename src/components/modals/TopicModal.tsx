import React from "react";
import { Sparkles, Compass, ChevronRight, X } from "lucide-react";
import { WebSearchProgressView } from "../common/DiagramRenderer";

export interface TopicClarificationQuestion {
  id: string;
  question: string;
  choices: string[];
}

export interface TopicClarificationData {
  subject: string;
  formalTitle: string;
  questions: TopicClarificationQuestion[];
}

export interface TopicModalProps {
  isTopicModalOpen: boolean;
  setIsTopicModalOpen: (val: boolean) => void;
  topicStep: 1 | 2 | 3;
  setTopicStep: (val: 1 | 2 | 3) => void;
  topicInput: string;
  setTopicInput: (val: string) => void;
  isClarifyingTopic: boolean;
  isGeneratingTopic: boolean;
  topicClarificationData: TopicClarificationData | null;
  topicAnswers: Record<string, string>;
  setTopicAnswers: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  handleStartTopicClarify: (customTopic?: string) => void;
  handleGenerateTopicDocument: () => void;
}

export function TopicModal({
  isTopicModalOpen,
  setIsTopicModalOpen,
  topicStep,
  setTopicStep,
  topicInput,
  setTopicInput,
  isClarifyingTopic,
  isGeneratingTopic,
  topicClarificationData,
  topicAnswers,
  setTopicAnswers,
  handleStartTopicClarify,
  handleGenerateTopicDocument,
}: TopicModalProps) {
  if (!isTopicModalOpen) return null;

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
              if (!isGeneratingTopic) setIsTopicModalOpen(false);
              }}
              >
              <div
              onClick={(e) => e.stopPropagation()}
              style={{
              width: "100%",
              maxWidth: 580,
              maxHeight: "85vh",
              backgroundColor: "#ffffff",
              border: "1px solid #dde1da",
              borderRadius: 12,
              boxShadow: "0 20px 60px rgba(27, 39, 35, 0.15)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column"
              }}
              >
              {/* Modal Header */}
              <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid #dde1da",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: "#f8f9f5"
              }}
              >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    backgroundColor: "#eef8db",
                    border: "1px solid #c2e28f",
                    borderRadius: 8,
                    padding: 6,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <Compass size={17} color="#4b6623" />
                </div>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: "#17201d", margin: 0, letterSpacing: "-0.01em" }}>
                    Belajar Mandiri Tanpa Berkas
                  </h3>
                  <div style={{ fontSize: 11, color: "#6f7975", marginTop: 2 }}>
                    Tentukan topik materi, AI mengonfirmasi fokus kebutuhan dan menyusun kurikulum resmi
                  </div>
                </div>
              </div>
              {!isGeneratingTopic && (
                <button
                  onClick={() => setIsTopicModalOpen(false)}
                  style={{ background: "none", border: "none", color: "#6f7975", cursor: "pointer", padding: 4 }}
                >
                  <X size={18} />
                </button>
              )}
              </div>

              {/* Modal Body */}
              <div style={{ flex: 1, padding: "20px", overflowY: "auto" }}>
              {/* STEP 1: Input Topic */}
              {topicStep === 1 && (
                <div>
                  {isClarifyingTopic ? (
                    <WebSearchProgressView
                      topic={topicInput}
                      subtitle="Menganalisis relevansi kurikulum & mendeteksi sub-topik..."
                    />
                  ) : (
                    <div>
                      <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#17201d", marginBottom: 8 }}>
                        Apa materi atau topik yang ingin Anda kuasai hari ini?
                      </label>
                      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                        <input
                          type="text"
                          value={topicInput}
                          onChange={(e) => setTopicInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleStartTopicClarify();
                          }}
                          placeholder="Contoh: Matriks Transformasi, Teori Elastisitas, Konflik Sosial..."
                          style={{
                            flex: 1,
                            backgroundColor: "#fafbf8",
                            border: "1px solid #dce1da",
                            borderRadius: 8,
                            padding: "10px 14px",
                            fontSize: 13,
                            color: "#17201d",
                            outline: "none"
                          }}
                          autoFocus
                        />
                        <button
                          onClick={() => handleStartTopicClarify()}
                          disabled={isGeneratingTopic || isClarifyingTopic || !topicInput.trim()}
                          style={{
                            backgroundColor: "#18221f",
                            color: "#c8f064",
                            border: "none",
                            borderRadius: 8,
                            padding: "0 18px",
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: isGeneratingTopic || isClarifyingTopic || !topicInput.trim() ? "not-allowed" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 6
                          }}
                        >
                          <Sparkles size={14} />
                          <span>Mulai Riset</span>
                        </button>
                      </div>

                      {/* Quick suggestion pills */}
                      <div style={{ marginTop: 14 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#6f7975", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                          Pilih Cepat Topik Ujian & Studi Populer:
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                          {[
                            "Matriks Transformasi Geometri 2x2",
                            "Persamaan & Fungsi Kuadrat",
                            "Barisan & Deret Aritmetika",
                            "Teori Permintaan & Penawaran Pasar",
                            "Struktur Sosial & Mobilitas Sosial",
                            "Ide Pokok & Kalimat Efektif Teks",
                            "The Unseen Reading Passage (B. Inggris)"
                          ].map((sug, sIdx) => (
                            <button
                              key={sIdx}
                              onClick={() => {
                                setTopicInput(sug);
                                handleStartTopicClarify(sug);
                              }}
                              style={{
                                backgroundColor: "#fafbf8",
                                border: "1px solid #dce1da",
                                color: "#45544e",
                                borderRadius: 999,
                                padding: "6px 12px",
                                fontSize: 11.5,
                                cursor: "pointer",
                                textAlign: "left"
                              }}
                            >
                              {sug}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 2: AI Diagnostic Clarification Questions */}
              {topicStep === 2 && topicClarificationData && (
                <div>
                  <div
                    style={{
                      backgroundColor: "#eef8db",
                      border: "1px solid #c2e28f",
                      borderRadius: 10,
                      padding: "12px 14px",
                      marginBottom: 16
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          color: "#22370c",
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          backgroundColor: "#ffffff",
                          border: "1px solid #c2e28f",
                          padding: "2px 6px",
                          borderRadius: 4,
                          fontFamily: "'DM Mono', monospace"
                        }}
                      >
                        {topicAnswers["cabang_materi"] && topicAnswers["cabang_materi"].includes("Sosiologi") 
                          ? "Sosiologi" 
                          : (topicAnswers["cabang_materi"] && topicAnswers["cabang_materi"].includes("Matematika") 
                              ? "Matematika" 
                              : topicClarificationData.subject)}
                      </span>
                      <button
                        onClick={() => setTopicStep(1)}
                        style={{ background: "none", border: "none", color: "#45544e", fontSize: 11, cursor: "pointer" }}
                      >
                        Ubah Topik
                      </button>
                    </div>
                    <div style={{ fontSize: 14.5, fontWeight: 800, color: "#17201d" }}>
                      {topicAnswers["cabang_materi"] || topicClarificationData.formalTitle}
                    </div>
                  </div>

                  <div style={{ fontSize: 12, color: "#6f7975", marginBottom: 14 }}>
                    Tentukan fokus dan preferensi belajar untuk modul materi ini:
                  </div>

                  {/* Clarification questions */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {topicClarificationData.questions.map((q, qIdx) => (
                      <div
                        key={q.id || qIdx}
                        style={{
                          backgroundColor: "#f8f9f5",
                          border: "1px solid #dde1da",
                          borderRadius: 10,
                          padding: "14px 16px"
                        }}
                      >
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#17201d", marginBottom: 10 }}>
                          {qIdx + 1}. {q.question}
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {q.choices.map((choice, cIdx) => {
                            const isSelected = topicAnswers[q.id] === choice;
                            return (
                              <button
                                key={cIdx}
                                onClick={() => {
                                  setTopicAnswers((prev) => ({ ...prev, [q.id]: choice }));
                                }}
                                style={{
                                  backgroundColor: isSelected ? "#18221f" : "#ffffff",
                                  border: isSelected ? "1px solid #18221f" : "1px solid #dce1da",
                                  color: isSelected ? "#c8f064" : "#45544e",
                                  borderRadius: 8,
                                  padding: "7px 12px",
                                  fontSize: 12,
                                  fontWeight: isSelected ? 700 : 500,
                                  cursor: "pointer",
                                  textAlign: "left"
                                }}
                              >
                                {isSelected ? "✓ " : ""}{choice}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}

                    {/* Kolom Input Tambahan: Jelaskan Konteks Materi */}
                    <div
                      style={{
                        backgroundColor: "#f8f9f5",
                        border: "1px solid #dde1da",
                        borderRadius: 10,
                        padding: "14px 16px"
                      }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#17201d", marginBottom: 4 }}>
                        Jelaskan Konteks Materi (Opsional)
                      </div>
                      <div style={{ fontSize: 11.5, color: "#6f7975", marginBottom: 10 }}>
                        Punya catatan khusus? Tulis di sini agar AI memfokuskan bab sesuai kebutuhanmu (misal: "fokus rumus turunan pertama aljabar" atau "untuk persiapan ulangan sosiologi bab 2").
                      </div>
                      <textarea
                        value={topicAnswers["custom_context"] || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setTopicAnswers((prev) => ({ ...prev, custom_context: val }));
                        }}
                        placeholder="Ketik konteks spesifik di sini..."
                        rows={2}
                        style={{
                          width: "100%",
                          boxSizing: "border-box",
                          padding: "10px 12px",
                          fontSize: 12.5,
                          border: "1px solid #c9cfc6",
                          borderRadius: 8,
                          outline: "none",
                          fontFamily: "inherit",
                          resize: "vertical",
                          backgroundColor: "#ffffff",
                          color: "#18221f"
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Generation in Progress with Live Multi-Source Search Visualizer */}
              {topicStep === 3 && (
                <div style={{ padding: "8px 0" }}>
                  <WebSearchProgressView
                    topic={topicClarificationData?.formalTitle || topicInput}
                    subject={topicClarificationData?.subject || "Kurikulum Nasional"}
                    subtitle={
                      /matematika|math|aritmatika|aritmetika|aljabar|trigonometri|kalkulus|integral|turunan|diferensial|limit|matriks|vektor|peluang|statistika|kombinatorika|permutasi|kombinasi|eksponen|logaritma|persamaan|pertidaksamaan|fungsi|polinomial|lingkaran|dimensi tiga|bangun ruang|bangun datar|pythagoras|barisan|deret|bilangan|pecahan|operasi hitung|geometri|transformasi|dilatasi|translasi|rotasi|refleksi/i.test(
                        `${topicClarificationData?.formalTitle || topicInput} ${topicClarificationData?.subject || ""}`
                      )
                        ? "Menyusun formulasi matematika murni, tabel rumus KaTeX & penurunan analitik..."
                        : "Meneliti buku kurikulum resmi, memvalidasi konsep kunci & menyusun modul belajar..."
                    }
                  />
                </div>
              )}
              </div>

              {/* Modal Sticky Footer (Only shown in Step 2) */}
              {topicStep === 2 && (
              <div
                style={{
                  padding: "14px 20px",
                  borderTop: "1px solid #dde1da",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  backgroundColor: "#f8f9f5"
                }}
              >
                <button
                  onClick={() => setTopicStep(1)}
                  style={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #dce1da",
                    color: "#17201d",
                    borderRadius: 8,
                    padding: "9px 14px",
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  ← Kembali
                </button>
                <button
                  onClick={handleGenerateTopicDocument}
                  disabled={isGeneratingTopic}
                  style={{
                    backgroundColor: "#18221f",
                    color: "#c8f064",
                    border: "none",
                    borderRadius: 8,
                    padding: "10px 18px",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: isGeneratingTopic ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)"
                  }}
                >
                  <Sparkles size={14} />
                  <span>Susun Dokumen & Modul Mandiri</span>
                </button>
              </div>
              )}
              </div>
              </div>
  );
}
