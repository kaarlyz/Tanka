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
    setIsGeneratingTopic(true);

    try {
      // Step 0: Cek keambiguan topik terlebih dahulu (Fast Ambiguity Check)
      const uRes = await fetch("/api/ai/topic-understand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: raw, model: selectedModel })
      });
      const uData = await uRes.json();

      // JIKA TOPIK AMBIGU / BERMAKNA GANDA: Buka Step 2 agar murid memilih cabang yang benar
      if (uData.success && uData.ambigu && Array.isArray(uData.opsi_cabang) && uData.opsi_cabang.length > 0) {
        setTopicClarificationData({
          formalTitle: uData.topik_kanonik || raw,
          subject: uData.mapel || "Pilihan Cabang Materi",
          questions: [
            {
              id: "cabang_materi",
              question: "Materi ini memiliki beberapa cabang ilmu. Kamu sedang ingin fokus ke mana?",
              choices: uData.opsi_cabang
            }
          ]
        });
        setTopicAnswers({
          cabang_materi: uData.opsi_cabang[0]
        });
        setTopicStep(2);
        setIsGeneratingTopic(false);
        return;
      }

      // JIKA TOPIK JELAS: Langsung gas buat modul (1-Click)
      setTopicClarificationData({
        formalTitle: uData.topik_kanonik || raw,
        subject: uData.mapel || "Umum",
        questions: []
      });
      setTopicStep(3);
      const res = await fetch("/api/ai/topic-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: raw,
          formalTitle: uData.topik_kanonik || raw,
          subject: uData.mapel || "Umum",
          answers: {},
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
        setTopicStep(1);
      }
    } catch {
      showNotice("Gagal menyusun dokumen materi");
      setTopicStep(1);
    } finally {
      setIsGeneratingTopic(false);
    }
  }, [topicInput, selectedModel, fetchDocuments, loadDocument, setActiveTab, showNotice]);

  const handleGenerateTopicDocument = useCallback(async () => {
    if (!topicClarificationData) return;
    setIsGeneratingTopic(true);
    setTopicStep(3);
    try {
      const chosenBranch = topicAnswers["cabang_materi"] || "";
      const effectiveTopic = chosenBranch || topicInput;
      const customCtx = topicAnswers["custom_context"] ? topicAnswers["custom_context"].trim() : "";

      const res = await fetch("/api/ai/topic-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: customCtx ? `${effectiveTopic} (${customCtx})` : effectiveTopic,
          formalTitle: chosenBranch || topicClarificationData.formalTitle,
          subject: chosenBranch.includes("Sosiologi") ? "Sosiologi" : (chosenBranch.includes("Matematika") ? "Matematika" : topicClarificationData.subject),
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
