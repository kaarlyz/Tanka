const { callRouter } = require("../ai");
const { NARA_GLOBAL_PERSONA } = require("../prompts/nara");

/**
 * Segment raw text into logical parts (per page, per slide, or per ~750 words).
 */
function segmentDocumentText(rawText, sourceType = "text") {
  if (!rawText || typeof rawText !== "string") return [];

  // If already contains slide markers
  if (rawText.includes("--- Slide ")) {
    return rawText
      .split(/--- Slide \d+ ---/)
      .map((part) => part.trim())
      .filter((part) => part.length > 0)
      .map((text, idx) => ({
        index: idx + 1,
        sourceType: "slide",
        text
      }));
  }

  // If contains page markers
  if (rawText.includes("--- Halaman Berikutnya ---")) {
    return rawText
      .split("--- Halaman Berikutnya ---")
      .map((part) => part.trim())
      .filter((part) => part.length > 0)
      .map((text, idx) => ({
        index: idx + 1,
        sourceType: "pdf_page",
        text
      }));
  }

  // Default: semantic paragraph chunks (~600-900 words)
  const paragraphs = rawText.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const segments = [];
  let currentBuffer = [];
  let currentWordCount = 0;

  for (const para of paragraphs) {
    const pWords = para.split(/\s+/).length;
    if (currentWordCount + pWords > 750 && currentBuffer.length > 0) {
      segments.push({
        index: segments.length + 1,
        sourceType: sourceType,
        text: currentBuffer.join("\n\n")
      });
      currentBuffer = [para];
      currentWordCount = pWords;
    } else {
      currentBuffer.push(para);
      currentWordCount += pWords;
    }
  }

  if (currentBuffer.length > 0) {
    segments.push({
      index: segments.length + 1,
      sourceType: sourceType,
      text: currentBuffer.join("\n\n")
    });
  }

  return segments;
}

/**
 * Step 1: Extract canonical concepts and dynamic curriculum outline without hardcoded 5 chapters.
 */
async function extractConceptsAndOutline(docTitle, fullText, segments = [], model = "ag/gemini-3.8-flash-low") {
  // If segments provided, summarize each segment to prevent losing content beyond token limits
  let segmentOverview = "";
  if (segments.length > 1) {
    segmentOverview = segments
      .map((s) => `[Bagian ${s.index} (${s.sourceType})]:\n${s.text.slice(0, 1500)}`)
      .join("\n\n---\n\n");
  } else {
    segmentOverview = fullText.slice(0, 18000);
  }

  const prompt = `Tugas Anda: Analisis bahan pembelajaran berikut dan susun rencana kurikulum (Dynamic Outline) serta daftar konsep kunci.
Judul Materi: "${docTitle}"

Bahan Pembelajaran:
"""
${segmentOverview}
"""

ATURAN STRUKTUR & KONTEN:
1. JUMLAH BAB HARUS PROPORSIONAL DENGAN KONSEP (OTONOM & FLEKSIBEL):
   - Jika materi ringkas (hanya 2-3 konsep), susun TEPAT 2 atau 3 bab saja.
   - JANGAN memaksakan harus 5 bab jika materinya sempit. DILARANG membuat bab fiktif untuk memenuhi kuota.
   - Setiap bab dalam array "chapters" WAJIB memiliki minimal 1 keyConceptId ("keyConceptIds": ["c1"]). DILARANG membuat bab tanpa konsep.
2. Hanya cantumkan konsep kunci yang BENAR-BENAR ada di dalam teks sumber (origin: "source").
3. DILARANG MENCIPTAKAN RUMUS FIKTIF. Jika bukan materi eksak/hitung (seperti Sosiologi, Sejarah), kosongkan field rumus.
4. Jika ada konsep penting dari kurikulum nasional yang relevan tapi belum dibahas teks, masukkan sebagai pengayaan (origin: "ai_enrichment").
5. Kembalikan HANYA format JSON valid berikut:
{
  "title": "${docTitle}",
  "executiveSummary": "Ringkasan 2-3 kalimat bertutur tentang esensi materi.",
  "concepts": [
    {
      "id": "c1",
      "name": "Nama Konsep / Istilah Baku",
      "definisi_baku": "Definisi baku resmi sesuai kurikulum/buku teks",
      "rumus": "Rumus KaTeX baku (misal $Q_d = a - bP$) jika ada, atau kosongkan jika ilmu sosial/non-hitung",
      "tokoh": ["Nama Tokoh/Ahli resmi jika ada di materi"],
      "salah_kaprah": "Miskonsepsi yang sering terjadi pada siswa",
      "origin": "source"
    }
  ],
  "chapters": [
    {
      "chapterNumber": 1,
      "chapterTitle": "Judul Bab Runtut",
      "targetGoal": "Apa yang dipahami murid di bab ini",
      "keyConceptIds": ["c1"]
    }
  ]
}`;

  try {
    const response = await callRouter(
      [
        { role: "system", content: "You are a professional educational curriculum architect. Strictly return valid JSON." },
        { role: "user", content: prompt }
      ],
      model,
      0.1
    );

    let cleanJSON = response.trim();
    if (cleanJSON.startsWith("```json")) cleanJSON = cleanJSON.slice(7);
    else if (cleanJSON.startsWith("```")) cleanJSON = cleanJSON.slice(3);
    if (cleanJSON.endsWith("```")) cleanJSON = cleanJSON.slice(0, -3);

    return JSON.parse(cleanJSON.trim());
  } catch (err) {
    console.warn("[curriculumPipeline] Fallback outline due to error:", err.message);
    return {
      title: docTitle,
      executiveSummary: "Modul pembelajaran mandiri terstruktur.",
      concepts: [{ id: "c1", name: docTitle, definition: "Konsep utama materi.", origin: "source" }],
      chapters: [
        { chapterNumber: 1, chapterTitle: "Fondasi Materi", targetGoal: "Memahami konsep dasar", keyConceptIds: ["c1"] },
        { chapterNumber: 2, chapterTitle: "Penerapan & Contoh", targetGoal: "Melihat contoh nyata", keyConceptIds: ["c1"] }
      ]
    };
  }
}

/**
 * Step 2: Generate full pedagogical module using Nara persona, based on dynamic outline.
 */
async function generateNaraModule(outline, fullText, segments = [], model = "ag/gemini-3.8-flash-low") {
  // Use segment text context
  const sourceContext = segments.length > 0
    ? segments.map((s) => `--- Bagian ${s.index} (${s.sourceType}) ---\n${s.text}`).join("\n\n")
    : fullText;

  const prompt = `${NARA_GLOBAL_PERSONA}

Tugas Anda: Susun materi pembelajaran lengkap untuk siswa berdasarkan kerangka (outline) dan teks sumber berikut.

Judul: "${outline.title}"
Rencana Bab:
${JSON.stringify(outline.chapters, null, 2)}

Daftar Konsep Kunci:
${JSON.stringify(outline.concepts, null, 2)}

Teks Sumber Asli:
"""
${sourceContext.slice(0, 24000)}
"""

PETUNJUK PENULISAN:
1. Mulai dengan judul markdown: # ${outline.title}
2. Tuliskan ringkasan eksekutif dalam blockquote: > [Ringkasan singkat bertutur]
3. Tulis bab per bab mengikuti rencana bab (Gunakan ## untuk Bab, ### untuk Sub-bab). DILARANG MENAMBAH BAB DI LUAR RENCANA. Jika rencana bab hanya memiliki 2 atau 3 bab, hasil akhir WAJIB TEPAT 2 ATAU 3 BAB. Dilarang menambahkan bab ujian / kancing memori mandiri jika tidak ada di dalam rencana bab.
4. KONTRAK STRUKTUR SUB-BAB (WAJIB DIPATUHI PER KONSEP):
   Setiap sub-bab (### [Nama Konsep]) WAJIB memuat urutan ini:
   a. Situasi / Intuisi konkret sehari-hari (1-2 paragraf pendek).
   b. Kotak Definisi Baku resmi dalam blockquote:
      > 📖 **Definisi Baku:** [Tuliskan definisi baku kurikulum/buku teks di sini secara presisi tanpa diubah jadi dongeng]
   c. Penjelasan Mekanisme & Sebab-Akibat.
   d. Rumus & Contoh Hitungan Konkret (Jika Eksak / Ekonomi): Tuliskan rumus KaTeX ($...$) dan contoh hitungan dengan angka riil.
   e. Peringatan Salah Kaprah (Pitfall): Kesalahan umum siswa di ujian.
5. LARANGAN MUTLAK ANTI-HALUSINASI:
   - DILARANG KERAS MENCIPTAKAN RUMUS FISIKA/MATEMATIKA PADA TOPIK SOSIAL/HUMANIORA (Sosiologi, Sejarah, Bahasa).
   - Dilarang mengarang tokoh fiktif atau istilah palsu.
6. Jika ada contoh kasus atau analogi di luar teks sumber, wajib tandai dengan:
   > 💡 **Insight Nara (Pengayaan):** [Uraian contoh/analogi...]
7. Jika ada rumus eksak/matematika, WAJIB gunakan format KaTeX rapi ($rumus$ atau $$blok$$).`;

  const content = await callRouter(
    [
      { role: "system", content: "You are Nara, an empathetic and highly articulate study tutor for high school students." },
      { role: "user", content: prompt }
    ],
    model,
    0.25
  );

  return content ? content.trim() : fullText;
}

module.exports = {
  segmentDocumentText,
  extractConceptsAndOutline,
  generateNaraModule
};
