const { db } = require("../db");
const { callRouter, multiSourceAcademicSearch } = require("../ai");
const { NARA_GLOBAL_PERSONA } = require("../prompts/nara");
const { safeJsonParse } = require("../utils/jsonParser");

function normalizeTopicQuery(raw) {
  let s = (raw || "").trim();
  s = s.replace(/^(?:aku|saya|gue|gw|kami|kita)\s+(?:ingin|mau|pengen|butuh|harap)\s+(?:belajar|tahu|paham|memahami|kuasai|menguasai)\s+/i, "");
  s = s.replace(/^(?:tolong|coba)\s+(?:ajarkan|jelaskan|buatkan|bikinkan|terangkan)\s+(?:saya|aku|kami)?\s*(?:tentang|materi|soal)?\s+/i, "");
  s = s.replace(/^(?:ajarkan|jelaskan|buatkan|bikinkan|terangkan|bahas)\s+(?:saya|aku|kami)?\s*(?:tentang|materi|soal)?\s+/i, "");
  s = s.replace(/^(?:materi|modul|bab|pelajaran|topik)\s+(?:tentang)?\s+/i, "");
  s = s.replace(/^(?:apa\s+itu|pengertian|definisi|konsep\s+dasar)\s+/i, "");
  return s.trim() || raw.trim();
}

async function understandTopicQuery(rawTopic, userModel = "ag/gemini-3.8-flash-low") {
  const prompt = `Tugas Anda: Analisis permintaan belajar murid dan terjemahkan menjadi query kurikulum sekolah standar.
Permintaan Mentah Murid: "${rawTopic}"

Aturan:
1. "topik_kanonik": Judul resmi materi sesuai silabus Kurikulum Merdeka / SMA / SMP (Contoh: "Bentuk Aljabar", "Fotosintesis", "Hukum Newton", "G30S/PKI 1965", "Elastisitas Permintaan dan Penawaran"). Buang kata basa-basi percakapan seperti "aku ingin belajar", "tolong", "pengen ngerti".
2. "mapel": Mata pelajaran sekolah resmi (Matematika, Biologi, Fisika, Kimia, Ekonomi, Sosiologi, Geografi, Sejarah, Bahasa Indonesia, Bahasa Inggris, dll).
3. "jenjang": "SMA" (Kelas 10-12) atau "SMP" jika materi dasar (misal Bentuk Aljabar Dasar = SMP Kelas 7).
4. "query_pencarian": Array berisi 2-3 query pencarian web bertarget kurikulum sekolah (misal: ["bentuk aljabar kurikulum merdeka", "unsur dan operasi hitung bentuk aljabar"]).
5. "ambigu": Boolean. Set bernilai true HANYA JIKA kata/topik memiliki makna ganda di dua mata pelajaran berbeda atau terlalu umum tanpa konteks jelas (Contoh: "diferensiasi" bisa Matematika Turunan atau Sosiologi Sosial; "translasi" bisa Matematika Geometri, Biologi Protein, atau Bahasa Terjemahan; "gelombang" bisa Fisika atau Geografi Kelautan). Jika sudah jelas, set false.
6. "opsi_cabang": Jika ambigu bernilai true, berikan array 2-3 string pilihan cabang spesifik beserta mapelnya (Contoh untuk "diferensiasi": ["Diferensiasi / Turunan Fungsi Aljabar (Matematika SMA)", "Diferensiasi Sosial dan Stratifikasi (Sosiologi SMA)"]). Jika ambigu bernilai false, kosongkan array ini ([]).

Kembalikan HANYA format JSON valid berikut:
{
  "topik_kanonik": "...",
  "mapel": "...",
  "jenjang": "...",
  "query_pencarian": ["...", "..."],
  "ambigu": false,
  "opsi_cabang": []
}`;

  try {
    const res = await callRouter([
      { role: "system", content: "You are an expert Indonesian curriculum coordinator. Output strictly valid JSON." },
      { role: "user", content: prompt }
    ], userModel, 0.1);
    
    const parsed = safeJsonParse(res);
    if (!parsed) throw new Error("Gagal parsing query intelligence JSON");
    return parsed;
  } catch (err) {
    const cleaned = normalizeTopicQuery(rawTopic);
    return {
      topik_kanonik: cleaned,
      mapel: "Umum",
      jenjang: "SMA",
      query_pencarian: [`${cleaned} kurikulum merdeka`, `${cleaned} rangkuman materi`],
      ambigu: false
    };
  }
}

async function handleTopicsRoutes(req, res, pathname, helpers) {
  const { sendJSON, getBody } = helpers;

  // 0. POST /api/ai/topic-understand - Step 0 Query Intelligence (Fast Ambiguity Check)
  if (req.method === "POST" && pathname === "/api/ai/topic-understand") {
    const { topic, model = "ag/gemini-3.8-flash-low" } = await getBody(req);
    if (!topic || !topic.trim()) return sendJSON(res, { error: "Topic required" }, 400);

    const qIntel = await understandTopicQuery(topic, model);
    return sendJSON(res, { success: true, ...qIntel });
  }

  // 1. POST /api/ai/topic-clarify - ask diagnostic questions before generating a topic
  if (req.method === "POST" && pathname === "/api/ai/topic-clarify") {
    const { topic, model = "ag/gemini-3.8-flash-low" } = await getBody(req);
    if (!topic || !topic.trim()) return sendJSON(res, { error: "Topic required" }, 400);

    const prompt = `Pengguna ingin mempelajari topik/sub-topik berikut:
"${topic.trim()}"

Tugas Anda:
1. Identifikasi bidang ilmu yang relevan (misal: Matematika, Ekonomi, Sosiologi, Fisika, Biologi, Sejarah, dll).
2. Tentukan judul topik formal akademik ("formalTitle") YANG DISIPLIN & MENGIKUTI RUANG LINGKUP PERMINTAAN:
   - DILARANG memperlebar judul menjadi bab induk raksasa jika pengguna meminta sub-topik spesifik!
3. Buat 2 pertanyaan preferensi belajar pengguna ("questions"):
   - DILARANG KERAS MEMBUAT KUIS / SOAL TEBAK FAKTA! Pengguna belum belajar materi ini!
   - Pertanyaan HANYA boleh menanyakan:
     a. Target Pembelajaran (pilihan: "Paham Alur Cerita & Sebab-Akibat", "Persiapan Ujian / Nilai Rapor", "Bedah Soal HOTS & Penalaran UTBK")
     b. Kedalaman & Gaya Belajar (pilihan: "Penjelasan Runtut & Bebas Hafalan Buta", "Ringkasan Poin Inti Cepat", "Mendalam Komprehensif")

Format output WAJIB HANYA berupa JSON valid tanpa markdown formatting:
{
  "subject": "Nama Mata Pelajaran",
  "formalTitle": "Judul Topik Formal Akademik",
  "questions": [
    {
      "id": "target",
      "question": "Fokus target yang ingin kamu capai di materi ini?",
      "choices": ["Paham Alur Kausalitas & Bebas Hafalan Buta", "Persiapan Ujian Sekolah / Harian", "Penalaran Analitis HOTS UTBK"]
    },
    {
      "id": "depth",
      "question": "Gaya penyajian materi yang kamu sukai?",
      "choices": ["Alur Cerita Bertahap & Mudah Dipahami", "Poin Inti Ringkas & Padat", "Bedah Menyeluruh dengan Studi Kasus"]
    }
  ]
}`;

    const reply = await callRouter([
      { role: "system", content: "You are an elite academic curriculum architect. Strictly return valid JSON." },
      { role: "user", content: prompt }
    ], model, 0.2);

    const parsed = safeJsonParse(reply);
    if (parsed) {
      return sendJSON(res, { success: true, ...parsed });
    } else {
      return sendJSON(res, {
        success: true,
        subject: "Umum",
        formalTitle: topic.trim(),
        questions: [
          {
            id: "focus",
            question: "Aspek materi mana yang ingin Anda prioritaskan?",
            choices: ["Penurunan Rumus & Konsep Teori", "Trik Cepat & Pola Soal HOTS", "Studi Kasus & Pembahasan Aplikasi"]
          },
          {
            id: "depth",
            question: "Tingkat kedalaman pembahasan yang diinginkan?",
            choices: ["Fondasi Dasar (Konseptual & Mudah Dipahami)", "Intensif Terapan (Persiapan Ujian)", "Tingkat Lanjut (Analisis Mendalam)"]
          }
        ]
      });
    }
  }

  // 2. POST /api/ai/topic-generate - generate full academic document from web search via Two-Pass Pipeline
  if (req.method === "POST" && pathname === "/api/ai/topic-generate") {
    const { topic, formalTitle, subject, answers = {}, model = "ag/gemini-3.8-flash-low" } = await getBody(req);
    if (!topic) return sendJSON(res, { error: "Topic required" }, 400);

    const docId = "doc_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
    
    // Step 0: Run Query Intelligence (Curriculum Normalizer & Ambiguity Detector)
    console.log(`[topics] Running Step 0 Query Intelligence on "${topic}"...`);
    const customUserContext = (answers && answers.custom_context ? answers.custom_context.trim() : "");
    const combinedTopic = customUserContext ? `${topic} (${customUserContext})` : topic;
    const qIntel = await understandTopicQuery(combinedTopic, model);

    // Prioritize canonical topic and curriculum subject from Step 0 to avoid polite chatter or "Umum" subject contamination
    const isTopicClean = formalTitle && formalTitle !== topic && formalTitle !== "Umum";
    const title = (isTopicClean ? formalTitle : (qIntel.topik_kanonik || formalTitle || normalizeTopicQuery(topic))).trim();
    const effectiveSubject = (subject && subject !== "Umum" ? subject : (qIntel.mapel || "Umum")).trim();
    const searchQueries = qIntel.query_pencarian || [];

    const { segmentDocumentText, extractConceptsAndOutline, generateNaraModule } = require("../services/curriculumPipeline");

    let segments = [];
    let rawContext = "";
    const insertSeg = db.prepare("INSERT INTO document_segments (id, doc_id, segment_index, source_type, raw_text, normalized_text, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)");

    // Deteksi domain matematika murni & sains eksak hitung
    const mathKeywordRegex = /matematika|math|aritmatika|aritmetika|aljabar|trigonometri|kalkulus|integral|turunan|diferensial|limit|matriks|vektor|peluang|statistika|kombinatorika|permutasi|kombinasi|eksponen|logaritma|persamaan|pertidaksamaan|fungsi|polinomial|suku banyak|lingkaran|dimensi tiga|bangun ruang|bangun datar|pythagoras|barisan|deret|bilangan|pecahan|operasi hitung|geometri|transformasi|dilatasi|translasi|rotasi|refleksi|notasi sigma/i;
    const isMathDomain = /matematika|math/i.test(effectiveSubject) || 
                         mathKeywordRegex.test(effectiveSubject) ||
                         mathKeywordRegex.test(title) ||
                         mathKeywordRegex.test(topic);

    if (isMathDomain) {
      console.log(`[topics] Topik Matematika terdeteksi ("${title}"). Bypass mode web research untuk mencegah halusinasi & noise teks; menggunakan Pure First-Principles AI.`);
      
      const mathPrompt = `Anda adalah pakar kurikulum matematika SMA/UTBK (Kurikulum Merdeka).
Tugas: Buatkan teks materi fondasi kanonikal untuk topik: "${title}" (${effectiveSubject}) jenjang ${qIntel.jenjang || "SMA"}.

SYARAT MUTLAK (MATEMATIKA EKSAK & ANTI-SLOP):
1. PETA CAKUPAN LENGKAP: Bedah seluruh pilar/cabang topik ini secara menyeluruh di awal.
2. DEFINISI PADAT & PRESISI: Definisi konsep hanya 1-2 kalimat to-the-point tanpa dongeng bertele-tele.
3. TABEL PEMETAAN RUMUS LENGKAP (KaTeX): Sajikan semua rumus operasional dalam format tabel Markdown rapi dengan notasi KaTeX ($...$ atau $$...$$). Sertakan keterangan variabel dan kondisi batas.
4. TEOREMA, IDENTITAS, DAN SIFAT OPERASIONAL: Tuliskan sifat-sifat matematis yang berlaku mutlak.
5. WORKED EXAMPLES (CONTOH PENGERJAAN TAKTIS): Tuliskan 2 contoh soal standar ujian lengkap dengan langkah penurunan aljabar/geometris bertahap (diketahui, ditanya, langkah analitik, kesimpulan).`;

      const pureMathContent = await callRouter([
        { role: "system", content: "You are a master mathematics educator. Output dense, formula-rich, KaTeX-formatted pedagogical content without conversational fluff." },
        { role: "user", content: mathPrompt }
      ], model, 0.15, 6000);

      rawContext = pureMathContent || title;
      segments = segmentDocumentText(rawContext, "pure_ai_math");
      segments.forEach((seg) => {
        insertSeg.run(`seg_${docId}_${seg.index}`, docId, seg.index, "pure_ai_math", seg.text, seg.text, Date.now());
      });
    } else {
      // 1. INGESTION: Multi-Source Web Search across Curricular & Academic Sources (untuk Ilmu Sosial/Humaniora/Umum)
      let webRes = null;
      try {
        webRes = await multiSourceAcademicSearch(title, effectiveSubject, searchQueries);
      } catch (err) {
        console.error("[topics] Multi-source academic search failed:", err);
      }

      if (webRes && webRes.sources && webRes.sources.length > 0) {
        webRes.sources.forEach((src, idx) => {
          const segId = `seg_${docId}_${idx}`;
          const header = `[Sumber: ${src.title}${src.url ? ` (${src.url})` : ""}]`;
          const textWithHeader = `${header}\n${src.text}`;
          insertSeg.run(segId, docId, idx, src.sourceType || "web_search", textWithHeader, textWithHeader, Date.now());
          segments.push({ id: segId, index: idx, title: src.title, text: textWithHeader, sourceType: src.sourceType });
          rawContext += `\n\n${textWithHeader}`;
        });
      } else {
        rawContext = (webRes && webRes.bundle) || (typeof webRes === "string" ? webRes : title);
        segments = segmentDocumentText(rawContext, "web_search");
        segments.forEach((seg) => {
          insertSeg.run(`seg_${docId}_${seg.index}`, docId, seg.index, "web_search", seg.text, seg.text, Date.now());
        });
      }
    }

    // 2. PASS 1: CANONICAL CONCEPT & OUTLINE EXTRACTION FROM RAW WEB SEGMENTS
    const effectiveJenjang = qIntel.jenjang || "SMA";
    const outline = await extractConceptsAndOutline(title, rawContext, segments, model, effectiveJenjang);

    if (outline && Array.isArray(outline.concepts)) {
      const insertConcept = db.prepare("INSERT INTO document_concepts (id, doc_id, name, definition, prerequisites, origin, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)");
      for (const c of outline.concepts) {
        const conceptId = `${docId}_${c.id || Math.random().toString(36).slice(2, 6)}`;
        const def = c.definisi_baku || c.definisi || c.definition || "";
        const extra = JSON.stringify({
          rumus: c.rumus || "",
          tokoh: c.tokoh || [],
          salah_kaprah: c.salah_kaprah || "",
          sumber_ref: c.segmen_id || c.sumber_ref || "web_search",
          jenjang: effectiveJenjang,
          level: c.level || "pahami",
          prasyarat: c.prasyarat || [],
          bukti_kutipan: c.bukti_kutipan || "",
          verified_by_engine: !!c.verified_by_engine
        });
        insertConcept.run(conceptId, docId, c.name, def, extra, c.origin || "source", Date.now());
      }
    }

    // 3. PASS 2: GENERATE NARA'S STUDY MODULE GROUNDED IN CANONICAL OUTLINE & SOURCE CHUNKS
    const content = await generateNaraModule(outline, rawContext, segments, model, effectiveJenjang);

    db.prepare("INSERT INTO documents (id, title, content, summary, created_at) VALUES (?, ?, ?, ?, ?)")
      .run(docId, title, content, outline.executiveSummary || "", Date.now());

    return sendJSON(res, { success: true, docId, title, content_length: content.length });
  }

  return false;
}

module.exports = {
  handleTopicsRoutes
};
