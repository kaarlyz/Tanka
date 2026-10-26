const test = require("node:test");
const assert = require("node:assert/strict");

const ai = require("../server/ai");
const {
  DIVERSE_THEME_POOLS,
  generateAiDrillPackage
} = require("../server/services/aiDrillGenerator");

test("Test 1: Pool DIVERSE_THEME_POOLS.ekonomi & sosiologi memiliki minimal 12 tema autentik Pusmendik dan memuat seluruh tema kunci", () => {
  const ekonomiThemes = DIVERSE_THEME_POOLS.ekonomi;
  const sosiologiThemes = DIVERSE_THEME_POOLS.sosiologi;

  assert.ok(Array.isArray(ekonomiThemes), "Pool ekonomi harus berupa array");
  assert.ok(ekonomiThemes.length >= 12, `Pool ekonomi minimal 12 tema, didapat: ${ekonomiThemes.length}`);

  const combinedEcon = ekonomiThemes.join(" \n ");
  assert.ok(combinedEcon.includes("Kelangkaan komoditas beras"), "Harus memuat tema kelangkaan beras");
  assert.ok(combinedEcon.includes("Keseimbangan pasar Qd=Qs"), "Harus memuat tema keseimbangan pasar");
  assert.ok(combinedEcon.includes("Kebijakan moneter Bank Indonesia"), "Harus memuat tema moneter BI");
  assert.ok(combinedEcon.includes("Kebijakan fiskal APBN"), "Harus memuat tema fiskal APBN");
  assert.ok(combinedEcon.includes("Koperasi simpan pinjam"), "Harus memuat tema koperasi");
  assert.ok(combinedEcon.includes("Fluktuasi kurs Rupiah/USD"), "Harus memuat tema kurs Rupiah/USD");
  assert.ok(combinedEcon.includes("Neraca transaksi berjalan"), "Harus memuat tema neraca transaksi berjalan");
  assert.ok(combinedEcon.includes("Inflasi pangan bergejolak"), "Harus memuat tema inflasi pangan");
  assert.ok(combinedEcon.includes("Tingkat pengangguran terbuka"), "Harus memuat tema pengangguran/UMP");
  assert.ok(combinedEcon.includes("Rasio Gini"), "Harus memuat tema rasio Gini");
  assert.ok(combinedEcon.includes("Pasar modal ritel"), "Harus memuat tema pasar modal ritel");
  assert.ok(combinedEcon.includes("Lembaga Penjamin Simpanan"), "Harus memuat tema LPS");

  assert.ok(Array.isArray(sosiologiThemes), "Pool sosiologi harus berupa array");
  assert.ok(sosiologiThemes.length >= 12, `Pool sosiologi minimal 12 tema, didapat: ${sosiologiThemes.length}`);

  const combinedSos = sosiologiThemes.join(" \n ");
  assert.ok(combinedSos.includes("Ciri non-etis sosiologi"), "Harus memuat ciri non-etis");
  assert.ok(combinedSos.includes("Max Weber"), "Harus memuat Max Weber");
  assert.ok(combinedSos.includes("Émile Durkheim"), "Harus memuat Émile Durkheim");
  assert.ok(combinedSos.includes("Karl Marx"), "Harus memuat Karl Marx");
  assert.ok(combinedSos.includes("Diferensiasi horizontal"), "Harus memuat diferensiasi horizontal");
  assert.ok(combinedSos.includes("Akomodasi konflik"), "Harus memuat akomodasi konflik");
  assert.ok(combinedSos.includes("cultural lag"), "Harus memuat cultural lag");
  assert.ok(combinedSos.includes("gemeinschaft"), "Harus memuat gemeinschaft");
  assert.ok(combinedSos.includes("konsumerisme"), "Harus memuat konsumerisme");
  assert.ok(combinedSos.includes("Metodologi kuantitatif"), "Harus memuat metodologi kuantitatif");
  assert.ok(combinedSos.includes("Mobilitas sosial antargenerasi"), "Harus memuat mobilitas sosial");
  assert.ok(combinedSos.includes("Globalisasi budaya pop"), "Harus memuat globalisasi budaya pop");
});

test("Test 2: Zero leak saat pola !== 'all' untuk Ekonomi (pola 1..6)", async () => {
  const origCallRouter = ai.callRouter;
  const testedPolas = ["1", "2", "3", "4", "5", "6"];
  const biologyKeywords = ["nimba", "intrusi", "pulau panas"];
  const cerpenKeywords = ["layur", "watak", "batin", "tokoh"];

  try {
    for (const testPola of testedPolas) {
      const prompts = [];
      ai.callRouter = async (messages) => {
        prompts.push(messages);
        return JSON.stringify({
          bacaan: "<p><strong>Teks untuk soal nomor 1 s.d. 5</strong></p><p>Isi studi kasus ekonomi...</p>",
          items: [
            { nomor: 1, pola: parseInt(testPola, 10), tipe_soal: "pilihan_ganda", soal: "Soal", options: [{ id: "a", text: "A" }], kunci_jawaban: "a", kunci_jawaban_text: "Penjelasan" }
          ]
        });
      };

      await generateAiDrillPackage({
        subject: "Ekonomi",
        pola: testPola,
        count: 5
      });

      assert.ok(prompts.length >= 1, `Harus ada panggilan AI untuk Ekonomi Pola ${testPola}`);
      const userPrompt = prompts[0][1].content;

      // 1. Zero biologi kelautan/artikel umum leak
      for (const kw of biologyKeywords) {
        assert.ok(
          !userPrompt.toLowerCase().includes(kw.toLowerCase()),
          `Leak biologi/artikel umum terdeteksi! Kata '${kw}' muncul di prompt Ekonomi Pola ${testPola}`
        );
      }

      // 2. Zero cerpen sastra leak (di luar kalimat larangan tegas)
      const promptWithoutProhibition = userPrompt.replace(/TEGAS DILARANG MEMBUAT CERPEN\/SASTRA FIKSI/gi, "");
      assert.ok(
        !promptWithoutProhibition.toLowerCase().includes("cerpen"),
        `Leak kata 'cerpen' terdeteksi di prompt Ekonomi Pola ${testPola}`
      );
      for (const kw of cerpenKeywords) {
        assert.ok(
          !promptWithoutProhibition.toLowerCase().includes(kw.toLowerCase()),
          `Leak kata cerpen '${kw}' terdeteksi di prompt Ekonomi Pola ${testPola}`
        );
      }
      assert.ok(
        !userPrompt.includes("PETUNJUK KHUSUS CERPEN SASTRA"),
        `Leak blok petunjuk cerpen sastra terdeteksi di Ekonomi Pola ${testPola}`
      );

      // 3. Larangan tegas cerpen/sastra fiksi ada di prompt
      assert.ok(
        userPrompt.includes("TEGAS DILARANG MEMBUAT CERPEN/SASTRA FIKSI"),
        `Prompt Ekonomi Pola ${testPola} wajib memuat larangan tegas cerpen/sastra fiksi`
      );

      // 4. Memuat tema resmi dari DIVERSE_THEME_POOLS.ekonomi
      const matchedTheme = DIVERSE_THEME_POOLS.ekonomi.some(theme =>
        userPrompt.includes(theme)
      );
      assert.ok(
        matchedTheme,
        `Prompt Ekonomi Pola ${testPola} harus menggunakan tema resmi dari DIVERSE_THEME_POOLS.ekonomi`
      );
    }
  } finally {
    ai.callRouter = origCallRouter;
  }
});

test("Test 3: Zero leak saat pola !== 'all' untuk Sosiologi (pola 1..6)", async () => {
  const origCallRouter = ai.callRouter;
  const testedPolas = ["1", "2", "3", "4", "5", "6"];
  const biologyKeywords = ["nimba", "intrusi", "pulau panas"];
  const cerpenKeywords = ["layur", "watak", "batin"];

  try {
    for (const testPola of testedPolas) {
      const prompts = [];
      ai.callRouter = async (messages) => {
        prompts.push(messages);
        return JSON.stringify({
          bacaan: "<p><strong>Teks untuk soal nomor 1 s.d. 5</strong></p><p>Isi kasus sosiologis...</p>",
          items: [
            { nomor: 1, pola: parseInt(testPola, 10), tipe_soal: "pilihan_ganda", soal: "Soal", options: [{ id: "a", text: "A" }], kunci_jawaban: "a", kunci_jawaban_text: "Penjelasan" }
          ]
        });
      };

      await generateAiDrillPackage({
        subject: "Sosiologi",
        pola: testPola,
        count: 5
      });

      assert.ok(prompts.length >= 1, `Harus ada panggilan AI untuk Sosiologi Pola ${testPola}`);
      const userPrompt = prompts[0][1].content;

      // 1. Zero biologi kelautan/artikel umum leak
      for (const kw of biologyKeywords) {
        assert.ok(
          !userPrompt.toLowerCase().includes(kw.toLowerCase()),
          `Leak biologi/artikel umum terdeteksi! Kata '${kw}' muncul di prompt Sosiologi Pola ${testPola}`
        );
      }

      // 2. Zero cerpen sastra leak (di luar kalimat larangan tegas)
      const promptWithoutProhibition = userPrompt.replace(/TEGAS DILARANG MEMBUAT CERPEN\/SASTRA FIKSI/gi, "");
      assert.ok(
        !promptWithoutProhibition.toLowerCase().includes("cerpen"),
        `Leak kata 'cerpen' terdeteksi di prompt Sosiologi Pola ${testPola}`
      );
      for (const kw of cerpenKeywords) {
        assert.ok(
          !promptWithoutProhibition.toLowerCase().includes(kw.toLowerCase()),
          `Leak kata cerpen '${kw}' terdeteksi di prompt Sosiologi Pola ${testPola}`
        );
      }
      assert.ok(
        !userPrompt.includes("PETUNJUK KHUSUS CERPEN SASTRA"),
        `Leak blok petunjuk cerpen sastra terdeteksi di Sosiologi Pola ${testPola}`
      );

      // 3. Larangan tegas cerpen/sastra fiksi ada di prompt
      assert.ok(
        userPrompt.includes("TEGAS DILARANG MEMBUAT CERPEN/SASTRA FIKSI"),
        `Prompt Sosiologi Pola ${testPola} wajib memuat larangan tegas cerpen/sastra fiksi`
      );

      // 4. Mandatori ciri non-etis
      assert.ok(
        userPrompt.includes("MANDATORI CIRI NON-ETIS"),
        `Prompt Sosiologi Pola ${testPola} harus memuat panduan mandatori ciri non-etis`
      );
      assert.ok(
        userPrompt.includes("tanpa vonis moral"),
        `Prompt Sosiologi Pola ${testPola} harus memuat aturan analisis tanpa vonis moral`
      );

      // 5. Memuat tema resmi dari DIVERSE_THEME_POOLS.sosiologi
      const matchedTheme = DIVERSE_THEME_POOLS.sosiologi.some(theme =>
        userPrompt.includes(theme)
      );
      assert.ok(
        matchedTheme,
        `Prompt Sosiologi Pola ${testPola} harus menggunakan tema resmi dari DIVERSE_THEME_POOLS.sosiologi`
      );
    }
  } finally {
    ai.callRouter = origCallRouter;
  }
});

test("Test 4: Pola === 'all' untuk 25 butir Ekonomi menghasilkan 6 unit proporsional tanpa duplikasi tema dan 0 polusi sastra", async () => {
  const origCallRouter = ai.callRouter;
  const capturedCalls = [];

  try {
    ai.callRouter = async (messages) => {
      capturedCalls.push(messages);
      const userMsg = messages[1].content;
      const match = userMsg.match(/nomor (\d+) s\.d\. (\d+)/);
      const start = match ? parseInt(match[1], 10) : 1;
      const end = match ? parseInt(match[2], 10) : 4;
      const count = end - start + 1;

      return JSON.stringify({
        bacaan: `<p><strong>Teks untuk soal nomor ${start} s.d. ${end}</strong></p><p>Wacana ekonomi...</p>`,
        items: Array.from({ length: count }, (_, i) => ({
          nomor: start + i,
          pola: 1,
          tipe_soal: "pilihan_ganda",
          soal: `Soal ${start + i}`,
          options: [{ id: "a", text: "A" }],
          kunci_jawaban: "a",
          kunci_jawaban_text: "Penjelasan"
        }))
      });
    };

    const pkg = await generateAiDrillPackage({
      subject: "Ekonomi",
      pola: "all",
      count: 25
    });

    assert.equal(capturedCalls.length, 6, "Harus menghasilkan tepat 6 unit soal untuk 25 butir Ekonomi");

    const expectedRanges = [
      { start: 1, end: 4 },
      { start: 5, end: 8 },
      { start: 9, end: 12 },
      { start: 13, end: 17 },
      { start: 18, end: 21 },
      { start: 22, end: 25 }
    ];

    const detectedThemes = [];

    capturedCalls.forEach((call, idx) => {
      const userContent = call[1].content;
      const expected = expectedRanges[idx];

      assert.ok(
        userContent.includes(`nomor ${expected.start} s.d. ${expected.end}`),
        `Unit ${idx + 1} harus bernomor ${expected.start} s.d. ${expected.end}`
      );

      const matchedTheme = DIVERSE_THEME_POOLS.ekonomi.find(t => userContent.includes(t));
      assert.ok(matchedTheme, `Unit ${idx + 1} harus memuat tema resmi DIVERSE_THEME_POOLS.ekonomi`);
      detectedThemes.push(matchedTheme);

      // 0 polusi sastra
      const cleaned = userContent.replace(/TEGAS DILARANG MEMBUAT CERPEN\/SASTRA FIKSI/gi, "");
      assert.ok(!cleaned.toLowerCase().includes("cerpen"), `Unit ${idx + 1} mengandung polusi kata 'cerpen'`);
      assert.ok(!cleaned.toLowerCase().includes("watak"), `Unit ${idx + 1} mengandung polusi 'watak'`);
      assert.ok(!cleaned.toLowerCase().includes("batin"), `Unit ${idx + 1} mengandung polusi 'batin'`);
      assert.ok(!cleaned.toLowerCase().includes("layur"), `Unit ${idx + 1} mengandung polusi 'layur'`);
      assert.ok(!userContent.includes("PETUNJUK KHUSUS CERPEN SASTRA"));
    });

    const uniqueThemes = new Set(detectedThemes);
    assert.equal(uniqueThemes.size, 6, `Keenam unit Ekonomi harus memakai 6 tema unik tanpa duplikasi! Ditemukan: ${uniqueThemes.size}`);

    assert.equal(pkg.items.length, 25, "Total items harus tepat 25 butir");
    assert.equal(pkg.items[0].nomor, 1);
    assert.equal(pkg.items[24].nomor, 25);
  } finally {
    ai.callRouter = origCallRouter;
  }
});

test("Test 5: Pola === 'all' untuk 25 butir Sosiologi menghasilkan 6 unit proporsional tanpa duplikasi tema, 0 polusi sastra, dan mandatori non-etis", async () => {
  const origCallRouter = ai.callRouter;
  const capturedCalls = [];

  try {
    ai.callRouter = async (messages) => {
      capturedCalls.push(messages);
      const userMsg = messages[1].content;
      const match = userMsg.match(/nomor (\d+) s\.d\. (\d+)/);
      const start = match ? parseInt(match[1], 10) : 1;
      const end = match ? parseInt(match[2], 10) : 4;
      const count = end - start + 1;

      return JSON.stringify({
        bacaan: `<p><strong>Teks untuk soal nomor ${start} s.d. ${end}</strong></p><p>Wacana sosiologi...</p>`,
        items: Array.from({ length: count }, (_, i) => ({
          nomor: start + i,
          pola: 1,
          tipe_soal: "pilihan_ganda",
          soal: `Soal ${start + i}`,
          options: [{ id: "a", text: "A" }],
          kunci_jawaban: "a",
          kunci_jawaban_text: "Penjelasan"
        }))
      });
    };

    const pkg = await generateAiDrillPackage({
      subject: "Sosiologi",
      pola: "all",
      count: 25
    });

    assert.equal(capturedCalls.length, 6, "Harus menghasilkan tepat 6 unit soal untuk 25 butir Sosiologi");

    const expectedRanges = [
      { start: 1, end: 4 },
      { start: 5, end: 8 },
      { start: 9, end: 12 },
      { start: 13, end: 17 },
      { start: 18, end: 21 },
      { start: 22, end: 25 }
    ];

    const detectedThemes = [];

    capturedCalls.forEach((call, idx) => {
      const userContent = call[1].content;
      const expected = expectedRanges[idx];

      assert.ok(
        userContent.includes(`nomor ${expected.start} s.d. ${expected.end}`),
        `Unit ${idx + 1} harus bernomor ${expected.start} s.d. ${expected.end}`
      );

      const matchedTheme = DIVERSE_THEME_POOLS.sosiologi.find(t => userContent.includes(t));
      assert.ok(matchedTheme, `Unit ${idx + 1} harus memuat tema resmi DIVERSE_THEME_POOLS.sosiologi`);
      detectedThemes.push(matchedTheme);

      // Mandatori ciri non-etis
      assert.ok(userContent.includes("MANDATORI CIRI NON-ETIS"), `Unit ${idx + 1} harus memuat MANDATORI CIRI NON-ETIS`);
      assert.ok(userContent.includes("tanpa vonis moral"), `Unit ${idx + 1} harus memuat analisis tanpa vonis moral`);

      // 0 polusi sastra
      const cleaned = userContent.replace(/TEGAS DILARANG MEMBUAT CERPEN\/SASTRA FIKSI/gi, "");
      assert.ok(!cleaned.toLowerCase().includes("cerpen"), `Unit ${idx + 1} mengandung polusi kata 'cerpen'`);
      assert.ok(!cleaned.toLowerCase().includes("watak"), `Unit ${idx + 1} mengandung polusi 'watak'`);
      assert.ok(!cleaned.toLowerCase().includes("batin"), `Unit ${idx + 1} mengandung polusi 'batin'`);
      assert.ok(!cleaned.toLowerCase().includes("layur"), `Unit ${idx + 1} mengandung polusi 'layur'`);
      assert.ok(!userContent.includes("PETUNJUK KHUSUS CERPEN SASTRA"));
    });

    const uniqueThemes = new Set(detectedThemes);
    assert.equal(uniqueThemes.size, 6, `Keenam unit Sosiologi harus memakai 6 tema unik tanpa duplikasi! Ditemukan: ${uniqueThemes.size}`);

    assert.equal(pkg.items.length, 25, "Total items harus tepat 25 butir");
    assert.equal(pkg.items[0].nomor, 1);
    assert.equal(pkg.items[24].nomor, 25);
  } finally {
    ai.callRouter = origCallRouter;
  }
});

test("Test 6: Pola === 'all' untuk 20 dan 10 butir Ekonomi & Sosiologi teralokasi proporsional", async () => {
  const origCallRouter = ai.callRouter;

  try {
    // Ekonomi 20 butir -> 6 unit (1-3, 4-6, 7-10, 11-13, 14-16, 17-20)
    let callCountEcon20 = 0;
    ai.callRouter = async (messages) => {
      callCountEcon20++;
      const userMsg = messages[1].content;
      const match = userMsg.match(/nomor (\d+) s\.d\. (\d+)/);
      const start = match ? parseInt(match[1], 10) : 1;
      const end = match ? parseInt(match[2], 10) : 3;
      const count = end - start + 1;
      return JSON.stringify({
        bacaan: "<p>Wacana</p>",
        items: Array.from({ length: count }, (_, i) => ({
          nomor: start + i, pola: 1, tipe_soal: "pilihan_ganda", soal: "Q", options: [{ id: "a", text: "A" }], kunci_jawaban: "a", kunci_jawaban_text: "Exp"
        }))
      });
    };
    const pkgEcon20 = await generateAiDrillPackage({ subject: "Ekonomi", pola: "all", count: 20 });
    assert.equal(callCountEcon20, 6, "Target count 20 Ekonomi harus membuat 6 unit");
    assert.equal(pkgEcon20.items.length, 20);

    // Sosiologi 20 butir -> 6 unit (1-3, 4-6, 7-10, 11-13, 14-16, 17-20)
    let callCountSos20 = 0;
    ai.callRouter = async (messages) => {
      callCountSos20++;
      const userMsg = messages[1].content;
      const match = userMsg.match(/nomor (\d+) s\.d\. (\d+)/);
      const start = match ? parseInt(match[1], 10) : 1;
      const end = match ? parseInt(match[2], 10) : 3;
      const count = end - start + 1;
      return JSON.stringify({
        bacaan: "<p>Wacana</p>",
        items: Array.from({ length: count }, (_, i) => ({
          nomor: start + i, pola: 1, tipe_soal: "pilihan_ganda", soal: "Q", options: [{ id: "a", text: "A" }], kunci_jawaban: "a", kunci_jawaban_text: "Exp"
        }))
      });
    };
    const pkgSos20 = await generateAiDrillPackage({ subject: "Sosiologi", pola: "all", count: 20 });
    assert.equal(callCountSos20, 6, "Target count 20 Sosiologi harus membuat 6 unit");
    assert.equal(pkgSos20.items.length, 20);

    // Ekonomi 10 butir -> 2 unit @ 5 butir (1-5 Mikro, 6-10 Makro)
    let callCountEcon10 = 0;
    ai.callRouter = async (messages) => {
      callCountEcon10++;
      const userMsg = messages[1].content;
      const match = userMsg.match(/nomor (\d+) s\.d\. (\d+)/);
      const start = match ? parseInt(match[1], 10) : 1;
      const end = match ? parseInt(match[2], 10) : 5;
      const count = end - start + 1;
      return JSON.stringify({
        bacaan: "<p>Wacana</p>",
        items: Array.from({ length: count }, (_, i) => ({
          nomor: start + i, pola: 1, tipe_soal: "pilihan_ganda", soal: "Q", options: [{ id: "a", text: "A" }], kunci_jawaban: "a", kunci_jawaban_text: "Exp"
        }))
      });
    };
    const pkgEcon10 = await generateAiDrillPackage({ subject: "Ekonomi", pola: "all", count: 10 });
    assert.equal(callCountEcon10, 2, "Target count 10 Ekonomi harus membuat 2 unit");
    assert.equal(pkgEcon10.items.length, 10);

    // Sosiologi 10 butir -> 2 unit @ 5 butir (1-5 Struktur & Teori, 6-10 Dinamika & Metodologi)
    let callCountSos10 = 0;
    ai.callRouter = async (messages) => {
      callCountSos10++;
      const userMsg = messages[1].content;
      const match = userMsg.match(/nomor (\d+) s\.d\. (\d+)/);
      const start = match ? parseInt(match[1], 10) : 1;
      const end = match ? parseInt(match[2], 10) : 5;
      const count = end - start + 1;
      return JSON.stringify({
        bacaan: "<p>Wacana</p>",
        items: Array.from({ length: count }, (_, i) => ({
          nomor: start + i, pola: 1, tipe_soal: "pilihan_ganda", soal: "Q", options: [{ id: "a", text: "A" }], kunci_jawaban: "a", kunci_jawaban_text: "Exp"
        }))
      });
    };
    const pkgSos10 = await generateAiDrillPackage({ subject: "Sosiologi", pola: "all", count: 10 });
    assert.equal(callCountSos10, 2, "Target count 10 Sosiologi harus membuat 2 unit");
    assert.equal(pkgSos10.items.length, 10);
  } finally {
    ai.callRouter = origCallRouter;
  }
});

test("Test 7: Pola === 'all' untuk 5 butir Ekonomi & Sosiologi menggunakan tema dinamis dan 0 polusi sastra", async () => {
  const origCallRouter = ai.callRouter;
  const pickedEconThemes = new Set();
  const pickedSosThemes = new Set();

  try {
    for (let run = 0; run < 15; run++) {
      let promptCapturedEcon = "";
      ai.callRouter = async (messages) => {
        promptCapturedEcon = messages[1].content;
        return JSON.stringify({
          bacaan: "",
          items: Array.from({ length: 5 }, (_, i) => ({
            nomor: i + 1, pola: i + 1, tipe_soal: "pilihan_ganda", soal: `Q${i + 1}`, options: [{ id: "a", text: "A" }], kunci_jawaban: "a", kunci_jawaban_text: `E${i + 1}`
          }))
        });
      };

      const resultEcon = await generateAiDrillPackage({ subject: "Ekonomi", pola: "all", count: 5 });
      assert.ok(resultEcon.bacaan.includes("Teks untuk soal nomor 1 s.d. 5"));
      const matchedEcon = DIVERSE_THEME_POOLS.ekonomi.find(t => promptCapturedEcon.includes(t));
      if (matchedEcon) pickedEconThemes.add(matchedEcon);

      // 0 polusi sastra Ekonomi
      const cleanEcon = promptCapturedEcon.replace(/TEGAS DILARANG MEMBUAT CERPEN\/SASTRA FIKSI/gi, "");
      assert.ok(!cleanEcon.toLowerCase().includes("cerpen"));
      assert.ok(!cleanEcon.toLowerCase().includes("watak"));
      assert.ok(!cleanEcon.toLowerCase().includes("batin"));
    }

    assert.ok(
      pickedEconThemes.size > 1,
      `Tema Ekonomi harus teracak dinamis! Jumlah tema unik dalam 15 run: ${pickedEconThemes.size}`
    );

    for (let run = 0; run < 15; run++) {
      let promptCapturedSos = "";
      ai.callRouter = async (messages) => {
        promptCapturedSos = messages[1].content;
        return JSON.stringify({
          bacaan: "",
          items: Array.from({ length: 5 }, (_, i) => ({
            nomor: i + 1, pola: i + 1, tipe_soal: "pilihan_ganda", soal: `Q${i + 1}`, options: [{ id: "a", text: "A" }], kunci_jawaban: "a", kunci_jawaban_text: `E${i + 1}`
          }))
        });
      };

      const resultSos = await generateAiDrillPackage({ subject: "Sosiologi", pola: "all", count: 5 });
      assert.ok(resultSos.bacaan.includes("Teks untuk soal nomor 1 s.d. 5"));
      const matchedSos = DIVERSE_THEME_POOLS.sosiologi.find(t => promptCapturedSos.includes(t));
      if (matchedSos) pickedSosThemes.add(matchedSos);

      // 0 polusi sastra Sosiologi
      const cleanSos = promptCapturedSos.replace(/TEGAS DILARANG MEMBUAT CERPEN\/SASTRA FIKSI/gi, "");
      assert.ok(!cleanSos.toLowerCase().includes("cerpen"));
      assert.ok(!cleanSos.toLowerCase().includes("watak"));
      assert.ok(!cleanSos.toLowerCase().includes("batin"));
      assert.ok(promptCapturedSos.includes("MANDATORI CIRI NON-ETIS"));
    }

    assert.ok(
      pickedSosThemes.size > 1,
      `Tema Sosiologi harus teracak dinamis! Jumlah tema unik dalam 15 run: ${pickedSosThemes.size}`
    );
  } finally {
    ai.callRouter = origCallRouter;
  }
});
