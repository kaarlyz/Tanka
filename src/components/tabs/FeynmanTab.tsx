import React from "react";
import { Brain, Mic, MicOff, Sparkles, CheckCircle2, AlertTriangle, Lightbulb } from "lucide-react";
import { MathView } from "../common/MathView";
import { AIProcessLoader } from "../common/AIProcessLoader";
import { FeynmanResult } from "../../types";

export interface FeynmanTabProps {
  feynmanTopic: string;
  setFeynmanTopic: (t: string) => void;
  feynmanExplanation: string;
  setFeynmanExplanation: (e: string) => void;
  feynmanResult: FeynmanResult | null;
  isRecordingFeynman: boolean;
  feynmanRecordingSeconds: number;
  isEvaluatingFeynman: boolean;
  handleToggleFeynmanRecording: () => void;
  handleEvaluateFeynman: () => void;
}

export function FeynmanTab({
  feynmanTopic,
  setFeynmanTopic,
  feynmanExplanation,
  setFeynmanExplanation,
  feynmanResult,
  isRecordingFeynman,
  feynmanRecordingSeconds,
  isEvaluatingFeynman,
  handleToggleFeynmanRecording,
  handleEvaluateFeynman,
}: FeynmanTabProps) {
  return (
              <div className="tab-pane-animate" style={{ maxWidth: 960, margin: "0 auto" }}>
                <div style={{ marginBottom: 18 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Brain size={20} color="#4b6623" />
                    <h2 style={{ fontSize: 19, fontWeight: 800, letterSpacing: "-0.02em", color: "#17201d" }}>
                      Mode Feynman: Uji Pemahaman Sendiri
                    </h2>
                  </div>
                  <p style={{ fontSize: 12.5, color: "#6f7975", marginTop: 4 }}>
                    Jelaskan kembali suatu konsep dengan kata-kata sendiri. AI akan menguji akurasi, mendeteksi miskonsepsi, dan memberi analogi pengunci memori.
                  </p>
                </div>

                <div
                  style={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #dde1da",
                    borderRadius: 12,
                    padding: "24px 26px",
                    marginBottom: 18,
                    boxShadow: "0 10px 35px rgba(27, 39, 35, 0.04)"
                  }}
                >
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#45544e", marginBottom: 6 }}>
                      Konsep atau Istilah yang Ingin Dijelaskan
                    </label>
                    <input
                      type="text"
                      value={feynmanTopic}
                      onChange={(e) => setFeynmanTopic(e.target.value)}
                      placeholder="Contoh: Arbitrase vs Mediasi, Hukum Permintaan..."
                      style={{
                        width: "100%",
                        backgroundColor: "#fafbf8",
                        border: "1px solid #dce1da",
                        borderRadius: 8,
                        padding: "10px 14px",
                        fontSize: 14,
                        color: "#17201d",
                        outline: "none"
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <label style={{ fontSize: 12, fontWeight: 700, color: "#45544e" }}>
                        Penjelasan Anda (Gunakan bahasa sendiri atau rekam suara)
                      </label>
                      <button
                        type="button"
                        onClick={handleToggleFeynmanRecording}
                        style={{
                          backgroundColor: isRecordingFeynman ? "#fee2e2" : "#f1f5eb",
                          border: `1px solid ${isRecordingFeynman ? "#fca5a5" : "#cddfc0"}`,
                          color: isRecordingFeynman ? "#b91c1c" : "#3b581e",
                          borderRadius: 6,
                          padding: "4px 10px",
                          fontSize: 11.5,
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                          transition: "all 0.15s ease"
                        }}
                      >
                        {isRecordingFeynman ? (
                          <>
                            <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#ef4444" }} />
                            <span>Merekam ({Math.floor(feynmanRecordingSeconds / 60)}:{String(feynmanRecordingSeconds % 60).padStart(2, "0")}) · Klik Selesai</span>
                          </>
                        ) : (
                          <>
                            <Mic size={13} color="#4b6623" />
                            <span>Rekam Suara</span>
                          </>
                        )}
                      </button>
                    </div>
                    <textarea
                      rows={5}
                      value={feynmanExplanation}
                      onChange={(e) => setFeynmanExplanation(e.target.value)}
                      placeholder={isRecordingFeynman ? "Mendengarkan ucapan Anda... Teruslah berbicara..." : "Tuliskan pemahaman Anda di sini atau gunakan 'Rekam Suara' untuk menjelaskan lisan..."}
                      style={{
                        width: "100%",
                        backgroundColor: isRecordingFeynman ? "#fafdf5" : "#fafbf8",
                        border: `1px solid ${isRecordingFeynman ? "#779f2f" : "#dce1da"}`,
                        borderRadius: 8,
                        padding: "12px 14px",
                        fontSize: 14,
                        lineHeight: "1.6",
                        color: "#17201d",
                        outline: "none",
                        resize: "vertical",
                        transition: "border-color 0.2s ease"
                      }}
                    />
                  </div>

                  <button
                    onClick={handleEvaluateFeynman}
                    disabled={isEvaluatingFeynman || !feynmanExplanation.trim()}
                    style={{
                      backgroundColor: "#18221f",
                      color: "#c8f064",
                      border: "none",
                      borderRadius: 8,
                      padding: "10px 18px",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: isEvaluatingFeynman || !feynmanExplanation.trim() ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6
                    }}
                  >
                    <Sparkles size={15} />
                    {isEvaluatingFeynman ? "Mengevaluasi Penjelasan..." : "Uji & Nilai Pemahaman Saya"}
                  </button>
                </div>

                {/* Feynman Evaluation Live Progress Loader */}
                {isEvaluatingFeynman && (
                  <AIProcessLoader
                    title="Mengevaluasi Penjelasan Feynman"
                    subtitle="AI menganalisis gaya bahasa, memeriksa keakuratan materi, dan mendeteksi istilah rumit (jargon)."
                    badge="Evaluasi Pemahaman"
                    steps={[
                      { label: "Menganalisis Gaya Bahasa & Kesederhanaan", detail: "Mengecek apakah konsep dijelaskan dengan bahasa sendiri yang lugas." },
                      { label: "Memverifikasi Kebenaran Fakta", detail: "Mencocokkan penjelasan dengan konsep kunci pada modul belajar." },
                      { label: "Mendeteksi Miskonsepsi & Jargon", detail: "Menandai istilah hafalan yang belum diurai secara sederhana." },
                      { label: "Menghitung Skor & Analogi Perbaikan", detail: "Menyiapkan rekomendasi perbaikan dan analogi baru untuk mengunci pemahaman." }
                    ]}
                  />
                )}

                {/* Feynman Evaluation Feedback Card */}
                {feynmanResult && (
                  <div
                    style={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #dde1da",
                      borderRadius: 12,
                      padding: "24px 26px",
                      boxShadow: "0 10px 35px rgba(27, 39, 35, 0.04)"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                      <div>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 800,
                            textTransform: "uppercase",
                            letterSpacing: "1.2px",
                            color: "#566b36",
                            backgroundColor: "#edf4e3",
                            border: "1px solid #d7e5c5",
                            padding: "4px 10px",
                            borderRadius: 20,
                            fontFamily: "'DM Mono', monospace"
                          }}
                        >
                          {feynmanResult.verdict}
                        </span>
                        <h3 style={{ fontSize: 17, fontWeight: 800, color: "#18211e", marginTop: 8 }}>
                          Analisis Retensi Memori Aktif
                        </h3>
                      </div>
                      <div style={{ textAlign: "right", display: "flex", alignItems: "center", gap: 12 }}>
                        <div
                          style={{
                            width: 60,
                            height: 60,
                            borderRadius: "50%",
                            backgroundColor: "#c8f064",
                            color: "#18211e",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontFamily: "'DM Mono', monospace",
                            fontSize: 20,
                            fontWeight: 800
                          }}
                        >
                          {feynmanResult.score}
                        </div>
                      </div>
                    </div>

                    {/* Accurate Points */}
                    {feynmanResult.accuratePoints?.length > 0 && (
                      <div style={{ marginBottom: 14, padding: "14px 16px", backgroundColor: "#e6eedc", border: "1px solid #c9dec2", borderRadius: 9 }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: "#364a1e", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 6, display: "flex", alignItems: "center", gap: 6, fontFamily: "'DM Mono', monospace" }}>
                          <CheckCircle2 size={14} color="#566b36" /> Poin yang Dipahami dengan Tepat
                        </div>
                        <ul style={{ paddingLeft: 18, fontSize: 13, color: "#18211e", lineHeight: "1.6" }}>
                          {feynmanResult.accuratePoints.map((pt, i) => (
                            <li key={i}><MathView text={pt} /></li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Missed Nuances */}
                    {feynmanResult.missedOrFlawedPoints?.length > 0 && (
                      <div style={{ marginBottom: 14, padding: "14px 16px", backgroundColor: "#faece8", border: "1px solid #f2d5ce", borderRadius: 9 }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: "#a2574a", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 6, display: "flex", alignItems: "center", gap: 6, fontFamily: "'DM Mono', monospace" }}>
                          <AlertTriangle size={14} color="#a2574a" /> Bagian yang Kurang Presisi / Perlu Diperdalam
                        </div>
                        <ul style={{ paddingLeft: 18, fontSize: 13, color: "#55625c", lineHeight: "1.6" }}>
                          {feynmanResult.missedOrFlawedPoints.map((pt, i) => (
                            <li key={i}><MathView text={pt} /></li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Perfect Analogy Box */}
                    {feynmanResult.perfectAnalogy && (
                      <div
                        style={{
                          backgroundColor: "#f4f6f1",
                          border: "1px solid #dce2da",
                          borderRadius: 9,
                          padding: "14px 16px",
                          marginBottom: 14
                        }}
                      >
                        <div style={{ fontSize: 11, fontWeight: 800, color: "#566b36", display: "flex", alignItems: "center", gap: 6, marginBottom: 4, letterSpacing: "0.8px", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>
                          <Lightbulb size={15} color="#566b36" /> Analogi Pengunci Memori
                        </div>
                        <div style={{ fontSize: 13, color: "#18211e", lineHeight: "1.6" }}>
                          <MathView text={feynmanResult.perfectAnalogy} />
                        </div>
                      </div>
                    )}

                    {/* Overall Coach Feedback */}
                    <div style={{ fontSize: 13, color: "#55625c", lineHeight: "1.6", borderTop: "1px solid #dce2da", paddingTop: 12 }}>
                      <strong style={{ color: "#18211e" }}>Catatan Nara: </strong>
                      <MathView text={feynmanResult.feedback} />
                    </div>
                  </div>
                )}
              </div>
  );
}
