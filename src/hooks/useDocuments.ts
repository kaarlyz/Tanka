import { useState, useCallback, useEffect } from "react";
import { DocumentItem } from "../types";

export interface UseDocumentsProps {
  showNotice: (msg: string) => void;
  setActiveTab: (tab: any) => void;
  onDocumentLoaded?: (doc: any) => void;
}

export function useDocuments({ showNotice, setActiveTab, onDocumentLoaded }: UseDocumentsProps) {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [activeDocTitle, setActiveDocTitle] = useState("");
  const [activeDocContent, setActiveDocContent] = useState("");
  const [activeDocSummary, setActiveDocSummary] = useState("");
  const [isDetectingTitle, setIsDetectingTitle] = useState(false);
  const [models, setModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("tanka_selected_model");
      if (saved) return saved;
    }
    return "ag/gemini-3.8-flash-low";
  });

  const handleSetSelectedModel = useCallback((model: string) => {
    setSelectedModel(model);
    if (typeof window !== "undefined") {
      localStorage.setItem("tanka_selected_model", model);
    }
  }, []);

  const fetchModels = useCallback(async () => {
    try {
      const res = await fetch("/api/models");
      const data = await res.json();
      if (data.models && data.models.length > 0) {
        setModels(data.models);
        const saved = typeof window !== "undefined" ? localStorage.getItem("tanka_selected_model") : null;
        if (saved && data.models.includes(saved)) {
          setSelectedModel(saved);
        } else if (!data.models.includes(selectedModel)) {
          const fallback = data.models.includes("ag/gemini-3.8-flash-low") ? "ag/gemini-3.8-flash-low" : data.models[0];
          setSelectedModel(fallback);
          if (typeof window !== "undefined") {
            localStorage.setItem("tanka_selected_model", fallback);
          }
        }
      }
    } catch {
      console.warn("Gagal mengambil model dari 9Router, fallback ke default");
    }
  }, [selectedModel]);

  const loadDocument = useCallback(async (id: string, callback?: (doc: any) => void) => {
    try {
      const res = await fetch(`/api/documents/${id}`);
      const data = await res.json();
      if (data.document) {
        setActiveDocId(data.document.id);
        setActiveDocTitle(data.document.title);
        setActiveDocContent(data.document.content);
        setActiveDocSummary(data.document.summary || "");
        if (callback) callback(data.document);
        if (onDocumentLoaded) onDocumentLoaded(data.document);

        // Jika dokumen berstatus processing atau baru dibuat dan masih teks mentah, poll otomatis sampai bab Nara selesai
        const isProcessing = data.document.status === "processing" || 
          (data.document.content && !data.document.content.includes("## ") && (Date.now() - (data.document.created_at || 0) < 300000));

        if (isProcessing) {
          let attempts = 0;
          const pollInterval = setInterval(async () => {
            attempts++;
            if (attempts > 30) {
              clearInterval(pollInterval);
              return;
            }
            try {
              const pollRes = await fetch(`/api/documents/${id}`);
              const pollData = await pollRes.json();
              if (pollData.document) {
                const status = pollData.document.status;
                if (status === "completed" || status === "partial" || (pollData.document.content && pollData.document.content.includes("## "))) {
                  setActiveDocContent(pollData.document.content);
                  if (pollData.document.summary) setActiveDocSummary(pollData.document.summary);
                  clearInterval(pollInterval);
                } else if (status === "failed") {
                  clearInterval(pollInterval);
                  showNotice("Pembuatan modul kurikulum mengalami kendala");
                }
              }
            } catch {
              clearInterval(pollInterval);
            }
          }, 3500);
        }
      }
    } catch (err) {
      console.error("Gagal memuat dokumen:", err);
    }
  }, [onDocumentLoaded]);

  const fetchDocuments = useCallback(async () => {
    try {
      // Baca query param ?id= jika user membuka tautan langsung ke dokumen tertentu
      const urlParams = new URLSearchParams(window.location.search);
      const urlDocId = urlParams.get("id");

      const res = await fetch("/api/documents");
      const data = await res.json();
      if (data.documents) {
        setDocuments(data.documents);
        if (urlDocId && data.documents.some((d: any) => d.id === urlDocId)) {
          loadDocument(urlDocId);
        }
      }
    } catch (err) {
      console.error("Gagal mengambil daftar dokumen:", err);
    }
  }, [activeDocId, loadDocument]);

  const handleDeleteDocument = useCallback(async (id: string, e?: React.MouseEvent, resetCallback?: () => void) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (!confirm("Hapus materi ini beserta kartu dan riwayat obrolannya?")) return;
    try {
      await fetch(`/api/documents/${id}`, { method: "DELETE" });
      showNotice("Materi dan seluruh catatan terkait berhasil dihapus");
      if (activeDocId === id) {
        setActiveDocId(null);
        setActiveDocTitle("");
        setActiveDocContent("");
        setActiveDocSummary("");
        if (resetCallback) resetCallback();
      }
      fetchDocuments();
    } catch {
      showNotice("Gagal menghapus dokumen");
    }
  }, [activeDocId, fetchDocuments, showNotice]);

  const [docSearchQuery, setDocSearchQuery] = useState("");

  const handleDeleteAllDocuments = useCallback(async (resetCallback?: () => void) => {
    if (!confirm("Peringatan: Apakah Anda yakin ingin MENGHAPUS SEMUA MODUL belajar beserta seluruh kuis, kartu flashcard, catatan kesalahan, dan riwayat obrolan? Tindakan ini tidak dapat dibatalkan.")) {
      return;
    }
    try {
      const res = await fetch("/api/documents", { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        showNotice("Seluruh modul berhasil dihapus bersih");
        setActiveDocId(null);
        setActiveDocTitle("");
        setActiveDocContent("");
        setActiveDocSummary("");
        if (resetCallback) resetCallback();
        await fetchDocuments();
      } else {
        showNotice(data.error || "Gagal menghapus seluruh modul");
      }
    } catch {
      showNotice("Koneksi ke server gagal");
    }
  }, [fetchDocuments, showNotice]);

  const handleSaveDocument = useCallback(async (title: string, content: string, onSuccess?: (id: string) => void) => {
    if (!title.trim() || !content.trim()) {
      showNotice("Judul dan isi materi tidak boleh kosong");
      return;
    }
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), content: content.trim() })
      });
      const data = await res.json();
      if (data.success) {
        showNotice("Materi berhasil disimpan");
        await fetchDocuments();
        setActiveDocId(data.id);
        setActiveDocContent(data.content || content);
        if (onSuccess) onSuccess(data.id);
      }
    } catch {
      showNotice("Gagal menyimpan materi");
    }
  }, [fetchDocuments, showNotice]);

  const handleAutoDetectTitle = useCallback(async () => {
    if (!activeDocId) return;
    setIsDetectingTitle(true);
    try {
      const res = await fetch(`/api/documents/${activeDocId}/detect-title`, { method: "POST" });
      const data = await res.json();
      if (data.success && data.title) {
        setActiveDocTitle(data.title);
        await fetchDocuments();
        showNotice(`Judul materi diperbarui: "${data.title}"`);
      } else {
        showNotice(data.error || "Gagal mendeteksi judul materi");
      }
    } catch {
      showNotice("Koneksi ke server gagal");
    } finally {
      setIsDetectingTitle(false);
    }
  }, [activeDocId, fetchDocuments, showNotice]);

  useEffect(() => {
    fetchModels();
    fetchDocuments();
  }, []);

  return {
    documents,
    setDocuments,
    activeDocId,
    setActiveDocId,
    activeDocTitle,
    setActiveDocTitle,
    activeDocContent,
    setActiveDocContent,
    activeDocSummary,
    setActiveDocSummary,
    isDetectingTitle,
    setIsDetectingTitle,
    models,
    selectedModel,
    setSelectedModel: handleSetSelectedModel,
    fetchDocuments,
    loadDocument,
    handleDeleteDocument,
    handleDeleteAllDocuments,
    docSearchQuery,
    setDocSearchQuery,
    handleSaveDocument,
    handleAutoDetectTitle
  };
}
