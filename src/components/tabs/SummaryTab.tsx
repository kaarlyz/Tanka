import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Sparkles, FileText, Volume2, VolumeX, Copy, Check } from "lucide-react";
import { AIProcessLoader } from "../common/AIProcessLoader";

interface SummaryTabProps {
  activeDocSummary: string;
  onGenerateSummary: (style: string) => void;
  isGeneratingSummary: boolean;
  showNotice: (msg: string) => void;
}

export function SummaryTab({
  activeDocSummary,
  onGenerateSummary,
  isGeneratingSummary,
  showNotice
}: SummaryTabProps) {
  const [style, setStyle] = useState<"intuitive" | "tutor" | "memorization">("tutor");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);

  const styleOptions = [
    { id: "tutor", label: "Gaya Tutor Sebaya", desc: "Penjelasan interaktif ramah pemula dengan scaffolding mental model" },
    { id: "intuitive", label: "Bahasa Sederhana & Analogi", desc: "Analogi konkret dunia nyata bebas dari jargon kering" },
    { id: "memorization", label: "Poin Hafalan & Ujian Cepat", desc: "Tabel perbandingan, rumus ringkas, dan mnemonik ujian" }
  ];

  const handleToggleSpeech = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      showNotice("Browser Anda tidak mendukung Speech Synthesis");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      window.speechSynthesis.cancel();
      const cleanText = activeDocSummary.replace(/[#*`$\\]/g, "");
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = "id-ID";
      utterance.rate = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(activeDocSummary);
    setCopied(true);
    showNotice("Rangkuman berhasil disalin");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="tab-pane-animate" style={{ maxWidth: 940, margin: "0 auto", paddingBottom: 48 }}>
      {/* Style Chips Selector */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
        {styleOptions.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setStyle(s.id as any)}
            title={s.desc}
            style={{
              backgroundColor: style === s.id ? "#18221f" : "#ffffff",
              color: style === s.id ? "#c8f064" : "#45544e",
              border: `1px solid ${style === s.id ? "#18221f" : "#dce1da"}`,
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

      {/* Header with Title & Action Controls */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 8 }}>
        <div>
          <h2 style={{ fontSize: 19, fontWeight: 800, letterSpacing: "-0.02em", color: "#17201d", margin: 0 }}>
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
                type="button"
                onClick={handleToggleSpeech}
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
                <span>{isSpeaking ? "Hentikan" : "Dengarkan"}</span>
              </button>

              <button
                type="button"
                onClick={handleCopy}
                style={{
                  backgroundColor: copied ? "#ecfdf5" : "#ffffff",
                  border: `1px solid ${copied ? "#10b981" : "#dce1da"}`,
                  color: copied ? "#065f46" : "#17201d",
                  borderRadius: 8,
                  padding: "8px 12px",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                <span>{copied ? "Tersalin!" : "Salin"}</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => onGenerateSummary(style)}
            disabled={isGeneratingSummary}
            style={{
              backgroundColor: "#18221f",
              color: "#c8f064",
              border: "none",
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
            <span>{isGeneratingSummary ? "Menyusun..." : activeDocSummary ? "Susun Ulang" : "Buat Rangkuman"}</span>
          </button>
        </div>
      </div>

      {/* Main Content Card or Empty State */}
      {isGeneratingSummary ? (
        <AIProcessLoader
          title="Menyusun Rangkuman Berdaya Retensi Tinggi"
          subtitle="AI memilah intisari konsep penting, peta alur, dan trik menghadapi ujian."
          badge="High-Yield Notes"
          steps={[
            { label: "Membaca & Memetakan Struktur Bab", detail: "Mengelompokkan poin pengantar, pembahasan inti, dan kesimpulan." },
            { label: "Merumuskan Analogi Intuitif", detail: "Menghubungkan istilah abstrak ke situasi nyata sehari-hari." },
            { label: "Mengidentifikasi Jebakan Ujian", detail: "Menandai pola salah kaprah yang sering mengecoh siswa." },
            { label: "Menyusun Mental Model Akhir", detail: "Menyaring 3-4 kaidah mutlak yang wajib diingat." }
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
          <p style={{ fontSize: 13, color: "#6f7975", maxWidth: 440, margin: "6px auto 16px", lineHeight: "1.5" }}>
            Klik tombol di bawah untuk membuat rangkuman ringkas, terstruktur, dan siap dibaca sebelum ujian.
          </p>
          <button
            type="button"
            onClick={() => onGenerateSummary(style)}
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
            Buat Rangkuman Sekarang
          </button>
        </div>
      ) : (
        <div
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #dde1da",
            borderRadius: 14,
            padding: "26px 28px",
            boxShadow: "0 10px 35px rgba(27, 39, 35, 0.04)"
          }}
        >
          <div className="markdown-content" style={{ fontSize: 14.5, lineHeight: 1.7, color: "#18211e" }}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex]}
            >
              {activeDocSummary}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
