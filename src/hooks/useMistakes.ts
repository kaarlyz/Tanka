import { useState, useMemo, useCallback } from "react";
import { MistakeItem, QuizQuestion } from "../types";

export interface UseMistakesProps {
  activeDocId: string | null;
  activeDocTitle: string;
  showNotice: (msg: string) => void;
}

export function useMistakes({ activeDocId, activeDocTitle, showNotice }: UseMistakesProps) {
  const [mistakes, setMistakes] = useState<MistakeItem[]>([]);
  const [isDrillingMistakes, setIsDrillingMistakes] = useState(false);
  const [mistakeFilterScope, setMistakeFilterScope] = useState<"current" | "all">("current");

  const activeDocMistakes = useMemo(() => {
    if (!activeDocId) return mistakes;
    return mistakes.filter((m) => m.docId === activeDocId);
  }, [mistakes, activeDocId]);

  const displayedMistakes = mistakeFilterScope === "current" && activeDocId ? activeDocMistakes : mistakes;

  const fetchMistakes = useCallback(async () => {
    try {
      const res = await fetch("/api/mistakes");
      const data = await res.json();
      if (data.success && data.mistakes) {
        setMistakes(data.mistakes);
      }
    } catch (err) {
      console.error("Failed to fetch mistakes:", err);
    }
  }, []);

  const recordMistake = useCallback(async (q: QuizQuestion, userAnswerIdx: number) => {
    try {
      await fetch("/api/mistakes/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docId: activeDocId,
          docTitle: activeDocTitle,
          question: q.question,
          options: q.options,
          correctIndex: q.correctIndex,
          userAnswerIndex: userAnswerIdx,
          formula: q.formula || "",
          steps: q.steps || [],
          explanation: q.explanation || "",
          pitfall: q.pitfall || ""
        })
      });
      fetchMistakes();
    } catch (err) {
      console.error("Failed to record mistake:", err);
    }
  }, [activeDocId, activeDocTitle, fetchMistakes]);

  const resolveMistake = useCallback(async (id: string) => {
    try {
      await fetch(`/api/mistakes/${id}/resolve`, { method: "POST" });
      setMistakes((prev) => prev.filter((m) => m.id !== id));
      showNotice("Soal ditandai sudah dikuasai! Dihapus dari Bank Soal Salah.");
    } catch (err) {
      console.error(err);
    }
  }, [showNotice]);

  const deleteMistake = useCallback(async (id: string) => {
    try {
      await fetch(`/api/mistakes/${id}`, { method: "DELETE" });
      setMistakes((prev) => prev.filter((m) => m.id !== id));
      showNotice("Soal dihapus dari Bank Soal Salah.");
    } catch (err) {
      console.error(err);
    }
  }, [showNotice]);

  const handleClearMistakes = useCallback(async () => {
    const isCurrent = mistakeFilterScope === "current" && activeDocId;
    const msg = isCurrent
      ? `Kosongkan semua catatan salah pada modul "${activeDocTitle}"?`
      : "Kosongkan seluruh catatan di Bank Kesalahan?";
    if (!confirm(msg)) return;

    try {
      const url = isCurrent ? `/api/mistakes/clear?docId=${activeDocId}` : "/api/mistakes/clear";
      await fetch(url, { method: "POST" });
      setMistakes((prev) => (isCurrent ? prev.filter((m) => m.docId !== activeDocId) : []));
      showNotice("Bank kesalahan berhasil dibersihkan");
    } catch (err) {
      showNotice("Gagal mengosongkan bank kesalahan");
    }
  }, [mistakeFilterScope, activeDocId, activeDocTitle, showNotice]);

  return {
    mistakes, setMistakes,
    isDrillingMistakes, setIsDrillingMistakes,
    mistakeFilterScope, setMistakeFilterScope,
    activeDocMistakes, displayedMistakes,
    fetchMistakes, recordMistake, resolveMistake, deleteMistake, handleClearMistakes
  };
}
