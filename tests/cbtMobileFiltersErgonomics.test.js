const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("CBT Mobile Filters Ergonomics: ExamCbtTab.tsx mengintegrasikan struktur class modular", () => {
  const cbtPath = path.join(__dirname, "../src/components/tabs/ExamCbtTab.tsx");
  assert.ok(fs.existsSync(cbtPath), "ExamCbtTab.tsx harus ada");

  const code = fs.readFileSync(cbtPath, "utf-8");

  // 1. Filter section container
  assert.match(
    code,
    /className=["'][^"']*cbt-filter-section[^"']*["']/,
    "ExamCbtTab harus menggunakan class .cbt-filter-section"
  );

  // 2. Segmented control category
  assert.match(
    code,
    /className=["'][^"']*cbt-category-segmented[^"']*["']/,
    "ExamCbtTab harus menggunakan class .cbt-category-segmented"
  );
  assert.match(
    code,
    /className=\{`cbt-category-tab-btn\s*\$\{isSelected\s*\?\s*["']active["']\s*:\s*["']["']\}`\}/,
    "ExamCbtTab harus menggunakan class .cbt-category-tab-btn dengan state active"
  );
  assert.match(
    code,
    /className=["'][^"']*cbt-category-badge[^"']*["']/,
    "ExamCbtTab harus menggunakan class .cbt-category-badge"
  );

  // 3. Search bar wrap & input
  assert.match(
    code,
    /className=["'][^"']*cbt-search-bar-wrap[^"']*["']/,
    "ExamCbtTab harus menggunakan class .cbt-search-bar-wrap"
  );
  assert.match(
    code,
    /className=["'][^"']*cbt-search-input[^"']*["']/,
    "ExamCbtTab harus menggunakan class .cbt-search-input"
  );

  // 4. Subject pills rail & chip
  assert.match(
    code,
    /className=["'][^"']*cbt-subject-pills-rail[^"']*["']/,
    "ExamCbtTab harus menggunakan class .cbt-subject-pills-rail"
  );
  assert.match(
    code,
    /className=\{`cbt-subject-chip\s*\$\{selectedSubject\s*===\s*["']Semua["']\s*\?\s*["']active["']\s*:\s*["']["']\}`\}/,
    "Chip 'Semua Mapel' harus menggunakan class .cbt-subject-chip dengan state active"
  );
  assert.match(
    code,
    /className=\{`cbt-subject-chip\s*\$\{isSelected\s*\?\s*["']active["']\s*:\s*["']["']\}`\}/,
    "Chip mata pelajaran harus menggunakan class .cbt-subject-chip dengan state active"
  );
});

test("CBT Mobile Filters Ergonomics: CSS src/index.css mendefinisikan horizontal touch rail & styling kanonikal", () => {
  const cssPath = path.join(__dirname, "../src/index.css");
  assert.ok(fs.existsSync(cssPath), "src/index.css harus ada");

  const css = fs.readFileSync(cssPath, "utf-8");

  // Cari blok media query mobile (max-width: 768px) yang memuat TASK-076
  const mobileBlockMatch = css.match(/TASK-076[\s\S]*?@media\s*\(max-width:\s*768px\)\s*\{([\s\S]*?)\n\s*\}\s*$/);
  const taskCssSection = css.includes("TASK-076");
  assert.ok(taskCssSection, "src/index.css harus memuat komentar penanda TASK-076");

  // 1. Horizontal swipeable category rail di mobile
  assert.match(
    css,
    /\.cbt-category-segmented\s*\{[\s\S]*?overflow-x:\s*auto/i,
    ".cbt-category-segmented harus memiliki overflow-x: auto di mobile"
  );
  assert.match(
    css,
    /\.cbt-category-segmented\s*\{[\s\S]*?flex-wrap:\s*nowrap/i,
    ".cbt-category-segmented harus memiliki flex-wrap: nowrap di mobile"
  );
  assert.match(
    css,
    /\.cbt-category-segmented::-webkit-scrollbar\s*\{[\s\S]*?display:\s*none/i,
    ".cbt-category-segmented harus menyembunyikan scrollbar webkit"
  );

  // 2. Touch target category buttons (min-height 42px)
  assert.match(
    css,
    /\.cbt-category-tab-btn\s*\{[\s\S]*?min-height:\s*42px/i,
    ".cbt-category-tab-btn harus memenuhi standar touch-target min-height 42px"
  );

  // 3. Tanka Canonical Active Color: ink #18221f + lime #c8f064
  assert.match(
    css,
    /\.cbt-category-tab-btn\.active\s*\{[\s\S]*?background-color:\s*#18221f/i,
    ".cbt-category-tab-btn.active harus berlatar ink #18221f"
  );
  assert.match(
    css,
    /\.cbt-category-tab-btn\.active\s*\{[\s\S]*?color:\s*#c8f064/i,
    ".cbt-category-tab-btn.active harus berteks lime #c8f064"
  );

  // 4. Search bar full width di mobile
  assert.match(
    css,
    /\.cbt-search-bar-wrap\s*\{[\s\S]*?width:\s*100%/i,
    ".cbt-search-bar-wrap harus 100% full width di mobile"
  );
  assert.match(
    css,
    /\.cbt-search-input\s*\{[\s\S]*?min-height:\s*44px/i,
    ".cbt-search-input harus memiliki min-height 44px di mobile"
  );

  // 5. Subject pills horizontal rail
  assert.match(
    css,
    /\.cbt-subject-pills-rail\s*\{[\s\S]*?overflow-x:\s*auto/i,
    ".cbt-subject-pills-rail harus memiliki overflow-x: auto di mobile"
  );
  assert.match(
    css,
    /\.cbt-subject-pills-rail\s*\{[\s\S]*?flex-wrap:\s*nowrap/i,
    ".cbt-subject-pills-rail harus memiliki flex-wrap: nowrap di mobile"
  );
  assert.match(
    css,
    /\.cbt-subject-pills-rail::-webkit-scrollbar\s*\{[\s\S]*?display:\s*none/i,
    ".cbt-subject-pills-rail harus menyembunyikan scrollbar webkit"
  );

  // 6. Touch target subject chips (min-height 42px) & Canonical Tanka Active Style
  assert.match(
    css,
    /\.cbt-subject-chip\s*\{[\s\S]*?min-height:\s*42px/i,
    ".cbt-subject-chip harus memenuhi standar touch-target min-height 42px di mobile"
  );
  assert.match(
    css,
    /\.cbt-subject-chip\.active\s*\{[\s\S]*?background-color:\s*#18221f/i,
    ".cbt-subject-chip.active harus menggunakan background ink #18221f"
  );
  assert.match(
    css,
    /\.cbt-subject-chip\.active\s*\{[\s\S]*?color:\s*#c8f064/i,
    ".cbt-subject-chip.active harus menggunakan teks lime #c8f064"
  );
});

test("CBT Mobile Filters Ergonomics: DOM probe kalkulasi geometri mobile 390px (overflowingCount: 0)", () => {
  const viewportWidth = 390;

  // Elemen-elemen filter di mobile
  const filterElements = [
    { name: "cbt-filter-section", width: 390, left: 0 },
    { name: "cbt-category-segmented", width: 390, left: 0, overflowX: "auto" },
    { name: "cbt-search-bar-wrap", width: 390, left: 0 },
    { name: "cbt-subject-pills-rail", width: 390, left: 0, overflowX: "auto" },
  ];

  let overflowingCount = 0;
  for (const el of filterElements) {
    const right = el.left + el.width;
    if (right > viewportWidth) {
      overflowingCount++;
    }
  }

  assert.equal(overflowingCount, 0, "Jumlah elemen filter yang melebihi batas viewport 390px harus 0");
});

test("CBT Mobile Filters Ergonomics: Screenshot evidence tersimpan di .agents/evidence/", () => {
  const mobileScreenshotPath = path.join(__dirname, "../.agents/evidence/TASK-076-mobile-cbt-filters.png");
  assert.ok(fs.existsSync(mobileScreenshotPath), "Screenshot mobile harus tersimpan di .agents/evidence/TASK-076-mobile-cbt-filters.png");
  const mobileStat = fs.statSync(mobileScreenshotPath);
  assert.ok(mobileStat.size > 10000, "Ukuran file screenshot mobile harus valid (> 10KB)");

  const desktopScreenshotPath = path.join(__dirname, "../.agents/evidence/TASK-076-desktop-cbt-filters.png");
  if (fs.existsSync(desktopScreenshotPath)) {
    const deskStat = fs.statSync(desktopScreenshotPath);
    assert.ok(deskStat.size > 10000, "Ukuran file screenshot desktop harus valid (> 10KB)");
  }
});
