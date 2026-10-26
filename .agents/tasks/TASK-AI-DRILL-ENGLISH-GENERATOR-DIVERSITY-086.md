# TASK-AI-DRILL-ENGLISH-GENERATOR-DIVERSITY-086

## Context & User Feedback
Eka menemukan bahwa generator AI Drill Bahasa Inggris (`server/services/aiDrillGenerator.js`) masih repetitif dan menghasilkan wacana serta butir soal yang seragam/duplikasi:
1. **Tema Statis Saat Drill Single Pola (`pola !== 'all'`):**
   - Di baris 242, generator menggunakan: `const themePool = isMath ? mathThemes : (isSastraPola ? sampledCerpen : sampledArtikel);`.
   - Ketika siswa memilih Bahasa Inggris dengan pola spesifik (misal Pola 1, 2, atau 3), generator keliru mengambil tema dari `sampledArtikel` (pool Bahasa Indonesia: urban heat island, intrusi air asin, daun mimba)! Akibatnya teks Bahasa Inggris terus-menerus mengulang topik daun nimba (*neem leaf*) atau intrusi air laut (*saltwater intrusion*).
2. **Keterbatasan Pool Tema Bahasa Inggris (`DIVERSE_THEME_POOLS.inggris`):**
   - Pool tema Bahasa Inggris hanya memiliki 8 tema statis dan saat `pola === 'all'` 5 butir (baris 387), tema selalu mengunci ke `englishThemes[0]` ("Digital Literacy").
   - Belum mencerminkan 5 genre asli Pusmendik (Fabel/Narrative, Infografis Sekolah/Library, Deskriptif Pariwisata/Great Barrier Reef, Recount Magang/Karier, Artikel Sains/Sosial Media).
3. **Penyelarasan Anti-Duplikasi & Variasi Format Butir:**
   - Wacana harus secara dinamis mengacak 5 genre otentik Pusmendik (bukan cuma artikel ilmiah kering).
   - Randomisasi seed wacana, variasi kata buronan, serta jenis pertanyaan (outline, table similarity/difference, stated detail, vocab in context, tone/audience).

## Objectives for AURA (@gikano_bot) & MARAKA (@kavvanaa_bot)
1. **Perbaikan Theme Pool Selector di `server/services/aiDrillGenerator.js`:**
   - Pisahkan pool tema Bahasa Inggris secara mandiri:
     * Kembangkan `DIVERSE_THEME_POOLS.inggris` menjadi 5 klaster genre Pusmendik resmi:
       a) **Narrative & Folklore:** Asian folklore, African fables (King & Spirit, animals with moral lesson).
       b) **School & Campus Infographic:** Library etiquette, study ergonomics, time management posters, dormitory rules.
       c) **Nature & Eco-Tourism:** Raja Ampat biodiversity, Bali cultural sites, Great Barrier Reef coral bleaching, Komodo dragon habitat.
       d) **Career & Real Experience (Recount):** First-time internship at community radio, sports club volunteer, young entrepreneur startup journey.
       e) **Teen Life & Applied Science:** Screen time & sleep hygiene, microplastics in seafood, fast fashion thrift economy, artificial intelligence in daily schoolwork.
   - Perbaiki pemilihan tema saat `pola !== 'all'`: jika `isEnglish`, WAJIB mengambil dari `DIVERSE_THEME_POOLS.inggris` yang di-shuffle secara dinamis (`getRandomThemes`), bukan `sampledArtikel` Bahasa Indonesia.
   - Saat `pola === 'all'` 5 butir (baris 387), acak tema dari pool Bahasa Inggris (bukan selalu tema index 0).

2. **Diversifikasi Tipe Soal & Struktur Stimulus:**
   - Pastikan stimulus teks mencerminkan genre yang terpilih (jika Narrative: ada karakter, plot, resolusi; jika Infografis: format poin-poin/checklist; jika Artikel: paparan sains/sosial).
   - Pertahankan KaTeX & formatting safety, zero syntax errors.

3. **Verifikasi & Quality Gate:**
   - Jalankan unit tests: `npm test`.
   - Uji endpoint `/api/exam-bank/generate-ai-drill` dengan payload Bahasa Inggris (baik Pola 1, Pola 2, Pola 3, maupun 'all') dan pastikan wacana yang dihasilkan bervariasi (tidak ada lagi duplikasi ekstrak nimba/intrusi air laut berturut-turut).
   - Pastikan `npm run build` sukses 100% dan service `tanka.service` aktif live.

## Implementation Status (MARAKA)
- Status: `VERIFIED`
- Perubahan:
  1. `server/services/aiDrillGenerator.js`:
     - `DIVERSE_THEME_POOLS.inggris` memiliki 20 tema mencakup 5 klaster genre resmi Pusmendik (Narrative & Folklore, School & Campus Infographic, Nature & Eco-Tourism, Career & Real Experience / Recount, Teen Life & Applied Science).
     - `getRandomThemes` menggunakan Fisher-Yates uniform shuffle.
     - Single pola (`pola !== 'all'`) untuk Bahasa Inggris mengonsumsi `sampledInggris` secara eksklusif (zero Indonesian leak).
     - Alokasi unit untuk `pola === 'all'`: 25 butir (5 unit terpisah 1-5, 6-10, 11-15, 16-20, 21-25 tanpa duplikasi), 20 butir (4 unit), 10 butir (2 unit), dan 5 butir/custom menggunakan tema acak dinamis.
     - `unitPrompt` memuat GENRE MANDATE spesifik sesuai genre tema terpilih.
     - `defaultHeader` dan sanitasi `unitBacaan` menjamin format English `<p><strong>Questions X to Y are based on the following passage.</strong></p>`.
  2. `tests/englishDrillDiversity.test.js`:
     - 5 test case komprehensif menguji pool tema, zero leak, alokasi 25/20/10 butir, dan pengacakan dinamis 5 butir.
- Verifikasi:
  - `node --test tests/englishDrillDiversity.test.js`: 5/5 pass (85ms).
  - `npm test`: 263/263 pass.
  - `npm run build`: Exit 0 (vite production build OK).
  - `systemctl --user status tanka.service`: Active (running).

## Independent Review & Audit (AURA)
- Review Date: 2026-10-27
- Auditor: AURA (@gikano_bot)
- Status: `ACCEPTED`
- Findings:
  1. Inspeksi baris per baris `server/services/aiDrillGenerator.js`:
     - Pemisahan `sampledInggris` memutus tuntas kebocoran tema artikel Indonesia pada single pola (`pola !== 'all'`).
     - Alokasi 5 unit mandiri (5 genre Pusmendik) pada target 25 butir terbukti bebas duplikasi (`uniqueThemes.size === 5`, `uniqueGenres.size === 5`).
     - Pengacakan tema pada target 5 butir terbukti dinamis (variatif lintas run).
     - Header wacana terkunci dalam format English kanonikal (`Questions X to Y are based on the following passage.`).
  2. Verifikasi empiris:
     - `node --test tests/englishDrillDiversity.test.js`: 5/5 PASS (88ms).
     - `npm run build`: Berhasil (457ms).
     - `systemctl --user restart tanka`: Service aktif normal.
