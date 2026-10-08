import { useState, useCallback, useEffect } from "react";
import { QuizQuestion, MistakeItem, ChatMessage } from "../types";

export interface UseQuizProps {
  activeDocId: string | null;
  selectedModel: string;
  quizType: "beginner" | "conceptual" | "analytical" | "standard" | "hots" | "calculation" | "story" | any;
  showNotice: (msg: string) => void;
  recordMistake: (question: QuizQuestion, userAnswerIdx: number) => void;
  activeDocContent?: string;
  onExamComplete?: (result: { finalScore: number; correctCount: number; totalQuestions: number }) => void;
}

export function useQuiz({ activeDocId, selectedModel, quizType, showNotice, recordMistake, activeDocContent, onExamComplete }: UseQuizProps) {
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizQuestionCount, setQuizQuestionCount] = useState(5);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [isQuizCompleted, setIsQuizCompleted] = useState(false);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [solutionStep, setSolutionStep] = useState(0);

  // Exam Mode state
  const [quizMode, setQuizMode] = useState<"study" | "exam">("study");
  const [examTimeLeft, setExamTimeLeft] = useState(0);
  const [isExamTimerRunning, setIsExamTimerRunning] = useState(false);
  const [examFlagged, setExamFlagged] = useState<Record<number, boolean>>({});
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [examDurationSeconds, setExamDurationSeconds] = useState(0);

  const resetQuizState = useCallback(() => {
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setScore(0);
    setUserAnswers({});
    setIsQuizCompleted(false);
    setIsQuizChatOpen(false);
    setExamSubmitted(false);
    setExamFlagged({});
    setIsExamTimerRunning(false);
  }, []);

  const [isQuizChatOpen, setIsQuizChatOpen] = useState(false);

  const handleGenerateQuiz = useCallback(async (customCount?: number | unknown) => {
    const targetCount =
      typeof customCount === "number" && !isNaN(customCount) && customCount > 0
        ? customCount
        : (quizQuestionCount || 5);

    if (!activeDocId) {
      showNotice("Pilih atau simpan materi terlebih dahulu");
      return;
    }
    setIsGeneratingQuiz(true);
    try {
      const res = await fetch("/api/ai/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docId: activeDocId,
          model: selectedModel,
          count: targetCount,
          quizType,
          lastScore: isQuizCompleted ? score : null
        })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success && Array.isArray(data.questions) && data.questions.length > 0) {
        setQuizQuestions(data.questions);
        resetQuizState();
        showNotice(`Paket latihan ${data.questions.length} soal berhasil dibuat`);
      } else {
        showNotice(data.error || "Gagal membuat soal latihan");
      }
    } catch (err: any) {
      console.error("Quiz generation error:", err);
      showNotice(err?.message ? `Gagal terhubung ke 9Router: ${err.message}` : "Koneksi ke 9Router gagal");
    } finally {
      setIsGeneratingQuiz(false);
    }
  }, [activeDocId, selectedModel, quizQuestionCount, quizType, isQuizCompleted, score, showNotice, resetQuizState]);

  const handleSelectQuizOption = useCallback((optionIdx: number) => {
    if (quizMode === "study") {
      if (isAnswerSubmitted) return;
      setSelectedOption(optionIdx);
      setIsAnswerSubmitted(true);

      const currentQ = quizQuestions[currentQuestionIndex];
      const isCorrect = optionIdx === currentQ.correctIndex;
      if (isCorrect) {
        const points = Math.round(100 / (quizQuestions.length || 5));
        setScore((prev) => prev + points);
      } else {
        recordMistake(currentQ, optionIdx);
      }

      setUserAnswers((prev) => ({
        ...prev,
        [currentQuestionIndex]: optionIdx
      }));
    } else {
      setSelectedOption(optionIdx);
      setUserAnswers((prev) => ({
        ...prev,
        [currentQuestionIndex]: optionIdx
      }));
    }
  }, [quizMode, isAnswerSubmitted, quizQuestions, currentQuestionIndex, recordMistake]);

  const handlePrevQuizQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      const prevIdx = currentQuestionIndex - 1;
      setCurrentQuestionIndex(prevIdx);
      setSolutionStep(0);
      const prevAnswer = userAnswers[prevIdx];
      setSelectedOption(prevAnswer !== undefined ? prevAnswer : null);
      if (quizMode === "study") {
        setIsAnswerSubmitted(prevAnswer !== undefined);
      }
    }
  }, [currentQuestionIndex, userAnswers, quizMode]);

  const toggleFlagQuestion = useCallback((idx: number) => {
    setExamFlagged((prev) => ({ ...prev, [idx]: !prev[idx] }));
  }, []);

  const handleNextQuizQuestion = useCallback(() => {
    setIsQuizChatOpen(false);
    setSolutionStep(0);
    const nextIdx = currentQuestionIndex + 1;
    if (nextIdx < quizQuestions.length) {
      setCurrentQuestionIndex(nextIdx);
      const nextAnswer = userAnswers[nextIdx];
      if (nextAnswer !== undefined) {
        setSelectedOption(nextAnswer);
        setIsAnswerSubmitted(quizMode === "study");
      } else {
        setSelectedOption(null);
        setIsAnswerSubmitted(false);
      }
    } else {
      if (quizMode === "study") {
        setIsQuizCompleted(true);
      }
    }
  }, [currentQuestionIndex, quizQuestions.length, userAnswers, quizMode]);

  const handleExamSubmit = useCallback(() => {
    setIsExamTimerRunning(false);
    setExamSubmitted(true);
    setIsQuizCompleted(true);
    
    let correctCount = 0;
    quizQuestions.forEach((q, idx) => {
      const uAns = userAnswers[idx];
      if (uAns === q.correctIndex) {
        correctCount++;
      } else if (uAns !== undefined) {
        recordMistake(q, uAns);
      }
    });

    const finalScore = Math.round((correctCount / (quizQuestions.length || 1)) * 100);
    setScore(finalScore);
    showNotice(`Tryout Selesai! Skor Anda: ${finalScore} / 100 (${correctCount} Benar dari ${quizQuestions.length} Soal)`);
    if (onExamComplete) {
      onExamComplete({ finalScore, correctCount, totalQuestions: quizQuestions.length });
    }
  }, [quizQuestions, userAnswers, recordMistake, showNotice, onExamComplete]);

  useEffect(() => {
    let timer: any = null;
    if (quizMode === "exam" && isExamTimerRunning && !examSubmitted && examTimeLeft > 0) {
      timer = setInterval(() => {
        setExamTimeLeft((prev) => {
          if (prev <= 1) {
            handleExamSubmit();
            showNotice("Waktu Tryout Habis! Lembar jawaban telah dikumpulkan.");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [quizMode, isExamTimerRunning, examSubmitted, examTimeLeft, handleExamSubmit, showNotice]);

  // Per-question interactive AI Tutor Chat
  const [quizChatMessages, setQuizChatMessages] = useState<Record<number, ChatMessage[]>>({});
  const [quizChatInput, setQuizChatInput] = useState("");
  const [isQuizChatSending, setIsQuizChatSending] = useState(false);

  const handleSendQuizQuestionChat = useCallback(async (presetText?: string) => {
    const text = presetText || quizChatInput;
    if (!text.trim() || isQuizChatSending) return;
    const currentQ = quizQuestions[currentQuestionIndex];
    if (!currentQ) return;

    const currentHistory = quizChatMessages[currentQuestionIndex] || [];
    const userMsg: ChatMessage = { id: "user_" + Date.now(), role: "user", content: text.trim() };
    const newHistory = [...currentHistory, userMsg];
    setQuizChatMessages((prev) => ({
      ...prev,
      [currentQuestionIndex]: newHistory
    }));
    if (!presetText) setQuizChatInput("");
    setIsQuizChatSending(true);

    try {
      const res = await fetch("/api/ai/quiz-question-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docId: activeDocId,
          question: currentQ.question,
          options: currentQ.options,
          correctIndex: currentQ.correctIndex,
          userSelectedIndex: selectedOption,
          userMessage: text.trim(),
          chatHistory: currentHistory,
          model: selectedModel
        })
      });
      const data = await res.json();
      if (data.success && data.reply) {
        const botMsg: ChatMessage = { id: "bot_" + Date.now(), role: "assistant", content: data.reply };
        setQuizChatMessages((prev) => ({
          ...prev,
          [currentQuestionIndex]: [
            ...(prev[currentQuestionIndex] || []),
            botMsg
          ]
        }));
      } else {
        showNotice(data.error || "Gagal menghubungi Tutor AI");
      }
    } catch {
      showNotice("Koneksi ke server AI gagal");
    } finally {
      setIsQuizChatSending(false);
    }
  }, [quizChatInput, isQuizChatSending, quizQuestions, currentQuestionIndex, quizChatMessages, activeDocId, selectedOption, selectedModel, showNotice]);

  return {
    quizQuestions, setQuizQuestions,
    quizQuestionCount, setQuizQuestionCount,
    currentQuestionIndex, setCurrentQuestionIndex,
    selectedOption, setSelectedOption,
    isAnswerSubmitted, setIsAnswerSubmitted,
    score, setScore,
    userAnswers, setUserAnswers,
    isQuizCompleted, setIsQuizCompleted,
    isGeneratingQuiz, setIsGeneratingQuiz,
    solutionStep, setSolutionStep,
    quizMode, setQuizMode,
    examTimeLeft, setExamTimeLeft,
    isExamTimerRunning, setIsExamTimerRunning,
    examFlagged, setExamFlagged,
    examSubmitted, setExamSubmitted,
    examDurationSeconds, setExamDurationSeconds,
    isQuizChatOpen, setIsQuizChatOpen,
    quizChatMessages, setQuizChatMessages,
    quizChatInput, setQuizChatInput,
    isQuizChatSending,
    handleSendQuizQuestionChat,
    handleGenerateQuiz,
    handleSelectQuizOption,
    handlePrevQuizQuestion,
    handleNextQuizQuestion,
    toggleFlagQuestion,
    handleExamSubmit,
    resetQuizState
  };
}
