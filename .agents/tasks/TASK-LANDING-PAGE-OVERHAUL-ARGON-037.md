# TASK: TASK-LANDING-PAGE-OVERHAUL-ARGON-037
## STATUS
IN_PROGRESS

## METADATA
- Project: Tanka (/home/vallencia/Projects/tanka)
- Mode: ARCHITECTURE & REDESIGN SPECIFICATION (ARGON RECOMMENDATION)
- Target Components:
  - `src/components/landing/HeroSection.tsx`
  - `src/components/landing/SimulatorNaraCard.tsx`
  - `src/components/landing/MarqueeTicker.tsx`
  - `src/components/landing/ComparisonLedger.tsx`
  - `src/components/landing/landing.css`
- Assigned Architect: AURA (gikano) / Gemini 4 Argon
- Assigned Builder: MARAKA (maraka)
- Manager & QA Gatekeeper: Vallencia (default)
- Authority: Eka Restu Syahputra
- Date: 2026-10-15

---

## 1. OBJECTIVES & MOTIVATION
Berdasarkan arahan Eka ("kalau perlu redesign redesign aja, buat lebih bagus lagi keseluruhan page") dan rekomendasi Lead Product Designer Gemini 4 Argon:
1. **Direct Input Bar di Hero (`HeroSection.tsx`)**: Mengubah tombol CTA pasif menjadi input fungsional interaktif ("Paste link YouTube atau drop PDF...") dengan tombol "Bedah Materi" dan chip contoh soal TKA.
2. **Eliminasi KaTeX Runtime di Hero Fold (`SimulatorNaraCard.tsx`)**: Pre-render rumus contoh (misal limit dan matriks) menjadi notasi HTML/MathML statis yang tajam, menghilangkan latensi unduh KaTeX 300KB pada LCP mobile.
3. **Elevasi `MarqueeTicker.tsx` (Anti-Slop)**: Mengganti teks berjalan animasi yang memakan ruang vertikal 390px menjadi Trust Ledger Bar statis 4 kolom bersahaja ala Linear/Stripe.
4. **Penyempurnaan `ComparisonLedger.tsx`**: Menajamkan kontras kartu Cara Lama (red-muted border) vs Cara Tanka (emerald-active border).
5. **Mobile Ergonomics**: Wajib zero horizontal overflow (`scrollWidth === clientWidth`) pada 390x844 dan 1920x1080.

---

## 2. DETAILED COMPONENT SPECIFICATIONS

### A. `src/components/landing/HeroSection.tsx`
Tambahkan direct action form di bawah subtitle:
- Input field `type="text"` placeholder: `"Tempel link YouTube atau nama bab materi..."`
- Tombol submit `"Bedah Materi"` yang memicu `onActionLaunch()`
- Dua chip cepat di bawah input: `"Contoh: Limit Trigonometri"` dan `"Contoh: Determinan Matriks 2x2"` yang otomatis mengisi input.
- Pertahankan tombol secondary jika user ingin langsung masuk.

### B. `src/components/landing/SimulatorNaraCard.tsx`
- Hapus impor `katex` runtime yang memblokir rendering pertama.
- Gunakan render tipografi formula native (misal: `lim(x→0) (sin 3x)/(tan 5x)` dan koefisien `3/5`) dengan styling font-mono rapi dan warna emerald.

### C. `src/components/landing/MarqueeTicker.tsx`
- Ubah menjadi Trust Ledger Bar statis yang memuat 4 pilar Tanka:
  1. `[+] TKA 2026 Ready` — Matpel UTBK & Mandiri
  2. `[+] Offline PWA` — Baca tanpa internet
  3. `[+] SQLite Privat` — Data 100% di perangkatmu
  4. `[+] Zero Distraksi` — Nol iklan & sponsor

### D. `src/components/landing/landing.css`
- Tambahkan class styling untuk `.hero-input-group`, `.hero-input-field`, `.hero-action-btn`, `.hero-sample-chips`, dan `.trust-ledger-bar`.
- Jaga aturan `min-width: 0 !important; max-width: 100% !important;` agar bebas overflow.

---

## 3. VERIFICATION GATES
1. `npm test` wajib 85/85 passing.
2. `npm run build` wajib sukses (<500ms).
3. DOM Probing CDP: Viewport 390x844 dan 1920x1080 wajib `hasScroll: false`.
4. Atribusi hak cipta Eka Restu Syahputra di footer tetap utuh 100%.
