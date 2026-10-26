const test = require("node:test");
const assert = require("node:assert/strict");
const {
  calibrateKeyDistribution,
  PUSMENDIK_KEY_WEIGHTS,
  DEFAULT_KEY_WEIGHTS
} = require("../server/services/aiDrillGenerator");

function generateMockItems(n = 50, override = {}) {
  return Array.from({ length: n }, (_, i) => ({
    nomor: i + 1,
    pola: 1,
    tipe_soal: "pilihan_ganda",
    soal: `Pertanyaan butir nomor ${i + 1}`,
    options: [
      { id: "a", text: `Opsi Benar Asli butir ${i + 1}`, marker: `correct_${i + 1}` },
      { id: "b", text: `Pengecoh B butir ${i + 1}`, marker: `dist_b_${i + 1}` },
      { id: "c", text: `Pengecoh C butir ${i + 1}`, marker: `dist_c_${i + 1}` },
      { id: "d", text: `Pengecoh D butir ${i + 1}`, marker: `dist_d_${i + 1}` },
      { id: "e", text: `Pengecoh E butir ${i + 1}`, marker: `dist_e_${i + 1}` },
    ],
    kunci_jawaban: "a",
    kunci_jawaban_text: `Kunci A adalah jawaban yang benar untuk butir ${i + 1}`,
    ...override
  }));
}

function getKeyCounts(items) {
  const counts = { a: 0, b: 0, c: 0, d: 0, e: 0 };
  items.forEach((it) => {
    if (counts[it.kunci_jawaban] !== undefined) {
      counts[it.kunci_jawaban]++;
    }
  });
  return counts;
}

test("PUSMENDIK-CALIBRATION: Distribusi batch 50 butir simulasi per mapel", () => {
  // 1. Bahasa Inggris: B tepat 40% (20 butir dari 50)
  const englishItems = calibrateKeyDistribution(generateMockItems(50), "Bahasa Inggris");
  const englishCounts = getKeyCounts(englishItems);
  assert.equal(englishCounts.b, 20, "Bahasa Inggris: Opsi B harus tepat 20 butir (40% dari 50)");
  assert.equal(englishCounts.a, 8, "Bahasa Inggris: Opsi A harus 8 butir (15% Largest Remainder)");
  assert.equal(englishCounts.c, 10, "Bahasa Inggris: Opsi C harus 10 butir (20%)");
  assert.equal(englishCounts.d, 7, "Bahasa Inggris: Opsi D harus 7 butir (15% Largest Remainder)");
  assert.equal(englishCounts.e, 5, "Bahasa Inggris: Opsi E harus 5 butir (10%)");

  // 2. Matematika: B + C menguasai 67% (33 atau 34 butir dari 50), A dan E rendah (8% masing-masing = 4 butir)
  const mathItems = calibrateKeyDistribution(generateMockItems(50), "Matematika");
  const mathCounts = getKeyCounts(mathItems);
  const mathBC = mathCounts.b + mathCounts.c;
  assert.ok(
    mathBC === 33 || mathBC === 34,
    `Matematika: B + C harus menguasai 67% (33 atau 34 butir dari 50), actual: ${mathBC}`
  );
  assert.equal(mathCounts.a, 4, "Matematika: Opsi A harus rendah 8% (4 butir dari 50)");
  assert.equal(mathCounts.e, 4, "Matematika: Opsi E harus rendah 8% (4 butir dari 50)");

  // 3. Ekonomi: E tertinggi 30% (15 butir dari 50)
  const econItems = calibrateKeyDistribution(generateMockItems(50), "Ekonomi");
  const econCounts = getKeyCounts(econItems);
  assert.equal(econCounts.e, 15, "Ekonomi: Opsi E harus tertinggi 30% (15 butir dari 50)");
  assert.ok(
    econCounts.e > econCounts.a &&
    econCounts.e > econCounts.b &&
    econCounts.e > econCounts.c &&
    econCounts.e > econCounts.d,
    "Ekonomi: Opsi E harus menjadi frekuensi tertinggi mutlak dibanding A, B, C, D"
  );

  // 4. Sosiologi: C + D menguasai 52% (26 butir dari 50), E rendah 10% (5 butir)
  const sosItems = calibrateKeyDistribution(generateMockItems(50), "Sosiologi");
  const sosCounts = getKeyCounts(sosItems);
  assert.equal(sosCounts.c + sosCounts.d, 26, "Sosiologi: C + D harus menguasai 52% (26 butir dari 50)");
  assert.equal(sosCounts.e, 5, "Sosiologi: Opsi E harus paling rendah 10% (5 butir dari 50)");

  // 5. Bahasa Indonesia: proporsional sesuai bobot [A: 15%, B: 28%, C: 26%, D: 18%, E: 13%]
  const indoItems = calibrateKeyDistribution(generateMockItems(50), "Bahasa Indonesia");
  const indoCounts = getKeyCounts(indoItems);
  assert.equal(indoCounts.b, 14, "Bahasa Indonesia: B harus 14 butir (28% dari 50)");
  assert.equal(indoCounts.c, 13, "Bahasa Indonesia: C harus 13 butir (26% dari 50)");
  assert.equal(indoCounts.d, 9, "Bahasa Indonesia: D harus 9 butir (18% dari 50)");
  assert.ok(indoCounts.a === 7 || indoCounts.a === 8, "Bahasa Indonesia: A harus proporsional (15%)");
  assert.ok(indoCounts.e === 6 || indoCounts.e === 7, "Bahasa Indonesia: E harus proporsional (13%)");
  assert.equal(Object.values(indoCounts).reduce((sum, v) => sum + v, 0), 50);

  // Default: seimbang 20% flat (10 butir per huruf)
  const defaultItems = calibrateKeyDistribution(generateMockItems(50), "Biologi");
  const defaultCounts = getKeyCounts(defaultItems);
  assert.deepEqual(defaultCounts, { a: 10, b: 10, c: 10, d: 10, e: 10 });
});

test("PUSMENDIK-CALIBRATION: Uji integritas swap dan pelestarian data", () => {
  const items = generateMockItems(25);
  const origKeys = ["a", "b", "c", "d", "e"];
  items.forEach((it, idx) => {
    const k = origKeys[idx % origKeys.length];
    it.kunci_jawaban = k;
    it.options.forEach((opt) => {
      delete opt.marker;
    });
    const correctOpt = it.options.find((o) => o.id === k);
    if (correctOpt) {
      correctOpt.isTargetCorrect = true;
      correctOpt.secretContent = `Answer-${it.nomor}`;
    }
    it.kunci_jawaban_text = `Jawaban ${k.toUpperCase()} adalah tepat karena alasan ilmiah`;
  });

  const calibrated = calibrateKeyDistribution(items, "Bahasa Inggris");

  calibrated.forEach((it) => {
    // 1. Seluruh 5 opsi memiliki id a, b, c, d, e teratur tanpa duplikasi atau kehilangan
    const ids = it.options.map((o) => o.id);
    assert.deepEqual(ids, ["a", "b", "c", "d", "e"], "Options harus memiliki ID terurut a-e");

    // 2. Opsi yang tadinya benar tetap benar di posisi target baru (teks dan properti tidak tertukar/hilang)
    const activeKey = it.kunci_jawaban;
    const activeOpt = it.options.find((o) => o.id === activeKey);
    assert.ok(activeOpt, `Opsi dengan ID ${activeKey} harus ditemukan di options`);
    assert.equal(activeOpt.isTargetCorrect, true, "Opsi yang benar harus tetap membawa properti isTargetCorrect");
    assert.equal(activeOpt.secretContent, `Answer-${it.nomor}`, "Teks/konten jawaban benar tidak boleh tertukar");

    // 3. Prefix di kunci_jawaban_text terupdate sesuai huruf kunci baru
    assert.match(
      it.kunci_jawaban_text,
      new RegExp(`^Jawaban\\s+${activeKey.toUpperCase()}`, "i"),
      `Prefix kunci_jawaban_text harus mencerminkan kunci baru ${activeKey.toUpperCase()}`
    );
  });
});

test("PUSMENDIK-CALIBRATION: Proteksi soal non-pilihan ganda & multi-key", () => {
  const statementItem = {
    nomor: 1,
    pola: 5,
    tipe_soal: "pernyataan",
    soal: "Perhatikan pernyataan berikut:",
    options: [
      { id: "a", text: "Pernyataan 1" },
      { id: "b", text: "Pernyataan 2" },
      { id: "c", text: "Pernyataan 3" }
    ],
    kunci_jawaban: "a:benar;b:salah;c:benar",
    kunci_jawaban_text: "Kunci A:benar, B:salah, C:benar"
  };

  const complexPgItem = {
    nomor: 2,
    pola: 5,
    tipe_soal: "pilihan_ganda_kompleks",
    soal: "Pilihlah dua jawaban benar:",
    options: [
      { id: "a", text: "Opsi 1" },
      { id: "b", text: "Opsi 2" },
      { id: "c", text: "Opsi 3" },
      { id: "d", text: "Opsi 4" }
    ],
    kunci_jawaban: "a,c",
    kunci_jawaban_text: "Kunci A dan C benar"
  };

  const pgItem = {
    nomor: 3,
    pola: 1,
    tipe_soal: "pilihan_ganda",
    soal: "Soal PG reguler",
    options: [
      { id: "a", text: "A" },
      { id: "b", text: "B" },
      { id: "c", text: "C" },
      { id: "d", text: "D" },
      { id: "e", text: "E" }
    ],
    kunci_jawaban: "a",
    kunci_jawaban_text: "Pilihan A benar"
  };

  const mixedItems = [
    JSON.parse(JSON.stringify(statementItem)),
    JSON.parse(JSON.stringify(complexPgItem)),
    JSON.parse(JSON.stringify(pgItem))
  ];

  const calibrated = calibrateKeyDistribution(mixedItems, "Ekonomi");

  // Soal tipe pernyataan TIDAK boleh diubah sama sekali
  assert.equal(calibrated[0].tipe_soal, "pernyataan");
  assert.equal(calibrated[0].kunci_jawaban, "a:benar;b:salah;c:benar");
  assert.equal(calibrated[0].kunci_jawaban_text, "Kunci A:benar, B:salah, C:benar");
  assert.deepEqual(calibrated[0].options, statementItem.options);

  // Soal tipe pilihan_ganda_kompleks TIDAK boleh diubah
  assert.equal(calibrated[1].tipe_soal, "pilihan_ganda_kompleks");
  assert.equal(calibrated[1].kunci_jawaban, "a,c");
  assert.equal(calibrated[1].kunci_jawaban_text, "Kunci A dan C benar");
  assert.deepEqual(calibrated[1].options, complexPgItem.options);

  // Soal PG reguler terkalibrasi valid
  assert.equal(calibrated[2].options.length, 5);
  assert.ok(/^[a-e]$/.test(calibrated[2].kunci_jawaban));
  assert.match(calibrated[2].kunci_jawaban_text, new RegExp(`^Pilihan\\s+${calibrated[2].kunci_jawaban.toUpperCase()}`, "i"));
});
