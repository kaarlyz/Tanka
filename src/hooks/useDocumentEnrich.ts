import { useState, useEffect, useCallback } from "react";
import { EnrichSuggestion } from "../types";

export interface UseDocumentEnrichProps {
  activeDocId: string | null;
  activeDocTitle: string;
  activeDocContent: string;
  selectedModel: string;
  setActiveDocContent: (content: string) => void;
  fetchDocuments: () => Promise<void>;
  showNotice: (msg: string) => void;
}

export function useDocumentEnrich({
  activeDocId,
  activeDocTitle,
  activeDocContent,
  selectedModel,
  setActiveDocContent,
  fetchDocuments,
  showNotice
}: UseDocumentEnrichProps) {
  const [isEnriching, setIsEnriching] = useState(false);
  const [isEnrichModalOpen, setIsEnrichModalOpen] = useState(false);
  const [enrichFocus, setEnrichFocus] = useState("");
  const [enrichSuggestions, setEnrichSuggestions] = useState<EnrichSuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [selectedEnrichTitles, setSelectedEnrichTitles] = useState<string[]>([]);

  useEffect(() => {
    if (isEnrichModalOpen && activeDocContent) {
      setIsLoadingSuggestions(true);
      fetch("/api/documents/enrich-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: activeDocTitle,
          content: activeDocContent.slice(0, 3500)
        })
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.suggestions && data.suggestions.length > 0) {
            setEnrichSuggestions(data.suggestions);
          }
        })
        .catch((err) => {
          console.error("Gagal muat saran pengayaan:", err);
        })
        .finally(() => {
          setIsLoadingSuggestions(false);
        });
    }
  }, [isEnrichModalOpen, activeDocId]);

  const handleEnrichDocument = useCallback(async () => {
    if (!activeDocId) return;
    setIsEnriching(true);
    try {
      const res = await fetch(`/api/documents/${activeDocId}/enrich`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ focusTopic: enrichFocus, model: selectedModel })
      });
      const data = await res.json();
      if (data.success) {
        setActiveDocContent(data.content);
        showNotice(`Materi berhasil diperkaya (+${Math.round(data.addedLength / 5)} kata referensi baru)`);
        setIsEnrichModalOpen(false);
        setEnrichFocus("");
        await fetchDocuments();
      } else {
        showNotice(data.error || "Gagal memperkaya materi");
      }
    } catch {
      showNotice("Koneksi ke 9Router gagal");
    } finally {
      setIsEnriching(false);
    }
  }, [activeDocId, enrichFocus, selectedModel, setActiveDocContent, fetchDocuments, showNotice]);

  return {
    isEnriching,
    isEnrichModalOpen,
    setIsEnrichModalOpen,
    enrichFocus,
    setEnrichFocus,
    enrichSuggestions,
    isLoadingSuggestions,
    selectedEnrichTitles,
    setSelectedEnrichTitles,
    handleEnrichDocument
  };
}
