# TASK-CBT-MATH-STIMULUS-AND-RENDERING-HARDENING-083

## Status: ACCEPTED (VERIFIED)

## Context
Eka menemukan kendala pada sesi drill Matematika di Tanka CBT (`http://localhost:3001/cbt`):
1. Saat klik tombol `[📖 Baca Wacana]`, teks wacana matematika muncul terlalu panjang dan bertele-tele seperti wacana bahasa Indonesia (padahal matematika hanya butuh stimulus ringkas: narasi studi kasus/data survei/spesifikasi teknik terapan 50-100 kata).
2. Rendering KaTeX / aljabar dan layout di frontend terkadang bocor atau teksnya berantakan jika wacana terlalu panjang.
3. Bug Kognitif Nara: Prompt di `server/routes/chat.js` masih meng-hardcode 6 Pola Baku Bahasa Indonesia untuk SEMUA mata pelajaran. Ketika siswa bertanya soal Matematika (misal Soal No 1 Himpunan/Peluang), Nara malah menjawab "Pola 3: Fakta Wacana & Data Langsung" (template B. Indo), padahal seharusnya merujuk ke 6 Pilar Matematika TKA Pusmendik (Pola 6: Himpunan, Peluang & Statistika).

## Objectives & Audit Findings
1. **Dynamic Subject Blueprint Prompt di Chat Nara (`server/routes/chat.js`)**:
   - Ditambahkan `getCbtPedagogyGuidance(subject)` membaca mapping dinamis per mapel (`SUBJECT_BLUEPRINTS`):
     * Matematika: 6 Pilar Matematika TKA Pusmendik (Pola 1 Transformasi Kurva, Pola 2 Aljabar/Kuadrat, Pola 3 SPLDV/Matriks, Pola 4 Barisan/Deret, Pola 5 Trigonometri/Dimensi 3, Pola 6 Himpunan/Peluang/Statistika) dengan mandat tegas larangan mengaitkan ke teks sastra/fakta wacana bahasa Indonesia.
     * Bahasa Inggris: 6 Official Reading Patterns Pusmendik.
     * Bahasa Indonesia, Ekonomi, Sosiologi: Sesuai blueprint domain masing-masing.
2. **Audit Generator Backend (`server/services/aiDrillGenerator.js`)**:
   - Menambahkan tema terapan matematika `DIVERSE_THEME_POOLS.matematika` (Teknik Sipil, Ekonomi Perbankan, Fisika Mekanika, Kriptografi IT, Optimasi Logistik, Statistika Terapan).
   - Memperbaiki `unitDefs` matematika agar terisolasi dari template sastra/cerpen.
   - Mengunci `unitPrompt` matematika: panjang stimulus wajib 50-100 kata, header wajib `<p><strong>Stimulus untuk soal nomor X s.d. Y</strong></p>`, dan escaping double-backslash JSON untuk KaTeX.
3. **Audit Frontend Rendering (`src/index.css` & `src/components/common/CbtContentRenderer.tsx`)**:
   - `.katex-display-wrapper` dan `.katex-block-wrapper` memiliki `overflow-x: auto !important; -webkit-overflow-scrolling: touch !important; max-width: 100% !important; padding: 4px 0 !important;`.
   - `.cbt-rendered-content .katex` memiliki `max-width: 100% !important;`.
   - `.cbt-rendered-content .katex-display` memiliki `overflow-x: auto !important; max-width: 100% !important;`.
   - Tombol `.cbt-option-btn` dan scroll kontainer `.cbt-wacana-scroll-content` diproteksi dari kebocoran layout horizontal.
4. **Verifikasi Mandiri AURA**:
   - Unit tests: `env TANKA_DB_PATH=:memory: node --test tests/mathStimulusRendering.test.js` (8/8 pass, 122ms).
   - CBT related test suite: 41/41 pass (148ms).
   - Production Build: `npm run build` sukses (503ms).
   - Runtime Service: `systemctl --user restart tanka` aktif & sehat (port 3001).
