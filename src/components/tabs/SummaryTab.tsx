import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Sparkles, Download, Copy, Volume2, VolumeX, CheckCircle2, ChevronRight, BookOpen, Layers, Target, Printer, FileText, Check } from "lucide-react";
import { DocumentItem, QuizQuestion, Flashcard } from "../../types";
import { MathView } from "../common/MathView";
import { normalizeMathExpression } from "../../utils/mathNormalizer";
import { AIProcessLoader } from "../common/AIProcessLoader";
import { renderVisualDiagramOrPre, extractTextFromNode, isAsciiDiagramText, sanitizeChildrenText } from "../common/DiagramRenderer";

const STATIC_REMARK_PLUGINS = [remarkGfm, remarkMath];
const STATIC_REHYPE_PLUGINS = [rehypeKatex];

function renderWithLineBreaks(children: React.ReactNode): React.ReactNode {
  if (typeof children === "string") {
    if (!/<br\s*\/?>/i.test(children)) return children;
    const parts = children.split(/<br\s*\/?>/i);
    return parts.flatMap((part, i) => (i === 0 ? [part] : [<br key={i} />, part]));
  }
  if (Array.isArray(children)) {
    return React.Children.map(children, (child) => renderWithLineBreaks(child));
  }
  return children;
}

function TailorSummaryBox({ 
  activeDocId, 
  activeDocSummary, 
  selectedModel, 
  setActiveDocSummary, 
  isTailoring, 
  setIsTailoring,
  showNotice
}: { 
  activeDocId?: string | null, 
  activeDocSummary: string, 
  selectedModel?: string, 
  setActiveDocSummary?: (val: string) => void,
  isTailoring: boolean,
  setIsTailoring: (val: boolean) => void,
  showNotice?: (msg: string) => void
}) {
  const [tailorInput, setTailorInput] = React.useState("");

  const handleTailor = async () => {
    if (!tailorInput.trim() || !activeDocId || !activeDocSummary || !setActiveDocSummary) return;
    setIsTailoring(true);
    try {
      const res = await fetch("/api/ai/tailor-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docId: activeDocId,
          currentSummary: activeDocSummary,
          tailorPrompt: tailorInput,
          model: selectedModel || "ag/gemini-3.8-flash-low"
        })
      });
      const data = await res.json();
      if (data.success && data.summary) {
        setActiveDocSummary(data.summary);
        setTailorInput("");
      } else {
        if (showNotice) showNotice("Gagal menyesuaikan rangkuman: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      if (showNotice) showNotice("Gagal menyesuaikan rangkuman: " + err);
    } finally {
      setIsTailoring(false);
    }
  };

  return (
    <div style={{ marginTop: 24, padding: "16px", backgroundColor: "#f0fdf4", borderRadius: 12, border: "1px solid #dcfce7", maxWidth: "100%", boxSizing: "border-box", overflowX: "hidden" }} className="print-hidden">
      <h3 style={{ fontSize: 13, fontWeight: 700, margin: "0 0 10px", color: "#166534", display: "flex", alignItems: "center", gap: 6 }}>
        <Sparkles size={14} color="#166534" /> 
        Sesuaikan Rangkuman dengan AI
      </h3>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", width: "100%", boxSizing: "border-box" }}>
        <input 
          type="text"
          value={tailorInput}
          onChange={(e) => setTailorInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleTailor()}
          placeholder="Contoh: Buat lebih singkat, tambahkan poin hafalan..."
          style={{ flex: "1 1 180px", minWidth: 0, width: "100%", maxWidth: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #bbf7d0", backgroundColor: "#fff", color: "#166534", fontSize: 13, outline: "none", boxSizing: "border-box" }}
          disabled={isTailoring}
        />
        <button 
          onClick={handleTailor}
          disabled={isTailoring || !tailorInput.trim()}
          style={{ 
            backgroundColor: isTailoring || !tailorInput.trim() ? "#dcfce7" : "#22c55e", 
            color: isTailoring || !tailorInput.trim() ? "#166534" : "#fff", 
            border: "none", 
            padding: "0 18px", 
            height: 40,
            borderRadius: 8, 
            fontWeight: 700, 
            fontSize: 13,
            cursor: isTailoring || !tailorInput.trim() ? "not-allowed" : "pointer",
            transition: "all 0.2s",
            flexShrink: 0
          }}
        >
          {isTailoring ? "Menyusun..." : "Sesuaikan"}
        </button>
      </div>
    </div>
  );
}

export interface SummaryTabProps {
  activeDoc: DocumentItem | null | undefined;
  activeDocTitle: string;
  activeDocSummary: string;
  formattedSummary: string;
  summaryStyle: any;
  setSummaryStyle: (style: any) => void;
  isGeneratingSummary: boolean;
  handleGenerateSummary: (style?: any) => void;
  isSpeaking: boolean;
  toggleSpeech: (text?: string) => void;
  downloadAsMarkdown: (filename?: string, content?: string) => void;
  copyToClipboard: (text?: string, label?: string, key?: string) => void;
  copiedId: string | null;
  quizQuestions: QuizQuestion[];
  flashcards: Flashcard[];
  activeDocId?: string | null;
  selectedModel?: string;
  setActiveDocSummary?: (val: string) => void;
  showNotice?: (msg: string) => void;
  setActiveTab?: (tab: any) => void;
}

export const SummaryTab = React.memo(function SummaryTab({
  activeDoc,
  activeDocTitle,
  activeDocSummary,
  formattedSummary,
  summaryStyle,
  setSummaryStyle,
  isGeneratingSummary,
  handleGenerateSummary,
  isSpeaking,
  toggleSpeech,
  downloadAsMarkdown,
  copyToClipboard,
  copiedId,
  quizQuestions,
  flashcards,
  activeDocId,
  selectedModel,
  setActiveDocSummary,
  showNotice,
  setActiveTab
}: SummaryTabProps) {
  const [isTailoring, setIsTailoring] = React.useState(false);
  const isTeaserOnly = Boolean(activeDocSummary && activeDocSummary.trim().length < 500);
  const hasFullSummary = Boolean(activeDocSummary && activeDocSummary.trim().length >= 500);

  const summaryWordCount = React.useMemo(() => (activeDocSummary ? activeDocSummary.trim().split(/\s+/).filter(Boolean).length : 0), [activeDocSummary]);
  const readEstMinutes = React.useMemo(() => Math.max(1, Math.ceil(summaryWordCount / 180)), [summaryWordCount]);

  const handlePrint = () => {
    const cleanTitle = (activeDocTitle || "Rangkuman Belajar").replace(/[\\/:*?"<>|]/g, " ").trim();
    document.title = `Rangkuman ${cleanTitle} · Tanka`;
    window.print();
  };

  const markdownComponents = React.useMemo(() => ({
    h1: ({ children }: any) => (
      <h1 style={{ fontFamily: "'Plus Jakarta Sans', 'Manrope', -apple-system, sans-serif", fontSize: 26, fontWeight: 800, color: "#111a17", letterSpacing: "-0.025em", marginTop: 32, marginBottom: 14, borderBottom: "1px solid #eef1eb", paddingBottom: 8 }}>
        {children}
      </h1>
    ),
    h2: ({ children }: any) => (
      <h2 style={{ fontFamily: "'Plus Jakarta Sans', 'Manrope', -apple-system, sans-serif", fontSize: 20, fontWeight: 750, color: "#162420", letterSpacing: "-0.02em", marginTop: 28, marginBottom: 12 }}>
        {children}
      </h2>
    ),
    h3: ({ children }: any) => (
      <h3 style={{ fontFamily: "'Plus Jakarta Sans', 'Manrope', -apple-system, sans-serif", fontSize: 16.5, fontWeight: 700, color: "#25371a", letterSpacing: "-0.01em", marginTop: 24, marginBottom: 10 }}>
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
              fontFamily: "'Plus Jakarta Sans', 'Manrope', sans-serif",
              backgroundColor: "#fffbeb",
              border: "1px solid #fde68a",
              borderLeft: "4px solid #f59e0b",
              borderRadius: "0 10px 10px 0",
              padding: "14px 18px",
              margin: "18px 0",
              color: "#92400e",
              lineHeight: 1.75,
              fontSize: 15
            }}
          >
            {renderWithLineBreaks(children)}
          </div>
        );
      }
      return <p style={{ marginBottom: 20, color: "#1a2520", lineHeight: 1.95, fontSize: 17.5 }}>{renderWithLineBreaks(children)}</p>;
    },
    ul: ({ children }: any) => (
      <ul style={{ paddingLeft: 22, marginBottom: 16, lineHeight: 1.85, fontSize: 17 }}>{children}</ul>
    ),
    ol: ({ children }: any) => (
      <ol style={{ paddingLeft: 22, marginBottom: 16, lineHeight: 1.85, fontSize: 17 }}>{children}</ol>
    ),
    li: ({ children }: any) => (
      <li style={{ marginBottom: 8, color: "#2d3a34" }}>{children}</li>
    ),
    strong: ({ children }: any) => (
      <strong style={{ color: "#0f1714", fontWeight: 700 }}>{children}</strong>
    ),
    blockquote: ({ children }: any) => {
      const text = extractTextFromNode(children);
      const isPitfall = /⚠️|salah kaprah|pitfall/i.test(text);
      const isDefinisi = /📖|definisi baku|definisi/i.test(text);
      const isInsight = /💡|insight|analogi/i.test(text);

      if (isPitfall) {
        return (
          <blockquote style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", borderLeft: "4px solid #f59e0b", backgroundColor: "#fffbeb", padding: "14px 18px", borderRadius: "0 10px 10px 0", margin: "18px 0", color: "#92400e", lineHeight: 1.75, fontSize: 15 }}>
            {children}
          </blockquote>
        );
      }
      if (isDefinisi) {
        return (
          <blockquote style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", borderLeft: "4px solid #10b981", backgroundColor: "#ecfdf5", padding: "14px 18px", borderRadius: "0 10px 10px 0", margin: "18px 0", color: "#065f46", lineHeight: 1.75, fontSize: 15 }}>
            {children}
          </blockquote>
        );
      }
      if (isInsight) {
        return (
          <blockquote style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", borderLeft: "4px solid #3b82f6", backgroundColor: "#eff6ff", padding: "14px 18px", borderRadius: "0 10px 10px 0", margin: "18px 0", color: "#1e40af", lineHeight: 1.75, fontSize: 15 }}>
            {children}
          </blockquote>
        );
      }
      return (
        <blockquote style={{ borderLeft: "3.5px solid #4b6623", backgroundColor: "#f7f9f4", padding: "14px 18px", borderRadius: "0 10px 10px 0", margin: "18px 0", color: "#21322a", lineHeight: 1.8, fontSize: 16 }}>
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
      <div className="table-scroll-wrapper" style={{ overflowX: "auto", maxWidth: "100%", WebkitOverflowScrolling: "touch" }}>
        <table>
          {children}
        </table>
      </div>
    ),
    th: ({ children }: any) => (
      <th>
        {renderWithLineBreaks(sanitizeChildrenText(children))}
      </th>
    ),
    td: ({ children }: any) => (
      <td>
        {renderWithLineBreaks(children)}
      </td>
    )
  }), []);

  return (
    <div className="tab-pane-animate material-book-layout summary-tab-layout" style={{ overflowX: "hidden", width: "100%", maxWidth: "100%", boxSizing: "border-box" }}>
      {activeDocId ? (
        <div className="material-outer-box" style={{ overflowX: "hidden", maxWidth: "100%", width: "100%", boxSizing: "border-box" }}>
          <div
            className="material-header-panel material-header-panel-card"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 18,
              flexWrap: "wrap",
              gap: 12,
              maxWidth: "100%",
              boxSizing: "border-box"
            }}
          >
            <div style={{ flex: 1, minWidth: 240, maxWidth: "100%" }}>
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
                  Rangkuman Cerdas &amp; Intisari
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginTop: 8 }}>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: "#17201d", letterSpacing: "-0.025em", margin: 0, lineHeight: 1.25 }}>
                  {activeDocTitle || "Rangkuman Modul Pembelajaran"}
                </h1>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#47554e", backgroundColor: "#f6f8f4", border: "1px solid #dde2d8", padding: "2px 10px", borderRadius: 9999, display: "inline-flex", alignItems: "center", gap: 4 }}>
                  ⏱️ ~{readEstMinutes} menit baca
                </span>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#47554e", backgroundColor: "#f6f8f4", border: "1px solid #dde2d8", padding: "2px 10px", borderRadius: 9999, display: "inline-flex", alignItems: "center", gap: 4 }}>
                  📝 {summaryWordCount} kata
                </span>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#273f15", backgroundColor: "#f0f6ea", border: "1px solid #cce2a3", padding: "2px 10px", borderRadius: 9999, display: "inline-flex", alignItems: "center", gap: 4 }}>
                  🎯 Poin Kunci Ujian
                </span>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              {activeDocSummary && (
                <>
                  <button
                    onClick={() => toggleSpeech(activeDocSummary)}
                    style={{
                      backgroundColor: isSpeaking ? "#fef2f2" : "#f8f9f5",
                      border: `1px solid ${isSpeaking ? "#ef4444" : "#dce1da"}`,
                      color: isSpeaking ? "#ef4444" : "#17201d",
                      borderRadius: 6,
                      padding: "6px 12px",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      transition: "all 0.15s ease"
                    }}
                    title="Dengarkan pembacaan teks audio"
                  >
                    {isSpeaking ? <VolumeX size={13} color="#ef4444" /> : <Volume2 size={13} color="#4b6623" />}
                    <span>{isSpeaking ? "Hentikan" : "Dengarkan"}</span>
                  </button>

                  <button
                    onClick={() => copyToClipboard(activeDocSummary, "Rangkuman", "summary")}
                    style={{
                      backgroundColor: copiedId === "summary" ? "#ecfdf5" : "#ffffff",
                      border: `1px solid ${copiedId === "summary" ? "#10b981" : "#dce1da"}`,
                      color: copiedId === "summary" ? "#065f46" : "#56615d",
                      borderRadius: 6,
                      padding: "6px 12px",
                      fontSize: 12,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      transition: "all 0.15s ease"
                    }}
                    title="Salin Markdown ke clipboard"
                  >
                    {copiedId === "summary" ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                    <span>{copiedId === "summary" ? "Tersalin!" : "Salin"}</span>
                  </button>

                  <button
                    onClick={() => downloadAsMarkdown(`${(activeDocTitle || "rangkuman").toLowerCase().replace(/\s+/g, "_")}_ringkasan.md`, `# ${activeDocTitle}\n\n${activeDocSummary}`)}
                    style={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #dce1da",
                      color: "#56615d",
                      borderRadius: 6,
                      padding: "6px 12px",
                      fontSize: 12,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      transition: "all 0.15s ease"
                    }}
                    title="Unduh sebagai berkas Markdown .md"
                  >
                    <Download size={13} color="#4b6623" />
                    <span>Unduh .md</span>
                  </button>

                  <button
                    onClick={handlePrint}
                    style={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #dce1da",
                      color: "#56615d",
                      borderRadius: 6,
                      padding: "6px 12px",
                      fontSize: 12,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      transition: "all 0.15s ease"
                    }}
                    title="Cetak materi atau simpan ke PDF"
                  >
                    <Printer size={13} color="#4b6623" />
                    <span>Cetak PDF</span>
                  </button>
                </>
              )}

              <button
                onClick={() => handleGenerateSummary()}
                disabled={isGeneratingSummary}
                style={{
                  backgroundColor: "#18221f",
                  border: "none",
                  color: "#c8f064",
                  borderRadius: 6,
                  padding: "6px 14px",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: isGeneratingSummary ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                <Sparkles size={13} />
                <span>{isGeneratingSummary ? "Meringkas..." : "Rangkum Baru"}</span>
              </button>
            </div>
          </div>

          {/* Stats Metrics Bento Grid (Matching MaterialTab on Desktop) */}
          <div className="metrics-grid print-hidden" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10, marginBottom: 16 }}>
            <div style={{ padding: "14px 18px", backgroundColor: "#fdfdfb", borderRadius: 18, border: "1px solid #dce2da" }}>
              <div style={{ fontSize: 10, color: "#727d78", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.08em", fontFamily: "'DM Mono', monospace" }}>Estimasi Baca</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#17201d", marginTop: 4, letterSpacing: "-0.02em" }}>
                ~{readEstMinutes} <span style={{ fontSize: 12, fontWeight: 500, color: "#727d78" }}>menit</span>
              </div>
              <div style={{ fontSize: 11, color: "#8a9691", marginTop: 3 }}>Intisari padat &amp; cepat</div>
            </div>

            <div style={{ padding: "14px 18px", backgroundColor: "#fdfdfb", borderRadius: 18, border: "1px solid #dce2da" }}>
              <div style={{ fontSize: 10, color: "#727d78", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.08em", fontFamily: "'DM Mono', monospace" }}>Poin Kunci &amp; Kaidah</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#22370c", marginTop: 4, letterSpacing: "-0.02em" }}>
                {flashcards.length > 0 ? (
                  <>{flashcards.length} <span style={{ fontSize: 12, fontWeight: 500, color: "#4b6623" }}>definisi</span></>
                ) : (
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#8a9691" }}>Formula &amp; Fakta</span>
                )}
              </div>
              <div style={{ fontSize: 11, color: "#8a9691", marginTop: 3 }}>Bebas miskonsepsi ujian</div>
            </div>

            <div style={{ padding: "14px 18px", backgroundColor: "#fdfdfb", borderRadius: 18, border: "1px solid #dce2da" }}>
              <div style={{ fontSize: 10, color: "#727d78", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.08em", fontFamily: "'DM Mono', monospace" }}>Latihan Terkait</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#17201d", marginTop: 4, letterSpacing: "-0.02em" }}>
                {quizQuestions.length > 0 ? (
                  <>{quizQuestions.length} <span style={{ fontSize: 12, fontWeight: 500, color: "#4b6623" }}>soal</span></>
                ) : (
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#8a9691" }}>Siap Diuji</span>
                )}
              </div>
              <div style={{ fontSize: 11, color: "#8a9691", marginTop: 3 }}>Uji retensi langsung</div>
            </div>
          </div>

          {/* Mode Switcher & Utility Actions Bar */}
          <div className="material-mode-switcher print-hidden" style={{ display: "flex", flexDirection: "column", gap: 8, padding: "8px 10px", backgroundColor: "#f8faf5", border: "1px solid #dde2d8", borderRadius: 8, margin: "10px 0 16px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#18221f", display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 10px" }}>
                  <Sparkles size={13} color="#4b6623" />
                  <span>Rangkuman Intisari &amp; Poin Ujian</span>
                </span>
                {setActiveTab && (
                  <button
                    onClick={() => setActiveTab("material")}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      padding: "6px 12px",
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      border: "1px solid #dce2da",
                      backgroundColor: "#ffffff",
                      color: "#45544e",
                      cursor: "pointer",
                      transition: "0.15s ease"
                    }}
                    title="Buka bacaan modul lengkap per bab"
                  >
                    <BookOpen size={13} color="#4b6623" />
                    <span>Buka Modul Bab</span>
                  </button>
                )}
              </div>

              {setActiveTab && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  <button
                    onClick={() => setActiveTab("flashcards")}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      padding: "6px 12px",
                      borderRadius: 6,
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
                    <span>{flashcards.length > 0 ? `Flashcards (${flashcards.length})` : "Flashcard"}</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("quiz")}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      padding: "6px 12px",
                      borderRadius: 6,
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
                    <span>{quizQuestions.length > 0 ? `Kuis (${quizQuestions.length})` : "Mulai Kuis"}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {isGeneratingSummary || isTailoring ? (
            <AIProcessLoader
              title={isTailoring ? "Menyesuaikan Rangkuman" : "Menyusun Rangkuman Komprehensif"}
              subtitle={isTailoring ? "AI merevisi rangkuman berdasarkan instruksi kustom Anda." : "AI merangkum materi secara sistematis tanpa menghilangkan rumus KaTeX dan fakta esensial."}
              badge={isTailoring ? "AI Tailoring" : "Intisari Belajar"}
              steps={isTailoring ? [
                { label: "Menganalisis Instruksi Anda", detail: "Membaca penyesuaian gaya dan konteks saat ini." },
                { label: "Merombak Paragraf", detail: "Menerapkan analogi, penyederhanaan, atau bahasa baru." },
                { label: "Memvalidasi Hasil", detail: "Memastikan format Markdown dan struktur materi aman." }
              ] : [
                { label: "Memetakan Intisari Materi", detail: "Mengelompokkan ide utama vs detail pendukung." },
                { label: "Menata Hierarki Konsep Terstruktur", detail: "Menyusun poin-poin penjelasan logis dan glosarium istilah." },
                { label: "Mengekstrak Kaidah & Rumus Kunci", detail: "Menyorot formula esensial dan pola jebakan soal ujian." }
              ]}
            />
          ) : !activeDocSummary ? (
            <div
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #dde1da",
                borderRadius: 12,
                padding: "36px 20px",
                textAlign: "center",
                boxShadow: "0 10px 35px rgba(27, 39, 35, 0.04)"
              }}
            >
              <FileText size={32} color="#727d78" style={{ margin: "0 auto 10px" }} />
              <div style={{ fontSize: 16, fontWeight: 700, color: "#17201d" }}>
                Belum Ada Rangkuman
              </div>
              <p style={{ fontSize: 13, color: "#6f7975", maxWidth: 420, margin: "6px auto 16px" }}>
                Klik tombol di bawah ini untuk menghasilkan rangkuman komprehensif, peta konsep, dan poin jebakan ujian dengan AI.
              </p>
              <button
                onClick={() => handleGenerateSummary()}
                disabled={isGeneratingSummary}
                style={{
                  backgroundColor: "#18221f",
                  color: "#c8f064",
                  border: "none",
                  borderRadius: 8,
                  padding: "10px 20px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                <Sparkles size={14} />
                Buat Rangkuman AI
              </button>
            </div>
          ) : isTeaserOnly ? (
            <div
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #dde1da",
                borderRadius: 16,
                padding: "26px",
                boxShadow: "0 10px 35px rgba(27, 39, 35, 0.04)",
                maxWidth: "100%",
                boxSizing: "border-box"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <BookOpen size={16} color="#4b6623" />
                <span style={{ fontSize: 12, fontWeight: 800, color: "#3d541b", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  Ringkasan Eksekutif Pengantar
                </span>
              </div>
              <p style={{ fontSize: 15, lineHeight: 1.8, color: "#22312b", marginBottom: 20 }}>
                {activeDocSummary}
              </p>

              <div style={{ backgroundColor: "#f8faf5", border: "1.5px dashed #c2e28f", borderRadius: 12, padding: "20px 22px", display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Sparkles size={15} color="#4b6623" />
                  <strong style={{ fontSize: 13.5, color: "#18211e" }}>Rangkuman Komprehensif Belum Dibuat</strong>
                </div>
                <p style={{ fontSize: 13, color: "#5a6b63", margin: 0, lineHeight: 1.6 }}>
                  Teks di atas adalah ringkasan pengantar singkat (2-3 kalimat). Buat rangkuman belajar mendalam yang mencakup seluruh konsep, formula KaTeX, tabel komparasi, dan analisis pola jebakan ujian.
                </p>
                <div style={{ marginTop: 4 }}>
                  <button
                    onClick={() => handleGenerateSummary()}
                    disabled={isGeneratingSummary}
                    style={{
                      backgroundColor: "#18221f",
                      color: "#c8f064",
                      border: "none",
                      borderRadius: 8,
                      padding: "10px 20px",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: isGeneratingSummary ? "not-allowed" : "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6
                    }}
                  >
                    <Sparkles size={14} />
                    {isGeneratingSummary ? "Meringkas..." : "✨ Buat Rangkuman Lengkap & Poin Ujian (AI)"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div
              className="reader-chapter-card summary-reader-card"
              style={{
                width: "100%",
                boxSizing: "border-box",
                overflowX: "hidden"
              }}
            >
              {/* Chapter/Summary Heading Banner inside Card */}
              <div
                style={{
                  maxWidth: 820,
                  margin: "0 auto 28px auto",
                  paddingBottom: 20,
                  borderBottom: "1px solid #edf1eb",
                  boxSizing: "border-box"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", color: "#3d541b", fontFamily: "'DM Mono', monospace", backgroundColor: "#f0f6ea", border: "1px solid #cce2a3", padding: "3px 12px", borderRadius: 9999 }}>
                      Rangkuman Eksekutif
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#617169", backgroundColor: "#f4f6f1", border: "1px solid #dde3d9", padding: "3px 10px", borderRadius: 9999, display: "inline-flex", alignItems: "center", gap: 4 }}>
                      ⏱️ ~{readEstMinutes} mnt baca
                    </span>
                  </div>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 700, color: "#065f46", backgroundColor: "#ecfdf5", border: "1px solid #a7f3d0", padding: "3px 12px", borderRadius: 9999 }}>
                    <Check size={13} /> Intisari Terverifikasi
                  </span>
                </div>
                <h1 style={{ fontSize: 28, fontWeight: 800, color: "#111a17", margin: 0, lineHeight: 1.3, letterSpacing: "-0.03em" }}>
                  Poin Ujian &amp; Rangkuman Cerdas
                </h1>
              </div>

              {/* Literary Reader Markdown Body */}
              <div
                className="book-reader markdown-body"
                style={{
                  maxWidth: 820,
                  margin: "0 auto",
                  overflowX: "hidden",
                  wordBreak: "break-word",
                  width: "100%",
                  boxSizing: "border-box"
                }}
              >
                <ReactMarkdown
                  remarkPlugins={STATIC_REMARK_PLUGINS}
                  rehypePlugins={STATIC_REHYPE_PLUGINS}
                  components={markdownComponents}
                >
                  {normalizeMathExpression(formattedSummary || activeDocSummary)}
                </ReactMarkdown>
              </div>

              {/* Tailor Summary Box */}
              <div style={{ maxWidth: 820, margin: "28px auto 0 auto", width: "100%", boxSizing: "border-box" }}>
                <TailorSummaryBox
                  activeDocId={activeDocId}
                  activeDocSummary={activeDocSummary}
                  selectedModel={selectedModel}
                  setActiveDocSummary={setActiveDocSummary}
                  isTailoring={isTailoring}
                  setIsTailoring={setIsTailoring}
                  showNotice={showNotice}
                />
              </div>

              {/* Print Appendix 1 */}
              {flashcards && flashcards.length > 0 && (
                <div className="print-only" style={{ maxWidth: 820, margin: "28px auto 0 auto", paddingTop: 20, borderTop: "2px solid #18221f", breakBefore: "page" }}>
                  <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", color: "#4b6623", fontFamily: "'DM Mono', monospace" }}>
                    LAMPIRAN I · FLASHCARDS &amp; DEFINISI KUNCI
                  </span>
                  <h2 style={{ fontSize: 16, fontWeight: 800, color: "#18221f", margin: "4px 0 14px 0" }}>
                    Glosarium Konsep &amp; Kaidah Inti
                  </h2>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    {flashcards.map((fc, fIdx) => (
                      <div key={fc.id || fIdx} style={{ border: "1px solid #dce1da", borderRadius: 8, padding: "10px 12px", background: "#f8f9f5", breakInside: "avoid" }}>
                        <strong style={{ fontSize: 12, color: "#22370c", display: "block", marginBottom: 4 }}>
                          <MathView text={fc.front} />
                        </strong>
                        <p style={{ fontSize: 11, color: "#374151", margin: 0, lineHeight: 1.5 }}>
                          <MathView text={fc.back} />
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Print Appendix 2 */}
              {quizQuestions && quizQuestions.length > 0 && (
                <div className="print-only" style={{ maxWidth: 820, margin: "28px auto 0 auto", paddingTop: 20, borderTop: "2px solid #18221f", breakBefore: "page" }}>
                  <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", color: "#4b6623", fontFamily: "'DM Mono', monospace" }}>
                    LAMPIRAN II · LATIHAN KUIS &amp; PEMBAHASAN
                  </span>
                  <h2 style={{ fontSize: 16, fontWeight: 800, color: "#18221f", margin: "4px 0 14px 0" }}>
                    Paket Soal &amp; Pembahasan Terstruktur
                  </h2>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {quizQuestions.map((q, qIdx) => (
                      <div key={q.id || qIdx} style={{ border: "1px solid #dce1da", borderRadius: 8, padding: "12px 14px", background: "#ffffff", breakInside: "avoid" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: "#4b6623", fontFamily: "'DM Mono', monospace" }}>SOAL {qIdx + 1}</span>
                        </div>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: "#111827", marginBottom: 8 }}>
                          <MathView text={q.question} />
                        </div>
                        {Array.isArray(q.options) && q.options.length > 0 && (
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 8 }}>
                            {q.options.map((opt, oIdx) => (
                              <div key={oIdx} style={{ fontSize: 11, padding: "4px 8px", borderRadius: 4, background: oIdx === q.correctIndex ? "#ecfccb" : "#f3f4f6", border: oIdx === q.correctIndex ? "1px solid #bef264" : "1px solid transparent", color: oIdx === q.correctIndex ? "#365314" : "#374151" }}>
                                <strong>{String.fromCharCode(65 + oIdx)}.</strong> <MathView text={opt} /> {oIdx === q.correctIndex && "✓ (Kunci)"}
                              </div>
                            ))}
                          </div>
                        )}
                        <div style={{ fontSize: 11, color: "#4b5563", background: "#f8f9f5", padding: "8px 10px", borderRadius: 6, lineHeight: 1.5 }}>
                          <strong style={{ color: "#1f2937" }}>Pembahasan: </strong>
                          <MathView text={q.explanation} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>
          Pilih dokumen atau materi terlebih dahulu untuk melihat rangkuman.
        </div>
      )}
    </div>
  );
});
