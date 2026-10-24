import { useState, useCallback, useEffect, useRef } from "react";
import { DocumentItem } from "../types";
import {
  PROCESSING_DOCS_KEY,
  getProcessingDocs,
  addProcessingDoc,
  removeProcessingDoc,
  notifyDocumentCompleted
} from "../utils/notification";

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
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const activeDocIdRef = useRef<string | null>(null);
  activeDocIdRef.current = activeDocId;
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
          addProcessingDoc(targetId);
          let attempts = 0;
          // Hanya satu poll aktif. Tanpa ini, tiap loadDocument bikin interval baru
          // yang jalan terus dan niban state dokumen yang lebih baru.
          if (pollRef.current) clearInterval(pollRef.current);
          const pollInterval = setInterval(async () => {
            attempts++;
            if (attempts > 200) {
              clearInterval(pollInterval);
              pollRef.current = null;
              return;
            }
            try {
              const pollRes = await fetch(`/api/documents/${targetId}`);
              const pollData = await pollRes.json();
              if (pollData.document) {
                const status = pollData.document.status;
                if (status === "completed" || status === "partial" || (pollData.document.content && pollData.document.content.includes("## "))) {
                  removeProcessingDoc(targetId);
                  setActiveDocContent(pollData.document.content);
                  if (pollData.document.summary) setActiveDocSummary(pollData.document.summary);
                  clearInterval(pollInterval);
                  pollRef.current = null;
                  notifyDocumentCompleted(pollData.document);
                  fetchDocuments();
                } else if (status === "failed") {
                  removeProcessingDoc(targetId);
                  clearInterval(pollInterval);
                  pollRef.current = null;
                  showNotice("Pembuatan modul kurikulum mengalami kendala");
                }
              }
            } catch {
              clearInterval(pollInterval);
              pollRef.current = null;
            }
          }, 3500);
          pollRef.current = pollInterval;
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
        data.documents.forEach((d: any) => {
          if (d.status === "processing") {
            addProcessingDoc(d.id);
          }
        });
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
      const token = typeof window !== "undefined" ? localStorage.getItem("tanka_session_token") : null;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE", headers });
      const data = await res.json();
      if (!res.ok) {
        showNotice(data.error || "Gagal menghapus dokumen");
        return;
      }
      showNotice("Materi dan seluruh catatan terkait berhasil dihapus");
      removeProcessingDoc(id);
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
      const token = typeof window !== "undefined" ? localStorage.getItem("tanka_session_token") : null;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch("/api/documents?confirm=all", { method: "DELETE", headers });
      const data = await res.json();
      if (data.success) {
        showNotice("Seluruh modul berhasil dihapus bersih");
        if (typeof window !== "undefined") {
          localStorage.removeItem(ACTIVE_DOC_STORAGE_KEY);
          localStorage.removeItem(PROCESSING_DOCS_KEY);
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
      const token = typeof window !== "undefined" ? localStorage.getItem("tanka_session_token") : null;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`/api/documents/${activeDocId}/detect-title`, { method: "POST", headers });
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

  const checkProcessingDocs = useCallback(async () => {
    const pendingIds = getProcessingDocs();
    if (pendingIds.length === 0) return;

    for (const docId of pendingIds) {
      try {
        const res = await fetch(`/api/documents/${docId}`);
        if (!res.ok) continue;
        const data = await res.json();
        const doc = data?.document;
        if (!doc) continue;

        if (doc.status === "completed" || doc.status === "partial" || (doc.content && doc.content.includes("## "))) {
          removeProcessingDoc(docId);
          notifyDocumentCompleted(doc);
          showNotice(`Materi "${doc.title || "Dokumen"}" selesai diproses!`);
          if (docId === activeDocIdRef.current) {
            setActiveDocContent(doc.content || "");
            if (doc.summary) setActiveDocSummary(doc.summary);
          }
          fetchDocuments();
        } else if (doc.status === "failed") {
          removeProcessingDoc(docId);
          showNotice(`Pembuatan materi "${doc.title || docId}" mengalami kendala`);
        }
      } catch (err) {
        console.warn("Gagal mengecek status dokumen background:", docId, err);
      }
    }
  }, [fetchDocuments, showNotice]);

  const backgroundPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const runPoller = async () => {
      const pending = getProcessingDocs();
      if (pending.length > 0) {
        await checkProcessingDocs();
      }
    };

    runPoller();
    backgroundPollRef.current = setInterval(runPoller, 3500);

    return () => {
      if (backgroundPollRef.current) {
        clearInterval(backgroundPollRef.current);
        backgroundPollRef.current = null;
      }
    };
  }, [checkProcessingDocs]);

  useEffect(() => {
    const handleWakeUp = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        fetchDocuments();
        checkProcessingDocs();
      }
    };

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleWakeUp);
    }
    if (typeof window !== "undefined") {
      window.addEventListener("focus", handleWakeUp);
    }

    return () => {
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleWakeUp);
      }
      if (typeof window !== "undefined") {
        window.removeEventListener("focus", handleWakeUp);
      }
    };
  }, [fetchDocuments, checkProcessingDocs]);

  useEffect(() => {
    fetchModels();
    fetchDocuments();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
    };
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
    handleAutoDetectTitle,
    checkProcessingDocs
  };
}
