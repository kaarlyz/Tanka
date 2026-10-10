import React, { useState, useMemo, useEffect } from "react";
import { Sparkles, Globe, Compass, ArrowRight, Check, CheckCircle2, BookOpen, Layers } from "lucide-react";
import { MathView } from "./MathView";

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
  if (upper.includes("ROGERS") || (upper.includes("INNOVATOR") && upper.includes("EARLY ADOPTER") && upper.includes("LAGGARD"))) return true;
  if ((upper.includes("MEMANCAR") && upper.includes("MENJALAR") && upper.includes("MEMUSAT")) || (upper.includes("OGBURN") && (upper.includes("POLA") || upper.includes("SEBARAN")))) return true;
  if (/[┌└├│─┬┴┼]|\+[-=]{2,}|\/\\|\\\/|\[Lahir/.test(text)) return true;
  return false;
}

export function sanitizeMathMarkdown(md: string): string {
  if (!md) return "";

  let text = md.replace(/\r\n/g, "\n");

  const lines = text.split("\n");
  const processedLines: string[] = [];
  let inMultiLineMath = false;
  let currentIndent = "";

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Count $$ occurrences on this line
    const dollarMatches = line.match(/\$\$/g) || [];
    const dollarCount = dollarMatches.length;

    // 1. Single-line balanced block math ($$ ... $$) -> LEAVE UNTOUCHED
    if (dollarCount >= 2 && dollarCount % 2 === 0) {
      processedLines.push(line);
      continue;
    }

    // 2. Line has an odd number of $$ (opener or closer of multiline math block)
    if (dollarCount % 2 === 1) {
      if (!inMultiLineMath) {
        // OPENING multiline block
        inMultiLineMath = true;
        const indent = line.match(/^(\s*)/)?.[1] || "";
        currentIndent = indent;

        const trimmed = line.trim();
        if (trimmed === "$$") {
          processedLines.push(line);
        } else if (trimmed.startsWith("$$")) {
          // e.g. "   $$\begin{aligned}" -> "   $$" and "   \begin{aligned}"
          const content = line.replace(/^\s*\$\$\s*/, "");
          processedLines.push(indent + "$$");
          processedLines.push(indent + content);
        } else {
          // e.g. "Text $$"
          const parts = line.split("$$");
          processedLines.push(parts[0]);
          processedLines.push(indent + "$$");
          if (parts[1]?.trim()) processedLines.push(indent + parts[1].trim());
        }
      } else {
        // CLOSING multiline block
        inMultiLineMath = false;
        const indent = currentIndent || (line.match(/^(\s*)/)?.[1] || "");

        const trimmed = line.trim();
        if (trimmed === "$$") {
          processedLines.push(indent + "$$");
        } else if (trimmed.endsWith("$$")) {
          // e.g. "   \end{aligned}$$" -> "   \end{aligned}" and "   $$"
          const before = line.replace(/\s*\$\$\s*$/, "");
          processedLines.push(before);
          processedLines.push(indent + "$$");
        } else {
          const parts = line.split("$$");
          if (parts[0]?.trim()) processedLines.push(indent + parts[0].trim());
          processedLines.push(indent + "$$");
          if (parts[1]?.trim()) processedLines.push(indent + parts[1].trim());
        }
        currentIndent = "";
      }
      continue;
    }

    // 3. Safety: If inside multiline math and hit markdown heading, divider, or table, force-close math block
    if (inMultiLineMath && (line.trim().startsWith("#") || line.trim().startsWith("---") || line.trim().startsWith("|"))) {
      processedLines.push((currentIndent || "") + "$$");
      inMultiLineMath = false;
      currentIndent = "";
    }

    processedLines.push(line);
  }

  if (inMultiLineMath) {
    processedLines.push((currentIndent || "") + "$$");
  }

  let result = processedLines.join("\n");

  // Fix unmatched inline math: single unclosed $ on a line
  result = result.split("\n").map((l) => {
    if (l.includes("$$")) return l;
    const count = (l.match(/\$/g) || []).length;
    if (count % 2 === 1) {
      return l + "$";
    }
    return l;
  }).join("\n");

  return result;
}

export function normalizeDiagramsInMarkdown(rawMd: string): string {
  if (!rawMd) return "";
  const md = sanitizeMathMarkdown(rawMd);
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
      <div className="visual-diagram-card" style={{ margin: "16px 0", padding: "16px 18px", backgroundColor: "#f8faf6", border: "1px solid #d4ded2", borderRadius: 6, boxShadow: "none" }}>
        <div style={{ fontSize: 10.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", color: "#4b6623", fontFamily: "'DM Mono', monospace", marginBottom: 12 }}>
          Peta Dua Sumbu Utama Teori Perubahan Sosial
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
          {/* Sumbu 1: Arah Gerak */}
          <div style={{ backgroundColor: "#ffffff", border: "1px solid #dde5d9", borderRadius: 4, padding: "14px" }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: "#6f7975", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 10, fontFamily: "'DM Mono', monospace" }}>
              Sumbu 1: Pola Arah Gerak
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", backgroundColor: "#fbf6e8", border: "1px solid #fae8b8", borderRadius: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: "#92400e", fontFamily: "'DM Mono', monospace" }}>01</span>
                <div>
                  <strong style={{ fontSize: 13, color: "#92400e", display: "block" }}>Teori Siklus (Cyclical)</strong>
                  <span style={{ fontSize: 11.5, color: "#78350f", lineHeight: 1.45, display: "block", marginTop: 2 }}>Pola melingkar berulang tanpa ujung pangkal mutlak; menolak kemajuan mutlak (Spengler, Toynbee, Sorokin).</span>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", backgroundColor: "#edf7ed", border: "1px solid #c8e6c9", borderRadius: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: "#1b5e20", fontFamily: "'DM Mono', monospace" }}>02</span>
                <div>
                  <strong style={{ fontSize: 13, color: "#1b5e20", display: "block" }}>Teori Linier / Evolusi</strong>
                  <span style={{ fontSize: 11.5, color: "#2e7d32", lineHeight: 1.45, display: "block", marginTop: 2 }}>Gerak maju satu arah secara kumulatif & permanen dari primitif ke modern (Comte, Spencer).</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sumbu 2: Penggerak Sistem */}
          <div style={{ backgroundColor: "#ffffff", border: "1px solid #dde5d9", borderRadius: 4, padding: "14px" }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: "#6f7975", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 10, fontFamily: "'DM Mono', monospace" }}>
              Sumbu 2: Mekanisme Penggerak
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", backgroundColor: "#fdf2f2", border: "1px solid #fecaca", borderRadius: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: "#991b1b", fontFamily: "'DM Mono', monospace" }}>03</span>
                <div>
                  <strong style={{ fontSize: 13, color: "#991b1b", display: "block" }}>Teori Konflik</strong>
                  <span style={{ fontSize: 11.5, color: "#7f1d1d", lineHeight: 1.45, display: "block", marginTop: 2 }}>Bentrokan kepentingan struktural (alat modal Marx vs wewenang hierarki Dahrendorf).</span>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", backgroundColor: "#f1f8e9", border: "1px solid #dcedc8", borderRadius: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: "#33691e", fontFamily: "'DM Mono', monospace" }}>04</span>
                <div>
                  <strong style={{ fontSize: 13, color: "#33691e", display: "block" }}>Teori Fungsionalis</strong>
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
      <div className="visual-diagram-card" style={{ margin: "16px 0", padding: "16px 18px", backgroundColor: "#fffdf5", border: "1px solid #fde68a", borderRadius: 6, boxShadow: "none" }}>
        <div style={{ fontSize: 10.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", color: "#b45309", fontFamily: "'DM Mono', monospace", marginBottom: 12 }}>
          Alur Melingkar Teori Siklus (Tanpa Garis Akhir Mutlak)
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
          {[
            { step: "Fase 1", title: "Lahir / Bangkit", sub: "Kekuatan perintis baru", bg: "#fef3c7", border: "#fde68a", color: "#92400e" },
            { step: "Fase 2", title: "Tumbuh / Puncak", sub: "Ekspansi & kematangan", bg: "#dcfce7", border: "#bbf7d0", color: "#166534" },
            { step: "Fase 3", title: "Kejayaan Emas", sub: "Stabilitas kemakmuran", bg: "#e0e7ff", border: "#c7d2fe", color: "#3730a3" },
            { step: "Fase 4", title: "Kemunduran / Runtuh", sub: "Elit gagal adaptasi", bg: "#fee2e2", border: "#fecaca", color: "#991b1b" }
          ].map((item, idx) => (
            <React.Fragment key={idx}>
              <div style={{ flex: "1 1 125px", padding: "10px 12px", backgroundColor: item.bg, border: `1px solid ${item.border}`, borderRadius: 4, textAlign: "center" }}>
                <div style={{ fontSize: 9.5, fontWeight: 800, textTransform: "uppercase", color: item.color, opacity: 0.8, fontFamily: "'DM Mono', monospace" }}>{item.step}</div>
                <strong style={{ fontSize: 13, color: item.color, display: "block", marginTop: 3 }}>{item.title}</strong>
                <span style={{ fontSize: 11, color: item.color, opacity: 0.85, display: "block", marginTop: 2 }}>{item.sub}</span>
              </div>
              {idx < 3 && <span style={{ fontSize: 14, color: "#b45309", fontWeight: 800, padding: "0 2px" }}>➔</span>}
            </React.Fragment>
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: 10, fontSize: 11.5, color: "#92400e", fontWeight: 600 }}>
          Keruntuhan fase 4 menjadi bibit kebangkitan fase 1 baru bagi peradaban berikutnya.
        </div>
      </div>
    );
  }

  // Pattern 3: Pohon Keputusan Ujian (Decision Tree)
  if (
    upper.includes("POHON ELIMINASI") ||
    upper.includes("POHON KEPUTUSAN") ||
    ((upper.includes("ELIMINASI") || upper.includes("KATA KUNCI")) && (upper.includes("SIKLUS") || upper.includes("LINIER") || upper.includes("KONFLIK") || upper.includes("FUNGSIONAL")))
  ) {
    const items = [
      {
        badge: "TEORI SIKLUS",
        badgeBg: "#fef3c7",
        badgeBorder: "#fde68a",
        badgeColor: "#92400e",
        bg: "#fffbeb",
        border: "#fde68a",
        textColor: "#78350f",
        keywords: ['"kembali ke masa lampau"', '"pola berulang"', '"tren surut lalu bangkit"']
      },
      {
        badge: "TEORI LINIER",
        badgeBg: "#d1fae5",
        badgeBorder: "#a7f3d0",
        badgeColor: "#065f46",
        bg: "#ecfdf5",
        border: "#a7f3d0",
        textColor: "#065f46",
        keywords: ['"tahapan maju permanen"', '"tidak kembali ke titik awal"', '"Comte / Spencer"']
      },
      {
        badge: "TEORI KONFLIK",
        badgeBg: "#fee2e2",
        badgeBorder: "#fecaca",
        badgeColor: "#991b1b",
        bg: "#fef2f2",
        border: "#fecaca",
        textColor: "#7f1d1d",
        keywords: ['"friksi dua kelompok"', '"upah & modal (Marx)"', '"wewenang & jabatan (Dahrendorf)"']
      },
      {
        badge: "TEORI FUNGSIONAL",
        badgeBg: "#dcfce7",
        badgeBorder: "#bbf7d0",
        badgeColor: "#166534",
        bg: "#f0fdf4",
        border: "#bbf7d0",
        textColor: "#14532d",
        keywords: ['"keseimbangan sistem (AGIL)"', '"teknologi mendahului aturan (Cultural Lag)"']
      }
    ];

    return (
      <div className="visual-diagram-card decision-tree-card" style={{ margin: "16px 0", padding: "16px 16px", backgroundColor: "#f8f9fa", border: "1px solid #dde1da", borderRadius: 6 }}>
        <div style={{ fontSize: 10.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", color: "#18221f", fontFamily: "'DM Mono', monospace", marginBottom: 12 }}>
          Pohon Eliminasi Cepat Soal Ujian
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {items.map((item, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                padding: "10px 12px",
                backgroundColor: item.bg,
                border: `1px solid ${item.border}`,
                borderRadius: 4,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: "0.5px",
                    color: item.badgeColor,
                    backgroundColor: item.badgeBg,
                    border: `1px solid ${item.badgeBorder}`,
                    padding: "2px 8px",
                    borderRadius: 4,
                    whiteSpace: "nowrap",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  ➜ {item.badge}
                </span>
                <span style={{ fontSize: 10, fontWeight: 700, color: item.badgeColor, opacity: 0.85, textTransform: "uppercase", letterSpacing: "0.5px", fontFamily: "'DM Mono', monospace" }}>
                  Pola Jawaban
                </span>
              </div>
              <div style={{ fontSize: 12.5, lineHeight: 1.5, color: item.textColor }}>
                Kata kunci: {item.keywords.map((k, kIdx) => (
                  <React.Fragment key={kIdx}>
                    <em><MathView text={k} /></em>
                    {kIdx < item.keywords.length - 1 && " / "}
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Pattern 4: Cultural Lag Flow
  if (upper.includes("BUDAYA MATERIAL") && (upper.includes("BUDAYA IMATERIAL") || upper.includes("CULTURAL LAG"))) {
    return (
      <div className="visual-diagram-card" style={{ margin: "16px 0", padding: "16px 18px", backgroundColor: "#fbfcf9", border: "1px solid #dce1da", borderRadius: 6 }}>
        <div style={{ fontSize: 10.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", color: "#4b6623", fontFamily: "'DM Mono', monospace", marginBottom: 12 }}>
          Dinamika Cultural Lag (William F. Ogburn)
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 12, alignItems: "center" }}>
          <div style={{ padding: "12px", backgroundColor: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 4 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: "#1d4ed8", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>Budaya Material</div>
            <strong style={{ fontSize: 13, color: "#1e40af", display: "block", marginTop: 2 }}>Inovasi Teknologi Fisik</strong>
            <span style={{ fontSize: 11.5, color: "#2563eb", display: "block", marginTop: 3 }}>Perubahan Cepat (Fintech, Gawai, AI)</span>
          </div>

          <div style={{ textAlign: "center", padding: "0 6px" }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#dc2626", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>vs</div>
            <div style={{ fontSize: 9.5, fontWeight: 800, color: "#dc2626", textTransform: "uppercase", marginTop: 2 }}>Kesenjangan</div>
          </div>

          <div style={{ padding: "12px", backgroundColor: "#fef3c7", border: "1px solid #fde68a", borderRadius: 4 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: "#b45309", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>Budaya Imaterial</div>
            <strong style={{ fontSize: 13, color: "#92400e", display: "block", marginTop: 2 }}>Regulasi & Norma Sosial</strong>
            <span style={{ fontSize: 11.5, color: "#b45309", display: "block", marginTop: 3 }}>Adaptasi Bertahap / Tertinggal</span>
          </div>
        </div>
        <div style={{ marginTop: 12, padding: "10px 12px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: 4, fontSize: 12, color: "#991b1b" }}>
          <strong>Akibat:</strong> Menimbulkan <em>Cultural Lag</em> berupa disorganisasi sosial, kejahatan siber baru, dan anomi sebelum regulasi resmi terbit.
        </div>
      </div>
    );
  }

  // Pattern 4b: Kurva Difusi Inovasi Everett M. Rogers
  if (
    (upper.includes("ROGERS") || upper.includes("DIFUSI INOVASI") || upper.includes("KURVA ADOPSI")) &&
    (upper.includes("INNOVATOR") || upper.includes("EARLY ADOPTER") || upper.includes("LAGGARD") || upper.includes("DISTRIBUSI NORMAL") || upper.includes("34%"))
  ) {
    return (
      <div className="visual-diagram-card" style={{ margin: "16px 0", padding: "16px 18px", backgroundColor: "#fbfcf9", border: "1px solid #dce2da", borderRadius: 6, boxShadow: "none" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 10.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", color: "#4b6623", fontFamily: "'DM Mono', monospace" }}>
            Kurva Distribusi Normal Adopsi Inovasi (Everett M. Rogers)
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, backgroundColor: "#e2ecdc", color: "#364d18", padding: "2px 7px", borderRadius: 4, fontFamily: "'DM Mono', monospace" }}>
            Total N = 100%
          </span>
        </div>

        {/* Visual SVG Gaussian Bell Curve */}
        <div style={{ width: "100%", height: 130, marginBottom: 14, position: "relative" }}>
          <svg viewBox="0 0 500 130" style={{ width: "100%", height: "100%", overflow: "visible" }}>
            <defs>
              <linearGradient id="rogersCurveGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4b6623" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#4b6623" stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {/* Bell Curve Area Fill */}
            <path
              d="M 10 120 Q 80 120 150 70 Q 250 10 350 70 Q 420 120 490 120 Z"
              fill="url(#rogersCurveGradient)"
            />
            {/* Bell Curve Stroke */}
            <path
              d="M 10 120 Q 80 120 150 70 Q 250 10 350 70 Q 420 120 490 120"
              fill="none"
              stroke="#4b6623"
              strokeWidth="2.5"
            />

            {/* Segment Vertical Separators */}
            <line x1="85" y1="100" x2="85" y2="120" stroke="#cbd5e1" strokeDasharray="3 3" strokeWidth="1.5" />
            <line x1="165" y1="65" x2="165" y2="120" stroke="#dc2626" strokeDasharray="4 3" strokeWidth="2" />
            <line x1="250" y1="10" x2="250" y2="120" stroke="#94a3b8" strokeDasharray="3 3" strokeWidth="1.5" />
            <line x1="415" y1="100" x2="415" y2="120" stroke="#cbd5e1" strokeDasharray="3 3" strokeWidth="1.5" />

            {/* Labels on SVG */}
            <text x="45" y="115" fontSize="9" fontWeight="bold" fill="#64748b" textAnchor="middle">2,5%</text>
            <text x="125" y="105" fontSize="9" fontWeight="bold" fill="#2563eb" textAnchor="middle">13,5%</text>
            <text x="210" y="80" fontSize="9" fontWeight="bold" fill="#059669" textAnchor="middle">34%</text>
            <text x="330" y="80" fontSize="9" fontWeight="bold" fill="#d97706" textAnchor="middle">34%</text>
            <text x="455" y="115" fontSize="9" fontWeight="bold" fill="#dc2626" textAnchor="middle">16%</text>

            {/* Takeoff Badge on SVG */}
            <g transform="translate(165, 40)">
              <rect x="-48" y="-14" width="96" height="18" rx="4" fill="#dc2626" />
              <text x="0" y="-1" fontSize="8" fontWeight="bold" fill="#ffffff" textAnchor="middle">Take-off (16%)</text>
            </g>
          </svg>
        </div>

        {/* 5-Column Segmented Bento Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 8 }}>
          <div style={{ padding: "10px 12px", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 4, textAlign: "center" }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: "#64748b", fontFamily: "'DM Mono', monospace" }}>2,5%</span>
            <strong style={{ fontSize: 12, color: "#1e293b", display: "block", marginTop: 2 }}>Innovators</strong>
            <span style={{ fontSize: 10, color: "#64748b", display: "block", marginTop: 2 }}>Pemberani, siap risiko rugi</span>
          </div>

          <div style={{ padding: "10px 12px", backgroundColor: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 4, textAlign: "center" }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: "#2563eb", fontFamily: "'DM Mono', monospace" }}>13,5%</span>
            <strong style={{ fontSize: 12, color: "#1e40af", display: "block", marginTop: 2 }}>Early Adopters</strong>
            <span style={{ fontSize: 10, color: "#2563eb", display: "block", marginTop: 2 }}>Opinion leader, panutan</span>
          </div>

          <div style={{ padding: "10px 12px", backgroundColor: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 4, textAlign: "center" }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: "#059669", fontFamily: "'DM Mono', monospace" }}>34,0%</span>
            <strong style={{ fontSize: 12, color: "#065f46", display: "block", marginTop: 2 }}>Early Majority</strong>
            <span style={{ fontSize: 10, color: "#059669", display: "block", marginTop: 2 }}>Pragmatis, adopsi aman</span>
          </div>

          <div style={{ padding: "10px 12px", backgroundColor: "#fffbeb", border: "1px solid #fde68a", borderRadius: 4, textAlign: "center" }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: "#d97706", fontFamily: "'DM Mono', monospace" }}>34,0%</span>
            <strong style={{ fontSize: 12, color: "#92400e", display: "block", marginTop: 2 }}>Late Majority</strong>
            <span style={{ fontSize: 10, color: "#b45309", display: "block", marginTop: 2 }}>Skeptis, adopsi terpaksa</span>
          </div>

          <div style={{ padding: "10px 12px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: 4, textAlign: "center" }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: "#dc2626", fontFamily: "'DM Mono', monospace" }}>16,0%</span>
            <strong style={{ fontSize: 12, color: "#991b1b", display: "block", marginTop: 2 }}>Laggards</strong>
            <span style={{ fontSize: 10, color: "#dc2626", display: "block", marginTop: 2 }}>Tradisional, resisten</span>
          </div>
        </div>

        {/* Takeaway Box */}
        <div style={{ marginTop: 12, padding: "10px 12px", backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 4, fontSize: 11.5, color: "#166534" }}>
          <span><strong>Titik Kritis (Chasm):</strong> Melewati kumulatif <strong>16%</strong> (Innovators + Early Adopters) menentukan apakah inovasi meluas atau gagal.</span>
        </div>
      </div>
    );
  }

  // Pattern 4c: Pola Sebaran Dampak William F. Ogburn (Memancar, Menjalar, Memusat)
  if (
    (upper.includes("MEMANCAR") && upper.includes("MENJALAR") && upper.includes("MEMUSAT")) ||
    (upper.includes("OGBURN") && (upper.includes("POLA") || upper.includes("SEBARAN")))
  ) {
    return (
      <div className="visual-diagram-card" style={{ margin: "16px 0", padding: "16px 18px", backgroundColor: "#f8faf6", border: "1px solid #dce2da", borderRadius: 6 }}>
        <div style={{ fontSize: 10.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", color: "#4b6623", fontFamily: "'DM Mono', monospace", marginBottom: 12 }}>
          Tiga Pola Sebaran Dampak Penemuan Baru (William F. Ogburn)
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
          {/* 1. Memancar */}
          <div style={{ padding: "12px", backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 4 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: "#2563eb", fontFamily: "'DM Mono', monospace", textTransform: "uppercase" }}>Pola 01</span>
            </div>
            <strong style={{ fontSize: 13, color: "#1e293b", display: "block" }}>Memancar (Konsentris)</strong>
            <div style={{ margin: "6px 0", padding: "5px 8px", backgroundColor: "#eff6ff", borderRadius: 4, fontSize: 11, fontFamily: "'DM Mono', monospace", color: "#1d4ed8" }}>
              1 Alat (X) ➜ Multi Dampak (A, B, C)
            </div>
            <p style={{ fontSize: 11, color: "#64748b", margin: 0, lineHeight: 1.45 }}>
              Satu penemuan primer memicu perubahan simultan di berbagai bidang yang berdiri sendiri (misal: Ponsel pintar).
            </p>
          </div>

          {/* 2. Menjalar */}
          <div style={{ padding: "12px", backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 4 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: "#059669", fontFamily: "'DM Mono', monospace", textTransform: "uppercase" }}>Pola 02</span>
            </div>
            <strong style={{ fontSize: 13, color: "#1e293b", display: "block" }}>Menjalar (Siklis/Rantai)</strong>
            <div style={{ margin: "6px 0", padding: "5px 8px", backgroundColor: "#ecfdf5", borderRadius: 4, fontSize: 11, fontFamily: "'DM Mono', monospace", color: "#065f46" }}>
              X ➜ Y ➜ Z (Estafet Berantai)
            </div>
            <p style={{ fontSize: 11, color: "#64748b", margin: 0, lineHeight: 1.45 }}>
              Sebab-akibat bertahap: penemuan memicu perubahan baru, lalu memicu perubahan berikutnya (misal: Mesin uap).
            </p>
          </div>

          {/* 3. Memusat */}
          <div style={{ padding: "12px", backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 4 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: "#d97706", fontFamily: "'DM Mono', monospace", textTransform: "uppercase" }}>Pola 03</span>
            </div>
            <strong style={{ fontSize: 13, color: "#1e293b", display: "block" }}>Memusat (Konvergen)</strong>
            <div style={{ margin: "6px 0", padding: "5px 8px", backgroundColor: "#fffbeb", borderRadius: 4, fontSize: 11, fontFamily: "'DM Mono', monospace", color: "#92400e" }}>
              (A + B + C) ➜ 1 Sistem Baru (X)
            </div>
            <p style={{ fontSize: 11, color: "#64748b", margin: 0, lineHeight: 1.45 }}>
              Banyak penemuan yang mulanya terpisah bergabung menciptakan satu ekosistem sosial terpadu (misal: Ojek daring).
            </p>
          </div>
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
        <div className="visual-diagram-card" style={{ margin: "16px 0", padding: "16px 18px", backgroundColor: "#f8faf6", border: "1px solid #dce2da", borderRadius: 6, boxShadow: "none" }}>
          <div style={{ fontSize: 10.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", color: "#566b36", fontFamily: "'DM Mono', monospace", marginBottom: 12 }}>
            Alur Transformasi & Tahapan Konsep
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {rawSegments.map((item, idx) => (
              <React.Fragment key={idx}>
                <div style={{ flex: "1 1 140px", padding: "10px 12px", backgroundColor: "#ffffff", border: "1px solid #dce2da", borderRadius: 4, textAlign: "center" }}>
                  <div style={{ fontSize: 9.5, fontWeight: 800, textTransform: "uppercase", color: "#566b36", fontFamily: "'DM Mono', monospace" }}>Tahap 0{idx + 1}</div>
                  <strong style={{ fontSize: 13, color: "#18211e", display: "block", marginTop: 3 }}><MathView text={item} /></strong>
                </div>
                {idx < rawSegments.length - 1 && <span style={{ fontSize: 14, color: "#779f2f", fontWeight: 800, padding: "0 2px" }}>➔</span>}
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
        <div className="visual-diagram-card" style={{ margin: "16px 0", padding: "16px 18px", backgroundColor: "#f8faf6", border: "1px solid #dce2da", borderRadius: 6 }}>
          <div style={{ fontSize: 10.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", color: "#566b36", fontFamily: "'DM Mono', monospace", marginBottom: 12 }}>
            Komparasi Dua Konsep Berseberangan
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10 }}>
            <div style={{ padding: "12px 14px", backgroundColor: "#fbf6e8", border: "1px solid #fae8b8", borderRadius: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: "#92400e", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>Kategori A</span>
              <strong style={{ fontSize: 13, color: "#78350f", display: "block", marginTop: 3 }}><MathView text={parts[0]} /></strong>
            </div>
            <div style={{ padding: "12px 14px", backgroundColor: "#edf7ed", border: "1px solid #c8e6c9", borderRadius: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: "#1b5e20", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>Kategori B</span>
              <strong style={{ fontSize: 13, color: "#2e7d32", display: "block", marginTop: 3 }}><MathView text={parts[1]} /></strong>
            </div>
          </div>
        </div>
      );
    }
  }

  // Pattern 7: Generic Hierarchical Diagram / ASCII Flow Nodes (Applies to ALL subjects)
  const hasBoxChars = /[┌└├│─┬┴┼]|\+[-=]{2,}|-->|==>|->|◄|►|▼|▲|⇄|⇌|↔/.test(text);
  if (hasBoxChars) {
    const rawLines = text.split("\n");
    const cleanNodes = rawLines
      .map(l => l.replace(/[┌└├│─┬┴┼+|=]+/g, " ").trim())
      .filter(l => l.length > 1);

    if (cleanNodes.length > 0) {
      return (
        <div className="visual-diagram-card" style={{ margin: "14px 0", padding: "14px 16px", backgroundColor: "#f8f9f6", border: "1px solid #dce2da", borderRadius: 6, boxShadow: "none" }}>
          <div style={{ fontSize: 10.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", color: "#465f33", fontFamily: "'DM Mono', monospace", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
            <span>Bagan Alur & Peta Hubungan Konsep</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {cleanNodes.map((nodeText, nIdx) => {
              // Parse arrow transitions e.g. [A] -> [B] or A ◄ Diakselerasi B
              const parts = nodeText.split(/\s*(?:->|-->|==>|◄|►|⇄|⇌|↔)\s*/).filter(p => p.trim().length > 0);
              const isMultiStep = parts.length > 1;

              return (
                <div key={nIdx} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", backgroundColor: "#ffffff", border: "1px solid #e1e7de", borderRadius: 4, fontSize: 13, color: "#18211e", flexWrap: "wrap" }}>
                  <span style={{ width: 20, height: 20, borderRadius: 4, backgroundColor: "#edf4e3", color: "#465f33", display: "grid", placeItems: "center", fontSize: 10.5, fontWeight: 800, fontFamily: "'DM Mono', monospace", flexShrink: 0 }}>
                    {nIdx + 1}
                  </span>
                  {isMultiStep ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", flex: 1 }}>
                      {parts.map((p, pIdx) => (
                        <React.Fragment key={pIdx}>
                          <span style={{ fontWeight: 600, backgroundColor: "#f4f6f1", border: "1px solid #dde3d8", padding: "2px 7px", borderRadius: 4, color: "#1e2e1a" }}>
                            <MathView text={p.replace(/^\[|\]$/g, "")} />
                          </span>
                          {pIdx < parts.length - 1 && (
                            <span style={{ color: "#72a728", fontWeight: 800, fontSize: 13 }}>➔</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  ) : (
                    <span style={{ fontWeight: 600, flex: 1, fontSize: 13, lineHeight: 1.45 }}>
                      <MathView text={nodeText} />
                    </span>
                  )}
                </div>
              );
            })}
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

  const isMathDomain = useMemo(() => {
    const text = `${topic} ${subject || ""}`.toLowerCase();
    if (/matematika|math/i.test(subject) || /matematika|math/i.test(topic)) return true;
    return /aritmatika|aritmetika|aljabar|trigonometri|kalkulus|integral|turunan|diferensial|limit|matriks|vektor|peluang|statistika|kombinatorika|permutasi|kombinasi|eksponen|logaritma|persamaan|pertidaksamaan|fungsi|polinomial|suku banyak|lingkaran|dimensi tiga|bangun ruang|bangun datar|pythagoras|barisan|deret|bilangan|pecahan|operasi hitung|geometri|transformasi|dilatasi|translasi|rotasi|refleksi|notasi sigma/i.test(text);
  }, [topic, subject]);

  const sources = useMemo(
    () => {
      if (isMathDomain) {
        return [
          {
            id: "syllabus",
            name: "Silabus Matematika Nasional",
            domain: "Silabus Nasional (Fase E/F)",
            category: "Aksioma & Prasyarat",
            action: "Memetakan cakupan pilar materi, prasyarat, dan batasan kurikulum SMA/UTBK",
            color: "#059669",
            bg: "#ecfdf5",
            badge: "Kurikulum Merdeka",
            icon: (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <rect width="24" height="24" rx="6" fill="#059669" />
                <path d="M7 17L12 7L17 17M9 13H15" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )
          },
          {
            id: "formulas",
            name: "Generator Matriks & Rumus KaTeX",
            domain: "Pure First-Principles AI",
            category: "Formulasi Eksak",
            action: "Menyusun tabel pemetaan rumus lengkap dengan notasi KaTeX ($...$ & $$...$$)",
            color: "#2563eb",
            bg: "#eff6ff",
            badge: "KaTeX LaTeX",
            icon: (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <rect width="24" height="24" rx="6" fill="#2563eb" />
                <path d="M7 7H17M12 7V17M9 17H15" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )
          },
          {
            id: "worked_examples",
            name: "Penurunan Rumus & Worked Examples",
            domain: "Langkah Analitik Bertahap",
            category: "Contoh Taktis Ujian",
            action: "Menyusun pembuktian analitik dan contoh soal taktis (tanpa sulap jawaban)",
            color: "#7c3aed",
            bg: "#f5f3ff",
            badge: "Worked Examples",
            icon: (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <rect width="24" height="24" rx="6" fill="#7c3aed" />
                <path d="M6 12L10 16L18 8" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )
          },
          {
            id: "synthesis",
            name: "Sintesis Modul Eksak Tanka",
            domain: "Bebas Noise & Halusinasi Web",
            category: "Modul Siap Ujian",
            action: "Mengunci definisi padat 1-2 kalimat dan modul siap dipelajari",
            color: "#166534",
            bg: "#f0fdf4",
            badge: "Modul Siap",
            icon: (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <rect width="24" height="24" rx="6" fill="#18221f" />
                <path d="M7 12L10.5 15.5L17 8.5" stroke="#c8f064" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )
          }
        ];
      }

      return [
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
          name: "Penyusunan Materi Belajar Tanka",
          domain: "Kurikulum Terpadu",
          category: "Penyusunan Modul Belajar",
          action: "Merapikan rangkuman konsep, rumus penting, dan latihan soal",
          color: "#3f6212",
          bg: "#f7fee7",
          badge: "Modul Siap",
          icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <rect width="24" height="24" rx="6" fill="#18221f" />
              <path d="M7 12L10.5 15.5L17 8.5" stroke="#c8f064" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )
        }
      ];
    },
    [isMathDomain]
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
              backgroundColor: isMathDomain ? "#eff6ff" : "#edf4e3",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: `1px solid ${isMathDomain ? "#bfdbfe" : "#d7e5c5"}`
            }}
          >
            {isMathDomain ? (
              <Sparkles size={15} color="#2563eb" />
            ) : (
              <Globe size={15} color="#4b6623" style={{ animation: "spinSlow 12s linear infinite" }} />
            )}
          </div>
          <div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "1px",
                color: isMathDomain ? "#1d4ed8" : "#566b36",
                fontFamily: "'DM Mono', monospace"
              }}
            >
              {isMathDomain ? "FORMULASI MATEMATIKA EKSAK (BYPASS WEB SEARCH)" : "PENELUSURAN REFERENSI LIVE"}
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
              border: `1px solid ${isMathDomain ? "#bfdbfe" : "#dce1da"}`,
              color: isMathDomain ? "#1d4ed8" : "#4b6623",
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
          border: `1px solid ${isMathDomain ? "#93c5fd" : "#c2e28f"}`,
          borderRadius: 10,
          padding: "10px 12px",
          marginBottom: 14,
          display: "flex",
          alignItems: "center",
          gap: 10,
          boxShadow: isMathDomain ? "0 2px 8px rgba(37, 99, 235, 0.08)" : "0 2px 8px rgba(119, 159, 47, 0.08)"
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            backgroundColor: isMathDomain ? "#2563eb" : "#779f2f",
            flexShrink: 0,
            boxShadow: `0 0 0 3px ${isMathDomain ? "rgba(37, 99, 235, 0.25)" : "rgba(119, 159, 47, 0.25)"}`
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: isMathDomain ? "#1e3a8a" : "#22370c", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span>{isMathDomain ? "Tahapan Sintesis:" : "Sedang Memindai:"}</span>
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

