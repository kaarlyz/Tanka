const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("TASK-CBT-075: Tab 'semua' dihapus dan default kategori awal langsung 'sma_wajib'", () => {
  const cbtPath = path.join(__dirname, "../src/components/tabs/ExamCbtTab.tsx");
  assert.ok(fs.existsSync(cbtPath), "ExamCbtTab.tsx harus ada");

  const content = fs.readFileSync(cbtPath, "utf-8");

  // 1. Tab id: "semua" tidak boleh ada di CbtCategory type
  assert.doesNotMatch(
    content,
    /type\s+CbtCategory\s*=\s*[^;]*"semua"/,
    "Type CbtCategory tidak boleh lagi menyertakan 'semua'"
  );
  assert.match(
    content,
    /type\s+CbtCategory\s*=\s*"sma_wajib"\s*\|\s*"sma_pilihan"\s*\|\s*"utbk_snbt"\s*\|\s*"ai_drill"\s*\|\s*"history";/,
    "Type CbtCategory harus dimulai langsung dari 'sma_wajib'"
  );

  // 2. Default state selectedCategory harus 'sma_wajib'
  assert.match(
    content,
    /const\s*\[selectedCategory,\s*setSelectedCategory\]\s*=\s*useState<CbtCategory>\("sma_wajib"\);/,
    "selectedCategory harus memiliki initial state 'sma_wajib'"
  );

  // 3. Tab bar kategori tidak memuat id: "semua"
  assert.doesNotMatch(
    content,
    /id:\s*["']semua["']\s*as\s*const/,
    "Daftar tab kategori tidak boleh memuat tab id 'semua'"
  );

  // 4. Fallback filter dan perbandingan tab.id === 'semua' / selectedCategory === 'semua' harus dibersihkan
  assert.doesNotMatch(
    content,
    /selectedCategory\s*===\s*["']semua["']/,
    "ExamCbtTab tidak boleh lagi memuat percabangan selectedCategory === 'semua'"
  );
  assert.doesNotMatch(
    content,
    /tab\.id\s*===\s*["']semua["']/,
    "ExamCbtTab tidak boleh lagi memuat perbandingan tab.id === 'semua'"
  );

  // 5. Tombol kembali dari riwayat kosong mengarah ke 'sma_wajib'
  assert.match(
    content,
    /setSelectedCategory\(["']sma_wajib["']\)/,
    "Tombol Pilih Paket Soal pada riwayat kosong harus mengarahkan ke 'sma_wajib'"
  );

  // 6. Label tombol subtes diubah kontekstual menjadi 'Semua Mapel ({filteredPackages.length})'
  assert.match(
    content,
    /Semua Mapel \(\{filteredPackages\.length\}\)/,
    "Tombol filter subtes harus berlabel 'Semua Mapel ({filteredPackages.length})'"
  );
});

test("TASK-CBT-075: Logika filter kategori 'sma_wajib' otomatis menyaring paket SMA Wajib secara eksklusif", () => {
  const mockPackages = [
    { id: "pkg_wajib_1", subtes_or_mapel: "Bahasa Indonesia", paket: "Paket 1", source: "pusmendik_tka", kategori: "wajib" },
    { id: "pkg_wajib_2", subtes_or_mapel: "Matematika", paket: "Paket 1", source: "pusmendik_tka", kategori: "wajib" },
    { id: "pkg_wajib_ai", subtes_or_mapel: "Bahasa Inggris", paket: "AI Drill 1", source: "ai_drill", kategori: "wajib" },
    { id: "pkg_pilihan_1", subtes_or_mapel: "Sosiologi", paket: "Paket 1", source: "pusmendik_tka", kategori: "pilihan" },
    { id: "pkg_pilihan_2", subtes_or_mapel: "Ekonomi", paket: "Paket 1", source: "pusmendik_tka", kategori: "pilihan" },
    { id: "pkg_utbk_1", subtes_or_mapel: "Penalaran Umum", paket: "Simulasi A", source: "stekom_utbk", kategori: "utbk" },
  ];

  // Simulasi filter logic persis seperti di ExamCbtTab.tsx
  const selectedCategory = "sma_wajib";
  const selectedSubject = "Semua";
  const searchQuery = "";

  const filtered = mockPackages.filter((p) => {
    if (selectedCategory === "sma_wajib") {
      if (!((p.source === "pusmendik_tka" || p.source === "ai_drill") && p.kategori === "wajib")) return false;
    } else if (selectedCategory === "sma_pilihan") {
      if (!((p.source === "pusmendik_tka" || p.source === "ai_drill") && p.kategori === "pilihan")) return false;
    } else if (selectedCategory === "utbk_snbt") {
      if (p.source !== "stekom_utbk") return false;
    } else if (selectedCategory === "ai_drill") {
      if (p.source !== "ai_drill") return false;
    }

    if (selectedSubject !== "Semua" && p.subtes_or_mapel !== selectedSubject) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = p.subtes_or_mapel.toLowerCase().includes(q);
      const matchPaket = p.paket.toLowerCase().includes(q);
      if (!matchTitle && !matchPaket) return false;
    }
    return true;
  });

  // Verifikasi hanya paket SMA Wajib yang lolos seleksi
  assert.equal(filtered.length, 3, "Harus menyaring tepat 3 paket SMA Wajib");
  assert.ok(filtered.every((p) => p.kategori === "wajib"), "Seluruh paket tersaring harus berkategori 'wajib'");
  assert.ok(!filtered.some((p) => p.kategori === "pilihan"), "Paket pilihan tidak boleh masuk kategori sma_wajib");
  assert.ok(!filtered.some((p) => p.source === "stekom_utbk"), "Paket UTBK tidak boleh masuk kategori sma_wajib");
});
