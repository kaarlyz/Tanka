import { useState } from "react";
import {
  Sparkles,
  HelpCircle,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Plus,
  Copy,
  ChevronRight,
  ChevronLeft,
  MessageSquare
} from "lucide-react";
import { QuizQuestion, MistakeItem } from "../../types";
import { MathView } from "../common/MathView";
import { AIProcessLoader } from "../common/AIProcessLoader";

export interface QuizTabProps {
  quizzes: QuizQuestion[];
  activeDocId: string | null;
  activeDocTitle: string;
  onGenerateQuiz: (params?: {
    customPrompt?: string;
    quizStyle?: string;
    focusConcept?: string;
    mode?: "append" | "replace" | "variant";
    count?: number;
  }) => Promise<void> | void;
  isGeneratingQuiz: boolean;
  onRecordMistake: (item: Partial<MistakeItem>) => Promise<void> | void;
  onAskAIAboutQuestion?: (q: QuizQuestion, questionText: string) => void;
  showNotice: (msg: string) => void;
}

export function QuizTab({
  quizzes,
  activeDocTitle,
  onGenerateQuiz,
  isGeneratingQuiz,
  onRecordMistake,
  onAskAIAboutQuestion,
  showNotice
}: QuizTabProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [isAnswerRevealed, setIsAnswerRevealed] = useState<Record<number, boolean>>({});
  const [quizCount, setQuizCount] = useState(5);
  const [customPrompt, setCustomPrompt] = useState("");
  const [quizStyle, setQuizStyle] = useState("conceptual");
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const currentQ = quizzes[currentIdx];
  const totalQ = quizzes.length;

  const handleSelectOption = (optIdx: number) => {
    if (isAnswerRevealed[currentIdx]) return;

    setUserAnswers((prev) => ({ ...prev, [currentIdx]: optIdx }));
    setIsAnswerRevealed((prev) => ({ ...prev, [currentIdx]: true }));

    if (currentQ && optIdx !== currentQ.correctIndex) {
      onRecordMistake({
        question: currentQ.question,
        options: currentQ.options,
        correctIndex: currentQ.correctIndex,
        userAnswerIndex: optIdx,
        formula: currentQ.formula,
        steps: currentQ.steps,
        explanation: currentQ.explanation,
        pitfall: currentQ.pitfall
      });
      showNotice("Jawaban dicatat ke Bank Kesalahan untuk dipelajari lagi.");
    }
  };

  const handleReset = () => {
    setUserAnswers({});
    setIsAnswerRevealed({});
    setCurrentIdx(0);
    showNotice("Kuis direset");
  };

  const handleCopyQuestion = () => {
    if (!currentQ) return;
    const text = `Soal:\n${currentQ.question}\n\nPilihan:\n${currentQ.options.map((o, i) => `${String.fromCharCode(65 + i)}. ${o}`).join("\n")}`;
    navigator.clipboard.writeText(text);
    setCopiedIdx(currentIdx);
    showNotice("Soal disalin ke clipboard");
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const calculateScore = () => {
    let correct = 0;
    quizzes.forEach((q, idx) => {
      if (userAnswers[idx] === q.correctIndex) correct++;
    });
    return Math.round((correct / (quizzes.length || 1)) * 100);
  };

  const answeredCount = Object.keys(userAnswers).length;

  return (
    <div className="tab-pane-animate" style={{ maxWidth: 940, margin: "0 auto", paddingBottom: 48 }}>
      {/* Realtime AI Adaptive Quiz Customizer Bar */}
      <div
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid #dde1da",
          borderRadius: 12,
          padding: "16px 18px",
          marginBottom: 18,
          boxShadow: "0 4px 15px rgba(27, 39, 35, 0.03)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <Sparkles size={16} color="#566b36" />
            <span style={{ fontSize: 13, fontWeight: 800, color: "#17201d" }}>
              Kustomisasi Soal AI Real-Time
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11.5, color: "#6b7280" }}>Jumlah Soal:</span>
            <select
              value={quizCount}
              onChange={(e) => setQuizCount(Number(e.target.value))}
              style={{
                backgroundColor: "#f8f9f5",
                border: "1px solid #dce1da",
                borderRadius: 6,
                padding: "3px 8px",
                fontSize: 12,
                color: "#18211e",
                outline: "none"
              }}
            >
              {[3, 5, 10, 15, 20].map((n) => (
                <option key={n} value={n}>{n} Butir</option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Style Chips */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
          {[
            { label: "🔄 Buat Soal Sejenis / Kloning", prompt: "Buatkan variasi latihan soal kloning (pola dan tingkat kesulitan sama, angka/fungsi berbeda) untuk uji mandiri." },
            { label: "🎯 Banyakin Soal HOTS / Jebakan", prompt: "Perbanyak butir soal tingkat penalaran tinggi (HOTS) dengan jebakan aljabar yang sering mengecoh." },
            { label: "💡 Soal Pemahaman Konsep Dasar", prompt: "Fokus ke pemahaman definisi dasar dan makna fisis/geometris sebelum perhitungan aljabar." },
            { label: "📚 Soal Cerita & Studi Kasus", prompt: "Buat bentuk soal cerita kontekstual dunia nyata yang menerapkan konsep ini." },
            { label: "📐 Fokus Hitung Aljabar & KaTeX", prompt: "Fokus ke penurunan rumus langkah demi langkah dan ketelitian substitusi aljabar." }
          ].map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCustomPrompt(chip.prompt)}
              style={{
                backgroundColor: customPrompt === chip.prompt ? "#18221f" : "#f4f6f2",
                color: customPrompt === chip.prompt ? "#c8f064" : "#45544e",
                border: `1px solid ${customPrompt === chip.prompt ? "#18221f" : "#dce1da"}`,
                borderRadius: 999,
                padding: "4px 10px",
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Custom Input & Action Buttons */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input
            type="text"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Ketik keinginan Anda: misal 'buat soal sejenis angka beda', 'banyakin soal tentang dilatasi kurva'..."
            style={{
              flex: 1,
              minWidth: 260,
              backgroundColor: "#f8f9f5",
              border: "1px solid #dce1da",
              borderRadius: 8,
              padding: "8px 12px",
              fontSize: 12.5,
              color: "#18211e",
              outline: "none"
            }}
          />

          <button
            type="button"
            onClick={() => onGenerateQuiz({ customPrompt, count: quizCount, quizStyle, mode: "replace" })}
            disabled={isGeneratingQuiz}
            style={{
              backgroundColor: "#18221f",
              color: "#c8f064",
              border: "none",
              borderRadius: 8,
              padding: "8px 14px",
              fontSize: 12,
              fontWeight: 700,
              cursor: isGeneratingQuiz ? "not-allowed" : "pointer"
            }}
          >
            {isGeneratingQuiz ? "Menyusun..." : "Susun Ulang Kuis"}
          </button>

          <button
            type="button"
            onClick={() => onGenerateQuiz({ customPrompt, count: quizCount, quizStyle, mode: "append" })}
            disabled={isGeneratingQuiz || quizzes.length === 0}
            style={{
              backgroundColor: "#ffffff",
              color: "#18211e",
              border: "1px solid #dce1da",
              borderRadius: 8,
              padding: "8px 12px",
              fontSize: 12,
              fontWeight: 600,
              cursor: isGeneratingQuiz || quizzes.length === 0 ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4
            }}
          >
            <Plus size={13} />
            <span>Tambah</span>
          </button>

          <button
            type="button"
            onClick={() => onGenerateQuiz({ customPrompt, count: quizCount, quizStyle, mode: "variant" })}
            disabled={isGeneratingQuiz}
            style={{
              backgroundColor: "#f0fdf4",
              color: "#166534",
              border: "1px solid #bbf7d0",
              borderRadius: 8,
              padding: "8px 12px",
              fontSize: 12,
              fontWeight: 700,
              cursor: isGeneratingQuiz ? "not-allowed" : "pointer"
            }}
            title="Simpan sebagai dokumen modul latihan terpisah"
          >
            Varian Baru
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isGeneratingQuiz && (
        <AIProcessLoader
          title="Menyusun Butir Soal Latihan Cerdas"
          subtitle="AI membedah konsep kurva & matriks, merumuskan opsi pengecoh berbobot, dan mengunci pembahasan KaTeX."
          badge="Adaptive Quiz Engine"
          steps={[
            { label: "Menganalisis Tingkat Kesulitan", detail: "Menyesuaikan butir soal dengan instruksi kustom Anda." },
            { label: "Menyusun Pengecoh Masuk Akal", detail: "Membuat opsi jawaban salah yang berbasis miskonsepsi umum." },
            { label: "Memvalidasi Sintaks KaTeX & Pembahasan", detail: "Menyusun langkah penurunan rumus bertahap." }
          ]}
        />
      )}

      {/* Main Question Card or Empty State */}
      {!isGeneratingQuiz && quizzes.length === 0 ? (
        <div
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #dde1da",
            borderRadius: 14,
            padding: "44px 20px",
            textAlign: "center"
          }}
        >
          <HelpCircle size={36} color="#727d78" style={{ margin: "0 auto 12px" }} />
          <h3 style={{ fontSize: 17, fontWeight: 800, color: "#17201d", margin: "0 0 6px" }}>
            Belum Ada Latihan Soal
          </h3>
          <p style={{ fontSize: 13, color: "#6f7975", maxWidth: 440, margin: "0 auto 18px", lineHeight: 1.5 }}>
            Klik tombol di bawah agar AI menyusun butir soal latihan adaptif beserta pembahasan langkah demi langkah.
          </p>
          <button
            type="button"
            onClick={() => onGenerateQuiz({ count: 5 })}
            style={{
              backgroundColor: "#18221f",
              color: "#c8f064",
              border: "none",
              borderRadius: 8,
              padding: "10px 22px",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            Buat 5 Soal Latihan Sekarang
          </button>
        </div>
      ) : !isGeneratingQuiz && currentQ && (
        <div>
          {/* Header Progress Stepper */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: "#18211e", fontFamily: "'DM Mono', monospace" }}>
                Soal {currentIdx + 1} dari {totalQ}
              </span>
              <span style={{ fontSize: 11, color: "#6b7280" }}>
                ({answeredCount}/{totalQ} Terjawab · Skor: {calculateScore()}%)
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button
                type="button"
                onClick={handleCopyQuestion}
                style={{
                  background: "#ffffff",
                  border: "1px solid #dce1da",
                  borderRadius: 6,
                  padding: "4px 8px",
                  fontSize: 11,
                  color: copiedIdx === currentIdx ? "#10b981" : "#4b5563",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 4
                }}
              >
                <Copy size={12} />
                <span>{copiedIdx === currentIdx ? "Tersalin!" : "Salin"}</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                style={{
                  background: "#ffffff",
                  border: "1px solid #dce1da",
                  borderRadius: 6,
                  padding: "4px 8px",
                  fontSize: 11,
                  color: "#4b5563",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 4
                }}
              >
                <RotateCcw size={12} />
                <span>Ulangi</span>
              </button>
            </div>
          </div>

          {/* Question Card */}
          <div
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #dde1da",
              borderRadius: 14,
              padding: "24px 26px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
              marginBottom: 16
            }}
          >
            {/* Question Text */}
            <div style={{ fontSize: 15.5, fontWeight: 700, color: "#18211e", lineHeight: 1.6, marginBottom: 18 }}>
              <MathView text={currentQ.question} />
            </div>

            {/* Optional Formula Box */}
            {currentQ.formula && (
              <div
                style={{
                  backgroundColor: "#19231f",
                  borderRadius: 8,
                  padding: "14px 18px",
                  textAlign: "center",
                  marginBottom: 18,
                  overflowX: "auto"
                }}
              >
                <MathView text={`$$${currentQ.formula}$$`} />
              </div>
            )}

            {/* Options List */}
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {currentQ.options.map((opt, optIdx) => {
                const isSelected = userAnswers[currentIdx] === optIdx;
                const isRevealed = isAnswerRevealed[currentIdx];
                const isCorrect = optIdx === currentQ.correctIndex;

                let bg = "#fbfcf9";
                let border = "#dce1da";
                let textCol = "#18211e";

                if (isRevealed) {
                  if (isCorrect) {
                    bg = "#f0fdf4";
                    border = "#86efac";
                    textCol = "#166534";
                  } else if (isSelected) {
                    bg = "#fef2f2";
                    border = "#fca5a5";
                    textCol = "#991b1b";
                  }
                } else if (isSelected) {
                  bg = "#edf4e3";
                  border = "#566b36";
                  textCol = "#2d4414";
                }

                return (
                  <button
                    key={optIdx}
                    type="button"
                    onClick={() => handleSelectOption(optIdx)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "12px 16px",
                      borderRadius: 9,
                      border: `1.5px solid ${border}`,
                      backgroundColor: bg,
                      color: textCol,
                      fontSize: 13.5,
                      fontWeight: isSelected ? 700 : 500,
                      textAlign: "left",
                      cursor: isRevealed ? "default" : "pointer",
                      transition: "all 0.15s ease"
                    }}
                  >
                    <span
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: "50%",
                        backgroundColor: isRevealed && isCorrect ? "#22c55e" : isRevealed && isSelected ? "#ef4444" : isSelected ? "#566b36" : "#e5e7eb",
                        color: isSelected || (isRevealed && (isCorrect || isSelected)) ? "#ffffff" : "#4b5563",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        fontWeight: 800,
                        flexShrink: 0
                      }}
                    >
                      {String.fromCharCode(65 + optIdx)}
                    </span>
                    <div style={{ flex: 1 }}>
                      <MathView text={opt} />
                    </div>

                    {isRevealed && isCorrect && <CheckCircle2 size={18} color="#16a34a" />}
                    {isRevealed && isSelected && !isCorrect && <XCircle size={18} color="#dc2626" />}
                  </button>
                );
              })}
            </div>

            {/* Explanation & Pitfall (Shown when answered) */}
            {isAnswerRevealed[currentIdx] && (
              <div
                className="modal-scale-in"
                style={{
                  marginTop: 20,
                  paddingTop: 18,
                  borderTop: "1px solid #edf0eb",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12
                }}
              >
                {/* Step-by-step Explanation */}
                {currentQ.explanation && (
                  <div style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "14px 16px" }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: "#1e293b", marginBottom: 6 }}>
                      💡 Pembahasan Langkah Pengerjaan:
                    </div>
                    <div style={{ fontSize: 13, color: "#334155", lineHeight: 1.6 }}>
                      <MathView text={currentQ.explanation} />
                    </div>
                  </div>
                )}

                {/* Common Pitfall Alert */}
                {currentQ.pitfall && (
                  <div style={{ backgroundColor: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <AlertTriangle size={16} color="#d97706" style={{ flexShrink: 0, marginTop: 2 }} />
                    <div style={{ fontSize: 12.5, color: "#92400e", lineHeight: 1.5 }}>
                      <strong>Titik Rawan Kesalahan: </strong>
                      <MathView text={currentQ.pitfall} />
                    </div>
                  </div>
                )}

                {/* Ask AI about this question trigger */}
                {onAskAIAboutQuestion && (
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button
                      type="button"
                      onClick={() => onAskAIAboutQuestion(currentQ, currentQ.question)}
                      style={{
                        backgroundColor: "#f4f6f2",
                        border: "1px solid #dce1da",
                        borderRadius: 7,
                        padding: "6px 12px",
                        fontSize: 11.5,
                        fontWeight: 700,
                        color: "#374151",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 5
                      }}
                    >
                      <MessageSquare size={13} color="#566b36" />
                      <span>Tanyakan Soal Ini ke Tutor AI</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Stepper Navigation Buttons */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button
              type="button"
              onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
              disabled={currentIdx === 0}
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #dce1da",
                borderRadius: 8,
                padding: "8px 16px",
                fontSize: 12.5,
                fontWeight: 600,
                color: currentIdx === 0 ? "#9ca3af" : "#18211e",
                cursor: currentIdx === 0 ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: 5
              }}
            >
              <ChevronLeft size={15} />
              <span>Sebelumnya</span>
            </button>

            <div style={{ display: "flex", gap: 5 }}>
              {quizzes.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCurrentIdx(i)}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    border: `1px solid ${i === currentIdx ? "#18211e" : "#dce1da"}`,
                    backgroundColor: i === currentIdx ? "#18211e" : isAnswerRevealed[i] ? (userAnswers[i] === quizzes[i].correctIndex ? "#dcfce7" : "#fee2e2") : "#ffffff",
                    color: i === currentIdx ? "#c8f064" : isAnswerRevealed[i] ? (userAnswers[i] === quizzes[i].correctIndex ? "#166534" : "#991b1b") : "#4b5563",
                    fontSize: 11.5,
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setCurrentIdx((i) => Math.min(totalQ - 1, i + 1))}
              disabled={currentIdx === totalQ - 1}
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #dce1da",
                borderRadius: 8,
                padding: "8px 16px",
                fontSize: 12.5,
                fontWeight: 600,
                color: currentIdx === totalQ - 1 ? "#9ca3af" : "#18211e",
                cursor: currentIdx === totalQ - 1 ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: 5
              }}
            >
              <span>Berikutnya</span>
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
