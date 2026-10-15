# TASK: TASK-DOM-CONCEPT-TREE-030
## MODE: HYBRID (VISUAL_PRODUCT & ALGORITHM)
## SURFACE ARCHETYPE: Editorial Concept Tree & Structural Hierarchy (Anti-Neon, Pure DOM)

## METADATA
- Project: Tanka (/home/vallencia/Projects/tanka)
- Target Files:
  - `src/components/common/DiagramRenderer.tsx`
  - `src/index.css`
- Assigned: MARAKA (maraka)
- Reviewer & Auditor: AURA (gikano)
- Authority: Eka

---

## 1. OBJECTIVE & ROOT CAUSE EXPLANATION
Pengguna menginstruksikan:
> *"boleh, lakukan, design yg simple aja janhan neon""*

### Masalah Desain Saat Ini:
1. Diagram berbasis teks ASCII (`┌──┴──┐`, `├──`, `└──`) membuat tampilan Tanka jatuh seperti terminal DOS tahun 1990-an yang kaku dan tidak cocok dengan identitas minimalis modern (Linear/Apple style).
2. Pada layar ponsel (mobile 390px), teks ASCII kaku memaksa pengguna menggeser layar ke kanan-kiri (horizontal scroll).
3. Karakter garis ASCII dibaca buruk oleh screen reader dan formula matematika di dalamnya tidak ter-render sebagai KaTeX asli.

### Solusi Arsitektural (Pure DOM Concept Tree):
Ganti seluruh tampilan ASCII box/tree dengan komponen kartu pohon berstruktur DOM murni:
- **Tone & Palet (Strict Anti-Neon / Clean Editorial)**:
  - Root Header: `#f4f7ee` (soft sage off-white), border `#dce4d2`, teks zaitun tua `#18221f`.
  - Branch Cards: `#ffffff`, border halus `#e2e8e0`, aksen border kiri 3.5px warna zaitun kanonikal `#4b6623` dan forest `#2b593f`. Nol warna neon/glow norak.
  - Sub-items: Lekukan vertikal halus (`border-left: 2px solid #e3e9df`, padding-left 10px) dengan bullet dot `#65a30d`.
- **100% Responsif Mobile**:
  - Kolom cabang menggunakan `display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px;`.
  - Di desktop: Cabang berdampingan secara elegan.
  - Di mobile (390px): Cabang otomatis bertumpuk vertikal ke bawah tanpa memerlukan scroll horizontal sama sekali.
- **Dukungan KaTeX Asli**:
  - Setiap teks label dan item diparsing melalui `<MathView>` sehingga rumus $\mathbb{R}, \mathbb{Q}, \mathbb{Z}, \sqrt{2}, \pi$ ter-render tajam.

---

## 2. DETAIL SPESIFIKASI IMPLEMENTASI

### A. Parser Pohon & Hierarki di `src/components/common/DiagramRenderer.tsx`

Buat parser universal yang membersihkan karakter ASCII dan mengekstrak struktur hierarki:

```tsx
interface ConceptNode {
  depth: number;
  label: string;
}

interface ConceptBranch {
  title: string;
  items: string[];
}

interface ConceptTreeStructure {
  root: string;
  branches: ConceptBranch[];
  isLinear: boolean;
  linearNodes: ConceptNode[];
}

function parseConceptTreeFromAscii(rawText: string): ConceptTreeStructure {
  const lines = rawText.split("\n").filter((l) => l.trim().length > 0);
  if (lines.length === 0) {
    return { root: "Peta Struktur Konsep", branches: [], isLinear: true, linearNodes: [] };
  }

  // 1. Ekstrak Root Title (baris pertama)
  const rootRaw = lines[0].replace(/[┌└├│─┬┴┼┐┘┤┴┬│─+=#*_]+/g, " ").trim();
  const root = rootRaw || "Peta Hierarki Konsep";

  // 2. Deteksi apakah ini diagram 2-pilar / 2-cabang (seperti SISTEM BILANGAN RIIL atau HIMPUNAN BILANGAN RIIL)
  const isOnlyConnectors = (l: string) => !/[a-zA-Z0-9\(\)\{\}\[\]\$\\\u00C0-\u024F\u1E00-\u1EFF\u2100-\u214F]/.test(l);
  const contentLines = lines.slice(1).filter((l) => !isOnlyConnectors(l));

  // Cek apakah ada baris dengan 2 judul berdampingan (pemisah spasi lebar)
  const twoColLine = contentLines.find((l) => /\S\s{6,}\S/.test(l));

  if (twoColLine) {
    const match = twoColLine.match(/\s{6,}/);
    const splitIdx = match && match.index !== undefined ? match.index + Math.floor(match[0].length / 2) : Math.floor(twoColLine.length / 2);

    const b1Header = twoColLine.slice(0, splitIdx).replace(/[┌└├│─┬┴┼┐┘┤┴┬│─+=#*_•]+/g, " ").trim();
    const b2Header = twoColLine.slice(splitIdx).replace(/[┌└├│─┬┴┼┐┘┤┴┬│─+=#*_•]+/g, " ").trim();

    const detailLines = contentLines.slice(contentLines.indexOf(twoColLine) + 1);
    const b1Items: string[] = [];
    const b2Items: string[] = [];

    detailLines.forEach((l) => {
      const leftPart = l.slice(0, splitIdx).replace(/[┌└├│─┬┴┼┐┘┤┴┬│─+=•]+/g, " ").trim();
      const rightPart = l.slice(splitIdx).replace(/[┌└├│─┬┴┼┐┘┤┴┬│─+=•]+/g, " ").trim();
      if (leftPart) b1Items.push(leftPart);
      if (rightPart) b2Items.push(rightPart);
    });

    return {
      root,
      isLinear: false,
      branches: [
        { title: b1Header, items: b1Items },
        { title: b2Header, items: b2Items }
      ].filter((b) => b.title.length > 0 || b.items.length > 0),
      linearNodes: []
    };
  }

  // 3. Fallback: Linear / Tiered Hierarchical Tree (Block 1 & 3: Semesta Riil -> Rasional -> Bulat)
  const linearNodes: ConceptNode[] = [];
  contentLines.forEach((raw) => {
    const leadingSpaces = (raw.match(/^\s*/)?.[0] || "").length;
    const branchDepth = (raw.slice(0, 30).match(/[│|]/g) || []).length;
    const cleanLabel = raw.replace(/[┌└├│─┬┴┼┐┘┤┴┬│─+=•]+/g, " ").trim();

    if (cleanLabel.length > 0) {
      const depth = Math.min(4, Math.max(0, Math.round(leadingSpaces / 6) + branchDepth - 1));
      linearNodes.push({ depth, label: cleanLabel });
    }
  });

  return { root, isLinear: true, branches: [], linearNodes };
}
```

### B. Komponen Render di `DiagramRenderer.tsx`

Pada `renderVisualDiagramOrPre`:
Ganti blok `hasBoxChars` menjadi rendering DOM card yang bersih dan tenang:

```tsx
  // Pattern 7: Clean Editorial DOM Concept Tree (Anti-Neon, Zero-ASCII-Artifacts)
  const hasBoxChars = /[┌└├│─┬┴┼┐┘┤┴┬│─]|\+[-=]{2,}/.test(text);
  if (hasBoxChars) {
    const tree = parseConceptTreeFromAscii(rawText);

    return (
      <div
        className="visual-diagram-card concept-tree-container"
        style={{
          margin: "18px 0",
          backgroundColor: "#ffffff",
          border: "1px solid #dce2d8",
          borderRadius: 8,
          padding: "16px 18px",
          boxShadow: "0 1px 3px rgba(24, 34, 31, 0.02)"
        }}
      >
        {/* Header Kicker */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid #edf1eb",
            paddingBottom: 8,
            marginBottom: 12
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 10.5,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "#465f33",
              fontFamily: "'DM Mono', monospace"
            }}
          >
            <Network size={12} color="#4b6623" />
            <span>BAGAN HIERARKI KONSEP</span>
          </div>
          <span style={{ fontSize: 10.5, color: "#7a8a82", fontWeight: 600 }}>Struktur Bertingkat</span>
        </div>

        {/* Root Banner */}
        <div
          style={{
            backgroundColor: "#f4f7ee",
            border: "1px solid #dce4d2",
            borderRadius: 6,
            padding: "9px 14px",
            fontSize: 13,
            fontWeight: 800,
            color: "#18221f",
            marginBottom: 12
          }}
        >
          <MathView text={tree.root} />
        </div>

        {/* 2-Pillar Branches or Linear Hierarchical Tree */}
        {!tree.isLinear && tree.branches.length > 0 ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 12
            }}
          >
            {tree.branches.map((branch, bIdx) => (
              <div
                key={bIdx}
                style={{
                  backgroundColor: "#fafbf9",
                  border: "1px solid #e1e8dd",
                  borderLeft: bIdx === 0 ? "3.5px solid #4b6623" : "3.5px solid #2b593f",
                  borderRadius: 6,
                  padding: "12px 14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8
                }}
              >
                <div
                  style={{
                    fontSize: 12.5,
                    fontWeight: 800,
                    color: "#17201d",
                    borderBottom: "1px solid #edf1ea",
                    paddingBottom: 5
                  }}
                >
                  <MathView text={branch.title} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {branch.items.map((item, iIdx) => (
                    <div
                      key={iIdx}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 6,
                        fontSize: 12,
                        color: "#374740",
                        lineHeight: 1.5
                      }}
                    >
                      <span style={{ color: "#65a30d", fontWeight: 800, fontSize: 11, flexShrink: 0, marginTop: 1 }}>•</span>
                      <span style={{ flex: 1 }}>
                        <MathView text={item} />
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Linear Tiered Tree */
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {tree.linearNodes.map((node, nIdx) => (
              <div
                key={nIdx}
                style={{
                  marginLeft: `${Math.min(node.depth * 16, 64)}px`,
                  padding: "7px 12px",
                  backgroundColor: node.depth === 0 ? "#f8faf5" : "#ffffff",
                  border: "1px solid #e2e8e0",
                  borderLeft: node.depth > 0 ? "2.5px solid #779f2f" : "1px solid #e2e8e0",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: node.depth === 0 ? 700 : 500,
                  color: "#283731",
                  display: "flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                {node.depth > 0 && <span style={{ color: "#779f2f", fontSize: 10, flexShrink: 0 }}>↳</span>}
                <span style={{ flex: 1 }}>
                  <MathView text={node.label} />
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
```

### C. Styling Tambahan di `src/index.css`
Pastikan di `src/index.css`:
```css
.concept-tree-container {
  break-inside: avoid !important;
  page-break-inside: avoid !important;
}

@media print {
  .concept-tree-container {
    border: 1px solid #dce2d8 !important;
    background: #ffffff !important;
    box-shadow: none !important;
    padding: 10pt 12pt !important;
    margin: 12pt 0 !important;
  }
}
```

---

## 3. ACCEPTANCE CRITERIA
- [ ] Diagram ASCII box-drawing tidak lagi ditampilkan sebagai teks terminal gelap mentah atau karakter garis terbelah (`┌──┴──┐`, `├──`, `└──`).
- [ ] Berubah menjadi kartu editorial DOM murni yang tenang (*calm olive, soft border, zero neon*).
- [ ] Diagram bertumpuk vertikal secara alami di layar mobile 390px (nol horizontal scroll).
- [ ] Rumus matematika di dalam kartu ter-render dengan KaTeX tajam ($\mathbb{R}, \mathbb{Q}, \mathbb{Z}, \sqrt{2}$).
- [ ] `npm run build` sukses.
- [ ] `env TANKA_DB_PATH=:memory: node --test tests/*.test.js` 83/83 pass.
- [ ] DILARANG melakukan `git push` ke remote GitHub.
