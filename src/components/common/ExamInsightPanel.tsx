import React, { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Target, Plus, Check } from "lucide-react";
import { MathView } from "../common/MathView";

interface ExamTopic {
  name: string;
  subtes: string;
  questionCount: number;
  covered: boolean;
  docId: string | null;
  docTitle: string | null;
  coverage: number;
}

interface ExamAnalysis {
  totalTopics: number;
  coveredCount: number;
  missingCount: number;
  subtesBreakdown: Record<string, number>;
  topics: ExamTopic[];
  gaps: ExamTopic[];
}

interface ExamInsightPanelProps {
  docId: string | null;
  onGenerateTopic?: (topic: string) => void;
}

export const ExamInsightPanel = React.memo(function ExamInsightPanel({ docId, onGenerateTopic }: ExamInsightPanelProps) {
  const [analysis, setAnalysis] = useState<ExamAnalysis | null>(null);
  const [questionCount, setQuestionCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [pendingTopic, setPendingTopic] = useState<string | null>(null);

  // Generate materi jalan di latar belakang (bisa 1-3 menit). Kunci tombolnya biar
  // klik dobel tidak bikin dua dokumen dengan judul sama.
  // Nama topik di panel pakai $...$ biar rumusnya ke-render. Jangan kirim itu mentah ke
  // generator materi — ambil label bersihnya saja.
  const cleanTopicLabel = (name: string) => {
    const withoutMath = name.replace(/\$[^$]*\$/g, (m) => m.replace(/\$/g, "")).trim();
    const beforeColon = withoutMath.split(":")[0].trim();
    return (beforeColon.length >= 3 ? beforeColon : withoutMath) || name;
  };

  const handleGenerate = (topic: string) => {
    if (pendingTopic || !onGenerateTopic) return;
    setPendingTopic(topic);
    onGenerateTopic(cleanTopicLabel(topic));
    setTimeout(() => setPendingTopic(null), 180000);
  };

  useEffect(() => {
    if (!docId) {
      setAnalysis(null);
      return;
    }
    let cancelled = false;
    fetch(`/api/exam-results/${encodeURIComponent(docId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled || !d || !d.analysis) return;
        setAnalysis(d.analysis);
        setQuestionCount(d.questionCount || 0);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [docId]);

  if (!analysis || questionCount === 0) return null;

  const subtesChips = Object.entries(analysis.subtesBreakdown);

  return (
    <div
      style={{
        border: "1px solid #dce1da",
        borderRadius: 10,
        backgroundColor: "#fbfcfa",
        marginBottom: 12,
        overflow: "hidden"
      }}
    >
      <button
        onClick={() => setIsOpen((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 14px",
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "left"
        }}
      >
        {isOpen ? <ChevronDown size={14} color="#60706a" /> : <ChevronRight size={14} color="#60706a" />}
        <Target size={14} color="#465922" />
        <span style={{ fontSize: 12, fontWeight: 700, color: "#17201d" }}>
          Bedah Materi — {questionCount} soal, {analysis.totalTopics} topik diuji
        </span>
        <span style={{ fontSize: 11, color: "#60706a", marginLeft: "auto" }}>
          {analysis.coveredCount} sudah ada · {analysis.missingCount} belum
        </span>
      </button>

      {isOpen && (
        <div style={{ padding: "0 14px 12px", maxHeight: 380, overflowY: "auto" }}>
          {subtesChips.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
              {subtesChips.map(([subtes, count]) => (
                <span
                  key={subtes}
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: "#45544e",
                    backgroundColor: "#f1f4ef",
                    border: "1px solid #dce1da",
                    borderRadius: 999,
                    padding: "2px 8px"
                  }}
                >
                  {subtes.replace(/_/g, " ")} · {count}
                </span>
              ))}
            </div>
          )}

          {pendingTopic && (
            <div style={{ fontSize: 11, color: "#465922", backgroundColor: "#f4f7ee", border: "1px solid #dce8ca", borderRadius: 6, padding: "6px 9px", marginBottom: 8 }}>
              Membuat materi “{pendingTopic.slice(0, 60)}” di latar belakang. Bisa 1–3 menit, muncul di Materi Saya setelah selesai.
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {analysis.topics.map((t) => (
              <div
                key={t.name}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                  padding: "7px 10px",
                  borderRadius: 8,
                  backgroundColor: t.covered ? "#ffffff" : "#fffbeb",
                  border: `1px solid ${t.covered ? "#e6ebe3" : "#fde68a"}`
                }}
              >
                {t.covered ? (
                  <Check size={13} color="#3f6212" style={{ flexShrink: 0, marginTop: 3 }} />
                ) : (
                  <Plus size={13} color="#92400e" style={{ flexShrink: 0, marginTop: 3 }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: "#17201d", lineHeight: 1.45 }}>
                    <MathView text={t.name} />
                  </div>
                  <div style={{ fontSize: 10, color: "#60706a", marginTop: 2 }}>
                    {t.questionCount} soal
                    {t.covered ? ` · tercakup di “${t.docTitle}”` : " · belum ada materinya"}
                  </div>
                </div>
                {!t.covered && onGenerateTopic && (
                  <button
                    onClick={() => handleGenerate(t.name)}
                    disabled={Boolean(pendingTopic)}
                    style={{
                      flexShrink: 0,
                      fontSize: 10,
                      fontWeight: 700,
                      color: pendingTopic ? "#9ca3af" : "#14532d",
                      backgroundColor: pendingTopic ? "#f1f4ef" : "#f0fdf4",
                      border: `1px solid ${pendingTopic ? "#dce1da" : "#bbf7d0"}`,
                      borderRadius: 6,
                      padding: "4px 8px",
                      cursor: pendingTopic ? "not-allowed" : "pointer"
                    }}
                  >
                    {pendingTopic === t.name ? "Membuat…" : "Buat materi"}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

export default ExamInsightPanel;
