import { useState, useEffect } from "react";
import {
  QuizQuestion,
  FlashcardItem,
  MistakeItem,
  FeynmanEvaluation,
  CheatsheetItem,
  ChatMessage,
  DocumentItem
} from "../types";

export function useStudyModules(
  activeDocId: string | null,
  activeDoc: DocumentItem | undefined,
  selectedModel: string,
  showNotice: (msg: string) => void,
  setActiveDocId: (id: string) => void,
  setDocuments: React.Dispatch<React.SetStateAction<DocumentItem[]>>,
  setActiveDocContent: (c: string) => void,
  setActiveDocSummary: (s: string) => void,
  activeDocSummary: string
) {
  // Quizzes State
  const [quizzes, setQuizzes] = useState<QuizQuestion[]>([]);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);

  // Flashcards State
  const [flashcards, setFlashcards] = useState<FlashcardItem[]>([]);
  const [isGeneratingCards, setIsGeneratingCards] = useState(false);

  // Feynman State
  const [feynmanEval, setFeynmanEval] = useState<FeynmanEvaluation | null>(null);
  const [isEvaluatingFeynman, setIsEvaluatingFeynman] = useState(false);

  // Cheatsheet State
  const [cheatsheet, setCheatsheet] = useState<CheatsheetItem[]>([]);
  const [isGeneratingCheatsheet, setIsGeneratingCheatsheet] = useState(false);

  // Mistakes State
  const [mistakes, setMistakes] = useState<MistakeItem[]>([]);

  // Summary State
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  // Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatSending, setIsChatSending] = useState(false);

  // Initial fetch for Mistakes
  useEffect(() => {
    fetchMistakes();
  }, []);

  // Fetch when doc changes
  useEffect(() => {
    if (!activeDocId) return;
    fetchDocQuizzes(activeDocId);
    fetchDocFlashcards(activeDocId);
    fetchDocCheatsheet(activeDocId);
    fetchDocChat(activeDocId);
  }, [activeDocId]);

  const fetchMistakes = async () => {
    try {
      const res = await fetch("/api/mistakes");
      const data = await res.json();
      if (data.ok && Array.isArray(data.mistakes)) {
        setMistakes(data.mistakes);
      }
    } catch {}
  };

  const fetchDocQuizzes = async (id: string) => {
    try {
      const res = await fetch(`/api/documents/${id}/quizzes`);
      const data = await res.json();
      const list = Array.isArray(data.quizzes)
        ? data.quizzes
        : Array.isArray(data.questions)
        ? data.questions
        : data.quiz && Array.isArray(data.quiz.questions)
        ? data.quiz.questions
        : [];
      setQuizzes(list);
    } catch {}
  };

  const fetchDocFlashcards = async (id: string) => {
    try {
      const res = await fetch(`/api/documents/${id}/cards`);
      const data = await res.json();
      const list = Array.isArray(data.cards)
        ? data.cards
        : Array.isArray(data.flashcards)
        ? data.flashcards
        : [];
      setFlashcards(list);
    } catch {}
  };

  const fetchDocCheatsheet = async (id: string) => {
    try {
      const res = await fetch(`/api/documents/${id}/cheatsheet`);
      const data = await res.json();
      const list = Array.isArray(data.cheatsheet)
        ? data.cheatsheet
        : Array.isArray(data.formulas)
        ? data.formulas
        : [];
      setCheatsheet(list);
    } catch {}
  };

  const fetchDocChat = async (id: string) => {
    try {
      const res = await fetch(`/api/documents/${id}/chat`);
      const data = await res.json();
      if (data.ok && Array.isArray(data.messages)) {
        setChatMessages(data.messages);
      } else {
        setChatMessages([]);
      }
    } catch {}
  };

  // Quizzes Handlers
  const handleGenerateQuiz = async (params?: {
    customPrompt?: string;
    quizStyle?: string;
    focusConcept?: string;
    mode?: "append" | "replace" | "variant";
    count?: number;
  }) => {
    if (!activeDocId) return;
    setIsGeneratingQuiz(true);
    try {
      const res = await fetch("/api/ai/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docId: activeDocId,
          model: selectedModel,
          count: params?.count || 5,
          customPrompt: params?.customPrompt || "",
          quizStyle: params?.quizStyle || "conceptual",
          focusConcept: params?.focusConcept || "",
          mode: params?.mode || "replace"
        })
      });
      const data = await res.json();
      if (data.ok && Array.isArray(data.quizzes)) {
        if (data.newDocument) {
          setDocuments((prev) => [data.newDocument, ...prev]);
          setActiveDocId(data.newDocument.id);
          setActiveDocContent(data.newDocument.content);
          showNotice(`Varian baru "${data.newDocument.title}" dibuat!`);
        }
        setQuizzes(data.quizzes);
        showNotice(params?.mode === "append" ? "Soal berhasil ditambahkan!" : "Kuis siap dipelajari!");
      } else {
        showNotice(data.error || "Gagal membuat kuis");
      }
    } catch (err: any) {
      showNotice("Gagal membuat kuis: " + err.message);
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const handleRecordMistake = async (item: Partial<MistakeItem>) => {
    try {
      const res = await fetch("/api/mistakes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docId: activeDocId,
          docTitle: activeDoc?.title || "Materi",
          ...item
        })
      });
      const data = await res.json();
      if (data.ok) fetchMistakes();
    } catch {}
  };

  const handleResolveMistake = async (id: string) => {
    try {
      const res = await fetch(`/api/mistakes/${id}/resolve`, { method: "PATCH" });
      const data = await res.json();
      if (data.ok) {
        setMistakes((prev) => prev.filter((m) => m.id !== id));
        showNotice("Soal ditandai telah dipahami!");
      }
    } catch {}
  };

  const handleClearMistakes = async () => {
    if (!confirm("Kosongkan seluruh riwayat Bank Kesalahan?")) return;
    try {
      const res = await fetch("/api/mistakes", { method: "DELETE" });
      const data = await res.json();
      if (data.ok) {
        setMistakes([]);
        showNotice("Bank kesalahan dikosongkan");
      }
    } catch {}
  };

  // Flashcards Handlers
  const handleGenerateCards = async () => {
    if (!activeDocId) return;
    setIsGeneratingCards(true);
    try {
      const res = await fetch("/api/ai/generate-flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docId: activeDocId, model: selectedModel })
      });
      const data = await res.json();
      if (data.ok && Array.isArray(data.cards)) {
        setFlashcards(data.cards);
        showNotice(`${data.cards.length} kartu flashcard berhasil dibuat!`);
      }
    } catch (err: any) {
      showNotice("Gagal membuat flashcards: " + err.message);
    } finally {
      setIsGeneratingCards(false);
    }
  };

  const handleReviewCard = async (cardId: string, difficulty: "again" | "hard" | "good" | "easy") => {
    try {
      await fetch(`/api/cards/${cardId}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ difficulty })
      });
      setFlashcards((prev) =>
        prev.map((c) => (c.id === cardId ? { ...c, difficulty } : c))
      );
    } catch {}
  };

  // Summary Handlers
  const handleGenerateSummary = async (style: string) => {
    if (!activeDocId) return;
    setIsGeneratingSummary(true);
    try {
      const res = await fetch("/api/ai/generate-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docId: activeDocId, style, model: selectedModel })
      });
      const data = await res.json();
      if (data.ok && data.summary) {
        setActiveDocSummary(data.summary);
        showNotice("Rangkuman berhasil disusun!");
      }
    } catch (err: any) {
      showNotice("Gagal membuat rangkuman: " + err.message);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // Feynman Handlers
  const handleEvaluateFeynman = async (topic: string, explanation: string) => {
    if (!activeDocId) return;
    setIsEvaluatingFeynman(true);
    try {
      const res = await fetch("/api/ai/feynman-evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docId: activeDocId, topic, explanation, model: selectedModel })
      });
      const data = await res.json();
      if (data.ok && data.evaluation) {
        setFeynmanEval(data.evaluation);
        showNotice("Evaluasi Feynman selesai!");
      }
    } catch (err: any) {
      showNotice("Gagal mengevaluasi: " + err.message);
    } finally {
      setIsEvaluatingFeynman(false);
    }
  };

  // Cheatsheet Handlers
  const handleGenerateCheatsheet = async () => {
    if (!activeDocId) return;
    setIsGeneratingCheatsheet(true);
    try {
      const res = await fetch("/api/ai/generate-cheatsheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docId: activeDocId, model: selectedModel })
      });
      const data = await res.json();
      if (data.ok && Array.isArray(data.cheatsheet)) {
        setCheatsheet(data.cheatsheet);
        showNotice("Rumus & Kaidah berhasil diekstraksi!");
      }
    } catch (err: any) {
      showNotice("Gagal mengekstrak rumus: " + err.message);
    } finally {
      setIsGeneratingCheatsheet(false);
    }
  };

  // Chat Handlers
  const handleSendChatMessage = async (msg: string) => {
    if (!activeDocId) return;
    setIsChatSending(true);
    try {
      const res = await fetch(`/api/documents/${activeDocId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, model: selectedModel })
      });
      const data = await res.json();
      if (data.ok && data.reply) {
        setChatMessages((prev) => [
          ...prev,
          { role: "user", content: msg },
          { role: "assistant", content: data.reply }
        ]);
      }
    } catch (err: any) {
      showNotice("Gagal mengirim pesan: " + err.message);
    } finally {
      setIsChatSending(false);
    }
  };

  const handleClearChatHistory = async () => {
    if (!activeDocId) return;
    try {
      await fetch(`/api/documents/${activeDocId}/chat`, { method: "DELETE" });
      setChatMessages([]);
      showNotice("Riwayat tanya jawab dikosongkan");
    } catch {}
  };

  return {
    quizzes,
    setQuizzes,
    isGeneratingQuiz,
    flashcards,
    isGeneratingCards,
    feynmanEval,
    isEvaluatingFeynman,
    cheatsheet,
    isGeneratingCheatsheet,
    mistakes,
    isGeneratingSummary,
    isChatOpen,
    setIsChatOpen,
    chatMessages,
    isChatSending,
    handleGenerateQuiz,
    handleRecordMistake,
    handleResolveMistake,
    handleClearMistakes,
    handleGenerateCards,
    handleReviewCard,
    handleGenerateSummary,
    handleEvaluateFeynman,
    handleGenerateCheatsheet,
    handleSendChatMessage,
    handleClearChatHistory
  };
}
