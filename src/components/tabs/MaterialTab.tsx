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
  Compass
} from "lucide-react";
import { ActiveTab, Flashcard, QuizQuestion } from "../../types";
import { MathView } from "../common/MathView";
import { renderVisualDiagramOrPre, extractTextFromNode, isAsciiDiagramText } from "../common/DiagramRenderer";

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

                    {/* Quick Launch Buttons (Primary CTA vs Secondary Actions) */}
                    <div className="action-chips-grid" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
                      <button
                        onClick={() => {
                          setActiveTab("quiz");
                          if (quizQuestions.length === 0) handleGenerateQuiz();
                        }}
                        style={{
                          backgroundColor: "#18221f",
                          color: "#c8f064",
                          border: "none",
                          borderRadius: 8,
                          padding: "12px 20px",
                          fontSize: 13.5,
                          fontWeight: 700,
                          letterSpacing: "-0.01em",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.15)"
                        }}
                      >
                        <Target size={16} />
                        Mulai Latihan Pilihan Ganda
                      </button>

                      <button
                        onClick={() => {
                          setActiveTab("feynman");
                        }}
                        style={{
                          backgroundColor: "#ffffff",
                          color: "#17201d",
                          border: "1px solid #dce1da",
                          borderRadius: 8,
                          padding: "11px 16px",
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 6
                        }}
                      >
                        <Brain size={15} color="#4b6623" />
                        Uji Feynman Sendiri
                      </button>

                      <button
                        onClick={() => {
                          setActiveTab("flashcards");
                          if (flashcards.length === 0) handleGenerateFlashcards();
                        }}
                        style={{
                          backgroundColor: "#ffffff",
                          color: "#17201d",
                          border: "1px solid #dce1da",
                          borderRadius: 8,
                          padding: "11px 16px",
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 6
                        }}
                      >
                        <Layers size={15} color="#4b6623" />
                        Buka Flashcards
                      </button>

                      <button
                        onClick={() => {
                          setActiveTab("summary");
                          if (!activeDocSummary) handleGenerateSummary();
                        }}
                        style={{
                          backgroundColor: "#ffffff",
                          color: "#17201d",
                          border: "1px solid #dce1da",
                          borderRadius: 8,
                          padding: "11px 16px",
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 6
                        }}
                      >
                        <Sparkles size={15} color="#10b981" />
                        Baca Rangkuman
                      </button>
                    </div>

                    {/* 💡 Catatan Nara Insight Box (from Figma Make design) */}
                    <div className="insight-box">
                      <span className="nara-mini">N</span>
                      <div>
                        <strong style={{ fontSize: 11, color: "#18221f", fontWeight: 800 }}>
                          Catatan Nara · Panduan Belajar
                        </strong>
                        <p style={{ margin: "4px 0 0", color: "#56645e", fontSize: 12, lineHeight: "1.55" }}>
                          Kuasai konsep inti materi terlebih dahulu sebelum menguji diri lewat kuis. Jika ada kalimat atau bagian materi yang membingungkan, tanyakan langsung ke panel tutor Nara di sisi kanan.
                        </p>
                      </div>
                    </div>

                    {/* Rendered Full Lesson Content */}
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
                          components={{
                            h1: ({ children }) => (
                              <h1 style={{ fontSize: 20, fontWeight: 800, color: "#17201d", marginTop: 20, marginBottom: 10, borderBottom: "1px solid #dde1da", paddingBottom: 6 }}>
                                {children}
                              </h1>
                            ),
                            h2: ({ children }) => (
                              <h2 style={{ fontSize: 17, fontWeight: 700, color: "#22370c", marginTop: 20, marginBottom: 8 }}>
                                {children}
                              </h2>
                            ),
                            h3: ({ children }) => (
                              <h3 style={{ fontSize: 14.5, fontWeight: 700, color: "#17201d", marginTop: 16, marginBottom: 6 }}>
                                {children}
                              </h3>
                            ),
                            p: ({ children }) => {
                              const pText = extractTextFromNode(children);
                              if (isAsciiDiagramText(pText)) {
                                return renderVisualDiagramOrPre(children);
                              }
                              return <p style={{ marginBottom: 12, color: "#374540", lineHeight: 1.65 }}>{children}</p>;
                            },
                            ul: ({ children }) => (
                              <ul style={{ paddingLeft: 18, marginBottom: 12 }}>{children}</ul>
                            ),
                            ol: ({ children }) => (
                              <ol style={{ paddingLeft: 18, marginBottom: 12 }}>{children}</ol>
                            ),
                            li: ({ children }) => (
                              <li style={{ marginBottom: 5, color: "#374540" }}>{children}</li>
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
                              <code style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, backgroundColor: "#f0f4ee", color: "#1f2b26", padding: "2px 5px", borderRadius: 4 }}>
                                {children}
                              </code>
                            ),
                            table: ({ children }) => (
                              <div style={{ overflowX: "auto", margin: "14px 0" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, border: "1px solid #dde1da", borderRadius: 8, overflow: "hidden" }}>
                                  {children}
                                </table>
                              </div>
                            )
                          }}
                        >
                          {formattedContent}
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
