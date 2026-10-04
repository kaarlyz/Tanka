import { useState, useEffect } from "react";
import { DocumentItem } from "../types";

export function useDocuments(showNotice: (msg: string) => void) {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [activeDocContent, setActiveDocContent] = useState("");
  const [activeDocSummary, setActiveDocSummary] = useState("");
  const [models, setModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState("ag/gemini-3.8-flash-low");
  const [searchQuery, setSearchQuery] = useState("");

  const activeDoc = documents.find((d) => d.id === activeDocId);

  useEffect(() => {
    fetchDocuments();
    fetchModels();
  }, []);

  useEffect(() => {
    if (!activeDocId) return;
    fetchDocumentDetail(activeDocId);
  }, [activeDocId]);

  const fetchDocuments = async () => {
    try {
      const res = await fetch("/api/documents");
      const data = await res.json();
      const docs = Array.isArray(data.documents) ? data.documents : (Array.isArray(data) ? data : []);
      setDocuments(docs);
      if (docs.length > 0 && !activeDocId) {
        setActiveDocId(docs[0].id);
      }
    } catch (err) {
      console.error("fetchDocuments error:", err);
    }
  };

  const fetchModels = async () => {
    try {
      const res = await fetch("/api/models");
      const data = await res.json();
      const list = Array.isArray(data.models) ? data.models : (Array.isArray(data) ? data : []);
      if (list.length > 0) {
        setModels(list);
      }
    } catch {}
  };

  const fetchDocumentDetail = async (id: string) => {
    try {
      const res = await fetch(`/api/documents/${id}`);
      const data = await res.json();
      const doc = data.document || (data.id ? data : null);
      if (doc) {
        setActiveDocContent(doc.content || "");
        setActiveDocSummary(doc.summary || "");
      }
    } catch {}
  };

  const handleSaveDocContent = async (newContent: string) => {
    if (!activeDocId) return;
    try {
      const res = await fetch(`/api/documents/${activeDocId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newContent })
      });
      const data = await res.json();
      if (data.ok) {
        setActiveDocContent(newContent);
        showNotice("Materi berhasil disimpan");
      }
    } catch {}
  };

  const handleDeleteDocument = async (id: string) => {
    if (!confirm("Hapus materi ini beserta seluruh kuis dan catatannya?")) return;
    try {
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.ok) {
        setDocuments((prev) => prev.filter((d) => d.id !== id));
        if (activeDocId === id) {
          const next = documents.find((d) => d.id !== id);
          setActiveDocId(next ? next.id : null);
        }
        showNotice("Materi dihapus");
      }
    } catch {}
  };

  const handleDetectTitle = async () => {
    if (!activeDocId) return;
    try {
      showNotice("Menganalisis judul materi...");
      const res = await fetch(`/api/documents/${activeDocId}/detect-title`, { method: "POST" });
      const data = await res.json();
      if (data.ok && data.title) {
        setDocuments((prev) =>
          prev.map((d) => (d.id === activeDocId ? { ...d, title: data.title } : d))
        );
        showNotice(`Judul diperbarui: "${data.title}"`);
      }
    } catch {}
  };

  const handleTailorMaterial = async (prompt: string, mode: "update" | "new_variant") => {
    if (!activeDocId) return;
    try {
      showNotice(mode === "update" ? "Memperbarui materi dengan AI..." : "Menyusun varian materi baru...");
      const res = await fetch(`/api/documents/${activeDocId}/tailor-material`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, mode })
      });
      const data = await res.json();
      if (data.ok) {
        if (mode === "update") {
          setActiveDocContent(data.document.content);
          showNotice("Materi berhasil disesuaikan!");
        } else if (data.newDocument) {
          setDocuments((prev) => [data.newDocument, ...prev]);
          setActiveDocId(data.newDocument.id);
          setActiveDocContent(data.newDocument.content);
          showNotice(`Varian materi baru "${data.newDocument.title}" dibuat!`);
        }
      }
    } catch (err: any) {
      showNotice("Gagal menyesuaikan materi: " + err.message);
    }
  };

  const handleCreateRawText = async (title: string, content: string) => {
    if (!content.trim()) return;
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || "Catatan Belajar",
          content: content.trim()
        })
      });
      const data = await res.json();
      const doc = data.document || (data.id ? { id: data.id, title: data.title, content: data.content, created_at: data.created_at } : null);
      if ((data.ok || data.success) && doc) {
        setDocuments((prev) => [doc, ...prev]);
        setActiveDocId(doc.id);
        setActiveDocContent(doc.content);
        showNotice(`Materi "${doc.title}" berhasil dibuat!`);
        return true;
      }
    } catch (err: any) {
      showNotice("Gagal membuat materi: " + err.message);
    }
    return false;
  };

  return {
    documents,
    setDocuments,
    activeDocId,
    setActiveDocId,
    activeDoc,
    activeDocContent,
    setActiveDocContent,
    activeDocSummary,
    setActiveDocSummary,
    models,
    selectedModel,
    setSelectedModel,
    searchQuery,
    setSearchQuery,
    handleSaveDocContent,
    handleDeleteDocument,
    handleDetectTitle,
    handleTailorMaterial,
    handleCreateRawText
  };
}
