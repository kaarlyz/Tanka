import React from "react";
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
  MessageSquare,
  Clock,
  Play,
  Pause,
  Award,
  Trophy,
  BookOpen,
  Target,
  Send,
  Flag,
  Bookmark,
  Check,
  X
} from "lucide-react";
import { ActiveTab, QuizQuestion, MistakeItem, ChatMessage } from "../../types";
import { MathView } from "../common/MathView";
import { AIProcessLoader } from "../common/AIProcessLoader";

function TailorQuizBox({
  activeDocId,
  quizQuestions,
  selectedModel,
  setQuizQuestions,
  resetQuizState,
  isTailoring,
  setIsTailoring
}: any) {
  const [tailorInput, setTailorInput] = React.useState("");

  const handleTailor = async () => {
    if (!tailorInput.trim() || !activeDocId || !quizQuestions.length || !setQuizQuestions) return;
    setIsTailoring(true);
    try {
      const res = await fetch("/api/ai/tailor-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docId: activeDocId,
          currentQuiz: quizQuestions,
          tailorPrompt: tailorInput,
          model: selectedModel || "ag/gemini-3.8-flash-low"
        })
      });
      const data = await res.json();
      if (data.success && data.quizzes) {
        setQuizQuestions(data.quizzes);
        setTailorInput("");
        resetQuizState();
      } else {
        alert("Gagal menyesuaikan kuis: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      alert("Error: " + err);
    } finally {
      setIsTailoring(false);
    }
  };

  return (
    <div style={{ marginTop: 32, padding: "16px", backgroundColor: "#f0fdf4", borderRadius: 12, border: "1px solid #dcfce7" }}>
      <h3 style={{ fontSize: 13, fontWeight: 700, margin: "0 0 10px", color: "#166534", display: "flex", alignItems: "center", gap: 6 }}>
        <Sparkles size={14} color="#166534" /> 
        Sesuaikan Kuis dengan AI
      </h3>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input 
          type="text"
          value={tailorInput}
          onChange={(e) => setTailorInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleTailor();
          }}
          placeholder="Contoh: Buat soalnya lebih susah (HOTS)..."
          style={{ flex: "1 1 200px", minWidth: 0, padding: "10px 14px", borderRadius: 8, border: "1px solid #bbf7d0", backgroundColor: "#fff", color: "#166534", fontSize: 13, outline: "none" }}
          disabled={isTailoring}
        />
        <button 
          onClick={handleTailor}
          disabled={isTailoring || !tailorInput.trim()}
          style={{ 
            backgroundColor: isTailoring || !tailorInput.trim() ? "#dcfce7" : "#22c55e", 
            color: isTailoring || !tailorInput.trim() ? "#166534" : "#fff", 
            border: "none", 
            padding: "0 18px", 
            borderRadius: 8, 
            fontWeight: 700, 
            fontSize: 13,
            cursor: isTailoring || !tailorInput.trim() ? "not-allowed" : "pointer",
            transition: "all 0.2s"
          }}
        >
          {isTailoring ? "Menyesuaikan..." : "Sesuaikan"}
        </button>
      </div>
    </div>
  );
}

export interface QuizTabProps {
  quizQuestions: QuizQuestion[];
  currentQuestionIndex: number;
  setCurrentQuestionIndex: React.Dispatch<React.SetStateAction<number>>;
  quizQuestionCount: number;
  setQuizQuestionCount: any;
  quizMode: "practice" | "exam" | "study" | string;
  setQuizMode: (mode: any) => void;
  quizType: any;
  setQuizType: (t: any) => void;
  isDrillingMistakes: boolean;
  userAnswers: { [key: number]: number };
  selectedOption: number | null;
  setSelectedOption: (opt: number | null) => void;
  isAnswerSubmitted: boolean;
  isQuizCompleted: boolean;
  score: number;
  solutionStep: number;
  setSolutionStep: any;
  examTimeLeft: number;
  setExamTimeLeft: (t: number) => void;
  examDurationSeconds: number;
  setExamDurationSeconds: (d: number) => void;
  isExamTimerRunning: boolean;
  setIsExamTimerRunning: (r: boolean) => void;
  examSubmitted: boolean;
  setExamSubmitted: (s: boolean) => void;
  examFlagged: { [key: number]: boolean };
  toggleFlagQuestion: (idx: number) => void;
  isGeneratingQuiz: boolean;
  handleGenerateQuiz: (params?: any) => void;
  handleSelectQuizOption: (idx: number) => void;
  handleNextQuizQuestion: () => void;
  handlePrevQuizQuestion: () => void;
  handleExamSubmit: () => void;
  resetQuizState: () => void;
  isQuizChatOpen: boolean;
  setIsQuizChatOpen: (o: boolean) => void;
  quizChatMessages: any;
  quizChatInput: string;
  setQuizChatInput: (v: string) => void;
  isQuizChatSending: boolean;
  handleSendQuizQuestionChat: (customPrompt?: string) => void;
  activeDocTitle: string;
  activeDocId: string | null;
  setActiveTab: (tab: ActiveTab) => void;
  setMistakeFilterScope: (val: "current" | "all") => void;
  activeDocMistakes: MistakeItem[];
  mistakes: MistakeItem[];
  selectedModel?: string;
  setQuizQuestions?: (val: any) => void;
  activeRoomSession?: { roomId: string; title: string; quizCount: number } | null;
  onOpenRoomLeaderboard?: () => void;
}

export function QuizTab({
  quizQuestions,
  currentQuestionIndex,
  setCurrentQuestionIndex,
  quizQuestionCount,
  setQuizQuestionCount,
  quizMode,
  setQuizMode,
  quizType,
  setQuizType,
  isDrillingMistakes,
  userAnswers,
  selectedOption,
  setSelectedOption,
  isAnswerSubmitted,
  isQuizCompleted,
  score,
  solutionStep,
  setSolutionStep,
  examTimeLeft,
  setExamTimeLeft,
  examDurationSeconds,
  setExamDurationSeconds,
  isExamTimerRunning,
  setIsExamTimerRunning,
  examSubmitted,
  setExamSubmitted,
  examFlagged,
  toggleFlagQuestion,
  isGeneratingQuiz,
  handleGenerateQuiz,
  handleSelectQuizOption,
  handleNextQuizQuestion,
  handlePrevQuizQuestion,
  handleExamSubmit,
  resetQuizState,
  isQuizChatOpen,
  setIsQuizChatOpen,
  quizChatMessages,
  quizChatInput,
  setQuizChatInput,
  isQuizChatSending,
  handleSendQuizQuestionChat,
  activeDocTitle,
  activeDocId,
  setActiveTab,
  setMistakeFilterScope,
  activeDocMistakes,
  mistakes,
  selectedModel,
  setQuizQuestions,
  activeRoomSession,
  onOpenRoomLeaderboard
}: QuizTabProps) {
  const [isTailoring, setIsTailoring] = React.useState(false);

  const currentQuestion = quizQuestions[currentQuestionIndex];
  const isCorrect = isAnswerSubmitted && selectedOption === currentQuestion?.correctIndex;

  return (
              <div className="tab-pane-animate" style={{ maxWidth: 940, margin: "0 auto" }}>
                {/* Quiz Question Count Selector (Shown only when quiz questions already exist) */}
                {quizQuestions.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      backgroundColor: "#ffffff",
                      border: "1px solid #dde1da",
                      borderRadius: 12,
                      padding: "12px 16px",
                      marginBottom: 16,
                      boxShadow: "0 10px 35px rgba(27, 39, 35, 0.04)",
                      flexWrap: "wrap",
                      gap: 10
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#45544e" }}>Jumlah Soal:</span>
                      {[3, 5, 10, 15, 20].map((num) => (
                        <button
                          key={num}
                          onClick={() => setQuizQuestionCount(num)}
                          style={{
                            backgroundColor: quizQuestionCount === num ? "#18221f" : "#fafbf8",
                            color: quizQuestionCount === num ? "#c8f064" : "#56615d",
                            border: `1px solid ${quizQuestionCount === num ? "#18221f" : "#dce1da"}`,
                            borderRadius: 6,
                            padding: "5px 10px",
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer",
                            transition: "all 0.15s ease"
                          }}
                        >
                          {num}
                        </button>
                      ))}

                      {/* Stepper / Custom Number Input */}
                      <div style={{ display: "inline-flex", alignItems: "center", backgroundColor: "#fafbf8", border: "1px solid #dce1da", borderRadius: 6, padding: "2px 4px", gap: 2 }}>
                        <button
                          onClick={() => setQuizQuestionCount((prev) => Math.max(1, prev - 1))}
                          style={{ background: "none", border: "none", color: "#56615d", cursor: "pointer", fontSize: 14, fontWeight: 700, padding: "0 6px" }}
                          title="Kurangi 1 soal"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          max="30"
                          value={quizQuestionCount}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val)) setQuizQuestionCount(Math.max(1, Math.min(30, val)));
                          }}
                          style={{
                            width: 38,
                            textAlign: "center",
                            backgroundColor: "transparent",
                            border: "none",
                            color: "#18221f",
                            fontSize: 13,
                            fontWeight: 700,
                            fontFamily: "'DM Mono', monospace",
                            outline: "none"
                          }}
                        />
                        <button
                          onClick={() => setQuizQuestionCount((prev) => Math.min(30, prev + 1))}
                          style={{ background: "none", border: "none", color: "#56615d", cursor: "pointer", fontSize: 14, fontWeight: 700, padding: "0 6px" }}
                          title="Tambah 1 soal"
                        >
                          +
                        </button>
                      </div>
                      <span style={{ fontSize: 11, color: "#727d78" }}>butir</span>

                      {/* Quiz Focus / Difficulty Selector */}
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 3, marginLeft: 6, backgroundColor: "#fafbf8", padding: 2, borderRadius: 6, border: "1px solid #dce1da" }}>
                        {[
                          { id: "beginner", label: "Pemula", title: "Pemula & Bertahap: Mulai dari konsep dasar dan angka sederhana" },
                          { id: "conceptual", label: "Standar", title: "Standar Ujian: Pemahaman konsep dan skenario kontekstual" },
                          { id: "analytical", label: "HOTS", title: "HOTS: Analisis tingkat tinggi dan pemecahan masalah non-rutin" }
                        ].map((item) => (
                          <button
                            key={item.id}
                            onClick={() => setQuizType(item.id as any)}
                            style={{
                              backgroundColor: quizType === item.id ? "#18221f" : "transparent",
                              color: quizType === item.id ? "#c8f064" : "#56615d",
                              border: quizType === item.id ? "1px solid #18221f" : "1px solid transparent",
                              borderRadius: 5,
                              padding: "4px 8px",
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: "pointer",
                              transition: "0.15s ease"
                            }}
                            title={item.title}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => handleGenerateQuiz()}
                      disabled={isGeneratingQuiz || !activeDocId}
                      style={{
                        backgroundColor: "#18221f",
                        color: "#c8f064",
                        border: "none",
                        borderRadius: 8,
                        padding: "8px 16px",
                        fontSize: 12.5,
                        fontWeight: 700,
                        cursor: isGeneratingQuiz ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)"
                      }}
                    >
                      <Sparkles size={13} />
                      {isGeneratingQuiz ? "Menyusun Soal..." : `Buat Soal Baru`}
                    </button>
                  </div>
                )}

                {/* Active Multiplayer Room Banner */}
                {activeRoomSession && (
                  <div
                    style={{
                      backgroundColor: "#18181b",
                      color: "#ffffff",
                      borderRadius: 10,
                      padding: "12px 16px",
                      marginBottom: 16,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      border: "1px solid #27272a",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                      flexWrap: "wrap",
                      gap: 10
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 20 }}>⚔️</span>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span
                            style={{
                              fontFamily: "'DM Mono', monospace",
                              fontSize: 10,
                              fontWeight: 800,
                              color: "#a1a1aa",
                              textTransform: "uppercase",
                              letterSpacing: "0.08em"
                            }}
                          >
                            ARENA KOMPETISI STUDY ROOM
                          </span>
                          <span
                            style={{
                              fontFamily: "'DM Mono', monospace",
                              fontSize: 10.5,
                              fontWeight: 800,
                              backgroundColor: "#27272a",
                              color: "#c8f064",
                              padding: "1px 6px",
                              borderRadius: 4
                            }}
                          >
                            {activeRoomSession.roomId}
                          </span>
                        </div>
                        <h4 style={{ margin: "2px 0 0", fontSize: 13.5, fontWeight: 700, color: "#ffffff" }}>
                          {activeRoomSession.title}
                        </h4>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span
                        style={{
                          fontFamily: "'DM Mono', monospace",
                          fontSize: 11,
                          color: "#4ade80",
                          fontWeight: 700
                        }}
                      >
                        {quizQuestions.length} SOAL SERENTAK
                      </span>
                      {onOpenRoomLeaderboard && (
                        <button
                          type="button"
                          onClick={onOpenRoomLeaderboard}
                          style={{
                            backgroundColor: "#27272a",
                            color: "#ffffff",
                            border: "1px solid #3f3f46",
                            borderRadius: 6,
                            padding: "5px 10px",
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: "pointer"
                          }}
                        >
                          Lihat Room / Peringkat 🏆
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Sub-Header & Mode Switch (Only shown when questions exist) */}
                {quizQuestions.length > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
                    <div>
                      <h2 style={{ fontSize: 19, fontWeight: 800, letterSpacing: "-0.02em", color: "#17201d" }}>
                        {isDrillingMistakes ? "Drill Khusus Soal yang Pernah Salah" : (quizMode === "exam" ? "Simulasi Tryout Ujian Asli" : "Simulasi Latihan Soal Pemahaman")}
                      </h2>
                      <p style={{ fontSize: 12, color: "#6f7975", marginTop: 2 }}>
                        {quizMode === "exam"
                          ? "Waktu berjalan mundur, lembar jawaban dinilai sekaligus setelah seluruh nomor selesai dikumpulkan."
                          : "Format pilihan ganda HOTS dengan pembahasan konsep dan analisis jebakan soal."}
                      </p>
                    </div>

                    {/* Mode Toggle Switch */}
                    {!isDrillingMistakes && (
                      <div style={{ display: "flex", alignItems: "center", gap: 4, backgroundColor: "#ffffff", border: "1px solid #dce1da", borderRadius: 8, padding: 3 }}>
                        <button
                          onClick={() => {
                            setQuizMode("study");
                            resetQuizState();
                          }}
                          style={{
                            backgroundColor: quizMode === "study" ? "#18221f" : "transparent",
                            color: quizMode === "study" ? "#c8f064" : "#6f7975",
                            border: quizMode === "study" ? "1px solid #18221f" : "1px solid transparent",
                            borderRadius: 6,
                            padding: "5px 10px",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 5
                          }}
                        >
                          <BookOpen size={12} />
                          <span>Mode Belajar</span>
                        </button>
                        <button
                          onClick={() => {
                            setQuizMode("exam");
                            resetQuizState();
                            setExamTimeLeft(quizQuestions.length * 90);
                            setIsExamTimerRunning(true);
                            setExamDurationSeconds(quizQuestions.length * 90);
                          }}
                          style={{
                            backgroundColor: quizMode === "exam" ? "#fef3c7" : "transparent",
                            color: quizMode === "exam" ? "#b45309" : "#6f7975",
                            border: quizMode === "exam" ? "1px solid #f59e0b" : "1px solid transparent",
                            borderRadius: 6,
                            padding: "5px 10px",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 5
                          }}
                        >
                          <Clock size={12} />
                          <span>Mode Tryout</span>
                          {quizMode === "exam" && (
                            <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700, color: "#b45309", marginLeft: 4 }}>
                              {Math.floor(examTimeLeft / 60)}:{(examTimeLeft % 60).toString().padStart(2, "0")}
                            </span>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {isGeneratingQuiz || isTailoring ? (
                  <AIProcessLoader
                    title={isTailoring ? "Menyesuaikan Latihan Soal" : "Menyusun Paket Latihan Soal HOTS"}
                    subtitle={isTailoring ? "AI merevisi dan menyesuaikan daftar pertanyaan dan pengecoh berdasarkan permintaan Anda." : "AI menganalisis konsep kunci dan menyusun soal penalaran bertingkat."}
                    badge={isTailoring ? "AI Tailoring" : "Pembuat Soal AI"}
                    steps={isTailoring ? [
                      { label: "Membaca Instruksi Baru", detail: "Menganalisis permintaan penyesuaian (tingkat kesulitan, jenis soal)." },
                      { label: "Menyusun Ulang Pertanyaan", detail: "Mengganti atau menyesuaikan pertanyaan agar sesuai target." },
                      { label: "Membuat Pengecoh & Kunci Baru", detail: "Menyesuaikan opsi jawaban dan penjelasan." },
                      { label: "Memvalidasi JSON", detail: "Memastikan format kuis tetap interaktif dan bisa dimainkan." }
                    ] : [
                      { label: "Membaca Fakta Kunci & Teori", detail: "Mengekstrak konsep esensial, tanggal, rumus, dan hubungan sebab-akibat." },
                      { label: "Merancang Skenario Soal Kasus", detail: "Menyusun stimulus kontekstual dan pertanyaan bertingkat HOTS." },
                      { label: "Membuat Opsi Pengecoh Cerdas", detail: "Menguji penalaran siswa agar tidak terjebak hafalan buta." },
                      { label: "Memverifikasi Kunci & Pembahasan KaTeX", detail: "Menyiapkan penjelasan langkah demi langkah dan rumus KaTeX." }
                    ]}
                  />
                ) : quizQuestions.length === 0 ? (
                  /* Unified Quiz Setup Screen (No Redundancy) */
                  <div
                    className="quiz-setup-card"
                    style={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #d4ded4",
                      borderLeft: "4px solid #4b6623",
                      borderRadius: 6,
                      padding: "36px 32px",
                      boxShadow: "0 2px 8px rgba(27, 39, 35, 0.04), 0 0 0 1px rgba(27, 39, 35, 0.02)"
                    }}
                  >
                    <div style={{ textAlign: "center", maxWidth: 540, margin: "0 auto 28px" }}>
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 4,
                          backgroundColor: "#f2f8e8",
                          border: "1px solid #d8e6c5",
                          color: "#4b6623",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          margin: "0 auto 14px",
                          boxShadow: "0 1px 3px rgba(75, 102, 35, 0.08)"
                        }}
                      >
                        <Target size={22} />
                      </div>
                      <h2 style={{ fontSize: 20, fontWeight: 800, color: "#17201d", margin: "0 0 6px", letterSpacing: "-0.01em" }}>
                        Simulasi Latihan Soal Pemahaman
                      </h2>
                      <p style={{ fontSize: 13, color: "#6f7975", lineHeight: 1.5, margin: 0 }}>
                        AI akan menganalisis materi aktif <strong style={{ color: "#17201d" }}>"{activeDocTitle || "Modul Ini"}"</strong> dan menyusun paket latihan pilihan ganda berkualitas tinggi.
                      </p>
                    </div>

                    <div style={{ maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column", gap: 18 }}>
                      {/* Jumlah Soal */}
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                          <label style={{ fontSize: 12, fontWeight: 700, color: "#45544e" }}>
                            Jumlah Butir Soal:
                          </label>
                          <span style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: "#6f7975" }}>
                            {quizQuestionCount} soal
                          </span>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          {[3, 5, 10, 15, 20].map((num) => {
                            const isSelected = quizQuestionCount === num;
                            return (
                              <button
                                key={num}
                                type="button"
                                onClick={() => setQuizQuestionCount(num)}
                                style={{
                                  flex: 1,
                                  backgroundColor: isSelected ? "#18221f" : "#ffffff",
                                  color: isSelected ? "#d8fa68" : "#45544e",
                                  border: `1px solid ${isSelected ? "#18221f" : "#d8ded6"}`,
                                  borderBottom: isSelected ? "2.5px solid #65a30d" : "1px solid #d8ded6",
                                  borderRadius: 4,
                                  padding: "8px 0",
                                  fontSize: 12.5,
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  transition: "all 0.15s ease",
                                  boxShadow: isSelected ? "0 2px 5px rgba(24, 34, 31, 0.16)" : "0 1px 2px rgba(0,0,0,0.03)"
                                }}
                              >
                                {num} butir
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Tingkat Kesulitan */}
                      <div>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#45544e", marginBottom: 8 }}>
                          Tingkat Kesulitan Soal:
                        </label>
                        <div style={{ display: "flex", gap: 8 }}>
                          {[
                            { id: "beginner", label: "Pemula", desc: "Konsep dasar bertahap" },
                            { id: "conceptual", label: "Standar", desc: "Pemahaman kurikulum" },
                            { id: "analytical", label: "HOTS", desc: "Analisis & penalaran" }
                          ].map((item) => {
                            const isSelected = quizType === item.id;
                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => setQuizType(item.id as any)}
                                style={{
                                  flex: 1,
                                  backgroundColor: isSelected ? "#18221f" : "#ffffff",
                                  color: isSelected ? "#d8fa68" : "#45544e",
                                  border: `1px solid ${isSelected ? "#18221f" : "#d8ded6"}`,
                                  borderBottom: isSelected ? "2.5px solid #65a30d" : "1px solid #d8ded6",
                                  borderRadius: 4,
                                  padding: "10px 8px",
                                  textAlign: "center",
                                  cursor: "pointer",
                                  transition: "all 0.15s ease",
                                  boxShadow: isSelected ? "0 2px 5px rgba(24, 34, 31, 0.16)" : "0 1px 2px rgba(0,0,0,0.03)"
                                }}
                              >
                                <div style={{ fontSize: 13, fontWeight: 700 }}>{item.label}</div>
                                <div style={{ fontSize: 10.5, opacity: 0.85, marginTop: 2 }}>{item.desc}</div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Mode Latihan */}
                      <div>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#45544e", marginBottom: 8 }}>
                          Mode Pelaksanaan:
                        </label>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                          <button
                            type="button"
                            onClick={() => setQuizMode("study")}
                            style={{
                              backgroundColor: quizMode === "study" ? "#f4f8ed" : "#ffffff",
                              color: quizMode === "study" ? "#18221f" : "#56615d",
                              border: `1px solid ${quizMode === "study" ? "#c2e28f" : "#d8ded6"}`,
                              borderLeft: `4px solid ${quizMode === "study" ? "#4b6623" : "transparent"}`,
                              borderRadius: 4,
                              padding: "11px 12px",
                              textAlign: "left",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              boxShadow: quizMode === "study" ? "0 1px 4px rgba(75, 102, 35, 0.1)" : "0 1px 2px rgba(0,0,0,0.02)",
                              transition: "all 0.15s ease"
                            }}
                          >
                            <BookOpen size={16} color={quizMode === "study" ? "#4b6623" : "#6f7975"} />
                            <div>
                              <div style={{ fontSize: 12.5, fontWeight: 700 }}>Mode Belajar</div>
                              <div style={{ fontSize: 10.5, opacity: 0.85 }}>Pembahasan langsung per nomor</div>
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={() => setQuizMode("exam")}
                            style={{
                              backgroundColor: quizMode === "exam" ? "#fffbeb" : "#ffffff",
                              color: quizMode === "exam" ? "#18221f" : "#56615d",
                              border: `1px solid ${quizMode === "exam" ? "#fde68a" : "#d8ded6"}`,
                              borderLeft: `4px solid ${quizMode === "exam" ? "#d97706" : "transparent"}`,
                              borderRadius: 4,
                              padding: "11px 12px",
                              textAlign: "left",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              boxShadow: quizMode === "exam" ? "0 1px 4px rgba(217, 119, 6, 0.1)" : "0 1px 2px rgba(0,0,0,0.02)",
                              transition: "all 0.15s ease"
                            }}
                          >
                            <Clock size={16} color={quizMode === "exam" ? "#d97706" : "#6f7975"} />
                            <div>
                              <div style={{ fontSize: 12.5, fontWeight: 700 }}>Mode Tryout</div>
                              <div style={{ fontSize: 10.5, opacity: 0.85 }}>Simulasi ujian berwaktu mundur</div>
                            </div>
                          </button>
                        </div>
                      </div>

                      {/* Generate Button */}
                      <button
                        onClick={() => handleGenerateQuiz()}
                        disabled={isGeneratingQuiz || !activeDocId}
                        style={{
                          backgroundColor: "#18221f",
                          color: "#c8f064",
                          border: "1px solid #24352e",
                          borderBottom: "3px solid #587c29",
                          borderRadius: 4,
                          padding: "13px 24px",
                          fontSize: 14,
                          fontWeight: 800,
                          cursor: isGeneratingQuiz ? "not-allowed" : "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 8,
                          marginTop: 8,
                          boxShadow: "0 4px 14px rgba(24, 34, 31, 0.16)",
                          transition: "all 0.15s ease"
                        }}
                      >
                        <Sparkles size={16} />
                        <span>{isGeneratingQuiz ? "Sedang Menyusun Soal..." : `Susun ${quizQuestionCount} Soal Sekarang`}</span>
                      </button>
                    </div>
                  </div>
                ) : isQuizCompleted || (quizMode === "exam" && examSubmitted) ? (
                  /* Quiz / Exam Completed Screen */
                  <div
                    style={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #dde1da",
                      borderRadius: 12,
                      padding: "32px 20px",
                      textAlign: "center",
                      boxShadow: "0 10px 35px rgba(27, 39, 35, 0.04)"
                    }}
                  >
                    <Award size={40} color={quizMode === "exam" ? "#b45309" : "#4b6623"} style={{ margin: "0 auto 10px" }} />
                    <h3 style={{ fontSize: 20, fontWeight: 800, color: "#17201d" }}>
                      {quizMode === "exam" ? "Rapor Hasil Tryout Simulasi" : "Hasil Latihan Selesai"}
                    </h3>
                    <div style={{ fontSize: 44, fontWeight: 800, color: score >= 75 ? "#22370c" : "#b45309", margin: "12px 0", fontFamily: "'DM Mono', monospace" }}>
                      {score} / 100
                    </div>

                    <div style={{ display: "inline-flex", gap: 10, marginBottom: 16, fontSize: 12, fontWeight: 600 }}>
                      <span style={{ color: "#22370c", backgroundColor: "#eef8db", border: "1px solid #c2e28f", padding: "4px 10px", borderRadius: 999 }}>
                        {quizQuestions.filter((q, i) => userAnswers[i] === q.correctIndex).length} Benar
                      </span>
                      <span style={{ color: "#991b1b", backgroundColor: "#fef2f2", border: "1px solid #fecaca", padding: "4px 10px", borderRadius: 999 }}>
                        {quizQuestions.filter((q, i) => userAnswers[i] !== undefined && userAnswers[i] !== q.correctIndex).length} Salah
                      </span>
                      <span style={{ color: "#56615d", backgroundColor: "#f4f6f2", border: "1px solid #dce1da", padding: "4px 10px", borderRadius: 999 }}>
                        {quizQuestions.filter((q, i) => userAnswers[i] === undefined).length} Dilewati
                      </span>
                    </div>

                    <p style={{ fontSize: 13, color: "#6f7975", maxWidth: 420, margin: "0 auto 20px" }}>
                      {score >= 80
                        ? "Luar biasa! Tingkat pemahaman materi sangat tinggi dan memenuhi target kelulusan ujian."
                        : score >= 60
                        ? "Cukup baik. Soal-soal yang keliru telah otomatis dicatat ke Bank Soal Salah untuk dilatih ulang."
                        : "Perlu drill intensif. Buka Bank Soal Salah untuk membedah akar kekeliruan konsep."}
                    </p>

                    {/* Prominent Multiplayer Room Leaderboard CTA */}
                    {activeRoomSession && onOpenRoomLeaderboard && (
                      <div style={{
                        backgroundColor: "#18181b",
                        border: "1.5px solid #27272a",
                        borderRadius: 12,
                        padding: "14px 18px",
                        margin: "0 auto 20px",
                        maxWidth: 480,
                        textAlign: "left"
                      }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                          <span style={{ fontSize: 11, fontWeight: 800, color: "#c8f064", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                            ⚔️ KOMPETISI ROOM {activeRoomSession.roomId}
                          </span>
                          <span style={{ fontSize: 11, color: "#4ade80", fontWeight: 700 }}>✓ Jawaban Tersimpan</span>
                        </div>
                        <p style={{ margin: "0 0 12px", fontSize: 12.5, color: "#e4e4e7", lineHeight: 1.4 }}>
                          Nilai kamu sudah tersinkronkan ke server room. Pantau posisi peringkatmu dan tunggu kawan main selesai mengerjakan.
                        </p>
                        <button
                          type="button"
                          onClick={onOpenRoomLeaderboard}
                          style={{
                            width: "100%",
                            padding: "11px 16px",
                            backgroundColor: "#c8f064",
                            color: "#18181b",
                            border: "none",
                            borderRadius: 8,
                            fontSize: 13,
                            fontWeight: 800,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 8,
                            boxShadow: "0 2px 8px rgba(200, 240, 100, 0.2)"
                          }}
                        >
                          <Trophy size={16} />
                          <span>Pantau Peringkat & Leaderboard Room 🏆</span>
                        </button>
                      </div>
                    )}

                    <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
                      <button
                        onClick={() => {
                          setExamSubmitted(false);
                          resetQuizState();
                        }}
                        style={{
                          backgroundColor: "#ffffff",
                          border: "1px solid #dce1da",
                          color: "#17201d",
                          borderRadius: 8,
                          padding: "10px 18px",
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: "pointer"
                        }}
                      >
                        Ulangi Tryout
                      </button>

                      {activeDocMistakes.length > 0 && (
                        <button
                          onClick={() => {
                            setMistakeFilterScope("current");
                            setActiveTab("mistakes");
                          }}
                          style={{
                            backgroundColor: "#fef2f2",
                            border: "1px solid #fecaca",
                            color: "#ef4444",
                            borderRadius: 8,
                            padding: "10px 18px",
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 6
                          }}
                        >
                          <AlertTriangle size={14} />
                          <span>Buka Bank Soal Salah ({activeDocMistakes.length})</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleGenerateQuiz()}
                        style={{
                          backgroundColor: "#18221f",
                          border: "none",
                          color: "#c8f064",
                          borderRadius: 8,
                          padding: "10px 18px",
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: "pointer"
                        }}
                      >
                        Paket Soal Baru
                      </button>
                    </div>

                    {/* Active Multiplayer Room Leaderboard CTA */}
                    {activeRoomSession && onOpenRoomLeaderboard && (
                      <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px dashed #dce1da" }}>
                        <button
                          type="button"
                          onClick={onOpenRoomLeaderboard}
                          style={{
                            width: "100%",
                            padding: "12px 18px",
                            backgroundColor: "#18181b",
                            color: "#c8f064",
                            border: "none",
                            borderRadius: 10,
                            fontSize: 13,
                            fontWeight: 800,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 8,
                            boxShadow: "0 4px 14px rgba(0,0,0,0.1)"
                          }}
                        >
                          <Trophy size={16} />
                          <span>Lihat Peringkat & Leaderboard Room {activeRoomSession.roomId} 🏆</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Active Question Card */
                  <div>
                    {/* Exam Mode CBT Question Strip Navigation */}
                    {quizMode === "exam" && (
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14, padding: "10px 12px", backgroundColor: "#ffffff", border: "1px solid #dde1da", borderRadius: 10 }}>
                        {quizQuestions.map((q, idx) => {
                          const isAns = userAnswers[idx] !== undefined;
                          const isCur = currentQuestionIndex === idx;
                          const isFlg = !!examFlagged[idx];
                          return (
                            <button
                              key={idx}
                              onClick={() => {
                                setCurrentQuestionIndex(idx);
                                setSelectedOption(userAnswers[idx] !== undefined ? userAnswers[idx] : null);
                              }}
                              style={{
                                width: 34,
                                height: 34,
                                borderRadius: 6,
                                backgroundColor: isCur ? "#18221f" : (isFlg ? "#fef3c7" : (isAns ? "#eef8db" : "#fafbf8")),
                                color: isCur ? "#c8f064" : (isFlg ? "#b45309" : (isAns ? "#22370c" : "#56615d")),
                                border: isCur ? "2px solid #18221f" : (isFlg ? "1px solid #f59e0b" : (isAns ? "1px solid #8dbd42" : "1px solid #dce1da")),
                                fontSize: 12.5,
                                fontWeight: 700,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                position: "relative"
                              }}
                            >
                              {idx + 1}
                              {isFlg && <Flag size={8} color="#f59e0b" style={{ position: "absolute", top: -3, right: -2 }} />}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Header Progress Tracker */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#6f7975" }}>
                        Soal {currentQuestionIndex + 1} dari {quizQuestions.length}
                        {examFlagged[currentQuestionIndex] && (
                          <span style={{ color: "#b45309", marginLeft: 8, fontSize: 12, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}>
                            <Flag size={11} /> Ditandai Ragu-ragu
                          </span>
                        )}
                      </span>
                      {quizMode === "study" && (
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#22370c", backgroundColor: "#eef8db", padding: "2px 8px", borderRadius: 4, fontFamily: "'DM Mono', monospace" }}>
                          Skor: {score} Poin
                        </span>
                      )}
                    </div>

                    {/* Question Card */}
                    <div
                      style={{
                        backgroundColor: "#ffffff",
                        border: "1px solid #dde1da",
                        borderRadius: 12,
                        padding: "20px 16px",
                        marginBottom: 16,
                        boxShadow: "0 10px 35px rgba(27, 39, 35, 0.04)"
                      }}
                    >
                      <div style={{ fontSize: 16, fontWeight: 600, lineHeight: "1.6", color: "#17201d", marginBottom: currentQuestion?.formula ? 12 : 18 }}>
                        <MathView text={currentQuestion?.question} />
                      </div>

                      {/* Question Formula Card: HANYA tampil jika user sudah menjawab di mode Belajar agar tidak membocorkan cara pengerjaan soal saat ujian */}
                      {quizMode === "study" && isAnswerSubmitted && currentQuestion?.formula && (
                        <div className="question-formula">
                          <MathView text={currentQuestion.formula} />
                        </div>
                      )}

                      {/* 5 Options (A, B, C, D, E) */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {currentQuestion?.options.map((opt, idx) => {
                          const optionLetter = String.fromCharCode(65 + idx);
                          const isSelected = selectedOption === idx;
                          const isCorrect = idx === currentQuestion.correctIndex;

                          let bgColor = "#fafbf8";
                          let borderColor = "#dfe4dc";
                          let textColor = "#56615d";
                          let shadow = "none";

                          if (quizMode === "study") {
                            if (isAnswerSubmitted) {
                              if (isCorrect) {
                                bgColor = "#eef8db";
                                borderColor = "#8dbd42";
                                textColor = "#22370c";
                              } else if (isSelected && !isCorrect) {
                                bgColor = "#fdf2f2";
                                borderColor = "#f87171";
                                textColor = "#991b1b";
                              } else {
                                textColor = "#9ca3af";
                                bgColor = "#f8f9f5";
                              }
                            }
                          } else {
                            if (isSelected) {
                              bgColor = "#18221f";
                              borderColor = "#18221f";
                              textColor = "#c8f064";
                            }
                          }

                          return (
                            <button
                              key={idx}
                              className="quiz-option-btn"
                              onClick={() => handleSelectQuizOption(idx)}
                              disabled={quizMode === "study" && isAnswerSubmitted}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                textAlign: "left",
                                gap: 12,
                                padding: "13px 15px",
                                minHeight: 48,
                                backgroundColor: bgColor,
                                border: `1px solid ${borderColor}`,
                                borderLeft: isSelected || (isAnswerSubmitted && isCorrect)
                                  ? `4px solid ${isAnswerSubmitted ? (isCorrect ? "#65a30d" : "#ef4444") : (quizMode === "exam" ? "#c8f064" : "#4b6623")}`
                                  : "4px solid transparent",
                                borderRadius: 4,
                                color: textColor,
                                fontSize: 13.5,
                                lineHeight: "1.5",
                                cursor: quizMode === "study" && isAnswerSubmitted ? "default" : "pointer",
                                transition: "all 0.15s ease",
                                boxShadow: isSelected ? "0 2px 6px rgba(0,0,0,0.06)" : "0 1px 2px rgba(0,0,0,0.02)"
                              }}
                            >
                              <div
                                style={{
                                  width: 26,
                                  height: 26,
                                  borderRadius: 6,
                                  backgroundColor: quizMode === "study" && isAnswerSubmitted && isCorrect ? "#8dbd42" : quizMode === "study" && isAnswerSubmitted && isSelected ? "#ef4444" : (quizMode === "exam" && isSelected ? "#c8f064" : "#ffffff"),
                                  color: (quizMode === "study" && isAnswerSubmitted && (isCorrect || isSelected)) ? "#ffffff" : (quizMode === "exam" && isSelected ? "#18221f" : "#17201d"),
                                  border: "1px solid #dce1da",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: 12,
                                  fontWeight: 700,
                                  fontFamily: "'DM Mono', monospace",
                                  flexShrink: 0
                                }}
                              >
                                {quizMode === "study" && isAnswerSubmitted && isCorrect ? (
                                  <Check size={14} />
                                ) : quizMode === "study" && isAnswerSubmitted && isSelected ? (
                                  <X size={14} />
                                ) : (
                                  optionLetter
                                )}
                              </div>
                              <MathView text={opt} style={{ flex: 1 }} />
                            </button>
                          );
                        })}
                      </div>

                      {/* Explanation & Pitfalls Box when answered (ONLY in Study Mode) */}
                      {quizMode === "study" && isAnswerSubmitted && (
                        <div
                          style={{
                            marginTop: 18,
                            padding: "16px",
                            backgroundColor: "#f8f9f5",
                            borderRadius: 12,
                            border: "1px solid #dde1da",
                            borderLeft: selectedOption === currentQuestion.correctIndex ? "3px solid #8dbd42" : "3px solid #ef4444"
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                            {selectedOption === currentQuestion.correctIndex ? (
                              <>
                                <CheckCircle2 size={16} color="#4b6623" />
                                <span style={{ fontSize: 13, fontWeight: 700, color: "#22370c" }}>Jawaban Anda Benar</span>
                              </>
                            ) : (
                              <>
                                <XCircle size={16} color="#ef4444" />
                                <span style={{ fontSize: 13, fontWeight: 700, color: "#991b1b" }}>
                                  Kunci Benar: Pilihan {String.fromCharCode(65 + currentQuestion.correctIndex)}
                                </span>
                              </>
                            )}
                          </div>

                          {/* 1. Formula Highlight Box (if available) */}
                          {currentQuestion.formula && (
                            <div
                              style={{
                                backgroundColor: "#1d2824",
                                border: "1px solid #34413c",
                                borderRadius: 10,
                                padding: "12px 16px",
                                marginBottom: 14
                              }}
                            >
                              <div
                                style={{
                                  fontSize: 10.5,
                                  fontWeight: 700,
                                  textTransform: "uppercase",
                                  letterSpacing: "0.08em",
                                  color: "#c8f064",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 6,
                                  marginBottom: 6,
                                  fontFamily: "'DM Mono', monospace"
                                }}
                              >
                                <Sparkles size={13} /> Rumus Kunci & Konsep Utama
                              </div>
                              <div style={{ textAlign: "center", fontSize: 16, color: "#e8eee9", padding: "4px 0" }}>
                                <MathView text={currentQuestion.formula} />
                              </div>
                            </div>
                          )}

                          {/* 2. Interactive Solution Stepper (from Figma Make design) */}
                          {currentQuestion.steps && currentQuestion.steps.length > 0 ? (
                            <div className="solution-panel">
                              <div className="solution-head">
                                <div>
                                  <span>PEMBAHASAN TERSTRUKTUR</span>
                                  <h3>Bedah Langkah Pengerjaan</h3>
                                </div>
                                <strong>{currentQuestion.steps.length} langkah</strong>
                              </div>

                              <div className="solution-stepper">
                                {currentQuestion.steps.map((st, sIdx) => (
                                  <button
                                    key={sIdx}
                                    type="button"
                                    className={`${solutionStep === sIdx ? "active" : ""} ${solutionStep > sIdx ? "passed" : ""}`}
                                    onClick={() => setSolutionStep(sIdx)}
                                  >
                                    <span>{solutionStep > sIdx ? "✓" : sIdx + 1}</span>
                                    <small>Langkah {sIdx + 1}</small>
                                  </button>
                                ))}
                              </div>

                              {(() => {
                                const rawSt: any = currentQuestion.steps[Math.min(solutionStep, currentQuestion.steps.length - 1)];
                                const isObj = typeof rawSt === "object" && rawSt !== null;
                                return (
                                  <div className="solution-content-card">
                                    <span>LANGKAH {Math.min(solutionStep, currentQuestion.steps.length - 1) + 1}</span>
                                    {isObj ? (
                                      <>
                                        {rawSt.title && <h4><MathView text={rawSt.title} /></h4>}
                                        {rawSt.desc && <p><MathView text={rawSt.desc} /></p>}
                                        {rawSt.formula && (
                                          <div className="solution-formula-box">
                                            <MathView text={rawSt.formula} />
                                          </div>
                                        )}
                                      </>
                                    ) : (
                                      <p><MathView text={String(rawSt || "")} /></p>
                                    )}
                                  </div>
                                );
                              })()}

                              <div className="solution-actions-row">
                                <button
                                  type="button"
                                  disabled={solutionStep === 0}
                                  onClick={() => setSolutionStep((s) => Math.max(0, s - 1))}
                                  style={{
                                    backgroundColor: "#ffffff",
                                    border: "1px solid #dce1da",
                                    color: solutionStep === 0 ? "#9ca3af" : "#17201d",
                                    cursor: solutionStep === 0 ? "not-allowed" : "pointer"
                                  }}
                                >
                                  <ChevronLeft size={14} /> Langkah Sebelumnya
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (solutionStep < currentQuestion.steps.length - 1) {
                                      setSolutionStep((s) => s + 1);
                                    } else {
                                      handleNextQuizQuestion();
                                    }
                                  }}
                                  style={{
                                    backgroundColor: "#18221f",
                                    border: "none",
                                    color: "#c8f064",
                                    cursor: "pointer"
                                  }}
                                >
                                  <span>{solutionStep === currentQuestion.steps.length - 1 ? "Soal Berikutnya" : "Langkah Lanjut"}</span>
                                  <ChevronRight size={14} />
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* Legacy / Standard Explanation */
                            <div style={{ fontSize: 13, color: "#45544e", lineHeight: "1.6", marginBottom: 10 }}>
                              <strong style={{ color: "#17201d" }}>Pembahasan: </strong>
                              <MathView text={currentQuestion.explanation} />
                            </div>
                          )}

                          {/* 3. Pitfalls & Trap Analysis */}
                          {currentQuestion.pitfall && (
                            <div
                              style={{
                                fontSize: 12,
                                color: "#92400e",
                                backgroundColor: "#fffbeb",
                                border: "1px solid #fde68a",
                                borderRadius: 8,
                                padding: "8px 12px",
                                display: "flex",
                                alignItems: "flex-start",
                                gap: 6
                              }}
                            >
                              <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 2 }} />
                              <span><strong>Analisis Jebakan: </strong><MathView text={currentQuestion.pitfall} /></span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Bottom Actions: Exam Mode Stepper vs Study Mode Action Bar */}
                    <div>
                      {quizMode === "exam" ? (
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginTop: 16 }}>
                          <button
                            onClick={handlePrevQuizQuestion}
                            disabled={currentQuestionIndex === 0}
                            style={{
                              backgroundColor: "#ffffff",
                              color: currentQuestionIndex === 0 ? "#9ca3af" : "#17201d",
                              border: "1px solid #dce1da",
                              borderRadius: 8,
                              padding: "10px 16px",
                              fontSize: 13,
                              fontWeight: 600,
                              cursor: currentQuestionIndex === 0 ? "not-allowed" : "pointer"
                            }}
                          >
                            ← Sebelumnya
                          </button>

                          <button
                            onClick={() => toggleFlagQuestion(currentQuestionIndex)}
                            style={{
                              backgroundColor: examFlagged[currentQuestionIndex] ? "#fef3c7" : "#ffffff",
                              color: examFlagged[currentQuestionIndex] ? "#b45309" : "#56615d",
                              border: examFlagged[currentQuestionIndex] ? "1px solid #f59e0b" : "1px solid #dce1da",
                              borderRadius: 8,
                              padding: "10px 14px",
                              fontSize: 12.5,
                              fontWeight: 600,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: 6
                            }}
                          >
                            <Flag size={13} />
                            <span>{examFlagged[currentQuestionIndex] ? "Batal Tandai" : "Tandai Ragu-ragu"}</span>
                          </button>

                          <div style={{ display: "flex", gap: 8 }}>
                            {currentQuestionIndex < quizQuestions.length - 1 && (
                              <button
                                onClick={handleNextQuizQuestion}
                                style={{
                                  backgroundColor: "#ffffff",
                                  color: "#17201d",
                                  border: "1px solid #dce1da",
                                  borderRadius: 8,
                                  padding: "10px 18px",
                                  fontSize: 13,
                                  fontWeight: 600,
                                  cursor: "pointer"
                                }}
                              >
                                Berikutnya →
                              </button>
                            )}

                            <button
                              onClick={handleExamSubmit}
                              style={{
                                backgroundColor: "#18221f",
                                color: "#c8f064",
                                border: "none",
                                borderRadius: 8,
                                padding: "10px 18px",
                                fontSize: 13,
                                fontWeight: 700,
                                cursor: "pointer",
                                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)"
                              }}
                            >
                              Kumpulkan Lembar Tryout
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="quiz-action-bar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginTop: 14 }}>
                          <button
                            className="quiz-ask-ai-btn"
                            onClick={() => setIsQuizChatOpen(!isQuizChatOpen)}
                            style={{
                              backgroundColor: isQuizChatOpen ? "#eef8db" : "#ffffff",
                              border: `1px solid ${isQuizChatOpen ? "#8dbd42" : "#dce1da"}`,
                              color: isQuizChatOpen ? "#22370c" : "#17201d",
                              borderRadius: 8,
                              padding: "10px 16px",
                              fontSize: 13,
                              fontWeight: 600,
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              transition: "all 0.15s ease"
                            }}
                          >
                            <MessageSquare size={14} color="#4b6623" />
                            {isQuizChatOpen
                              ? "Tutup Tanya AI"
                              : isAnswerSubmitted
                              ? "Diskusi & Tanya AI Soal Ini"
                              : "Minta Petunjuk / Tanya AI"}
                          </button>

                          {isAnswerSubmitted && (
                            <button
                              className="next-quiz-btn"
                              onClick={handleNextQuizQuestion}
                              style={{
                                backgroundColor: "#18221f",
                                color: "#c8f064",
                                border: "none",
                                borderRadius: 8,
                                padding: "11px 22px",
                                fontSize: 13,
                                fontWeight: 700,
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                boxShadow: "0 2px 10px rgba(0, 0, 0, 0.2)"
                              }}
                            >
                              {currentQuestionIndex < quizQuestions.length - 1 ? "Soal Berikutnya" : "Lihat Hasil Akhir"}
                              <ChevronRight size={16} />
                            </button>
                          )}
                        </div>
                      )}

                      {/* Inline AI Question Tutor Chat Drawer */}
                      {isQuizChatOpen && (
                        <div
                          style={{
                            marginTop: 16,
                            backgroundColor: "#fbfcf9",
                            border: "1px solid #dde1da",
                            borderRadius: 12,
                            padding: "16px 18px",
                            boxShadow: "0 4px 20px rgba(27, 39, 35, 0.04)"
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <div
                                style={{
                                  width: 26,
                                  height: 26,
                                  borderRadius: 6,
                                  backgroundColor: "#18221f",
                                  display: "grid",
                                  placeItems: "center",
                                  color: "#c8f064"
                                }}
                              >
                                <Sparkles size={13} />
                              </div>
                              <span style={{ fontSize: 13.5, fontWeight: 800, color: "#17201d", letterSpacing: "-0.01em" }}>
                                Tutor Bedah Soal AI
                              </span>
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 700,
                                  textTransform: "uppercase",
                                  letterSpacing: "0.03em",
                                  color: isAnswerSubmitted ? "#065f46" : "#92400e",
                                  backgroundColor: isAnswerSubmitted ? "#ecfdf5" : "#fef3c7",
                                  border: `1px solid ${isAnswerSubmitted ? "#a7f3d0" : "#fde68a"}`,
                                  padding: "2px 8px",
                                  borderRadius: 999
                                }}
                              >
                                {isAnswerSubmitted ? "Konteks Kunci & Pembahasan" : "Petunjuk Berpikir"}
                              </span>
                            </div>
                            <button
                              onClick={() => setIsQuizChatOpen(false)}
                              style={{
                                background: "none",
                                border: "none",
                                color: "#727d78",
                                cursor: "pointer",
                                padding: 4,
                                borderRadius: 4,
                                display: "flex",
                                alignItems: "center"
                              }}
                              title="Tutup Chat"
                            >
                              <X size={15} />
                            </button>
                          </div>

                          {/* Quick suggestion chips */}
                          <div className="no-scrollbar" style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 10, WebkitOverflowScrolling: "touch" }}>
                            {(isAnswerSubmitted
                              ? [
                                  "Kenapa opsi yang saya pilih keliru?",
                                  "Jelaskan konsep soal ini pakai analogi sederhana",
                                  "Apa kata kunci utama untuk menjawab soal seperti ini?",
                                  "Apa beda mendasar opsi benar vs opsi pengecoh?"
                                ]
                              : [
                                  "Beri petunjuk cara menganalisis soal ini tanpa bocorkan kunci",
                                  "Apa arti istilah teknis dalam soal ini?",
                                  "Apa langkah eliminasi opsi yang tepat?",
                                  "Jelaskan materi terkait soal ini secara ringkas"
                                ]
                            ).map((chip, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleSendQuizQuestionChat(chip)}
                                disabled={isQuizChatSending}
                                style={{
                                  whiteSpace: "nowrap",
                                  backgroundColor: "#ffffff",
                                  border: "1px solid #dce1da",
                                  color: "#495751",
                                  borderRadius: 999,
                                  padding: "5px 11px",
                                  fontSize: 11,
                                  fontWeight: 600,
                                  cursor: isQuizChatSending ? "not-allowed" : "pointer",
                                  flexShrink: 0,
                                  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.02)",
                                  transition: "0.15s ease"
                                }}
                                onMouseEnter={(e) => {
                                  if (!isQuizChatSending) {
                                    e.currentTarget.style.backgroundColor = "#18221f";
                                    e.currentTarget.style.color = "#c8f064";
                                    e.currentTarget.style.borderColor = "#18221f";
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (!isQuizChatSending) {
                                    e.currentTarget.style.backgroundColor = "#ffffff";
                                    e.currentTarget.style.color = "#495751";
                                    e.currentTarget.style.borderColor = "#dce1da";
                                  }
                                }}
                              >
                                {chip}
                              </button>
                            ))}
                          </div>

                          {/* Chat messages thread */}
                          <div style={{ maxHeight: 280, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, marginBottom: 12, paddingRight: 4 }}>
                            {(!Array.isArray(quizChatMessages?.[currentQuestionIndex]) || quizChatMessages[currentQuestionIndex].length === 0) ? (
                              <div
                                style={{
                                  fontSize: 12,
                                  color: "#56645e",
                                  padding: "12px 14px",
                                  textAlign: "center",
                                  backgroundColor: "#ffffff",
                                  borderRadius: 8,
                                  border: "1px solid #e2e7df",
                                  lineHeight: 1.5
                                }}
                              >
                                {isAnswerSubmitted
                                  ? "Ada yang membingungkan dari pembahasan? Tanyakan ke AI atau ketuk salah satu pertanyaan cepat di atas."
                                  : "Bingung cara menjawab soal ini? Ketuk salah satu petunjuk cepat di atas atau tanyakan ke AI."}
                              </div>
                            ) : (
                              (quizChatMessages[currentQuestionIndex] as any[]).map((m: any, i: number) => {
                                const isUser = m.role === "user";
                                return (
                                  <div
                                    key={i}
                                    style={{
                                      alignSelf: isUser ? "flex-end" : "flex-start",
                                      maxWidth: "88%",
                                      backgroundColor: isUser ? "#18221f" : "#ffffff",
                                      color: isUser ? "#eff5ec" : "#17201d",
                                      border: isUser ? "none" : "1px solid #dde1da",
                                      borderRadius: isUser ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                                      padding: isUser ? "9px 13px" : "11px 14px",
                                      fontSize: 12.5,
                                      lineHeight: "1.55",
                                      boxShadow: isUser ? "0 2px 8px rgba(24, 34, 31, 0.1)" : "0 2px 8px rgba(27, 39, 35, 0.02)",
                                      whiteSpace: "pre-wrap"
                                    }}
                                  >
                                    <MathView text={m.content} />
                                  </div>
                                );
                              })
                            )}
                            {isQuizChatSending && (
                              <div
                                style={{
                                  alignSelf: "flex-start",
                                  backgroundColor: "#ffffff",
                                  border: "1px solid #dde1da",
                                  borderRadius: 8,
                                  padding: "8px 12px",
                                  fontSize: 11.5,
                                  color: "#495651",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 6
                                }}
                              >
                                <Sparkles size={12} color="#18221f" />
                                <span>Tutor AI sedang menganalisis soal dan opsi...</span>
                              </div>
                            )}
                          </div>

                          {/* Chat input box */}
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              backgroundColor: "#ffffff",
                              border: "1px solid #d6ded4",
                              borderRadius: 10,
                              padding: "4px 6px 4px 12px",
                              boxShadow: "0 2px 8px rgba(27, 39, 35, 0.03)"
                            }}
                          >
                            <input
                              type="text"
                              value={quizChatInput}
                              onChange={(e) => setQuizChatInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault();
                                  handleSendQuizQuestionChat();
                                }
                              }}
                              placeholder={isAnswerSubmitted ? "Tanyakan hal spesifik tentang pembahasan..." : "Minta petunjuk atau klarifikasi soal..."}
                              style={{
                                flex: 1,
                                backgroundColor: "transparent",
                                border: "none",
                                fontSize: 12.5,
                                fontFamily: "inherit",
                                color: "#17201d",
                                outline: "none",
                                padding: "6px 0"
                              }}
                            />
                            <button
                              onClick={() => handleSendQuizQuestionChat()}
                              disabled={isQuizChatSending || !quizChatInput.trim()}
                              style={{
                                backgroundColor: "#18221f",
                                color: "#c8f064",
                                border: "none",
                                borderRadius: 8,
                                padding: "0 12px",
                                height: 32,
                                fontSize: 12.5,
                                fontWeight: 700,
                                cursor: isQuizChatSending || !quizChatInput.trim() ? "not-allowed" : "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: 5,
                                opacity: isQuizChatSending || !quizChatInput.trim() ? 0.45 : 1,
                                transition: "0.15s ease"
                              }}
                            >
                              <Send size={12} />
                              <span>Kirim</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* AI Tailoring for Quiz */}
                    {quizQuestions.length > 0 && activeDocId && (
                      <TailorQuizBox
                        activeDocId={activeDocId}
                        quizQuestions={quizQuestions}
                        selectedModel={selectedModel}
                        setQuizQuestions={setQuizQuestions}
                        resetQuizState={resetQuizState}
                        isTailoring={isTailoring}
                        setIsTailoring={setIsTailoring}
                      />
                    )}

                  </div>
                )}
              </div>
  );
}
