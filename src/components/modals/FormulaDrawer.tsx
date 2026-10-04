import React from "react";
import { Sparkles, Calculator, Download, Printer, RotateCw, X } from "lucide-react";
import { FormulaItem } from "../../types";
import { MathView } from "../common/MathView";

export interface FormulaDrawerProps {
  isFormulaDrawerOpen: boolean;
  setIsFormulaDrawerOpen: (val: boolean) => void;
  activeDocTitle: string;
  activeDocId: string | null;
  selectedModel: string;
  formulas: FormulaItem[];
  setFormulas: React.Dispatch<React.SetStateAction<FormulaItem[]>>;
  isLoadingFormulas: boolean;
  setIsLoadingFormulas: (val: boolean) => void;
  formulaFilter: string;
  setFormulaFilter: (val: string) => void;
  fetchOrExtractFormulas: () => void;
  downloadAsMarkdown: (filename: string, content: string) => void;
}

export function FormulaDrawer({
  isFormulaDrawerOpen,
  setIsFormulaDrawerOpen,
  activeDocTitle,
  activeDocId,
  selectedModel,
  formulas,
  setFormulas,
  isLoadingFormulas,
  setIsLoadingFormulas,
  formulaFilter,
  setFormulaFilter,
  fetchOrExtractFormulas,
  downloadAsMarkdown,
}: FormulaDrawerProps) {
  if (!isFormulaDrawerOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9998,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        backdropFilter: "blur(6px)",
        display: "flex",
        justifyContent: "flex-end"
      }}
      onClick={() => setIsFormulaDrawerOpen(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 480,
          height: "100%",
          backgroundColor: "#ffffff",
          borderLeft: "1px solid #dde1da",
          display: "flex",
          flexDirection: "column",
          boxShadow: "-8px 0 35px rgba(27, 39, 35, 0.1)",
          animation: "slideInRight 0.2s ease",
          overflowX: "hidden"
        }}
      >
        {/* Drawer Header */}
        <div style={{ padding: "18px 20px", borderBottom: "1px solid #dde1da", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Calculator size={18} color="#4b6623" />
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "#17201d", margin: 0 }}>
                Lembar Rumus Cepat
              </h3>
              <div style={{ fontSize: 11, color: "#6f7975", marginTop: 2 }}>
                {activeDocTitle || "Materi Aktif"}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {formulas.length > 0 && (
              <>
                <button
                  onClick={() => {
                    const md = `# Lembar Rumus: ${activeDocTitle || "Materi"}\n\n` +
                      formulas.map(f => `### ${f.name} (${f.category || "Umum"})\n\n${f.formula}\n\n**Keterangan**: ${f.meaning}\n`).join("\n---\n\n");
                    downloadAsMarkdown(`${(activeDocTitle || "rumus").toLowerCase().replace(/\s+/g, "_")}_rumus.md`, md);
                  }}
                  style={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #dce1da",
                    color: "#17201d",
                    borderRadius: 8,
                    padding: "5px 9px",
                    fontSize: 11.5,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 4
                  }}
                  title="Unduh seluruh rumus sebagai Markdown"
                >
                  <Download size={13} />
                  <span>Unduh .md</span>
                </button>
                <button
                  onClick={() => window.print()}
                  style={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #dce1da",
                    color: "#17201d",
                    borderRadius: 8,
                    padding: "5px 9px",
                    fontSize: 11.5,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 4
                  }}
                  title="Cetak atau simpan ke PDF"
                >
                  <Printer size={13} />
                  <span>Cetak</span>
                </button>
              </>
            )}
            <button
              onClick={() => setIsFormulaDrawerOpen(false)}
              style={{ background: "none", border: "none", color: "#6f7975", cursor: "pointer", padding: 4 }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Filter Search Input */}
        <div style={{ padding: "12px 20px", borderBottom: "1px solid #dde1da" }}>
          <input
            type="text"
            value={formulaFilter}
            onChange={(e) => setFormulaFilter(e.target.value)}
            placeholder="Cari rumus atau kata kunci (mis: kuadrat, diskriminan)..."
            style={{
              width: "100%",
              backgroundColor: "#fafbf8",
              border: "1px solid #dce1da",
              borderRadius: 8,
              padding: "8px 12px",
              fontSize: 12.5,
              color: "#17201d",
              outline: "none"
            }}
          />
        </div>

        {/* Formulas List */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px 48px", display: "flex", flexDirection: "column", gap: 14 }}>
          {isLoadingFormulas ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#4b6623" }}>
              <Sparkles size={24} style={{ margin: "0 auto 8px", animation: "spin 2s linear infinite" }} />
              <div style={{ fontSize: 13, fontWeight: 700 }}>Mengekstrak seluruh rumus akademik...</div>
            </div>
          ) : formulas.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "#6f7975" }}>
              <Calculator size={32} style={{ margin: "0 auto 10px", color: "#aeb9b4" }} />
              <div style={{ fontSize: 15, fontWeight: 700, color: "#17201d" }}>Belum Ada Rumus Terekstrak</div>
              <p style={{ fontSize: 12, marginTop: 4 }}>
                Klik tombol di bawah untuk meminta AI membedah seluruh rumus matematis dari dokumen ini.
              </p>
              <button
                onClick={fetchOrExtractFormulas}
                style={{
                  marginTop: 12,
                  backgroundColor: "#18221f",
                  color: "#c8f064",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 16px",
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                Ekstrak Rumus Sekarang
              </button>
            </div>
          ) : (
            formulas
              .filter((f) => !formulaFilter || f.name.toLowerCase().includes(formulaFilter.toLowerCase()) || (f.meaning && f.meaning.toLowerCase().includes(formulaFilter.toLowerCase())))
              .map((f, i) => (
                <div
                  key={i}
                  style={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #dde1da",
                    borderRadius: 12,
                    padding: "16px",
                    boxShadow: "0 4px 15px rgba(27, 39, 35, 0.04)"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 800, color: "#17201d" }}>
                      {f.name}
                    </span>
                    {f.category && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          color: "#22370c",
                          backgroundColor: "#eef8db",
                          border: "1px solid #c2e28f",
                          padding: "2px 6px",
                          borderRadius: 4,
                          fontFamily: "'DM Mono', monospace"
                        }}
                      >
                        {f.category}
                      </span>
                    )}
                  </div>

                  {/* Centered Formula Display */}
                  <div
                    className="no-scrollbar"
                    style={{
                      backgroundColor: "#1d2824",
                      border: "1px solid #34413c",
                      borderRadius: 8,
                      padding: "10px 14px",
                      textAlign: "center",
                      fontSize: 14,
                      color: "#e8eee9",
                      marginBottom: 8,
                      overflowX: "auto",
                      maxWidth: "100%",
                      WebkitOverflowScrolling: "touch",
                      wordBreak: "break-word",
                      overflowWrap: "anywhere",
                      whiteSpace: "normal",
                      lineHeight: "1.6"
                    }}
                  >
                    <MathView text={f.formula} />
                  </div>

                  {f.meaning && (
                    <div style={{ fontSize: 12, color: "#45544e", lineHeight: "1.5" }}>
                      <MathView text={f.meaning} />
                    </div>
                  )}
                </div>
              ))
          )}
        </div>

        {/* Drawer Footer */}
        <div style={{ padding: "14px 20px", borderTop: "1px solid #dde1da", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "#6f7975", fontFamily: "'DM Mono', monospace" }}>
            {formulas.length} rumus terekstrak
          </span>
          <button
            onClick={async () => {
              setFormulas([]);
              setIsLoadingFormulas(true);
              try {
                const aiRes = await fetch("/api/ai/extract-formulas", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ docId: activeDocId, model: selectedModel })
                });
                const aiData = await aiRes.json();
                if (aiData.success && aiData.formulas) {
                  setFormulas(aiData.formulas);
                }
              } finally {
                setIsLoadingFormulas(false);
              }
            }}
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #dce1da",
              color: "#17201d",
              borderRadius: 6,
              padding: "5px 10px",
              fontSize: 11.5,
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            <RotateCw size={12} /> Refresh Rumus
          </button>
        </div>
      </div>
    </div>
  );
}
