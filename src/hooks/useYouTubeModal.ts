import { useState, useCallback } from "react";

export interface UseYouTubeModalProps {
  selectedModel?: string;
  fetchDocuments: () => Promise<void>;
  loadDocument: (id: string) => Promise<void>;
  setActiveTab: (tab: any) => void;
  showNotice: (msg: string) => void;
}

export function useYouTubeModal({
  selectedModel,
  fetchDocuments,
  loadDocument,
  setActiveTab,
  showNotice
}: UseYouTubeModalProps) {
  const [isYouTubeModalOpen, setIsYouTubeModalOpen] = useState(false);
  const [ytUrl, setYtUrl] = useState("");
  const [ytGoal, setYtGoal] = useState<"theory" | "exam">("theory");
  const [ytInstruction, setYtInstruction] = useState("");
  const [isCheckingUrl, setIsCheckingUrl] = useState(false);
  const [isGeneratingYt, setIsGeneratingYt] = useState(false);
  const [ytInfo, setYtInfo] = useState<{
    videoId: string;
    title: string;
    author: string;
    thumbnail: string;
    language: string;
    snippetCount: number;
    textPreview: string;
  } | null>(null);
  const [ytError, setYtError] = useState("");

  const handleCheckUrl = useCallback(async (customUrl?: string) => {
    const targetUrl = (customUrl || ytUrl).trim();
    if (!targetUrl) return;
    setIsCheckingUrl(true);
    setYtError("");
    setYtInfo(null);
    try {
      const res = await fetch("/api/documents/youtube-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl })
      });
      const data = await res.json();
      if (data.success) {
        setYtInfo(data);
      } else {
        setYtError(data.error || "Gagal memproses video YouTube");
      }
    } catch (err: any) {
      setYtError("Gagal menghubungi server: " + (err.message || String(err)));
    } finally {
      setIsCheckingUrl(false);
    }
  }, [ytUrl]);

  const handleGenerateDocument = useCallback(async () => {
    const targetUrl = ytUrl.trim();
    if (!targetUrl) {
      setYtError("Masukkan tautan video YouTube");
      return;
    }
    setIsGeneratingYt(true);
    setYtError("");
    try {
      const res = await fetch("/api/documents/youtube", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: targetUrl,
          title: ytInfo?.title || undefined,
          goal: ytGoal,
          instruction: ytInstruction.trim() || undefined,
          model: selectedModel
        })
      });
      const data = await res.json();
      if (data.success && data.id) {
        await fetchDocuments();
        await loadDocument(data.id);
        setIsYouTubeModalOpen(false);
        setYtUrl("");
        setYtInfo(null);
        setYtInstruction("");
        setActiveTab("material");
        showNotice(`Materi dari video "${data.title}" berhasil disusun!`);
      } else {
        setYtError(data.error || "Gagal menyusun modul dari video YouTube");
      }
    } catch (err: any) {
      setYtError("Gagal menghubungi server: " + (err.message || String(err)));
    } finally {
      setIsGeneratingYt(false);
    }
  }, [ytUrl, ytInfo, ytGoal, ytInstruction, selectedModel, fetchDocuments, loadDocument, setActiveTab, showNotice]);

  const handleReset = useCallback(() => {
    setYtUrl("");
    setYtInfo(null);
    setYtError("");
    setYtInstruction("");
    setIsCheckingUrl(false);
    setIsGeneratingYt(false);
    setIsYouTubeModalOpen(false);
  }, []);

  return {
    isYouTubeModalOpen,
    setIsYouTubeModalOpen,
    ytUrl,
    setYtUrl,
    ytGoal,
    setYtGoal,
    ytInstruction,
    setYtInstruction,
    isCheckingUrl,
    isGeneratingYt,
    ytInfo,
    setYtInfo,
    ytError,
    setYtError,
    handleCheckUrl,
    handleGenerateDocument,
    handleReset
  };
}
