# TASK-EXAM-BANK-INGESTION-062: Pusmendik TKA & Stekom UTBK Bank Soal Ingestion Engine

**Status**: VERIFIED
**Assignee**: MARAKA (Pipeline Downloader & Asset Ingest) -> AURA (Audit & Acceptance)
**Context**: Tanka AI Exam Ecosystem (`~/Projects/tanka`)
**Database**: `tanka.sqlite` / `server/db.js`

---

## 1. Executive Summary & Audit Reconnaissance

Tanka requires high-fidelity, grounded exam question datasets with 100% verified ground-truth answer keys, complete stimulus passages, answer choices, and local image diagram assets for:
1. **Simulasi TKA Resmi Kemendikdasmen (2025/2026)** dari `https://pusmendik.kemendikdasmen.go.id/tka/simulasi_tka` (98 paket: SMA Wajib, SMA Pilihan, SMP, SD).
2. **Simulasi UTBK SNBT Resmi (2024/2025 & Arsip)** dari `https://simulasi-utbk.stekom.ac.id/` (75 subtes: Kuantitatif, PBM, PPU, Penalaran Umum, Literasi B. Indo & Inggris, Penalaran Matematika Paket A-C, plus TO 2020 & 2023).

### Source Data Verification Findings
- **Pusmendik TKA**:
  * Authentication: Pre-filled credentials on `/login?ses_id=...` (user `P130100...`, pass `DHND*`).
  * Token flow: Dynamic token retrieved via `POST /refreshtoken?ses_id=...`.
  * Question DOM: Fully rendered in `#soal-no-N` on `/proses_tes?ses_id=...`.
    - Stimulus / passage: `.col-lg-6.cont-soal`
    - Soal & pilihan: `.col-lg-6.isi-soal`
    - Images: Remote path `/tka/cbt_images/*.png`
  * Ground-truth Answer Keys: `POST /finishtes` -> `GET /review_hasil?ses_id=...` contains complete HTML table with official `Kunci Jawaban` per item (e.g. `(C)`, `(A;D)`, `(B) Rp23.000,00`).
- **Stekom UTBK**:
  * Unauthenticated session flow: `POST /start-simulation` with CSRF cookie -> `POST /start-subtest` with `id_cbt`.
  * Direct Data Injection: Full raw JSON injected in page script: `const questions = [{id, no, bacaan, soal, soal_img, a_text, a_img, b_text, b_img, c_text, c_img, d_text, d_img, e_text, e_img, jawaban}, ...]`.
  * 100% official answer key available in field `jawaban` ('a', 'b', 'c', 'd', 'e').
  * Note: Stekom serves questions in shuffled array order, must be sorted by `no` (1..N).

---

## 2. Canonical SQLite Schema Specification

The schema must be appended to `server/db.js` and migrated automatically on boot.

```sql
-- 1. Metadata per Exam Package / Subtest
CREATE TABLE IF NOT EXISTS exam_bank_packages (
  id TEXT PRIMARY KEY,                       -- e.g. 'pusmendik_sma_wajib_matematika_paket_1', 'stekom_utbk_444_kuantitatif_paket_a'
  source TEXT NOT NULL,                      -- 'pusmendik_tka' | 'stekom_utbk'
  jenjang TEXT NOT NULL,                     -- 'sd' | 'smp' | 'sma' | 'utbk'
  kategori TEXT NOT NULL,                    -- 'wajib' | 'pilihan' | 'tps' | 'literasi' | 'penalaran_matematika'
  subtes_or_mapel TEXT NOT NULL,             -- e.g. 'Matematika', 'Kemampuan Kuantitatif'
  paket TEXT NOT NULL,                       -- e.g. 'Paket 1', 'Paket A'
  source_id TEXT,                            -- original id (mapel id '7', stekom id '444')
  total_questions INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'completed',  -- 'pending' | 'in_progress' | 'completed' | 'failed'
  metadata_json TEXT DEFAULT '{}',           -- original raw headers, session data
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- 2. Granular Question Items
CREATE TABLE IF NOT EXISTS exam_bank_items (
  id TEXT PRIMARY KEY,                       -- deterministic: '<package_id>_<nomor_padded>' (e.g. 'pusmendik_sma_wajib_matematika_paket_1_01')
  package_id TEXT NOT NULL,                  -- foreign key to exam_bank_packages(id)
  source TEXT NOT NULL,                      -- 'pusmendik_tka' | 'stekom_utbk'
  jenjang TEXT NOT NULL,                     -- 'sd' | 'smp' | 'sma' | 'utbk'
  subtes_or_mapel TEXT NOT NULL,             -- e.g. 'Matematika'
  paket TEXT NOT NULL,                       -- e.g. 'Paket 1'
  part TEXT DEFAULT '',                      -- optional: 'PART 1', 'PART 2'
  nomor INTEGER NOT NULL,                    -- 1, 2, 3...
  tipe_soal TEXT NOT NULL DEFAULT 'pilihan_ganda', -- 'pilihan_ganda' | 'pilihan_ganda_kompleks' | 'esai_singkat' | 'pernyataan'
  bacaan TEXT DEFAULT '',                    -- sanitized stimulus/passage HTML or Markdown
  soal TEXT NOT NULL,                        -- sanitized question prompt
  soal_img TEXT DEFAULT '',                  -- local relative path: '/cbt_images/exam_bank/...'
  options_json TEXT NOT NULL DEFAULT '[]',   -- JSON array: [{"id": "a", "text": "...", "img": "..."}, ...]
  kunci_jawaban TEXT NOT NULL,               -- canonical lowercase: 'a', 'b', 'c', 'd', 'e' or 'a;d'
  kunci_jawaban_text TEXT DEFAULT '',        -- literal text from official review table if available
  metadata_json TEXT DEFAULT '{}',           -- raw source item, original image URLs, hash
  created_at INTEGER NOT NULL,
  FOREIGN KEY (package_id) REFERENCES exam_bank_packages(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_exam_bank_items_pkg ON exam_bank_items(package_id);
CREATE INDEX IF NOT EXISTS idx_exam_bank_items_lookup ON exam_bank_items(source, jenjang, subtes_or_mapel);
CREATE UNIQUE INDEX IF NOT EXISTS idx_exam_bank_items_pkg_nomor ON exam_bank_items(package_id, nomor);
CREATE INDEX IF NOT EXISTS idx_exam_bank_packages_source ON exam_bank_packages(source, jenjang);
```

---

## 3. Data Sanitation & KaTeX / Math Pipeline

All extracted HTML text (`bacaan`, `soal`, and `options_json` text) must pass through a strict sanitization pipeline before database insertion:

### 3.1 Artifact & Slop Removal
1. **XML & Comment Strip**: Remove `<?xml encoding="utf-8" ?>` and `<!--?xml encoding="utf-8" ?-->`.
2. **Security Slop**: Remove `<span xss="removed">`, `xss=removed`, inline Microsoft Office attributes (`class="MsoNormal"`, `style="mso-..."`).
3. **Empty Wrappers**: Unwrap redundant nested `<span>` or `<font>` tags while preserving `<b>`, `<strong>`, `<i>`, `<em>`, `<sup>`, `<sub>`, `<table>`, `<tr>`, `<td>`, `<th>`, `<ul>`, `<ol>`, `<li>`, `<p>`, `<br>`.
4. **Whitespace**: Strip excessive non-breaking spaces `&nbsp;&nbsp;&nbsp;` down to single space.

### 3.2 KaTeX / Math Normalization
1. **Bare LaTeX commands**: Commands like `\frac{...}{...}`, `\sqrt{...}`, `\sum`, `\int`, `\times`, `\div`, `\pm`, `\le`, `\ge`, `\neq` must be enclosed in standard LaTeX math delimiters `$..$`.
2. **Powers & Subscripts**: `a^2`, `x_1`, `10^{-3}` converted to `$a^2$`, `$x_1$`, `$10^{-3}$`.
3. **HTML Math Entities**: Convert `&plusmn;` -> `$\pm$`, `&le;` -> `$\le$`, `&ge;` -> `$\ge$`, `&radic;` -> `$\sqrt{}$`, `&times;` -> `$\times$`.
4. **Anti-Double-Escape**: Ensure existing `$...$` or `$$...$$` blocks are not double-wrapped.

### 3.3 Asset Pipeline (Offline-Ready 100%)
1. **Storage Target**: `public/cbt_images/exam_bank/<source>/<package_slug>/`
2. **Images to Download**:
   - Pusmendik: `https://pusmendik.kemendikdasmen.go.id/tka/cbt_images/*.png`
   - Stekom: `soal_img`, `a_img`, `b_img`, `c_img`, `d_img`, `e_img`, and any `<img src="...">` inside `bacaan` or `soal`.
3. **Filename Determinism**: Save as `<nomor>_<sha256_short>.<ext>`.
4. **URL Rewriting**: Replace all remote URLs in `bacaan`, `soal`, `soal_img`, and `options_json` with the local path: `/cbt_images/exam_bank/<source>/<package_slug>/<filename>`.
5. **Disk Verification**: Ingester must verify each downloaded asset file exists and is non-empty (`stat.size > 0`).

---

## 4. Implementation Specification for MARAKA

MARAKA must implement the end-to-end ingestion pipeline in `scripts/ingest_exam_bank.py`:

### Phase 1: Database Migration
- Add `exam_bank_packages` and `exam_bank_items` definitions into `server/db.js` so `tanka.sqlite` auto-initializes the tables.
- Add migration guard / `CREATE TABLE IF NOT EXISTS` check.

### Phase 2: Ingestion Script (`scripts/ingest_exam_bank.py`)
- Python 3 with stdlib (`urllib.request`, `http.cookiejar`, `sqlite3`, `json`, `re`, `hashlib`, `pathlib`).
- CLI flags:
  * `--source`: `pusmendik` | `stekom` | `all`
  * `--priority-only`: Ingests high-priority subjects first:
    - Pusmendik SMA Wajib: Matematika (Paket 1 & 2), Bahasa Indonesia (Paket 1 & 2), Bahasa Inggris (Paket 1 & 2).
    - Pusmendik SMA Pilihan: Matematika Tingkat Lanjut, Fisika, Kimia, Biologi, Sosiologi, Ekonomi, Geografi.
    - Stekom UTBK: Kemampuan Kuantitatif (Paket A-C), Penalaran Matematika (Paket A-B), Literasi Bahasa Indonesia (Paket A-B), Literasi Bahasa Inggris (Paket A-B), Kemampuan Penalaran Umum (Paket A-C).
  * `--all`: Full harvest (all 98 Pusmendik paket + all 75 Stekom subtes).
  * `--db-path`: Target SQLite file (default `tanka.sqlite`).

### Phase 3: Validation & Gate Criteria
1. **Zero Hallucination / Ground Truth**: Every item must have its official `kunci_jawaban` populated. Unkeyed items fail the run.
2. **Zero Missing Images**: All rewritten image paths `/cbt_images/...` must resolve to existing files under `public/cbt_images/...`.
3. **Tanka Service Compatibility**: Existing Tanka test suite (`node --test --test-concurrency=1 tests/*.test.js`) must remain 100% GREEN (85 tests passing).

---

## 5. Audit Acceptance Verification Checklist (AURA Gate)
- [x] Schema initialized in `server/db.js` and verified with SQLite CLI.
- [x] Priority ingestion completed without network drops or unhandled exceptions (26 packages total).
- [x] Total count probe: `SELECT source, count(*) FROM exam_bank_items GROUP BY source;` returns 260 for pusmendik_tka and 473 for stekom_utbk (total 733 items).
- [x] Key coverage check: `SELECT count(*) FROM exam_bank_items WHERE kunci_jawaban IS NULL OR kunci_jawaban = '';` returns exactly `0`.
- [x] Asset existence check: Every image path referenced in database exists on filesystem (250 unique assets verified on disk).
- [x] Tanka tests pass: `npm test` -> 152/152 tests GREEN (including tests/examBank.test.js).
