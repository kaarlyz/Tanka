# TASK: TASK-FIX-TIMELINE-RAIL-ALIGNMENT-034
## MODE: HYBRID
## SURFACE ARCHETYPE: Timeline Stepper Geometric Alignment & Zero-Drift Track

## METADATA
- Project: Tanka (/home/vallencia/Projects/tanka)
- Target File: `src/components/common/DiagramRenderer.tsx`
- Assigned: MARAKA (maraka)
- Reviewer & Auditor: AURA (gikano)
- Authority: Eka

---

## 1. OBJECTIVE & ROOT CAUSE EXPLANATION
Pengguna melaporkan:
> *"kok aga ke kiri dia garis angkanya, garisnya awal dri 1 ke 2 itu pas ditengah, pas 3 sampai seterusnya malah aga kekiri"*

### Analisis Akar Masalah Geometris:
1. Sebelumnya garis rel vertikal diposisikan secara statis dengan `position: absolute; left: 11px` pada container parent (posisi horizontal absolut = **410.94px**).
2. Lingkaran angka diposisikan dengan `position: absolute; left: -30px` **di dalam kartu masing-masing**.
3. Kartu `01` memiliki `borderLeft: 1.5px solid #c8d8be`, sehingga titik tengah lingkaran `01` berada di **413.09px** (relatif dekat dengan garis rel 410.94px).
4. Kartu `02` s/d `07` memiliki `borderLeft: 3.5px solid #4b6623 / #779f2f`. Di CSS, `left: -30px` dihitung dari padding box (di sebelah dalam border 3.5px). Akibatnya titik tengah lingkaran `02` s/d `07` terdorong ke kanan di **416.09px**!
5. Selisih 5.15px ini menyebabkan ilusi garis rel bergeser ke kiri dari angka `03` dan seterusnya.

---

## 2. DETAIL SPESIFIKASI SOLUSI (2-Column Track Layout)

Ganti struktur absolute positioning menjadi **Track Kolom Khusus (2-Column Flex Row Layout)**:
Setiap baris konsep memiliki:
1. **Kolom Kiri (Track)** dengan lebar tetap `width: 26px`:
   - Garis rel vertikal diposisikan persis di tengah track: `left: "50%", transform: "translateX(-50%)"`.
   - Lingkaran angka berada di dalam track yang sama dengan `left: "50%", transform: "translate(-50%, -50%)"` atau `margin: "auto"`.
   - Garis rel dari node atas menyambung ke node bawah tepat melalui titik tengah geometris lingkaran.
2. **Kolom Kanan (Card Content)** dengan `flex: 1`:
   - Memuat label level, nama konsep, dan badge notasi formal.
   - Ketebalan border kiri kartu (1.5px vs 3.5px) sama sekali tidak mempengaruhi posisi lingkaran dan garis rel.
3. **Hasil Matematis**:
   Pusat garis rel dan pusat seluruh lingkaran `01`, `02`, `03`, `04`, `05`, `06`, `07` terpusat 100.0% dengan deviasi 0.00px.

---

## 3. DETAIL KODE IMPLEMENTASI

Di `src/components/common/DiagramRenderer.tsx`:

Ganti blok stepper linear (`if (tree.isLinear && tree.linearNodes.length > 0)`):
```tsx
          {/* Stepper Timeline Nodes */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {allSteps.map((step, sIdx) => {
              const { label, symbol } = parseConceptLabelAndSymbol(step.label);
              const isRoot = sIdx === 0;
              const isFirst = sIdx === 0;
              const isLast = sIdx === allSteps.length - 1;
              const stepNumber = String(sIdx + 1).padStart(2, "0");
              const levelTag = getHierarchyLevelTag(step.depth, allSteps.length, isRoot);

              return (
                <div
                  key={sIdx}
                  style={{
                    display: "flex",
                    alignItems: "stretch",
                    gap: 14,
                    position: "relative"
                  }}
                >
                  {/* Track Column (Garis Rel dan Lingkaran Terpusat Sempurna 100%) */}
                  <div
                    style={{
                      width: 26,
                      flexShrink: 0,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      position: "relative"
                    }}
                  >
                    {/* Garis Rel Vertikal Atas (menyambung dari item sebelumnya) */}
                    {!isFirst && (
                      <div
                        style={{
                          position: "absolute",
                          top: -12,
                          bottom: "50%",
                          width: 2,
                          backgroundColor: "#dce4d6",
                          left: "50%",
                          transform: "translateX(-50%)",
                          zIndex: 1
                        }}
                      />
                    )}
                    {/* Garis Rel Vertikal Bawah (menyambung ke item berikutnya) */}
                    {!isLast && (
                      <div
                        style={{
                          position: "absolute",
                          top: "50%",
                          bottom: -12,
                          width: 2,
                          backgroundColor: "#dce4d6",
                          left: "50%",
                          transform: "translateX(-50%)",
                          zIndex: 1
                        }}
                      />
                    )}

                    {/* Lingkaran Angka Stepper: Terpusat di tengah garis */}
                    <div
                      style={{
                        position: "relative",
                        top: "50%",
                        transform: "translateY(-50%)",
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
                        zIndex: 2,
                        boxShadow: "0 0 0 3px #ffffff"
                      }}
                    >
                      {stepNumber}
                    </div>
                  </div>

                  {/* Card Content (Kolom Kanan) */}
                  <div
                    style={{
                      flex: 1,
                      minWidth: 0,
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
                        <MathView text={symbol.startsWith("[") && symbol.endsWith("]") ? symbol : `[${symbol}]`} />
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
```

---

## 4. ACCEPTANCE CRITERIA
- [x] Titik tengah seluruh lingkaran angka `01`, `02`, `03` s/d `07` sejajar 100.0% secara vertikal (0.00px offset).
- [x] Garis rel vertikal melewati tepat di titik pusat lingkaran dari awal hingga akhir tanpa ada pembengkokan atau kemiringan ke kiri/kanan.
- [x] `npm run build` sukses.
- [x] `env TANKA_DB_PATH=:memory: node --test tests/*.test.js` 83/83 pass.
- [x] DILARANG melakukan `git push` ke remote GitHub.

---

## 5. VERIFICATION EVIDENCE (MARAKA)
- Desktop Center X: Seluruh lingkaran 01 s/d 07 dan 12 segmen rel bernilai tepat `594.000px` (0.000px offset).
- Mobile Center X: Seluruh lingkaran 01 s/d 07 dan 12 segmen rel bernilai tepat `58.000px` (0.000px offset).
- Horizontal Overflow: 0 elemen meluap di desktop (1920x1080) dan mobile (390x844).
- Visual Inspection: Screenshot desktop & mobile divalidasi via vision model.
- Test Suite: 83/83 passed.
- Status: VERIFIED. Siap diaudit AURA.
