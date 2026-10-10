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
  ListOrdered,
  Video
} from "lucide-react";
import { YouTubeIcon } from "../common/YouTubeIcon";
import { ActiveTab, Flashcard, QuizQuestion, DocumentItem } from "../../types";
import { MathView } from "../common/MathView";
import { renderVisualDiagramOrPre, extractTextFromNode, isAsciiDiagramText, sanitizeMathMarkdown } from "../common/DiagramRenderer";
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
  setIsYouTubeModalOpen?: (val: boolean) => void;
  handleStartTopicClarify: (topic?: string) => void;
  isEnriching: boolean;
  showRawText: boolean;
  setShowRawText: React.Dispatch<React.SetStateAction<boolean>>;
  isDragging: boolean;
  setIsDragging: (val: boolean) => void;
  handleDrop: (e: React.DragEvent) => void;
  handleGenerateQuiz: (params?: any) => void;
  handleGenerateFlashcards: () => void;
  documents?: DocumentItem[];
  loadDocument?: (id: string) => void;
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
  setIsYouTubeModalOpen,
  handleStartTopicClarify,
  isEnriching,
  showRawText,
  setShowRawText,
  isDragging,
  setIsDragging,
  handleDrop,
  handleGenerateQuiz,
  handleGenerateFlashcards,
  documents = [],
  loadDocument = () => {}
}: MaterialTabProps) {
  const [materialViewMode, setMaterialViewMode] = React.useState<"chapters" | "mindmap" | "full">("chapters");
  const [currentChapterIdx, setCurrentChapterIdx] = React.useState(0);
  const [completedChapters, setCompletedChapters] = React.useState<Record<number, boolean>>({});
  const [isRestructuring, setIsRestructuring] = React.useState(false);
  const [restructureNotice, setRestructureNotice] = React.useState<string | null>(null);
  const [isTailorOpen, setIsTailorOpen] = React.useState(false);
  const [tailorInput, setTailorInput] = React.useState("");

  const handleRestructureCurriculum = async (instruction?: string) => {
    if (!activeDocId) return;
    setIsRestructuring(true);
    setRestructureNotice("AI sedang merevisi dan menyusun ulang materi bab...");
    try {
      const res = await fetch(`/api/documents/${activeDocId}/restructure`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instruction: instruction || tailorInput || ""
        })
      });
      const data = await res.json();
      if (data.success && data.content) {
        setActiveDocContent(data.content);
        setTailorInput("");
        setIsTailorOpen(false);
        setRestructureNotice("Modul materi berhasil disesuaikan!");
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
      const cleanIntro = intro.content.replace(/\n*---\s*$/, "").trim();
      list[0].content = cleanIntro ? cleanIntro + "\n\n---\n\n" + list[0].content : list[0].content;
      list.forEach((c, idx) => { c.id = idx + 1; });
    }

    // Bersihkan header judul dokumen "# Judul" dan ringkasan pengantar yang bocor ke dalam badan Bab 1
    if (list.length > 0 && list[0].content) {
      list[0].content = list[0].content
        .replace(/^#\s+[^\n]+\n+/, "")
        .replace(/^>\s+[^\n]+(?:\n>[^\n]+)*\n+(?:---\s*\n+)?/, "")
        .trim();
    }

    return list.length > 0 ? list : [{ id: 1, title: activeDocTitle || "Modul Utama", shortTitle: "Materi Utama", content: text }];
  }, [formattedContent, activeDocContent, activeDocTitle]);

  const markdownComponents = React.useMemo(() => ({
    h1: ({ children }: any) => (
      <h1 style={{ fontSize: 26, fontWeight: 800, color: "#111a17", letterSpacing: "-0.025em", marginTop: 32, marginBottom: 14, borderBottom: "1px solid #eef1eb", paddingBottom: 8 }}>
        {children}
      </h1>
    ),
    h2: ({ children }: any) => (
      <h2 style={{ fontSize: 20, fontWeight: 750, color: "#162420", letterSpacing: "-0.02em", marginTop: 28, marginBottom: 12 }}>
        {children}
      </h2>
    ),
    h3: ({ children }: any) => (
      <h3 style={{ fontSize: 16.5, fontWeight: 700, color: "#25371a", letterSpacing: "-0.01em", marginTop: 24, marginBottom: 10 }}>
        {children}
      </h3>
    ),
    p: ({ children }: any) => {
      const pText = extractTextFromNode(children);
      if (isAsciiDiagramText(pText)) {
        return renderVisualDiagramOrPre(children);
      }
      if (/⚠️|peringatan salah kaprah|pitfall/i.test(pText)) {
        return (
          <div
            style={{
              backgroundColor: "#fffbeb",
              border: "1px solid #fde68a",
              borderLeft: "4px solid #f59e0b",
              borderRadius: "0 10px 10px 0",
              padding: "14px 18px",
              margin: "18px 0",
              color: "#92400e",
              lineHeight: 1.75
            }}
          >
            {children}
          </div>
        );
      }
      return <p style={{ marginBottom: 18, color: "#1d2b26", lineHeight: 1.9, fontSize: 16.5 }}>{children}</p>;
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
    blockquote: ({ children }: any) => {
      const text = extractTextFromNode(children);
      const isPitfall = /⚠️|salah kaprah|pitfall/i.test(text);
      const isDefinisi = /📖|definisi baku|definisi/i.test(text);
      const isInsight = /💡|insight|analogi/i.test(text);

      if (isPitfall) {
        return (
          <blockquote style={{ borderLeft: "4px solid #f59e0b", backgroundColor: "#fffbeb", padding: "14px 18px", borderRadius: "0 10px 10px 0", margin: "18px 0", color: "#92400e", lineHeight: 1.75 }}>
            {children}
          </blockquote>
        );
      }
      if (isDefinisi) {
        return (
          <blockquote style={{ borderLeft: "4px solid #10b981", backgroundColor: "#ecfdf5", padding: "14px 18px", borderRadius: "0 10px 10px 0", margin: "18px 0", color: "#065f46", lineHeight: 1.75 }}>
            {children}
          </blockquote>
        );
      }
      if (isInsight) {
        return (
          <blockquote style={{ borderLeft: "4px solid #3b82f6", backgroundColor: "#eff6ff", padding: "14px 18px", borderRadius: "0 10px 10px 0", margin: "18px 0", color: "#1e40af", lineHeight: 1.75 }}>
            {children}
          </blockquote>
        );
      }
      return (
        <blockquote style={{ borderLeft: "3.5px solid #4b6623", backgroundColor: "#f7f9f4", padding: "14px 18px", borderRadius: "0 10px 10px 0", margin: "18px 0", color: "#21322a", lineHeight: 1.75 }}>
          {children}
        </blockquote>
      );
    },
    hr: () => (
      <hr style={{ border: "none", borderTop: "1px solid #e5ebe2", margin: "24px 0" }} />
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
              <div className="tab-pane-animate material-book-layout">
                {activeDocId ? (
                  <div className="material-outer-box">
                    <div className="material-header-panel material-header-panel-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
                      <div style={{ flex: 1, minWidth: 260 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span
                            style={{
                              fontSize: 10.5,
                              fontWeight: 800,
                              textTransform: "uppercase",
                              letterSpacing: "0.08em",
                              color: "#273f15",
                              backgroundColor: "#eef8db",
                              border: "1px solid #c2e28f",
                              padding: "3px 12px",
                              borderRadius: 9999,
                              fontFamily: "'DM Mono', monospace",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              boxShadow: "0 1px 3px rgba(39, 63, 21, 0.08)"
                            }}
                          >
                            <span style={{ width: 6, height: 6, borderRadius: 9999, backgroundColor: "#55831b" }} />
                            Catatan Belajar
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginTop: 8 }}>
                          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#17201d", letterSpacing: "-0.025em", margin: 0, lineHeight: 1.25 }}>
                            {activeDocTitle}
                          </h1>
                          <button
                            onClick={handleAutoDetectTitle}
                            disabled={isDetectingTitle}
                            style={{
                              backgroundColor: "#f4f6f2",
                              border: "1px solid #dce1da",
                              color: "#45544e",
                              borderRadius: 9999,
                              padding: "4px 10px",
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: isDetectingTitle ? "not-allowed" : "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                              transition: "all 0.15s ease"
                            }}
                            title="Deteksi topik pembelajaran secara otomatis berdasarkan isi materi"
                          >
                            <Sparkles size={11} />
                            {isDetectingTitle ? "Mendeteksi..." : "Deteksi Judul"}
                          </button>
                        </div>
                        {/* Compact Metadata line */}
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: "#47554e", backgroundColor: "#f6f8f4", border: "1px solid #dde2d8", padding: "2px 10px", borderRadius: 9999, display: "inline-flex", alignItems: "center", gap: 4 }}>
                            📚 {chapters.length} Bab
                          </span>
                          <span style={{ fontSize: 11, fontWeight: 600, color: "#47554e", backgroundColor: "#f6f8f4", border: "1px solid #dde2d8", padding: "2px 10px", borderRadius: 9999, display: "inline-flex", alignItems: "center", gap: 4 }}>
                            🗂️ {flashcards.length} Flashcard
                          </span>
                          <span style={{ fontSize: 11, fontWeight: 600, color: "#47554e", backgroundColor: "#f6f8f4", border: "1px solid #dde2d8", padding: "2px 10px", borderRadius: 9999, display: "inline-flex", alignItems: "center", gap: 4 }}>
                            🎯 {quizQuestions.length} Soal
                          </span>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          style={{
                            backgroundColor: "#f8f9f5",
                            border: "1px solid #dce1da",
                            color: "#17201d",
                            borderRadius: 9999,
                            padding: "6px 14px",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                            transition: "all 0.15s ease"
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
                            borderRadius: 9999,
                            padding: "6px 14px",
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: isEnriching ? "not-allowed" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            transition: "all 0.15s ease"
                          }}
                          title="Cari referensi internet atau perluas materi dengan riset AI"
                        >
                          <Globe size={14} color="#4b6623" />
                          <span>{isEnriching ? "Meneliti..." : "Perkaya Materi (Web Search)"}</span>
                        </button>

                        <button
                          onClick={() => setIsTailorOpen(!isTailorOpen)}
                          disabled={isRestructuring}
                          style={{
                            backgroundColor: isTailorOpen ? "#22370c" : "#f4fbeb",
                            border: "1px solid #c2e28f",
                            color: isTailorOpen ? "#c8f064" : "#273f15",
                            borderRadius: 9999,
                            padding: "6px 14px",
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: isRestructuring ? "wait" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            transition: "all 0.15s ease"
                          }}
                          title="Sesuaikan, tambah materi yang kurang, atau susun ulang bab dengan instruksi khusus"
                        >
                          <Sparkles size={14} color={isTailorOpen ? "#c8f064" : "#4b6623"} />
                          <span>{isRestructuring ? "Memproses..." : "Sesuaikan Bab / Revisi (AI)"}</span>
                        </button>

                        <button
                          onClick={() => copyToClipboard(activeDocContent, "Isi Modul", "docContent")}
                          style={{
                            backgroundColor: copiedId === "docContent" ? "#ecfdf5" : "#ffffff",
                            border: `1px solid ${copiedId === "docContent" ? "#10b981" : "#dce1da"}`,
                            color: copiedId === "docContent" ? "#065f46" : "#56615d",
                            borderRadius: 9999,
                            padding: "6px 14px",
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
                            borderRadius: 9999,
                            padding: "6px 14px",
                            fontSize: 12,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            transition: "all 0.15s ease"
                          }}
                        >
                          {showRawText ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          {showRawText ? "Sembunyikan Teks Mentah" : "Lihat / Edit Teks Mentah"}
                        </button>
                      </div>
                    </div>

                    {/* Panel Interaktif: Sesuaikan / Tambah Materi Bab dengan AI */}
                    {isTailorOpen && (
                      <div
                        style={{
                          padding: "16px 20px",
                          backgroundColor: "#f4fbeb",
                          border: "1px solid #c2e28f",
                          borderRadius: 20,
                          marginBottom: 16
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#22370c", display: "flex", alignItems: "center", gap: 6 }}>
                            <Sparkles size={15} color="#4b6623" />
                            Instruksi Revisi & Penyesuaian Bab Materi
                          </span>
                          <button
                            onClick={() => setIsTailorOpen(false)}
                            style={{ background: "none", border: "none", fontSize: 11, color: "#56615d", cursor: "pointer", padding: "2px 8px", borderRadius: 9999 }}
                          >
                            Tutup
                          </button>
                        </div>
                        <div style={{ fontSize: 11.5, color: "#56615d", marginBottom: 10 }}>
                          Kamu bisa menyuruh AI menambahkan materi yang kurang, memecah bab, atau memperdalam konsep tertentu (misal: "tambahkan sub-bab kesenjangan budaya / Cultural Lag", atau "buat penjelasan rumus lebih ramah pemula").
                        </div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <input
                            type="text"
                            value={tailorInput}
                            onChange={(e) => setTailorInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleRestructureCurriculum()}
                            placeholder="Ketik instruksi revisi materi di sini..."
                            disabled={isRestructuring}
                            style={{
                              flex: "1 1 240px",
                              padding: "9px 16px",
                              borderRadius: 9999,
                              border: "1px solid #b7dc7f",
                              fontSize: 13,
                              outline: "none",
                              backgroundColor: "#ffffff",
                              color: "#18221f"
                            }}
                          />
                          <button
                            onClick={() => handleRestructureCurriculum()}
                            disabled={isRestructuring}
                            style={{
                              backgroundColor: "#18221f",
                              color: "#c8f064",
                              border: "none",
                              borderRadius: 9999,
                              padding: "9px 18px",
                              fontSize: 12.5,
                              fontWeight: 700,
                              cursor: isRestructuring ? "wait" : "pointer"
                            }}
                          >
                            {isRestructuring ? "Memproses..." : "Terapkan Revisi"}
                          </button>
                        </div>
                      </div>
                    )}

                    {restructureNotice && (
                      <div style={{ padding: "10px 18px", backgroundColor: "#eef8db", border: "1px solid #c2e28f", borderRadius: 9999, fontSize: 12.5, color: "#22370c", fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                        <Sparkles size={16} color="#4b6623" />
                        <span>{restructureNotice}</span>
                      </div>
                    )}

                    {/* Stats Metrics Bento Grid (Shown only in Full Document Mode to avoid crowding Chapter Reader and Mind Map) */}
                    {materialViewMode === "full" && (
                      <div className="metrics-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 16 }}>
                        <div style={{ padding: "14px 18px", backgroundColor: "#fdfdfb", borderRadius: 18, border: "1px solid #dce2da" }}>
                          <div style={{ fontSize: 10, color: "#727d78", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.08em", fontFamily: "'DM Mono', monospace" }}>Estimasi Baca</div>
                          <div style={{ fontSize: 20, fontWeight: 800, color: "#17201d", marginTop: 4, letterSpacing: "-0.02em" }}>
                            ~{Math.max(1, Math.round(wordCount / 160))} <span style={{ fontSize: 12, fontWeight: 500, color: "#727d78" }}>menit</span>
                          </div>
                          <div style={{ fontSize: 11, color: "#8a9691", marginTop: 3 }}>Kecepatan normal membaca</div>
                        </div>

                        <div style={{ padding: "14px 18px", backgroundColor: "#fdfdfb", borderRadius: 18, border: "1px solid #dce2da" }}>
                          <div style={{ fontSize: 10, color: "#727d78", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.08em", fontFamily: "'DM Mono', monospace" }}>Kartu Flashcard</div>
                          <div style={{ fontSize: 20, fontWeight: 800, color: "#22370c", marginTop: 4, letterSpacing: "-0.02em" }}>
                            {flashcards.length} <span style={{ fontSize: 12, fontWeight: 500, color: "#4b6623" }}>kartu</span>
                          </div>
                          <div style={{ fontSize: 11, color: "#8a9691", marginTop: 3 }}>Review Spaced Repetition</div>
                        </div>

                        <div style={{ padding: "14px 18px", backgroundColor: "#fdfdfb", borderRadius: 18, border: "1px solid #dce2da" }}>
                          <div style={{ fontSize: 10, color: "#727d78", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.08em", fontFamily: "'DM Mono', monospace" }}>Paket Latihan Soal</div>
                          <div style={{ fontSize: 20, fontWeight: 800, color: "#17201d", marginTop: 4, letterSpacing: "-0.02em" }}>
                            {quizQuestions.length} <span style={{ fontSize: 12, fontWeight: 500, color: "#4b6623" }}>butir</span>
                          </div>
                          <div style={{ fontSize: 11, color: "#8a9691", marginTop: 3 }}>Penalaran bertingkat HOTS</div>
                        </div>
                      </div>
                    )}

                    {/* Pelajarin.ai Mode Switcher & Utility Actions Bar */}
                    <div className="material-mode-switcher" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, padding: "6px 10px", backgroundColor: "#f8faf5", border: "1px solid #dde2d8", borderRadius: 9999, margin: "10px 0 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
                        <button
                          onClick={() => setMaterialViewMode("chapters")}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                            padding: "6px 14px",
                            borderRadius: 9999,
                            fontSize: 12,
                            fontWeight: 700,
                            border: materialViewMode === "chapters" ? "1px solid #18221f" : "1px solid transparent",
                            backgroundColor: materialViewMode === "chapters" ? "#18221f" : "transparent",
                            color: materialViewMode === "chapters" ? "#c8f064" : "#45544e",
                            cursor: "pointer",
                            transition: "0.15s ease"
                          }}
                        >
                          <BookOpen size={13} />
                          <span>Baca per Bab ({chapters.length})</span>
                        </button>

                        <button
                          onClick={() => setMaterialViewMode("mindmap")}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                            padding: "6px 14px",
                            borderRadius: 9999,
                            fontSize: 12,
                            fontWeight: 700,
                            border: materialViewMode === "mindmap" ? "1px solid #18221f" : "1px solid transparent",
                            backgroundColor: materialViewMode === "mindmap" ? "#18221f" : "transparent",
                            color: materialViewMode === "mindmap" ? "#c8f064" : "#45544e",
                            cursor: "pointer",
                            transition: "0.15s ease"
                          }}
                        >
                          <Compass size={13} />
                          <span>Mind Map</span>
                        </button>

                        <button
                          onClick={() => setMaterialViewMode("full")}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                            padding: "6px 14px",
                            borderRadius: 9999,
                            fontSize: 12,
                            fontWeight: 700,
                            border: materialViewMode === "full" ? "1px solid #18221f" : "1px solid transparent",
                            backgroundColor: materialViewMode === "full" ? "#18221f" : "transparent",
                            color: materialViewMode === "full" ? "#c8f064" : "#45544e",
                            cursor: "pointer",
                            transition: "0.15s ease"
                          }}
                        >
                          <FileText size={13} />
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
                            padding: "6px 14px",
                            borderRadius: 9999,
                            fontSize: 12,
                            fontWeight: 600,
                            border: "1px solid #dce2da",
                            backgroundColor: "#ffffff",
                            color: "#22370c",
                            cursor: "pointer",
                            transition: "all 0.15s ease"
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
                            padding: "6px 14px",
                            borderRadius: 9999,
                            fontSize: 12,
                            fontWeight: 600,
                            border: "1px solid #dce2da",
                            backgroundColor: "#ffffff",
                            color: "#18221f",
                            cursor: "pointer",
                            transition: "all 0.15s ease"
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
                            padding: "6px 14px",
                            borderRadius: 9999,
                            fontSize: 12,
                            fontWeight: 600,
                            border: "1px solid #dce2da",
                            backgroundColor: "#ffffff",
                            color: "#17201d",
                            cursor: "pointer",
                            transition: "all 0.15s ease"
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
                            padding: "6px 12px",
                            borderRadius: 9999,
                            fontSize: 12,
                            fontWeight: 600,
                            border: "1px solid #dce2da",
                            backgroundColor: "#ffffff",
                            color: "#45544e",
                            cursor: "pointer",
                            transition: "all 0.15s ease"
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

                    {/* View Mode 2: Baca per Bab (Immersive Novel / Literary Book Reader) */}
                    {materialViewMode === "chapters" && (
                      <div style={{ marginTop: 10 }}>
                        {/* Sticky Reader Toolbar */}
                        <div
                          className="sticky-reader-toolbar"
                          style={{
                            position: "sticky",
                            top: 0,
                            zIndex: 15,
                            backgroundColor: "rgba(253, 253, 251, 0.95)",
                            backdropFilter: "blur(12px)",
                            border: "1px solid #dce2da",
                            padding: "8px 14px",
                            borderRadius: 8,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 8,
                            marginBottom: 14,
                            boxShadow: "0 4px 18px rgba(27, 39, 35, 0.03)"
                          }}
                        >
                          <button
                            onClick={() => setIsChapterDrawerOpen(!isChapterDrawerOpen)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              background: "#f4f7f2",
                              border: "1px solid #dce2d8",
                              borderRadius: 6,
                              padding: "6px 14px",
                              fontSize: 12,
                              fontWeight: 700,
                              color: "#18221f",
                              cursor: "pointer",
                              flex: 1,
                              minWidth: 0,
                              maxWidth: "75%",
                              overflow: "hidden"
                            }}
                            title="Klik untuk membuka daftar bab"
                          >
                            <BookOpen size={13} color="#4b6623" style={{ flexShrink: 0 }} />
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              Bab {currentChapterIdx + 1} / {chapters.length}: {chapters[currentChapterIdx]?.shortTitle || chapters[currentChapterIdx]?.title}
                            </span>
                            <ChevronDown size={13} style={{ transform: isChapterDrawerOpen ? "rotate(180deg)" : "none", transition: "0.2s", flexShrink: 0 }} />
                          </button>

                          <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
                            <button
                              disabled={currentChapterIdx === 0}
                              onClick={() => setCurrentChapterIdx((i) => Math.max(0, i - 1))}
                              style={{
                                width: 30,
                                height: 30,
                                borderRadius: 9999,
                                border: "1px solid #dde1da",
                                backgroundColor: currentChapterIdx === 0 ? "#f4f6f1" : "#ffffff",
                                color: currentChapterIdx === 0 ? "#a8b3af" : "#17201d",
                                cursor: currentChapterIdx === 0 ? "not-allowed" : "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 11
                              }}
                              title="Bab Sebelumnya"
                            >
                              ◀
                            </button>
                            <span style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: "#60706a", padding: "0 4px" }}>
                              {currentChapterIdx + 1}/{chapters.length}
                            </span>
                            <button
                              disabled={currentChapterIdx >= chapters.length - 1}
                              onClick={() => setCurrentChapterIdx((i) => Math.min(chapters.length - 1, i + 1))}
                              style={{
                                width: 30,
                                height: 30,
                                borderRadius: 9999,
                                border: "1px solid #dde1da",
                                backgroundColor: currentChapterIdx >= chapters.length - 1 ? "#f4f6f1" : "#ffffff",
                                color: currentChapterIdx >= chapters.length - 1 ? "#a8b3af" : "#17201d",
                                cursor: currentChapterIdx >= chapters.length - 1 ? "not-allowed" : "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 11
                              }}
                              title="Bab Berikutnya"
                            >
                              ▶
                            </button>
                          </div>
                        </div>

                        {/* Thin Segmented Progress Bar */}
                        <div style={{ display: "flex", gap: 3, height: 4, borderRadius: 9999, overflow: "hidden", backgroundColor: "#eef2ea", marginBottom: 14 }}>
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

                        {/* Collapsible Dropdown Drawer (Daftar Isi Penuh) */}
                        {isChapterDrawerOpen && (
                          <div
                            style={{
                              backgroundColor: "#fdfdfb",
                              border: "1px solid #dce2da",
                              borderRadius: 22,
                              padding: "16px",
                              marginBottom: 16,
                              boxShadow: "0 6px 24px rgba(27, 39, 35, 0.05)",
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
                                    padding: "9px 12px",
                                    borderRadius: 12,
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
                                      width: 20,
                                      height: 20,
                                      borderRadius: 9999,
                                      backgroundColor: isDone ? "#10b981" : isCurrent ? "#4b6623" : "#dce1da",
                                      color: "#ffffff",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      fontSize: 10,
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
                                    <div style={{ fontSize: 11, color: isDone ? "#166534" : "#727d78", marginTop: 3, display: "flex", alignItems: "center", gap: 6 }}>
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

                        {/* Chapter Reader Canvas (Full Edge-to-Edge on Mobile, Elegant Book on Desktop) */}
                        <div className="reader-chapter-card">
                          {/* Chapter Heading Banner */}
                          <div style={{ maxWidth: 820, margin: "0 auto 28px auto", paddingBottom: 20, borderBottom: "1px solid #edf1eb" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                                <span style={{ fontSize: 11.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", color: "#3d541b", fontFamily: "'DM Mono', monospace", backgroundColor: "#f0f6ea", border: "1px solid #cce2a3", padding: "3px 12px", borderRadius: 9999 }}>
                                  Bab {chapters[currentChapterIdx]?.id || 1} dari {chapters.length}
                                </span>
                                <span style={{ fontSize: 11, fontWeight: 600, color: "#617169", backgroundColor: "#f4f6f1", border: "1px solid #dde3d9", padding: "3px 10px", borderRadius: 9999, display: "inline-flex", alignItems: "center", gap: 4 }}>
                                  ⏱️ ~{Math.max(1, Math.round((chapters[currentChapterIdx]?.content || "").split(/\s+/).length / 160))} mnt baca
                                </span>
                              </div>
                              {completedChapters[chapters[currentChapterIdx]?.id] && (
                                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 700, color: "#065f46", backgroundColor: "#ecfdf5", border: "1px solid #a7f3d0", padding: "3px 12px", borderRadius: 9999 }}>
                                  <Check size={13} /> Selesai Dipelajari
                                </span>
                              )}
                            </div>
                            <h1 style={{ fontSize: 30, fontWeight: 800, color: "#111a17", margin: 0, lineHeight: 1.3, letterSpacing: "-0.03em" }}>
                              {chapters[currentChapterIdx]?.title}
                            </h1>
                          </div>

                          {/* Literary Reader Markdown Body */}
                          <div className="markdown-body book-reader">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm, remarkMath]}
                              rehypePlugins={[rehypeKatex]}
                              components={markdownComponents}
                            >
                              {sanitizeMathMarkdown(chapters[currentChapterIdx]?.content || "")}
                            </ReactMarkdown>
                          </div>

                          {/* Chapter Pagination & Completion Footer */}
                          <div style={{ maxWidth: 820, margin: "36px auto 0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 20, borderTop: "1px solid #edf1eb", flexWrap: "wrap", gap: 10 }}>
                            <button
                              disabled={currentChapterIdx === 0}
                              onClick={() => setCurrentChapterIdx((i) => Math.max(0, i - 1))}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                padding: "8px 16px",
                                borderRadius: 9999,
                                fontSize: 12,
                                fontWeight: 700,
                                border: "1px solid #dce1da",
                                backgroundColor: currentChapterIdx === 0 ? "#f4f6f2" : "#ffffff",
                                color: currentChapterIdx === 0 ? "#a3ada8" : "#17201d",
                                cursor: currentChapterIdx === 0 ? "not-allowed" : "pointer",
                                transition: "all 0.15s ease"
                              }}
                            >
                              ← Bab Sebelumnya
                            </button>

                            <button
                              onClick={() => {
                                const chId = chapters[currentChapterIdx]?.id;
                                if (chId) setCompletedChapters((prev) => ({ ...prev, [chId]: !prev[chId] }));
                              }}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                padding: "8px 16px",
                                borderRadius: 9999,
                                fontSize: 12,
                                fontWeight: 700,
                                border: completedChapters[chapters[currentChapterIdx]?.id] ? "1px solid #a7f3d0" : "1px solid #dce1da",
                                backgroundColor: completedChapters[chapters[currentChapterIdx]?.id] ? "#ecfdf5" : "#ffffff",
                                color: completedChapters[chapters[currentChapterIdx]?.id] ? "#065f46" : "#45544e",
                                cursor: "pointer",
                                transition: "all 0.15s ease"
                              }}
                            >
                              <Check size={13} color={completedChapters[chapters[currentChapterIdx]?.id] ? "#10b981" : "#56615d"} />
                              <span>{completedChapters[chapters[currentChapterIdx]?.id] ? "Selesai Dipelajari" : "Tandai Selesai"}</span>
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
                                  padding: "8px 20px",
                                  borderRadius: 9999,
                                  fontSize: 12.5,
                                  fontWeight: 700,
                                  border: "none",
                                  backgroundColor: "#18221f",
                                  color: "#c8f064",
                                  cursor: "pointer",
                                  transition: "all 0.15s ease"
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
                                  padding: "8px 20px",
                                  borderRadius: 9999,
                                  fontSize: 12.5,
                                  fontWeight: 700,
                                  border: "none",
                                  backgroundColor: "#10b981",
                                  color: "#ffffff",
                                  cursor: "pointer",
                                  transition: "all 0.15s ease"
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

                    {/* View Mode 3: Dokumen Lengkap (Selalu dicetak utuh saat mode Print/PDF) */}
                    <div 
                      className={`print-full-document ${materialViewMode !== "full" ? "print-only" : ""}`}
                      style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid #dde1da" }}
                    >
                      <div className="print-hidden" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                        <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", color: "#4b6623", fontFamily: "'DM Mono', monospace" }}>
                          📖 Bahan Bacaan Modul Baku
                        </span>
                      </div>

                      {/* Header Resmi khusus cetak PDF */}
                      <div className="print-only" style={{ borderBottom: "2px solid #18221f", paddingBottom: 14, marginBottom: 20 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                          <span style={{ fontSize: "16pt", fontWeight: 900, color: "#18221f", letterSpacing: "-0.5px" }}>TANKA</span>
                          <span style={{ fontSize: "9pt", fontWeight: 700, color: "#45544e", textTransform: "uppercase", letterSpacing: "1px" }}>
                            MODUL PEMBELAJARAN TERPADU
                          </span>
                        </div>
                        <h1 style={{ fontSize: "20pt", fontWeight: 800, color: "#111a17", margin: "10pt 0 4pt", lineHeight: 1.25 }}>
                          {activeDocTitle}
                        </h1>
                        <div style={{ fontSize: "9pt", color: "#66706b" }}>
                          Dokumen Studi Mandiri • Dicetak pada {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                        </div>
                      </div>

                      <div className="markdown-body" style={{ fontSize: 14.5, lineHeight: 1.7, color: "#1f2b26" }}>
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm, remarkMath]}
                          rehypePlugins={[rehypeKatex]}
                          components={markdownComponents}
                        >
                          {sanitizeMathMarkdown((formattedContent || activeDocContent || "").replace(/^#\s+[^\n]+\n+/, ""))}
                        </ReactMarkdown>
                      </div>
                    </div>

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
                      borderRadius: 24,
                      padding: "26px 30px",
                      boxShadow: "0 8px 32px rgba(27, 39, 35, 0.04)"
                    }}
                  >
                    {/* Shortcut Pemilihan Materi Tersimpan */}
                    {documents && documents.length > 0 && (
                      <div
                        style={{
                          backgroundColor: "#f7f9f4",
                          border: "1px solid #dce4d6",
                          borderRadius: 20,
                          padding: "16px 20px",
                          marginBottom: 22
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 6 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <BookOpen size={16} color="#4b6623" />
                            <span style={{ fontSize: 13.5, fontWeight: 800, color: "#18221f" }}>
                              Pilih Materi Tersimpan ({documents.length})
                            </span>
                          </div>
                          <span style={{ fontSize: 11.5, color: "#607068" }}>
                            Buka modul langsung tanpa unggah ulang
                          </span>
                        </div>

                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {documents.map((doc) => (
                            <button
                              key={doc.id}
                              type="button"
                              onClick={() => loadDocument(doc.id)}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 7,
                                padding: "8px 15px",
                                backgroundColor: "#ffffff",
                                border: "1px solid #dce2d8",
                                borderRadius: 9999,
                                color: "#17201d",
                                fontSize: 12.5,
                                fontWeight: 600,
                                cursor: "pointer",
                                transition: "all 0.15s ease",
                                boxShadow: "0 1px 4px rgba(0,0,0,0.03)"
                              }}
                              title={doc.title}
                            >
                              <span style={{ width: 6, height: 6, borderRadius: 9999, backgroundColor: "#65a30d" }} />
                              <span style={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {doc.title || "Modul Tanpa Judul"}
                              </span>
                              <ChevronRight size={13} color="#8a9691" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

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
                          { id: "youtube", label: "Video YouTube", icon: YouTubeIcon },
                          { id: "topic", label: "Buat Topik AI", icon: Compass },
                          { id: "manual", label: "Tulis Catatan", icon: FileText }
                        ].map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => {
                              if (t.id === "youtube") {
                                if (setIsYouTubeModalOpen) setIsYouTubeModalOpen(true);
                              } else {
                                setMaterialCreationTab(t.id as any);
                              }
                            }}
                            style={{
                              backgroundColor: materialCreationTab === t.id ? "#18221f" : "#fafbf8",
                              color: materialCreationTab === t.id ? "#c8f064" : "#56615d",
                              border: `1px solid ${materialCreationTab === t.id ? "#18221f" : "#dce1da"}`,
                              borderRadius: 9999,
                              padding: "6px 14px",
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              transition: "all 0.15s ease"
                            }}
                          >
                            <t.icon size={12} color={materialCreationTab === t.id ? "#c8f064" : "#607068"} />
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
                          borderRadius: 20,
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
                              borderRadius: 9999,
                              padding: "8px 18px",
                              fontSize: 12.5,
                              fontWeight: 700,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              transition: "all 0.15s ease"
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
                              borderRadius: 9999,
                              padding: "8px 18px",
                              fontSize: 12.5,
                              fontWeight: 600,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              transition: "all 0.15s ease"
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
                              borderRadius: 9999,
                              padding: "10px 18px",
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
                              borderRadius: 9999,
                              padding: "10px 20px",
                              fontSize: 13,
                              fontWeight: 700,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              transition: "all 0.15s ease"
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
                            borderRadius: 9999,
                            padding: "10px 22px",
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: "pointer",
                            transition: "all 0.15s ease"
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
