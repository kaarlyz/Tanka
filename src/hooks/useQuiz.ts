import { useState, useCallback, useEffect } from "react";
import { QuizQuestion, MistakeItem, ChatMessage } from "../types";

export interface UseQuizProps {
  activeDocId: string | null;
  selectedModel: string;
  quizType: "beginner" | "conceptual" | "analytical" | "standard" | "hots" | "calculation" | "story" | any;
  setQuizType?: (type: string) => void;
  showNotice: (msg: string) => void;
  recordMistake: (question: QuizQuestion, userAnswerIdx: number) => void;
  activeDocContent?: string;
  onExamComplete?: (result: { finalScore: number; correctCount: number; totalQuestions: number }) => void;
}

export function isQuizAnswerCorrect(q: QuizQuestion | undefined | null, answer: any): boolean {
  if (!q || answer === undefined || answer === null) return false;

  // Tipe Kategori: matriks per baris pernyataan
  if (q.questionType === "kategori" && Array.isArray(q.matrixStatements) && q.matrixStatements.length > 0) {
    if (!answer || typeof answer !== "object") return false;
    return q.matrixStatements.every((stmt, idx) => {
      const userResp = String(answer[idx] || "").trim().toUpperCase();
      const expectedResp = String(stmt.correctAnswer || "").trim().toUpperCase();
      return userResp === expectedResp;
    });
  }

  if (q.questionType === "multiple" || (Array.isArray(q.correctIndices) && q.correctIndices.length > 1)) {
    const expected = (q.correctIndices || [q.correctIndex]).slice().sort((a, b) => a - b);
    const actual = (Array.isArray(answer) ? answer : [answer]).slice().sort((a, b) => a - b);
    if (expected.length !== actual.length) return false;
    return expected.every((val, idx) => val === actual[idx]);
  }
  const singleAns = Array.isArray(answer) ? answer[0] : answer;
  return singleAns === q.correctIndex;
}

export function useQuiz({ activeDocId, selectedModel, quizType, setQuizType, showNotice, recordMistake, activeDocContent, onExamComplete }: UseQuizProps) {
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizQuestionCount, setQuizQuestionCount] = useState(5);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | number[] | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, number | number[]>>({});
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

  // Sinkronisasi memuat kuis tersimpan saat dokumen aktif berganti
  useEffect(() => {
    if (!activeDocId) {
      setQuizQuestions([]);
      resetQuizState();
      return;
    }
    let isCancelled = false;
    fetch(`/api/documents/${activeDocId}/quizzes`)
      .then((res) => res.json())
      .then((data) => {
        if (!isCancelled && data && data.quiz && Array.isArray(data.quiz.questions) && data.quiz.questions.length > 0) {
          setQuizQuestions(data.quiz.questions);
          if (data.quiz.quizType && setQuizType) {
            const mappedType =
              data.quiz.quizType === "hots" ? "analytical" :
              data.quiz.quizType === "standard" ? "conceptual" :
              data.quiz.quizType;
            setQuizType(mappedType);
          }
          resetQuizState();
        } else if (!isCancelled) {
          setQuizQuestions([]);
          resetQuizState();
        }
      })
      .catch((e: unknown) => { if (!isCancelled) console.error("quiz fetch:", e); });
    return () => {
      isCancelled = true;
    };
  }, [activeDocId, activeDocContent, resetQuizState, setQuizType]);

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
        if (data.quizType && setQuizType) {
          const mappedType =
            data.quizType === "hots" ? "analytical" :
            data.quizType === "standard" ? "conceptual" :
            data.quizType;
          setQuizType(mappedType);
        }
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
  }, [activeDocId, selectedModel, quizQuestionCount, quizType, isQuizCompleted, score, showNotice, resetQuizState, setQuizType]);

  const handleSelectQuizOption = useCallback((optionIdx: number) => {
    const currentQ = quizQuestions[currentQuestionIndex];
    if (currentQ?.questionType === "kategori") return;
    const isMultiple = currentQ?.questionType === "multiple" || (Array.isArray(currentQ?.correctIndices) && currentQ.correctIndices.length > 1);

    if (isMultiple) {
      if (quizMode === "study" && isAnswerSubmitted) return;
      const currentArr: number[] = Array.isArray(selectedOption)
        ? selectedOption
        : (selectedOption !== null && selectedOption !== undefined ? [selectedOption as number] : []);
      const nextArr = currentArr.includes(optionIdx)
        ? currentArr.filter((i) => i !== optionIdx)
        : [...currentArr, optionIdx].sort((a, b) => a - b);

      setSelectedOption(nextArr);
      setUserAnswers((prev) => ({
        ...prev,
        [currentQuestionIndex]: nextArr
      }));
      return;
    }

    if (quizMode === "study") {
      if (isAnswerSubmitted) return;
      setSelectedOption(optionIdx);
      setIsAnswerSubmitted(true);

      const isCorrect = optionIdx === currentQ?.correctIndex;
      if (isCorrect) {
        const points = Math.round(100 / (quizQuestions.length || 5));
        setScore((prev) => prev + points);
      } else if (currentQ) {
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
  }, [quizMode, isAnswerSubmitted, quizQuestions, currentQuestionIndex, selectedOption, recordMistake]);

  const handleSubmitMultipleAnswer = useCallback(() => {
    if (isAnswerSubmitted) return;
    const currentQ = quizQuestions[currentQuestionIndex];
    if (!currentQ) return;
    setIsAnswerSubmitted(true);

    const currentAns = userAnswers[currentQuestionIndex] !== undefined ? userAnswers[currentQuestionIndex] : selectedOption;
    const isCorrect = isQuizAnswerCorrect(currentQ, currentAns);
    if (isCorrect) {
      const points = Math.round(100 / (quizQuestions.length || 5));
      setScore((prev) => prev + points);
    } else {
      const firstSelected = Array.isArray(currentAns) ? (currentAns[0] ?? 0) : (typeof currentAns === 'number' ? currentAns : 0);
      recordMistake(currentQ, firstSelected);
    }
  }, [isAnswerSubmitted, quizQuestions, currentQuestionIndex, userAnswers, selectedOption, recordMistake]);

  const handleSelectMatrixAnswer = useCallback((stmtIdx: number, val: string) => {
    if (quizMode === "study" && isAnswerSubmitted) return;
    setUserAnswers((prev) => {
      const currentAnsObj = (prev[currentQuestionIndex] && typeof prev[currentQuestionIndex] === "object" && !Array.isArray(prev[currentQuestionIndex]))
        ? { ...(prev[currentQuestionIndex] as any) }
        : {};
      currentAnsObj[stmtIdx] = val;
      setSelectedOption(currentAnsObj as any);
      return {
        ...prev,
        [currentQuestionIndex]: currentAnsObj
      };
    });
  }, [quizMode, isAnswerSubmitted, currentQuestionIndex]);

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
      if (isQuizAnswerCorrect(q, uAns)) {
        correctCount++;
      } else if (uAns !== undefined) {
        const firstSelected = Array.isArray(uAns) ? (uAns[0] ?? 0) : uAns;
        recordMistake(q, firstSelected);
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
    handleSubmitMultipleAnswer,
    handleSelectMatrixAnswer,
    isQuizAnswerCorrect,
    handlePrevQuizQuestion,
    handleNextQuizQuestion,
    toggleFlagQuestion,
    handleExamSubmit,
    resetQuizState
  };
}
