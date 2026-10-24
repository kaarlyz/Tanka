/**
 * Tanka Canonical Concept Graph & Knowledge Map Service
 * Menghubungkan konsep kanonikal, rencana bab, dan relasi (edges) ke struktur visual MindMapTree.
 */

const PALETTE = [
  { primary: "#18221f", light: "#f4f6f3", border: "#d5ded3", text: "#18221f" },
  { primary: "#2563eb", light: "#eff6ff", border: "#bfdbfe", text: "#1e40af" },
  { primary: "#059669", light: "#ecfdf5", border: "#a7f3d0", text: "#065f46" },
  { primary: "#d97706", light: "#fffbeb", border: "#fde68a", text: "#92400e" },
  { primary: "#7c3aed", light: "#f5f3ff", border: "#ddd6fe", text: "#5b21b6" },
  { primary: "#0891b2", light: "#ecfeff", border: "#a5f3fc", text: "#155e75" }
];

/**
 * Validasi dan inferensi relasi konsep (concept edges) agar graf selalu terhubung.
 */
function buildOrInferConceptEdges(concepts = [], chapters = [], rawEdges = []) {
  const conceptList = Array.isArray(concepts) ? concepts : [];
  const conceptMap = new Map();
  const aliasMap = new Map();

  conceptList.forEach((c) => {
    const rawId = String(c.id).trim();
    conceptMap.set(rawId, c);
    aliasMap.set(rawId, rawId);

    // Support short aliases like 'c1' if id is 'doc_123_c1'
    if (rawId.includes("_")) {
      const parts = rawId.split("_");
      const shortId = parts[parts.length - 1];
      if (/^c\d+$/i.test(shortId)) {
        aliasMap.set(shortId, rawId);
      }
    }
  });

  const validEdges = [];
  const edgeKeys = new Set();

  function addEdge(sourceId, targetId, label, type = "association", evidence = "") {
    const resolvedSource = aliasMap.get(sourceId);
    const resolvedTarget = aliasMap.get(targetId);

    if (!resolvedSource || !resolvedTarget) return;
    if (resolvedSource === resolvedTarget) return;

    const key = `${resolvedSource}->${resolvedTarget}`;
    if (edgeKeys.has(key)) return;

    edgeKeys.add(key);
    validEdges.push({
      sourceId: resolvedSource,
      targetId: resolvedTarget,
      relationLabel: label || "berkaitan dengan",
      relationType: type || "association",
      evidenceQuote: evidence || ""
    });
  }

  // 1. Masukkan rawEdges dari input AI jika valid
  if (Array.isArray(rawEdges)) {
    rawEdges.forEach((e) => {
      const s = String(e.sourceId || e.source_id || "").trim();
      const t = String(e.targetId || e.target_id || "").trim();
      if (s && t) {
        addEdge(s, t, e.relationLabel || e.relation_label, e.relationType || e.relation_type, e.evidenceQuote || e.evidence_quote);
      }
    });
  }

  // 2. Inferensi relasi dari prerequisites (prasyarat)
  conceptList.forEach((c) => {
    let prereqs = [];
    if (Array.isArray(c.prasyarat)) {
      prereqs = c.prasyarat;
    } else if (typeof c.prerequisites === "string" && c.prerequisites.trim().startsWith("[")) {
      try {
        const parsed = JSON.parse(c.prerequisites);
        if (Array.isArray(parsed)) prereqs = parsed;
      } catch {
        // Abaikan jika prerequisites bukan JSON array
      }
    }

    prereqs.forEach((pId) => {
      addEdge(String(pId).trim(), c.id, "prasyarat bagi", "prerequisite");
    });
  });

  // 3. Jika graf masih terlalu jarang (< 2 edge), sambungkan konsep se-bab secara sekuensial
  if (validEdges.length < Math.min(conceptList.length - 1, 4) && Array.isArray(chapters)) {
    chapters.forEach((ch) => {
      let chKeyIds = [];
      if (Array.isArray(ch.keyConceptIds)) chKeyIds = ch.keyConceptIds;
      else if (typeof ch.key_concept_ids === "string") {
        try {
          const parsed = JSON.parse(ch.key_concept_ids);
          if (Array.isArray(parsed)) chKeyIds = parsed;
        } catch {
          // ignore
        }
      }

      for (let i = 0; i < chKeyIds.length - 1; i++) {
        addEdge(chKeyIds[i], chKeyIds[i + 1], "berkaitan dalam bab", "association");
      }
    });
  }

  return validEdges;
}

/**
 * Konversi basis data kanonikal menjadi pohon terstruktur MindMapTree untuk InteractiveMindMap.
 */
function buildMindMapTreeFromCanonicalGraph(docTitle = "Peta Konsep", concepts = [], chapters = [], edges = []) {
  const rootTitle = docTitle || "Peta Konsep Materi";
  const conceptList = Array.isArray(concepts) ? concepts : [];
  const chapterList = Array.isArray(chapters) ? chapters : [];
  const edgeList = Array.isArray(edges) ? edges : [];

  const conceptMap = new Map();
  conceptList.forEach((c) => {
    conceptMap.set(String(c.id), c);
    if (c.id && String(c.id).includes("_")) {
      const parts = String(c.id).split("_");
      conceptMap.set(parts[parts.length - 1], c);
    }
  });

  // Map edges per source concept
  const outgoingEdges = new Map();
  edgeList.forEach((e) => {
    const s = String(e.sourceId || e.source_id);
    if (!outgoingEdges.has(s)) outgoingEdges.set(s, []);
    outgoingEdges.get(s).push(e);
  });

  const stages = [];

  chapterList.forEach((ch, chIdx) => {
    const chNum = Number(ch.chapterNumber ?? ch.chapter_number ?? (chIdx + 1));
    const title = String(ch.chapterTitle ?? ch.title ?? `Bab ${chNum}`).trim();
    const shortTitle = title.replace(/^Bab\s+\d+:\s*/i, "").trim();
    const color = PALETTE[(chNum - 1) % PALETTE.length];

    let keyIds = [];
    if (Array.isArray(ch.keyConceptIds)) keyIds = ch.keyConceptIds;
    else if (typeof ch.key_concept_ids === "string") {
      try {
        const parsed = JSON.parse(ch.key_concept_ids);
        if (Array.isArray(parsed)) keyIds = parsed;
      } catch {
        keyIds = [];
      }
    }

    const subModules = [];

    keyIds.forEach((kId, subIdx) => {
      const concept = conceptMap.get(String(kId));
      if (!concept) return;

      const subNum = `${chNum}.${subIdx + 1}`;
      const conceptDef = concept.definition || concept.definisi || "";

      // Anak-anak simpul: hubungan spesifik ke konsep lain (edges)
      const outEdges = outgoingEdges.get(String(concept.id)) || outgoingEdges.get(String(kId)) || [];
      const children = [];

      outEdges.forEach((edge, edgeIdx) => {
        const targetId = String(edge.targetId || edge.target_id);
        const targetConcept = conceptMap.get(targetId);
        const label = edge.relationLabel || edge.relation_label || "berkaitan";
        const targetName = targetConcept ? targetConcept.name : targetId;

        children.push({
          id: `edge_${concept.id}_${targetId}_${edgeIdx}`,
          title: `➔ ${label}: ${targetName}`,
          conceptNumber: `${subNum}.${edgeIdx + 1}`,
          desc: targetConcept ? (targetConcept.definition || targetConcept.name) : ""
        });
      });

      // Jika ada bukti kutipan sumber, masukkan sebagai simpul verifikasi
      if (concept.evidence_quote || concept.bukti_kutipan) {
        children.push({
          id: `evidence_${concept.id}`,
          title: `📖 Sumber: "${concept.evidence_quote || concept.bukti_kutipan}"`,
          conceptNumber: `${subNum}.ref`,
          desc: "Kutipan terverifikasi dari bahan sumber asli."
        });
      }

      subModules.push({
        id: `concept_${concept.id}`,
        title: concept.name,
        subNumber: subNum,
        desc: conceptDef,
        children
      });
    });

    stages.push({
      id: `stage_${chNum}`,
      title,
      shortTitle,
      stageNumber: chNum,
      desc: ch.targetGoal || ch.target_goal || ch.trigger_question || "",
      color,
      children: subModules
    });
  });

  return {
    id: "root",
    title: rootTitle,
    color: PALETTE[0],
    children: stages
  };
}

/**
 * Sinkronisasi edges konsep ke tabel SQLite concept_edges.
 */
function syncConceptEdgesToDb(dbInstance, docId, edges) {
  if (!dbInstance || !docId || !Array.isArray(edges)) return;

  try {
    dbInstance.prepare("DELETE FROM concept_edges WHERE doc_id = ?").run(docId);
    const insertEdge = dbInstance.prepare(`
      INSERT INTO concept_edges (id, doc_id, source_id, target_id, relation_label, relation_type, evidence_quote, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = Date.now();
    for (const e of edges) {
      const s = String(e.sourceId || e.source_id);
      const t = String(e.targetId || e.target_id);
      if (!s || !t || s === t) continue;

      const edgeId = `edge_${docId}_${s}_${t}`;
      insertEdge.run(
        edgeId,
        docId,
        s,
        t,
        e.relationLabel || e.relation_label || "berkaitan dengan",
        e.relationType || e.relation_type || "association",
        e.evidenceQuote || e.evidence_quote || "",
        now
      );
    }
  } catch (err) {
    console.warn("[conceptGraphService] Notice syncing concept edges to DB:", err.message);
  }
}

/**
 * Membangun Peta Kisi-Kisi & Kompetensi Ujian dari butir-butir soal ujian (TKA/UTBK).
 * Menghilangkan ranting opsi A-B-C-D dan menyusun pohon kompetensi:
 * Root (Judul Ujian) ➔ Subtes / Ranah Materi ➔ Konsep Kunci yang Diuji ➔ Butir Soal & Trik Cepat.
 */
function buildExamMindMapTree(docTitle, questions = []) {
  const rootTitle = docTitle || "Peta Kisi-Kisi Kompetensi Ujian";
  const subtesMap = new Map();

  const subtesLabels = {
    penalaran_umum: "Penalaran Umum",
    pengetahuan_pemahaman_umum: "Pengetahuan & Pemahaman Umum",
    pemahaman_bacaan_menulis: "Pemahaman Bacaan & Menulis",
    pengetahuan_kuantitatif: "Pengetahuan Kuantitatif",
    literasi_indonesia: "Literasi Bahasa Indonesia",
    literasi_inggris: "Literasi Bahasa Inggris",
    penalaran_matematika: "Penalaran Matematika",
    mapel_tka: "Mata Pelajaran TKA",
    lainnya: "Kompetensi Utama"
  };

  questions.forEach((q) => {
    const rawSt = q.subtes || "lainnya";
    const stKey = subtesLabels[rawSt] || String(rawSt).replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
    if (!subtesMap.has(stKey)) {
      subtesMap.set(stKey, []);
    }
    subtesMap.get(stKey).push(q);
  });

  const stages = [];
  let stageIdx = 1;

  subtesMap.forEach((qList, subtesName) => {
    const color = PALETTE[(stageIdx - 1) % PALETTE.length];

    // Kelompokkan soal berdasarkan Konsep Kunci di dalam subtes ini
    const conceptGroups = new Map();

    qList.forEach((q) => {
      let concepts = [];
      if (q.formula && typeof q.formula === "string") {
        concepts = q.formula.split(/[;,]/).map((s) => s.trim()).filter(Boolean);
      }
      if (concepts.length === 0 && q._pembahasan && Array.isArray(q._pembahasan.konsep_kunci)) {
        concepts = q._pembahasan.konsep_kunci.map((s) => String(s).trim()).filter(Boolean);
      }
      if (concepts.length === 0) {
        // Fallback: judul ringkas materi soal
        const cleanQ = String(q.question || "").replace(/<[^>]+>/g, "").replace(/\$[^$]+\$/g, "").trim();
        const shortDesc = cleanQ.slice(0, 32).trim() || `Indikator Soal #${q.id}`;
        concepts = [shortDesc];
      }

      concepts.forEach((cName) => {
        // Bersihkan nama konsep dari awalan berlebih
        const cleanName = cName.replace(/^[-*•]\s*/, "").trim();
        if (!cleanName) return;
        if (!conceptGroups.has(cleanName)) {
          conceptGroups.set(cleanName, []);
        }
        conceptGroups.get(cleanName).push(q);
      });
    });

    const subModules = [];
    let subIdx = 1;

    conceptGroups.forEach((matchedQuestions, cName) => {
      const subNum = `${stageIdx}.${subIdx}`;
      const children = [];

      matchedQuestions.forEach((q, qIdx) => {
        const tingkat = q.tingkat ? String(q.tingkat).toUpperCase() : "SEDANG";
        const parts = [];
        if (q.trik_cepat) parts.push(`💡 Trik: ${q.trik_cepat}`);
        if (q.pitfall) parts.push(`⚠️ Jebakan: ${q.pitfall}`);
        if (parts.length === 0 && q.explanation) {
          parts.push(q.explanation.slice(0, 140) + "...");
        }

        children.push({
          id: `soal_${q.id}_${qIdx}`,
          title: `Soal #${q.id} [${tingkat}]`,
          conceptNumber: `${subNum}.${qIdx + 1}`,
          desc: parts.join(" | ") || `Butir soal nomor ${q.id} menguji penguasaan materi ${cName}.`
        });
      });

      subModules.push({
        id: `exam_concept_${stageIdx}_${subIdx}`,
        title: cName,
        subNumber: subNum,
        desc: `Domain materi ${subtesName}: menguji ${matchedQuestions.length} butir soal (${matchedQuestions.map((q) => "#" + q.id).join(", ")}).`,
        children
      });

      subIdx++;
    });

    stages.push({
      id: `stage_subtes_${stageIdx}`,
      title: subtesName,
      shortTitle: subtesName,
      stageNumber: stageIdx,
      desc: `Kisi-kisi materi ${subtesName} (${qList.length} butir soal terdistribusi dalam ${conceptGroups.size} indikator kompetensi).`,
      color,
      children: subModules
    });

    stageIdx++;
  });

  return {
    id: "root",
    title: `Peta Kisi-Kisi: ${rootTitle}`,
    color: PALETTE[0],
    children: stages
  };
}

/**
 * Mengambil payload lengkap Concept Graph dan MindMapTree untuk dokumen tertentu.
 */
function getConceptGraphForDocument(dbInstance, docId) {
  if (!dbInstance || !docId) return null;

  const doc = dbInstance.prepare("SELECT id, title, summary FROM documents WHERE id = ?").get(docId);
  if (!doc) return null;

  // 1. Cek apakah dokumen ini memiliki butir soal ujian (exam sheet / naskah soal)
  let quizQuestions = [];
  try {
    const canonicalQuiz = dbInstance.prepare(
      "SELECT id, questions, quiz_type FROM quizzes WHERE doc_id = ? ORDER BY (CASE WHEN quiz_type = 'exam_sheet' OR id LIKE 'quiz_exam_%' THEN 1 ELSE 2 END), created_at DESC LIMIT 1"
    ).get(docId);

    if (canonicalQuiz && canonicalQuiz.questions) {
      const parsed = JSON.parse(canonicalQuiz.questions);
      if (Array.isArray(parsed) && parsed.length > 0) quizQuestions = parsed;
    }

    const concepts = dbInstance.prepare("SELECT * FROM document_concepts WHERE doc_id = ? ORDER BY created_at ASC").all(docId);
    const chapters = dbInstance.prepare("SELECT * FROM chapter_plans WHERE doc_id = ? ORDER BY chapter_number ASC").all(docId);
    let edges = dbInstance.prepare("SELECT * FROM concept_edges WHERE doc_id = ? ORDER BY created_at ASC").all(docId);

    // Jika naskah ujian dengan butir soal terverifikasi, gunakan Peta Kisi-Kisi Kompetensi Soal
    if (quizQuestions.length > 0 && (concepts.length === 0 || chapters.length === 0 || (canonicalQuiz && (canonicalQuiz.quiz_type === "exam_sheet" || canonicalQuiz.id.startsWith("quiz_exam_"))))) {
      const examTree = buildExamMindMapTree(doc.title, quizQuestions);
      return {
        success: true,
        docId,
        title: doc.title,
        summary: doc.summary,
        isExamSheet: true,
        questionCount: quizQuestions.length,
        nodeCount: examTree.children.reduce((acc, st) => acc + st.children.length, 0),
        edgeCount: 0,
        chapterCount: examTree.children.length,
        nodes: [],
        edges: [],
        tree: examTree
      };
    }
  } catch (quizErr) {
    // Quizzes table might not exist in isolated test mocks
  }

  const concepts = dbInstance.prepare("SELECT * FROM document_concepts WHERE doc_id = ? ORDER BY created_at ASC").all(docId);
  const chapters = dbInstance.prepare("SELECT * FROM chapter_plans WHERE doc_id = ? ORDER BY chapter_number ASC").all(docId);
  let edges = dbInstance.prepare("SELECT * FROM concept_edges WHERE doc_id = ? ORDER BY created_at ASC").all(docId);

  // Jika edges belum ada di DB, inferensi dan simpan otomatis
  if (edges.length === 0 && concepts.length > 0) {
    const inferred = buildOrInferConceptEdges(concepts, chapters, []);
    if (inferred.length > 0) {
      syncConceptEdgesToDb(dbInstance, docId, inferred);
      edges = dbInstance.prepare("SELECT * FROM concept_edges WHERE doc_id = ? ORDER BY created_at ASC").all(docId);
    }
  }

  const tree = buildMindMapTreeFromCanonicalGraph(doc.title, concepts, chapters, edges);

  return {
    success: true,
    docId,
    title: doc.title,
    summary: doc.summary,
    nodeCount: concepts.length,
    edgeCount: edges.length,
    chapterCount: chapters.length,
    nodes: concepts.map((c) => ({
      id: c.id,
      name: c.name,
      definition: c.definition,
      category: c.category || "core",
      isRequired: Boolean(c.is_required),
      origin: c.origin || "source",
      evidenceQuote: c.evidence_quote || "",
      segmentId: c.segment_id || ""
    })),
    edges: edges.map((e) => ({
      id: e.id,
      sourceId: e.source_id,
      targetId: e.target_id,
      relationLabel: e.relation_label,
      relationType: e.relation_type,
      evidenceQuote: e.evidence_quote
    })),
    tree
  };
}

module.exports = {
  buildOrInferConceptEdges,
  buildMindMapTreeFromCanonicalGraph,
  buildExamMindMapTree,
  syncConceptEdgesToDb,
  getConceptGraphForDocument
};
