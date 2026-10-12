/**
 * Tanka Deterministic Curriculum Coverage Validator
 * Memeriksa pemetaan konsep wajib ke rencana bab secara deterministik tanpa LLM.
 */

function isConceptRequired(concept) {
  if (!concept) return false;
  if (typeof concept.is_required === "boolean") return concept.is_required;
  if (typeof concept.is_required === "number") return concept.is_required === 1;

  if (concept.category) {
    const cat = String(concept.category).toLowerCase().trim();
    if (cat === "optional" || cat === "enrichment" || cat === "pengayaan") return false;
    if (cat === "core" || cat === "wajib" || cat === "required" || cat === "fondasi") return true;
  }

  if (concept.origin === "ai_enrichment") return false;
  return true;
}

function parseConceptIds(input) {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input.map(item => String(item).trim()).filter(Boolean);
  }
  if (typeof input === "string") {
    const trimmed = input.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.map(item => String(item).trim()).filter(Boolean);
        }
      } catch {
        // Fallback to comma-separated below
      }
    }
    return trimmed.split(",").map(s => s.trim()).filter(Boolean);
  }
  return [];
}

/**
 * Validasi cakupan kurikulum antara konsep kanonikal dan rencana bab.
 *
 * @param {Array<Object>} canonicalConcepts - Daftar konsep kanonikal
 * @param {Array<Object>} chapterPlans - Rencana bab yang memetakan keyConceptIds
 * @param {Object} options - { allowDuplicates: boolean, docId: string }
 * @returns {Object} Structured validation result
 */
function validateCurriculumCoverage(canonicalConcepts = [], chapterPlans = [], options = {}) {
  const allowDuplicates = options.allowDuplicates === true;
  const docId = options.docId ? String(options.docId) : "";

  const issues = [];
  const invalidConceptReferences = [];
  const duplicateMappings = [];
  const unmappedRequiredConceptIds = [];
  const unmappedOptionalConceptIds = [];

  const conceptsList = Array.isArray(canonicalConcepts) ? canonicalConcepts : [];
  const chaptersList = Array.isArray(chapterPlans) ? chapterPlans : [];

  // Check 1: Empty Canonical Concepts
  if (conceptsList.length === 0) {
    issues.push({
      code: "EMPTY_CONCEPTS",
      severity: "critical",
      message: "Daftar konsep kanonikal kosong. Tidak dapat memvalidasi coverage kurikulum."
    });

    return {
      isValid: false,
      status: "BLOCKED",
      summary: {
        totalConcepts: 0,
        requiredConceptsCount: 0,
        optionalConceptsCount: 0,
        mappedRequiredCount: 0,
        unmappedRequiredCount: 0,
        mappedOptionalCount: 0,
        unmappedOptionalCount: 0,
        totalChapters: chaptersList.length,
        totalConceptReferences: 0,
        duplicateConceptCount: 0,
        invalidReferenceCount: 0
      },
      issues,
      unmappedRequiredConceptIds,
      unmappedOptionalConceptIds,
      invalidConceptReferences,
      duplicateMappings,
      coverageMatrix: [],
      semanticDisclaimer: "Validasi struktural diblokir: tidak ada konsep kanonikal untuk dievaluasi."
    };
  }

  // Build concept index and lookup tables
  const registry = new Map();
  const aliasMap = new Map(); // maps alias -> primary concept id

  conceptsList.forEach((rawConcept, idx) => {
    const rawId = String(rawConcept.id || `c${idx + 1}`).trim();
    const name = String(rawConcept.name || rawConcept.title || rawId).trim();
    const isRequired = isConceptRequired(rawConcept);
    const origin = String(rawConcept.origin || "source");
    const category = String(rawConcept.category || (isRequired ? "core" : "enrichment"));

    const conceptRecord = {
      id: rawId,
      name,
      isRequired,
      origin,
      category,
      mappedChapters: new Set(),
      rawConcept
    };

    registry.set(rawId, conceptRecord);
    aliasMap.set(rawId, rawId);

    // If ID is prefixed with docId (e.g. "doc1_c1"), register short ID "c1" as alias
    if (docId && rawId.startsWith(`${docId}_`)) {
      const shortId = rawId.slice(docId.length + 1);
      if (shortId && !aliasMap.has(shortId)) {
        aliasMap.set(shortId, rawId);
      }
    } else if (rawId.includes("_")) {
      const parts = rawId.split("_");
      const shortId = parts[parts.length - 1];
      if (/^c\d+$/i.test(shortId) && !aliasMap.has(shortId)) {
        aliasMap.set(shortId, rawId);
      }
    }

    if (rawConcept.canonical_id && !aliasMap.has(String(rawConcept.canonical_id))) {
      aliasMap.set(String(rawConcept.canonical_id), rawId);
    }
  });

  // Check 2: Empty Chapter Plans
  if (chaptersList.length === 0) {
    const requiredConcepts = Array.from(registry.values()).filter(c => c.isRequired);
    const unmappedReq = requiredConcepts.map(c => c.id);

    issues.push({
      code: "EMPTY_CHAPTERS",
      severity: "critical",
      message: "Daftar rencana bab kosong. Seluruh konsep wajib belum memiliki wadah pembelajaran."
    });

    requiredConcepts.forEach(c => {
      issues.push({
        code: "MISSING_REQUIRED_CONCEPT",
        severity: "critical",
        conceptId: c.id,
        conceptName: c.name,
        message: `Konsep wajib '${c.name}' (${c.id}) tidak memiliki rencana bab.`
      });
    });

    return {
      isValid: false,
      status: "BLOCKED",
      summary: {
        totalConcepts: registry.size,
        requiredConceptsCount: requiredConcepts.length,
        optionalConceptsCount: registry.size - requiredConcepts.length,
        mappedRequiredCount: 0,
        unmappedRequiredCount: requiredConcepts.length,
        mappedOptionalCount: 0,
        unmappedOptionalCount: registry.size - requiredConcepts.length,
        totalChapters: 0,
        totalConceptReferences: 0,
        duplicateConceptCount: 0,
        invalidReferenceCount: 0
      },
      issues,
      unmappedRequiredConceptIds: unmappedReq,
      unmappedOptionalConceptIds: Array.from(registry.values()).filter(c => !c.isRequired).map(c => c.id),
      invalidConceptReferences,
      duplicateMappings,
      coverageMatrix: Array.from(registry.values()).map(c => ({
        conceptId: c.id,
        name: c.name,
        isRequired: c.isRequired,
        origin: c.origin,
        category: c.category,
        mappedChapters: [],
        isCovered: false
      })),
      semanticDisclaimer: "Validasi struktural gagal: belum ada bab kurikulum yang disusun."
    };
  }

  // Check 3: Process Chapters and Track References
  let totalConceptReferences = 0;
  const chapterConceptOccurrences = new Map(); // conceptId -> array of chapter numbers

  chaptersList.forEach((chapter, chIdx) => {
    const chapterNum = Number(chapter.chapterNumber ?? chapter.chapter_number ?? (chIdx + 1));
    const chapterTitle = String(chapter.chapterTitle ?? chapter.title ?? `Bab ${chapterNum}`).trim();
    const rawConceptIds = parseConceptIds(chapter.keyConceptIds ?? chapter.key_concept_ids);

    // Track unique IDs inside this chapter to avoid false duplicate hits from duplicate items within a single chapter array
    const seenInThisChapter = new Set();

    rawConceptIds.forEach(refId => {
      totalConceptReferences++;
      const resolvedPrimaryId = aliasMap.get(refId);

      if (!resolvedPrimaryId || !registry.has(resolvedPrimaryId)) {
        const invIssue = {
          chapterNumber: chapterNum,
          invalidId: refId,
          message: `Bab ${chapterNum} ("${chapterTitle}") merujuk konsep tak dikenal: '${refId}'.`
        };
        invalidConceptReferences.push(invIssue);
        issues.push({
          code: "INVALID_CONCEPT_REFERENCE",
          severity: "critical",
          chapterNumber: chapterNum,
          invalidId: refId,
          message: invIssue.message
        });
        return;
      }

      if (!seenInThisChapter.has(resolvedPrimaryId)) {
        seenInThisChapter.add(resolvedPrimaryId);
        const record = registry.get(resolvedPrimaryId);
        record.mappedChapters.add(chapterNum);

        if (!chapterConceptOccurrences.has(resolvedPrimaryId)) {
          chapterConceptOccurrences.set(resolvedPrimaryId, []);
        }
        chapterConceptOccurrences.get(resolvedPrimaryId).push(chapterNum);
      }
    });
  });

  // Check 4: Duplicate Mappings across Chapters
  chapterConceptOccurrences.forEach((chList, conceptId) => {
    if (chList.length > 1) {
      const record = registry.get(conceptId);
      const dupIssue = {
        conceptId,
        chapterNumbers: chList,
        message: `Konsep '${record ? record.name : conceptId}' (${conceptId}) dipetakan ke ${chList.length} bab berbeda: Bab [${chList.join(", ")}].`
      };
      duplicateMappings.push(dupIssue);

      issues.push({
        code: "DUPLICATE_CONCEPT_MAPPING",
        severity: allowDuplicates ? "warning" : "critical",
        conceptId,
        conceptName: record ? record.name : conceptId,
        message: dupIssue.message
      });
    }
  });

  // Check 5: Missing Required and Optional Concepts
  registry.forEach((record, conceptId) => {
    if (record.mappedChapters.size === 0) {
      if (record.isRequired) {
        unmappedRequiredConceptIds.push(conceptId);
        issues.push({
          code: "MISSING_REQUIRED_CONCEPT",
          severity: "critical",
          conceptId,
          conceptName: record.name,
          message: `Konsep wajib '${record.name}' (${conceptId}) tidak dipetakan ke bab mana pun.`
        });
      } else {
        unmappedOptionalConceptIds.push(conceptId);
        issues.push({
          code: "UNMAPPED_OPTIONAL_CONCEPT",
          severity: "info",
          conceptId,
          conceptName: record.name,
          message: `Konsep pengayaan/opsional '${record.name}' (${conceptId}) belum dipetakan ke bab.`
        });
      }
    }
  });

  // Summary counts
  const requiredList = Array.from(registry.values()).filter(c => c.isRequired);
  const optionalList = Array.from(registry.values()).filter(c => !c.isRequired);
  const mappedRequiredCount = requiredList.filter(c => c.mappedChapters.size > 0).length;
  const mappedOptionalCount = optionalList.filter(c => c.mappedChapters.size > 0).length;

  const criticalIssues = issues.filter(i => i.severity === "critical");
  const warningIssues = issues.filter(i => i.severity === "warning");

  let status = "PASS";
  let isValid = true;

  if (criticalIssues.length > 0) {
    isValid = false;
    status = "NEEDS_REVISION";
  } else if (warningIssues.length > 0) {
    status = "PASS_WITH_WARNINGS";
  }

  const coverageMatrix = Array.from(registry.values()).map(c => ({
    conceptId: c.id,
    name: c.name,
    isRequired: c.isRequired,
    origin: c.origin,
    category: c.category,
    mappedChapters: Array.from(c.mappedChapters).sort((a, b) => a - b),
    isCovered: c.mappedChapters.size > 0
  }));

  return {
    isValid,
    status,
    summary: {
      totalConcepts: registry.size,
      requiredConceptsCount: requiredList.length,
      optionalConceptsCount: optionalList.length,
      mappedRequiredCount,
      unmappedRequiredCount: unmappedRequiredConceptIds.length,
      mappedOptionalCount,
      unmappedOptionalCount: unmappedOptionalConceptIds.length,
      totalChapters: chaptersList.length,
      totalConceptReferences,
      duplicateConceptCount: duplicateMappings.length,
      invalidReferenceCount: invalidConceptReferences.length
    },
    issues,
    unmappedRequiredConceptIds,
    unmappedOptionalConceptIds,
    invalidConceptReferences,
    duplicateMappings,
    coverageMatrix,
    semanticDisclaimer: "Validasi struktural lolos: seluruh ID terpetakan secara deterministik. Kualitas penjelasan materi, mekanisme sebab-akibat, dan keakuratan transfer belajar tetap memerlukan verifikasi semantik terpisah."
  };
}

/**
 * Validasi cakupan langsung dari SQLite untuk dokumen yang tersimpan.
 *
 * @param {Object} dbInstance - instance DatabaseSync SQLite
 * @param {string} docId - ID dokumen
 * @param {Object} options - { allowDuplicates: boolean }
 * @returns {Object} Structured validation result
 */
function validateDocumentCoverageFromDb(dbInstance, docId, options = {}) {
  if (!dbInstance) {
    throw new Error("dbInstance diperlukan untuk validateDocumentCoverageFromDb");
  }
  if (!docId) {
    return {
      isValid: false,
      status: "BLOCKED",
      issues: [{ code: "MISSING_DOC_ID", severity: "critical", message: "ID dokumen diperlukan." }],
      coverageMatrix: []
    };
  }

  // 1. Cek apakah dokumen ada
  const doc = dbInstance.prepare("SELECT id, title FROM documents WHERE id = ?").get(docId);
  if (!doc) {
    return {
      isValid: false,
      status: "BLOCKED",
      issues: [{ code: "DOCUMENT_NOT_FOUND", severity: "critical", message: `Dokumen dengan ID '${docId}' tidak ditemukan.` }],
      coverageMatrix: []
    };
  }

  // 2. Ambil konsep dokumen
  const concepts = dbInstance.prepare("SELECT * FROM document_concepts WHERE doc_id = ? ORDER BY created_at ASC").all(docId);

  // 3. Ambil chapter plans dokumen
  let chapters = [];
  try {
    chapters = dbInstance.prepare("SELECT * FROM chapter_plans WHERE doc_id = ? ORDER BY chapter_number ASC").all(docId);
  } catch (err) {
    // Tabel chapter_plans mungkin belum dibuat pada runtime lama jika migrasi belum jalan
    chapters = [];
  }

  return validateCurriculumCoverage(concepts, chapters, { ...options, docId });
}

module.exports = {
  isConceptRequired,
  parseConceptIds,
  validateCurriculumCoverage,
  validateDocumentCoverageFromDb
};
