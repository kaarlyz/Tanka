import React from "react";
import { Sparkles, RotateCw, Layers, ChevronLeft, ChevronRight } from "lucide-react";
import { Flashcard } from "../../types";
import { MathView } from "../common/MathView";
import { AIProcessLoader } from "../common/AIProcessLoader";

export interface FlashcardsTabProps {
  flashcards: Flashcard[];
  currentCardIndex: number;
  setCurrentCardIndex: React.Dispatch<React.SetStateAction<number>>;
  isFlipped: boolean;
  setIsFlipped: React.Dispatch<React.SetStateAction<boolean>>;
  handleGenerateFlashcards: () => Promise<void> | void;
  handleReviewCard: (difficulty: "again" | "hard" | "good" | "easy" | any) => Promise<void> | void;
  isGeneratingCards: boolean;
}

export function FlashcardsTab({
  flashcards,
  currentCardIndex,
  setCurrentCardIndex,
  isFlipped,
  setIsFlipped,
  handleGenerateFlashcards,
  handleReviewCard,
  isGeneratingCards,
}: FlashcardsTabProps) {
  const currentCard = flashcards[currentCardIndex];
  return (
              <div className="tab-pane-animate" style={{ maxWidth: 860, margin: "0 auto" }}>
                {/* Flashcard Header Controls */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <h2 style={{ fontSize: 19, fontWeight: 800, letterSpacing: "-0.02em", color: "#17201d" }}>
                      Flashcards: Latihan Ingatan Aktif
                    </h2>
                    <p style={{ fontSize: 12, color: "#6f7975", marginTop: 2 }}>
                      1 konsep per kartu untuk memperkuat retensi memori jangka panjang (Spaced Repetition).
                    </p>
                  </div>
                  <button
                    onClick={handleGenerateFlashcards}
                    disabled={isGeneratingCards}
                    style={{
                      backgroundColor: "#18221f",
                      border: "none",
                      color: "#c8f064",
                      borderRadius: 8,
                      padding: "8px 14px",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: isGeneratingCards ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6
                    }}
                  >
                    <Sparkles size={14} />
                    {isGeneratingCards ? "Menganalisis..." : "Buat Kartu Baru"}
                  </button>
                </div>

                {/* Empty State */}
                {isGeneratingCards ? (
                  <AIProcessLoader
                    title="Menyusun Kartu Flashcard Atomik"
                    subtitle="AI membedah materi menjadi kartu pengingat fakta kunci (1 kartu 1 konsep)."
                    badge="Active Recall"
                    steps={[
                      { label: "Mengekstrak Konsep & Definisi Kunci", detail: "Memilah fakta penting dan kaidah utama dari bahan bacaan." },
                      { label: "Membuat Pertanyaan Pemicu Ingatan", detail: "Merumuskan petunjuk hafalan tanpa membocorkan jawaban." },
                      { label: "Mengunci Jawaban Padat Bebas Distraksi", detail: "Menyusun jawaban ringkas dan tegas untuk retensi memori." },
                      { label: "Menata Urutan Spaced Repetition", detail: "Menyiapkan deck untuk review harian bertahap." }
                    ]}
                  />
                ) : flashcards.length === 0 ? (
                  <div
                    style={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #dde1da",
                      borderRadius: 12,
                      padding: "36px 20px",
                      textAlign: "center",
                      boxShadow: "0 10px 35px rgba(27, 39, 35, 0.04)"
                    }}
                  >
                    <Layers size={32} color="#727d78" style={{ margin: "0 auto 10px" }} />
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#17201d" }}>
                      Belum Ada Flashcards
                    </div>
                    <p style={{ fontSize: 13, color: "#6f7975", maxWidth: 440, margin: "6px auto 16px", lineHeight: "1.5" }}>
                      Belum ada flashcards untuk materi ini. Klik tombol di bawah agar AI membedah fakta kunci menjadi kartu hafalan atomik.
                    </p>
                    <button
                      onClick={handleGenerateFlashcards}
                      disabled={isGeneratingCards}
                      style={{
                        backgroundColor: "#18221f",
                        color: "#c8f064",
                        border: "none",
                        borderRadius: 8,
                        padding: "10px 20px",
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: "pointer"
                      }}
                    >
                      Susun Flashcards Sekarang
                    </button>
                  </div>
                ) : (
                  <div>
                    {/* Progress Bar & Indicators */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#6f7975", fontFamily: "'DM Mono', monospace" }}>
                        Kartu {currentCardIndex + 1} dari {flashcards.length}
                      </span>
                      <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                        {flashcards.map((fc, i) => (
                          <div
                            key={fc.id}
                            style={{
                              width: i === currentCardIndex ? 18 : 6,
                              height: 6,
                              borderRadius: 4,
                              transition: "all 0.2s ease",
                              backgroundColor:
                                i === currentCardIndex
                                  ? "#65a30d"
                                  : fc.difficulty === "easy"
                                  ? "#0ea5e9"
                                  : fc.difficulty === "good"
                                  ? "#72a728"
                                  : fc.difficulty === "hard"
                                  ? "#f59e0b"
                                  : fc.difficulty === "again"
                                  ? "#ef4444"
                                  : "#dce1da"
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* 3D Spatial Flip Card Container */}
                    <div className="flashcard-stage">
                      <div
                        className={`flashcard-card ${isFlipped ? "flipped" : ""}`}
                        onClick={() => setIsFlipped(!isFlipped)}
                      >
                        {/* Front Face: Concept & Question */}
                        <div className="flashcard-face flashcard-front">
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 800,
                                textTransform: "uppercase",
                                letterSpacing: "1.2px",
                                color: "#c8f064",
                                fontFamily: "'DM Mono', monospace"
                              }}
                            >
                              Konsep / Istilah Kunci
                            </span>
                            <span style={{ fontSize: 10.5, color: "#89938f", display: "flex", alignItems: "center", gap: 5, letterSpacing: "0.5px" }}>
                              <RotateCw size={11} />
                              KLIK UNTUK BALIK
                            </span>
                          </div>

                          <div className="card-q" style={{ fontSize: 20, fontWeight: 700, lineHeight: "1.45", color: "#f0f4f1", margin: "24px 0", letterSpacing: "-0.4px" }}>
                            <MathView text={currentCard?.front} />
                          </div>

                          <div style={{ fontSize: 11, color: "#89938f", fontFamily: "'DM Mono', monospace" }}>
                            Status penguasaan: {currentCard?.difficulty || "Baru"}
                          </div>
                        </div>

                        {/* Back Face: Answer & Resolution */}
                        <div className="flashcard-face flashcard-back">
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 800,
                                textTransform: "uppercase",
                                letterSpacing: "1.2px",
                                color: "#4b681d",
                                fontFamily: "'DM Mono', monospace"
                              }}
                            >
                              JAWABAN & DEFINISI
                            </span>
                            <span style={{ fontSize: 10.5, color: "#566b36", display: "flex", alignItems: "center", gap: 5, letterSpacing: "0.5px" }}>
                              <RotateCw size={11} />
                              SENTUH KEMBALI
                            </span>
                          </div>

                          <div style={{ fontSize: 16, fontWeight: 600, lineHeight: "1.65", color: "#26301e", margin: "22px 0" }}>
                            <MathView text={currentCard?.back} />
                          </div>

                          <div style={{ fontSize: 11, color: "#4b681d", fontFamily: "'DM Mono', monospace", fontWeight: 700 }}>
                            Beri nilai pemahaman di bawah
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Flip and Navigation Button */}
                    <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 16 }}>
                      <button
                        onClick={() => {
                          if (currentCardIndex > 0) {
                            setIsFlipped(false);
                            setCurrentCardIndex(currentCardIndex - 1);
                          }
                        }}
                        disabled={currentCardIndex === 0}
                        style={{
                          backgroundColor: "#ffffff",
                          border: "1px solid #dce1da",
                          color: currentCardIndex === 0 ? "#9ca3af" : "#17201d",
                          borderRadius: 8,
                          padding: "8px 14px",
                          fontSize: 12,
                          cursor: currentCardIndex === 0 ? "not-allowed" : "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 4
                        }}
                      >
                        <ChevronLeft size={14} /> Sebelumnya
                      </button>

                      <button
                        onClick={() => setIsFlipped(!isFlipped)}
                        style={{
                          backgroundColor: "#ffffff",
                          border: "1px solid #dce1da",
                          color: "#17201d",
                          borderRadius: 8,
                          padding: "8px 16px",
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 6
                        }}
                      >
                        <RotateCw size={13} /> Balik Kartu
                      </button>

                      <button
                        onClick={() => {
                          if (currentCardIndex < flashcards.length - 1) {
                            setIsFlipped(false);
                            setCurrentCardIndex(currentCardIndex + 1);
                          }
                        }}
                        disabled={currentCardIndex === flashcards.length - 1}
                        style={{
                          backgroundColor: "#ffffff",
                          border: "1px solid #dce1da",
                          color: currentCardIndex === flashcards.length - 1 ? "#9ca3af" : "#17201d",
                          borderRadius: 8,
                          padding: "8px 14px",
                          fontSize: 12,
                          cursor: currentCardIndex === flashcards.length - 1 ? "not-allowed" : "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 4
                        }}
                      >
                        Berikutnya <ChevronRight size={14} />
                      </button>
                    </div>

                    {/* Spaced Repetition Grading Actions */}
                    <div style={{ marginTop: 20, padding: "16px", backgroundColor: "#ffffff", borderRadius: 12, border: "1px solid #dde1da", boxShadow: "0 10px 35px rgba(27, 39, 35, 0.04)" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#6f7975", textAlign: "center", marginBottom: 10 }}>
                        Beri Nilai Pemahaman Untuk Algoritma Pengulangan
                      </div>
                      <div className="spaced-rep-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                        <button
                          onClick={() => handleReviewCard("again")}
                          style={{
                            backgroundColor: "#faece8",
                            border: "1px solid #f2d5ce",
                            color: "#a2574a",
                            borderRadius: 8,
                            padding: "10px 0",
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer"
                          }}
                        >
                          Ulangi Segera
                        </button>
                        <button
                          onClick={() => handleReviewCard("hard")}
                          style={{
                            backgroundColor: "#fffbeb",
                            border: "1px solid #fde68a",
                            color: "#92400e",
                            borderRadius: 8,
                            padding: "10px 0",
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer"
                          }}
                        >
                          Sulit (1 hari)
                        </button>
                        <button
                          onClick={() => handleReviewCard("good")}
                          style={{
                            backgroundColor: "#edf4e3",
                            border: "1px solid #d7e5c5",
                            color: "#566b36",
                            borderRadius: 8,
                            padding: "10px 0",
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer"
                          }}
                        >
                          Paham (3 hari)
                        </button>
                        <button
                          onClick={() => handleReviewCard("easy")}
                          style={{
                            backgroundColor: "#dcfce7",
                            border: "1px solid #bbf7d0",
                            color: "#166534",
                            borderRadius: 8,
                            padding: "10px 0",
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer"
                          }}
                        >
                          Kuasai (7 hari)
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
  );
}
