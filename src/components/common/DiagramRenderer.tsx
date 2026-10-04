import React, { useState, useMemo, useEffect } from "react";
import { Sparkles, Globe, Compass, ArrowRight, Check, CheckCircle2, BookOpen, Layers } from "lucide-react";

export function extractTextFromNode(node: any): string {
  if (!node) return "";
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractTextFromNode).join("");
  if (node.props?.children) return extractTextFromNode(node.props.children);
  return "";
}

export function isAsciiDiagramText(text: string): boolean {
  if (!text) return false;
  const upper = text.toUpperCase();
  if (upper.includes("ARAH PERUBAHAN") || upper.includes("PETA SUMBU")) return true;
  if ((upper.includes("SIKLUS") || upper.includes("CYCLICAL")) && (upper.includes("LINIER") || upper.includes("LINEAR"))) return true;
  if ((upper.includes("LAHIR") || upper.includes("BANGKIT") || upper.includes("FASE 1")) && (upper.includes("KEMUNDURAN") || upper.includes("RUNTUH") || upper.includes("PUNCAK") || upper.includes("TUMBUH"))) return true;
  if (upper.includes("POHON ELIMINASI") || upper.includes("POHON KEPUTUSAN")) return true;
  if (upper.includes("CULTURAL LAG") || (upper.includes("BUDAYA MATERIAL") && upper.includes("BUDAYA IMATERIAL"))) return true;
  if (/[┌└├│─┬┴┼]|\+[-=]{2,}|\/\\|\\\/|\[Lahir/.test(text)) return true;
  return false;
}

export function normalizeDiagramsInMarkdown(md: string): string {
  if (!md) return "";
  const lines = md.split("\n");
  const result: string[] = [];
  let inCode = false;
  let inAsciiBlock = false;
  let asciiBuffer: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().startsWith("```")) {
      if (inAsciiBlock) {
        result.push("```");
        result.push(...asciiBuffer);
        result.push("```");
        asciiBuffer = [];
        inAsciiBlock = false;
      }
      inCode = !inCode;
      result.push(line);
      continue;
    }

    if (inCode) {
      result.push(line);
      continue;
    }

    const isDiagramLine = /[┌└├│─┬┴┼]|\+[-=]{2,}|\/\\|\\\/|\[Lahir|ARAH PERUBAHAN|PENGGERAK SISTEM/.test(line);
    if (isDiagramLine) {
      inAsciiBlock = true;
      asciiBuffer.push(line);
    } else {
      if (inAsciiBlock) {
        if (line.trim() === "" && i + 1 < lines.length && (/[┌└├│─┬┴┼]|\+[-=]{2,}/.test(lines[i + 1]) || lines[i + 1].includes("SIKLUS"))) {
          asciiBuffer.push(line);
        } else {
          result.push("```");
          result.push(...asciiBuffer);
          result.push("```");
          asciiBuffer = [];
          inAsciiBlock = false;
          result.push(line);
        }
      } else {
        result.push(line);
      }
    }
  }

  if (inAsciiBlock) {
    result.push("```");
    result.push(...asciiBuffer);
    result.push("```");
  }

  return result.join("\n");
}

// Interactive Visual Diagram & Flow Renderer for Academic Summaries
export function renderVisualDiagramOrPre(children: any) {
  const text = extractTextFromNode(children).trim();
  const upper = text.toUpperCase();

  // Pattern 1: Peta Sumbu Teori (Siklus vs Linier & Konflik vs Fungsional)
  if (
    (upper.includes("ARAH PERUBAHAN") || upper.includes("TEORI PERUBAHAN") || upper.includes("PETA") || upper.includes("SUMBU") || upper.includes("PENGGERAK SISTEM")) &&
    upper.includes("SIKLUS") &&
    (upper.includes("LINIER") || upper.includes("LINEAR"))
  ) {
    return (
      <div className="visual-diagram-card" style={{ margin: "18px 0", padding: "20px 22px", backgroundColor: "#f8faf6", border: "1px solid #d4ded2", borderRadius: 14, boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
        <div style={{ fontSize: 10.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: "1.2px", color: "#4b6623", fontFamily: "'DM Mono', monospace", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
          <span>🗺️ Peta Dua Sumbu Utama Teori Perubahan Sosial</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
          {/* Sumbu 1: Arah Gerak */}
          <div style={{ backgroundColor: "#ffffff", border: "1px solid #dde5d9", borderRadius: 12, padding: "16px" }}>
            <div style={{ fontSize: 10.5, fontWeight: 800, color: "#6f7975", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 12, fontFamily: "'DM Mono', monospace" }}>
              Sumbu 1: Pola Arah Gerak
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "11px 13px", backgroundColor: "#fbf6e8", border: "1px solid #fae8b8", borderRadius: 9 }}>
                <span style={{ fontSize: 18, lineHeight: 1 }}>↻</span>
                <div>
                  <strong style={{ fontSize: 13, color: "#92400e", display: "block" }}>1. Teori Siklus (Cyclical)</strong>
                  <span style={{ fontSize: 11.5, color: "#78350f", lineHeight: 1.45, display: "block", marginTop: 2 }}>Pola melingkar berulang tanpa ujung pangkal mutlak; menolak kemajuan mutlak (Spengler, Toynbee, Sorokin).</span>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "11px 13px", backgroundColor: "#edf7ed", border: "1px solid #c8e6c9", borderRadius: 9 }}>
                <span style={{ fontSize: 18, lineHeight: 1 }}>➔</span>
                <div>
                  <strong style={{ fontSize: 13, color: "#1b5e20", display: "block" }}>2. Teori Linier / Evolusi</strong>
                  <span style={{ fontSize: 11.5, color: "#2e7d32", lineHeight: 1.45, display: "block", marginTop: 2 }}>Gerak maju satu arah secara kumulatif & permanen dari primitif ke modern (Comte, Spencer).</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sumbu 2: Penggerak Sistem */}
          <div style={{ backgroundColor: "#ffffff", border: "1px solid #dde5d9", borderRadius: 12, padding: "16px" }}>
            <div style={{ fontSize: 10.5, fontWeight: 800, color: "#6f7975", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 12, fontFamily: "'DM Mono', monospace" }}>
              Sumbu 2: Mekanisme Penggerak
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "11px 13px", backgroundColor: "#fdf2f2", border: "1px solid #fecaca", borderRadius: 9 }}>
                <span style={{ fontSize: 18, lineHeight: 1 }}>⚔️</span>
                <div>
                  <strong style={{ fontSize: 13, color: "#991b1b", display: "block" }}>3. Teori Konflik</strong>
                  <span style={{ fontSize: 11.5, color: "#7f1d1d", lineHeight: 1.45, display: "block", marginTop: 2 }}>Bentrokan kepentingan struktural (alat modal Marx vs wewenang hierarki Dahrendorf).</span>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "11px 13px", backgroundColor: "#f1f8e9", border: "1px solid #dcedc8", borderRadius: 9 }}>
                <span style={{ fontSize: 18, lineHeight: 1 }}>⚖️</span>
                <div>
                  <strong style={{ fontSize: 13, color: "#33691e", display: "block" }}>4. Teori Fungsionalis</strong>
                  <span style={{ fontSize: 11.5, color: "#33691e", lineHeight: 1.45, display: "block", marginTop: 2 }}>Organisme terpadu menjaga keseimbangan dinamis / ekuilibrium; adaptasi gradual (Parsons, Ogburn, Merton).</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Pattern 2: Flow Siklus 4 Fase (Cycle Step Flow)
  if (
    (upper.includes("LAHIR") || upper.includes("BANGKIT") || upper.includes("FASE 1") || upper.includes("[LAHIR")) &&
    (upper.includes("KEMUNDURAN") || upper.includes("KEJAYAAN") || upper.includes("PUNCAK") || upper.includes("RUNTUH") || upper.includes("TUMBUH"))
  ) {
    return (
      <div className="visual-diagram-card" style={{ margin: "18px 0", padding: "18px 22px", backgroundColor: "#fffdf5", border: "1px solid #fde68a", borderRadius: 14, boxShadow: "0 4px 18px rgba(0,0,0,0.03)" }}>
        <div style={{ fontSize: 10.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", color: "#b45309", fontFamily: "'DM Mono', monospace", marginBottom: 12 }}>
          🔄 Alur Melingkar Teori Siklus (Tanpa Garis Akhir Mutlak)
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
          {[
            { step: "Fase 1", title: "Lahir / Bangkit", sub: "Kekuatan perintis baru", bg: "#fef3c7", border: "#fde68a", color: "#92400e" },
            { step: "Fase 2", title: "Tumbuh / Puncak", sub: "Ekspansi & kematangan", bg: "#dcfce7", border: "#bbf7d0", color: "#166534" },
            { step: "Fase 3", title: "Kejayaan Emas", sub: "Stabilitas kemakmuran", bg: "#e0e7ff", border: "#c7d2fe", color: "#3730a3" },
            { step: "Fase 4", title: "Kemunduran / Runtuh", sub: "Elit gagal adaptasi", bg: "#fee2e2", border: "#fecaca", color: "#991b1b" }
          ].map((item, idx) => (
            <React.Fragment key={idx}>
              <div style={{ flex: "1 1 125px", padding: "11px 14px", backgroundColor: item.bg, border: `1px solid ${item.border}`, borderRadius: 10, textAlign: "center" }}>
                <div style={{ fontSize: 9.5, fontWeight: 800, textTransform: "uppercase", color: item.color, opacity: 0.8, fontFamily: "'DM Mono', monospace" }}>{item.step}</div>
                <strong style={{ fontSize: 13, color: item.color, display: "block", marginTop: 3 }}>{item.title}</strong>
                <span style={{ fontSize: 11, color: item.color, opacity: 0.85, display: "block", marginTop: 2 }}>{item.sub}</span>
              </div>
              {idx < 3 && <span style={{ fontSize: 16, color: "#b45309", fontWeight: 800, padding: "0 2px" }}>➔</span>}
            </React.Fragment>
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: 12, fontSize: 11.5, color: "#92400e", fontWeight: 600 }}>
          ↺ Keruntuhan fase 4 menjadi bibit kebangkitan fase 1 baru bagi peradaban berikutnya.
        </div>
      </div>
    );
  }

  // Pattern 3: Pohon Keputusan Ujian (Decision Tree)
  if (upper.includes("ELIMINASI") || upper.includes("POHON KEPUTUSAN") || (upper.includes("KATA KUNCI") && (upper.includes("SIKLUS") || upper.includes("LINIER")))) {
    return (
      <div className="visual-diagram-card" style={{ margin: "18px 0", padding: "18px 22px", backgroundColor: "#f8f9fa", border: "1px solid #dde1da", borderRadius: 14 }}>
        <div style={{ fontSize: 10.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", color: "#18221f", fontFamily: "'DM Mono', monospace", marginBottom: 12 }}>
          ⚡ Pohon Eliminasi Cepat Soal Ujian
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", backgroundColor: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8 }}>
            <span style={{ fontSize: 12.5, color: "#78350f" }}>Kata kunci: <em>"kembali ke masa lampau"</em> / <em>"pola berulang"</em> / <em>"tren surut lalu bangkit"</em></span>
            <span style={{ fontSize: 12, fontWeight: 800, color: "#92400e", backgroundColor: "#fef3c7", padding: "4px 10px", borderRadius: 6 }}>➜ TEORI SIKLUS</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", backgroundColor: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 8 }}>
            <span style={{ fontSize: 12.5, color: "#065f46" }}>Kata kunci: <em>"tahapan maju permanen"</em> / <em>"tidak kembali ke titik awal"</em> / <em>"Comte / Spencer"</em></span>
            <span style={{ fontSize: 12, fontWeight: 800, color: "#065f46", backgroundColor: "#d1fae5", padding: "4px 10px", borderRadius: 6 }}>➜ TEORI LINIER</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8 }}>
            <span style={{ fontSize: 12.5, color: "#7f1d1d" }}>Kata kunci: <em>"friksi dua kelompok"</em> / <em>"upah & modal (Marx)"</em> / <em>"wewenang & jabatan (Dahrendorf)"</em></span>
            <span style={{ fontSize: 12, fontWeight: 800, color: "#991b1b", backgroundColor: "#fee2e2", padding: "4px 10px", borderRadius: 6 }}>➜ TEORI KONFLIK</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8 }}>
            <span style={{ fontSize: 12.5, color: "#14532d" }}>Kata kunci: <em>"keseimbangan sistem (AGIL)"</em> / <em>"teknologi mendahului aturan (Cultural Lag)"</em></span>
            <span style={{ fontSize: 12, fontWeight: 800, color: "#166534", backgroundColor: "#dcfce7", padding: "4px 10px", borderRadius: 6 }}>➜ TEORI FUNGSIONAL</span>
          </div>
        </div>
      </div>
    );
  }

  // Pattern 4: Cultural Lag Flow
  if (upper.includes("BUDAYA MATERIAL") && (upper.includes("BUDAYA IMATERIAL") || upper.includes("CULTURAL LAG"))) {
    return (
      <div className="visual-diagram-card" style={{ margin: "18px 0", padding: "18px 22px", backgroundColor: "#fbfcf9", border: "1px solid #dce1da", borderRadius: 14 }}>
        <div style={{ fontSize: 10.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", color: "#4b6623", fontFamily: "'DM Mono', monospace", marginBottom: 12 }}>
          ⚡ Dinamika Cultural Lag (William F. Ogburn)
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 12, alignItems: "center" }}>
          <div style={{ padding: "14px", backgroundColor: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: "#1d4ed8", textTransform: "uppercase" }}>Budaya Material</div>
            <strong style={{ fontSize: 13.5, color: "#1e40af", display: "block", marginTop: 2 }}>Inovasi Teknologi Fisik</strong>
            <span style={{ fontSize: 11.5, color: "#2563eb", display: "block", marginTop: 4 }}>🚀 Melaju Kilat & Cepat (Fintech, Gawai, AI)</span>
          </div>

          <div style={{ textAlign: "center", padding: "0 8px" }}>
            <span style={{ fontSize: 22 }}>⚡</span>
            <div style={{ fontSize: 9.5, fontWeight: 800, color: "#dc2626", textTransform: "uppercase", marginTop: 2 }}>Kesenjangan</div>
          </div>

          <div style={{ padding: "14px", backgroundColor: "#fef3c7", border: "1px solid #fde68a", borderRadius: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: "#b45309", textTransform: "uppercase" }}>Budaya Imaterial</div>
            <strong style={{ fontSize: 13.5, color: "#92400e", display: "block", marginTop: 2 }}>Regulasi & Norma Sosial</strong>
            <span style={{ fontSize: 11.5, color: "#b45309", display: "block", marginTop: 4 }}>🐢 Tertinggal / Adaptasi Lambat</span>
          </div>
        </div>
        <div style={{ marginTop: 12, padding: "10px 14px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: 9, fontSize: 12, color: "#991b1b" }}>
          <strong>Akibat:</strong> Menimbulkan <em>Cultural Lag</em> berupa disorganisasi sosial, kejahatan siber baru, dan anomi sebelum regulasi resmi terbit.
        </div>
      </div>
    );
  }

  // Pattern 5: Universal Sequential Flow / Pipeline (e.g. A > B > C or A ➔ B ➔ C)
  const isArrowPipeline = /(?:[➔➜→>]|-->|==>)/.test(text) && !/[┌└├│]/.test(text);
  if (isArrowPipeline) {
    const rawSegments = text
      .split(/\s*(?:[➔➜→>]|-->|==>)\s*/)
      .map(s => s.replace(/[┌└├│─┬┴┼+|=]+/g, " ").trim())
      .filter(s => s.length > 1);

    if (rawSegments.length >= 2 && rawSegments.length <= 6) {
      return (
        <div className="visual-diagram-card" style={{ margin: "18px 0", padding: "18px 22px", backgroundColor: "#f8faf6", border: "1px solid #dce2da", borderRadius: 14, boxShadow: "0 4px 18px rgba(0,0,0,0.03)" }}>
          <div style={{ fontSize: 10.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", color: "#566b36", fontFamily: "'DM Mono', monospace", marginBottom: 12 }}>
            ➔ Alur Transformasi & Tahapan Konsep
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {rawSegments.map((item, idx) => (
              <React.Fragment key={idx}>
                <div style={{ flex: "1 1 140px", padding: "12px 14px", backgroundColor: "#ffffff", border: "1px solid #dce2da", borderRadius: 10, textAlign: "center", boxShadow: "0 2px 6px rgba(0,0,0,0.02)" }}>
                  <div style={{ fontSize: 9.5, fontWeight: 800, textTransform: "uppercase", color: "#566b36", fontFamily: "'DM Mono', monospace" }}>Tahap 0{idx + 1}</div>
                  <strong style={{ fontSize: 13, color: "#18211e", display: "block", marginTop: 4 }}>{item}</strong>
                </div>
                {idx < rawSegments.length - 1 && <span style={{ fontSize: 16, color: "#779f2f", fontWeight: 800, padding: "0 2px" }}>➔</span>}
              </React.Fragment>
            ))}
          </div>
        </div>
      );
    }
  }

  // Pattern 6: Universal Dual Comparison (e.g. A vs B or 2-sided concepts)
  const isComparison = (upper.includes(" VS ") || upper.includes(" VERSUS ") || (upper.includes("1.") && upper.includes("2.") && upper.includes("SUMBU"))) && !/[┌└├│]/.test(text);
  if (isComparison) {
    const parts = text.split(/\s*(?:vs|versus)\s*/i).map(s => s.trim()).filter(Boolean);
    if (parts.length === 2) {
      return (
        <div className="visual-diagram-card" style={{ margin: "18px 0", padding: "18px 22px", backgroundColor: "#f8faf6", border: "1px solid #dce2da", borderRadius: 14 }}>
          <div style={{ fontSize: 10.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", color: "#566b36", fontFamily: "'DM Mono', monospace", marginBottom: 12 }}>
            ⚖️ Komparasi Dua Konsep Berseberangan
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ padding: "14px 16px", backgroundColor: "#fbf6e8", border: "1px solid #fae8b8", borderRadius: 10 }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: "#92400e", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>Kategori A</span>
              <strong style={{ fontSize: 13.5, color: "#78350f", display: "block", marginTop: 4 }}>{parts[0]}</strong>
            </div>
            <div style={{ padding: "14px 16px", backgroundColor: "#edf7ed", border: "1px solid #c8e6c9", borderRadius: 10 }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: "#1b5e20", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>Kategori B</span>
              <strong style={{ fontSize: 13.5, color: "#2e7d32", display: "block", marginTop: 4 }}>{parts[1]}</strong>
            </div>
          </div>
        </div>
      );
    }
  }

  // Pattern 7: Generic Hierarchical Diagram / ASCII Flow Nodes (Applies to ALL subjects)
  const hasBoxChars = /[┌└├│─┬┴┼]|\+[-=]{2,}|-->|==>/.test(text);
  if (hasBoxChars) {
    const rawLines = text.split("\n");
    const cleanNodes = rawLines
      .map(l => l.replace(/[┌└├│─┬┴┼+|=]+/g, " ").trim())
      .filter(l => l.length > 1);

    if (cleanNodes.length > 0) {
      return (
        <div className="visual-diagram-card" style={{ margin: "18px 0", padding: "18px 22px", backgroundColor: "#f8f9f6", border: "1px solid #dce2da", borderRadius: 14, boxShadow: "0 4px 18px rgba(0,0,0,0.03)" }}>
          <div style={{ fontSize: 10.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", color: "#566b36", fontFamily: "'DM Mono', monospace", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
            <span>🗺️ Bagan Alur & Peta Hubungan Konsep</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {cleanNodes.map((nodeText, nIdx) => (
              <div key={nIdx} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", backgroundColor: "#ffffff", border: "1px solid #e1e7de", borderRadius: 9, fontSize: 13, color: "#18211e" }}>
                <span style={{ width: 22, height: 22, borderRadius: 6, backgroundColor: "#edf4e3", color: "#465f33", display: "grid", placeItems: "center", fontSize: 11, fontWeight: 800, fontFamily: "'DM Mono', monospace", flexShrink: 0 }}>
                  {nIdx + 1}
                </span>
                <span style={{ fontWeight: 600 }}>{nodeText}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
  }

  // Default Monospace pre fallback
  return (
    <pre
      style={{
        backgroundColor: "#f6f8f5",
        border: "1px solid #d4ded2",
        borderLeft: "3px solid #65a30d",
        borderRadius: 8,
        padding: "12px 14px",
        fontFamily: "'DM Mono', monospace",
        fontSize: 11.5,
        lineHeight: 1.45,
        color: "#18221f",
        overflowX: "auto",
        whiteSpace: "pre",
        margin: "14px 0"
      }}
    >
      {children}
    </pre>
  );
}

// Interactive Web Search Progress Visualizer with Site Logos, Actions, and Dynamic Animation
export function WebSearchProgressView({
  topic,
  subject,
  subtitle
}: {
  topic: string;
  subject?: string;
  subtitle?: string;
}) {
  const [activeStep, setActiveStep] = useState(0);
  const [progress, setProgress] = useState(18);

  const sources = useMemo(
    () => [
      {
        id: "wikipedia",
        name: "Wikipedia Indonesia",
        domain: "id.wikipedia.org",
        category: "Ensiklopedi Bebas",
        action: "Mencari definisi baku, taksonomi teori, dan konteks sejarah",
        color: "#2b4c7e",
        bg: "#edf4fc",
        badge: "Konsep Baku",
        icon: (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <rect width="24" height="24" rx="6" fill="#2b4c7e" />
            <path d="M6 16.5L9.2 7.5H10.8L12.5 12L14.2 7.5H15.8L18 16.5H16.4L15 11L13.5 15.5H12L10.5 11L9.1 16.5H6Z" fill="#ffffff" />
          </svg>
        )
      },
      {
        id: "ruangguru",
        name: "Ruangguru Silabus",
        domain: "ruangguru.com/blog",
        category: "Kurikulum Sekolah & SMA",
        action: "Membedah kurikulum ajar, analogi ramah siswa, dan contoh kasus riil",
        color: "#0284c7",
        bg: "#e0f2fe",
        badge: "Silabus Resmi",
        icon: (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <rect width="24" height="24" rx="6" fill="#0284c7" />
            <path d="M12 5L4 9L12 13L20 9L12 5Z" stroke="#ffffff" strokeWidth="2" strokeLinejoin="round" />
            <path d="M6 11V16C6 17.5 8.7 19 12 19C15.3 19 18 17.5 18 16V11" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )
      },
      {
        id: "wikibooks",
        name: "Wikibuku Indonesia",
        domain: "id.wikibooks.org",
        category: "Buku Teks Terbuka",
        action: "Mengambil struktur bab ajar, taksonomi materi, dan kaidah esensial",
        color: "#166534",
        bg: "#f0fdf4",
        badge: "Buku Teks",
        icon: (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <rect width="24" height="24" rx="6" fill="#166534" />
            <path d="M6 6.5C6 5.67 6.67 5 7.5 5H11V19H7.5C6.67 19 6 18.33 6 17.5V6.5Z" fill="#ffffff" fillOpacity="0.85" />
            <path d="M18 6.5C18 5.67 17.33 5 16.5 5H13V19H16.5C17.33 19 18 18.33 18 17.5V6.5Z" fill="#ffffff" />
          </svg>
        )
      },
      {
        id: "crossref",
        name: "CrossRef Academic Research",
        domain: "api.crossref.org",
        category: "Jurnal Riset Kurikulum",
        action: "Memvalidasi referensi akademik resmi dan metodologi pembelajaran",
        color: "#92400e",
        bg: "#fef3c7",
        badge: "Jurnal Riset",
        icon: (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <rect width="24" height="24" rx="6" fill="#92400e" />
            <circle cx="12" cy="12" r="5.5" stroke="#ffffff" strokeWidth="2" strokeDasharray="2 2" />
            <path d="M12 9V15M9 12H15" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )
      },
      {
        id: "synthesis",
        name: "Tanka Anti-Slop Engine",
        domain: "tanka.local / 9router",
        category: "Penyusunan Catatan Belajar",
        action: "Merapikan catatan konsep, rumus penting, dan latihan soal",
        color: "#3f6212",
        bg: "#f7fee7",
        badge: "Catatan Siap",
        icon: (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <rect width="24" height="24" rx="6" fill="#18221f" />
            <path d="M7 12L10.5 15.5L17 8.5" stroke="#c8f064" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )
      }
    ],
    []
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => {
        if (prev < sources.length - 1) {
          const next = prev + 1;
          setProgress(Math.min(94, 20 + next * 18));
          return next;
        }
        return prev;
      });
    }, 1500);
    return () => clearInterval(timer);
  }, [sources.length]);

  const currentSource = sources[activeStep] || sources[0];

  return (
    <div
      style={{
        backgroundColor: "#fbfbfa",
        border: "1px solid #dce2da",
        borderRadius: 14,
        padding: "20px 18px",
        margin: "8px 0"
      }}
    >
      {/* Header with animated radar and topic */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              backgroundColor: "#edf4e3",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid #d7e5c5"
            }}
          >
            <Globe size={15} color="#4b6623" style={{ animation: "spinSlow 12s linear infinite" }} />
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", color: "#566b36", fontFamily: "'DM Mono', monospace" }}>
              PENELUSURAN REFERENSI LIVE
            </div>
            <div style={{ fontSize: 14.5, fontWeight: 800, color: "#18211e" }}>
              {topic}
            </div>
          </div>
        </div>
        {subject && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              backgroundColor: "#ffffff",
              border: "1px solid #dce1da",
              color: "#4b6623",
              padding: "2px 8px",
              borderRadius: 6,
              fontFamily: "'DM Mono', monospace"
            }}
          >
            {subject}
          </span>
        )}
      </div>

      {/* Dynamic Action Highlight Banner */}
      <div
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid #c2e28f",
          borderRadius: 10,
          padding: "10px 12px",
          marginBottom: 14,
          display: "flex",
          alignItems: "center",
          gap: 10,
          boxShadow: "0 2px 8px rgba(119, 159, 47, 0.08)"
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            backgroundColor: "#779f2f",
            flexShrink: 0,
            boxShadow: "0 0 0 3px rgba(119, 159, 47, 0.25)"
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#22370c", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span>Sedang Memindai:</span>
            <span style={{ color: currentSource.color, textDecoration: "underline", textUnderlineOffset: 2 }}>
              {currentSource.name} ({currentSource.domain})
            </span>
          </div>
          <div style={{ fontSize: 12, color: "#45544e", marginTop: 2, lineHeight: 1.35 }}>
            {currentSource.action}
          </div>
        </div>
      </div>

      {/* Target Sources Cards List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 14 }}>
        {sources.map((s, idx) => {
          const isActive = idx === activeStep;
          const isDone = idx < activeStep;
          const isPending = idx > activeStep;

          return (
            <div
              key={s.id}
              className={`search-source-card ${isActive ? "active" : ""}`}
              style={{
                backgroundColor: isActive ? "#ffffff" : isDone ? "#fafcf8" : "#f4f6f1",
                border: `1px solid ${isActive ? "#779f2f" : isDone ? "#d7e5c5" : "#e4e8e1"}`,
                borderRadius: 9,
                padding: "8px 12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                opacity: isPending ? 0.65 : 1
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                <div style={{ flexShrink: 0 }}>{s.icon}</div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <strong style={{ fontSize: 12.5, color: "#18211e", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {s.name}
                    </strong>
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        backgroundColor: s.bg,
                        color: s.color,
                        padding: "1px 5px",
                        borderRadius: 4,
                        fontFamily: "'DM Mono', monospace"
                      }}
                    >
                      {s.badge}
                    </span>
                  </div>
                  <div style={{ fontSize: 10.5, color: "#78857f", fontFamily: "'DM Mono', monospace" }}>
                    {s.domain}
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div style={{ flexShrink: 0 }}>
                {isDone ? (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 10,
                      fontWeight: 700,
                      color: "#4b6623",
                      backgroundColor: "#edf4e3",
                      border: "1px solid #d7e5c5",
                      padding: "3px 7px",
                      borderRadius: 999
                    }}
                  >
                    <CheckCircle2 size={11} color="#4b6623" />
                    <span>Terhubung</span>
                  </span>
                ) : isActive ? (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 10,
                      fontWeight: 800,
                      color: "#18221f",
                      backgroundColor: "#c8f064",
                      padding: "3px 8px",
                      borderRadius: 999,
                      boxShadow: "0 0 8px rgba(200, 240, 100, 0.4)"
                    }}
                  >
                    <Sparkles size={10} style={{ animation: "spin 1.5s linear infinite" }} />
                    <span>Memindai...</span>
                  </span>
                ) : (
                  <span style={{ fontSize: 10, color: "#8a9691", fontFamily: "'DM Mono', monospace" }}>
                    Menunggu
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Terminal Log Line */}
      <div
        style={{
          backgroundColor: "#18221f",
          color: "#c8f064",
          borderRadius: 8,
          padding: "7px 11px",
          fontFamily: "'DM Mono', monospace",
          fontSize: 10.5,
          display: "flex",
          alignItems: "center",
          gap: 6,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap"
        }}
      >
        <span style={{ color: "#779f2f" }}>&gt;</span>
        <span>
          [CARI] {currentSource.name} &rarr; {currentSource.category}
        </span>
      </div>

      {/* Animated Linear Progress Bar */}
      <div style={{ marginTop: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#6f7975", marginBottom: 4, fontFamily: "'DM Mono', monospace" }}>
          <span>PROGRES PENGUMPULAN MATERI</span>
          <span>{progress}%</span>
        </div>
        <div style={{ width: "100%", height: 5, backgroundColor: "#e2e6de", borderRadius: 999, overflow: "hidden" }}>
          <div
            style={{
              width: `${progress}%`,
              height: "100%",
              backgroundColor: "#779f2f",
              borderRadius: 999,
              transition: "width 0.4s cubic-bezier(0.16, 1, 0.3, 1)"
            }}
          />
        </div>
      </div>
    </div>
  );
}

// 💫 REUSABLE LIVE AI PROCESS VISUALIZER WITH STEPS, PROGRESS, AND STUDY TIPS
interface AIProcessStep {
  label: string;
  detail: string;
}

interface AIProcessLoaderProps {
  title: string;
  subtitle: string;
  badge?: string;
  steps: AIProcessStep[];
  tips?: string[];
  accentColor?: string;
}

