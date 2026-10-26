# TASK-EXAM-BANK-UI-CBT-063: Official CBT Exam Bank Cockpit & Review UI

**Status**: VERIFIED
**Assignee**: MARAKA (Implementation & Frontend Wiring)
**Context**: Tanka AI Platform (`~/Projects/tanka`)

---

## 1. Background & Objectives
`TASK-EXAM-BANK-INGESTION-062` successfully ingested 733 verified ground-truth questions and 250 local diagram images into SQLite tables `exam_bank_packages` and `exam_bank_items` in `tanka.sqlite`.
This task builds the end-to-end user-facing CBT experience:
1. Express REST API endpoints to list packages and load exam sessions.
2. Dedicated UI tab in Tanka: **"Simulasi CBT"** (Desktop sidebar & Mobile navigation).
3. 1:1 High-fidelity CBT Exam Runner (Split layout stimulus vs questions, countdown timer, question grid palette, ragu-ragu flag).
4. Official Pusmendik/SNBT-grade Review Table with instant score calculation and direct hook to Nara AI for Socratic error autopsy.

---

## 2. API Contract Specification

### `GET /api/exam-bank/packages`
Returns all packages:
```json
[
  {
    "id": "pusmendik_sma_wajib_matematika_paket_1",
    "source": "pusmendik_tka",
    "jenjang": "sma",
    "kategori": "wajib",
    "subtes_or_mapel": "Matematika",
    "paket": "Paket 1",
    "total_questions": 46
  }
]
```

### `GET /api/exam-bank/packages/:id`
Returns package metadata and ordered questions (1..N):
```json
{
  "package": { ... },
  "items": [
    {
      "id": "pusmendik_sma_wajib_matematika_paket_1_01",
      "nomor": 1,
      "tipe_soal": "pilihan_ganda",
      "bacaan": "...",
      "soal": "...",
      "soal_img": "/cbt_images/exam_bank/...",
      "options": [{"id": "a", "text": "...", "img": ""}],
      "kunci_jawaban": "c",
      "kunci_jawaban_text": "(C)"
    }
  ]
}
```

### `POST /api/exam-bank/packages/:id/submit`
Body: `{ answers: { "1": "c", "2": "a;d" }, time_spent_seconds: 1200 }`
Returns:
```json
{
  "total": 46,
  "answered": 45,
  "correct": 42,
  "score_percent": 91.3,
  "estimated_irt": 785,
  "breakdown": [
    {
      "nomor": 1,
      "user_answer": "c",
      "kunci_jawaban": "c",
      "is_correct": true,
      "soal": "..."
    }
  ]
}
```

---

## 3. Frontend Architecture

1. **Navigation Entry**:
   - Add new main tab: `"cbt"` labeled **"Simulasi CBT"** in `src/App.tsx`, sidebar navigation, and mobile bottom bar.
2. **Component `src/components/tabs/ExamCbtTab.tsx`**:
   - **Mode A (Selector)**: Segmented control `[TKA Pusmendik (SMA)]` vs `[UTBK SNBT (PTN)]`. Filter by subject pills. Package cards with "Mulai Simulasi".
   - **Mode B (Live CBT Runner)**:
     - Header: Subject title, timer countdown, finish button, palette toggle button.
     - Split Layout (50/50 desktop, stacked mobile): Left pane for stimulus passage, right pane for question text and options.
     - Controls: "Sebelumnya", "Ragu-ragu" checkbox, "Berikutnya".
     - Question Navigation Palette Drawer: 1..N numbers with status color (Blue active, Dark answered, Yellow doubtful, Outline unanswered).
   - **Mode C (Official Review & Diagnostic)**:
     - Header score cards (Skor % & Estimasi IRT).
     - Official Review Table (No | Jawaban Anda | Kunci Jawaban | Status).
     - Button **"Bedah Nomor Salah bersama Nara AI"** to immediately open Tanya Nara drawer with structured context.

---

## 4. Acceptance Criteria
- [x] API endpoints mounted and tested in `server.js` / `server/routes/examBank.js`.
- [x] `npm test` passes (154/154 tests).
- [x] `npm run build` succeeds cleanly.
- [x] Verification via headless browser: open CBT tab, click a package, verify live runner renders stimulus + math formulas, submit mock answers, and verify review screen.
