# TASK: TASK-LANDING-MODULAR-SPLIT-035
## STATUS
READY

## METADATA
- Project: Tanka (/home/vallencia/Projects/tanka)
- Mode: ARCHITECTURE & ENGINEERING SPECIFICATION
- Target File: `src/components/landing/LandingPage.tsx` (Saat ini: 2.982 baris / 104 KB)
- Assigned Architect & Auditor: AURA (gikano)
- Assigned Builder & Executor: MARAKA (maraka)
- Manager: Vallencia (default)
- Authority: Eka
- Date: 2026-10-15

---

## 1. OBJECTIVE & ROOT CAUSE ANALYSIS

### Akar Masalah Monolith 2.982 Baris
Berdasarkan investigasi `TASK-PERF-BASELINE-AUDIT-017`:
1. `src/components/landing/LandingPage.tsx` berukuran 2.982 baris (104.167 bytes).
2. Dari baris 190 hingga 1996 (**1.806 baris**) berisi string CSS inline raksasa di dalam tag JSX `<style>{`...`}</style>`.
3. Setiap kali agen membaca file ini (`read_file`), sistem membakar ~30.000 token input per turn.
4. Setiap kali komponen dirender di React, template literal CSS 1.800 baris ini dievaluasi ulang, memicu beban memori dan layout engine yang sia-sia.

### Target Arsitektur
1. Ekstraksi seluruh 1.806 baris CSS ke file stylesheet terpisah: `src/components/landing/landing.css`.
2. Dekomposisi 10 segmen JSX menjadi sub-komponen modular atomik di bawah `src/components/landing/`.
3. `LandingPage.tsx` dipangkas menjadi komponen orkestrator ramping (<150 baris) yang hanya mengelola *top-level state* dan menyusun sub-komponen.

---

## 2. MODULAR FILE TREE SPECIFICATION

Struktur folder baru di `src/components/landing/`:

```
src/components/landing/
├── landing.css                     # [Baru] Ekstraksi 1.806 baris stylesheet dari <style> JSX
├── LandingNavbar.tsx               # [Baru] Top navigation bar, auth buttons, branding (~60 baris)
├── HeroSection.tsx                 # [Baru] Headline kiri, value prop, CTA launcher (~90 baris)
├── SimulatorNaraCard.tsx           # [Baru] Simulator chat bubble, KaTeX chips, input bar (~130 baris)
├── HeroWorkspacePreview.tsx        # [Baru] Preview workspace mockup window + 3 badges (~80 baris)
├── MarqueeTicker.tsx               # [Baru] Seamless infinite ticker tanpa emoji (~60 baris)
├── StudioCockpit.tsx               # [Baru] Living stage: 5 dock switcher & apparatus screen (~280 baris)
├── ComparisonLedger.tsx            # [Baru] Dual battle card: Cara Lama vs Cara Tanka (~80 baris)
├── PersonasSection.tsx             # [Baru] 3 kartu persona mahasiswa & siswa (~90 baris)
├── StepperSection.tsx              # [Baru] 5 langkah fitur interaktif + detail card (~120 baris)
├── CtaBanner.tsx                   # [Baru] Full-width finale CTA banner (~50 baris)
├── LandingFooter.tsx               # [Baru] Footer atribusi resmi Eka Restu Syahputra (~70 baris)
└── LandingPage.tsx                 # [Refaktor] Orkestrator ramping (<150 baris)
```

---

## 3. COMPONENT INTERFACE & CONTRACT SPECIFICATION

### 1. `landing.css`
- **Sumber Baris**: Baris 190 s/d 1996 dari `LandingPage.tsx`.
- **Aturan**: Hapus tag pembungkus `<style>{` dan `}</style>`. Simpan sebagai CSS murni.
- **Import**: Diimpor sekali di bagian paling atas `LandingPage.tsx` via `import "./landing.css";`.

### 2. `LandingNavbar.tsx`
- **Tanggung Jawab**: Merender bar navigasi atas fixed/sticky dengan blur effect, logo Tanka, tautan navigasi section, dan tombol Auth (Masuk / Mulai Belajar).
- **Props Interface**:
  ```ts
  export interface LandingNavbarProps {
    onActionLaunch: (tab?: string) => void;
    onOpenAuth: (mode?: "login" | "register") => void;
    currentUser?: any;
  }
  ```

### 3. `SimulatorNaraCard.tsx`
- **Tanggung Jawab**: Merender kolom kanan Hero: simulator chat interaktif Nara AI, chip pertanyaan berkategori KaTeX, animasi *thinking indicator*, dan input single bar interaktif.
- **Props Interface**:
  ```ts
  export interface HeroQuestionItem {
    q: string;
    a: string;
    math?: string;
    tag: string;
  }

  export interface SimulatorNaraCardProps {
    heroQuestions: HeroQuestionItem[];
    activeHeroQ: number;
    onSelectQuestion: (idx: number) => void;
    isHeroThinking: boolean;
    heroPromptInput: string;
    onHeroPromptChange: (val: string) => void;
    onSubmitPrompt: (e: React.FormEvent) => void;
  }
  ```

### 4. `HeroSection.tsx`
- **Tanggung Jawab**: Merender layout 2-kolom hero: Headline utama "Asisten Belajar Mandiri Berbasis Kurikulum Adaptif", value propositions, dual CTA button ("Mulai Belajar Sekarang" & "Eksplorasi Fitur"), dan membungkus `SimulatorNaraCard`.
- **Props Interface**:
  ```ts
  export interface HeroSectionProps {
    onActionLaunch: (tab?: string) => void;
    onOpenAuth: (mode?: "login" | "register") => void;
    simulatorCard: React.ReactNode;
  }
  ```

### 5. `HeroWorkspacePreview.tsx`
- **Tanggung Jawab**: Merender floating badges (LaTeX AST, 100% Client-Side, Zero Lag) dan jendela mockup interaktif workspace Tanka.
- **Props Interface**:
  ```ts
  export interface HeroWorkspacePreviewProps {
    onActionLaunch: (tab?: string) => void;
  }
  ```

### 6. `MarqueeTicker.tsx`
- **Tanggung Jawab**: Merender infinite scrolling ticker dengan item fitur unggulan tanpa emoji dekoratif (KaTeX Math, Spaced Repetition, Offline-First PWA, Feynman Technique, Mind Map Graph).
- **Props Interface**: Komponen statis murni tanpa props (atau opsional `items?: string[]`).

### 7. `StudioCockpit.tsx`
- **Tanggung Jawab**: Merender bento grid showcase utama:
  - 5-Mode Floating Studio Dock: `"nara" | "video" | "quiz" | "graph" | "offline"`.
  - Left Spec & Rationale Rail (analisis teknis, metrik, tombol aksi).
  - Right Apparatus Screen: layar simulasi interaktif dinamis sesuai mode yang dipilih.
- **Props Interface**:
  ```ts
  export interface StudioCockpitProps {
    studioMode: "nara" | "video" | "quiz" | "graph" | "offline";
    onSelectStudioMode: (mode: "nara" | "video" | "quiz" | "graph" | "offline") => void;
    quizSelected: string | null;
    onSelectQuiz: (ans: string) => void;
    ytUrlInput: string;
    onYtUrlChange: (val: string) => void;
    isYtProcessing: boolean;
    ytProcessed: boolean;
    onSimulateYt: () => void;
    activeGraphNode: string;
    onSelectGraphNode: (node: string) => void;
    isOfflineMode: boolean;
    onToggleOfflineMode: () => void;
    onActionLaunch: (tab?: string) => void;
  }
  ```

### 8. `ComparisonLedger.tsx`
- **Tanggung Jawab**: Merender kartu komparasi *side-by-side*: Cara Konvensional (statis, pasif, tanpa bimbingan) vs Cara Tanka (aktif, multimodal, KaTeX instan).
- **Props Interface**: Komponen statis murni.

### 9. `PersonasSection.tsx`
- **Tanggung Jawab**: Merender 3 kartu persona pelajar: Dafa (Teknik Elektro), Nadia (Target Kedokteran SNBT), dan Rian (Siswa SMA).
- **Props Interface**: Komponen statis murni.

### 10. `StepperSection.tsx`
- **Tanggung Jawab**: Merender panduan 5 langkah penguasaan konsep: tab horizontal bernomor + kartu detail aktif interaktif.
- **Props Interface**:
  ```ts
  export interface StepItem {
    title: string;
    desc: string;
    icon: string;
    preview: {
      tag: string;
      title: string;
      content: string;
      detail: string;
    };
  }

  export interface StepperSectionProps {
    steps: StepItem[];
    activeStep: number;
    onSelectStep: (idx: number) => void;
    onActionLaunch: (tab?: string) => void;
  }
  ```

### 11. `CtaBanner.tsx`
- **Tanggung Jawab**: Merender banner penutup full-width dengan call-to-action kuat dan tombol registrasi cepat.
- **Props Interface**:
  ```ts
  export interface CtaBannerProps {
    onActionLaunch: (tab?: string) => void;
    onOpenAuth: (mode?: "login" | "register") => void;
  }
  ```

### 12. `LandingFooter.tsx`
- **Tanggung Jawab**: Merender footer resmi aplikasi.
- **PENTING**: Wajib mencantumkan hak cipta resmi *"Designed & Architected by Eka Restu Syahputra"*. **Dilarang keras menyertakan tautan ke repositori GitHub**.
- **Props Interface**:
  ```ts
  export interface LandingFooterProps {
    onActionLaunch: (tab?: string) => void;
  }
  ```

### 13. `LandingPage.tsx` (Orkestrator Ramping)
- **Tanggung Jawab**:
  - Mengimpor `./landing.css`.
  - Mengelola *top-level state* (`activeStep`, `activeHeroQ`, `isHeroThinking`, `heroPromptInput`, `quizSelected`, `ytUrlInput`, `isYtProcessing`, `ytProcessed`, `activeGraphNode`, `isOfflineMode`, `studioMode`).
  - Menginisialisasi `IntersectionObserver` untuk animasi scroll reveal.
  - Merender sub-komponen dalam urutan yang tepat.
  - Panjang file: **< 150 baris kode**.

---

## 4. BOUNDED IMPLEMENTATION CONTRACT UNTUK MARAKA

Eksekusi modularisasi ini didelegasikan ke MARAKA via perintah CLI tunggal:

```bash
maraka -z "Kerjakan refaktor modularisasi LandingPage Tanka sesuai TASK-LANDING-MODULAR-SPLIT-035.md:
1. Ekstrak 1.806 baris CSS inline di src/components/landing/LandingPage.tsx (baris 190-1996) ke src/components/landing/landing.css murni tanpa tag <style>.
2. Buat sub-komponen baru di src/components/landing/:
   - LandingNavbar.tsx
   - SimulatorNaraCard.tsx
   - HeroSection.tsx
   - HeroWorkspacePreview.tsx
   - MarqueeTicker.tsx
   - StudioCockpit.tsx
   - ComparisonLedger.tsx
   - PersonasSection.tsx
   - StepperSection.tsx
   - CtaBanner.tsx
   - LandingFooter.tsx (pastikan zero GitHub link, atribusi hak cipta Eka Restu Syahputra utuh)
3. Rampingkan src/components/landing/LandingPage.tsx menjadi orkestrator bersih (<150 baris) yang mengimpor landing.css dan seluruh sub-komponen.
4. Verifikasi dengan:
   - npm run build (wajib sukses <1s)
   - env TANKA_DB_PATH=:memory: node --test --test-concurrency=1 tests/*.test.js (wajib 83/83 lulus)
5. Jangan mengubah logika visual, styling class, atau UX yang sudah ada (100% visual parity)."
```

---

## 5. ACCEPTANCE CRITERIA
- [ ] 11 file sub-komponen modular dan 1 file CSS tercipta rapi di `src/components/landing/`.
- [ ] `LandingPage.tsx` ramping di bawah 150 baris kode.
- [ ] Pembakaran token input untuk pembacaan komponen landing berkurang dari ~30.000 menjadi <2.000 token.
- [ ] `npm run build` sukses tanpa error TypeScript / bundling.
- [ ] Seluruh unit test suite lulus 83/83 passing (100%).
- [ ] Atribusi Eka Restu Syahputra di footer terjaga dan nol tautan GitHub publik.
- [ ] Visual parity terverifikasi identik pada desktop (1920x1080) dan mobile (390x844).