import React from "react";
import { AlertTriangle, Play, Trash2, CheckCircle2, ChevronRight, Check, Target } from "lucide-react";
import { MistakeItem } from "../../types";
import { MathView, getSubjectBadge } from "../common/MathView";

export interface MistakesTabProps {
  mistakes: MistakeItem[];
  displayedMistakes: MistakeItem[];
  activeDocMistakes: MistakeItem[];
  activeDocId: string | null;
  activeDocTitle: string;
  mistakeFilterScope: "current" | "all";
  setMistakeFilterScope: (val: "current" | "all") => void;
  handleClearMistakes: () => void;
  startMistakeDrill: () => void;
  deleteMistake: (id: string) => void;
  resolveMistake: (id: string) => void;
  loadDocument: (id: string) => void;
  setQuizQuestions?: (questions: any[]) => void;
  setUserAnswers?: (ans: any) => void;
  setIsAnswerSubmitted?: (sub: boolean) => void;
  setCurrentQuestionIndex?: (idx: number) => void;
  setActiveTab?: (tab: any) => void;
}

export function MistakesTab({
  mistakes,
  displayedMistakes,
  activeDocMistakes,
  activeDocId,
  activeDocTitle,
  mistakeFilterScope,
  setMistakeFilterScope,
  handleClearMistakes,
  startMistakeDrill,
  deleteMistake,
  resolveMistake,
  loadDocument,
  setQuizQuestions,
  setUserAnswers,
  setIsAnswerSubmitted,
  setCurrentQuestionIndex,
  setActiveTab,
}: MistakesTabProps) {
  return (
              <div className="mistakes-view">
                <div className="view-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20, marginBottom: 24, flexWrap: "wrap" }}>
                  <div>
                    <span className="section-kicker">ULANGI · PAHAMI · TUNTASKAN</span>
                    <h1 style={{ margin: "4px 0 8px", fontSize: "clamp(24px, 2.5vw, 32px)", fontWeight: 800, letterSpacing: "-0.03em", color: "#18211e" }}>
                      Bank Kesalahan
                    </h1>
                    <p style={{ margin: 0, color: "#6f7a74", fontSize: 13.5, lineHeight: 1.6, maxWidth: 580 }}>
                      Kumpulan butir soal yang pernah menjebakmu, lengkap dengan diagnosis penyebab dan jalur latihan ulang sampai tuntas.
                    </p>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    {/* Scope Filter Buttons: Modul Ini vs Semua Modul */}
                    {activeDocId && (
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 3, backgroundColor: "#ffffff", padding: 3, borderRadius: 8, border: "1px solid #dce2da" }}>
                        <button
                          onClick={() => setMistakeFilterScope("current")}
                          style={{
                            backgroundColor: mistakeFilterScope === "current" ? "#19231f" : "transparent",
                            color: mistakeFilterScope === "current" ? "#c8f064" : "#5f6b66",
                            border: "none",
                            borderRadius: 6,
                            padding: "6px 12px",
                            fontSize: 11.5,
                            fontWeight: 700,
                            cursor: "pointer",
                            transition: "0.15s ease"
                          }}
                          title="Tampilkan hanya soal salah dari modul aktif"
                        >
                          Modul Ini ({activeDocMistakes.length})
                        </button>
                        <button
                          onClick={() => setMistakeFilterScope("all")}
                          style={{
                            backgroundColor: mistakeFilterScope === "all" ? "#19231f" : "transparent",
                            color: mistakeFilterScope === "all" ? "#c8f064" : "#5f6b66",
                            border: "none",
                            borderRadius: 6,
                            padding: "6px 12px",
                            fontSize: 11.5,
                            fontWeight: 700,
                            cursor: "pointer",
                            transition: "0.15s ease"
                          }}
                          title="Tampilkan seluruh catatan soal salah dari semua modul"
                        >
                          Semua Modul ({mistakes.length})
                        </button>
                      </div>
                    )}

                    <span className="card-count">
                      {displayedMistakes.length > 0 ? `${displayedMistakes.length} butir soal` : "Kosong"}
                    </span>

                    {displayedMistakes.length > 0 && (
                      <button
                        onClick={startMistakeDrill}
                        style={{
                          backgroundColor: "#c8f064",
                          color: "#18211e",
                          border: "none",
                          borderRadius: 8,
                          padding: "8px 16px",
                          fontSize: 12.5,
                          fontWeight: 800,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          boxShadow: "0 4px 14px rgba(200, 240, 100, 0.25)"
                        }}
                      >
                        <Target size={14} />
                        <span>Drill {mistakeFilterScope === "current" && activeDocId ? "Modul Ini" : "Semua"} ({displayedMistakes.length}) →</span>
                      </button>
                    )}

                    {displayedMistakes.length > 0 && (
                      <button
                        onClick={handleClearMistakes}
                        style={{
                          backgroundColor: "#fafbf8",
                          color: "#991b1b",
                          border: "1px solid #fecaca",
                          borderRadius: 8,
                          padding: "8px 12px",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 5
                        }}
                        title="Kosongkan catatan kesalahan"
                      >
                        <Trash2 size={13} />
                        <span>Bersihkan</span>
                      </button>
                    )}
                  </div>
                </div>

                {displayedMistakes.length === 0 ? (
                  <div className="mistakes-empty">
                    <span>00</span>
                    <h2>Belum ada catatan kesalahan</h2>
                    <p>
                      {mistakeFilterScope === "current" && activeDocId && mistakes.length > 0
                        ? `Seluruh soal pada modul ini berhasil dikuasai! Terdapat ${mistakes.length} catatan pada modul lain.`
                        : "Jawaban keliru dari Latihan Soal akan otomatis muncul di sini untuk dilatih ulang."}
                    </p>
                    <button
                      className="check-answer"
                      style={{ width: "auto", margin: "20px auto 0", padding: "10px 22px", borderRadius: 8 }}
                      onClick={() => setActiveTab("quiz")}
                    >
                      Mulai Latihan Soal <span>→</span>
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {displayedMistakes.map((m, idx) => {
                      const badge = getSubjectBadge(m.docTitle || activeDocTitle || "Modul");
                      return (
                        <article key={m.id} className="mistake-card">
                          <div className="mistake-card-top">
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span
                                style={{
                                  backgroundColor: badge.bg,
                                  color: badge.color,
                                  border: `1px solid ${badge.border}`,
                                  padding: "3px 9px",
                                  borderRadius: 6,
                                  fontSize: 10.5,
                                  fontWeight: 800,
                                  letterSpacing: "0.5px",
                                  textTransform: "uppercase"
                                }}
                              >
                                {badge.label}
                              </span>
                              <span style={{ fontSize: 11, color: "#89938f", fontFamily: "'DM Mono', monospace" }}>
                                {m.docTitle || "Latihan Mandiri"} · Soal {idx + 1}
                              </span>
                            </div>
                            <strong>Belum tuntas</strong>
                          </div>

                          <h2>
                            <MathView text={m.question} />
                          </h2>

                          {/* Hero formula box if present */}
                          {m.formula && (
                            <div className="mistake-formula">
                              <MathView text={m.formula} />
                            </div>
                          )}

                          {/* Diagnosis Grid */}
                          <div className="mistake-diagnosis">
                            <div>
                              <span>PENYEBAB KESALAHAN</span>
                              <p>
                                <MathView text={m.pitfall || "Terjebak distractor atau keliru menerapkan rumus saat analisis opsi."} />
                              </p>
                            </div>
                            <div>
                              <span>KONSEP YANG DIULANG</span>
                              <p>
                                <MathView text={m.concept || m.explanation || "Review kembali kaidah pembeda konsep dan langkah eliminasi biner."} />
                              </p>
                            </div>
                          </div>

                          {/* User answer vs Key comparison */}
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                            <div
                              style={{
                                backgroundColor: "#fdf4f2",
                                border: "1px solid #f8dcd6",
                                borderRadius: 9,
                                padding: "12px 14px"
                              }}
                            >
                              <div style={{ fontSize: 10, fontWeight: 800, color: "#a2574a", textTransform: "uppercase", letterSpacing: "0.8px", fontFamily: "'DM Mono', monospace", marginBottom: 4 }}>
                                Jawaban Anda (Keliru)
                              </div>
                              <div style={{ fontSize: 13, color: "#8a4437" }}>
                                {m.options && m.options[m.userAnswerIndex] ? (
                                  <MathView text={m.options[m.userAnswerIndex]} />
                                ) : (
                                  "Tidak terjawab"
                                )}
                              </div>
                            </div>

                            <div
                              style={{
                                backgroundColor: "#f2f8eb",
                                border: "1px solid #dbe8cb",
                                borderRadius: 9,
                                padding: "12px 14px"
                              }}
                            >
                              <div style={{ fontSize: 10, fontWeight: 800, color: "#566b36", textTransform: "uppercase", letterSpacing: "0.8px", fontFamily: "'DM Mono', monospace", marginBottom: 4 }}>
                                Kunci Jawaban Benar
                              </div>
                              <div style={{ fontSize: 13, color: "#364a1e" }}>
                                {m.options && m.options[m.correctIndex] ? (
                                  <MathView text={m.options[m.correctIndex]} />
                                ) : (
                                  "Opsi Benar"
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Steps breakdown if present */}
                          {m.steps && m.steps.length > 0 && (
                            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 6 }}>
                              <div style={{ fontSize: 10, fontWeight: 800, color: "#7b914e", textTransform: "uppercase", letterSpacing: "0.8px", fontFamily: "'DM Mono', monospace", marginBottom: 2 }}>
                                Langkah Pembahasan Terstruktur
                              </div>
                              {m.steps.map((st: any, sIdx: number) => (
                                <div
                                  key={sIdx}
                                  style={{
                                    backgroundColor: "#f8f9f5",
                                    border: "1px solid #dce2da",
                                    borderRadius: 8,
                                    padding: "9px 13px",
                                    fontSize: 12.5,
                                    color: "#18211e",
                                    display: "flex",
                                    gap: 8
                                  }}
                                >
                                  <span style={{ fontWeight: 800, color: "#566b36", fontFamily: "'DM Mono', monospace" }}>
                                    {typeof st === "object" && st?.step ? st.step : (sIdx + 1)}.
                                  </span>
                                  <div>
                                    {typeof st === "string" ? (
                                      <MathView text={st} />
                                    ) : (
                                      <>
                                        {st?.title && <strong style={{ color: "#18211e" }}>{st.title}: </strong>}
                                        {st?.desc && <MathView text={st.desc} />}
                                        {st?.formula && (
                                          <div style={{ marginTop: 4, fontFamily: "'DM Mono', monospace", color: "#465f33" }}>
                                            <MathView text={st.formula} />
                                          </div>
                                        )}
                                      </>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Action footer */}
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 16, paddingTop: 14, borderTop: "1px solid #f0f2ee", flexWrap: "wrap" }}>
                            <div style={{ fontSize: 11, color: "#89938f", fontFamily: "'DM Mono', monospace" }}>
                              Dicatat {new Date(m.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <button
                                onClick={() => deleteMistake(m.id)}
                                title="Hapus soal ini dari Bank Kesalahan"
                                style={{
                                  backgroundColor: "transparent",
                                  border: "1px solid #dce2da",
                                  color: "#7b8580",
                                  borderRadius: 7,
                                  padding: "7px 12px",
                                  fontSize: 11.5,
                                  fontWeight: 600,
                                  cursor: "pointer"
                                }}
                              >
                                Hapus
                              </button>

                              <button
                                onClick={() => { if (setActiveTab) setActiveTab("quiz"); }}
                                style={{
                                  backgroundColor: "#19231f",
                                  color: "#c8f064",
                                  border: "none",
                                  borderRadius: 8,
                                  padding: "8px 16px",
                                  fontSize: 12.5,
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 6
                                }}
                              >
                                <Play size={13} fill="#c8f064" />
                                <span>Mulai Latihan Bebas</span>
                              </button>

                              <button
                                onClick={() => {
                                  if (m.docId && m.docId !== activeDocId) {
                                    loadDocument(m.docId);
                                  }
                                  // Setup single drill question
                                  if (setQuizQuestions) {
                                    setQuizQuestions([{
                                      id: "mistake_single_" + m.id,
                                      question: m.question,
                                      options: m.options || ["A", "B", "C", "D"],
                                      correctAnswer: m.correctIndex !== undefined ? m.correctIndex : m.correct_index,
                                      correctIndex: m.correctIndex !== undefined ? m.correctIndex : m.correct_index,
                                      explanation: m.explanation || m.concept || "Ulangi penalaran konsep.",
                                      formula: m.formula || "",
                                      steps: m.steps || []
                                    }]);
                                  }
                                  if (setUserAnswers) setUserAnswers({});
                                  if (setIsAnswerSubmitted) setIsAnswerSubmitted(false);
                                  if (setCurrentQuestionIndex) setCurrentQuestionIndex(0);
                                  if (setActiveTab) setActiveTab("quiz");
                                }}
                                style={{
                                  backgroundColor: "#19231f",
                                  color: "#c8f064",
                                  border: "none",
                                  borderRadius: 7,
                                  padding: "7px 14px",
                                  fontSize: 11.5,
                                  fontWeight: 800,
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 5
                                }}
                              >
                                <span>Latih Ulang Soal Ini</span>
                                <span>→</span>
                              </button>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
  );
}
