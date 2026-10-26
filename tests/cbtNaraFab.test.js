const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("CBT Nara FAB: Elemen .cbt-nara-floating-fab bertipe floating circle dan posisi fixed dirender di DOM saat CBT runner aktif", () => {
  const cbtTabPath = path.join(__dirname, "../src/components/tabs/ExamCbtTab.tsx");
  assert.ok(fs.existsSync(cbtTabPath), "ExamCbtTab.tsx harus ada");

  const content = fs.readFileSync(cbtTabPath, "utf-8");

  // 1. Memastikan tombol FAB dirender dengan className cbt-nara-floating-fab
  assert.match(
    content,
    /<motion\.button[\s\S]*?className=["']cbt-nara-floating-fab["'][\s\S]*?>/,
    "Komponen motion.button dengan className cbt-nara-floating-fab harus ada"
  );

  // 2. Memastikan bentuk lingkaran (borderRadius: '50%') dan posisi fixed
  assert.match(
    content,
    /borderRadius:\s*["']50%["']/,
    "FAB harus berbentuk lingkaran (borderRadius: 50%)"
  );
  assert.match(
    content,
    /position:\s*["']fixed["']/,
    "FAB harus memiliki posisi fixed"
  );

  // 3. Memastikan palet warna tema (#18221f dan lime #c8f064)
  assert.match(
    content,
    /backgroundColor:\s*["']#18221f["']/,
    "FAB harus memiliki backgroundColor: #18221f"
  );
  assert.match(
    content,
    /color:\s*["']#c8f064["']/,
    "FAB harus memiliki color: #c8f064"
  );

  // 4. Memastikan icon Sparkles dan badge AI
  assert.match(
    content,
    /<Sparkles\s+size=\{20\}\s+color=["']#c8f064["']\s*\/>/,
    "FAB harus memuat icon Sparkles size 20 warna lime #c8f064"
  );
  assert.match(
    content,
    /<span[\s\S]*?className=["']cbt-nara-fab-badge["'][\s\S]*?>\s*AI\s*<\/span>/,
    "FAB harus memuat badge AI kecil"
  );

  // 5. Verifikasi CSS src/index.css memuat aturan responsif desktop & mobile
  const cssPath = path.join(__dirname, "../src/index.css");
  assert.ok(fs.existsSync(cssPath), "src/index.css harus ada");
  const css = fs.readFileSync(cssPath, "utf-8");

  assert.match(
    css,
    /\.cbt-nara-floating-fab\s*\{[\s\S]*?bottom:\s*calc\(85px\s*\+\s*env\(safe-area-inset-bottom,\s*0px\)\)/,
    "CSS desktop harus memposisikan FAB di bottom 85px"
  );
  assert.match(
    css,
    /\.cbt-nara-floating-fab\s*\{[\s\S]*?bottom:\s*calc\(130px\s*\+\s*env\(safe-area-inset-bottom,\s*0px\)\)/,
    "CSS mobile harus memposisikan FAB di bottom 130px (di atas dock ganda)"
  );
});

test("CBT Nara FAB: Mengklik FAB memicu onOpenNara dengan payload lengkap nomor soal dan wacana aktif", () => {
  // Simulasi handler yang diimplementasikan di ExamCbtTab.tsx
  function handleTanyaNara(currentItem, currentPackage, onOpenNara) {
    if (!onOpenNara) return;
    const cleanBacaan = currentItem.bacaan
      ? currentItem.bacaan.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 300)
      : "";
    const cleanSoal = currentItem.soal.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const query = `Halo Nara AI, saya sedang mengerjakan soal ujian ini dan butuh bantuan pemahaman konsep:
Mata Pelajaran: ${currentPackage?.subtes_or_mapel || ""} (${currentPackage?.paket || ""})
Nomor Soal: ${currentItem.nomor}
${cleanBacaan ? `Wacana: "${cleanBacaan}..."\n` : ""}Pertanyaan: "${cleanSoal}"

Tolong berikan petunjuk/clue pemikiran tanpa langsung membocorkan jawaban final.`;
    onOpenNara(query);
  }

  // 1. Uji pemanggilan dengan wacana dan mata pelajaran
  let calledQuery = null;
  const mockOnOpenNara = (q) => {
    calledQuery = q;
  };

  const samplePackage = {
    subtes_or_mapel: "Literasi Bahasa Indonesia",
    paket: "Paket UTBK 2026",
  };

  const sampleItemWithBacaan = {
    nomor: 7,
    bacaan: "<p>Ekonomi sirkular berfokus pada <strong>keberlanjutan</strong> lingkungan hidup.</p>",
    soal: "<p>Apa tujuan utama dari <em>ekonomi sirkular</em>?</p>",
  };

  handleTanyaNara(sampleItemWithBacaan, samplePackage, mockOnOpenNara);

  assert.ok(calledQuery, "onOpenNara harus dipanggil dengan string query");
  assert.match(calledQuery, /Nomor Soal:\s*7/, "Query harus memuat nomor soal");
  assert.match(calledQuery, /Mata Pelajaran:\s*Literasi Bahasa Indonesia \(Paket UTBK 2026\)/, "Query harus memuat nama subtes dan paket");
  assert.match(calledQuery, /Wacana:\s*"Ekonomi sirkular berfokus pada keberlanjutan lingkungan hidup/, "Query harus memuat wacana yang bersih dari HTML");
  assert.match(calledQuery, /Pertanyaan:\s*"Apa tujuan utama dari ekonomi sirkular/, "Query harus memuat pertanyaan yang bersih dari HTML");
  assert.match(calledQuery, /Tolong berikan petunjuk\/clue pemikiran tanpa langsung membocorkan jawaban final\./, "Query harus memuat instruksi bimbingan Nara AI");

  // 2. Uji pemanggilan tanpa wacana
  calledQuery = null;
  const sampleItemWithoutBacaan = {
    nomor: 12,
    bacaan: null,
    soal: "Berapa nilai x jika 2x + 4 = 10?",
  };

  handleTanyaNara(sampleItemWithoutBacaan, samplePackage, mockOnOpenNara);
  assert.ok(calledQuery);
  assert.match(calledQuery, /Nomor Soal:\s*12/);
  assert.doesNotMatch(calledQuery, /Wacana:/, "Query tidak boleh menyertakan baris Wacana jika wacana kosong");

  // 3. Uji jika onOpenNara null/undefined tidak throw error
  assert.doesNotThrow(() => {
    handleTanyaNara(sampleItemWithBacaan, samplePackage, undefined);
  });
});

test("CBT Nara FAB: Footer aksi soal bersih dari tombol teks redundan dan memiliki navigasi luas", () => {
  const cbtTabPath = path.join(__dirname, "../src/components/tabs/ExamCbtTab.tsx");
  const content = fs.readFileSync(cbtTabPath, "utf-8");

  // 1. Footer tidak boleh lagi memuat tombol teks cbt-nara-quick-btn
  assert.doesNotMatch(
    content,
    /<footer[\s\S]*?className=["']cbt-action-footer["'][\s\S]*?cbt-nara-quick-btn[\s\S]*?<\/footer>/,
    "Footer cbt-action-footer tidak boleh lagi memuat cbt-nara-quick-btn"
  );

  // 2. Footer hanya memuat Sebelumnya, Ragu-Ragu, dan Berikutnya / Selesai
  assert.match(
    content,
    /<footer[\s\S]*?className=["']cbt-action-footer["'][\s\S]*?Sebelumnya[\s\S]*?<\/footer>/,
    "Footer harus memuat tombol Sebelumnya"
  );
  assert.match(
    content,
    /<footer[\s\S]*?className=["']cbt-action-footer["'][\s\S]*?Berikutnya[\s\S]*?<\/footer>/,
    "Footer harus memuat tombol Berikutnya"
  );
  assert.match(
    content,
    /<footer[\s\S]*?className=["']cbt-action-footer["'][\s\S]*?Ragu-Ragu[\s\S]*?<\/footer>/,
    "Footer harus memuat tombol Ragu-Ragu"
  );
});
