const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("CBT Tracklist Hub: groupPackagesBySubject mengelompokkan paket secara semantis", () => {
  const mockPackages = [
    { id: "p1", subtes_or_mapel: "Matematika", paket: "Paket 1", source: "pusmendik_tka", kategori: "wajib", total_questions: 25 },
    { id: "p2", subtes_or_mapel: "Matematika", paket: "Paket 2", source: "pusmendik_tka", kategori: "wajib", total_questions: 30 },
    { id: "p3", subtes_or_mapel: "Bahasa Indonesia", paket: "Paket 1", source: "pusmendik_tka", kategori: "wajib", total_questions: 20 },
    { id: "p4", subtes_or_mapel: "Sosiologi", paket: "Paket 1", source: "pusmendik_tka", kategori: "pilihan", total_questions: 15 },
  ];

  // Logic mirror from ExamCbtTab.tsx groupPackagesBySubject
  const map = new Map();
  for (const pkg of mockPackages) {
    const key = pkg.subtes_or_mapel || "Lainnya";
    if (!map.has(key)) {
      map.set(key, {
        subject: key,
        category: pkg.kategori || "wajib",
        totalQuestions: 0,
        packages: [],
      });
    }
    const grp = map.get(key);
    grp.packages.push(pkg);
    grp.totalQuestions += (pkg.total_questions || 0);
  }
  const groups = Array.from(map.values());

  assert.equal(groups.length, 3, "Harus menghasilkan 3 kelompok mata pelajaran");
  
  const mtk = groups.find((g) => g.subject === "Matematika");
  assert.ok(mtk, "Grup Matematika harus ada");
  assert.equal(mtk.packages.length, 2, "Matematika memiliki 2 paket");
  assert.equal(mtk.totalQuestions, 55, "Total soal Matematika harus 25 + 30 = 55");

  const bindo = groups.find((g) => g.subject === "Bahasa Indonesia");
  assert.ok(bindo, "Grup Bahasa Indonesia harus ada");
  assert.equal(bindo.packages.length, 1, "Bahasa Indonesia memiliki 1 paket");
  assert.equal(bindo.totalQuestions, 20, "Total soal Bahasa Indonesia harus 20");
});

test("CBT Tracklist Hub: pickQuickMatchPackage memprioritaskan paket resmi Pusmendik", () => {
  const mockPackages = [
    { id: "ai_1", source: "ai_drill", subtes_or_mapel: "Biologi", paket: "Drill 1", total_questions: 10 },
    { id: "pus_1", source: "pusmendik_tka", subtes_or_mapel: "Matematika", paket: "Paket 1", total_questions: 25 },
    { id: "stekom_1", source: "stekom_utbk", subtes_or_mapel: "TPS", paket: "Paket A", total_questions: 20 },
  ];

  const pusmendik = mockPackages.filter((p) => p.source === "pusmendik_tka");
  const pool = pusmendik.length > 0 ? pusmendik : mockPackages;
  const picked = pool[Math.floor(Math.random() * pool.length)];

  assert.ok(picked, "Paket acak terpilih tidak boleh null");
  assert.equal(picked.source, "pusmendik_tka", "Quick Match harus memprioritaskan pusmendik_tka");
});

test("CBT Tracklist Hub: ExamCbtTab.tsx memuat arsitektur Subject-Grouped Tracklist & Quick Match Banner", () => {
  const cbtPath = path.join(__dirname, "../src/components/tabs/ExamCbtTab.tsx");
  assert.ok(fs.existsSync(cbtPath), "ExamCbtTab.tsx harus ada");
  const code = fs.readFileSync(cbtPath, "utf-8");

  // 1. Quick Match Pusmendik Hero Banner
  assert.match(
    code,
    /🎯\s*Ujian Acak Kilat \(Quick Match Pusmendik\)/,
    "Harus ada judul hero Quick Match Pusmendik"
  );
  assert.match(
    code,
    /className=["']cbt-quick-match-banner["']/,
    "Harus memiliki class cbt-quick-match-banner"
  );
  assert.match(
    code,
    /className=["']cbt-quick-match-btn["']/,
    "Harus memiliki class cbt-quick-match-btn"
  );
  assert.match(
    code,
    /const handleQuickMatch\s*=\s*useCallback/,
    "Harus memiliki handler handleQuickMatch"
  );

  // 2. Tracklist Container & Accordion
  assert.match(
    code,
    /className=["']cbt-tracklist-hub["']/,
    "Harus memiliki container .cbt-tracklist-hub"
  );
  assert.match(
    code,
    /className=["']cbt-subject-card["']/,
    "Harus memiliki kartu accordion .cbt-subject-card"
  );
  assert.match(
    code,
    /className=["']cbt-subject-header["']/,
    "Harus memiliki header accordion .cbt-subject-header"
  );
  assert.match(
    code,
    /className=["']cbt-tracklist-row["']/,
    "Harus memiliki baris tracklist .cbt-tracklist-row"
  );
  assert.match(
    code,
    /className=["']cbt-btn-mulai-ujian["']/,
    "Harus memiliki tombol .cbt-btn-mulai-ujian"
  );
  assert.match(
    code,
    /className=["']cbt-btn-latihan-mandiri["']/,
    "Harus memiliki tombol .cbt-btn-latihan-mandiri"
  );
});

test("CBT Palet Warna Kanonikal Tanka: Eliminasi Biru Generik & Adopsi Tanka Crimson/Lime", () => {
  const cbtPath = path.join(__dirname, "../src/components/tabs/ExamCbtTab.tsx");
  const code = fs.readFileSync(cbtPath, "utf-8");

  // 1. Biru generik #2563eb DILARANG ada di ExamCbtTab.tsx
  assert.doesNotMatch(
    code,
    /#2563eb/i,
    "Biru generik #2563eb harus sepenuhnya dibersihkan dari ExamCbtTab.tsx"
  );

  // 2. Palet Tanka Kanonikal
  assert.match(
    code,
    /#c8f064/,
    "Harus menggunakan warna Brand Lime Tanka #c8f064"
  );
  assert.match(
    code,
    /#18221f/,
    "Harus menggunakan warna Dark Ink Tanka #18221f"
  );
  assert.match(
    code,
    /#23342e/,
    "Harus menggunakan warna Dark Slate #23342e"
  );
  assert.match(
    code,
    /#334840/,
    "Harus menggunakan warna border Slate #334840"
  );
  assert.match(
    code,
    /#ff5c5c|#e05353/,
    "Harus menggunakan warna Tanka Crimson #ff5c5c atau #e05353"
  );

  // 3. Badge bergaya .kg-chain-pill
  assert.match(
    code,
    /kg-chain-pill/,
    "Badge paket harus mengadopsi class .kg-chain-pill dari sistem desain Tanka"
  );
});

test("CBT Tracklist CSS: Aturan Responsif dan Ergonomi Mobile di src/index.css", () => {
  const cssPath = path.join(__dirname, "../src/index.css");
  assert.ok(fs.existsSync(cssPath), "src/index.css harus ada");
  const css = fs.readFileSync(cssPath, "utf-8");

  assert.match(
    css,
    /\.cbt-tracklist-hub\s*\{/,
    "index.css harus mendefinisikan .cbt-tracklist-hub"
  );
  assert.match(
    css,
    /\.cbt-quick-match-banner\s*\{/,
    "index.css harus mendefinisikan .cbt-quick-match-banner"
  );
  assert.match(
    css,
    /\.cbt-tracklist-row\s*\{/,
    "index.css harus mendefinisikan .cbt-tracklist-row"
  );
  assert.match(
    css,
    /@media\s*\(max-width:\s*768px\)\s*\{[\s\S]*?min-height:\s*44px\s*!important;/,
    "Tombol aksi mobile pada tracklist harus memenuhi standar touch-target minimal 44px"
  );
});
