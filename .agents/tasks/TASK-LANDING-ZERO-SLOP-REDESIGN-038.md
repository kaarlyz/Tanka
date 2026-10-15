# TASK: TASK-LANDING-ZERO-SLOP-REDESIGN-038
## MODE: VISUAL_PRODUCT & REFACTOR ARCHITECTURE
## SURFACE ARCHETYPE: Landing Page Enterprise Polish (Linear / Stripe Grade, Zero AI Slop)

## METADATA
- Project: Tanka (/home/vallencia/Projects/tanka)
- Target Files:
  - `src/components/landing/HeroSection.tsx`
  - `src/components/landing/HeroWorkspacePreview.tsx`
  - `src/components/landing/SimulatorNaraCard.tsx`
  - `src/components/landing/MarqueeTicker.tsx`
  - `src/components/landing/PersonasSection.tsx`
  - `src/components/landing/StepperSection.tsx`
  - `src/components/landing/CtaBanner.tsx`
  - `src/components/landing/LandingFooter.tsx`
  - `src/components/landing/landing.css`
- Assigned: MARAKA (maraka)
- Reviewer & Auditor: AURA (gikano)
- Authority: Eka

---

## 1. OBJECTIVE & AUDIT REMEDIATION
Menghapus seluruh AI design slop, klaim rekaan, jargon internal, dan elemen dekoratif berlebih pada landing page Tanka. Mengadopsi prinsip desain enterprise berstandar Linear & Stripe (kepadatan informasi yang presisi, tipografi tajam, shadow berlapis, dan nol animasi goyang yang mengganggu).

### Perubahan Spesifik per Komponen:
1. **`HeroSection.tsx` & `landing.css`**:
   - Sinkronisasi class form input hero (`.hero-input-shell`, `.hero-btn-direct`) dengan tinggi `52px`, border hairline `#dce2da`, focus ring zaitun bersih, dan tombol zaitun pekat.
   - Mengganti teks jargon `// ADAPTIVE STUDY ENGINE` menjadi label institusional `PERSIAPAN TKA & UTBK 2026`.
2. **`SimulatorNaraCard.tsx`**:
   - Menghapus klaim palsu `RESPONS: SUB-0.2ms` $ightarrow$ ganti dengan `STATUS: SIAP MENDAMPINGI`.
   - Mengintegrasikan `<MathView text="..." />` pada kotak rumus simulator agar KaTeX merender rumus himpunan dan kuadrat dengan presisi matematika penuh.
3. **`HeroWorkspacePreview.tsx`**:
   - Menghapus kotak terapung (*floating badge*) goyang yang menutupi sudut jendela pratinjau.
   - Menyempurnakan window frame browser dengan efek depth Stripe multi-layer: `box-shadow: 0 30px 60px -15px rgba(24, 34, 31, 0.12), 0 0 0 1px rgba(24, 34, 31, 0.06)`.
4. **`MarqueeTicker.tsx`**:
   - Menghapus jargon internal (`SQLITE PRIVAT`, `100% OFFLINE PWA`) $ightarrow$ ganti dengan keunggulan nyata pengguna: `DATA DI PERANGKAT ANDA`, `BERJALAN OFFLINE`, `TANPA IKLAN MENGGANGGU`.
5. **`PersonasSection.tsx`**:
   - Menghapus 5 bintang kuning generik ala template AI.
   - Mengubah kartu menjadi **3 Skenario Kasus Penggunaan Nyata** (Siswa SNBT, Mahasiswa Periset Jurnal, Pejuang Belajar Mandiri) dengan metrik bukti operasional.
6. **`StepperSection.tsx`, `CtaBanner.tsx`, `LandingFooter.tsx`**:
   - Membersihkan inline styles dan memindahkannya ke class modular `landing.css`.
   - Menyempurnakan footer dengan atribusi resmi *Designed & Architected by Eka Restu Syahputra*.
7. **`landing.css`**:
   - Menghapus blob cahaya latar belakang raksasa (`.landing-ambient-orb-1`, `.landing-ambient-orb-2`) untuk meringankan beban GPU.
   - Menetapkan skala radius konsisten: `8px` (elemen kecil), `14px` (card), `24px` (container besar).

---

## 2. ACCEPTANCE CRITERIA
- [ ] Seluruh klaim rekaan dan jargon teknis internal hilang dari tampilan publik.
- [ ] Simulator Nara merender rumus matematika dengan `<MathView />` asli.
- [ ] Testimoni bintang 5 diganti dengan skenario use-case nyata tanpa bintang palsu.
- [ ] Blob latar belakang dan elemen goyang dihapus; UI bersih, presisi, dan tenang.
- [ ] `npm run build` sukses.
- [ ] `env TANKA_DB_PATH=:memory: node --test tests/*.test.js` 85/85 pass.
- [ ] DILARANG melakukan `git push` ke remote GitHub.
