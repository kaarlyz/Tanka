import { useState, useCallback, useEffect, useRef } from "react";
import { DocumentItem } from "../types";

export const ACTIVE_DOC_STORAGE_KEY = "tanka_active_doc_id";

export interface UseDocumentsProps {
  showNotice: (msg: string) => void;
  setActiveTab: (tab: any) => void;
  onDocumentLoaded?: (doc: any) => void;
}

export function useDocuments({ showNotice, setActiveTab, onDocumentLoaded }: UseDocumentsProps) {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const documentsRef = useRef<DocumentItem[]>([]);
  documentsRef.current = documents;
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

  const loadDocument = useCallback(async (idOrDoc: string | any, callback?: (doc: any) => void) => {
    const targetId = typeof idOrDoc === "string" ? idOrDoc : idOrDoc?.id;
    if (!targetId) return;

    if (typeof window !== "undefined") {
      localStorage.setItem(ACTIVE_DOC_STORAGE_KEY, targetId);
    }

    // 1. Optimistic synchronous hydrate from cache/object to eliminate lag/flicker
    const local = (typeof idOrDoc === "object" && idOrDoc?.content)
      ? idOrDoc
      : documentsRef.current.find((d) => d.id === targetId);

    if (local) {
      setActiveDocId(local.id);
      setActiveDocTitle(local.title || "");
      setActiveDocContent(local.content || "");
      setActiveDocSummary(local.summary || "");
      if (callback) callback(local);
      if (onDocumentLoaded) onDocumentLoaded(local);
    } else {
      setActiveDocId(targetId);
    }

    try {
      const res = await fetch(`/api/documents/${targetId}`);
      const data = await res.json();
      if (data.document) {
        setActiveDocId(data.document.id);
        if (data.document.title && data.document.title !== local?.title) {
          setActiveDocTitle(data.document.title);
        }
        // Cegah re-render berat jika isi konten sama persis dengan yang sudah dimuat di memori
        if (data.document.content && data.document.content !== local?.content) {
          setActiveDocContent(data.document.content);
        }
        if (data.document.summary && data.document.summary !== local?.summary) {
          setActiveDocSummary(data.document.summary);
        }
        if (!local) {
          if (callback) callback(data.document);
          if (onDocumentLoaded) onDocumentLoaded(data.document);
        }

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
              const pollRes = await fetch(`/api/documents/${targetId}`);
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
  }, [onDocumentLoaded, showNotice]);

  const fetchDocuments = useCallback(async () => {
    try {
      // Baca query param ?id= jika user membuka tautan langsung ke dokumen tertentu
      const urlParams = new URLSearchParams(window.location.search);
      const urlDocId = urlParams.get("id");
      const savedDocId = typeof window !== "undefined" ? localStorage.getItem(ACTIVE_DOC_STORAGE_KEY) : null;

      const res = await fetch("/api/documents");
      const data = await res.json();
      if (data.documents) {
        setDocuments(data.documents);
        const docToLoad = (urlDocId && data.documents.some((d: any) => d.id === urlDocId))
          ? urlDocId
          : (savedDocId && data.documents.some((d: any) => d.id === savedDocId))
            ? savedDocId
            : null;

        if (docToLoad) {
          loadDocument(docToLoad);
        }
      }
    } catch (err) {
      console.error("Gagal mengambil daftar dokumen:", err);
    }
  }, [loadDocument]);

  const handleDeleteDocument = useCallback(async (id: string, e?: React.MouseEvent, resetCallback?: () => void) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (!confirm("Hapus materi ini beserta kartu dan riwayat obrolannya?")) return;
    try {
      await fetch(`/api/documents/${id}`, { method: "DELETE" });
      showNotice("Materi dan seluruh catatan terkait berhasil dihapus");
      if (activeDocId === id) {
        if (typeof window !== "undefined") {
          localStorage.removeItem(ACTIVE_DOC_STORAGE_KEY);
        }
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
        if (typeof window !== "undefined") {
          localStorage.removeItem(ACTIVE_DOC_STORAGE_KEY);
        }
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
