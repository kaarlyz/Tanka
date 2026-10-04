import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import {
  Upload,
  Camera,
  FileText,
  Sparkles,
  Plus,
  Search,
  Copy,
  Check,
  RotateCw,
  Target,
  Brain,
  Layers,
  BookOpen,
  ChevronRight,
  FileUp,
  Globe,
  ChevronUp,
  ChevronDown,
  Compass,
  ListOrdered
} from "lucide-react";
import { ActiveTab, Flashcard, QuizQuestion } from "../../types";
import { MathView } from "../common/MathView";
import { renderVisualDiagramOrPre, extractTextFromNode, isAsciiDiagramText } from "../common/DiagramRenderer";
import { InteractiveMindMap } from "../common/InteractiveMindMap";

export interface MaterialTabProps {
  activeDocId: string | null;
  activeDocTitle: string;
  setActiveDocTitle: (val: string) => void;
  activeDocContent: string;
  setActiveDocContent: (val: string) => void;
  activeDocSummary: string;
  formattedContent: string;
  wordCount: number;
  flashcards: Flashcard[];
  quizQuestions: QuizQuestion[];
  isDetectingTitle: boolean;
  handleAutoDetectTitle: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  setIsEnrichModalOpen: (val: boolean) => void;
  copyToClipboard: (text: string, label?: string, id?: string) => void;
  copiedId: string | null;
  handleSaveDocument: () => void;
  setActiveTab: (tab: ActiveTab) => void;
  materialCreationTab: string;
  setMaterialCreationTab: (tab: any) => void;
  cameraInputRef: React.RefObject<HTMLInputElement | null>;
  handleGenerateSummary: () => void;
  isUploading: boolean;
  uploadError: string;
  topicInput: string;
  setTopicInput: (val: string) => void;
  setIsTopicModalOpen: (val: boolean) => void;
  handleStartTopicClarify: (topic?: string) => void;
  isEnriching: boolean;
  showRawText: boolean;
  setShowRawText: React.Dispatch<React.SetStateAction<boolean>>;
  isDragging: boolean;
  setIsDragging: (val: boolean) => void;
  handleDrop: (e: React.DragEvent) => void;
  handleGenerateQuiz: (params?: any) => void;
  handleGenerateFlashcards: () => void;
}

export function MaterialTab({
  activeDocId,
  activeDocTitle,
  setActiveDocTitle,
  activeDocContent,
  setActiveDocContent,
  activeDocSummary,
  formattedContent,
  wordCount,
  flashcards,
  quizQuestions,
  isDetectingTitle,
  handleAutoDetectTitle,
  fileInputRef,
  setIsEnrichModalOpen,
  copyToClipboard,
  copiedId,
  handleSaveDocument,
  setActiveTab,
  materialCreationTab,
  setMaterialCreationTab,
  cameraInputRef,
  handleGenerateSummary,
  isUploading,
  uploadError,
  topicInput,
  setTopicInput,
  setIsTopicModalOpen,
  handleStartTopicClarify,
  isEnriching,
  showRawText,
  setShowRawText,
  isDragging,
  setIsDragging,
  handleDrop,
  handleGenerateQuiz,
  handleGenerateFlashcards,
}: MaterialTabProps) {
  const [materialViewMode, setMaterialViewMode] = React.useState<"chapters" | "mindmap" | "full">("chapters");
  const [currentChapterIdx, setCurrentChapterIdx] = React.useState(0);
  const [completedChapters, setCompletedChapters] = React.useState<Record<number, boolean>>({});
  const [isRestructuring, setIsRestructuring] = React.useState(false);
  const [restructureNotice, setRestructureNotice] = React.useState<string | null>(null);

  const handleRestructureCurriculum = async () => {
    if (!activeDocId) return;
    setIsRestructuring(true);
    setRestructureNotice("AI sedang membedah dan menyusun materi menjadi bab-bab terstruktur...");
    try {
      const res = await fetch(`/api/documents/${activeDocId}/restructure`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      const data = await res.json();
      if (data.success && data.content) {
        setActiveDocContent(data.content);
        setRestructureNotice("Modul materi berhasil disusun ulang menjadi bab-bab terstruktur!");
        setTimeout(() => setRestructureNotice(null), 3500);
      } else {
        setRestructureNotice(data.error || "Gagal menyusun ulang materi");
        setTimeout(() => setRestructureNotice(null), 3500);
      }
    } catch {
      setRestructureNotice("Terjadi kesalahan jaringan saat menyusun modul");
      setTimeout(() => setRestructureNotice(null), 3500);
    } finally {
      setIsRestructuring(false);
    }
  };

  const [isChapterDrawerOpen, setIsChapterDrawerOpen] = React.useState(false);
  const chapterStripRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll active chapter into view smoothly
  React.useEffect(() => {
    if (chapterStripRef.current) {
      const activeBtn = chapterStripRef.current.querySelector<HTMLElement>(`[data-chapter-idx="${currentChapterIdx}"]`);
      if (activeBtn) {
        activeBtn.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      }
    }
  }, [currentChapterIdx]);

  // Partition document into bite-sized chapters by ## headings
  const chapters = React.useMemo(() => {
    const text = formattedContent || activeDocContent || "";
    if (!text) return [];
    const lines = text.split("\n");
    const list: { id: number; title: string; shortTitle: string; content: string }[] = [];
    let currentTitle = "";
    let buffer: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.trim().startsWith("## ")) {
        if (buffer.length > 0 && buffer.some((l) => l.trim().length > 0)) {
          const rawTitle = currentTitle || "Pengantar";
          const short = rawTitle.replace(/^Bab\s+\d+[:.]?\s*/i, "").trim() || rawTitle;
          list.push({
            id: list.length + 1,
            title: rawTitle,
            shortTitle: short,
            content: buffer.join("\n").trim()
          });
          buffer = [];
        }
        currentTitle = line.replace(/^##\s+/, "").replace(/[*_#]/g, "").trim();
      } else {
        buffer.push(line);
      }
    }

    if (buffer.length > 0 && buffer.some((l) => l.trim().length > 0)) {
      const rawTitle = currentTitle || "Rangkuman Inti";
      const short = rawTitle.replace(/^Bab\s+\d+[:.]?\s*/i, "").trim() || rawTitle;
      list.push({
        id: list.length + 1,
        title: rawTitle,
        shortTitle: short,
        content: buffer.join("\n").trim()
      });
    }

    // Merge introductory snippet if first chapter is not a "Bab" heading and is short overview
    if (list.length > 1 && !/^Bab\s+\d+/i.test(list[0].title) && list[0].content.length < 800) {
      const intro = list.shift()!;
      list[0].content = intro.content + "\n\n---\n\n" + list[0].content;
      list.forEach((c, idx) => { c.id = idx + 1; });
    }

    return list.length > 0 ? list : [{ id: 1, title: activeDocTitle || "Modul Utama", shortTitle: "Materi Utama", content: text }];
  }, [formattedContent, activeDocContent, activeDocTitle]);

  const markdownComponents = React.useMemo(() => ({
    h1: ({ children }: any) => (
      <h1 style={{ fontSize: 20, fontWeight: 800, color: "#17201d", marginTop: 20, marginBottom: 10, borderBottom: "1px solid #dde1da", paddingBottom: 6 }}>
        {children}
      </h1>
    ),
    h2: ({ children }: any) => (
      <h2 style={{ fontSize: 17, fontWeight: 700, color: "#22370c", marginTop: 20, marginBottom: 8 }}>
        {children}
      </h2>
    ),
    h3: ({ children }: any) => (
      <h3 style={{ fontSize: 14.5, fontWeight: 700, color: "#17201d", marginTop: 16, marginBottom: 6 }}>
        {children}
      </h3>
    ),
    p: ({ children }: any) => {
      const pText = extractTextFromNode(children);
      if (isAsciiDiagramText(pText)) {
        return renderVisualDiagramOrPre(children);
      }
      return <p style={{ marginBottom: 12, color: "#374540", lineHeight: 1.65 }}>{children}</p>;
    },
    ul: ({ children }: any) => (
      <ul style={{ paddingLeft: 18, marginBottom: 12 }}>{children}</ul>
    ),
    ol: ({ children }: any) => (
      <ol style={{ paddingLeft: 18, marginBottom: 12 }}>{children}</ol>
    ),
    li: ({ children }: any) => (
      <li style={{ marginBottom: 5, color: "#374540" }}>{children}</li>
    ),
    strong: ({ children }: any) => (
      <strong style={{ color: "#17201d", fontWeight: 700 }}>{children}</strong>
    ),
    blockquote: ({ children }: any) => (
      <blockquote style={{ borderLeft: "3px solid #8dbd42", backgroundColor: "#eef8db", padding: "10px 14px", borderRadius: "0 8px 8px 0", margin: "12px 0", color: "#22370c" }}>
        {children}
      </blockquote>
    ),
    pre: ({ children }: any) => renderVisualDiagramOrPre(children),
    code: ({ children }: any) => (
      <code style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, backgroundColor: "#f0f4ee", color: "#1f2b26", padding: "2px 5px", borderRadius: 4 }}>
        {children}
      </code>
    ),
    table: ({ children }: any) => (
      <div style={{ overflowX: "auto", margin: "14px 0" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, border: "1px solid #dde1da", borderRadius: 8, overflow: "hidden" }}>
          {children}
        </table>
      </div>
    )
  }), []);

  return (
              <div className="tab-pane-animate" style={{ maxWidth: 1080, margin: "0 auto", paddingBottom: 48 }}>
                {activeDocId ? (
                  <div
                    style={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #dde1da",
                      borderRadius: 12,
                      padding: "24px 26px 48px",
                      marginBottom: 60,
                      boxShadow: "0 10px 35px rgba(27, 39, 35, 0.04)"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 800,
                              textTransform: "uppercase",
                              letterSpacing: "0.08em",
                              color: "#273f15",
                              backgroundColor: "#eef8db",
                              border: "1px solid #c2e28f",
                              padding: "3px 8px",
                              borderRadius: 4,
                              fontFamily: "'DM Mono', monospace"
                            }}
                          >
                            Catatan Belajar Aktif
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginTop: 8 }}>
                          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#17201d", letterSpacing: "-0.03em", margin: 0, lineHeight: 1.25 }}>
                            {activeDocTitle}
                          </h1>
                          <button
                            onClick={handleAutoDetectTitle}
                            disabled={isDetectingTitle}
                            style={{
                              backgroundColor: "#f4f6f2",
                              border: "1px solid #dce1da",
                              color: "#45544e",
                              borderRadius: 6,
                              padding: "4px 8px",
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: isDetectingTitle ? "not-allowed" : "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4
                            }}
                            title="Deteksi topik pembelajaran secara otomatis berdasarkan isi materi"
                          >
                            <Sparkles size={11} />
                            {isDetectingTitle ? "Mendeteksi..." : "Deteksi Judul dari Isi"}
                          </button>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          style={{
                            backgroundColor: "#f8f9f5",
                            border: "1px solid #dce1da",
                            color: "#17201d",
                            borderRadius: 8,
                            padding: "6px 12px",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 5
                          }}
                          title="Ganti atau unggah berkas baru"
                        >
                          <Upload size={13} color="#4b6623" />
                          <span>Unggah Baru</span>
                        </button>

                        <button
                          onClick={() => setIsEnrichModalOpen(true)}
                          disabled={isEnriching || !activeDocId}
                          style={{
                            backgroundColor: "#f0f6eb",
                            border: "1px solid #c2e28f",
                            color: "#22370c",
                            borderRadius: 8,
                            padding: "6px 12px",
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: isEnriching ? "not-allowed" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 6
                          }}
                          title="Cari referensi internet atau perluas materi dengan riset AI"
                        >
                          <Globe size={14} color="#4b6623" />
                          <span>{isEnriching ? "Meneliti..." : "Perkaya Materi (Web Search)"}</span>
                        </button>

                        <button
                          onClick={handleRestructureCurriculum}
                          disabled={isRestructuring}
                          style={{
                            backgroundColor: "#f4fbeb",
                            border: "1px solid #c2e28f",
                            color: "#273f15",
                            borderRadius: 8,
                            padding: "6px 12px",
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: isRestructuring ? "wait" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 6
                          }}
                          title="Susun ulang materi ini menjadi kurikulum bab demi bab terpadu dengan AI"
                        >
                          <Sparkles size={14} color="#4b6623" />
                          <span>{isRestructuring ? "Menyusun Kurikulum..." : "Susun Bab Terpadu (AI)"}</span>
                        </button>

                        <button
                          onClick={() => copyToClipboard(activeDocContent, "Isi Modul", "docContent")}
                          style={{
                            backgroundColor: copiedId === "docContent" ? "#ecfdf5" : "#ffffff",
                            border: `1px solid ${copiedId === "docContent" ? "#10b981" : "#dce1da"}`,
                            color: copiedId === "docContent" ? "#065f46" : "#56615d",
                            borderRadius: 8,
                            padding: "6px 12px",
                            fontSize: 12,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            transition: "all 0.15s ease"
                          }}
                          title="Salin seluruh isi dokumen/modul ke clipboard"
                        >
                          {copiedId === "docContent" ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                          <span>{copiedId === "docContent" ? "Tersalin!" : "Salin Modul"}</span>
                        </button>

                        <button
                          onClick={() => setShowRawText(!showRawText)}
                          style={{
                            backgroundColor: "#ffffff",
                            border: "1px solid #dce1da",
                            color: "#56615d",
                            borderRadius: 8,
                            padding: "6px 12px",
                            fontSize: 12,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 6
                          }}
                        >
                          {showRawText ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          {showRawText ? "Sembunyikan Teks Mentah" : "Lihat / Edit Teks Mentah"}
                        </button>
                      </div>
                    </div>

                    {restructureNotice && (
                      <div style={{ padding: "10px 16px", backgroundColor: "#eef8db", border: "1px solid #c2e28f", borderRadius: 8, fontSize: 12.5, color: "#22370c", fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                        <Sparkles size={16} color="#4b6623" />
                        <span>{restructureNotice}</span>
                      </div>
                    )}

                    {/* Stats Metrics Bento Grid (Responsive 1-col mobile, 3-col desktop) */}
                    <div className="metrics-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 20 }}>
                      <div style={{ padding: "14px 16px", backgroundColor: "#f8f9f5", borderRadius: 10, border: "1px solid #dde1da" }}>
                        <div style={{ fontSize: 10.5, color: "#727d78", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.08em", fontFamily: "'DM Mono', monospace" }}>Total Kosakata</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: "#17201d", marginTop: 4, letterSpacing: "-0.02em" }}>
                          {wordCount.toLocaleString("id-ID")} <span style={{ fontSize: 12, fontWeight: 500, color: "#727d78" }}>kata</span>
                        </div>
                        <div style={{ fontSize: 11, color: "#8a9691", marginTop: 3 }}>{activeDocContent.length} karakter sumber</div>
                      </div>

                      <div style={{ padding: "14px 16px", backgroundColor: "#f8f9f5", borderRadius: 10, border: "1px solid #dde1da" }}>
                        <div style={{ fontSize: 10.5, color: "#727d78", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.08em", fontFamily: "'DM Mono', monospace" }}>Kartu Flashcard</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: "#22370c", marginTop: 4, letterSpacing: "-0.02em" }}>
                          {flashcards.length} <span style={{ fontSize: 12, fontWeight: 500, color: "#4b6623" }}>kartu</span>
                        </div>
                        <div style={{ fontSize: 11, color: "#8a9691", marginTop: 3 }}>Review Spaced Repetition</div>
                      </div>

                      <div style={{ padding: "14px 16px", backgroundColor: "#f8f9f5", borderRadius: 10, border: "1px solid #dde1da" }}>
                        <div style={{ fontSize: 10.5, color: "#727d78", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.08em", fontFamily: "'DM Mono', monospace" }}>Paket Latihan Soal</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: "#17201d", marginTop: 4, letterSpacing: "-0.02em" }}>
                          {quizQuestions.length} <span style={{ fontSize: 12, fontWeight: 500, color: "#4b6623" }}>butir</span>
                        </div>
                        <div style={{ fontSize: 11, color: "#8a9691", marginTop: 3 }}>Penalaran bertingkat HOTS</div>
                      </div>
                    </div>

                    {/* Pelajarin.ai Action Bar */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, padding: "10px 14px", backgroundColor: "#f8faf5", border: "1px solid #dde2d8", borderRadius: 10, margin: "16px 0 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <button
                          onClick={() => setMaterialViewMode("chapters")}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "7px 14px",
                            borderRadius: 8,
                            fontSize: 12.5,
                            fontWeight: 700,
                            border: materialViewMode === "chapters" ? "1px solid #18221f" : "1px solid #dce2da",
                            backgroundColor: materialViewMode === "chapters" ? "#18221f" : "#ffffff",
                            color: materialViewMode === "chapters" ? "#c8f064" : "#17201d",
                            cursor: "pointer",
                            transition: "0.15s ease"
                          }}
                        >
                          <BookOpen size={14} />
                          <span>Baca per Bab ({chapters.length})</span>
                        </button>

                        <button
                          onClick={() => setMaterialViewMode("mindmap")}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "7px 14px",
                            borderRadius: 8,
                            fontSize: 12.5,
                            fontWeight: 700,
                            border: materialViewMode === "mindmap" ? "1px solid #18221f" : "1px solid #dce2da",
                            backgroundColor: materialViewMode === "mindmap" ? "#18221f" : "#ffffff",
                            color: materialViewMode === "mindmap" ? "#c8f064" : "#17201d",
                            cursor: "pointer",
                            transition: "0.15s ease"
                          }}
                        >
                          <Compass size={14} />
                          <span>Mind Map Interaktif</span>
                        </button>

                        <button
                          onClick={() => setMaterialViewMode("full")}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "7px 14px",
                            borderRadius: 8,
                            fontSize: 12.5,
                            fontWeight: 700,
                            border: materialViewMode === "full" ? "1px solid #18221f" : "1px solid #dce2da",
                            backgroundColor: materialViewMode === "full" ? "#18221f" : "#ffffff",
                            color: materialViewMode === "full" ? "#c8f064" : "#17201d",
                            cursor: "pointer",
                            transition: "0.15s ease"
                          }}
                        >
                          <FileText size={14} />
                          <span>Dokumen Lengkap</span>
                        </button>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <button
                          onClick={() => {
                            setActiveTab("flashcards");
                            if (flashcards.length === 0) handleGenerateFlashcards();
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                            padding: "6px 12px",
                            borderRadius: 7,
                            fontSize: 12,
                            fontWeight: 600,
                            border: "1px solid #dce2da",
                            backgroundColor: "#ffffff",
                            color: "#22370c",
                            cursor: "pointer"
                          }}
                        >
                          <Layers size={13} color="#4b6623" />
                          <span>Flashcards ({flashcards.length})</span>
                        </button>

                        <button
                          onClick={() => {
                            setActiveTab("quiz");
                            if (quizQuestions.length === 0) handleGenerateQuiz();
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                            padding: "6px 12px",
                            borderRadius: 7,
                            fontSize: 12,
                            fontWeight: 600,
                            border: "1px solid #dce2da",
                            backgroundColor: "#ffffff",
                            color: "#18221f",
                            cursor: "pointer"
                          }}
                        >
                          <Target size={13} color="#dc2626" />
                          <span>Kuis ({quizQuestions.length})</span>
                        </button>

                        <button
                          onClick={() => {
                            setActiveTab("feynman");
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                            padding: "6px 12px",
                            borderRadius: 7,
                            fontSize: 12,
                            fontWeight: 600,
                            border: "1px solid #dce2da",
                            backgroundColor: "#ffffff",
                            color: "#17201d",
                            cursor: "pointer"
                          }}
                        >
                          <Brain size={13} color="#4b6623" />
                          <span>Feynman</span>
                        </button>

                        <button
                          onClick={() => window.print()}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                            padding: "6px 10px",
                            borderRadius: 7,
                            fontSize: 12,
                            fontWeight: 600,
                            border: "1px solid #dce2da",
                            backgroundColor: "#ffffff",
                            color: "#45544e",
                            cursor: "pointer"
                          }}
                          title="Cetak atau Simpan sebagai PDF"
                        >
                          <span>PDF</span>
                        </button>
                      </div>
                    </div>

                    {/* View Mode 1: Mind Map Interaktif */}
                    {materialViewMode === "mindmap" && (
                      <div style={{ marginTop: 14 }}>
                        <InteractiveMindMap
                          markdown={formattedContent || activeDocContent}
                          title={activeDocTitle}
                          height="640px"
                        />
                      </div>
                    )}

                    {/* View Mode 2: Baca per Bab (Bite-sized Pelajarin.ai style) */}
                    {materialViewMode === "chapters" && (
                      <div style={{ marginTop: 14 }}>
                        {/* Chapter Navigation & Stepper Header */}
                        <div style={{ backgroundColor: "#ffffff", border: "1px solid #dde2d8", borderRadius: 12, padding: "14px 16px", marginBottom: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.02)" }}>
                          {/* Top Row: Stepper Indicator & Drawer Trigger */}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 10 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flex: 1 }}>
                              <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#4b6623", fontFamily: "'DM Mono', monospace", backgroundColor: "#eef8db", padding: "3px 8px", borderRadius: 4, flexShrink: 0 }}>
                                Bab {chapters[currentChapterIdx]?.id || 1} / {chapters.length}
                              </span>
                              <h3 style={{ fontSize: 14.5, fontWeight: 800, color: "#17201d", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {chapters[currentChapterIdx]?.title}
                              </h3>
                            </div>

                            <button
                              onClick={() => setIsChapterDrawerOpen(!isChapterDrawerOpen)}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                padding: "6px 12px",
                                borderRadius: 8,
                                fontSize: 12,
                                fontWeight: 700,
                                border: "1px solid #dce2da",
                                backgroundColor: isChapterDrawerOpen ? "#18221f" : "#ffffff",
                                color: isChapterDrawerOpen ? "#c8f064" : "#17201d",
                                cursor: "pointer",
                                transition: "all 0.15s ease",
                                flexShrink: 0
                              }}
                            >
                              <ListOrdered size={14} />
                              <span>Daftar Isi ({chapters.length} Bab)</span>
                              <ChevronDown size={13} style={{ transform: isChapterDrawerOpen ? "rotate(180deg)" : "none", transition: "0.2s" }} />
                            </button>
                          </div>

                          {/* Segmented Progress Bar */}
                          <div style={{ display: "flex", gap: 4, height: 4, borderRadius: 2, overflow: "hidden", backgroundColor: "#f0f3ed", marginBottom: 12 }}>
                            {chapters.map((ch, idx) => {
                              const isDone = !!completedChapters[ch.id];
                              const isCurrent = idx === currentChapterIdx;
                              return (
                                <div
                                  key={ch.id}
                                  style={{
                                    flex: 1,
                                    backgroundColor: isDone ? "#10b981" : isCurrent ? "#4b6623" : "#dce1da",
                                    transition: "0.2s ease"
                                  }}
                                />
                              );
                            })}
                          </div>

                          {/* Scrollable Chapter Stepper with Arrow Controls & Wheel Support */}
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <button
                              onClick={() => {
                                if (chapterStripRef.current) chapterStripRef.current.scrollBy({ left: -180, behavior: "smooth" });
                              }}
                              style={{
                                width: 30,
                                height: 34,
                                borderRadius: 6,
                                border: "1px solid #dde1da",
                                backgroundColor: "#fbfcf9",
                                color: "#56615d",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                flexShrink: 0
                              }}
                              title="Geser ke kiri"
                            >
                              ◀
                            </button>

                            <div
                              ref={chapterStripRef}
                              onWheel={(e) => {
                                if (e.deltaY) {
                                  e.currentTarget.scrollLeft += e.deltaY;
                                }
                              }}
                              style={{
                                display: "flex",
                                gap: 8,
                                overflowX: "auto",
                                scrollbarWidth: "none",
                                padding: "4px 2px",
                                flex: 1
                              }}
                            >
                              {chapters.map((ch, idx) => {
                                const isCurrent = idx === currentChapterIdx;
                                const isDone = !!completedChapters[ch.id];
                                return (
                                  <button
                                    key={ch.id}
                                    data-chapter-idx={idx}
                                    onClick={() => setCurrentChapterIdx(idx)}
                                    style={{
                                      flexShrink: 0,
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 8,
                                      padding: "7px 12px",
                                      borderRadius: 8,
                                      fontSize: 12,
                                      fontWeight: 700,
                                      border: isCurrent ? "1.5px solid #4b6623" : "1px solid #dde1da",
                                      backgroundColor: isCurrent ? "#eef8db" : isDone ? "#f0fdf4" : "#ffffff",
                                      color: isCurrent ? "#22370c" : isDone ? "#166534" : "#45544e",
                                      cursor: "pointer",
                                      transition: "0.15s ease",
                                      boxShadow: isCurrent ? "0 2px 6px rgba(75, 102, 35, 0.12)" : "none"
                                    }}
                                  >
                                    <span
                                      style={{
                                        width: 18,
                                        height: 18,
                                        borderRadius: 999,
                                        backgroundColor: isDone ? "#10b981" : isCurrent ? "#4b6623" : "#dce1da",
                                        color: "#ffffff",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: 10,
                                        fontWeight: 800
                                      }}
                                    >
                                      {isDone ? "✓" : ch.id}
                                    </span>
                                    <span style={{ maxWidth: 170, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                      {ch.shortTitle || ch.title}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>

                            <button
                              onClick={() => {
                                if (chapterStripRef.current) chapterStripRef.current.scrollBy({ left: 180, behavior: "smooth" });
                              }}
                              style={{
                                width: 30,
                                height: 34,
                                borderRadius: 6,
                                border: "1px solid #dde1da",
                                backgroundColor: "#fbfcf9",
                                color: "#56615d",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                flexShrink: 0
                              }}
                              title="Geser ke kanan"
                            >
                              ▶
                            </button>
                          </div>

                          {/* Collapsible Dropdown Drawer (Daftar Isi Penuh) */}
                          {isChapterDrawerOpen && (
                            <div
                              style={{
                                marginTop: 14,
                                paddingTop: 12,
                                borderTop: "1px solid #eef1eb",
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                                gap: 8
                              }}
                            >
                              {chapters.map((ch, idx) => {
                                const isCurrent = idx === currentChapterIdx;
                                const isDone = !!completedChapters[ch.id];
                                return (
                                  <div
                                    key={ch.id}
                                    onClick={() => {
                                      setCurrentChapterIdx(idx);
                                      setIsChapterDrawerOpen(false);
                                    }}
                                    style={{
                                      padding: "10px 14px",
                                      borderRadius: 8,
                                      border: isCurrent ? "1.5px solid #4b6623" : "1px solid #e2e8e0",
                                      backgroundColor: isCurrent ? "#eef8db" : isDone ? "#f0fdf4" : "#fbfcf9",
                                      cursor: "pointer",
                                      display: "flex",
                                      alignItems: "flex-start",
                                      gap: 10,
                                      transition: "0.15s ease"
                                    }}
                                  >
                                    <span
                                      style={{
                                        width: 22,
                                        height: 22,
                                        borderRadius: 999,
                                        backgroundColor: isDone ? "#10b981" : isCurrent ? "#4b6623" : "#dce1da",
                                        color: "#ffffff",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: 11,
                                        fontWeight: 800,
                                        flexShrink: 0,
                                        marginTop: 2
                                      }}
                                    >
                                      {isDone ? "✓" : ch.id}
                                    </span>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{ fontSize: 12.5, fontWeight: 700, color: isCurrent ? "#22370c" : "#1e293b", lineHeight: 1.35 }}>
                                        {ch.title}
                                      </div>
                                      <div style={{ fontSize: 11, color: isDone ? "#166534" : "#727d78", marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}>
                                        <span>{isDone ? "✓ Selesai dipelajari" : `Bab ${ch.id}`}</span>
                                        <span>•</span>
                                        <span>~{Math.max(1, Math.round(ch.content.split(/\s+/).length / 150))} mnt baca</span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Chapter Card Content */}
                        <div
                          style={{
                            padding: "22px 26px 30px",
                            backgroundColor: "#ffffff",
                            border: "1px solid #e2e8e0",
                            borderRadius: 12,
                            boxShadow: "0 4px 20px rgba(0,0,0,0.02)"
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid #eef1eb" }}>
                            <div>
                              <span style={{ fontSize: 10.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", color: "#4b6623", fontFamily: "'DM Mono', monospace" }}>
                                Bab {chapters[currentChapterIdx]?.id || 1} dari {chapters.length}
                              </span>
                              <h2 style={{ fontSize: 18, fontWeight: 800, color: "#17201d", margin: "4px 0 0" }}>
                                {chapters[currentChapterIdx]?.title}
                              </h2>
                            </div>
                            <button
                              onClick={() => {
                                const chId = chapters[currentChapterIdx]?.id;
                                if (chId) setCompletedChapters((prev) => ({ ...prev, [chId]: !prev[chId] }));
                              }}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                padding: "6px 12px",
                                borderRadius: 7,
                                fontSize: 11.5,
                                fontWeight: 700,
                                border: completedChapters[chapters[currentChapterIdx]?.id] ? "1px solid #a7f3d0" : "1px solid #dce1da",
                                backgroundColor: completedChapters[chapters[currentChapterIdx]?.id] ? "#ecfdf5" : "#ffffff",
                                color: completedChapters[chapters[currentChapterIdx]?.id] ? "#065f46" : "#56615d",
                                cursor: "pointer"
                              }}
                            >
                              <Check size={13} color={completedChapters[chapters[currentChapterIdx]?.id] ? "#10b981" : "#56615d"} />
                              <span>{completedChapters[chapters[currentChapterIdx]?.id] ? "Selesai Dipelajari" : "Tandai Selesai"}</span>
                            </button>
                          </div>

                          <div className="markdown-body" style={{ fontSize: 14.5, lineHeight: 1.7, color: "#1f2b26" }}>
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm, remarkMath]}
                              rehypePlugins={[rehypeKatex]}
                              components={markdownComponents}
                            >
                              {chapters[currentChapterIdx]?.content || ""}
                            </ReactMarkdown>
                          </div>

                          {/* Chapter Pagination Footer */}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 28, paddingTop: 16, borderTop: "1px solid #eef1eb" }}>
                            <button
                              disabled={currentChapterIdx === 0}
                              onClick={() => setCurrentChapterIdx((i) => Math.max(0, i - 1))}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                padding: "8px 16px",
                                borderRadius: 8,
                                fontSize: 12.5,
                                fontWeight: 700,
                                border: "1px solid #dce1da",
                                backgroundColor: currentChapterIdx === 0 ? "#f4f6f2" : "#ffffff",
                                color: currentChapterIdx === 0 ? "#a3ada8" : "#17201d",
                                cursor: currentChapterIdx === 0 ? "not-allowed" : "pointer"
                              }}
                            >
                              ← Bab Sebelumnya
                            </button>

                            {currentChapterIdx < chapters.length - 1 ? (
                              <button
                                onClick={() => {
                                  const chId = chapters[currentChapterIdx]?.id;
                                  if (chId) setCompletedChapters((prev) => ({ ...prev, [chId]: true }));
                                  setCurrentChapterIdx((i) => Math.min(chapters.length - 1, i + 1));
                                }}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 6,
                                  padding: "8px 18px",
                                  borderRadius: 8,
                                  fontSize: 12.5,
                                  fontWeight: 700,
                                  border: "none",
                                  backgroundColor: "#18221f",
                                  color: "#c8f064",
                                  cursor: "pointer"
                                }}
                              >
                                <span>Lanjut ke Bab {currentChapterIdx + 2}</span>
                                <ChevronRight size={14} />
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setActiveTab("quiz");
                                  if (quizQuestions.length === 0) handleGenerateQuiz();
                                }}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 6,
                                  padding: "8px 18px",
                                  borderRadius: 8,
                                  fontSize: 12.5,
                                  fontWeight: 700,
                                  border: "none",
                                  backgroundColor: "#10b981",
                                  color: "#ffffff",
                                  cursor: "pointer"
                                }}
                              >
                                <span>Semua Bab Selesai · Mulai Kuis</span>
                                <Target size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* View Mode 3: Dokumen Lengkap */}
                    {materialViewMode === "full" && (
                      <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid #dde1da" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                          <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", color: "#4b6623", fontFamily: "'DM Mono', monospace" }}>
                            📖 Bahan Bacaan Modul Baku
                          </span>
                        </div>

                        <div className="markdown-body" style={{ fontSize: 14.5, lineHeight: 1.7, color: "#1f2b26" }}>
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm, remarkMath]}
                            rehypePlugins={[rehypeKatex]}
                            components={markdownComponents}
                          >
                            {formattedContent}
                          </ReactMarkdown>
                        </div>
                      </div>
                    )}

                    {/* Collapsible Raw Text Editor */}
                    {showRawText && (
                      <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #dde1da" }}>
                        <div style={{ marginBottom: 12 }}>
                          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#45544e", marginBottom: 6 }}>
                            Ubah Judul Materi
                          </label>
                          <input
                            type="text"
                            value={activeDocTitle}
                            onChange={(e) => setActiveDocTitle(e.target.value)}
                            style={{
                              width: "100%",
                              backgroundColor: "#fafbf8",
                              border: "1px solid #dce1da",
                              borderRadius: 8,
                              padding: "10px 14px",
                              fontSize: 14,
                              color: "#17201d",
                              outline: "none"
                            }}
                          />
                        </div>

                        <div style={{ marginBottom: 14 }}>
                          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#45544e", marginBottom: 6 }}>
                            Teks Sumber Lengkap (Disimpan di latar belakang)
                          </label>
                          <textarea
                            rows={10}
                            value={activeDocContent}
                            onChange={(e) => setActiveDocContent(e.target.value)}
                            style={{
                              width: "100%",
                              backgroundColor: "#fafbf8",
                              border: "1px solid #dce1da",
                              borderRadius: 8,
                              padding: "12px",
                              fontSize: 13,
                              lineHeight: "1.6",
                              color: "#17201d",
                              fontFamily: "'DM Mono', monospace",
                              outline: "none",
                              resize: "vertical"
                            }}
                          />
                        </div>

                        <button
                          onClick={handleSaveDocument}
                          style={{
                            backgroundColor: "#18221f",
                            color: "#c8f064",
                            border: "none",
                            borderRadius: 8,
                            padding: "9px 18px",
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: "pointer"
                          }}
                        >
                          Simpan Perubahan Teks
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Single Unified Create / Ingest Hub */
                  <div
                    style={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #dde1da",
                      borderRadius: 12,
                      padding: "24px 28px",
                      boxShadow: "0 4px 20px rgba(27, 39, 35, 0.03)"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
                      <div>
                        <h2 style={{ fontSize: 18, fontWeight: 800, color: "#17201d", margin: 0 }}>
                          Mulai Modul Belajar Baru
                        </h2>
                        <p style={{ fontSize: 12.5, color: "#6f7975", margin: "4px 0 0" }}>
                          Pilih metode untuk memasukkan materi bahan ajar.
                        </p>
                      </div>

                      {/* Tab Selection Chips */}
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {[
                          { id: "upload", label: "Unggah Berkas", icon: Upload },
                          { id: "topic", label: "Buat Topik AI", icon: Compass },
                          { id: "manual", label: "Tulis Catatan", icon: FileText }
                        ].map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setMaterialCreationTab(t.id as any)}
                            style={{
                              backgroundColor: materialCreationTab === t.id ? "#18221f" : "#fafbf8",
                              color: materialCreationTab === t.id ? "#c8f064" : "#56615d",
                              border: `1px solid ${materialCreationTab === t.id ? "#18221f" : "#dce1da"}`,
                              borderRadius: 7,
                              padding: "6px 12px",
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: 5
                            }}
                          >
                            <t.icon size={12} />
                            <span>{t.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {materialCreationTab === "upload" && (
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDragging(true);
                        }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                          border: isDragging ? "2px dashed #72a728" : "1px dashed #dce1da",
                          backgroundColor: isDragging ? "#eef8db" : "#fbfcf9",
                          borderRadius: 10,
                          padding: "36px 20px",
                          textAlign: "center",
                          cursor: "pointer",
                          transition: "border 0.2s ease, background 0.2s ease"
                        }}
                      >
                        <FileUp size={28} color="#72a728" style={{ margin: "0 auto 10px" }} />
                        <div style={{ fontSize: 15, fontWeight: 700, color: "#17201d" }}>
                          Tarik & lepas berkas ke sini, atau klik untuk memilih
                        </div>
                        <div style={{ fontSize: 12, color: "#6f7975", marginTop: 4 }}>
                          Mendukung PDF, Word (.docx), PPTX, Foto catatan (OCR), dan Teks (.txt, .md).
                        </div>
                        <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 16 }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              fileInputRef.current?.click();
                            }}
                            style={{
                              backgroundColor: "#18221f",
                              color: "#c8f064",
                              border: "none",
                              borderRadius: 7,
                              padding: "8px 16px",
                              fontSize: 12.5,
                              fontWeight: 700,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: 5
                            }}
                          >
                            <Upload size={13} />
                            <span>Pilih Berkas</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              cameraInputRef.current?.click();
                            }}
                            style={{
                              backgroundColor: "#ffffff",
                              border: "1px solid #dce1da",
                              color: "#17201d",
                              borderRadius: 7,
                              padding: "8px 16px",
                              fontSize: 12.5,
                              fontWeight: 600,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: 5
                            }}
                          >
                            <Camera size={13} color="#4b6623" />
                            <span>Kamera HP</span>
                          </button>
                        </div>
                        {isUploading && (
                          <div style={{ marginTop: 14, fontSize: 12, color: "#4b6623", fontWeight: 600 }}>
                            Mengekstrak teks dokumen ke memori...
                          </div>
                        )}
                        {uploadError && (
                          <div style={{ marginTop: 10, fontSize: 12, color: "#ef4444" }}>
                            Gagal mengunggah: {uploadError}
                          </div>
                        )}
                      </div>
                    )}

                    {materialCreationTab === "topic" && (
                      <div style={{ padding: "16px 0" }}>
                        <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#17201d", marginBottom: 8 }}>
                          Topik atau Bab Pembelajaran
                        </label>
                        <div style={{ display: "flex", gap: 8 }}>
                          <input
                            type="text"
                            value={topicInput}
                            onChange={(e) => setTopicInput(e.target.value)}
                            placeholder="Misal: Teori Konflik Sosiologi, Elastisitas Permintaan, Fungsi Invers..."
                            style={{
                              flex: 1,
                              backgroundColor: "#fafbf8",
                              border: "1px solid #dce1da",
                              borderRadius: 8,
                              padding: "10px 14px",
                              fontSize: 14,
                              color: "#17201d",
                              outline: "none"
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (topicInput.trim()) {
                                setIsTopicModalOpen(true);
                                handleStartTopicClarify(topicInput.trim());
                              }
                            }}
                            style={{
                              backgroundColor: "#18221f",
                              color: "#c8f064",
                              border: "none",
                              borderRadius: 8,
                              padding: "10px 18px",
                              fontSize: 13,
                              fontWeight: 700,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: 6
                            }}
                          >
                            <Sparkles size={13} />
                            <span>Susun Materi (AI)</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {materialCreationTab === "manual" && (
                      <div>
                        <div style={{ marginBottom: 12 }}>
                          <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "#45544e", marginBottom: 6 }}>
                            Judul Materi
                          </label>
                          <input
                            type="text"
                            value={activeDocTitle}
                            onChange={(e) => setActiveDocTitle(e.target.value)}
                            placeholder="Contoh: Sosiologi Konflik dan Resolusi..."
                            style={{
                              width: "100%",
                              backgroundColor: "#fafbf8",
                              border: "1px solid #dce1da",
                              borderRadius: 8,
                              padding: "10px 14px",
                              fontSize: 14,
                              color: "#17201d",
                              outline: "none"
                            }}
                          />
                        </div>

                        <div style={{ marginBottom: 14 }}>
                          <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "#45544e", marginBottom: 6 }}>
                            Isi Catatan / Materi Teks
                          </label>
                          <textarea
                            rows={8}
                            value={activeDocContent}
                            onChange={(e) => setActiveDocContent(e.target.value)}
                            placeholder="Tempel catatan atau teks di sini..."
                            style={{
                              width: "100%",
                              backgroundColor: "#fafbf8",
                              border: "1px solid #dce1da",
                              borderRadius: 8,
                              padding: "12px",
                              fontSize: 14,
                              lineHeight: "1.6",
                              color: "#17201d",
                              outline: "none",
                              resize: "vertical"
                            }}
                          />
                        </div>

                        <button
                          onClick={handleSaveDocument}
                          style={{
                            backgroundColor: "#18221f",
                            color: "#c8f064",
                            border: "none",
                            borderRadius: 8,
                            padding: "10px 20px",
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: "pointer"
                          }}
                        >
                          Simpan Modul
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
  );
}
