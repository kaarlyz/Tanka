import { useState } from "react";
import { EnrichSuggestion } from "../types";

export function useEnrichWeb(
  activeDocId: string | null,
  activeDocContent: string,
  onEnrichSuccess: (newContent: string) => void,
  showNotice: (msg: string) => void
) {
  const [isEnrichModalOpen, setIsEnrichModalOpen] = useState(false);
  const [enrichSuggestions, setEnrichSuggestions] = useState<EnrichSuggestion[]>([]);
  const [selectedEnrichTitles, setSelectedEnrichTitles] = useState<string[]>([]);
  const [enrichFocusText, setEnrichFocusText] = useState("");
  const [isEnriching, setIsEnriching] = useState(false);
  const [isEnrichSuggestionsLoading, setIsEnrichSuggestionsLoading] = useState(false);

  const handleOpenEnrichModal = async () => {
    if (!activeDocId) return;
    setIsEnrichModalOpen(true);
    setIsEnrichSuggestionsLoading(true);
    try {
      const res = await fetch("/api/documents/enrich-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: activeDocId, content: activeDocContent })
      });
      const data = await res.json();
      if (data.ok && Array.isArray(data.suggestions)) {
        setEnrichSuggestions(data.suggestions);
      }
    } catch {}
    finally {
      setIsEnrichSuggestionsLoading(false);
    }
  };

  const handleToggleSelectEnrich = (title: string, focus: string) => {
    const isSelected = selectedEnrichTitles.includes(title);
    const nextTitles = isSelected
      ? selectedEnrichTitles.filter((t) => t !== title)
      : [...selectedEnrichTitles, title];

    setSelectedEnrichTitles(nextTitles);

    if (!isSelected) {
      setEnrichFocusText((prev) => {
        const trimmed = prev.trim();
        return trimmed ? `${trimmed}\n- [${title}]: ${focus}` : `- [${title}]: ${focus}`;
      });
    }
  };

  const handleApplyEnrichment = async (focusText: string) => {
    if (!activeDocId) return;
    setIsEnriching(true);
    try {
      const res = await fetch(`/api/documents/${activeDocId}/enrich`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ focus: focusText })
      });
      const data = await res.json();
      if (data.ok && data.document) {
        onEnrichSuccess(data.document.content);
        setIsEnrichModalOpen(false);
        setSelectedEnrichTitles([]);
        setEnrichFocusText("");
        showNotice("Materi berhasil diperkaya dari sumber web ilmiah!");
      } else {
        showNotice(data.error || "Gagal memperkaya materi");
      }
    } catch (err: any) {
      showNotice("Gagal memperkaya materi: " + err.message);
    } finally {
      setIsEnriching(false);
    }
  };

  return {
    isEnrichModalOpen,
    setIsEnrichModalOpen,
    enrichSuggestions,
    selectedEnrichTitles,
    enrichFocusText,
    setEnrichFocusText,
    isEnriching,
    isEnrichSuggestionsLoading,
    handleOpenEnrichModal,
    handleToggleSelectEnrich,
    handleApplyEnrichment
  };
}
