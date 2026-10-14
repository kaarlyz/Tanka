# TASK: TASK-MINDMAP-UX-005
## STATUS
VERIFIED & COMPLETED

## METADATA
- Project: Tanka (/home/vallencia/Projects/tanka)
- Target File: src/components/common/InteractiveMindMap.tsx
- Assigned: MARAKA (maraka)
- Reviewer & QA: AURA (gikano)
- Authority: Eka

## OBJECTIVE
Sempurnakan visualisasi Peta Konsep (Radial / Mind Map) di `InteractiveMindMap.tsx`: perbaiki arah alur baca LTR, aktifkan text-wrap dua baris tanpa elipsis prematur, standarisasi warna garis konektor ke palet Tanka, buat kelengkungan kurva bezier organik, dan terapkan auto-fit centering on load.

## SCOPE OF WORK
1. **Arah Alur Baca Logis (Eliminasi Inversi LTR)**:
   - Di `src/components/common/InteractiveMindMap.tsx` baris 397-405:
     Atur pembagian cabang:
     * Jika total bab <= 3, arahkan bab awal dari kiri ke kanan secara hierarkis (atau `leftBranches` memuat Tahap 1, `rightBranches` memuat Tahap 2).
     * Jika dua sisi, urutkan agar Bab 1 tidak ditaruh di kanan mendahului Bab 2 di kiri.
2. **Eliminasi Pemotongan Teks Prematur (Multi-line Text Wrap)**:
   - Di baris 1466-1478:
     * Ubah `whiteSpace: "nowrap"` menjadi `whiteSpace: "normal"`, `lineHeight: 1.35`.
     * Berikan batas lebar dinamis: `width: node.width`, `maxWidth: 240`.
     * Pastikan judul bab dapat melipat rapi ke baris kedua tanpa terpotong `...`.
3. **Standardisasi Palet Warna Garis (Tanka Design System)**:
   - Standarisasi warna garis konektor SVG:
     * Garis cabang utama: `#4b6623` (hijau zaitun Tanka, `strokeWidth: 2`).
     * Garis sub-modul / daun: `#9ab88f` (sage zaitun lembut, `strokeWidth: 1.5`).
     * Garis cabang aktif/terpilih: `#283918` (`strokeWidth: 2.5`, `strokeOpacity: 0.95`).
   - Hilangkan warna biru elektrik `#2563eb` dan hitam pekat acak.
4. **Kelengkungan Kurva Bezier Organik**:
   - Di baris 1378-1386:
     Berikan offset kelengkungan minimum pada kurva bezier agar garis tidak datar kaku:
     `const dx = Math.max(36, Math.abs(x2 - x1) * 0.52);`
5. **Auto-Fit Viewport & Centering on Mount**:
   - Hitung bounding box graf saat mount/update dan posisikan graf di tengah kanvas secara otomatis.

## NON-GOALS
- Jangan mengubah struktur parser data `parseMarkdownToMindMapTree()`.
- Jangan merusak mode `Alur Belajar (Roadmap)` yang sudah rapi dan stabil.
- Jangan menambah npm dependency baru.

## ACCEPTANCE CRITERIA
- [x] Bab 1 dan Bab 2 tersusun dengan arah alur logis yang mudah dipahami.
- [x] Judul bab tidak terpotong `...`, dapat melipat menjadi 2 baris rapi.
- [x] Warna garis konsisten menggunakan palet zaitun/sage Tanka, tidak belang biru-hitam.
- [x] Garis penghubung memiliki kurva bezier lembut dan tidak kaku.
- [x] Saat dibuka, posisi diagram otomatis terpusat di tengah kanvas (0 kartu terpotong batas tepi).
- [x] `npm run build` sukses 100%.
- [x] `npm test` lolos 83/83 tes tanpa regresi.

## VERIFICATION
- Headless browser screenshot audit pada resolusi desktop (1280x800) dan mobile (390x844).
- `node --test tests/*.test.js`
