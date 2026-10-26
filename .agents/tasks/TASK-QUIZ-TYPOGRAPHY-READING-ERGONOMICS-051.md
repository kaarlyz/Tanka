# TASK-QUIZ-TYPOGRAPHY-READING-ERGONOMICS-051: Editorial Reading Typography & Paragraph Separation in QuizTab & ExamDrillView

## METADATA
- Project: Tanka (`/home/vallencia/Projects/tanka`)
- Target Files:
  - `src/components/tabs/QuizTab.tsx`
  - `src/components/tabs/ExamDrillView.tsx`
  - `src/components/common/MathView.tsx`
  - `tests/quizTypographyErgonomics.test.js`
- Executor: MARAKA (`maraka`)
- Auditor: AURA (`gikano`)
- Authority: Eka

---

## 1. Problem Statement
Saat mengerjakan **Latihan Soal** (`QuizTab.tsx`), antarmuka terasa melelahkan di mata dan membingungkan pembaca:
1. **Teks Cerita Menjadi Satu Balok Raksasa Tanpa Paragraf:**
   Di `MathView.tsx`, teks tanpa rumus matematika dirender ke dalam `<span>{text}</span>`. Browser HTML secara bawaan menelan karakter newline `\n` menjadi satu spasi biasa.
   Akibatnya: Judul naskah, Paragraf 1 (960 karakter), Paragraf 2 (883 karakter), label "Sumber:", dan kutipan jurnal tersedot menjadi satu balok teks raksasa tanpa jeda paragraf sama sekali.
2. **Batas Antara Stimulus, Pertanyaan, dan Pilihan Jawaban Kabur:**
   Kotak stimulus dan kalimat pertanyaan menempel terlalu rapat tanpa hierarki visual yang tegas, sehingga pengguna harus "meraba-raba" di mana cerita berakhir dan di mana pertanyaan dimulai.

---

## 2. Spesifikasi Implementasi (Acuan Mintlify / Editorial Reading System)

### A. Struktur Semantis Bacaan pada Stimulus (`QuizTab.tsx` & `ExamDrillView.tsx`)
Bungkus parsing teks stimulus ke helper semantis terstruktur (`renderFormattedStimulus(stimulusText: string)`):
1. **Deteksi Judul & Paragraf:**
   - Pisahkan teks berdasarkan baris baru (`\n` atau `\n\n`).
   - Baris pertama (jika pendek atau berformat judul) dirender sebagai judul teks bacaan:
     `font-size: 15px`, `font-weight: 700`, `color: #17201d`, `margin-bottom: 12px`.
   - Baris paragraf isi bacaan dirender dalam tag `<p>` mandiri:
     `font-size: 14px`, `line-height: 1.75`, `color: #283430`, `margin: 0 0 14px 0`, `text-align: justify`.
   - Baris referensi/sitasi (diawali `"Sumber:"`, `"Rachmawati"`, dll.):
     Dipisahkan dengan garis tipis (`border-top: 1px dashed #e2e6de`, `margin-top: 16px`, `padding-top: 8px`), `font-size: 12px`, `font-style: italic`, `color: #6f7975`.
2. **Container Card Stimulus:**
   - Background `#fdfefc`, border `1px solid #dce1da`, border-left `4px solid #15803d` (hijau aksen), border-radius `10px`, padding `18px 22px`.
   - Header: Icon `BookOpen`, label `TEKS BACAAN / STIMULUS CERITA`, font-size `11px`, bold, uppercase, `letter-spacing: 0.5px`, color `#4a5752`.
   - Margin bawah tegas: `margin-bottom: 24px`.

### B. Kontainer Pertanyaan yang Jelas & Mandiri (`QuizTab.tsx`)
1. Jangan biarkan kalimat pertanyaan melayang tanpa pembatas di bawah stimulus.
2. Bungkus pertanyaan dalam kontainer tersendiri:
   ```tsx
   <div
     className="quiz-question-box"
     style={{
       backgroundColor: "#f7f9f6",
       border: "1px solid #e1e7dd",
       borderRadius: 10,
       padding: "16px 20px",
       marginBottom: 20
     }}
   >
     <div style={{ fontSize: 11, fontWeight: 800, color: "#15803d", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>
       Pertanyaan No. {currentQuestionIndex + 1}
     </div>
     <div style={{ fontSize: 15.5, fontWeight: 700, lineHeight: 1.6, color: "#111815" }}>
       <MathView text={currentQuestion?.question} />
     </div>
   </div>
   ```

### C. Proteksi Whitespace `MathView.tsx`
1. Pada `MathView.tsx`, ketika `renderedHTML === null` (tidak ada token matematika), pastikan:
   ```tsx
   return <span className={className} style={{ whiteSpace: "pre-line", ...style }}>{text}</span>;
   ```
   Dengan demikian, setiap karakter `\n` dan `\n\n` tetap dihormati oleh browser sebagai baris baru/paragraf, bukan dilebur menjadi satu spasi.

### D. Unit Test (`tests/quizTypographyErgonomics.test.js`)
Buat test suite yang memverifikasi:
1. `MathView` mempertahankan `whiteSpace: "pre-line"` pada rendering teks murni tanpa token matematika.
2. `QuizTab.tsx` dan `ExamDrillView.tsx` memuat struktur pemisah semantis paragraf bacaan dan kontainer pertanyaan mandiri.

---

## 3. Verification Protocol
1. `npm test` -> semua test passing (140/140 passing, 0 error).
2. `npm run build` -> Vite build passing (0 error).

---

## 4. Execution & Verification Log
- Status: VERIFIED
- Changed Files:
  - `src/components/common/MathView.tsx` (whiteSpace: "pre-line" pada non-math fallback branch)
  - `src/components/tabs/QuizTab.tsx` (helper `renderFormattedStimulus` semantis + `.quiz-question-box` card)
  - `src/components/tabs/ExamDrillView.tsx` (helper `renderFormattedStimulus` semantis + `.quiz-question-box` card)
  - `tests/quizTypographyErgonomics.test.js` (5 unit tests covering typography & reading ergonomics)
- Test Evidence:
  - `node --test tests/quizTypographyErgonomics.test.js`: 5/5 pass
  - `npm test`: 140/140 pass (0 failures)
  - `npm run build`: built in 373ms with 0 errors
