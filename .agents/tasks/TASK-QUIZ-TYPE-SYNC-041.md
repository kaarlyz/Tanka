# TASK-QUIZ-TYPE-SYNC-041: Synchronize Quiz Difficulty Type State (DB, API, & UI)

## METADATA
- Project: Tanka (`/home/vallencia/Projects/tanka`)
- Target Files:
  - `server/db.js`
  - `server/routes/quizzes.js`
  - `src/hooks/useQuiz.ts`
  - `src/App.tsx`
  - `tests/quizValidator.test.js`
- Executor: MARAKA (`maraka`)
- Auditor: AURA (`gikano`)
- Authority: Eka

---

## 1. Konteks & Akar Masalah
Pada audit visual terkini di antarmuka kuis (`/quiz`), pill tingkat kesulitan menampilkan tombol **"Pemula"** aktif, namun butir soal yang ditampilkan di layar merupakan soal tingkat **HOTS** (model matematika peluruhan konsentrasi obat).

### Akar Masalah:
1. **Ketiadaan Kolom `quiz_type` di Database**: Tabel `quizzes` di `server/db.js` hanya menyimpan `(id, doc_id, questions, created_at)` tanpa mencatat tipe kesulitan kuis yang dibuat (`beginner`, `conceptual`, `analytical`/`hots`).
2. **Kueri Kuis Terakhir Tanpa Metadata Tipe**: Endpoint `GET /api/documents/:id/quizzes` hanya mengembalikan array soal tanpa mengembalikan properti `quizType`.
3. **Desync State React**: Di `src/App.tsx`, state `quizType` diinisialisasi default ke `"beginner"`. Saat kuis terakhir dimuat dari database saat membuka materi, tidak ada pembaruan state `quizType`, sehingga tombol UI tetap menyorot "Pemula" meskipun soal yang terpasang adalah paket HOTS atau Standar.

---

## 2. Spesifikasi Implementasi untuk MARAKA

### A. Migrasi Database `server/db.js`
1. Pada `initDbSchema`:
   Perbarui DDL tabel `quizzes` untuk menyertakan `quiz_type`:
   ```sql
   CREATE TABLE IF NOT EXISTS quizzes (
     id TEXT PRIMARY KEY,
     doc_id TEXT NOT NULL,
     questions TEXT NOT NULL,
     quiz_type TEXT DEFAULT 'conceptual',
     created_at INTEGER NOT NULL
   );
   ```
2. Pada `runMigrations`:
   Tambahkan migrasi idempotent untuk kolom `quiz_type`:
   ```javascript
   try {
     if (hasTable(targetDb, "quizzes")) {
       const quizColumns = targetDb.prepare("PRAGMA table_info(quizzes)").all().map(c => c.name);
       if (!quizColumns.includes("quiz_type")) {
         targetDb.prepare("ALTER TABLE quizzes ADD COLUMN quiz_type TEXT DEFAULT 'conceptual'").run();
         console.log("[tanka-db] Added quiz_type column to quizzes table");
       }
     }
   } catch (err) {
     console.warn("[tanka-db] quizzes migration notice:", err.message);
   }
   ```

### B. Penyimpanan & Pengembalian `quiz_type` di `server/routes/quizzes.js`
1. Pada `POST /api/ai/generate-quiz`:
   - Simpan `quizType` ke kolom `quiz_type` saat INSERT kuis baru:
     ```javascript
     db.prepare("INSERT INTO quizzes (id, doc_id, questions, quiz_type, created_at) VALUES (?, ?, ?, ?, ?)").run(
       quizId,
       docId,
       JSON.stringify(finalQuestions),
       quizType || "conceptual",
       Date.now()
     );
     ```
   - Kembalikan `quizType` pada JSON respons:
     ```javascript
     return sendJSON(res, {
       ok: true,
       success: true,
       quizId,
       questions: finalQuestions,
       quizType: quizType || "conceptual",
       mode
     });
     ```
2. Pada `GET /api/documents/:id/quizzes`:
   - Sertakan `quizType` dari record database pada respons:
     ```javascript
     return sendJSON(res, {
       quiz: row && parsedQuestions ? {
         id: row.id,
         questions: parsedQuestions,
         quizType: row.quiz_type || "conceptual"
       } : null
     });
     ```

### C. Sinkronisasi State di Frontend (`src/hooks/useQuiz.ts` & `src/App.tsx`)
1. Di `src/hooks/useQuiz.ts`:
   - Tambahkan `setQuizType?: (type: any) => void` pada `UseQuizProps`:
     ```typescript
     interface UseQuizProps {
       activeDocId: string | null;
       selectedModel: string;
       quizType: string;
       setQuizType?: (type: string) => void;
       showNotice: (msg: string) => void;
       recordMistake: (q: any, wrongAnswer: number) => void;
       activeDocContent?: string;
       onExamComplete?: (score: number) => void;
     }
     ```
   - Pada `useEffect` sinkronisasi pemuatan kuis (`fetch(/api/documents/${activeDocId}/quizzes)`):
     ```typescript
     if (!isCancelled && data && data.quiz && Array.isArray(data.quiz.questions) && data.quiz.questions.length > 0) {
       setQuizQuestions(data.quiz.questions);
       if (data.quiz.quizType && setQuizType) {
         setQuizType(data.quiz.quizType);
       }
       resetQuizState();
     }
     ```
2. Di `src/App.tsx`:
   - Teruskan `setQuizType` ke pemanggilan hook `useQuiz`:
     ```typescript
     const {
       ...
     } = useQuiz({
       activeDocId,
       selectedModel,
       quizType,
       setQuizType,
       showNotice,
       ...
     });
     ```

---

## 3. Acceptance Criteria
- [ ] Database SQLite `quizzes` memiliki kolom `quiz_type`.
- [ ] Endpoint `POST /api/ai/generate-quiz` dan `GET /api/documents/:id/quizzes` menyertakan properti `quizType`.
- [ ] Memuat materi secara otomatis menyinkronkan tombol toggle UI (`Pemula`, `Standar`, `HOTS`) dengan tipe kuis yang sedang aktif.
- [ ] Test suite: `env TANKA_DB_PATH=:memory: node --test --test-concurrency=1 tests/*.test.js` lulus 100%.
- [ ] `npm run build` sukses.
- [ ] Layanan `systemctl --user restart tanka` berjalan aktif.
- [ ] DILARANG melakukan `git push` ke GitHub remote.
