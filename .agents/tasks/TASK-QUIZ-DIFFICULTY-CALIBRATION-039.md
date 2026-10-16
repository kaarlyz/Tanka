# TASK-QUIZ-DIFFICULTY-CALIBRATION-039: Math Beginner Naked Math Calibration & Anti-Slop Decoupling

## METADATA
- Project: Tanka (`/home/vallencia/Projects/tanka`)
- Target File: `server/services/quizGenerator.js`
- Executor: MARAKA (`maraka`)
- Auditor: AURA (`gikano`)
- Authority: Eka

---

## 1. Konteks & Root Cause Investigation
Pada pengujian pengguna terkini di Tanka AI, generator kuis mode matematika (`detectRealMath === true`) ketika disetel pada tingkat kesulitan `beginner` (Pemula) menghasilkan butir soal yang terlalu rumit dan intimidatif. Generator secara agresif membungkus manipulasi aljabar sederhana ke dalam narasi studi kasus laboratorium (contoh: pertumbuhan populasi ragi biologi, lapisan mikroelektronika nano) alih-alih menyajikan soal pemanasan fondasi bertahap.

### Akar Masalah:
1. **Konflik Aturan Global Anti-Slop (`quizGenerator.js` baris 137–139)**:
   Blok `STANDAR KUALITAS SOAL` memuat aturan kaku:
   `- Soal WAJIB menghadirkan kasus nyata, data eksperimen/tabel, masalah kuantitatif konkret...`
   Karena aturan ini dievaluasi di bawah `${typeGuidance}`, model AI memprioritaskan kewajiban menghadirkan kasus nyata/eksperimen dan memaksakannya ke soal matematika pemula.
2. **Definisi `typeGuidance` Matematika Pemula Terlalu Longgar**:
   Belum ada larangan mutlak (*negative prompt*) terhadap stimulus soal cerita (biologi, lab, fisika, terapan) untuk level pemula.
3. **Definisi Teori Pemula**:
   Aturan anti-slop global melarang definisi terminologi, padahal level beginner untuk non-matematika membutuhkan definisi konsep kunci dari materi.

---

## 2. Spesifikasi Implementasi untuk MARAKA

Pada file `server/services/quizGenerator.js`:

### A. Kalibrasi Blok `typeGuidance` (sekitar baris 29–60)
Ganti percabangan `typeGuidance` dengan:
```javascript
  let typeGuidance = "";
  if (isMathDomain) {
    if (quizType === "beginner") {
      typeGuidance = `TIPE KUIS: MATEMATIKA / EKSAK - LEVEL PEMULA (MURNI FONDASI ANGKA & SIMBOLIK)
- PRINSIP UTAMA: MURNI OPERASI MATEMATIKA TELANJANG (NAKED MATH).
- LARANGAN KERAS (HARAM MUTLAK):
  * DILARANG KERAS menyertakan stimulus cerita, studi kasus narasi panjang, atau konteks terapan (contoh HARAM: biologi, ragi, kultur bakteri, fisika terapan, nano material, perdagangan, lab).
  * Pertanyaan HARUS langsung to-the-point berupa simbol dan angka matematika (contoh BENAR: "Sederhanakan bentuk...", "Tentukan nilai x dari persamaan...").
- TANGGA KESULITAN BUTIR SOAL:
  * Soal 1–2 (Pemanasan Notasi & Identifikasi): Ubah basis angka (misal: ubah 8 ke basis 2), sifat dasar eksponen/akar (misal: $2^3 \\times 2^2$, nilai $a^0$), atau identifikasi komponen dasar.
  * Soal 3–4 (Operasi Aljabar 1–2 Langkah Telanjang): Persamaan dasar tanpa cerita (misal: $2^{6/k} = 4$, tentukan $k$; $3^{x+1} = 27$, tentukan $x$).
  * Soal 5 (Penyederhanaan Operasi Langsung): Penyederhanaan pecahan basis prima langsung atau akar sederhana tanpa variabel rumit.
- OPSI JAWABAN (A, B, C, D, E): WAJIB berupa angka bulat sederhana atau pecahan paling ringkas. Dilarang opsi narasi panjang.`;
    } else if (quizType === "conceptual") {
      typeGuidance = `TIPE KUIS: MATEMATIKA / EKSAK - LEVEL STANDAR (UJIAN SEKOLAH / TKA)
- Uji keterampilan kurikulum standar: operasi campuran pecahan eksponen, penyederhanaan bentuk akar kuadrat sempurna, dan persamaan eksponen/aljabar baku.
- Soal to-the-point, fokus pada ketepatan manipulasi aljabar baku tanpa narasi bertele-tele.
- Opsi jawaban berupa ekspresi aljabar atau angka rapi. Pembahasan membedah langkah sistematis tuntas.`;
    } else {
      typeGuidance = `TIPE KUIS: MATEMATIKA / EKSAK - LEVEL HOTS (ANALITIK & PENALARAN TINGKAT TINGGI)
- Penalaran tingkat tinggi: penggabungan multi-aturan sifat matematis, pemecahan parameter variabel ganda, pembuktian non-rutin.
- DI SINI (DAN HANYA DI LEVEL INI) diizinkan menggunakan skenario pemodelan kontekstual terapan nyata atau stimulus masalah kuantitatif kompleks.`;
    }
  } else {
    if (quizType === "beginner") {
      typeGuidance = `TIPE KUIS: TEORI / NON-MATEMATIKA - LEVEL PEMULA (FONDASI KONSEP & FAKTA)
- Uji penguasaan fondasi: definisi terminologi pokok, klasifikasi fungsi, dan tokoh/peristiwa kunci yang tertulis langsung pada materi sumber.
- Pertanyaan langsung dan jelas.
- OPSI JAWABAN (A, B, C, D, E): WAJIB SANGAT SINGKAT (1–4 kata), padat, dan langsung ke inti.`;
    } else if (quizType === "conceptual") {
      typeGuidance = `TIPE KUIS: TEORI / NON-MATEMATIKA - LEVEL STANDAR (KONSEPTUAL & PEMAHAMAN)
- Uji pemahaman relasional: hubungan sebab-akibat, perbandingan antar-kategori/paradigma, dan analisis faktor pembeda antar-konsep materi.
- Opsi jawaban setara dan menguji penalaran logis materi.`;
    } else {
      typeGuidance = `TIPE KUIS: TEORI / NON-MATEMATIKA - LEVEL HOTS (ANALISIS KRITIS & EVALUASI WACANA)
- Uji evaluasi tingkat tinggi: analisis fenomena kasus sosial/wacana nyata, evaluasi dilema teori, kritik asumsi, dan keterkaitan multi-variabel.`;
    }
  }
```

### B. Dekopling Aturan Global Anti-Slop (sekitar baris 125–140)
Definisikan `antiSlopRule` secara dinamis sebelum fungsi `generateQuizBatch` atau di dalamnya:
```javascript
  let antiSlopRule = "";
  if (isMathDomain) {
    if (quizType === "beginner") {
      antiSlopRule = `- PENGECUALIAN MATEMATIKA PEMULA: DILARANG KERAS membuat soal cerita, studi kasus narasi, atau konteks biologi/ragi/lab/teknik. Soal WAJIB manipulasi simbolik dan aljabar angka telanjang (naked math).`;
    } else if (quizType === "conceptual") {
      antiSlopRule = `- MATEMATIKA STANDAR: Soal to-the-point pada rumus dan manipulasi persamaan baku tanpa narasi berlebihan.`;
    } else {
      antiSlopRule = `- MATEMATIKA HOTS: Hadirkan masalah pemodelan nyata kontekstual, keterkaitan multi-konsep, atau penalaran non-rutin.`;
    }
  } else {
    if (quizType === "beginner") {
      antiSlopRule = `- TEORI PEMULA: Soal menguji terminologi kunci, klasifikasi, dan fakta langsung materi sumber. Opsi jawaban sangat singkat.`;
    } else {
      antiSlopRule = `- DILARANG membuat soal template kamus/hafalan kaku. Soal WAJIB menghadirkan kasus nyata, fenomena kontekstual, atau dinamika sebab-akibat.`;
    }
  }
```

Kemudian pada prompt `generateQuizBatch`:
Ganti baris aturan anti-slop kaku (baris 137–139):
```javascript
STANDAR KUALITAS SOAL (STANDAR RESMI UTBK & ANTI AI-SLOP MUTLAK):
1. ATURAN RELEVANSI & ANTI-SLOP (MUTLAK):
   ${antiSlopRule}
2. SEMANTIC SYMMETRY & ANTI-LEAK PADA OPSI A-E:
```

---

## 3. Acceptance Criteria
- [x] Logika `typeGuidance` dan `antiSlopRule` di `server/services/quizGenerator.js` diperbarui sesuai spesifikasi di atas.
- [x] Tidak ada regresi logika kuis maupun endpoint.
- [x] Automated tests dijalankan dan lulus 100%: `env TANKA_DB_PATH=:memory: node --test --test-concurrency=1 tests/*.test.js` (85/85 tests pass).
- [x] Layanan tanka di-restart jika perlu: `systemctl --user restart tanka`.
- [x] DILARANG melakukan `git push` ke GitHub remote.
