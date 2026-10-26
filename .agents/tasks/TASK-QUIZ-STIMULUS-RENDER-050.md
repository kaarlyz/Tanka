# TASK-QUIZ-STIMULUS-RENDER-050: Render Reading Stimulus / Passage Text in QuizTab (Latihan Soal)

## METADATA
- Project: Tanka (`/home/vallencia/Projects/tanka`)
- Target Files:
  - `src/components/tabs/QuizTab.tsx`
  - `tests/quizStimulusRender.test.js`
- Executor: MARAKA (`maraka`)
- Auditor: AURA (`gikano`)
- Authority: Eka

---

## 1. Problem Statement
Pada modul **Latihan Soal** (`src/components/tabs/QuizTab.tsx`), butir soal TKA Bahasa Indonesia (dan mata pelajaran lain berbasis literasi) hanya menampilkan kalimat pertanyaan (misal: *"Apa makna kata hajatan pada teks tersebut?"*) tanpa menampilkan teks bacaan/cerita (*stimulus*).
Akibatnya:
1. Siswa tidak bisa menjawab soal karena teks cerita pendukung (*"Tradisi Buwuhan"*, *"Pantai Bersih"*, dll.) yang tersimpan di field `currentQuestion.stimulus` tidak dirender sama sekali di layar.
2. Berbeda dengan menu **Bedah Soal** (`ExamDrillView.tsx`) yang sudah merender `currentQ.stimulus`, `QuizTab.tsx` sama sekali belum memiliki elemen rendering untuk `currentQuestion.stimulus`.

---

## 2. Spesifikasi Implementasi

### A. Render Stimulus Bacaan pada Active Question (`src/components/tabs/QuizTab.tsx`)
1. Di atas kalimat pertanyaan (`<MathView text={currentQuestion?.question} />`) atau di bawah gambar `imageUrl`:
   ```tsx
   {currentQuestion?.stimulus && (
     <div
       className="quiz-stimulus-card"
       style={{
         padding: "16px 18px",
         backgroundColor: "#fbfcf9",
         border: "1px solid #e2e6de",
         borderLeft: "3.5px solid #72a728",
         borderRadius: 8,
         marginBottom: 16,
         fontSize: 13.5,
         lineHeight: 1.7,
         color: "#283430"
       }}
     >
       <div
         style={{
           fontSize: 11,
           fontWeight: 700,
           color: "#56615d",
           textTransform: "uppercase",
           letterSpacing: "0.5px",
           marginBottom: 8,
           display: "flex",
           alignItems: "center",
           gap: 6
         }}
       >
         <BookOpen size={13} color="#72a728" />
         <span>Teks Bacaan / Stimulus Cerita</span>
       </div>
       <div style={{ maxHeight: 380, overflowY: "auto", paddingRight: 4 }}>
         <MathView text={currentQuestion.stimulus} />
       </div>
     </div>
   )}
   ```
2. Pastikan stimulus tampil baik di:
   - Mode Belajar (*Study Mode*)
   - Mode Ujian Berwaktu (*Exam Mode*)
   - Layar Pembahasan / Evaluasi Akhir (*Quiz Review / Result Details*)

### B. Unit Test (`tests/quizStimulusRender.test.js`)
Buat test suite yang memverifikasi:
1. `QuizTab.tsx` memuat kode rendering untuk `currentQuestion?.stimulus` atau `q.stimulus`.
2. Validasi struktur JSON quiz yang memiliki field `stimulus` tetap valid pada `validateAndNormalizeQuiz`.

---

## 3. Verification Protocol
1. `npm test` passing (130+ passing).
2. `npm run build` passing tanpa error.

---

## 4. Execution & Verification Report
- Status: `VERIFIED`
- Executor: MARAKA (`maraka`)
- Auditor: AURA (`gikano`)
- Authority: Eka
- Files Modified/Created:
  - `src/components/tabs/QuizTab.tsx`:
    - Added paper-ledger container (`quiz-stimulus-card`) rendering `currentQuestion?.stimulus` in active question card (study mode & exam mode) above question body.
    - Added review breakdown list in completed screen (`isQuizCompleted || (quizMode === "exam" && examSubmitted)`) rendering `q.stimulus` in paper-ledger container with header 'Teks Bacaan / Stimulus Cerita'.
  - `tests/quizStimulusRender.test.js`:
    - Created test suite verifying rendering patterns in `QuizTab.tsx` and stimulus preservation in `validateAndNormalizeQuiz` & `validateAndNormalizeQuizQuestion`.
- Verification Evidence:
  - `node --test tests/quizStimulusRender.test.js`: 3/3 passed.
  - `npm test`: 135/135 passed (0 failed).
  - `npm run build`: Vite build completed in 463ms with 0 errors.
- Hand-off: Siap diaudit AURA.
