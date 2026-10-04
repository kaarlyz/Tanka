const { db } = require("../db");
const { callRouter, detectRealMath } = require("../ai");

async function handleSummaryRoutes(req, res, pathname, helpers) {
  const { sendJSON, getBody } = helpers;

  // 1. POST /api/ai/generate-summary - generate high-retention notes with style selection
  if (req.method === "POST" && pathname === "/api/ai/generate-summary") {
    const { docId, model = "ag/gemini-3.8-flash-low", style = "intuitive" } = await getBody(req);
    const doc = db.prepare("SELECT * FROM documents WHERE id = ?").get(docId);
    if (!doc) return sendJSON(res, { error: "Document not found" }, 404);

    const isMathDomain = detectRealMath(doc.content);

    let styleGuidance = "";
    if (style === "tutor") {
      styleGuidance = `GAYA PENULISAN: MENTOR STEP-BY-STEP (TRANSPARAN & TIDAK MELOMPAT)
- PRINSIP UTAMA: Jangan pernah melakukan perhitungan atau substitusi angka secara tiba-tiba! Siswa sering kebingungan "angka/rumus ini asalnya dari mana?".
- ATURAN PENJELASAN WAJIB:
  1. TULISKAN RUMUS UMUM / TEOREMA DULU: Sebelum memasukkan angka apa pun, tuliskan rumus baku atau teorema dasarnya. (Contoh SALAH: "Kita substitusi x' = x - 3". Contoh BENAR: "Rumus umum translasi T(a,b) adalah x' = x + a. Karena T = (-3, 2), maka...").
  2. JELASKAN ASAL USULNYA: Berikan kalimat pengantar logis dari mana rumus umum itu berasal agar bukan sekadar hafalan buta. (Contoh: "Kenapa x' = x + a? Karena titik bergeser sejauh a pada sumbu X...").
  3. SUBSTITUSI PERLAHAN: Tunjukkan proses memasukkan angka ke rumus langkah demi langkah tanpa loncatan aljabar.
  4. BEDAH JEBAKAN (PITFALLS): Tunjukkan di mana siswa biasanya salah hitung atau salah konsep.
- SEKSI PENUTUP: Berikan "Intisari Kunci" untuk menyimpulkan materi.`;
    } else if (style === "memorization") {
      styleGuidance = `GAYA PENULISAN: POIN HAFALAN & INTISARI UJIAN CEPAT
- Fokus pada materi yang wajib dihafal: istilah kunci, nama tokoh/proses, bagan klasifikasi, poin perbandingan yang sering mengecoh.
- Jika ada rumus, tuliskan RUMUS UMUMNYA DULU dengan jelas sebelum memberikan contoh soal.
- Gunakan ringkasan poin-poin padat, tabel perbandingan, dan mnemonik agar mudah diingat dalam waktu singkat.`;
    } else if (style === "academic") {
      styleGuidance = `GAYA PENULISAN: STRUKTUR FORMAL AKADEMIK LENGKAP
- Susun secara komprehensif, presisi tinggi, dan metodologis.
- Jabarkan setiap penurunan rumus (derivation) secara ketat dan matematis sebelum menerapkannya pada kasus.`;
    } else {
      styleGuidance = `GAYA PENULISAN: BAHASA SEDERHANA, INTUITIF & TRANSPARAN (TUTOR SEBAYA)
- Jelaskan seperti seorang mentor yang mengajarkan adiknya secara sabar.
- ATURAN MUTLAK: JANGAN MELOMPATI RUMUS! Jika ada proses pengerjaan, TULISKAN DULU RUMUS UMUMNYA sebelum angka dimasukkan.
- Jangan biarkan siswa menebak-nebak "ini dapat dari mana?". Jabarkan logika dasarnya (asal-usul aturan tersebut) dengan bahasa yang sangat membumi.
- Gunakan analogi konkret yang langsung memicu 'Aha! moment'.`;
    }

    const mathSectionBlock = isMathDomain
      ? `3. **Rumus, Persamaan, & Aturan Pokok**:
   - Tuliskan rumus yang ada dalam materi menggunakan KaTeX LaTeX ($...$ inline atau $$...$$ blok).
   - Wajib sertakan cara membaca rumus dengan bahasa manusia biasa dan contoh angka kecil sederhana.`
      : `3. **Kaidah Pokok, Karakteristik Utama, & Klasifikasi**:
   - DILARANG KERAS MENGARANG RUMUS/PERSAMAAN MATEMATIKA PALSU untuk materi seni, sejarah, kriya, atau ilmu sosial.
   - Sajikan prinsip inti, kaidah perancangan, tabel perbandingan konsep, atau taksonomi klasifikasi murni konseptual.`;

    const prompt = style === "tutor"
      ? `Anda adalah mentor belajar pribadi yang ramah, taktis, dan fokus pada penguasaan mandiri.
Pelajari materi di bawah dan susun panduan belajar bertahap yang hidup, kreatif, dan adaptif:

${styleGuidance}

Format dengan Markdown rapi, KaTeX LaTeX ($...$ inline atau $$...$$ blok) untuk rumus/angka, dan kotak penekanan untuk trik kunci.

Materi Lengkap:
"""
${doc.content.slice(0, 25000)}
"""`
      : `Anda adalah pakar sintesis materi edukasi.
Susun Catatan Inti & Peta Konsep Komprehensif yang MENCAKUP SELURUH materi tanpa ada bagian penting yang terlewat.

${styleGuidance}

STRUKTUR SISTEMATIS CATATAN:
1. **Peta Konsep & Kerangka Besar**: Alur proses, tabel komparasi, atau pembagian kategori yang paling cocok.
2. **Bedah Konsep Kunci & Analogi Nyata**: Minimal 1 analogi konkret atau contoh kasus nyata per istilah.
${mathSectionBlock}
4. **Pola Kritis & Analisis Jebakan (Common Pitfalls)**: Miskonsepsi ujian umum dan trik membedakannya.
5. **Rangkuman Eksekutif & Kaidah Kunci (Mental Model)**: 3-4 intisari mutlak.

Format dengan Markdown rapi.

Materi Lengkap:
"""
${doc.content.slice(0, 25000)}
"""`;

    const summary = await callRouter([
      { role: "system", content: "You are an elite academic tutor providing high-retention comprehensive study notes." },
      { role: "user", content: prompt }
    ], model);

    db.prepare("UPDATE documents SET summary = ? WHERE id = ?").run(summary, docId);
    return sendJSON(res, { success: true, summary, style });
  }

  // 2. POST /api/ai/tailor-summary - Tailor/edit an existing summary dynamically based on a user prompt
  if (req.method === "POST" && pathname === "/api/ai/tailor-summary") {
    const { docId, currentSummary, tailorPrompt, model = "ag/gemini-3.8-flash-low" } = await getBody(req);
    
    if (!currentSummary || !tailorPrompt) {
      return sendJSON(res, { error: "Missing currentSummary or tailorPrompt" }, 400);
    }

    const prompt = `Anda adalah asisten akademik cerdas yang membantu merevisi dan menyesuaikan materi belajar.
Pengguna memiliki rangkuman materi berikut dan ingin melakukan penyesuaian khusus.

Tugas Anda:
Edit/Ubah teks rangkuman di bawah HANYA sesuai dengan permintaan pengguna. Pertahankan bagian yang tidak terpengaruh, dan tetap gunakan format Markdown yang rapi (termasuk LaTeX $...$ untuk matematika).

Permintaan Penyesuaian Pengguna:
"${tailorPrompt}"

=== RANGKUMAN SAAT INI ===
${currentSummary}
===========================

Tulis ulang secara penuh hasil rangkuman yang telah disesuaikan:`;

    const newSummary = await callRouter([
      { role: "system", content: "You are an elite academic assistant tailoring study materials." },
      { role: "user", content: prompt }
    ], model);

    // Save the new version
    db.prepare("UPDATE documents SET summary = ? WHERE id = ?").run(newSummary, docId);
    return sendJSON(res, { success: true, summary: newSummary });
  }

  return false;
}

module.exports = {
  handleSummaryRoutes
};
