import { useState, useCallback } from "react";
import { Flashcard } from "../types";

export interface UseFlashcardsProps {
  activeDocId: string | null;
  selectedModel: string;
  showNotice: (msg: string) => void;
}

export function useFlashcards({ activeDocId, selectedModel, showNotice }: UseFlashcardsProps) {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isGeneratingCards, setIsGeneratingCards] = useState(false);

  const handleGenerateFlashcards = useCallback(async () => {
    if (!activeDocId) {
      showNotice("Pilih atau simpan materi terlebih dahulu");
      return;
    }
    setIsGeneratingCards(true);
    try {
      const res = await fetch("/api/ai/generate-flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docId: activeDocId,
          model: selectedModel
        })
      });
      const data = await res.json();
      if (data.success && data.flashcards) {
        setFlashcards(data.flashcards);
        setCurrentCardIndex(0);
        setIsFlipped(false);
        showNotice(`${data.flashcards.length} kartu baru berhasil dibuat`);
      } else {
        showNotice(data.error || "Gagal menghasilkan flashcards");
      }
    } catch {
      showNotice("Koneksi ke 9Router gagal");
    } finally {
      setIsGeneratingCards(false);
    }
  }, [activeDocId, selectedModel, showNotice]);

  const handleReviewCard = useCallback(async (difficulty: "again" | "hard" | "good" | "easy" | any) => {
    if (flashcards.length === 0) return;
    const currentCard = flashcards[currentCardIndex];
    if (!currentCard) return;

    try {
      await fetch(`/api/flashcards/${currentCard.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ difficulty })
      });
      const updated = [...flashcards];
      updated[currentCardIndex].difficulty = difficulty;
      setFlashcards(updated);
    } catch (e) {
      console.error(e);
    }

    setIsFlipped(false);
    setTimeout(() => {
      if (currentCardIndex < flashcards.length - 1) {
        setCurrentCardIndex(currentCardIndex + 1);
      } else {
        showNotice("Putaran kartu selesai!");
      }
    }, 200);
  }, [flashcards, currentCardIndex, showNotice]);

  return {
    flashcards,
    setFlashcards,
    currentCardIndex,
    setCurrentCardIndex,
    isFlipped,
    setIsFlipped,
    isGeneratingCards,
    handleGenerateFlashcards,
    handleReviewCard
  };
}
