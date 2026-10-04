import { useState, useCallback } from "react";
import { TopicClarificationData } from "../types";

export interface UseTopicGeneratorProps {
  selectedModel: string;
  fetchDocuments: () => Promise<void>;
  loadDocument: (id: string) => Promise<void>;
  setActiveTab: (tab: any) => void;
  showNotice: (msg: string) => void;
}

export function useTopicGenerator({
  selectedModel,
  fetchDocuments,
  loadDocument,
  setActiveTab,
  showNotice
}: UseTopicGeneratorProps) {
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [topicInput, setTopicInput] = useState("");
  const [topicStep, setTopicStep] = useState<1 | 2 | 3>(1);
  const [topicClarificationData, setTopicClarificationData] = useState<TopicClarificationData | null>(null);
  const [topicAnswers, setTopicAnswers] = useState<Record<string, string>>({});
  const [isClarifyingTopic, setIsClarifyingTopic] = useState(false);
  const [isGeneratingTopic, setIsGeneratingTopic] = useState(false);

  const handleStartTopicClarify = useCallback(async (topicText?: string) => {
    const raw = (topicText || topicInput).trim();
    if (!raw) {
      showNotice("Ketik nama materi yang ingin dipelajari");
      return;
    }
    setTopicInput(raw);
    setIsClarifyingTopic(true);
    try {
      const res = await fetch("/api/ai/topic-clarify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: raw, model: selectedModel })
      });
      const data = await res.json();
      if (data.success) {
        setTopicClarificationData({
          subject: data.subject || "Umum",
          formalTitle: data.formalTitle || raw,
          questions: data.questions || []
        });
        const defaults: Record<string, string> = {};
        (data.questions || []).forEach((q: any) => {
          if (q.choices && q.choices[0]) defaults[q.id] = q.choices[0];
        });
        setTopicAnswers(defaults);
        setTopicStep(2);
      } else {
        showNotice(data.error || "Gagal menganalisis topik");
      }
    } catch {
      showNotice("Koneksi ke 9Router gagal");
    } finally {
      setIsClarifyingTopic(false);
    }
  }, [topicInput, selectedModel, showNotice]);

  const handleGenerateTopicDocument = useCallback(async () => {
    if (!topicClarificationData) return;
    setIsGeneratingTopic(true);
    setTopicStep(3);
    try {
      const res = await fetch("/api/ai/topic-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topicInput,
          formalTitle: topicClarificationData.formalTitle,
          subject: topicClarificationData.subject,
          answers: topicAnswers,
          model: selectedModel
        })
      });
      const data = await res.json();
      if (data.success && data.docId) {
        await fetchDocuments();
        await loadDocument(data.docId);
        setIsTopicModalOpen(false);
        setTopicStep(1);
        setTopicInput("");
        setTopicClarificationData(null);
        setActiveTab("material");
        showNotice(`Materi "${data.title}" berhasil disusun dan siap dipelajari!`);
      } else {
        showNotice(data.error || "Gagal menyusun materi");
        setTopicStep(2);
      }
    } catch {
      showNotice("Gagal menyusun dokumen materi");
      setTopicStep(2);
    } finally {
      setIsGeneratingTopic(false);
    }
  }, [topicClarificationData, topicInput, topicAnswers, selectedModel, fetchDocuments, loadDocument, setActiveTab, showNotice]);

  return {
    isTopicModalOpen,
    setIsTopicModalOpen,
    topicInput,
    setTopicInput,
    topicStep,
    setTopicStep,
    topicClarificationData,
    setTopicClarificationData,
    topicAnswers,
    setTopicAnswers,
    isClarifyingTopic,
    isGeneratingTopic,
    handleStartTopicClarify,
    handleGenerateTopicDocument
  };
}
