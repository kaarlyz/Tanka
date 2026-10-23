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
  ChevronDown,
  Zap,
  X
} from "lucide-react";
import { ActiveTab, QuizQuestion, MistakeItem, ChatMessage, DocumentItem } from "../../types";
import { MathView } from "../common/MathView";
import { isQuizAnswerCorrect } from "../../hooks/useQuiz";
import { AIProcessLoader } from "../common/AIProcessLoader";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { sanitizeMathMarkdown } from "../common/DiagramRenderer";

const STATIC_REMARK_PLUGINS = [remarkGfm, remarkMath];
const STATIC_REHYPE_PLUGINS = [rehypeKatex];

function TailorQuizBox({
  activeDocId,
  quizQuestions,
  selectedModel,
  setQuizQuestions,
  resetQuizState,
  isTailoring,
  setIsTailoring,
  showNotice
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
        if (showNotice) showNotice("Gagal menyesuaikan kuis: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      if (showNotice) showNotice("Gagal menyesuaikan kuis: " + err);
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

interface QuizTutorInputBarProps {
  isAnswerSubmitted: boolean;
  isQuizChatSending: boolean;
  onSend: (text: string) => void;
}

const QuizTutorInputBar = React.memo(function QuizTutorInputBar({
  isAnswerSubmitted,
  isQuizChatSending,
  onSend
}: QuizTutorInputBarProps) {
  const [localInput, setLocalInput] = React.useState("");

  const handleSend = () => {
    if (!localInput.trim() || isQuizChatSending) return;
    onSend(localInput.trim());
    setLocalInput("");
  };

  return (
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
        className="clean-input"
        value={localInput}
        onChange={(e) => setLocalInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
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
        type="button"
        onClick={handleSend}
        disabled={isQuizChatSending || !localInput.trim()}
        style={{
          backgroundColor: "#18221f",
          color: "#c8f064",
          border: "none",
          borderRadius: 8,
          padding: "0 12px",
          height: 32,
          fontSize: 12.5,
          fontWeight: 700,
          cursor: isQuizChatSending || !localInput.trim() ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          gap: 5,
          opacity: isQuizChatSending || !localInput.trim() ? 0.45 : 1,
          transition: "0.15s ease"
        }}
      >
        <Send size={12} />
        <span>Kirim</span>
      </button>
    </div>
  );
});

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
  userAnswers: { [key: number]: number | number[] };
  selectedOption: any;
  setSelectedOption: (opt: any) => void;
  handleSubmitMultipleAnswer?: () => void;
  handleSelectMatrixAnswer?: (stmtIdx: number, val: string) => void;
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
  showNotice?: (msg: string) => void;
  documents?: DocumentItem[] | any[];
  loadDocument?: (docOrId: any) => void;
}

export const QuizTab = React.memo(function QuizTab({
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
  handleSubmitMultipleAnswer,
  handleSelectMatrixAnswer,
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
  onOpenRoomLeaderboard,
  showNotice,
  documents = [],
  loadDocument
}: QuizTabProps) {
  const [isTailoring, setIsTailoring] = React.useState(false);
  const [copiedQuizChatId, setCopiedQuizChatId] = React.useState<string | null>(null);

  const handleCopyQuizChat = React.useCallback((id: string, text: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    setCopiedQuizChatId(id);
    setTimeout(() => setCopiedQuizChatId(null), 2000);
  }, []);

  const currentQuestion = quizQuestions[currentQuestionIndex];
  const isKategori = currentQuestion?.questionType === "kategori" || (Array.isArray(currentQuestion?.matrixStatements) && currentQuestion.matrixStatements.length > 0);
  const isMultiple = !isKategori && (currentQuestion?.questionType === "multiple" || (Array.isArray(currentQuestion?.correctIndices) && currentQuestion.correctIndices.length > 1));
  const correctIndices = currentQuestion?.correctIndices || (currentQuestion?.correctIndex !== undefined ? [currentQuestion.correctIndex] : []);
  const isOptionSelected = (idx: number) => {
    if (Array.isArray(selectedOption)) return selectedOption.includes(idx);
    return selectedOption === idx;
  };
  const isCorrect = isAnswerSubmitted && isQuizAnswerCorrect(currentQuestion, selectedOption);

  return (
    <div className="quiz-view tab-pane-animate" style={{ maxWidth: 940, margin: "0 auto" }}>
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
                      {documents && documents.length > 0 && (
                        <>
                          <div
                            className="quiz-quick-switcher-compact"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              backgroundColor: "#fafbf8",
                              border: "1.5px solid #dce4d6",
                              borderRadius: 8,
                              padding: "0 6px 0 8px",
                              height: 28,
                              boxSizing: "border-box"
                            }}
                          >
                            <BookOpen size={13} color="#45544e" style={{ flexShrink: 0 }} />
                            <select
                              className="quiz-material-dropdown-select clean-input no-border"
                              value={activeDocId || ""}
                              onChange={(e) => {
                                const selectedId = e.target.value;
                                if (selectedId && loadDocument) {
                                  const selected = documents.find((d: any) => d.id === selectedId);
                                  loadDocument(selected || selectedId);
                                }
                              }}
                              title="Ganti Materi Pembelajaran"
                              style={{
                                background: "transparent",
                                border: "none",
                                boxShadow: "none",
                                color: "#18221f",
                                fontSize: 12,
                                fontWeight: 700,
                                fontFamily: "'Manrope', sans-serif",
                                maxWidth: 160,
                                outline: "none",
                                cursor: "pointer",
                                paddingRight: 2
                              }}
                            >
                              {!documents.some((d: any) => d.id === activeDocId) && activeDocId && (
                                <option value={activeDocId}>
                                  {activeDocTitle || "Materi Saat Ini"}
                                </option>
                              )}
                              {documents.map((doc: any) => (
                                <option key={doc.id} value={doc.id}>
                                  {doc.title || "Tanpa Judul"}
                                </option>
                              ))}
                            </select>
                            <ChevronDown size={11} color="#6f7975" style={{ flexShrink: 0, pointerEvents: "none" }} />
                          </div>
                          <div style={{ width: 1, height: 18, backgroundColor: "#dce1da", margin: "0 2px" }} />
                        </>
                      )}
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
                      {/* Materi Pembelajaran Aktif (Shortcut) */}
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                          <label style={{ fontSize: 12, fontWeight: 700, color: "#45544e", display: "flex", alignItems: "center", gap: 6 }}>
                            <BookOpen size={14} color="#4b6623" />
                            Materi Pembelajaran Aktif (Shortcut):
                          </label>
                          {activeDocTitle && (
                            <span style={{ fontSize: 11, color: "#717f79", fontWeight: 600 }}>
                              Terpilih
                            </span>
                          )}
                        </div>

                        {documents && documents.length > 0 ? (
                          <div
                            className="quiz-doc-select-container"
                            style={{
                              position: "relative",
                              backgroundColor: "#fafbf8",
                              border: "1.5px solid #dce4d6",
                              borderRadius: 10,
                              padding: "2px 10px",
                              transition: "border-color 0.15s ease, box-shadow 0.15s ease"
                            }}
                          >
                            <select
                              className="quiz-doc-select clean-input no-border"
                              value={activeDocId || ""}
                              onChange={(e) => {
                                const selectedId = e.target.value;
                                if (selectedId && loadDocument) {
                                  const selected = documents.find((d: any) => d.id === selectedId);
                                  loadDocument(selected || selectedId);
                                }
                              }}
                              style={{
                                width: "100%",
                                padding: "8px 28px 8px 6px",
                                fontSize: 13,
                                fontWeight: 700,
                                fontFamily: "'Manrope', sans-serif",
                                color: "#17201d",
                                backgroundColor: "transparent",
                                border: "none",
                                boxShadow: "none",
                                outline: "none",
                                cursor: "pointer",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                overflow: "hidden"
                              }}
                            >
                              {!activeDocId && (
                                <option value="" disabled>
                                  -- Pilih Materi Pembelajaran --
                                </option>
                              )}
                              {!documents.some((d: any) => d.id === activeDocId) && activeDocId && (
                                <option value={activeDocId}>
                                  {activeDocTitle || "Materi Saat Ini"}
                                </option>
                              )}
                              {documents.map((doc: any) => (
                                <option key={doc.id} value={doc.id}>
                                  {doc.title || "Tanpa Judul"}
                                </option>
                              ))}
                            </select>
                            <ChevronDown
                              size={15}
                              color="#6f7975"
                              style={{
                                position: "absolute",
                                right: 12,
                                top: "50%",
                                transform: "translateY(-50%)",
                                pointerEvents: "none"
                              }}
                            />
                          </div>
                        ) : (
                          <div
                            style={{
                              backgroundColor: "#f9faf8",
                              border: "1px dashed #dce2da",
                              borderRadius: 8,
                              padding: "14px 16px",
                              textAlign: "center"
                            }}
                          >
                            <p style={{ fontSize: 12.5, color: "#6f7975", margin: "0 0 10px" }}>
                              Belum ada modul materi belajar yang tersimpan.
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                if (setActiveTab) setActiveTab("home");
                              }}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                backgroundColor: "#18221f",
                                color: "#c8f064",
                                border: "none",
                                borderRadius: 6,
                                padding: "6px 14px",
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: "pointer",
                                transition: "all 0.15s ease"
                              }}
                            >
                              <Plus size={13} />
                              Unggah Dokumen / Buat Materi Baru
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Jumlah Soal */}
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                          <label style={{ fontSize: 12, fontWeight: 700, color: "#45544e" }}>
                            Jumlah Butir Soal:
                          </label>
                          <span style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: "#6f7975" }}>
                            {quizQuestionCount} butir terpilih
                          </span>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            gap: 4,
                            backgroundColor: "#f4f6f1",
                            padding: 3,
                            borderRadius: 8,
                            border: "1px solid #dce2da"
                          }}
                        >
                          {[3, 5, 10, 15, 20].map((num) => {
                            const isSelected = quizQuestionCount === num;
                            return (
                              <button
                                key={num}
                                type="button"
                                onClick={() => setQuizQuestionCount(num)}
                                style={{
                                  flex: 1,
                                  backgroundColor: isSelected ? "#18221f" : "transparent",
                                  color: isSelected ? "#c8f064" : "#5f6b66",
                                  border: "none",
                                  borderRadius: 6,
                                  padding: "7px 0",
                                  fontSize: 12,
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  transition: "all 0.15s ease",
                                  textAlign: "center"
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
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(3, 1fr)",
                            gap: 4,
                            backgroundColor: "#f4f6f1",
                            padding: 3,
                            borderRadius: 8,
                            border: "1px solid #dce2da"
                          }}
                        >
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
                                  backgroundColor: isSelected ? "#18221f" : "transparent",
                                  color: isSelected ? "#c8f064" : "#5f6b66",
                                  border: "none",
                                  borderRadius: 6,
                                  padding: "8px 6px",
                                  textAlign: "center",
                                  cursor: "pointer",
                                  transition: "all 0.15s ease"
                                }}
                              >
                                <div style={{ fontSize: 12.5, fontWeight: 700, color: isSelected ? "#c8f064" : "#17201d" }}>{item.label}</div>
                                <div style={{ fontSize: 10, color: isSelected ? "#a4cf5a" : "#717f79", marginTop: 2 }}>{item.desc}</div>
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
                              border: quizMode === "study" ? "1.5px solid #4b6623" : "1px solid #dce2da",
                              borderRadius: 8,
                              padding: "12px 14px",
                              textAlign: "left",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              boxShadow: quizMode === "study" ? "0 2px 6px rgba(75, 102, 35, 0.08)" : "none",
                              transition: "all 0.15s ease"
                            }}
                          >
                            <BookOpen size={18} color={quizMode === "study" ? "#4b6623" : "#6f7975"} />
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 700 }}>Mode Belajar</div>
                              <div style={{ fontSize: 10.5, color: "#6f7975", marginTop: 1 }}>Pembahasan langsung per nomor</div>
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={() => setQuizMode("exam")}
                            style={{
                              backgroundColor: quizMode === "exam" ? "#f4f8ed" : "#ffffff",
                              color: quizMode === "exam" ? "#18221f" : "#56615d",
                              border: quizMode === "exam" ? "1.5px solid #4b6623" : "1px solid #dce2da",
                              borderRadius: 8,
                              padding: "12px 14px",
                              textAlign: "left",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              boxShadow: quizMode === "exam" ? "0 2px 6px rgba(75, 102, 35, 0.08)" : "none",
                              transition: "all 0.15s ease"
                            }}
                          >
                            <Clock size={18} color={quizMode === "exam" ? "#4b6623" : "#6f7975"} />
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 700 }}>Mode Tryout</div>
                              <div style={{ fontSize: 10.5, color: "#6f7975", marginTop: 1 }}>Simulasi ujian berwaktu mundur</div>
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
                          border: "none",
                          borderRadius: 8,
                          padding: "13px 24px",
                          fontSize: 14,
                          fontWeight: 800,
                          cursor: isGeneratingQuiz ? "not-allowed" : "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 8,
                          marginTop: 6,
                          boxShadow: "0 4px 12px rgba(24, 34, 31, 0.16)",
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
                        {quizQuestions.filter((q, i) => isQuizAnswerCorrect(q, userAnswers[i])).length} Benar
                      </span>
                      <span style={{ color: "#991b1b", backgroundColor: "#fef2f2", border: "1px solid #fecaca", padding: "4px 10px", borderRadius: 999 }}>
                        {quizQuestions.filter((q, i) => userAnswers[i] !== undefined && !isQuizAnswerCorrect(q, userAnswers[i])).length} Salah
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
                        onClick={() => {
                          if (setActiveTab) setActiveTab("material");
                        }}
                        style={{
                          backgroundColor: "#f4f6f1",
                          border: "1px solid #779f2f",
                          color: "#22370c",
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
                        <BookOpen size={14} />
                        <span>Buka Bedah Teori & Kisi-Kisi</span>
                      </button>

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
                    {/* Question Strip Navigation (Tampil di Exam Mode & Study Mode) */}
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
                            title={`Lompat ke Soal ${idx + 1}`}
                          >
                            {idx + 1}
                            {isFlg && <Flag size={8} color="#f59e0b" style={{ position: "absolute", top: -3, right: -2 }} />}
                          </button>
                        );
                      })}
                    </div>

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
                      key={currentQuestionIndex}
                      className="quiz-card-enter"
                      style={{
                        backgroundColor: "#ffffff",
                        border: "1px solid #dde1da",
                        borderRadius: 12,
                        padding: "20px 16px",
                        marginBottom: 16,
                        boxShadow: "0 10px 35px rgba(27, 39, 35, 0.04)"
                      }}
                    >
                      {/* Indikator Pilihan Ganda Kompleks / Kategori */}
                      {isKategori && (
                        <div style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ backgroundColor: "#fef3c7", color: "#92400e", border: "1px solid #fde68a", fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                            Pilihan Ganda Kompleks Kategori (Pilih Benar / Salah Tiap Baris)
                          </span>
                        </div>
                      )}
                      {isMultiple && (
                        <div style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ backgroundColor: "#e0f2fe", color: "#0369a1", border: "1px solid #bae6fd", fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                            Pilihan Ganda Kompleks (Pilih Lebih Dari 1)
                          </span>
                        </div>
                      )}

                      {/* Indikator Soal Bergambar (visual reference dari OCR) */}
                      {currentQuestion?.has_visual && !currentQuestion?.imageUrl && (
                        <div style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ backgroundColor: "#fef3c7", color: "#92400e", border: "1px solid #fde68a", fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 4, letterSpacing: "0.04em" }}>
                            ⚠ Soal ini merujuk gambar/grafik yang tidak tersedia digital
                          </span>
                        </div>
                      )}

                      {/* Image Stimulus Soal jika ada */}
                      {currentQuestion?.imageUrl && (
                        <div style={{ marginBottom: 20, textAlign: "center" }}>
                          <img
                            src={currentQuestion.imageUrl}
                            alt={currentQuestion.imageCaption || "Stimulus Visual Soal"}
                            style={{ width: "100%", maxWidth: "100%", maxHeight: 580, borderRadius: 10, border: "1px solid #dde1da", objectFit: "contain", backgroundColor: "#fafbf8", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}
                          />
                          {currentQuestion.imageCaption && (
                            <div style={{ fontSize: 12, fontWeight: 600, color: "#56615d", marginTop: 8, fontStyle: "italic" }}>
                              {currentQuestion.imageCaption}
                            </div>
                          )}
                        </div>
                      )}

                      <div style={{ fontSize: 16, fontWeight: 600, lineHeight: "1.6", color: "#17201d", marginBottom: currentQuestion?.formula ? 12 : 18 }}>
                        <MathView text={currentQuestion?.question} />
                      </div>

                      {/* Question Formula Card: HANYA tampil jika user sudah menjawab di mode Belajar agar tidak membocorkan cara pengerjaan soal saat ujian */}
                      {quizMode === "study" && isAnswerSubmitted && currentQuestion?.formula && (
                        <div className="question-formula">
                          <MathView text={currentQuestion.formula} />
                        </div>
                      )}

                      {/* 5 Options (A, B, C, D, E) atau Matrix Kategori */}
                      {isKategori ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
                          <div style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 90px 90px",
                            padding: "10px 14px",
                            backgroundColor: "#18221f",
                            color: "#c8f064",
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: 700,
                            letterSpacing: "0.5px"
                          }}>
                            <span>PERNYATAAN</span>
                            <span style={{ textAlign: "center" }}>BENAR</span>
                            <span style={{ textAlign: "center" }}>SALAH</span>
                          </div>
                          {(currentQuestion?.matrixStatements || []).map((stmt, sIdx) => {
                            const userResp = selectedOption && typeof selectedOption === "object" ? selectedOption[sIdx] : null;
                            const isSubmitted = isAnswerSubmitted && quizMode === "study";
                            const correctResp = stmt.correctAnswer || "BENAR";
                            const isRowCorrect = userResp === correctResp;

                            return (
                              <div
                                key={sIdx}
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: "1fr 90px 90px",
                                  alignItems: "center",
                                  padding: "12px 14px",
                                  backgroundColor: isSubmitted ? (isRowCorrect ? "#f4fbf0" : "#fef2f2") : "#ffffff",
                                  border: `1.5px solid ${isSubmitted ? (isRowCorrect ? "#8dbd42" : "#f87171") : "#e5e7eb"}`,
                                  borderRadius: 8,
                                  gap: 8
                                }}
                              >
                                <div style={{ fontSize: 13.5, color: "#1f2937", lineHeight: 1.5 }}>
                                  <MathView text={stmt.statement} />
                                </div>
                                <div style={{ display: "flex", justifyContent: "center" }}>
                                  <button
                                    onClick={() => handleSelectMatrixAnswer && handleSelectMatrixAnswer(sIdx, "BENAR")}
                                    disabled={quizMode === "study" && isAnswerSubmitted}
                                    style={{
                                      padding: "6px 14px",
                                      borderRadius: 6,
                                      fontSize: 12,
                                      fontWeight: 700,
                                      cursor: isSubmitted ? "default" : "pointer",
                                      border: "1px solid",
                                      borderColor: userResp === "BENAR" ? "#18221f" : "#d1d5db",
                                      backgroundColor: userResp === "BENAR" ? "#18221f" : "#ffffff",
                                      color: userResp === "BENAR" ? "#c8f064" : "#4b5563"
                                    }}
                                  >
                                    BENAR
                                  </button>
                                </div>
                                <div style={{ display: "flex", justifyContent: "center" }}>
                                  <button
                                    onClick={() => handleSelectMatrixAnswer && handleSelectMatrixAnswer(sIdx, "SALAH")}
                                    disabled={quizMode === "study" && isAnswerSubmitted}
                                    style={{
                                      padding: "6px 14px",
                                      borderRadius: 6,
                                      fontSize: 12,
                                      fontWeight: 700,
                                      cursor: isSubmitted ? "default" : "pointer",
                                      border: "1px solid",
                                      borderColor: userResp === "SALAH" ? "#18221f" : "#d1d5db",
                                      backgroundColor: userResp === "SALAH" ? "#18221f" : "#ffffff",
                                      color: userResp === "SALAH" ? "#c8f064" : "#4b5563"
                                    }}
                                  >
                                    SALAH
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {currentQuestion?.options.map((opt, idx) => {
                          const optionLetter = String.fromCharCode(65 + idx);
                          const isSelected = isOptionSelected(idx);
                          const isCorrectOption = correctIndices.includes(idx);

                          let bgColor = "#fafbf8";
                          let borderColor = "#dfe4dc";
                          let textColor = "#56615d";
                          let shadow = "none";

                          if (quizMode === "study") {
                            if (isAnswerSubmitted) {
                              if (isCorrectOption) {
                                bgColor = "#eef8db";
                                borderColor = "#8dbd42";
                                textColor = "#22370c";
                              } else if (isSelected && !isCorrectOption) {
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
                                borderLeft: isSelected || (isAnswerSubmitted && isCorrectOption)
                                  ? `4px solid ${isAnswerSubmitted ? (isCorrectOption ? "#65a30d" : "#ef4444") : (quizMode === "exam" ? "#c8f064" : "#4b6623")}`
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
                                  borderRadius: isMultiple ? 4 : 6,
                                  backgroundColor: quizMode === "study" && isAnswerSubmitted && isCorrectOption ? "#8dbd42" : quizMode === "study" && isAnswerSubmitted && isSelected ? "#ef4444" : (quizMode === "exam" && isSelected ? "#c8f064" : (isSelected ? "#22370c" : "#ffffff")),
                                  color: (quizMode === "study" && isAnswerSubmitted && (isCorrectOption || isSelected)) ? "#ffffff" : (quizMode === "exam" && isSelected ? "#18221f" : (isSelected ? "#ffffff" : "#17201d")),
                                  border: isSelected ? "1px solid #18221f" : "1px solid #dce1da",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: 12,
                                  fontWeight: 700,
                                  fontFamily: "'DM Mono', monospace",
                                  flexShrink: 0
                                }}
                              >
                                {quizMode === "study" && isAnswerSubmitted && isCorrectOption ? (
                                  <Check size={14} />
                                ) : quizMode === "study" && isAnswerSubmitted && isSelected ? (
                                  <X size={14} />
                                ) : (
                                  isMultiple && isSelected ? "✓" : optionLetter
                                )}
                              </div>
                              <MathView text={opt.replace(/^[A-Ea-e][.)]\s*/, "")} style={{ flex: 1 }} />
                            </button>
                          );
                        })}
                      </div>
                      )}

                      {/* Tombol Periksa Jawaban Khusus Mode Belajar untuk Pilgan Kompleks & Kategori */}
                      {(isMultiple || isKategori) && quizMode === "study" && !isAnswerSubmitted && (
                        <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end" }}>
                          <button
                            onClick={handleSubmitMultipleAnswer}
                            disabled={isKategori
                              ? !selectedOption || Object.keys(selectedOption).length < (currentQuestion?.matrixStatements?.length || 1)
                              : (!Array.isArray(selectedOption) || selectedOption.length === 0)}
                            style={{
                              backgroundColor: (isKategori
                                ? !selectedOption || Object.keys(selectedOption).length < (currentQuestion?.matrixStatements?.length || 1)
                                : (!Array.isArray(selectedOption) || selectedOption.length === 0)) ? "#f4f6f2" : "#22370c",
                              color: (isKategori
                                ? !selectedOption || Object.keys(selectedOption).length < (currentQuestion?.matrixStatements?.length || 1)
                                : (!Array.isArray(selectedOption) || selectedOption.length === 0)) ? "#9ca3af" : "#ffffff",
                              border: "1px solid #c2e28f",
                              padding: "9px 18px",
                              borderRadius: 8,
                              fontSize: 13,
                              fontWeight: 700,
                              cursor: (isKategori
                                ? !selectedOption || Object.keys(selectedOption).length < (currentQuestion?.matrixStatements?.length || 1)
                                : (!Array.isArray(selectedOption) || selectedOption.length === 0)) ? "not-allowed" : "pointer",
                              transition: "all 0.15s ease"
                            }}
                          >
                            Periksa Jawaban {isKategori ? `(${Object.keys(selectedOption || {}).length}/${currentQuestion?.matrixStatements?.length || 0} Terisi)` : `(${Array.isArray(selectedOption) ? selectedOption.length : 0} Terpilih)`}
                          </button>
                        </div>
                      )}

                      {/* Feedback banner immediately after answering in study mode */}
                      {quizMode === "study" && isAnswerSubmitted && (
                        <div
                          style={{
                            marginTop: 18,
                            padding: "16px",
                            backgroundColor: "#f8f9f5",
                            borderRadius: 12,
                            border: "1px solid #dde1da",
                            borderLeft: isCorrect ? "3px solid #8dbd42" : "3px solid #ef4444"
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                            {isCorrect ? (
                              <>
                                <CheckCircle2 size={16} color="#4b6623" />
                                <span style={{ fontSize: 13, fontWeight: 700, color: "#22370c" }}>Jawaban Anda Benar</span>
                              </>
                            ) : (
                              <>
                                <XCircle size={16} color="#ef4444" />
                                <span style={{ fontSize: 13, fontWeight: 700, color: "#991b1b" }}>
                                  Kunci Benar: {isKategori ? (
                                    currentQuestion?.matrixStatements?.map((s, idx) => `P${idx+1}: ${s.correctAnswer}`).join(", ")
                                  ) : isMultiple ? (
                                    `Pilihan ${correctIndices.map(i => String.fromCharCode(65 + i)).join(", ")}`
                                  ) : (
                                    `Pilihan ${String.fromCharCode(65 + (currentQuestion.correctIndex ?? 0))}`
                                  )}
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

                          {/* 3. Analisis per opsi (dari pipeline exam) */}
                          {currentQuestion.analisis_opsi && Object.keys(currentQuestion.analisis_opsi).length > 0 && (
                            <div
                              style={{
                                fontSize: 12,
                                lineHeight: "1.6",
                                border: "1px solid #dce1da",
                                borderRadius: 8,
                                padding: "9px 12px",
                                backgroundColor: "#fbfcfa"
                              }}
                            >
                              <div style={{ fontSize: 11, fontWeight: 700, color: "#60706a", marginBottom: 5, letterSpacing: ".03em" }}>
                                ANALISIS OPSI
                              </div>
                              {Object.entries(currentQuestion.analisis_opsi).map(([k, v]) => {
                                const isKey = correctIndices.some(idx => "ABCDE"[idx] === k.toUpperCase());
                                return (
                                  <div key={k} style={{ display: "flex", gap: 7, marginBottom: 3 }}>
                                    <span style={{ fontWeight: 800, color: isKey ? "#3f6212" : "#92400e", minWidth: 12 }}>
                                      {k}
                                    </span>
                                    <span style={{ color: "#45544e", flex: 1 }}>
                                      <MathView text={v} />
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* 4. Pitfalls & Trap Analysis */}
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

                          {/* 4. Trik Cepat + meta soal dari pipeline exam */}
                          {(currentQuestion.trik_cepat || currentQuestion.tingkat || currentQuestion.estimasi_detik) && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginTop: 2 }}>
                              {currentQuestion.tingkat && (
                                <span style={{ fontSize: 11, fontWeight: 600, color: "#45544e", backgroundColor: "#f1f4ef", border: "1px solid #dce1da", borderRadius: 999, padding: "3px 9px" }}>
                                  {currentQuestion.tingkat}
                                </span>
                              )}
                              {currentQuestion.estimasi_detik ? (
                                <span style={{ fontSize: 11, fontWeight: 600, color: "#45544e", backgroundColor: "#f1f4ef", border: "1px solid #dce1da", borderRadius: 999, padding: "3px 9px" }}>
                                  ~{currentQuestion.estimasi_detik}s ideal
                                </span>
                              ) : null}
                              {currentQuestion.subtes && (
                                <span style={{ fontSize: 11, fontWeight: 600, color: "#45544e", backgroundColor: "#f1f4ef", border: "1px solid #dce1da", borderRadius: 999, padding: "3px 9px" }}>
                                  {String(currentQuestion.subtes).replace(/_/g, " ")}
                                </span>
                              )}
                              {currentQuestion.perlu_review && (
                                <span style={{ fontSize: 11, fontWeight: 700, color: "#92400e", backgroundColor: "#fffbeb", border: "1px solid #fde68a", borderRadius: 999, padding: "3px 9px" }}>
                                  perlu review
                                </span>
                              )}
                            </div>
                          )}

                          {currentQuestion.trik_cepat && (
                            <div
                              style={{
                                fontSize: 12,
                                color: "#14532d",
                                backgroundColor: "#f0fdf4",
                                border: "1px solid #bbf7d0",
                                borderRadius: 8,
                                padding: "8px 12px",
                                display: "flex",
                                alignItems: "flex-start",
                                gap: 6
                              }}
                            >
                              <Zap size={14} style={{ flexShrink: 0, marginTop: 2 }} />
                              <span><strong>Trik Cepat: </strong><MathView text={currentQuestion.trik_cepat} /></span>
                            </div>
                          )}

                          {/* Tombol Shortcut Loncat ke Bedah Teori di Tab Materi */}
                          <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px dashed #dce2da", display: "flex", justifyContent: "flex-end" }}>
                            <button
                              type="button"
                              onClick={() => {
                                if (setActiveTab) {
                                  window.location.hash = `#soal-${currentQuestion.id || currentQuestionIndex + 1}`;
                                  setActiveTab("material");
                                }
                              }}
                              style={{
                                backgroundColor: "#18221f",
                                color: "#c8f064",
                                border: "none",
                                borderRadius: 7,
                                padding: "7px 14px",
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                boxShadow: "0 2px 6px rgba(24,34,31,0.12)",
                                transition: "all 0.15s ease"
                              }}
                            >
                              <BookOpen size={13} />
                              <span>Buka Bedah Teori & Langkah Nomor Ini di Tab Materi →</span>
                            </button>
                          </div>
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

                          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                            {currentQuestionIndex > 0 && (
                              <button
                                onClick={handlePrevQuizQuestion}
                                style={{
                                  backgroundColor: "#fafbf8",
                                  color: "#56615d",
                                  border: "1px solid #dce1da",
                                  borderRadius: 8,
                                  padding: "10px 16px",
                                  fontSize: 13,
                                  fontWeight: 600,
                                  cursor: "pointer"
                                }}
                              >
                                ← Sebelumnya
                              </button>
                            )}

                            {currentQuestionIndex < quizQuestions.length - 1 && (
                              <button
                                onClick={handleNextQuizQuestion}
                                style={{
                                  backgroundColor: "#18221f",
                                  color: "#c8f064",
                                  border: "none",
                                  borderRadius: 8,
                                  padding: "10px 22px",
                                  fontSize: 13.5,
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 6,
                                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)"
                                }}
                              >
                                <span>Soal Berikutnya</span>
                                <ChevronRight size={15} />
                              </button>
                            )}

                            {/* Tombol Kumpulkan HANYA MUNCUL JIKA SEMUA SOAL SUDAH DIJAWAB! */}
                            {(() => {
                              const answeredCount = Object.keys(userAnswers || {}).filter(k => {
                                const ans = userAnswers[Number(k)];
                                if (ans === undefined || ans === null) return false;
                                if (Array.isArray(ans)) return ans.length > 0;
                                return true;
                              }).length;
                              const totalQuestions = quizQuestions.length;
                              const isAllAnswered = totalQuestions > 0 && answeredCount >= totalQuestions;

                              if (isAllAnswered) {
                                return (
                                  <button
                                    onClick={handleExamSubmit}
                                    style={{
                                      backgroundColor: "#15803d",
                                      color: "#ffffff",
                                      border: "none",
                                      borderRadius: 8,
                                      padding: "10px 20px",
                                      fontSize: 13.5,
                                      fontWeight: 700,
                                      cursor: "pointer",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 6,
                                      boxShadow: "0 2px 10px rgba(21, 128, 61, 0.3)"
                                    }}
                                  >
                                    <CheckCircle2 size={16} />
                                    <span>Kumpulkan Lembar Tryout ({answeredCount}/{totalQuestions})</span>
                                  </button>
                                );
                              }

                              return (
                                <span
                                  style={{
                                    fontSize: 12,
                                    fontFamily: "'DM Mono', monospace",
                                    color: "#6b7280",
                                    backgroundColor: "#f3f4f6",
                                    padding: "6px 12px",
                                    borderRadius: 6,
                                    border: "1px solid #e5e7eb"
                                  }}
                                  title="Selesaikan seluruh soal untuk memunculkan tombol kumpulkan"
                                >
                                  Terjawab: {answeredCount}/{totalQuestions} Soal
                                </span>
                              );
                            })()}
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

                          {/* Tombol Lewati / Lanjut Soal */}
                          <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                            {!isAnswerSubmitted && currentQuestionIndex < quizQuestions.length - 1 && (
                              <button
                                onClick={handleNextQuizQuestion}
                                style={{
                                  backgroundColor: "#fafbf8",
                                  color: "#56615d",
                                  border: "1px solid #dce1da",
                                  borderRadius: 8,
                                  padding: "9px 16px",
                                  fontSize: 12.5,
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 5
                                }}
                                title="Lewati soal ini dan kerjakan nanti"
                              >
                                <span>Lewati Soal</span>
                                <ChevronRight size={14} />
                              </button>
                            )}

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
                          <div style={{ maxHeight: 380, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, marginBottom: 12, paddingRight: 4 }}>
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
                                const msgId = m.id || `msg_${i}`;
                                return (
                                  <div
                                    key={msgId}
                                    style={{
                                      alignSelf: isUser ? "flex-end" : "flex-start",
                                      maxWidth: isUser ? "85%" : "95%",
                                      backgroundColor: isUser ? "#18221f" : "#ffffff",
                                      color: isUser ? "#eff5ec" : "#17201d",
                                      border: isUser ? "none" : "1px solid #dde1da",
                                      borderRadius: isUser ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                                      padding: isUser ? "9px 13px" : "12px 15px",
                                      fontSize: 13,
                                      lineHeight: "1.58",
                                      boxShadow: isUser ? "0 2px 8px rgba(24, 34, 31, 0.1)" : "0 2px 8px rgba(27, 39, 35, 0.02)"
                                    }}
                                  >
                                    {isUser ? (
                                      <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{m.content}</div>
                                    ) : (
                                      <>
                                        <div className="nara-md-response" style={{ fontSize: 13, lineHeight: 1.58 }}>
                                          <ReactMarkdown
                                            remarkPlugins={STATIC_REMARK_PLUGINS}
                                            rehypePlugins={STATIC_REHYPE_PLUGINS}
                                          >
                                            {sanitizeMathMarkdown(m.content)}
                                          </ReactMarkdown>
                                        </div>
                                        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6, paddingTop: 4, borderTop: "1px solid #edf1ea" }}>
                                          <button
                                            type="button"
                                            onClick={() => handleCopyQuizChat(msgId, m.content)}
                                            title="Salin penjelasan"
                                            style={{
                                              background: "none",
                                              border: "none",
                                              cursor: "pointer",
                                              color: "#74827b",
                                              fontSize: 11,
                                              display: "inline-flex",
                                              alignItems: "center",
                                              gap: 4,
                                              padding: "2px 6px",
                                              borderRadius: 4
                                            }}
                                          >
                                            {copiedQuizChatId === msgId ? (
                                              <>
                                                <Check size={11} color="#457025" />
                                                <span style={{ color: "#457025", fontWeight: 600 }}>Tersalin</span>
                                              </>
                                            ) : (
                                              <>
                                                <Copy size={11} />
                                                <span>Salin</span>
                                              </>
                                            )}
                                          </button>
                                        </div>
                                      </>
                                    )}
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

                          {/* Chat input box: Colocated local input to prevent App/QuizTab re-render avalanche */}
                          <QuizTutorInputBar
                            isAnswerSubmitted={isAnswerSubmitted}
                            isQuizChatSending={isQuizChatSending}
                            onSend={(text) => handleSendQuizQuestionChat(text)}
                          />
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
                        showNotice={showNotice}
                      />
                    )}

                  </div>
                )}
              </div>
  );
});
