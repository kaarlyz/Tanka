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
      styleGuidance = `GAYA PENULISAN: TUTOR ADAPTIF & LATIHAN MANDIRI
- PRINSIP: Jelaskan persis seperti seorang mentor sebaya yang asyik, tajam, fleksibel, dan adaptif terhadap karakter materi. Bimbing siswa agar punya intuisi kuat dan mandiri menyelesaikan soal.
- FLEKSIBILITAS PEDAGOGIS:
  * Eksak / Matematika / Fisika: Berikan intuisi konsep terlebih dahulu -> contoh pengerjaan angka kecil konkret langkah demi langkah -> soroti kondisi batas / syarat legal rumus -> intisari mental model.
  * Sosial / Sosiologi / Sejarah: Bedah dialektika & perdebatan pemikir -> studi kasus nyata masyarakat -> tabel/bagan komparasi sudut pandang -> trik eliminasi jebakan ujian.
  * Ekonomi / Bisnis: Jelaskan mekanisme insentif & sebab-akibat -> skenario nyata kebijakan riil -> komparasi instrumen -> intisari keputusan.
- SEKSI PENUTUP: "INTISARI KUNCI (MENTAL MODEL)" berisi 3–4 kaidah emas untuk merekatkan pemahaman sebelum ujian.
- DILARANG KERAS membuat daftar soal latihan / kuis di dalam catatan.`;
    } else if (style === "memorization") {
      styleGuidance = `GAYA PENULISAN: POIN HAFALAN & INTISARI UJIAN CEPAT
- Fokus pada materi yang wajib dihafal: istilah kunci, nama tokoh/proses, bagan klasifikasi, poin perbandingan yang sering mengecoh.
- Gunakan ringkasan poin-poin padat, tabel perbandingan, dan mnemonik agar mudah diingat dalam waktu singkat.`;
    } else if (style === "academic") {
      styleGuidance = `GAYA PENULISAN: STRUKTUR FORMAL AKADEMIK LENGKAP
- Susun secara komprehensif, presisi tinggi, dan metodologis.
- Bedah latar belakang teoritis, relasi sebab-akibat, dan analisis kritis mendalam.`;
    } else {
      styleGuidance = `GAYA PENULISAN: BAHASA SEDERHANA & INTUITIF (TUTOR SEBAYA)
- Jelaskan seperti seorang mentor senior yang cerdas dan asyik.
- Mulai dari masalah nyata: "Kenapa konsep ini diciptakan? Di mana kita menjumpainya dalam kehidupan nyata?"
- Gunakan analogi konkret yang langsung memicu 'Aha! moment'.
- Pertahankan substansi 100% lengkap dan akurat.`;
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
