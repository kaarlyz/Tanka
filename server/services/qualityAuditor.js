/**
 * Tanka Independent Educational Quality Auditor
 * Memvalidasi kepatuhan pedagogis, ketiadaan kebocoran soal pilihan ganda,
 * dan kedalaman penjelasan konsep kanonikal.
 */

/**
 * Cek kepatuhan deterministik dan pedagogis sebuah bab.
 *
 * @param {string} chapterMarkdown - Teks markdown dari satu bab
 * @param {Array<Object>} chapterConcepts - Konsep kanonikal yang seharusnya dibahas
 * @param {Object} options - { chapterNumber: number, title: string }
 * @returns {Object} Hasil audit terstruktur
 */
function auditChapterQuality(chapterMarkdown = "", chapterConcepts = [], options = {}) {
  const issues = [];
  const text = String(chapterMarkdown || "").trim();
  const chNum = options.chapterNumber || 1;
  const chTitle = options.title || `Bab ${chNum}`;

  if (!text) {
    return {
      isValid: false,
      status: "BLOCKED",
      score: 0,
      dimensions: {
        formatCompliance: { status: "FAIL" },
        conceptCoverage: { status: "FAIL", covered: [], missing: [] },
        pedagogicalQuality: { status: "FAIL" }
      },
      issues: [
        {
          code: "EMPTY_CHAPTER_CONTENT",
          severity: "critical",
          location: `Bab ${chNum}`,
          message: `Konten Bab ${chNum} kosong.`,
          recommendation: "Regenerasi bab dari rencana bab."
        }
      ]
    };
  }

  // 1. DIMENSI: Kepatuhan Format & Anti-Leak Pilihan Ganda (Aturan Mutlak 7)
  const mcRegex = /\b[A-E]\.\s+[A-Za-z0-9]/;
  const mcOptionHeader = /(?:pilihan ganda|kunci jawaban|opsi jawaban):/i;
  let hasMcLeak = false;

  if (mcRegex.test(text) || mcOptionHeader.test(text)) {
    hasMcLeak = true;
    issues.push({
      code: "MULTIPLE_CHOICE_LEAK",
      severity: "critical",
      location: `Bab ${chNum} ("${chTitle}")`,
      message: "Terdeteksi kebocoran format soal pilihan ganda (opsi A, B, C, D, E) di dalam modul bacaan.",
      recommendation: "Hapus opsi pilihan ganda dari modul bacaan. Gunakan soal pemantik terbuka atau pindahkan ke tab kuis."
    });
  }

  // 2. DIMENSI: Concept Coverage (Pemeriksaan Kemunculan Konsep Kunci)
  const concepts = Array.isArray(chapterConcepts) ? chapterConcepts : [];
  const coveredConcepts = [];
  const missingConcepts = [];

  const lowerText = text.toLowerCase();

  concepts.forEach((c) => {
    const cName = String(c.name || "").trim().toLowerCase();
    if (!cName) return;

    // Cek apakah nama konsep atau kata kunci utamanya muncul di dalam teks bab
    const nameParts = cName.split(/\s+/).filter(p => p.length > 3);
    const isDirectMatch = lowerText.includes(cName);
    const isPartialMatch = nameParts.length > 0 && nameParts.filter(p => lowerText.includes(p)).length >= Math.ceil(nameParts.length * 0.7);

    if (isDirectMatch || isPartialMatch) {
      coveredConcepts.push(c.name);
    } else {
      missingConcepts.push(c.name);
      issues.push({
        code: "CONCEPT_NAME_MISSING",
        severity: "critical",
        location: `Bab ${chNum} ("${chTitle}")`,
        message: `Konsep kunci '${c.name}' tidak ditemukan pembahasannya di dalam Bab ${chNum}.`,
        recommendation: `Sertakan sub-bab eksplisit '### ${c.name}' beserta penjelasan mekanismenya.`
      });
    }
  });

  // 3. DIMENSI: Kualitas Pedagogis (Mekanisme, Batas Konsep, dan Peringatan Salah Kaprah)
  const hasSubheadings = /###\s+/.test(text);
  if (!hasSubheadings && concepts.length > 1) {
    issues.push({
      code: "LACK_OF_STRUCTURAL_SUBHEADINGS",
      severity: "warning",
      location: `Bab ${chNum}`,
      message: "Bab tidak memiliki sub-heading terstruktur (###) untuk memisahkan konsep.",
      recommendation: "Bagi setiap konsep menjadi sub-bab berurutan."
    });
  }

  const hasPitfallOrWarning = /salah kaprah|jebakan|miskonsepsi|pitfall|peringatan|jangan tertukar/i.test(text);
  if (!hasPitfallOrWarning && concepts.length > 0) {
    issues.push({
      code: "MISSING_PITFALL_WARNING",
      severity: "minor",
      location: `Bab ${chNum}`,
      message: "Tidak ditemukan peringatan salah kaprah (pitfall) untuk mencegah miskonsepsi ujian.",
      recommendation: "Tambahkan catatan jebakan logika atau pembeda konsep yang sering tertukar."
    });
  }

  // 4. Skor dan Status Keseluruhan
  const criticalCount = issues.filter(i => i.severity === "critical").length;
  const warningCount = issues.filter(i => i.severity === "warning").length;
  const minorCount = issues.filter(i => i.severity === "minor").length;

  let score = 100 - (criticalCount * 35) - (warningCount * 15) - (minorCount * 5);
  score = Math.max(0, Math.min(100, score));

  let status = "PASS";
  let isValid = true;

  if (criticalCount > 0) {
    isValid = false;
    status = "NEEDS_REVISION";
  } else if (warningCount > 0 || minorCount > 0) {
    status = "PASS_WITH_WARNINGS";
  }

  return {
    isValid,
    status,
    score,
    dimensions: {
      formatCompliance: {
        status: hasMcLeak ? "FAIL" : "PASS",
        multipleChoiceLeak: hasMcLeak
      },
      conceptCoverage: {
        status: missingConcepts.length === 0 ? "PASS" : "FAIL",
        totalExpected: concepts.length,
        coveredCount: coveredConcepts.length,
        covered: coveredConcepts,
        missingCount: missingConcepts.length,
        missing: missingConcepts
      },
      pedagogicalQuality: {
        status: hasPitfallOrWarning && hasSubheadings ? "PASS" : "ACCEPTABLE",
        hasSubheadings,
        hasPitfallOrWarning
      }
    },
    issues
  };
}

/**
 * Audit kualitas seluruh dokumen gabungan.
 */
function auditDocumentQuality(fullDocumentMarkdown = "", concepts = [], chapters = []) {
  const issues = [];
  const text = String(fullDocumentMarkdown || "").trim();

  if (!text) {
    return {
      isValid: false,
      status: "BLOCKED",
      score: 0,
      issues: [{ code: "EMPTY_DOCUMENT", severity: "critical", message: "Dokumen kosong." }]
    };
  }

  // Cek heading bab
  const chapterHeadings = (text.match(/##\s+Bab\s+\d+:/gi) || []).length;
  const expectedChapters = Array.isArray(chapters) ? chapters.length : 0;

  if (expectedChapters > 0 && chapterHeadings < expectedChapters) {
    issues.push({
      code: "INCOMPLETE_CHAPTER_COUNT",
      severity: "warning",
      message: `Ditemukan ${chapterHeadings} heading bab, diharapkan ${expectedChapters} bab.`
    });
  }

  // Audit anti-leak global
  const mcRegex = /\b[A-E]\.\s+[A-Za-z0-9]/;
  if (mcRegex.test(text)) {
    issues.push({
      code: "GLOBAL_MULTIPLE_CHOICE_LEAK",
      severity: "critical",
      message: "Modul bacaan memuat opsi pilihan ganda (A/B/C/D/E)."
    });
  }

  const criticals = issues.filter(i => i.severity === "critical").length;
  const isValid = criticals === 0;

  return {
    isValid,
    status: isValid ? (issues.length > 0 ? "PASS_WITH_WARNINGS" : "PASS") : "NEEDS_REVISION",
    score: Math.max(0, 100 - (criticals * 40) - ((issues.length - criticals) * 15)),
    chapterHeadingsFound: chapterHeadings,
    expectedChapters,
    issues
  };
}

module.exports = {
  auditChapterQuality,
  auditDocumentQuality
};
