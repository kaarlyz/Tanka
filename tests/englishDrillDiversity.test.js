const test = require("node:test");
const assert = require("node:assert/strict");

const ai = require("../server/ai");
const {
  DIVERSE_THEME_POOLS,
  generateAiDrillPackage
} = require("../server/services/aiDrillGenerator");

test("English Drill Diversity: DIVERSE_THEME_POOLS.inggris memiliki minimal 15-20 tema dan 5 genre resmi Pusmendik", () => {
  const englishThemes = DIVERSE_THEME_POOLS.inggris;
  assert.ok(Array.isArray(englishThemes), "Pool inggris harus berupa array");
  assert.ok(englishThemes.length >= 15, `Pool inggris minimal 15 tema, didapat: ${englishThemes.length}`);
  assert.ok(englishThemes.length >= 20, `Pool inggris idealnya 20 tema (4 tema x 5 genre), didapat: ${englishThemes.length}`);

  const combined = englishThemes.join(" \n ");

  // 1. Narrative & Folklore
  assert.ok(
    combined.includes("Narrative & Folklore"),
    "Harus mencakup genre Narrative & Folklore"
  );
  assert.ok(
    combined.includes("Mouse Deer") || combined.includes("Asian folklore"),
    "Harus memuat tema Asian folklore / Mouse Deer"
  );
  assert.ok(
    combined.includes("Anansi") || combined.includes("fable"),
    "Harus memuat African fable / Anansi"
  );
  assert.ok(
    combined.includes("Lake Toba") || combined.includes("mythical"),
    "Harus memuat mitos / Lake Toba"
  );

  // 2. School & Campus Infographic
  assert.ok(
    combined.includes("School & Campus Infographic"),
    "Harus mencakup genre School & Campus Infographic"
  );
  assert.ok(
    combined.includes("Library etiquette"),
    "Harus memuat Library etiquette"
  );
  assert.ok(
    combined.includes("ergonomics") || combined.includes("Pomodoro"),
    "Harus memuat Study ergonomics / Pomodoro"
  );
  assert.ok(
    combined.includes("Science laboratory safety") || combined.includes("lab safety"),
    "Harus memuat Science lab safety"
  );
  assert.ok(
    combined.includes("recycling"),
    "Harus memuat Campus recycling"
  );

  // 3. Nature & Eco-Tourism
  assert.ok(
    combined.includes("Nature & Eco-Tourism"),
    "Harus mencakup genre Nature & Eco-Tourism"
  );
  assert.ok(
    combined.includes("Raja Ampat"),
    "Harus memuat Raja Ampat biodiversity"
  );
  assert.ok(
    combined.includes("Great Barrier Reef") || combined.includes("coral"),
    "Harus memuat Great Barrier Reef coral restoration"
  );
  assert.ok(
    combined.includes("Komodo"),
    "Harus memuat Komodo dragon habitat"
  );
  assert.ok(
    combined.includes("Mangrove") || combined.includes("mangrove"),
    "Harus memuat Mangrove conservation"
  );

  // 4. Career & Real Experience / Recount
  assert.ok(
    combined.includes("Career & Real Experience / Recount"),
    "Harus mencakup genre Career & Real Experience / Recount"
  );
  assert.ok(
    combined.includes("community radio intern"),
    "Harus memuat Community radio intern"
  );
  assert.ok(
    combined.includes("wildlife rescue") || combined.includes("sun bears"),
    "Harus memuat Wildlife rescue sanctuary"
  );
  assert.ok(
    combined.includes("robotics team"),
    "Harus memuat Robotics team journey"
  );
  assert.ok(
    combined.includes("woodworking apprentice"),
    "Harus memuat Woodworking apprentice"
  );

  // 5. Teen Life & Applied Science
  assert.ok(
    combined.includes("Teen Life & Applied Science"),
    "Harus mencakup genre Teen Life & Applied Science"
  );
  assert.ok(
    combined.includes("screen time") || combined.includes("sleep hygiene"),
    "Harus memuat Screen time & sleep hygiene"
  );
  assert.ok(
    combined.includes("Microplastics") || combined.includes("microplastics"),
    "Harus memuat Microplastics in seafood"
  );
  assert.ok(
    combined.includes("Fast fashion") || combined.includes("fast fashion"),
    "Harus memuat Fast fashion circular economy"
  );
  assert.ok(
    combined.includes("Artificial intelligence") || combined.includes("writing assistants"),
    "Harus memuat AI in high school education"
  );
});

test("English Drill Diversity: Zero Indonesian leak saat pola !== 'all' untuk Bahasa Inggris", async () => {
  const origCallRouter = ai.callRouter;
  const indonesianKeywords = [
    "bengkel", "songket", "Kwitang", "gambut", "subak", "nimba", "intrusi",
    "sasi laut", "Layur", "buwuhan", "gerabah Kasongan", "pande besi"
  ];

  try {
    const testedPolas = ["1", "2", "3", "4", "5", "6"];

    for (const testPola of testedPolas) {
      const prompts = [];
      ai.callRouter = async (messages) => {
        prompts.push(messages);
        return JSON.stringify({
          bacaan: "<p><strong>Questions 1 to 5 are based on the following passage.</strong></p><p>Passage content...</p>",
          items: Array.from({ length: 5 }, (_, i) => ({
            nomor: i + 1, pola: parseInt(testPola, 10), tipe_soal: "pilihan_ganda", soal: "Question 1", options: [{ id: "a", text: "A" }], kunci_jawaban: "a", kunci_jawaban_text: "Reason"
          }))
        });
      };

      await generateAiDrillPackage({
        subject: "Bahasa Inggris",
        pola: testPola,
        count: 5
      });

      assert.ok(prompts.length >= 1, `Harus ada panggilan AI untuk Pola ${testPola}`);
      const userPrompt = prompts[0][1].content;
      const systemPrompt = prompts[0][0].content;

      // 1. Pastikan tidak ada tema artikel/cerpen Indonesia yang bocor
      for (const kw of indonesianKeywords) {
        assert.ok(
          !userPrompt.toLowerCase().includes(kw.toLowerCase()),
          `Leak terdeteksi! Kata '${kw}' dari pool Bahasa Indonesia muncul di prompt Bahasa Inggris Pola ${testPola}`
        );
      }

      // 2. Pastikan domain topic adalah tema Bahasa Inggris resmi
      const matchedEnglishTheme = DIVERSE_THEME_POOLS.inggris.some(theme =>
        userPrompt.includes(theme)
      );
      assert.ok(
        matchedEnglishTheme,
        `Prompt untuk Pola ${testPola} harus menggunakan tema dari DIVERSE_THEME_POOLS.inggris`
      );

      // 3. Pastikan format header English
      assert.ok(
        userPrompt.includes("Questions 1 to 5 are based on the following passage."),
        "Prompt harus menggunakan format header English 'Questions X to Y are based on the following passage.'"
      );

      // 4. Pastikan genre mandate English disertakan
      assert.ok(
        userPrompt.includes("GENRE MANDATE:"),
        "Prompt harus memuat GENRE MANDATE yang terarah"
      );
    }
  } finally {
    ai.callRouter = origCallRouter;
  }
});

test("English Drill Diversity: Pola === 'all' untuk 25 butir menghasilkan 5 unit proporsional tanpa duplikasi tema", async () => {
  const origCallRouter = ai.callRouter;
  const capturedCalls = [];

  try {
    ai.callRouter = async (messages) => {
      capturedCalls.push(messages);
      const userMsg = messages[1].content;
      const match = userMsg.match(/numbered (\d+) to (\d+)/);
      const start = match ? parseInt(match[1], 10) : 1;
      const end = match ? parseInt(match[2], 10) : 5;
      const count = end - start + 1;

      const items = [];
      for (let i = 0; i < count; i++) {
        items.push({
          nomor: start + i,
          pola: (i % 6) + 1,
          tipe_soal: "pilihan_ganda",
          soal: `<p>Question ${start + i}</p>`,
          options: [
            { id: "a", text: "A" },
            { id: "b", text: "B" },
            { id: "c", text: "C" },
            { id: "d", text: "D" },
            { id: "e", text: "E" }
          ],
          kunci_jawaban: "a",
          kunci_jawaban_text: "Explanation"
        });
      }

      return JSON.stringify({
        bacaan: `<p><strong>Questions ${start} to ${end} are based on the following passage.</strong></p><p>Passage content...</p>`,
        items
      });
    };

    const pkg = await generateAiDrillPackage({
      subject: "Bahasa Inggris",
      pola: "all",
      count: 25
    });

    // 1. Tepat 5 unit paralel
    assert.equal(capturedCalls.length, 5, "Harus menghasilkan tepat 5 unit soal untuk targetCount 25");

    // 2. Urutan rentang nomor unit
    const expectedRanges = [
      { start: 1, end: 5 },
      { start: 6, end: 10 },
      { start: 11, end: 15 },
      { start: 16, end: 20 },
      { start: 21, end: 25 }
    ];

    const detectedThemes = [];
    const detectedGenres = [];

    capturedCalls.forEach((call, idx) => {
      const userContent = call[1].content;
      const expected = expectedRanges[idx];

      assert.ok(
        userContent.includes(`numbered ${expected.start} to ${expected.end}`),
        `Unit ${idx + 1} harus bernomor ${expected.start} sampai ${expected.end}`
      );
      assert.ok(
        userContent.includes(`Questions ${expected.start} to ${expected.end} are based on the following passage.`),
        `Unit ${idx + 1} harus meminta header passage English`
      );

      // Cari tema yang cocok dari DIVERSE_THEME_POOLS.inggris
      const matchedTheme = DIVERSE_THEME_POOLS.inggris.find(t => userContent.includes(t));
      assert.ok(matchedTheme, `Unit ${idx + 1} harus memuat salah satu tema resmi`);
      detectedThemes.push(matchedTheme);

      if (userContent.includes("NARRATIVE & FOLKLORE")) detectedGenres.push("narrative");
      else if (userContent.includes("SCHOOL & CAMPUS INFOGRAPHIC")) detectedGenres.push("infographic");
      else if (userContent.includes("NATURE & ECO-TOURISM")) detectedGenres.push("nature");
      else if (userContent.includes("CAREER & REAL EXPERIENCE (RECOUNT)")) detectedGenres.push("recount");
      else if (userContent.includes("TEEN LIFE & APPLIED SCIENCE")) detectedGenres.push("teen_science");
    });

    // 3. 5 genre berbeda tanpa duplikasi tema
    const uniqueThemes = new Set(detectedThemes);
    assert.equal(uniqueThemes.size, 5, `Harus ada 5 tema unik tanpa duplikasi! Ditemukan: ${uniqueThemes.size}`);

    const uniqueGenres = new Set(detectedGenres);
    assert.equal(uniqueGenres.size, 5, `Kelima unit harus mencakup kelima klaster genre Pusmendik! Ditemukan: ${uniqueGenres.size}`);

    // 4. Hasil akhir 25 butir lengkap
    assert.equal(pkg.items.length, 25, "Total items harus tepat 25 butir");
    assert.equal(pkg.items[0].nomor, 1);
    assert.equal(pkg.items[24].nomor, 25);
  } finally {
    ai.callRouter = origCallRouter;
  }
});

test("English Drill Diversity: Pola === 'all' untuk 20 dan 10 butir teralokasi proporsional", async () => {
  const origCallRouter = ai.callRouter;

  try {
    // Test 20 butir -> 4 unit (1-5, 6-10, 11-15, 16-20)
    let callCount20 = 0;
    ai.callRouter = async (messages) => {
      callCount20++;
      return JSON.stringify({
        bacaan: "<p>Passage</p>",
        items: Array.from({ length: 5 }, (_, i) => ({
          nomor: i + 1, pola: 1, tipe_soal: "pilihan_ganda", soal: "Q", options: [{ id: "a", text: "A" }], kunci_jawaban: "a", kunci_jawaban_text: "Exp"
        }))
      });
    };
    const pkg20 = await generateAiDrillPackage({ subject: "Bahasa Inggris", pola: "all", count: 20 });
    assert.equal(callCount20, 4, "Target count 20 harus membuat 4 unit");
    assert.equal(pkg20.items.length, 20);

    // Test 10 butir -> 2 unit (1-5, 6-10)
    let callCount10 = 0;
    ai.callRouter = async (messages) => {
      callCount10++;
      return JSON.stringify({
        bacaan: "<p>Passage</p>",
        items: Array.from({ length: 5 }, (_, i) => ({
          nomor: i + 1, pola: 1, tipe_soal: "pilihan_ganda", soal: "Q", options: [{ id: "a", text: "A" }], kunci_jawaban: "a", kunci_jawaban_text: "Exp"
        }))
      });
    };
    const pkg10 = await generateAiDrillPackage({ subject: "Bahasa Inggris", pola: "all", count: 10 });
    assert.equal(callCount10, 2, "Target count 10 harus membuat 2 unit");
    assert.equal(pkg10.items.length, 10);
  } finally {
    ai.callRouter = origCallRouter;
  }
});

test("English Drill Diversity: Pola === 'all' untuk 5 butir menggunakan tema acak dinamis dan header English", async () => {
  const origCallRouter = ai.callRouter;
  const pickedThemes = new Set();

  try {
    for (let run = 0; run < 15; run++) {
      let promptCaptured = "";
      ai.callRouter = async (messages) => {
        promptCaptured = messages[1].content;
        return JSON.stringify({
          bacaan: "", // Biarkan kosong untuk menguji fallback defaultHeader
          items: [
            { nomor: 1, pola: 1, tipe_soal: "pilihan_ganda", soal: "Q1", options: [{ id: "a", text: "A" }], kunci_jawaban: "a", kunci_jawaban_text: "E1" },
            { nomor: 2, pola: 2, tipe_soal: "pilihan_ganda", soal: "Q2", options: [{ id: "a", text: "A" }], kunci_jawaban: "a", kunci_jawaban_text: "E2" },
            { nomor: 3, pola: 5, tipe_soal: "pilihan_ganda", soal: "Q3", options: [{ id: "a", text: "A" }], kunci_jawaban: "a", kunci_jawaban_text: "E3" },
            { nomor: 4, pola: 4, tipe_soal: "pilihan_ganda", soal: "Q4", options: [{ id: "a", text: "A" }], kunci_jawaban: "a", kunci_jawaban_text: "E4" },
            { nomor: 5, pola: 6, tipe_soal: "pilihan_ganda", soal: "Q5", options: [{ id: "a", text: "A" }], kunci_jawaban: "a", kunci_jawaban_text: "E5" }
          ]
        });
      };

      const result = await generateAiDrillPackage({
        subject: "Bahasa Inggris",
        pola: "all",
        count: 5
      });

      // Verifikasi default header English
      assert.ok(
        result.bacaan.includes("<p><strong>Questions 1 to 5 are based on the following passage.</strong></p>"),
        `Header bacaan harus berformat English baku: ${result.bacaan}`
      );

      // Cari tema yang diprompt
      const matchedTheme = DIVERSE_THEME_POOLS.inggris.find(t => promptCaptured.includes(t));
      if (matchedTheme) {
        pickedThemes.add(matchedTheme);
      }
    }

    // Dari 15 run, harus menghasilkan lebih dari 1 tema unik (membuktikan acak dinamis, bukan mengunci ke index 0)
    assert.ok(
      pickedThemes.size > 1,
      `Tema harus teracak secara dinamis, bukan statis index 0! Jumlah tema unik dalam 15 run: ${pickedThemes.size}`
    );
  } finally {
    ai.callRouter = origCallRouter;
  }
});
