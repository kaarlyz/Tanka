const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const { db } = require("../server/db");

const PDF_DIR = "/home/vallencia/Documents/TKA_Modul_PDF";

// 22 Canonical TKA 2026 Modules
const MODULES = [
  // --- 1. MATEMATIKA WAJIB (4 Modul) ---
  {
    subject: "Matematika Wajib",
    id: "tka_mtk_01_bilangan_eksponen",
    title: "TKA Matematika Wajib - Bilangan Real, Himpunan & Eksponen",
    scope: "Himpunan bilangan asli/cacah/prima, operasi irisan dan gabungan, penyederhanaan bilangan berpangkat bulat dan pecahan, sifat operasi hitung dan operasi biner bilangan asli."
  },
  {
    subject: "Matematika Wajib",
    id: "tka_mtk_02_aljabar_fungsi",
    title: "TKA Matematika Wajib - Aljabar, Fungsi & Barisan Deret",
    scope: "Invers fungsi linear dan kontekstual, syarat komposisi dua fungsi, barisan dan deret aritmetika/geometri, pemodelan sistem persamaan dan pertidaksamaan linear (SPLDV/SPtLDV)."
  },
  {
    subject: "Matematika Wajib",
    id: "tka_mtk_03_geometri_transformasi",
    title: "TKA Matematika Wajib - Geometri, Dimensi Tiga & Transformasi",
    scope: "Hubungan antar garis dan sudut, dimensi tiga kedudukan garis/bidang bangun ruang, teorema Pythagoras & luas/keliling gabungan, volume bangun ruang, komposisi transformasi geometri, perbandingan trigonometri."
  },
  {
    subject: "Matematika Wajib",
    id: "tka_mtk_04_statistika_peluang",
    title: "TKA Matematika Wajib - Statistika, Kaidah Pencacahan & Peluang",
    scope: "Interpretasi data diagram garis, aturan pencacahan (aturan perkalian, permutasi, kombinasi), konsep peluang kejadian tunggal dan majemuk kontekstual."
  },

  // --- 2. SOSIOLOGI (5 Modul) ---
  {
    subject: "Sosiologi",
    id: "tka_sos_01_hakikat_hubungan_sosial",
    title: "TKA Sosiologi - Hakikat Sosiologi & Konsep Hubungan Sosial",
    scope: "Pengertian etimologis & historis sosiologi, 4 ciri keilmuan (empiris, teoretis, kumulatif, non-etis), objek formal & material, syarat interaksi sosial, dinamika masyarakat multikultural, kelompok dan lembaga sosial, dampak ragam gejala sosial."
  },
  {
    subject: "Sosiologi",
    id: "tka_sos_02_penelitian_sosial",
    title: "TKA Sosiologi - Metode & Rancangan Penelitian Sosial",
    scope: "Struktur dan sistematika penelitian sosial, pendekatan kualitatif vs kuantitatif, teknik pengumpulan data (observasi, wawancara, kuesioner), sampling, interpretasi data, evaluasi manfaat hasil riset."
  },
  {
    subject: "Sosiologi",
    id: "tka_sos_03_konflik_resolusi",
    title: "TKA Sosiologi - Kelompok Sosial & Resolusi Konflik",
    scope: "Klasifikasi kelompok sosial (in-group, out-group, paguyuban, patembayan), akar penyebab konflik sosial, bentuk konflik, akomodasi dan resolusi konflik (mediasi, arbitrasi, konsiliasi, kompromi), perdamaian integratif."
  },
  {
    subject: "Sosiologi",
    id: "tka_sos_04_stratifikasi_kesetaraan",
    title: "TKA Sosiologi - Diferensiasi, Stratifikasi & Ketimpangan Sosial",
    scope: "Diferensiasi sosial (horizontal), stratifikasi sosial (vertikal), faktor penyebab ketimpangan sosial, dampak diskriminasi dan marginalisasi, prinsip kesetaraan dan harmoni sosial."
  },
  {
    subject: "Sosiologi",
    id: "tka_sos_05_perubahan_globalisasi",
    title: "TKA Sosiologi - Perubahan Sosial, Globalisasi & Kearifan Lokal",
    scope: "Bentuk perubahan sosial (evolusi vs revolusi, terencana vs tidak terencana), teori siklus dan linear, dampak globalisasi, konsumerisme, westernisasi, sikap kritis selektif, pemberdayaan kearifan lokal."
  },

  // --- 3. EKONOMI (5 Modul) ---
  {
    subject: "Ekonomi",
    id: "tka_eko_01_kelangkaan_mekanisme_pasar",
    title: "TKA Ekonomi - Konsep Dasar Kelangkaan & Keseimbangan Pasar",
    scope: "Kelangkaan sumber daya ekonomi, biaya peluang, masalah pokok ekonomi klasik vs modern, hukum permintaan dan penawaran, fungsi linier Qd & Qs, pergeseran ekuilibrium pasar, elastisitas harga, intervensi pajak dan subsidi."
  },
  {
    subject: "Ekonomi",
    id: "tka_eko_02_pendapatan_nasional_pembangunan",
    title: "TKA Ekonomi - Pendapatan Nasional & Pembangunan Ekonomi",
    scope: "Konsep dan rumus pendapatan nasional (GDP, GNP, NNP, NNI, PI, DI), pendekatan pengeluaran vs penerimaan, pendapatan per kapita, pertumbuhan ekonomi vs pembangunan, indeks pembangunan manusia (IPM)."
  },
  {
    subject: "Ekonomi",
    id: "tka_eko_03_ketenagakerjaan_inflasi_kebijakan",
    title: "TKA Ekonomi - Ketenagakerjaan, Inflasi & Kebijakan Fiskal-Moneter",
    scope: "Ketenagakerjaan dan jenis pengangguran (struktural, friksional, siklis, musiman), indeks harga konsumen (IHK), laju inflasi, instrumen moneter Bank Sentral, kebijakan fiskal dan fungsi perpajakan."
  },
  {
    subject: "Ekonomi",
    id: "tka_eko_04_badan_usaha_koperasi",
    title: "TKA Ekonomi - Badan Usaha & Manajemen Koperasi",
    scope: "Karakteristik badan usaha (BUMN, BUMD, BUMS, firma, CV, PT), fungsi-fungsi manajemen (POAC), prinsip koperasi Indonesia, perhitungan Sisa Hasil Usaha (SHU)."
  },
  {
    subject: "Ekonomi",
    id: "tka_eko_05_perdagangan_internasional_akuntansi",
    title: "TKA Ekonomi - Perdagangan Internasional & Persamaan Dasar Akuntansi",
    scope: "Teori keunggulan mutlak & komparatif, kebijakan proteksi (tarif, kuota, subsidi, dumping), neraca pembayaran, persamaan dasar akuntansi (Aset = Liabilitas + Ekuitas), laporan laba rugi."
  },

  // --- 4. BAHASA INDONESIA (4 Modul) ---
  {
    subject: "Bahasa Indonesia",
    id: "tka_bin_01_gagasan_utama_hubungan_kalimat",
    title: "TKA Bahasa Indonesia - Gagasan Utama & Hubungan Antarkalimat",
    scope: "Penemuan gagasan utama dan pendukung (deduktif, induktif), membaca skimming & scanning, analisis hubungan antarkalimat sebab-akibat/analogi, evaluasi kelogisan struktur kalimat."
  },
  {
    subject: "Bahasa Indonesia",
    id: "tka_bin_02_analisis_prosa_sastra",
    title: "TKA Bahasa Indonesia - Analisis Teks Prosa, Cerita & Sastra",
    scope: "Unsur intrinsik prosa (tema, latar, penokohan, alur, sudut pandang), konflik internal vs eksternal tokoh, inferensi nilai moral tersirat, kronologi peristiwa, prediksi alur cerita."
  },
  {
    subject: "Bahasa Indonesia",
    id: "tka_bin_03_teks_faktual_infografis",
    title: "TKA Bahasa Indonesia - Teks Faktual, Berita & Data Visual (Infografis)",
    scope: "Karakteristik teks berita (5W+1H), struktur piramida terbalik, analisis kesesuaian data visual (tabel, diagram, grafik, infografis) dengan opini teks, penulisan kalimat penutup berita."
  },
  {
    subject: "Bahasa Indonesia",
    id: "tka_bin_04_kebahasaan_ejaan_diksi",
    title: "TKA Bahasa Indonesia - Kaidah Kebahasaan, Kata Serapan & Ejaan",
    scope: "Makna kata serapan bahasa asing dan daerah, konotatif vs denotatif, idiom dan ungkapan, pembentukan istilah, kaidah kalimat efektif, penerapan ejaan baku PUEBI."
  },

  // --- 5. BAHASA INGGRIS (4 Modul) ---
  {
    subject: "Bahasa Inggris",
    id: "tka_big_01_narrative_moral_value",
    title: "TKA Bahasa Inggris - Narrative Text & Moral Value Analysis",
    scope: "Generic structure of narrative texts (orientation, complication, resolution), identifying main plot points, analyzing character traits & actions, predicting story endings, inferring moral values."
  },
  {
    subject: "Bahasa Inggris",
    id: "tka_big_02_procedure_infographic",
    title: "TKA Bahasa Inggris - Procedure & Infographic Text Comprehension",
    scope: "Structure of procedure texts (goal, materials, step-by-step methods), imperative verbs, sequence adverbs, categorizing steps, author's purpose, practical application."
  },
  {
    subject: "Bahasa Inggris",
    id: "tka_big_03_descriptive_text",
    title: "TKA Bahasa Inggris - Descriptive Text & Contextual Meaning",
    scope: "Generic structure of descriptive texts, locating explicit facts, inferring contextual phrase meaning, sensory adjectives, evaluating primary aspects vs supporting details."
  },
  {
    subject: "Bahasa Inggris",
    id: "tka_big_04_analytical_exposition",
    title: "TKA Bahasa Inggris - Analytical Exposition & Multi-Source Synthesis",
    scope: "Generic structure of analytical exposition (thesis, arguments, conclusion), distinguishing empirical facts vs opinions, discourse markers of contrast and causation, synthesizing multiple texts."
  }
];

function cleanAndFormatPdfText(rawText, mod) {
  if (!rawText) return "";

  // 1. Strip page break artifacts (\x0c) and running headers
  let cleaned = rawText
    .replace(/\x0c/g, "\n\n")
    .replace(/^[A-Z\s]+·\s*TKA\s*2026.*$/gm, "")
    .replace(/^Modul\s+Materi\s+Terstruktur\s*·\s*Tanka.*$/gm, "")
    .replace(/^\s*\d+\s*$/gm, "") // dangling page numbers
    .replace(/\\mathbb\{W\}\s*=\s*\\?\s*\{/g, "\\mathbb{W} = \\{") // fix unescaped set brace
    .replace(/8\s*>\s*0\\+/g, "8 > 0") // fix trailing backslash
    .replace(/\\\s*\n\s*\{/g, " {") // fix broken line-wrap backslash before braces
    .replace(/\\\s*\n\s*/g, " ") // join wrapped LaTeX backslashes
    .replace(/\\\\\s*\$/g, "$") // fix trailing double backslashes before $
    .replace(/\\\s*\$/g, "$");

  const lines = cleaned.split("\n");
  const result = [];

  let inCodeBlock = false;
  let seenTitle = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    if (!line) {
      result.push("");
      continue;
    }

    if (line.startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      result.push(line);
      continue;
    }

    if (inCodeBlock) {
      result.push(lines[i]);
      continue;
    }

    // Format Title
    if (!seenTitle && (line.startsWith(mod.title) || line === mod.title || line.toLowerCase().includes(mod.title.toLowerCase()))) {
      result.push(`# ${mod.title}`);
      seenTitle = true;
      continue;
    }

    // Format Bab (Chapters) -> ## Bab X: ...
    const babMatch = line.match(/^Bab\s+(\d+)\s*:\s*(.+)$/i);
    if (babMatch) {
      result.push("");
      result.push(`## Bab ${babMatch[1]}: ${babMatch[2].trim()}`);
      continue;
    }

    // Format Sub-topik (e.g. 1.1 Klasifikasi Semesta Bilangan) -> ### 1.1 ...
    const subMatch = line.match(/^(\d+\.\d+)\s+(.+)$/);
    if (subMatch && !line.includes("=")) {
      result.push("");
      result.push(`### ${subMatch[1]} ${subMatch[2].trim()}`);
      continue;
    }

    // Format Section Headings (Nara Editorial Anatomy)
    if (
      /^Situasi\s+Konkret\s*(&|dan)\s*Pemicu\s+Intuisi/i.test(line) ||
      /^Inti\s+Konsep\s*(&|dan)\s*Definisi\s+Baku/i.test(line) ||
      /^Kaidah\s*\/\s*(Rumus\s+Kunci\s+KaTeX|Prinsip\s+Pembeda)/i.test(line) ||
      /^Mekanisme\s*(&|dan)\s*Sebab-Akibat/i.test(line) ||
      /^Batas\s+Konsep\s*(&|dan)\s*Pembeda/i.test(line) ||
      /^Peringatan\s+Salah\s+Kaprah/i.test(line) ||
      /^Bedah\s+Tuntas\s+Soal\s+Ujian\s+Asli/i.test(line)
    ) {
      result.push("");
      result.push(`#### ${line}`);
      continue;
    }

    // Format Cek Pemahaman Bab X -> ### Cek Pemahaman Bab X
    const cekMatch = line.match(/^Cek\s+Pemahaman\s+Bab\s+(\d+)/i);
    if (cekMatch) {
      result.push("");
      result.push(`### Cek Pemahaman Bab ${cekMatch[1]}`);
      continue;
    }

    result.push(line);
  }

  // Pastikan judul utama ada di atas jika belum tertangkap
  let finalContent = result.join("\n").trim();
  if (!finalContent.startsWith("# ")) {
    finalContent = `# ${mod.title}\n\n` + finalContent;
  }

  return finalContent;
}

function extractConceptsFromMarkdown(markdown) {
  const concepts = [];
  const lines = markdown.split("\n");
  for (const rawLine of lines) {
    const line = rawLine.trim();
    // Tangkap definisi baku atau item konsep
    if (line.startsWith("▸ ")) {
      const match = line.match(/^▸\s*([^:(]+)(?:\s*\(([^)]+)\))?\s*:\s*(.+)$/);
      if (match) {
        concepts.push({
          name: match[1].trim(),
          definition: match[3].trim()
        });
      }
    }
  }
  return concepts;
}

function extractQuizzesFromMarkdown(markdown, modId) {
  const questions = [];
  const lines = markdown.split("\n");
  let qNum = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith("Cek Pemahaman Bab") || line.startsWith("### Cek Pemahaman Bab")) {
      // Baca 2 pertanyaan berikutnya
      let j = i + 1;
      while (j < lines.length && !lines[j].trim().startsWith("## ")) {
        const subLine = lines[j].trim();
        const pMatch = subLine.match(/^\d+\.\s*Pertanyaan:\s*(.+)$/i);
        if (pMatch) {
          const qText = pMatch[1].trim();
          let ansText = "";
          if (j + 1 < lines.length && lines[j + 1].trim().match(/^Jawaban:\s*(.+)$/i)) {
            ansText = lines[j + 1].trim().replace(/^Jawaban:\s*/i, "").trim();
          }

          if (qText && ansText) {
            questions.push({
              id: qNum++,
              question: qText,
              options: [
                ansText,
                "Konsep belum memenuhi syarat pembuktian",
                "Kaidah ini tidak berlaku pada kasus ekstrem",
                "Diperlukan data tambahan untuk menguji"
              ],
              correctIndex: 0,
              correctIndices: [0],
              explanation: `Kunci analisis: ${ansText}`,
              formula: "Cek Pemahaman Retensi",
              tingkat: "sedang"
            });
          }
        }
        j++;
      }
    }
  }

  // Jika belum ada pertanyaan cek pemahaman, buat default 3 butir soal
  if (questions.length === 0) {
    questions.push({
      id: 1,
      question: `Manakah dari pernyataan berikut yang paling tepat menggambarkan fokus utama materi "${modId}"?`,
      options: [
        "Analisis mendalam sesuai indikator resmi TKA BSKAP",
        "Penalaran teoretis tanpa penerapan latihan",
        "Hafalan rumus mekanis tanpa pemahaman struktur",
        "Penyederhanaan yang mengabaikan batasan syarat domain"
      ],
      correctIndex: 0,
      correctIndices: [0],
      explanation: "Modul dirancang terstruktur sesuai taksonomi indikator kompetensi resmi.",
      formula: "Konsep Dasar",
      tingkat: "sedang"
    });
  }

  return questions;
}

function extractFlashcardsFromMarkdown(markdown, concepts, modId) {
  const flashcards = [];

  // 1. Dari konsep-konsep berdefinisi baku
  concepts.forEach((c) => {
    if (c.name && c.definition && c.definition.length > 10) {
      flashcards.push({
        front: `Apa definisi dan batasan ilmiah dari "${c.name}"?`,
        back: c.definition
      });
    }
  });

  // 2. Dari Cek Pemahaman Q&A
  const lines = markdown.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const pMatch = line.match(/^\d+\.\s*Pertanyaan:\s*(.+)$/i);
    if (pMatch) {
      const q = pMatch[1].trim();
      if (i + 1 < lines.length && lines[i + 1].trim().match(/^Jawaban:\s*(.+)$/i)) {
        const a = lines[i + 1].trim().replace(/^Jawaban:\s*/i, "").trim();
        flashcards.push({
          front: q,
          back: a
        });
      }
    }
  }

  // Pastikan minimal ada 4 flashcards per modul
  if (flashcards.length < 4) {
    flashcards.push(
      { front: `Apa urgensi utama dari penguasaan materi "${modId}"?`, back: "Fondasi penalaran analitis untuk menyelesaikan indikator soal TKA 2026 secara presisi." },
      { front: `Bagaimana strategi menghindari jebakan (pitfall) pada topik ini?`, back: "Perhatikan batas domain, syarat berlakunya kaidah, dan jangan mengabaikan asumsi dasar." }
    );
  }

  return flashcards.slice(0, 12); // Batasi max 12 kartu per modul
}

function seedAllModules() {
  console.log("=========================================================");
  console.log("🌱 MEMULAI SEEDER 22 MODUL TKA 2026 RESMI KE TANKA SQLITE");
  console.log("=========================================================\n");

  const now = Date.now();
  let successCount = 0;

  for (const mod of MODULES) {
    const pdfPath = path.join(PDF_DIR, `${mod.id}.pdf`);
    if (!fs.existsSync(pdfPath)) {
      console.warn(`✖ Berkas PDF tidak ditemukan: ${pdfPath}`);
      continue;
    }

    try {
      console.log(`📦 Memproses: [${mod.subject}] ${mod.title}...`);
      const rawText = execSync(`pdftotext "${pdfPath}" -`, { encoding: "utf-8", maxBuffer: 10 * 1024 * 1024 });
      const formattedMarkdown = cleanAndFormatPdfText(rawText, mod);
      const concepts = extractConceptsFromMarkdown(formattedMarkdown);
      const questions = extractQuizzesFromMarkdown(formattedMarkdown, mod.id);
      const flashcards = extractFlashcardsFromMarkdown(formattedMarkdown, concepts, mod.id);

      // 1. Simpan Dokumen Utama
      db.prepare("DELETE FROM documents WHERE id = ?").run(mod.id);
      db.prepare(`
        INSERT INTO documents (id, title, content, summary, status, created_at)
        VALUES (?, ?, ?, ?, 'completed', ?)
      `).run(mod.id, mod.title, formattedMarkdown, `Modul Resmi TKA 2026: ${mod.scope}`, now);

      // 2. Simpan Butir Soal Kuis
      db.prepare("DELETE FROM quizzes WHERE doc_id = ?").run(mod.id);
      if (questions.length > 0) {
        const qId = `quiz_${mod.id}_${now}`;
        db.prepare(`
          INSERT INTO quizzes (id, doc_id, questions, quiz_type, created_at)
          VALUES (?, ?, ?, 'conceptual', ?)
        `).run(qId, mod.id, JSON.stringify(questions), now);
      }

      // 3. Simpan Kartu Flashcards
      db.prepare("DELETE FROM flashcards WHERE doc_id = ?").run(mod.id);
      const insertFc = db.prepare(`
        INSERT INTO flashcards (id, doc_id, front, back, difficulty, review_count, created_at)
        VALUES (?, ?, ?, ?, 'new', 0, ?)
      `);
      flashcards.forEach((fc, idx) => {
        insertFc.run(`fc_${mod.id}_${idx + 1}`, mod.id, fc.front, fc.back, now);
      });

      // 4. Simpan Konsep Kanonikal ke document_concepts
      db.prepare("DELETE FROM document_concepts WHERE doc_id = ?").run(mod.id);
      const insertConcept = db.prepare(`
        INSERT OR IGNORE INTO document_concepts (id, doc_id, name, definition, prerequisites, origin, created_at, category, is_required, evidence_quote, segment_id, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      concepts.forEach((c, cIdx) => {
        insertConcept.run(
          `c_${mod.id}_${cIdx + 1}`,
          mod.id,
          c.name,
          c.definition,
          "[]",
          "tka_official",
          now,
          "core",
          1,
          c.definition.slice(0, 140),
          `seg_${cIdx + 1}`,
          now
        );
      });

      // 5. Simpan Rencana Bab ke chapter_plans
      db.prepare("DELETE FROM chapter_plans WHERE doc_id = ?").run(mod.id);
      const lines = formattedMarkdown.split("\n");
      const chapterTitles = lines.filter(l => /^##\s+Bab\s+\d+/i.test(l.trim())).map(l => l.replace(/^##\s+/, "").trim());
      const insertCp = db.prepare(`
        INSERT INTO chapter_plans (id, doc_id, chapter_number, title, key_concept_ids, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      chapterTitles.forEach((cpTitle, cpIdx) => {
        insertCp.run(
          `cp_${mod.id}_${cpIdx + 1}`,
          mod.id,
          cpIdx + 1,
          cpTitle,
          JSON.stringify(concepts.slice(cpIdx * 2, cpIdx * 2 + 2).map((_, i) => `c_${mod.id}_${cpIdx * 2 + i + 1}`)),
          now,
          now
        );
      });

      successCount++;
      console.log(`   ✔ Sukses: ${formattedMarkdown.length} chars | ${chapterTitles.length} bab | ${questions.length} kuis | ${flashcards.length} flashcards | ${concepts.length} konsep`);
    } catch (err) {
      console.error(`   ✖ Gagal memproses ${mod.id}:`, err.message);
    }
  }

  console.log(`\n=========================================================`);
  console.log(`🎉 SELESAI: ${successCount} dari ${MODULES.length} modul TKA 2026 berhasil dimuat ke Tanka!`);
  console.log("=========================================================\n");
}

seedAllModules();
