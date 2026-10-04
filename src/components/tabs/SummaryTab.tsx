import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Sparkles, Download, Copy, Volume2, VolumeX, CheckCircle2, ChevronRight, BookOpen, Layers, Target, Printer, FileText, Check } from "lucide-react";
import { DocumentItem, QuizQuestion, Flashcard } from "../../types";
import { MathView } from "../common/MathView";
import { AIProcessLoader } from "../common/AIProcessLoader";
import { renderVisualDiagramOrPre, extractTextFromNode, isAsciiDiagramText } from "../common/DiagramRenderer";

export interface SummaryTabProps {
  activeDoc: DocumentItem | null | undefined;
  activeDocTitle: string;
  activeDocSummary: string;
  formattedSummary: string;
  summaryStyle: string;
  setSummaryStyle: (style: string) => void;
  isGeneratingSummary: boolean;
  handleGenerateSummary: (style: string) => void;
  isSpeaking: boolean;
  toggleSpeech: () => void;
  downloadAsMarkdown: () => void;
  copyToClipboard: (text: string, id: string) => void;
  copiedId: string | null;
  quizQuestions: QuizQuestion[];
  flashcards: Flashcard[];
  activeDocId?: string | null;
  selectedModel?: string;
  setActiveDocSummary?: (val: string) => void;
}

export function SummaryTab({
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
  setActiveDocSummary
}: SummaryTabProps) {
  const [tailorInput, setTailorInput] = React.useState("");
  const [isTailoring, setIsTailoring] = React.useState(false);

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
        alert("Gagal menyesuaikan rangkuman: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      alert("Error: " + err);
    } finally {
      setIsTailoring(false);
    }
  };
  return (
              <div className="tab-pane-animate" style={{ maxWidth: 1040, margin: "0 auto" }}>
                {/* Summary Style Selection Pills */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14, flexWrap: "wrap", backgroundColor: "#fafbf8", padding: "8px 12px", borderRadius: 8, border: "1px solid #dde1da" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#6f7975", textTransform: "uppercase", letterSpacing: "0.06em", marginRight: 4 }}>
                    Gaya Rangkuman:
                  </span>
                  {[
                    { id: "tutor", label: "Tutor Bertahap & Latihan", desc: "Panduan bertahap dari nol, contoh angka/kasus nyata, trik ingat, dan 5 latihan mandiri" },
                    { id: "intuitive", label: "Sederhana & Intuitif", desc: "Bahasa santai & mudah dimengerti, konsep 100% utuh" },
                    { id: "memorization", label: "Poin Hafalan & Ujian", desc: "Istilah kunci, klasifikasi, dan mnemonik cepat" }
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSummaryStyle(s.id as any)}
                      title={s.desc}
                      style={{
                        backgroundColor: summaryStyle === s.id ? "#18221f" : "#ffffff",
                        color: summaryStyle === s.id ? "#c8f064" : "#45544e",
                        border: `1px solid ${summaryStyle === s.id ? "#18221f" : "#dce1da"}`,
                        borderRadius: 999,
                        padding: "4px 12px",
                        fontSize: 11.5,
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "0.15s ease"
                      }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <h2 style={{ fontSize: 19, fontWeight: 800, letterSpacing: "-0.02em", color: "#17201d" }}>
                      Rangkuman Cerdas & Poin Kritis Ujian
                    </h2>
                    <p style={{ fontSize: 12, color: "#6f7975", marginTop: 2 }}>
                      Struktur intisari materi dan analisis jebakan soal oleh model AI.
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    {activeDocSummary && (
                      <>
                        <button
                          onClick={() => toggleSpeech(activeDocSummary)}
                          style={{
                            backgroundColor: isSpeaking ? "#fef2f2" : "#ffffff",
                            border: `1px solid ${isSpeaking ? "#ef4444" : "#dce1da"}`,
                            color: isSpeaking ? "#ef4444" : "#17201d",
                            borderRadius: 8,
                            padding: "8px 12px",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 6
                          }}
                          title="Dengarkan pembacaan teks audio"
                        >
                          {isSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
                          {isSpeaking ? "Hentikan" : "Dengarkan"}
                        </button>

                        <button
                          onClick={() => copyToClipboard(activeDocSummary, "Rangkuman", "summary")}
                          style={{
                            backgroundColor: copiedId === "summary" ? "#ecfdf5" : "#ffffff",
                            border: `1px solid ${copiedId === "summary" ? "#10b981" : "#dce1da"}`,
                            color: copiedId === "summary" ? "#065f46" : "#17201d",
                            borderRadius: 8,
                            padding: "8px 12px",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            transition: "all 0.15s ease"
                          }}
                          title="Salin Markdown ke clipboard"
                        >
                          {copiedId === "summary" ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                          <span>{copiedId === "summary" ? "Tersalin!" : "Salin"}</span>
                        </button>

                        <button
                          onClick={() => downloadAsMarkdown(`${(activeDocTitle || "rangkuman").toLowerCase().replace(/\s+/g, "_")}_ringkasan.md`, `# ${activeDocTitle}\n\n${activeDocSummary}`)}
                          style={{
                            backgroundColor: "#ffffff",
                            border: "1px solid #dce1da",
                            color: "#17201d",
                            borderRadius: 8,
                            padding: "8px 12px",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 6
                          }}
                          title="Unduh sebagai berkas Markdown .md"
                        >
                          <Download size={14} />
                          <span>Unduh .md</span>
                        </button>

                        <button
                          onClick={() => window.print()}
                          style={{
                            backgroundColor: "#ffffff",
                            border: "1px solid #dce1da",
                            color: "#17201d",
                            borderRadius: 8,
                            padding: "8px 12px",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 6
                          }}
                          title="Cetak materi atau simpan ke PDF"
                        >
                          <Printer size={14} />
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
                        borderRadius: 8,
                        padding: "8px 14px",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: isGeneratingSummary ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 6
                      }}
                    >
                      <Sparkles size={14} />
                      {isGeneratingSummary ? "Meringkas..." : "Rangkum Baru"}
                    </button>
                  </div>
                </div>

                {isGeneratingSummary ? (
                  <AIProcessLoader
                    title="Menyusun Rangkuman Komprehensif"
                    subtitle="AI merangkum materi secara sistematis tanpa menghilangkan rumus KaTeX dan fakta esensial."
                    badge="Intisari Belajar"
                    steps={[
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
                    <p style={{ fontSize: 13, color: "#6f7975", maxWidth: 380, margin: "6px auto 16px" }}>
                      Klik tombol di atas untuk menghasilkan ringkasan poin inti materi dan daftar jebakan soal.
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
                        cursor: "pointer"
                      }}
                    >
                      Buat Rangkuman AI
                    </button>
                  </div>
                ) : (
                  <div
                    className="learning-card-white markdown-body print-document-container"
                    style={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #dde1da",
                      borderRadius: 12,
                      padding: "26px",
                      lineHeight: "1.7",
                      color: "#17201d",
                      fontSize: 14,
                      boxShadow: "0 10px 35px rgba(27, 39, 35, 0.04)"
                    }}
                  >
                    {/* Publication Header for Print only */}
                    <div className="print-only" style={{ borderBottom: "2px solid #18221f", paddingBottom: 14, marginBottom: 20 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                        <div>
                          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", color: "#4b6623", fontFamily: "'DM Mono', monospace" }}>
                            TANKA · MODUL BELAJAR EDITORIAL
                          </span>
                          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#18221f", margin: "4px 0 0" }}>
                            {activeDoc?.title || "Modul Pembelajaran"}
                          </h1>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <span style={{ fontSize: 10, color: "#6b7280", fontFamily: "'DM Mono', monospace" }}>
                            Dicetak: {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 14, marginTop: 8, fontSize: 11, color: "#4b5563", fontFamily: "'DM Mono', monospace" }}>
                        <span>Panjang: {formattedSummary ? formattedSummary.trim().split(/\s+/).filter(Boolean).length : 0} kata</span>
                        <span>•</span>
                        <span>Estimasi Baca: {Math.max(1, Math.ceil((formattedSummary ? formattedSummary.trim().split(/\s+/).filter(Boolean).length : 0) / 180))} menit</span>
                        <span>•</span>
                        <span>Gaya: {summaryStyle === "tutor" ? "Tutor Bertahap & Latihan" : summaryStyle === "intuitive" ? "Sederhana & Intuitif" : "Poin Hafalan"}</span>
                      </div>
                    </div>

                    <ReactMarkdown
                      remarkPlugins={[remarkGfm, remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                      components={{
                        h1: ({ children }) => (
                          <h1 style={{ fontSize: 21, fontWeight: 800, color: "#17201d", marginTop: 20, marginBottom: 10, borderBottom: "1px solid #dde1da", paddingBottom: 6 }}>
                            {children}
                          </h1>
                        ),
                        h2: ({ children }) => (
                          <h2 style={{ fontSize: 17, fontWeight: 700, color: "#22370c", marginTop: 20, marginBottom: 8 }}>
                            {children}
                          </h2>
                        ),
                        h3: ({ children }) => (
                          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#17201d", marginTop: 16, marginBottom: 6 }}>
                            {children}
                          </h3>
                        ),
                        p: ({ children }) => {
                          const pText = extractTextFromNode(children);
                          if (isAsciiDiagramText(pText)) {
                            return renderVisualDiagramOrPre(children);
                          }
                          return <p style={{ marginBottom: 10, color: "#45544e", lineHeight: 1.65 }}>{children}</p>;
                        },
                        ul: ({ children }) => (
                          <ul style={{ paddingLeft: 18, marginBottom: 12 }}>{children}</ul>
                        ),
                        ol: ({ children }) => (
                          <ol style={{ paddingLeft: 18, marginBottom: 12 }}>{children}</ol>
                        ),
                        li: ({ children }) => (
                          <li style={{ marginBottom: 5, color: "#45544e" }}>{children}</li>
                        ),
                        strong: ({ children }) => (
                          <strong style={{ color: "#17201d", fontWeight: 700 }}>{children}</strong>
                        ),
                        blockquote: ({ children }) => (
                          <blockquote style={{ borderLeft: "3px solid #8dbd42", backgroundColor: "#eef8db", padding: "10px 14px", borderRadius: "0 8px 8px 0", margin: "12px 0", color: "#22370c" }}>
                            {children}
                          </blockquote>
                        ),
                        pre: ({ children }) => renderVisualDiagramOrPre(children),
                        code: ({ children }) => (
                          <code
                            style={{
                              fontFamily: "'DM Mono', monospace",
                              fontSize: 12,
                              backgroundColor: "#f0f4ee",
                              color: "#1f2b26",
                              padding: "2px 5px",
                              borderRadius: 4
                            }}
                          >
                            {children}
                          </code>
                        ),
                        table: ({ children }) => (
                          <div style={{ overflowX: "auto", margin: "14px 0" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, border: "1px solid #dde1da", borderRadius: 8, overflow: "hidden" }}>
                              {children}
                            </table>
                          </div>
                        ),
                        thead: ({ children }) => (
                          <thead style={{ backgroundColor: "#f8f9f5", borderBottom: "1px solid #dde1da" }}>
                            {children}
                          </thead>
                        ),
                        th: ({ children }) => (
                          <th style={{ padding: "8px 12px", textAlign: "left", color: "#22370c", fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            {children}
                          </th>
                        ),
                        td: ({ children }) => (
                          <td style={{ padding: "8px 12px", borderBottom: "1px solid #eef1eb", color: "#17201d" }}>
                            {children}
                          </td>
                        ),
                      }}
                    >
                      {formattedSummary}
                    </ReactMarkdown>

                    {/* AI Tailoring Input */}
                    <div style={{ marginTop: 24, padding: "16px", backgroundColor: "#f0fdf4", borderRadius: 12, border: "1px solid #dcfce7" }} className="no-print">
                      <h3 style={{ fontSize: 13, fontWeight: 700, margin: "0 0 10px", color: "#166534", display: "flex", alignItems: "center", gap: 6 }}>
                        <Sparkles size={14} color="#166534" /> 
                        Sesuaikan Rangkuman dengan AI
                      </h3>
                      <div style={{ display: "flex", gap: 8 }}>
                        <input 
                          type="text"
                          value={tailorInput}
                          onChange={(e) => setTailorInput(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleTailor()}
                          placeholder="Contoh: Buat lebih singkat, tambahkan analogi mobil, gunakan bahasa santai..."
                          style={{ flex: 1, padding: "10px 14px", borderRadius: 8, border: "1px solid #bbf7d0", backgroundColor: "#fff", color: "#166534", fontSize: 13, outline: "none" }}
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
                            borderRadius: 8, 
                            fontWeight: 700, 
                            fontSize: 13,
                            cursor: isTailoring || !tailorInput.trim() ? "not-allowed" : "pointer",
                            transition: "all 0.2s"
                          }}
                        >
                          {isTailoring ? "Menyusun..." : "Sesuaikan"}
                        </button>
                      </div>
                    </div>

                    {/* Print Appendix 1: Flashcards / Glosarium Konsep Kunci */}
                    {flashcards && flashcards.length > 0 && (
                      <div className="print-only" style={{ marginTop: 28, paddingTop: 20, borderTop: "2px solid #18221f", breakBefore: "page" }}>
                        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", color: "#4b6623", fontFamily: "'DM Mono', monospace" }}>
                          LAMPIRAN I · FLASHCARDS & DEFINISI KUNCI
                        </span>
                        <h2 style={{ fontSize: 16, fontWeight: 800, color: "#18221f", margin: "4px 0 14px 0" }}>
                          Glosarium Konsep & Kaidah Inti
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

                    {/* Print Appendix 2: Soal Latihan & Pembahasan Kunci */}
                    {quizQuestions && quizQuestions.length > 0 && (
                      <div className="print-only" style={{ marginTop: 28, paddingTop: 20, borderTop: "2px solid #18221f", breakBefore: "page" }}>
                        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", color: "#4b6623", fontFamily: "'DM Mono', monospace" }}>
                          LAMPIRAN II · LATIHAN KUIS & PEMBAHASAN
                        </span>
                        <h2 style={{ fontSize: 16, fontWeight: 800, color: "#18221f", margin: "4px 0 14px 0" }}>
                          Paket Soal & Pembahasan Terstruktur
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
  );
}
