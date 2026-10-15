# TASK: TASK-NUMBERED-CONCEPT-GUIDE-032
## MODE: HYBRID (VISUAL_PRODUCT & FLOW INTERACTION)
## SURFACE ARCHETYPE: Numbered Guided Concept Pathway & Timeline Stepper

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
Pengguna mengirim tangkapan layar dan menginstruksikan:
> *"kalau misal yg kya alur gitu, ksih tau lah misal petunjuk dmn dluan dalam bentuk angka kek atau gmn kek, masa cm kaya tulisan aja"*

### Temuan Masalah & Kebutuhan Pengguna:
1. **Ketiadaan Petunjuk Urutan (No Sequence/Orientation Cues)**:
   Diagram hierarki konsep sebelumnya hanya berupa tumpukan kotak teks polos tanpa nomor urut (`1`, `2`, `3`) dan tanpa petunjuk arah baca. Siswa tidak tahu mana konsep yang paling luas/induk, mana yang merupakan pecahan cabang berikutnya, dan mana yang paling kecil.
2. **Ketiadaan Garis Rel Alur (Timeline Stepper Rail)**:
   Tidak ada garis alur vertikal yang menghubungkan urutan konsep, sehingga terlihat seperti tumpukan card terpisah tanpa ikatan alur logika.
3. **Kebutuhan Desain Bersih & Anti-Neon (Sesuai Arahan Eka)**:
   - Gunakan palet tenang: soft sage `#f4f7ee`, clean white `#ffffff`, border hairline `#dce4d6`, aksen zaitun matang `#4b6623` dan `#779f2f`. Nol warna neon/glow.
   - Tambahkan nomor langkah bernomor dua digit (`01`, `02`, `03`...) di dalam lingkaran penanda.
   - Tambahkan label hierarki penjelas tingkatan:
     - `01`: `PONDASI SEMESTA INDUK (TERLUAS)`
     - `02`: `SUB-HIMPUNAN TINGKAT 1`
     - `03`: `SUB-HIMPUNAN TINGKAT 2`
     - `04`: `ELEMEN DASAR & ANGGOTA`
     - `05`: `ELEMEN INTI TERKECIL`
   - Berikan badge arah baca di header kartu: `Urutan: 01 Terluas ➔ 05 Terkecil` (atau `01 Tahap Awal ➔ Selesai`).
   - Sertakan badge notasi matematika formal di sisi kanan (`[ℝ]`, `[ℚ]`, `[ℤ]`, `[ℕ]`).

---

## 2. DETAIL SPESIFIKASI IMPLEMENTASI

Di `src/components/common/DiagramRenderer.tsx`:

### A. Ekstraksi Notasi Simbol & Label Hirarki
Tambahkan helper untuk memisahkan nama konsep dan simbol notasi:
```tsx
function parseConceptLabelAndSymbol(text: string): { label: string; symbol: string | null } {
  const clean = text.replace(/^[┌└├│─┬┴┼┐┘┤┴┬│─╔╚╠║═╦╩╬╗╝╣+=•↳\s\-–—]+/g, "").trim();
  // Cek apakah ada notasi simbol di dalam kurung atau tanda sama dengan di akhir
  const parenMatch = clean.match(/^(.*?)\s*\(([^()]+)\)$/);
  if (parenMatch && parenMatch[2].length <= 15) {
    return { label: parenMatch[1].trim(), symbol: parenMatch[2].trim() };
  }
  const eqMatch = clean.match(/^(.*?)\s*=\s*(.+)$/);
  if (eqMatch && eqMatch[2].length <= 20) {
    return { label: eqMatch[1].trim(), symbol: eqMatch[2].trim() };
  }
  return { label: clean, symbol: null };
}

function getHierarchyLevelTag(depth: number, total: number, isRoot: boolean): string {
  if (isRoot || depth === 0) return "PONDASI SEMESTA INDUK (TERLUAS)";
  if (depth === 1) return "SUB-HIMPUNAN TINGKAT 1";
  if (depth === 2) return "SUB-HIMPUNAN TINGKAT 2";
  if (depth === 3) return "ELEMEN DASAR & ANGGOTA";
  return "ELEMEN INTI TERKECIL";
}
```

### B. Komponen Render `renderVisualDiagramOrPre` (Numbered Stepper Flow)
Pada `renderVisualDiagramOrPre`:
Ketika mendeteksi `hasBoxChars`:
1. Ekstrak data pohon melalui `parseConceptTreeFromAscii`.
2. Jika `tree.isLinear`: render sebagai **Vertical Numbered Stepper Flow**:
```tsx
  if (hasBoxChars) {
    const tree = parseConceptTreeFromAscii(rawText);

    if (tree.isLinear && tree.linearNodes.length > 0) {
      // Gabungkan root + linearNodes menjadi daftar bertingkat bernomor
      const allSteps = [
        { depth: 0, label: tree.root },
        ...tree.linearNodes.filter(n => n.label.toLowerCase() !== tree.root.toLowerCase())
      ];

      return (
        <div
          className="visual-diagram-card concept-stepper-card"
          style={{
            margin: "20px 0",
            backgroundColor: "#ffffff",
            border: "1px solid #dce4d6",
            borderRadius: 12,
            padding: "18px 20px",
            boxShadow: "0 2px 8px rgba(24, 34, 31, 0.03)"
          }}
        >
          {/* Header Card dengan Petunjuk Alur */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid #edf2ea",
              paddingBottom: 10,
              marginBottom: 16,
              flexWrap: "wrap",
              gap: 8
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", backgroundColor: "#4b6623" }} />
              <span
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 11,
                  fontWeight: 800,
                  color: "#3d541b",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em"
                }}
              >
                ALUR HIERARKI KONSEP
              </span>
            </div>
            <span
              style={{
                fontSize: 11,
                color: "#52635a",
                fontWeight: 600,
                backgroundColor: "#f4f7ee",
                padding: "3px 10px",
                borderRadius: 999,
                border: "1px solid #dce4d2"
              }}
            >
              Urutan: 01 Terluas ➔ {String(allSteps.length).padStart(2, "0")} Terkecil
            </span>
          </div>

          {/* Stepper Timeline Nodes */}
          <div style={{ position: "relative", paddingLeft: 30, display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Garis Rel Vertikal */}
            <div
              style={{
                position: "absolute",
                left: 11,
                top: 14,
                bottom: 14,
                width: 2,
                backgroundColor: "#dce4d6"
              }}
            />

            {allSteps.map((step, sIdx) => {
              const { label, symbol } = parseConceptLabelAndSymbol(step.label);
              const isRoot = sIdx === 0;
              const stepNumber = String(sIdx + 1).padStart(2, "0");
              const levelTag = getHierarchyLevelTag(step.depth, allSteps.length, isRoot);

              return (
                <div
                  key={sIdx}
                  style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: isRoot ? "10px 14px" : "9px 14px",
                    backgroundColor: isRoot ? "#f4f7ee" : "#ffffff",
                    border: isRoot ? "1.5px solid #c8d8be" : "1px solid #dce2d8",
                    borderLeft: !isRoot ? (step.depth === 1 ? "3.5px solid #4b6623" : "3.5px solid #779f2f") : "1.5px solid #c8d8be",
                    borderRadius: 8,
                    flexWrap: "wrap",
                    gap: 8
                  }}
                >
                  {/* Lingkaran Angka Stepper */}
                  <div
                    style={{
                      position: "absolute",
                      left: -30,
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      backgroundColor: isRoot ? "#4b6623" : step.depth === 1 ? "#65a30d" : "#779f2f",
                      color: "#ffffff",
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 11,
                      fontWeight: 800,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 0 0 3px #ffffff"
                    }}
                  >
                    {stepNumber}
                  </div>

                  {/* Konten Judul & Tag */}
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <div
                      style={{
                        fontSize: 9.5,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        color: isRoot ? "#4b6623" : "#61726a",
                        marginBottom: 2
                      }}
                    >
                      {levelTag}
                    </div>
                    <div
                      style={{
                        fontSize: isRoot ? 13.5 : 13,
                        fontWeight: isRoot ? 800 : 700,
                        color: "#18221f",
                        lineHeight: 1.35
                      }}
                    >
                      <MathView text={label} />
                    </div>
                  </div>

                  {/* Badge Notasi Matematika Formal di Kanan */}
                  {symbol && (
                    <span
                      style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: 11.5,
                        fontWeight: 700,
                        color: isRoot ? "#3d541b" : "#45544e",
                        backgroundColor: isRoot ? "#ffffff" : "#f6f8f4",
                        border: isRoot ? "1px solid #c8d8be" : "1px solid #e1e7dc",
                        padding: "2px 8px",
                        borderRadius: 6,
                        whiteSpace: "nowrap"
                      }}
                    >
                      <MathView text={symbol} />
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // Jika 2-pilar branches (Sistem Bilangan Riil -> Rasional vs Irasional)
    // Terapkan nomor urut 01 (Induk) -> 02A (Cabang Kiri) & 02B (Cabang Kanan)
    ...
```

### C. Responsivitas Mobile & Cetak di `src/index.css`
Pastikan:
```css
.concept-stepper-card {
  break-inside: avoid !important;
  page-break-inside: avoid !important;
}

@media (max-width: 480px) {
  .concept-stepper-card {
    padding: 14px 12px 14px 16px !important;
  }
}
```

---

## 3. ACCEPTANCE CRITERIA
- [ ] Diagram konsep menyajikan nomor urut bertahap `01`, `02`, `03`... di dalam lingkaran berwarna zaitun yang tersambung garis rel vertikal.
- [ ] Header kartu memuat petunjuk arah urutan: `Urutan: 01 Terluas ➔ 0X Terkecil`.
- [ ] Setiap tingkat memiliki label cakupan: `PONDASI SEMESTA INDUK`, `SUB-HIMPUNAN TINGKAT 1`, `SUB-HIMPUNAN TINGKAT 2`, dll.
- [ ] Sisi kanan menampilkan notasi simbol matematika formal (`ℝ`, `ℚ`, `ℤ`, `ℕ`).
- [ ] Warna tenang, elegan, minimalis (anti-neon).
- [ ] Tampil rapi dan mudah dipahami baik di desktop maupun mobile.
- [ ] `npm run build` sukses.
- [ ] `env TANKA_DB_PATH=:memory: node --test tests/*.test.js` 83/83 pass.
- [ ] DILARANG melakukan `git push` ke remote GitHub.
