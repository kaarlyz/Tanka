import { useState, useCallback } from "react";

export interface UseSummaryProps {
  activeDocId: string | null;
  selectedModel: string;
  setActiveDocSummary: (summary: string) => void;
  showNotice: (msg: string) => void;
}

export function useSummary({ activeDocId, selectedModel, setActiveDocSummary, showNotice }: UseSummaryProps) {
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [summaryStyle, setSummaryStyle] = useState<any>("tutor");

  const handleGenerateSummary = useCallback(async (customStyle?: string) => {
    if (!activeDocId) {
      showNotice("Pilih atau simpan materi terlebih dahulu");
      return;
    }
    const targetStyle = customStyle || summaryStyle;
    setIsGeneratingSummary(true);
    try {
      const res = await fetch("/api/ai/generate-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docId: activeDocId,
          model: selectedModel,
          style: targetStyle
        })
      });
      const data = await res.json();
      if (data.success && data.summary) {
        setActiveDocSummary(data.summary);
        showNotice("Rangkuman cerdas berhasil dibuat");
      } else {
        showNotice(data.error || "Gagal membuat rangkuman");
      }
    } catch {
      showNotice("Koneksi ke 9Router gagal");
    } finally {
      setIsGeneratingSummary(false);
    }
  }, [activeDocId, selectedModel, summaryStyle, setActiveDocSummary, showNotice]);

  return {
    isGeneratingSummary,
    summaryStyle,
    setSummaryStyle,
    handleGenerateSummary
  };
}
