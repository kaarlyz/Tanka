import { useState } from "react";
import { Target, Trash2, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";
import { MistakeItem, ActiveTab } from "../../types";
import { MathView, getSubjectBadge } from "../common/MathView";

interface MistakesTabProps {
  mistakes: MistakeItem[];
  activeDocId: string | null;
  activeDocTitle: string;
  onResolveMistake: (id: string) => Promise<void>;
  onClearMistakes: () => Promise<void>;
  onStartDrill: (filtered: MistakeItem[]) => void;
  setActiveTab: (t: ActiveTab) => void;
}

export function MistakesTab({
  mistakes,
  activeDocId,
  activeDocTitle,
  onResolveMistake,
  onClearMistakes,
  onStartDrill,
  setActiveTab
}: MistakesTabProps) {
  const [filterScope, setFilterScope] = useState<"current" | "all">("current");

  const displayedMistakes = filterScope === "current" && activeDocId
    ? mistakes.filter((m) => m.docId === activeDocId)
    : mistakes;

  return (
    <div className="tab-pane-animate" style={{ maxWidth: 960, margin: "0 auto", paddingBottom: 48 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 22, flexWrap: "wrap" }}>
        <div>
          <span style={{ fontSize: 10.5, fontWeight: 800, color: "#566b36", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Ulangi · Pahami · Tuntaskan
          </span>
          <h1 style={{ margin: "4px 0 6px", fontSize: 24, fontWeight: 800, color: "#18211e" }}>
            Bank Kesalahan
          </h1>
          <p style={{ margin: 0, color: "#6f7975", fontSize: 13 }}>
            Kumpulan butir soal yang pernah keliru, lengkap dengan penyebab dan langkah perbaikan.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {activeDocId && (
            <div style={{ display: "inline-flex", backgroundColor: "#ffffff", padding: 3, borderRadius: 8, border: "1px solid #dce2da" }}>
              <button
                type="button"
                onClick={() => setFilterScope("current")}
                style={{
                  backgroundColor: filterScope === "current" ? "#19231f" : "transparent",
                  color: filterScope === "current" ? "#c8f064" : "#5f6b66",
                  border: "none",
                  borderRadius: 6,
                  padding: "5px 10px",
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                Modul Ini ({mistakes.filter((m) => m.docId === activeDocId).length})
              </button>
              <button
                type="button"
                onClick={() => setFilterScope("all")}
                style={{
                  backgroundColor: filterScope === "all" ? "#19231f" : "transparent",
                  color: filterScope === "all" ? "#c8f064" : "#5f6b66",
                  border: "none",
                  borderRadius: 6,
                  padding: "5px 10px",
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                Semua Modul ({mistakes.length})
              </button>
            </div>
          )}

          {displayedMistakes.length > 0 && (
            <>
              <button
                type="button"
                onClick={() => onStartDrill(displayedMistakes)}
                style={{
                  backgroundColor: "#c8f064",
                  color: "#18211e",
                  border: "none",
                  borderRadius: 8,
                  padding: "7px 14px",
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 5
                }}
              >
                <Target size={14} />
                <span>Drill ({displayedMistakes.length})</span>
              </button>

              <button
                type="button"
                onClick={onClearMistakes}
                style={{
                  backgroundColor: "#fafbf8",
                  color: "#991b1b",
                  border: "1px solid #fecaca",
                  borderRadius: 8,
                  padding: "7px 12px",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 5
                }}
              >
                <Trash2 size={13} />
                <span>Bersihkan</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Empty State */}
      {displayedMistakes.length === 0 ? (
        <div
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #dde1da",
            borderRadius: 14,
            padding: "40px 20px",
            textAlign: "center"
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
          <h3 style={{ fontSize: 17, fontWeight: 800, color: "#17201d", margin: "0 0 6px" }}>
            Tidak Ada Catatan Kesalahan
          </h3>
          <p style={{ fontSize: 13, color: "#6f7975", margin: "0 0 18px" }}>
            {filterScope === "current" && activeDocId
              ? "Semua soal pada modul ini berhasil Anda selesaikan dengan benar!"
              : "Jawaban keliru dari Latihan Soal akan otomatis tercatat di sini."}
          </p>
          <button
            type="button"
            onClick={() => setActiveTab("quiz")}
            style={{
              padding: "9px 18px",
              borderRadius: 8,
              backgroundColor: "#18211e",
              color: "#c8f064",
              border: "none",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6
            }}
          >
            <span>Mulai Latihan Soal</span>
            <ArrowRight size={14} />
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {displayedMistakes.map((m) => {
            const badge = getSubjectBadge(m.docTitle || activeDocTitle || "Modul");
            return (
              <div
                key={m.id}
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #dde1da",
                  borderRadius: 12,
                  padding: "18px 20px",
                  boxShadow: "0 4px 18px rgba(0,0,0,0.03)"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        backgroundColor: badge.bg,
                        color: badge.color,
                        border: `1px solid ${badge.border}`,
                        padding: "2px 8px",
                        borderRadius: 5,
                        fontSize: 10.5,
                        fontWeight: 800
                      }}
                    >
                      {badge.label}
                    </span>
                    <span style={{ fontSize: 12, color: "#6b7280" }}>
                      {m.docTitle || activeDocTitle}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onResolveMistake(m.id)}
                    style={{
                      background: "transparent",
                      border: "1px solid #dce2da",
                      color: "#166534",
                      borderRadius: 6,
                      padding: "4px 8px",
                      fontSize: 11.5,
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 4
                    }}
                  >
                    <CheckCircle2 size={12} />
                    <span>Tandai Sudah Paham</span>
                  </button>
                </div>

                {/* Question */}
                <div style={{ fontSize: 14.5, fontWeight: 700, color: "#18211e", marginBottom: 12, lineHeight: 1.5 }}>
                  <MathView text={m.question} />
                </div>

                {/* Answers Diff */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                  <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#991b1b" }}>
                    <strong>Pilihan Anda yang Keliru: </strong>
                    <div>
                      <MathView text={m.options?.[m.userAnswerIndex] || `Opsi ${m.userAnswerIndex + 1}`} />
                    </div>
                  </div>

                  <div style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#166534" }}>
                    <strong>Kunci Jawaban yang Benar: </strong>
                    <div>
                      <MathView text={m.options?.[m.correctIndex] || `Opsi ${m.correctIndex + 1}`} />
                    </div>
                  </div>
                </div>

                {/* Step / Explanation */}
                {m.explanation && (
                  <div style={{ fontSize: 12.5, color: "#4b5563", lineHeight: 1.5, marginBottom: 8 }}>
                    <strong>Langkah Pengerjaan: </strong>
                    <MathView text={m.explanation} />
                  </div>
                )}

                {/* Pitfall */}
                {m.pitfall && (
                  <div style={{ backgroundColor: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "8px 12px", display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12, color: "#854d0e" }}>
                    <AlertTriangle size={14} color="#ca8a04" style={{ flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <strong>Titik Rawan / Jebakan: </strong>
                      <MathView text={m.pitfall} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
