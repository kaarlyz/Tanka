import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import {
  Sparkles,
  Upload,
  Globe,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Target,
  Mic,
  Layers,
  FileText,
  Plus
} from "lucide-react";
import { MathView } from "../common/MathView";
import { ActiveTab } from "../../types";

export interface MaterialTabProps {
  activeDocId: string | null;
  activeDocTitle: string;
  activeDocContent: string;
  onSaveContent: (newContent: string) => Promise<void> | void;
  onTriggerEnrichWeb: () => void;
  onDetectTitle: () => void;
  onTailorMaterial: (prompt: string, mode: "update" | "new_variant") => Promise<void> | void;
  quizCount: number;
  flashcardCount: number;
  setActiveTab: (tab: ActiveTab) => void;
  showNotice: (msg: string) => void;
}

export function MaterialTab({
  activeDocId,
  activeDocTitle,
  activeDocContent,
  onSaveContent,
  onTriggerEnrichWeb,
  onDetectTitle,
  onTailorMaterial,
  quizCount = 0,
  flashcardCount = 0,
  setActiveTab,
  showNotice
}: MaterialTabProps) {
  const wordCount = (activeDocContent || "").trim() ? (activeDocContent || "").trim().split(/\s+/).length : 0;
  const flashcardsCount = flashcardCount || 0;
  const quizQuestionsCount = quizCount || 0;
  const [isDetectingTitle, setIsDetectingTitle] = useState(false);
  const [isTailoringMaterial, setIsTailoringMaterial] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);
  const onAutoDetectTitle = onDetectTitle;
  const onOpenEnrichModal = onTriggerEnrichWeb;
  const onSaveRawText = onSaveContent;
  const onOpenUpload = () => {};
  const onGenerateQuiz = () => setActiveTab("quiz");
  const [showRawText, setShowRawText] = useState(false);
  const [editBuffer, setEditBuffer] = useState(activeDocContent);
  const [copied, setCopied] = useState(false);
  const [materialPrompt, setMaterialPrompt] = useState("");

  React.useEffect(() => {
    setEditBuffer(activeDocContent);
  }, [activeDocContent]);

  const handleCopy = () => {
    navigator.clipboard.writeText(activeDocContent);
    setCopied(true);
    showNotice("Modul materi berhasil disalin ke papan klip");
    setTimeout(() => setCopied(false), 2000);
  };

  const chips = [
    { label: "➕ Tambah 2 Contoh Soal Terapan", text: "Tambahkan 2 contoh soal terapan nyata beserta langkah pembahasannya secara runtut" },
    { label: "🔍 Perjelas Penurunan Rumus KaTeX", text: "Perjelas penurunan rumus dan langkah substitusi matematika dengan format KaTeX terstruktur" },
    { label: "💡 Buat Analogi Bebas Jargon", text: "Gambarkan konsep inti dengan analogi sederhana sehari-hari yang bebas dari jargon rumit" },
    { label: "⚠️ Bedah Titik Rawan Kesalahan", text: "Jelaskan jebakan atau kesalahan umum yang sering mengecoh siswa pada materi ini saat ujian" }
  ];

  if (!activeDocId) {
    return (
      <div style={{ maxWidth: 840, margin: "40px auto", textAlign: "center", padding: "40px 20px" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📖</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#17201d", margin: "0 0 8px" }}>
          Belum Ada Materi yang Dipilih
        </h2>
        <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 20px" }}>
          Pilih salah satu catatan di bilah samping, atau buat materi baru dengan mengunggah berkas/foto.
        </p>
        <button
          type="button"
          onClick={onOpenUpload}
          style={{
            padding: "11px 22px",
            borderRadius: 10,
            backgroundColor: "#566b36",
            color: "#ffffff",
            border: "none",
            fontSize: 14,
            fontWeight: 800,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 8
          }}
        >
          <Upload size={17} />
          <span>Unggah Berkas / Foto Sekarang</span>
        </button>
      </div>
    );
  }

  return (
    <div className="tab-pane-animate" style={{ maxWidth: 1080, margin: "0 auto", paddingBottom: 48 }}>
      <div
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid #dde1da",
          borderRadius: 12,
          padding: "24px 26px",
          marginBottom: 20,
          boxShadow: "0 10px 35px rgba(27, 39, 35, 0.04)"
        }}
      >
        {/* Title Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
          <div>
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
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginTop: 8 }}>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: "#17201d", letterSpacing: "-0.03em", margin: 0, lineHeight: 1.25 }}>
                {activeDocTitle}
              </h1>
              <button
                type="button"
                onClick={onAutoDetectTitle}
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

          {/* Action Toolbar */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <button
              type="button"
              onClick={onOpenUpload}
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
            >
              <Upload size={13} color="#4b6623" />
              <span>Unggah Baru</span>
            </button>

            <button
              type="button"
              onClick={onOpenEnrichModal}
              disabled={isEnriching}
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
            >
              <Globe size={14} color="#4b6623" />
              <span>{isEnriching ? "Meneliti..." : "Perkaya Materi (Web Search)"}</span>
            </button>

            <button
              type="button"
              onClick={handleCopy}
              style={{
                backgroundColor: copied ? "#ecfdf5" : "#ffffff",
                border: `1px solid ${copied ? "#10b981" : "#dce1da"}`,
                color: copied ? "#065f46" : "#56615d",
                borderRadius: 8,
                padding: "6px 12px",
                fontSize: 12,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6
              }}
            >
              {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
              <span>{copied ? "Tersalin!" : "Salin Modul"}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowRawText((prev) => !prev)}
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
              <span>{showRawText ? "Tutup Editor" : "Edit Teks Mentah"}</span>
            </button>
          </div>
        </div>

        {/* Bento Stats Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginBottom: 20 }}>
          <div style={{ padding: "14px 16px", backgroundColor: "#f8f9f5", borderRadius: 10, border: "1px solid #dde1da" }}>
            <div style={{ fontSize: 10.5, color: "#727d78", textTransform: "uppercase", fontWeight: 700, fontFamily: "'DM Mono', monospace" }}>Total Kosakata</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#17201d", marginTop: 4 }}>
              {wordCount.toLocaleString("id-ID")} <span style={{ fontSize: 12, fontWeight: 500, color: "#727d78" }}>kata</span>
            </div>
          </div>

          <div style={{ padding: "14px 16px", backgroundColor: "#f8f9f5", borderRadius: 10, border: "1px solid #dde1da" }}>
            <div style={{ fontSize: 10.5, color: "#727d78", textTransform: "uppercase", fontWeight: 700, fontFamily: "'DM Mono', monospace" }}>Kartu Flashcard</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#22370c", marginTop: 4 }}>
              {flashcardsCount} <span style={{ fontSize: 12, fontWeight: 500, color: "#4b6623" }}>kartu</span>
            </div>
          </div>

          <div style={{ padding: "14px 16px", backgroundColor: "#f8f9f5", borderRadius: 10, border: "1px solid #dde1da" }}>
            <div style={{ fontSize: 10.5, color: "#727d78", textTransform: "uppercase", fontWeight: 700, fontFamily: "'DM Mono', monospace" }}>Latihan Soal</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#17201d", marginTop: 4 }}>
              {quizQuestionsCount} <span style={{ fontSize: 12, fontWeight: 500, color: "#4b6623" }}>butir</span>
            </div>
          </div>
        </div>

        {/* Quick Launch Buttons */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
          <button
            type="button"
            onClick={() => {
              setActiveTab("quiz");
              if (quizQuestionsCount === 0) onGenerateQuiz();
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
              gap: 8
            }}
          >
            <Target size={15} />
            <span>Mulai Latihan Pilihan Ganda</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("feynman")}
            style={{
              backgroundColor: "#ffffff",
              color: "#17201d",
              border: "1px solid #dce1da",
              borderRadius: 8,
              padding: "10px 16px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            <Mic size={15} color="#566b36" />
            <span>Uji Pemahaman Feynman</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("flashcards")}
            style={{
              backgroundColor: "#ffffff",
              color: "#17201d",
              border: "1px solid #dce1da",
              borderRadius: 8,
              padding: "10px 16px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            <Layers size={15} color="#566b36" />
            <span>Review Flashcards</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("summary")}
            style={{
              backgroundColor: "#ffffff",
              color: "#17201d",
              border: "1px solid #dce1da",
              borderRadius: 8,
              padding: "10px 16px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            <FileText size={15} color="#566b36" />
            <span>Rangkuman AI</span>
          </button>
        </div>

        {/* ⚡ REALTIME AI MATERIAL CUSTOMIZER BAR */}
        <div
          style={{
            backgroundColor: "#fbfdf9",
            border: "1px solid #dce2da",
            borderRadius: 12,
            padding: "14px 16px",
            marginBottom: 20
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <Sparkles size={15} color="#566b36" />
              <strong style={{ fontSize: 12.5, color: "#18211e" }}>
                Sesuaikan Materi Ini dengan AI (Realtime)
              </strong>
            </div>
            <span style={{ fontSize: 10, backgroundColor: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0", padding: "1px 6px", borderRadius: 4, fontWeight: 700 }}>
              Live Editor
            </span>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
            {chips.map((c, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setMaterialPrompt(c.text)}
                style={{
                  padding: "4px 9px",
                  borderRadius: 6,
                  backgroundColor: materialPrompt === c.text ? "#f0fdf4" : "#ffffff",
                  border: `1px solid ${materialPrompt === c.text ? "#566b36" : "#e2e6df"}`,
                  color: materialPrompt === c.text ? "#166534" : "#45544e",
                  fontSize: 11,
                  fontWeight: materialPrompt === c.text ? 700 : 500,
                  cursor: "pointer"
                }}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <input
              type="text"
              value={materialPrompt}
              onChange={(e) => setMaterialPrompt(e.target.value)}
              placeholder="Ketik arahan Anda: misal 'tambahkan pembuktian matriks', 'perjelas langkah nomor 2'..."
              style={{
                flex: 1,
                minWidth: 240,
                height: 36,
                backgroundColor: "#ffffff",
                border: "1px solid #dce1da",
                borderRadius: 8,
                padding: "0 12px",
                fontSize: 12.5,
                color: "#18211e",
                outline: "none"
              }}
            />

            <button
              type="button"
              onClick={() => onTailorMaterial(materialPrompt, "update")}
              disabled={isTailoringMaterial || !materialPrompt.trim()}
              style={{
                height: 36,
                backgroundColor: isTailoringMaterial || !materialPrompt.trim() ? "#dce1da" : "#566b36",
                color: "#ffffff",
                border: "none",
                borderRadius: 8,
                padding: "0 14px",
                fontSize: 12,
                fontWeight: 700,
                cursor: isTailoringMaterial || !materialPrompt.trim() ? "not-allowed" : "pointer"
              }}
            >
              {isTailoringMaterial ? "Menyesuaikan..." : "Perbarui Materi"}
            </button>

            <button
              type="button"
              onClick={() => onTailorMaterial(materialPrompt, "variant")}
              disabled={isTailoringMaterial || !materialPrompt.trim()}
              style={{
                height: 36,
                backgroundColor: "#ffffff",
                color: "#4b6623",
                border: "1px solid #dce1da",
                borderRadius: 8,
                padding: "0 12px",
                fontSize: 12,
                fontWeight: 700,
                cursor: isTailoringMaterial || !materialPrompt.trim() ? "not-allowed" : "pointer"
              }}
              title="Simpan sebagai modul varian baru di sidebar"
            >
              Simpan Varian Baru
            </button>
          </div>
        </div>

        {/* Raw Text Editor or Clean Markdown View */}
        {showRawText ? (
          <div style={{ marginTop: 16 }}>
            <textarea
              rows={16}
              value={editBuffer}
              onChange={(e) => setEditBuffer(e.target.value)}
              style={{
                width: "100%",
                backgroundColor: "#ffffff",
                border: "1px solid #dce1da",
                borderRadius: 10,
                padding: "14px 16px",
                fontSize: 13,
                lineHeight: 1.5,
                fontFamily: "inherit",
                resize: "vertical",
                outline: "none"
              }}
            />
            <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button
                type="button"
                onClick={() => {
                  setEditBuffer(activeDocContent);
                  setShowRawText(false);
                }}
                style={{
                  padding: "8px 16px",
                  borderRadius: 7,
                  border: "1px solid #dce2da",
                  backgroundColor: "#ffffff",
                  fontSize: 12.5,
                  cursor: "pointer"
                }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onSaveRawText(editBuffer);
                  setShowRawText(false);
                }}
                style={{
                  padding: "8px 18px",
                  borderRadius: 7,
                  border: "none",
                  backgroundColor: "#566b36",
                  color: "#ffffff",
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        ) : (
          <div className="markdown-content" style={{ marginTop: 24, fontSize: 14.5, lineHeight: 1.7, color: "#18211e" }}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex]}
            >
              {activeDocContent}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
