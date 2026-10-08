import { useState, useMemo, useCallback } from "react";
import { MistakeItem, QuizQuestion, UserAccount } from "../types";
import { getEffectiveUserId } from "../utils/session";

export interface UseMistakesProps {
  activeDocId: string | null;
  activeDocTitle: string;
  showNotice: (msg: string) => void;
  currentUser?: UserAccount | null;
}

export function useMistakes({ activeDocId, activeDocTitle, showNotice, currentUser }: UseMistakesProps) {
  const userId = useMemo(() => getEffectiveUserId(currentUser), [currentUser?.id]);
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
      const res = await fetch(`/api/mistakes?userId=${encodeURIComponent(userId)}`, {
        headers: { "X-User-Id": userId }
      });
      const data = await res.json();
      if (data.success && data.mistakes) {
        setMistakes(data.mistakes);
      }
    } catch (err) {
      console.error("Failed to fetch mistakes:", err);
    }
  }, [userId]);

  const recordMistake = useCallback(async (q: QuizQuestion, userAnswerIdx: number) => {
    try {
      await fetch("/api/mistakes/record", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-User-Id": userId },
        body: JSON.stringify({
          docId: activeDocId,
          docTitle: activeDocTitle,
          userId,
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
  }, [activeDocId, activeDocTitle, fetchMistakes, userId]);

  const resolveMistake = useCallback(async (id: string) => {
    try {
      await fetch(`/api/mistakes/${id}/resolve?userId=${encodeURIComponent(userId)}`, {
        method: "POST",
        headers: { "X-User-Id": userId }
      });
      setMistakes((prev) => prev.filter((m) => m.id !== id));
      showNotice("Soal ditandai sudah dikuasai! Dihapus dari Bank Soal Salah.");
    } catch (err) {
      console.error(err);
    }
  }, [showNotice, userId]);

  const deleteMistake = useCallback(async (id: string) => {
    try {
      await fetch(`/api/mistakes/${id}?userId=${encodeURIComponent(userId)}`, {
        method: "DELETE",
        headers: { "X-User-Id": userId }
      });
      setMistakes((prev) => prev.filter((m) => m.id !== id));
      showNotice("Soal dihapus dari Bank Soal Salah.");
    } catch (err) {
      console.error(err);
    }
  }, [showNotice, userId]);

  const handleClearMistakes = useCallback(async () => {
    const isCurrent = mistakeFilterScope === "current" && activeDocId;
    const msg = isCurrent
      ? `Kosongkan semua catatan salah pada modul "${activeDocTitle}"?`
      : "Kosongkan seluruh catatan di Bank Kesalahan?";
    if (!confirm(msg)) return;

    try {
      const url = isCurrent 
        ? `/api/mistakes/clear?docId=${encodeURIComponent(activeDocId)}&userId=${encodeURIComponent(userId)}` 
        : `/api/mistakes/clear?userId=${encodeURIComponent(userId)}`;
      await fetch(url, { method: "POST", headers: { "X-User-Id": userId } });
      setMistakes((prev) => (isCurrent ? prev.filter((m) => m.docId !== activeDocId) : []));
      showNotice("Bank kesalahan berhasil dibersihkan");
    } catch (err) {
      showNotice("Gagal mengosongkan bank kesalahan");
    }
  }, [mistakeFilterScope, activeDocId, activeDocTitle, showNotice, userId]);

  return {
    mistakes, setMistakes,
    isDrillingMistakes, setIsDrillingMistakes,
    mistakeFilterScope, setMistakeFilterScope,
    activeDocMistakes, displayedMistakes,
    fetchMistakes, recordMistake, resolveMistake, deleteMistake, handleClearMistakes
  };
}
