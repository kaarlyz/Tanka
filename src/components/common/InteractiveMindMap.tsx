import React, { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { 
  ZoomIn, ZoomOut, RotateCcw, Layers, X, Sparkles, 
  Compass, ChevronRight, Check, ArrowDown
} from "lucide-react";

export interface MindMapColor {
  primary: string;
  light: string;
  border: string;
  text: string;
}

export interface MindMapConcept {
  id: string;
  title: string;
  conceptNumber: string;
  desc?: string;
}

export interface MindMapSubModule {
  id: string;
  title: string;
  subNumber: string;
  desc?: string;
  children: MindMapConcept[];
}

export interface MindMapStage {
  id: string;
  title: string;
  shortTitle: string;
  stageNumber: number;
  desc?: string;
  children: MindMapSubModule[];
  color: MindMapColor;
}

export interface MindMapTree {
  id: string;
  title: string;
  color?: MindMapColor;
  children: MindMapStage[];
}

interface LayoutItem {
  id: string;
  title: string;
  desc?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  depth: number;
  side: "left" | "right" | "root";
  color: MindMapColor;
  hasChildren: boolean;
  isCollapsed: boolean;
  stageNumber?: number;
  parentId?: string;
  parentX?: number;
  parentY?: number;
}

interface Connection {
  id: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  color: string;
  isMain?: boolean;
}

const PALETTE: MindMapColor[] = [
  { primary: "#4b6623", light: "#f7f9f4", border: "#c2d4bc", text: "#243419" }, // Tanka Deep Forest Green
  { primary: "#38541e", light: "#f4f8ed", border: "#b8cca8", text: "#1e2e13" }, // Tanka Olive Green
  { primary: "#2d4420", light: "#f1f6ec", border: "#a8c298", text: "#182612" }, // Tanka Sage Green
  { primary: "#55732c", light: "#f8fbf5", border: "#d0dfcb", text: "#2c3e17" }, // Tanka Moss
  { primary: "#405b22", light: "#f5f8f0", border: "#bed1b0", text: "#213214" }, // Tanka Fern
  { primary: "#30481d", light: "#eef4e8", border: "#adc49e", text: "#192811" }, // Tanka Pine
];

/**
 * Parser Khusus Ujian & Soal TKA/UTBK
 * Memetakan: Judul Ujian ➔ Subtes / Ranah Materi ➔ Konsep Kunci yang Diuji ➔ Soal-soal yang ngetes konsep itu.
 * Secara ketat MENYARING opsi A-B-C-D dan distractor soal agar tidak mengotori Mind Map.
 */
function parseExamMarkdownToMindMapTree(markdown: string, fallbackTitle: string): MindMapTree {
  const lines = markdown.split("\n");
  let rootTitle = fallbackTitle || "Peta Kisi-Kisi Ujian";

  // 1. Ekstrak judul utama jika ada
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line.startsWith("# ") && !line.startsWith("## ")) {
      rootTitle = line.replace(/^#\s+(?:Bedah Tuntas:\s*)?/, "").replace(/[*_#]/g, "").trim();
      break;
    }
  }

  // 2. Kumpulkan Konsep Kunci umum jika ada di bagian ## Konsep Kunci yang Diuji
  const globalConcepts: string[] = [];
  let inGlobalConceptsSection = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line.startsWith("## ") && line.toLowerCase().includes("konsep kunci")) {
      inGlobalConceptsSection = true;
      continue;
    }
    if (inGlobalConceptsSection) {
      if (line.startsWith("## ") || line.startsWith("---")) {
        inGlobalConceptsSection = false;
      } else if (line.startsWith("- ") || line.startsWith("* ")) {
        const c = line.replace(/^[-*]\s+/, "").replace(/[*_`]/g, "").trim();
        if (c && c.length > 2) globalConcepts.push(c);
      }
    }
  }

  // 3. Parse subtes dan butir soal di dalamnya
  interface ExamQ {
    num: string;
    stem: string;
    concept: string;
    tingkat: string;
    trik: string;
  }
  const subtesMap = new Map<string, ExamQ[]>();
  let currentSubtes = "Kompetensi Utama";
  let currentQ: ExamQ | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Deteksi Subtes (## )
    if (line.startsWith("## ") && !line.toLowerCase().includes("konsep kunci")) {
      currentSubtes = line.replace(/^##\s+/, "").replace(/[*_#]/g, "").trim();
      if (!subtesMap.has(currentSubtes)) {
        subtesMap.set(currentSubtes, []);
      }
      currentQ = null;
      continue;
    }

    // Deteksi Nomor Soal (### Soal X)
    const soalMatch = line.match(/^###\s+Soal\s+(\d+)/i);
    if (soalMatch) {
      if (!subtesMap.has(currentSubtes)) {
        subtesMap.set(currentSubtes, []);
      }
      currentQ = {
        num: soalMatch[1],
        stem: "",
        concept: "",
        tingkat: "Sedang",
        trik: ""
      };
      subtesMap.get(currentSubtes)!.push(currentQ);
      continue;
    }

    // Ekstrak detail soal untuk simpul mind map
    if (currentQ) {
      // Abaikan opsi A-E dari konten mind map
      if (/^\s*[-*•]?\s*[A-Ea-e][.)]\s+/.test(line) || /^\s*\d+\.\s*[A-Ea-e][.)]\s+/.test(line)) {
        continue;
      }

      if (line.includes("**Konsep Kunci:**") || line.includes("Konsep Kunci:")) {
        const cVal = line.replace(/.*?\*\*?Konsep Kunci:\*\*?\s*/i, "").replace(/[*_`]/g, "").trim();
        if (cVal) currentQ.concept = cVal.split(/[;,]/)[0].trim();
      } else if (line.includes("**Trik Cepat:**") || line.includes("Trik Cepat:")) {
        const tVal = line.replace(/.*?\*\*?Trik Cepat:\*\*?\s*/i, "").replace(/[*_`]/g, "").trim();
        if (tVal) currentQ.trik = tVal.slice(0, 160);
      } else if (line.includes("HOTS") || line.includes("Sulit")) {
        currentQ.tingkat = "HOTS";
      } else if (line.includes("Mudah")) {
        currentQ.tingkat = "Mudah";
      } else if (line.startsWith("**") && !currentQ.stem && line.length > 8) {
        currentQ.stem = line.replace(/[*_`]/g, "").trim().slice(0, 80);
      }
    }
  }

  // Jika tidak ada subtes yang terdeteksi, fallback
  if (subtesMap.size === 0) {
    return {
      id: "root",
      title: rootTitle,
      color: PALETTE[0],
      children: []
    };
  }

  const stages: MindMapStage[] = [];
  let stageNumber = 1;

  subtesMap.forEach((qList, subtesName) => {
    const color = PALETTE[(stageNumber - 1) % PALETTE.length];
    const conceptBuckets = new Map<string, ExamQ[]>();

    qList.forEach((q, idx) => {
      let assignedConcept = q.concept;
      if (!assignedConcept && globalConcepts.length > 0) {
        const matched = globalConcepts.find((gc) => (q.stem || "").toLowerCase().includes(gc.toLowerCase()));
        if (matched) assignedConcept = matched;
      }
      if (!assignedConcept) {
        assignedConcept = q.stem ? q.stem.slice(0, 32).trim() : `Kompetensi Bagian ${Math.floor(idx / 4) + 1}`;
      }

      if (!conceptBuckets.has(assignedConcept)) {
        conceptBuckets.set(assignedConcept, []);
      }
      conceptBuckets.get(assignedConcept)!.push(q);
    });

    const subModules: MindMapSubModule[] = [];
    let subIdx = 1;

    conceptBuckets.forEach((matchedQs, cName) => {
      const subNum = `${stageNumber}.${subIdx}`;
      const children: MindMapConcept[] = [];

      matchedQs.forEach((q, qIdx) => {
        children.push({
          id: `soal_${q.num}_${stageNumber}_${subIdx}_${qIdx}`,
          title: `Soal #${q.num} [${q.tingkat}]`,
          conceptNumber: `${subNum}.${qIdx + 1}`,
          desc: q.trik ? `💡 Trik: ${q.trik}` : (q.stem ? `Materi: ${q.stem}` : `Butir soal nomor ${q.num} menguji penguasaan ${cName}.`)
        });
      });

      subModules.push({
        id: `exam_concept_${stageNumber}_${subIdx}`,
        title: cName,
        subNumber: subNum,
        desc: `Domain ${subtesName}: menguji ${matchedQs.length} butir soal (${matchedQs.map((q) => "#" + q.num).join(", ")}).`,
        children
      });

      subIdx++;
    });

    stages.push({
      id: `stage_${stageNumber}`,
      title: subtesName,
      shortTitle: subtesName.replace(/^Subtes\s+\d+:\s*/i, "").trim(),
      stageNumber,
      desc: `Kisi-kisi soal ${subtesName} (${qList.length} butir soal, ${conceptBuckets.size} indikator materi).`,
      color,
      children: subModules
    });

    stageNumber++;
  });

  return {
    id: "root",
    title: `Peta Kisi-Kisi: ${rootTitle}`,
    color: PALETTE[0],
    children: stages
  };
}

/**
 * Robust & Pedagogy-Aware Markdown to Mind Map Parser
 * Excludes quiz questions, worked examples, steps, and options.
 * Organizes cleanly into: Root -> Stages (Chapters) -> Sub-Modules -> Atomic Concepts.
 */
export function parseMarkdownToMindMapTree(markdown: string, fallbackTitle: string): MindMapTree {
  if (!markdown || !markdown.trim()) {
    return { id: "root", title: fallbackTitle || "Peta Konsep", children: [] };
  }

  // Deteksi naskah soal ujian untuk pohon kompetensi khusus (bebas opsi ABC)
  const isExamSheet =
    markdown.includes("# Bedah Tuntas:") ||
    markdown.includes("Soal Latihan Terdeteksi") ||
    /###\s+Soal\s+\d+/i.test(markdown) ||
    (markdown.includes("Kunci Jawaban") && /###\s+Soal/i.test(markdown));

  if (isExamSheet) {
    const examTree = parseExamMarkdownToMindMapTree(markdown, fallbackTitle);
    if (examTree.children.length > 0) {
      return examTree;
    }
  }

  const lines = markdown.split("\n");
  let rootTitle = fallbackTitle || "Peta Konsep Materi";
  const stages: MindMapStage[] = [];
  let currentStage: MindMapStage | null = null;
  let currentSub: MindMapSubModule | null = null;
  let inQuizOrWorkedExample = false;

  for (let rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Filter ketat: opsi soal A-E dan radio options DILARANG masuk mind map
    if (
      /^\s*[-*•]?\s*[A-Ea-e][.)]\s+/.test(line) ||
      /^\s*\d+\.\s*[A-Ea-e][.)]\s+/.test(line) ||
      /^\s*[-*•]?\s*\*\*([A-Ea-e])[.)]?\*\*/i.test(line) ||
      line.includes("✓ Kunci Jawaban") ||
      line.includes("✗ Pilihanmu")
    ) {
      continue;
    }

    // Detect Root Title (# )
    if (line.startsWith("# ") && !line.startsWith("## ") && !line.startsWith("### ")) {
      if (!rootTitle || rootTitle === "Peta Konsep Materi") {
        rootTitle = line.replace(/^#\s+/, "").replace(/[*_#]/g, "").trim();
      }
      continue;
    }

    // Detect Major Chapters / Stages (## )
    if (line.startsWith("## ")) {
      inQuizOrWorkedExample = false;
      const title = line.replace(/^##\s+/, "").replace(/[*_#]/g, "").trim();
      const stageNumber = stages.length + 1;
      const shortTitle = title.replace(/^Bab\s+\d+:\s*/i, "").trim();
      const color = PALETTE[(stageNumber - 1) % PALETTE.length];
      
      currentStage = {
        id: "stage_" + stageNumber,
        title,
        shortTitle,
        stageNumber,
        color,
        children: []
      };
      stages.push(currentStage);
      currentSub = null;
      continue;
    }

    // Detect Sub-topics (### )
    if (line.startsWith("### ")) {
      inQuizOrWorkedExample = false;
      const title = line.replace(/^###\s+/, "").replace(/[*_#]/g, "").trim();
      if (!currentStage) {
        currentStage = {
          id: "stage_1",
          title: "Bab 1: Fondasi Materi",
          shortTitle: "Fondasi Materi",
          stageNumber: 1,
          color: PALETTE[0],
          children: []
        };
        stages.push(currentStage);
      }
      const subIndex = currentStage.children.length + 1;
      currentSub = {
        id: `${currentStage.id}_s${subIndex}`,
        title,
        subNumber: `${currentStage.stageNumber}.${subIndex}`,
        children: []
      };
      currentStage.children.push(currentSub);
      continue;
    }

    // Detect quiz or worked example sections to ignore
    if (
      line.startsWith("####") &&
      (line.toLowerCase().includes("contoh soal") ||
        line.toLowerCase().includes("latihan soal") ||
        line.toLowerCase().includes("bedah langkah") ||
        line.toLowerCase().includes("pembahasan"))
    ) {
      inQuizOrWorkedExample = true;
      continue;
    }

    if (line.startsWith("**Soal:**") || line.startsWith("Soal:")) {
      inQuizOrWorkedExample = true;
      continue;
    }

    // Reset quiz flag when section changes
    if (inQuizOrWorkedExample) {
      if (line.startsWith("---") || line.startsWith("###") || line.startsWith("##")) {
        inQuizOrWorkedExample = false;
      } else {
        continue;
      }
    }

    // Skip ASCII art, tables, code blocks, dividers, pitfalls, and tips
    if (
      line.startsWith("|") ||
      line.startsWith("+--") ||
      line.startsWith("```") ||
      line.startsWith("> ⚠️") ||
      line.startsWith("> 💡") ||
      line === "---"
    ) {
      continue;
    }

    // Capture Definisi Baku as the description for the current sub-topic
    if (line.includes("**Definisi Baku:**") && currentSub && !currentSub.desc) {
      const defText = line
        .replace(/.*?\*\*Definisi Baku:\*\*\s*/, "")
        .replace(/[*_>]/g, "")
        .trim();
      currentSub.desc = defText.slice(0, 260);
      continue;
    }

    // In Practical Growth mode: capture section headers like #### Filter Realita, #### Actionable Playbook
    if (line.startsWith("#### ") && !inQuizOrWorkedExample) {
      const subHeader = line.replace(/^####\s+/, "").replace(/[*_#]/g, "").trim();
      if (currentSub && currentSub.children.length < 5) {
        const cIndex = currentSub.children.length + 1;
        currentSub.children.push({
          id: `concept_${Math.random().toString(36).slice(2, 8)}`,
          title: subHeader,
          conceptNumber: `${currentSub.subNumber}.${cIndex}`,
          desc: "Poin pembelajaran esensial dan filter realita dari topik ini."
        });
      }
      continue;
    }

    // Match structured concepts:
    // 1. **[Konsep]:** [Deskripsi]
    // - **[Konsep]:** [Deskripsi]
    // 1. **[Konsep]**: [Deskripsi]
    const itemMatch = line.match(/^(\d+\.|\-|\*)\s+\*\*([^*:]+)(?::)?\*\*(?::)?\s*(.+)$/);
    if (itemMatch) {
      const conceptName = itemMatch[2].replace(/[:*]/g, "").trim();
      const conceptDesc = itemMatch[3].replace(/[*_]/g, "").trim();

      const lower = conceptName.toLowerCase();
      // Exclude quiz options and question solving steps
      if (
        /^(opsi\s*)?[a-e][.)]?$/i.test(conceptName) ||
        lower.startsWith("langkah") ||
        lower.startsWith("jawaban benar") ||
        lower.startsWith("soal") ||
        lower.startsWith("opsi") ||
        lower.startsWith("definisi baku") ||
        lower.startsWith("peringatan")
      ) {
        continue;
      }

      if (currentSub) {
        const cIndex = currentSub.children.length + 1;
        const leaf: MindMapConcept = {
          id: "concept_" + Math.random().toString(36).slice(2, 8),
          title: conceptName,
          conceptNumber: `${currentSub.subNumber}.${cIndex}`,
          desc: conceptDesc.slice(0, 280)
        };
        if (currentSub.children.length < 6) {
          currentSub.children.push(leaf);
        }
      }
      continue;
    }
  }

  return {
    id: "root",
    title: rootTitle,
    color: { primary: "#18221f", light: "#f8faf6", border: "#34413c", text: "#ffffff" },
    children: stages
  };
}

interface InteractiveMindMapProps {
  markdown: string;
  title: string;
  onAskNara?: (questionText: string) => void;
  height?: number | string;
  docId?: string;
}

export function InteractiveMindMap({
  markdown,
  title,
  onAskNara,
  height = "640px",
  docId
}: InteractiveMindMapProps) {
  // View Mode: "flow" (structured sequential roadmap) or "mindmap" (spatial canvas)
  const [viewMode, setViewMode] = useState<"flow" | "mindmap">("flow");

  // Track completed stages locally for user gamification / progress
  const [completedStages, setCompletedStages] = useState<Record<string, boolean>>({});

  // Transform State for Mind Map Canvas (Pan & Zoom)
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Canonical Concept Graph tree from backend
  const [canonicalTree, setCanonicalTree] = useState<MindMapTree | null>(null);

  useEffect(() => {
    if (!docId) {
      setCanonicalTree(null);
      return;
    }
    let isCancelled = false;
    fetch(`/api/documents/${docId}/concept-graph`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isCancelled && data && data.tree && Array.isArray(data.tree.children) && data.tree.children.length > 0) {
          setCanonicalTree(data.tree);
        }
      })
      .catch(() => {
        // Fallback to markdown parsing gracefully
      });
    return () => {
      isCancelled = true;
    };
  }, [docId]);

  // Node collapse and inspection state in Mind Map
  const [collapsedNodes, setCollapsedNodes] = useState<Record<string, boolean>>({});
  const [selectedNode, setSelectedNode] = useState<{
    id: string;
    title: string;
    desc?: string;
    depth: number;
    color: MindMapColor;
    stageNumber?: number;
  } | null>(null);

  // Parse markdown into pedagogical tree as fallback or use canonical graph tree
  const tree = useMemo(() => {
    if (canonicalTree && canonicalTree.children && canonicalTree.children.length > 0) {
      return canonicalTree;
    }
    return parseMarkdownToMindMapTree(markdown, title);
  }, [canonicalTree, markdown, title]);

  // Total atomic concepts across all stages
  const totalConcepts = useMemo(() => {
    let count = 0;
    tree.children.forEach((st) => {
      st.children.forEach((sub) => {
        count += sub.children.length;
      });
    });
    return count;
  }, [tree]);

  // Toggle stage completion in Roadmap flow
  const toggleStageDone = useCallback((stageId: string) => {
    setCompletedStages((prev) => ({ ...prev, [stageId]: !prev[stageId] }));
  }, []);

  // Mind map collapse toggles
  const toggleCollapse = useCallback((id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCollapsedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const expandAll = useCallback(() => {
    setCollapsedNodes({});
  }, []);

  const collapseAll = useCallback(() => {
    const newCollapsed: Record<string, boolean> = {};
    tree.children.forEach((stage) => {
      stage.children.forEach((sub) => {
        newCollapsed[sub.id] = true;
      });
    });
    setCollapsedNodes(newCollapsed);
  }, [tree]);

  // Layout calculation for Mind Map Canvas
  const { nodes, connections } = useMemo(() => {
    const items: LayoutItem[] = [];
    const conns: Connection[] = [];

    const rootWidth = Math.min(260, Math.max(160, tree.title.length * 8.5 + 40));
    const rootItem: LayoutItem = {
      id: "root",
      title: tree.title,
      x: -rootWidth / 2,
      y: -24,
      width: rootWidth,
      height: 48,
      depth: 0,
      side: "root",
      color: tree.color || { primary: "#18221f", light: "#f8faf6", border: "#34413c", text: "#ffffff" },
      hasChildren: tree.children.length > 0,
      isCollapsed: false
    };
    items.push(rootItem);

    if (tree.children.length === 0) return { nodes: items, connections: conns };

    const leftBranches: MindMapStage[] = [];
    const rightBranches: MindMapStage[] = [];

    // Natural LTR Cognitive Flow:
    // If only 1 child: place on the right.
    // If <= 3 stages: place stage 1 on the left, advancing stages on the right.
    // If > 3 stages: distribute first half on the left, second half on the right.
    if (tree.children.length === 1) {
      rightBranches.push(tree.children[0]);
    } else if (tree.children.length <= 3) {
      leftBranches.push(tree.children[0]);
      rightBranches.push(...tree.children.slice(1));
    } else {
      const half = Math.ceil(tree.children.length / 2);
      tree.children.forEach((c, idx) => {
        if (idx < half) leftBranches.push(c);
        else rightBranches.push(c);
      });
    }

    const getStageHeight = (stage: MindMapStage): number => {
      if (collapsedNodes[stage.id] || stage.children.length === 0) return 60;
      let h = 0;
      stage.children.forEach((sub) => {
        if (collapsedNodes[sub.id] || sub.children.length === 0) h += 50;
        else h += 50 + sub.children.length * 36;
      });
      return Math.max(60, h);
    };

    const layoutSide = (branches: MindMapStage[], side: "left" | "right") => {
      const totalSideHeight = branches.reduce((acc, b) => acc + getStageHeight(b), 0);
      let currentY = -totalSideHeight / 2;

      branches.forEach((b) => {
        const bHeight = getStageHeight(b);
        const bCenterY = currentY + bHeight / 2;
        const bWidth = Math.min(260, Math.max(170, Math.min(b.title.length * 7.5 + 36, 250)));
        const bX = side === "right" ? 190 : -190 - bWidth;
        const bY = bCenterY - 24;

        items.push({
          id: b.id,
          title: b.title,
          desc: b.desc,
          stageNumber: b.stageNumber,
          x: bX,
          y: bY,
          width: bWidth,
          height: 48,
          depth: 1,
          side,
          color: b.color || PALETTE[0],
          hasChildren: b.children.length > 0,
          isCollapsed: !!collapsedNodes[b.id],
          parentId: "root",
          parentX: side === "right" ? rootWidth / 2 : -rootWidth / 2,
          parentY: 0
        });

        conns.push({
          id: `root->${b.id}`,
          fromX: side === "right" ? rootWidth / 2 : -rootWidth / 2,
          fromY: 0,
          toX: side === "right" ? bX : bX + bWidth,
          toY: bY + 24,
          color: "#4b6623",
          isMain: true
        });

        // Sub-modules
        if (!collapsedNodes[b.id] && b.children.length > 0) {
          let subY = bCenterY - bHeight / 2 + 10;

          b.children.forEach((sub) => {
            const subUnitHeight = 44 + (collapsedNodes[sub.id] ? 0 : sub.children.length * 34);
            const subCenterY = subY + subUnitHeight / 2;
            const subWidth = Math.min(220, Math.max(130, sub.title.length * 7 + 30));
            const subX = side === "right" ? bX + bWidth + 60 : bX - 60 - subWidth;
            const itemY = subCenterY - 18;

            items.push({
              id: sub.id,
              title: sub.title,
              desc: sub.desc,
              x: subX,
              y: itemY,
              width: subWidth,
              height: 38,
              depth: 2,
              side,
              color: b.color || PALETTE[0],
              hasChildren: sub.children.length > 0,
              isCollapsed: !!collapsedNodes[sub.id],
              parentId: b.id,
              parentX: side === "right" ? bX + bWidth : bX,
              parentY: bY + 22
            });

            conns.push({
              id: `${b.id}->${sub.id}`,
              fromX: side === "right" ? bX + bWidth : bX,
              fromY: bY + 24,
              toX: side === "right" ? subX : subX + subWidth,
              toY: itemY + 19,
              color: "#9ab88f",
              isMain: false
            });

            // Atomic concepts
            if (!collapsedNodes[sub.id] && sub.children.length > 0) {
              let leafY = subCenterY - (sub.children.length * 36) / 2;
              sub.children.forEach((leaf) => {
                const lWidth = Math.min(210, Math.max(120, leaf.title.length * 7 + 24));
                const lX = side === "right" ? subX + subWidth + 50 : subX - 50 - lWidth;
                const lItemY = leafY + 2;

                items.push({
                  id: leaf.id,
                  title: leaf.title,
                  desc: leaf.desc,
                  x: lX,
                  y: lItemY,
                  width: lWidth,
                  height: 32,
                  depth: 3,
                  side,
                  color: b.color || PALETTE[0],
                  hasChildren: false,
                  isCollapsed: false,
                  parentId: sub.id,
                  parentX: side === "right" ? subX + subWidth : subX,
                  parentY: itemY + 19
                });

                conns.push({
                  id: `${sub.id}->${leaf.id}`,
                  fromX: side === "right" ? subX + subWidth : subX,
                  fromY: itemY + 19,
                  toX: side === "right" ? lX : lX + lWidth,
                  toY: lItemY + 16,
                  color: "#9ab88f",
                  isMain: false
                });

                leafY += 36;
              });
            }

            subY += subUnitHeight;
          });
        }

        currentY += bHeight;
      });
    };

    layoutSide(rightBranches, "right");
    layoutSide(leftBranches, "left");

    return { nodes: items, connections: conns };
  }, [tree, collapsedNodes]);

  // Canvas container ref (ONLY for Mind Map mode)
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const panRef = useRef(pan);
  panRef.current = pan;
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const pinchStartRef = useRef<{ dist: number; zoom: number } | null>(null);

  // Auto-fit & Center Canvas Viewport
  const autoFitView = useCallback(() => {
    if (nodes.length === 0) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
      return;
    }

    const container = canvasContainerRef.current;
    const containerWidth = container?.clientWidth || (typeof window !== "undefined" ? window.innerWidth : 800);
    const containerHeight = container?.clientHeight || 600;

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    nodes.forEach((n) => {
      if (n.x < minX) minX = n.x;
      if (n.x + n.width > maxX) maxX = n.x + n.width;
      if (n.y < minY) minY = n.y;
      if (n.y + n.height > maxY) maxY = n.y + n.height;
    });

    const graphWidth = maxX - minX;
    const graphHeight = maxY - minY;
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const padX = containerWidth < 500 ? 16 : 48;
    const padY = containerWidth < 500 ? 16 : 48;
    const availW = Math.max(100, containerWidth - padX * 2);
    const availH = Math.max(100, containerHeight - padY * 2);

    const fitScale = Math.min(availW / Math.max(graphWidth, 1), availH / Math.max(graphHeight, 1));
    const minZoom = containerWidth < 500 ? 0.28 : 0.38;
    const targetZoom = Math.max(minZoom, Math.min(1.0, Number(fitScale.toFixed(2))));

    setZoom(targetZoom);
    setPan({
      x: Math.round(-centerX * targetZoom),
      y: Math.round(-centerY * targetZoom)
    });
  }, [nodes]);

  // Reset / Fit Canvas View
  const handleResetView = useCallback(() => {
    autoFitView();
  }, [autoFitView]);

  // Auto-fit on switching to or mounting "mindmap" mode
  useEffect(() => {
    if (viewMode === "mindmap") {
      const timer = setTimeout(() => {
        autoFitView();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [viewMode, autoFitView]);

  // Auto-fit on window resize
  useEffect(() => {
    if (viewMode !== "mindmap") return;
    const handleResize = () => autoFitView();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [viewMode, autoFitView]);

  // Attach touch pan/zoom ONLY when in "mindmap" mode
  useEffect(() => {
    if (viewMode !== "mindmap") return;
    const el = canvasContainerRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        touchStartRef.current = {
          x: e.touches[0].clientX - panRef.current.x,
          y: e.touches[0].clientY - panRef.current.y
        };
        pinchStartRef.current = null;
        setIsDragging(true);
      } else if (e.touches.length === 2) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        pinchStartRef.current = { dist, zoom: zoomRef.current };
        touchStartRef.current = null;
        setIsDragging(true);
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && touchStartRef.current) {
        e.preventDefault();
        setPan({
          x: e.touches[0].clientX - touchStartRef.current.x,
          y: e.touches[0].clientY - touchStartRef.current.y
        });
      } else if (e.touches.length === 2 && pinchStartRef.current) {
        e.preventDefault();
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const factor = dist / pinchStartRef.current.dist;
        setZoom(Math.min(2.5, Math.max(0.28, pinchStartRef.current.zoom * factor)));
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 0) {
        touchStartRef.current = null;
        pinchStartRef.current = null;
        setIsDragging(false);
      } else if (e.touches.length === 1) {
        touchStartRef.current = {
          x: e.touches[0].clientX - panRef.current.x,
          y: e.touches[0].clientY - panRef.current.y
        };
        pinchStartRef.current = null;
      }
    };

    el.addEventListener("touchstart", onTouchStart, { passive: false });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    el.addEventListener("touchcancel", onTouchEnd);

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [viewMode]);

  // Desktop Mouse Handlers for Mind Map
  const handleMouseDown = (e: React.MouseEvent) => {
    if (viewMode !== "mindmap") return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (viewMode !== "mindmap" || !isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    if (viewMode === "mindmap") setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (viewMode !== "mindmap") return;
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.08 : 0.92;
    setZoom((prev) => Math.min(2.2, Math.max(0.35, prev * factor)));
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        backgroundColor: "#ffffff",
        borderRadius: 12,
        border: "1px solid #e4e4e7",
        boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
        overflow: "hidden"
      }}
    >
      {/* 1. Header Toolbar (Editorial & Monospace) */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 16px",
          backgroundColor: "#fafafa",
          borderBottom: "1px solid #e4e4e7",
          gap: 12,
          flexWrap: "wrap"
        }}
      >
        {/* Left: View Mode Segmented Control */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              backgroundColor: "#f4f4f5",
              border: "1px solid #e4e4e7",
              borderRadius: 8,
              padding: 2,
              display: "flex",
              alignItems: "center",
              gap: 2
            }}
          >
            <button
              type="button"
              onClick={() => setViewMode("flow")}
              style={{
                padding: "5px 12px",
                borderRadius: 6,
                border: "none",
                backgroundColor: viewMode === "flow" ? "#18181b" : "transparent",
                color: viewMode === "flow" ? "#ffffff" : "#52525b",
                fontSize: 11.5,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                transition: "all 0.15s ease"
              }}
            >
              <Compass size={13} />
              <span>Alur Belajar (Roadmap)</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("mindmap")}
              style={{
                padding: "5px 12px",
                borderRadius: 6,
                border: "none",
                backgroundColor: viewMode === "mindmap" ? "#18181b" : "transparent",
                color: viewMode === "mindmap" ? "#ffffff" : "#52525b",
                fontSize: 11.5,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                transition: "all 0.15s ease"
              }}
            >
              <Layers size={13} />
              <span>Peta Konsep (Radial)</span>
            </button>
          </div>

          <span
            style={{
              fontSize: 10.5,
              fontFamily: "'DM Mono', monospace",
              fontWeight: 600,
              color: "#71717a",
              textTransform: "uppercase"
            }}
          >
            {tree.children.length} Tahap • {totalConcepts} Konsep Atomik
          </span>
        </div>

        {/* Right: Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {viewMode === "mindmap" ? (
            <>
              <button
                type="button"
                onClick={handleResetView}
                title="Posisikan ke tengah layar (Fit View)"
                style={{
                  background: "#ffffff",
                  border: "1px solid #e4e4e7",
                  padding: "4px 8px",
                  borderRadius: 6,
                  cursor: "pointer",
                  color: "#18181b",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 11,
                  fontWeight: 700
                }}
              >
                <RotateCcw size={11} />
                <span>Fit</span>
              </button>
              <button
                type="button"
                onClick={expandAll}
                style={{
                  background: "#ffffff",
                  border: "1px solid #e4e4e7",
                  padding: "4px 8px",
                  borderRadius: 6,
                  cursor: "pointer",
                  color: "#52525b",
                  fontSize: 11,
                  fontWeight: 700
                }}
              >
                Buka
              </button>
              <button
                type="button"
                onClick={collapseAll}
                style={{
                  background: "#ffffff",
                  border: "1px solid #e4e4e7",
                  padding: "4px 8px",
                  borderRadius: 6,
                  cursor: "pointer",
                  color: "#52525b",
                  fontSize: 11,
                  fontWeight: 700
                }}
              >
                Tutup
              </button>
            </>
          ) : (
            <span
              style={{
                fontSize: 10.5,
                fontFamily: "'DM Mono', monospace",
                fontWeight: 600,
                color: "#166534",
                backgroundColor: "#f0fdf4",
                border: "1px solid #bbf7d0",
                padding: "2px 8px",
                borderRadius: 4
              }}
            >
              Pedagogy Stepper Active
            </span>
          )}
        </div>
      </div>

      {/* 2. MODE A: ALUR BELAJAR BERURUTAN (REAL TIMELINE SPINE & MATURE HIERARCHY) */}
      {viewMode === "flow" && (
        <div
          style={{
            width: "100%",
            maxHeight: "820px",
            overflowY: "auto",
            WebkitOverflowScrolling: "touch",
            touchAction: "pan-y",
            padding: "24px 16px 48px",
            userSelect: "text",
            backgroundColor: "#ffffff"
          }}
        >
          <div style={{ maxWidth: 760, margin: "0 auto" }}>
            {/* Curriculum Header Scope */}
            <div
              style={{
                borderBottom: "1px solid #e4e4e7",
                paddingBottom: 20,
                marginBottom: 32
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 10.5,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "#71717a",
                  marginBottom: 6
                }}
              >
                <span>KURIKULUM KOGNITIF TANKA</span>
                <span>•</span>
                <span>URUTAN MATERI LINEAR</span>
              </div>
              <h2
                style={{
                  margin: "0 0 8px",
                  fontSize: 21,
                  fontWeight: 800,
                  color: "#09090b",
                  letterSpacing: "-0.02em"
                }}
              >
                {tree.title}
              </h2>
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  color: "#52525b",
                  lineHeight: 1.55
                }}
              >
                Alur belajar ini disusun berdasarkan prasyarat konseptual. Kuasai setiap tahap secara berurutan agar pemahaman materi tidak terfragmentasi.
              </p>
            </div>

            {/* Continuous Vertical Timeline Stepper */}
            <div style={{ position: "relative", paddingLeft: 46 }}>
              {/* Unbroken Vertical Timeline Spine running down the left */}
              <div
                style={{
                  position: "absolute",
                  top: 8,
                  bottom: 24,
                  left: 17,
                  width: 2,
                  backgroundColor: "#e4e4e7",
                  zIndex: 1
                }}
              />

              <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
                {tree.children.map((stage, sIdx) => {
                  const isDone = !!completedStages[stage.id];
                  const isLast = sIdx === tree.children.length - 1;

                  return (
                    <div key={stage.id} style={{ position: "relative" }}>
                      {/* 1. Milestone Node Anchor on the Vertical Spine */}
                      <div
                        onClick={() => toggleStageDone(stage.id)}
                        title={isDone ? "Tandai belum selesai" : "Tandai selesai"}
                        style={{
                          position: "absolute",
                          left: -46,
                          top: 0,
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          backgroundColor: isDone ? "#059669" : "#18181b",
                          color: "#ffffff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontFamily: "'DM Mono', monospace",
                          fontSize: 13,
                          fontWeight: 800,
                          boxShadow: "0 0 0 4px #ffffff, 0 2px 6px rgba(0,0,0,0.12)",
                          cursor: "pointer",
                          zIndex: 3,
                          transition: "all 0.15s ease"
                        }}
                      >
                        {isDone ? <Check size={16} strokeWidth={3} /> : `0${stage.stageNumber}`}
                      </div>

                      {/* 2. Stage Section Header (Open, Mature Editorial Typography - No nested card box!) */}
                      <div style={{ marginBottom: 16 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            flexWrap: "wrap",
                            gap: 8
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span
                              style={{
                                fontFamily: "'DM Mono', monospace",
                                fontSize: 10,
                                fontWeight: 800,
                                textTransform: "uppercase",
                                letterSpacing: "0.08em",
                                color: isDone ? "#059669" : "#71717a"
                              }}
                            >
                              TAHAP 0{stage.stageNumber} // {isDone ? "TUNTAS" : "FONDASI WAJIB"}
                            </span>
                            <span
                              style={{
                                fontSize: 10,
                                fontFamily: "'DM Mono', monospace",
                                color: "#a1a1aa",
                                fontWeight: 600
                              }}
                            >
                              • {stage.children.length} Sub-Modul
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => toggleStageDone(stage.id)}
                            style={{
                              backgroundColor: isDone ? "#dcfce7" : "#ffffff",
                              color: isDone ? "#166534" : "#52525b",
                              border: `1px solid ${isDone ? "#86efac" : "#e4e4e7"}`,
                              borderRadius: 5,
                              padding: "3px 9px",
                              fontSize: 10.5,
                              fontWeight: 700,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: 4
                            }}
                          >
                            {isDone ? <Check size={11} strokeWidth={3} /> : null}
                            <span>{isDone ? "Selesai" : "Tandai Selesai"}</span>
                          </button>
                        </div>

                        <h3
                          style={{
                            margin: "4px 0 0",
                            fontSize: 17,
                            fontWeight: 800,
                            color: "#09090b",
                            letterSpacing: "-0.015em"
                          }}
                        >
                          {stage.shortTitle || stage.title}
                        </h3>
                      </div>

                      {/* 3. Sub-modules with Step Branch Dots on the Spine */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                        {stage.children.map((sub, subIdx) => (
                          <div
                            key={sub.id}
                            style={{
                              position: "relative",
                              borderLeft: "2px solid #e4e4e7",
                              paddingLeft: 16,
                              marginLeft: -10
                            }}
                          >
                            {/* Branch Tick Node connecting left spine */}
                            <div
                              style={{
                                position: "absolute",
                                left: -6,
                                top: 8,
                                width: 10,
                                height: 10,
                                borderRadius: "50%",
                                backgroundColor: "#ffffff",
                                border: "2px solid #71717a"
                              }}
                            />

                            {/* Sub-module Title Bar */}
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: 8,
                                marginBottom: 6
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "baseline", gap: 8, minWidth: 0 }}>
                                <span
                                  style={{
                                    fontFamily: "'DM Mono', monospace",
                                    fontSize: 10.5,
                                    fontWeight: 800,
                                    color: "#09090b"
                                  }}
                                >
                                  {sub.subNumber}
                                </span>
                                <h4
                                  style={{
                                    margin: 0,
                                    fontSize: 14,
                                    fontWeight: 700,
                                    color: "#18181b"
                                  }}
                                >
                                  {sub.title}
                                </h4>
                              </div>

                              {onAskNara && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    onAskNara(
                                      `Bimbing saya memahami modul "${sub.title}" pada ${stage.title}. Berikan analogi konkret dan contoh aplikasinya.`
                                    )
                                  }
                                  style={{
                                    background: "none",
                                    border: "none",
                                    color: "#059669",
                                    fontSize: 11,
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 3,
                                    padding: 0,
                                    flexShrink: 0
                                  }}
                                >
                                  <span>Tanya Nara</span>
                                  <Sparkles size={11} />
                                </button>
                              )}
                            </div>

                            {/* Definisi Baku / Intisari Callout */}
                            {sub.desc && (
                              <div
                                style={{
                                  borderLeft: "2px solid #18181b",
                                  backgroundColor: "#fafafa",
                                  padding: "8px 12px",
                                  marginBottom: 10,
                                  fontSize: 12,
                                  lineHeight: 1.5,
                                  color: "#3f3f46"
                                }}
                              >
                                <strong style={{ color: "#09090b", fontWeight: 700 }}>
                                  Definisi Baku:{" "}
                                </strong>
                                <span>{sub.desc}</span>
                              </div>
                            )}

                            {/* Concept Matrix / Knowledge Ledger (Structured Rows - No Generic Pill Clutter!) */}
                            {sub.children.length > 0 && (
                              <div
                                style={{
                                  border: "1px solid #f0f0f2",
                                  borderRadius: 6,
                                  overflow: "hidden",
                                  backgroundColor: "#ffffff"
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    padding: "4px 10px",
                                    backgroundColor: "#f9fafb",
                                    borderBottom: "1px solid #f0f0f2",
                                    fontFamily: "'DM Mono', monospace",
                                    fontSize: 9.5,
                                    fontWeight: 800,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.06em",
                                    color: "#71717a"
                                  }}
                                >
                                  <span>Konsep Kunci ({sub.children.length})</span>
                                  <span>Aksi</span>
                                </div>

                                {sub.children.map((concept, cIdx) => (
                                  <div
                                    key={concept.id}
                                    style={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      alignItems: "flex-start",
                                      padding: "8px 10px",
                                      borderBottom:
                                        cIdx === sub.children.length - 1 ? "none" : "1px solid #f4f4f5",
                                      gap: 12
                                    }}
                                  >
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                                        <span
                                          style={{
                                            fontFamily: "'DM Mono', monospace",
                                            fontSize: 9.5,
                                            fontWeight: 800,
                                            color: "#71717a"
                                          }}
                                        >
                                          {concept.conceptNumber}
                                        </span>
                                        <span
                                          style={{
                                            fontSize: 12.5,
                                            fontWeight: 700,
                                            color: "#18181b"
                                          }}
                                        >
                                          {concept.title}
                                        </span>
                                      </div>
                                      {concept.desc && (
                                        <p
                                          style={{
                                            margin: "3px 0 0 20px",
                                            fontSize: 11.5,
                                            color: "#52525b",
                                            lineHeight: 1.45
                                          }}
                                        >
                                          {concept.desc}
                                        </p>
                                      )}
                                    </div>

                                    {onAskNara && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          onAskNara(
                                            `Jelaskan konsep "${concept.title}" dalam materi "${sub.title}" (${stage.title}) beserta kemungkinan jebakan soalnya.`
                                          )
                                        }
                                        title="Diskusi konsep ini dengan Nara"
                                        style={{
                                          background: "#ffffff",
                                          border: "1px solid #e4e4e7",
                                          borderRadius: 4,
                                          padding: "3px 7px",
                                          fontSize: 10,
                                          fontWeight: 700,
                                          color: "#3f3f46",
                                          cursor: "pointer",
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 3,
                                          flexShrink: 0
                                        }}
                                      >
                                        <span>Tanya</span>
                                        <ChevronRight size={10} />
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* 4. Prerequisite Progression Connector between Stages */}
                      {!isLast && (
                        <div
                          style={{
                            marginTop: 20,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            fontFamily: "'DM Mono', monospace",
                            fontSize: 10,
                            fontWeight: 700,
                            color: "#71717a",
                            backgroundColor: "#f4f4f5",
                            padding: "3px 8px",
                            borderRadius: 4
                          }}
                        >
                          <ArrowDown size={11} />
                          <span>Prasyarat selesai • Lanjut ke Tahap 0{stage.stageNumber + 1}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Final Mastery Checkpoint */}
            <div
              style={{
                marginTop: 40,
                padding: "16px 20px",
                backgroundColor: "#18181b",
                color: "#ffffff",
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 12
              }}
            >
              <div>
                <span
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 10,
                    fontWeight: 800,
                    color: "#a1a1aa",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em"
                  }}
                >
                  AKHIR ALUR KURIKULUM
                </span>
                <h4 style={{ margin: "2px 0 0", fontSize: 14, fontWeight: 700 }}>
                  Semua {tree.children.length} Tahap Telah Dipetakan Utuh
                </h4>
              </div>

              {onAskNara && (
                <button
                  type="button"
                  onClick={() =>
                    onAskNara(
                      `Buat 3 soal studi kasus integratif yang menggabungkan konsep dari Tahap 01 sampai Tahap 0${tree.children.length} pada materi "${tree.title}".`
                    )
                  }
                  style={{
                    backgroundColor: "#ffffff",
                    color: "#18181b",
                    border: "none",
                    borderRadius: 6,
                    padding: "8px 14px",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6
                  }}
                >
                  <Sparkles size={13} />
                  <span>Uji Latihan Kasus Integratif</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. MODE B: PETA KONSEP CANVAS SPATIAL (MIND MAP RADIAL) */}
      {viewMode === "mindmap" && (
        <div
          ref={canvasContainerRef}
          style={{
            position: "relative",
            width: "100%",
            height,
            backgroundColor: "#fafafa",
            backgroundImage: "radial-gradient(#d4d4d8 1px, transparent 1px)",
            backgroundSize: "24px 24px",
            overflow: "hidden",
            userSelect: "none",
            touchAction: "none",
            cursor: isDragging ? "grabbing" : "grab"
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          {/* Canvas Element with Pan & Zoom */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "center center",
              transition: isDragging ? "none" : "transform 0.1s ease-out"
            }}
          >
            {/* SVG Bezier Lines */}
            <svg
              style={{
                position: "absolute",
                top: -2000,
                left: -2000,
                width: 4000,
                height: 4000,
                pointerEvents: "none",
                overflow: "visible"
              }}
            >
              {connections.map((c) => {
                const offsetX = 2000;
                const offsetY = 2000;
                const x1 = c.fromX + offsetX;
                const y1 = c.fromY + offsetY;
                const x2 = c.toX + offsetX;
                const y2 = c.toY + offsetY;
                const dx = Math.max(36, Math.abs(x2 - x1) * 0.52);
                const cpx1 = x1 + (x2 > x1 ? dx : -dx);
                const cpx2 = x2 - (x2 > x1 ? dx : -dx);

                const isConnected = selectedNode?.id
                  ? c.id.includes(selectedNode.id) || selectedNode.id === c.id
                  : false;
                const isMain = c.isMain ?? c.id.startsWith("root->");

                const strokeColor = isConnected
                  ? "#283918"
                  : isMain
                  ? "#4b6623"
                  : "#9ab88f";

                const strokeWidth = isConnected
                  ? "2.5"
                  : isMain
                  ? "2"
                  : "1.5";

                const strokeOpacity = selectedNode
                  ? isConnected
                    ? 0.95
                    : 0.35
                  : isMain
                  ? 0.85
                  : 0.75;

                return (
                  <path
                    key={c.id}
                    d={`M ${x1} ${y1} C ${cpx1} ${y1}, ${cpx2} ${y2}, ${x2} ${y2}`}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeOpacity={strokeOpacity}
                    strokeLinecap="round"
                  />
                );
              })}
            </svg>

            {/* Spatial Interactive Node Cards */}
            {nodes.map((node) => {
              const isSelected = selectedNode?.id === node.id;
              const isRoot = node.depth === 0;

              return (
                <div
                  key={node.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedNode({
                      id: node.id,
                      title: node.title,
                      desc: node.desc,
                      depth: node.depth,
                      color: node.color,
                      stageNumber: node.stageNumber
                    });
                  }}
                  style={{
                    position: "absolute",
                    left: node.x,
                    top: node.y,
                    width: node.width,
                    minHeight: node.height,
                    backgroundColor: isRoot ? "#18181b" : "#ffffff",
                    border: `1.5px solid ${
                      isRoot ? "#27272a" : isSelected ? "#18181b" : "#e4e4e7"
                    }`,
                    borderRadius: isRoot ? 10 : 6,
                    boxShadow: isSelected
                      ? "0 0 0 3px rgba(24, 24, 27, 0.15), 0 4px 14px rgba(0,0,0,0.06)"
                      : isRoot
                      ? "0 6px 20px rgba(0,0,0,0.15)"
                      : "0 1px 3px rgba(0,0,0,0.02)",
                    padding: isRoot ? "10px 16px" : node.depth === 1 ? "8px 12px" : "5px 9px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 6,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    zIndex: isRoot ? 5 : isSelected ? 8 : 4
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0, flex: 1 }}>
                    {node.depth === 1 && node.stageNumber && (
                      <span
                        style={{
                          fontFamily: "'DM Mono', monospace",
                          fontSize: 9.5,
                          fontWeight: 800,
                          backgroundColor: "#18181b",
                          color: "#ffffff",
                          width: 18,
                          height: 18,
                          borderRadius: 4,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0
                        }}
                      >
                        {node.stageNumber}
                      </span>
                    )}

                    <span
                      style={{
                        fontSize: isRoot ? 13 : node.depth === 1 ? 11.5 : 10.5,
                        fontWeight: isRoot || node.depth === 1 ? 700 : 600,
                        color: isRoot ? "#ffffff" : "#18181b",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: isRoot ? "nowrap" : "normal",
                        wordBreak: "break-word",
                        lineHeight: 1.35,
                        maxWidth: 240,
                        width: node.depth === 1 ? "100%" : undefined,
                        display: "-webkit-box",
                        WebkitLineClamp: isRoot ? 1 : 2,
                        WebkitBoxOrient: "vertical",
                        textAlign: "left"
                      }}
                    >
                      {node.title}
                    </span>
                  </div>

                  {node.hasChildren && (
                    <button
                      type="button"
                      onClick={(e) => toggleCollapse(node.id, e)}
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 3,
                        border: "none",
                        backgroundColor: isRoot ? "#3f3f46" : "#f4f4f5",
                        color: isRoot ? "#ffffff" : "#71717a",
                        fontSize: 10,
                        fontWeight: 900,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        padding: 0
                      }}
                    >
                      {node.isCollapsed ? "+" : "−"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Touch Gesture Help Hint */}
          <div
            style={{
              position: "absolute",
              bottom: 12,
              left: 12,
              fontSize: 10,
              fontFamily: "'DM Mono', monospace",
              color: "#71717a",
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              border: "1px solid #e4e4e7",
              padding: "4px 8px",
              borderRadius: 6,
              pointerEvents: "none",
              zIndex: 10
            }}
          >
            PAN: DRAG CANVAS • ZOOM: SCROLL / PINCH
          </div>

          {/* Zoom Controls */}
          <div
            style={{
              position: "absolute",
              bottom: 12,
              right: 12,
              backgroundColor: "#ffffff",
              border: "1px solid #e4e4e7",
              borderRadius: 8,
              padding: "3px 6px",
              display: "flex",
              alignItems: "center",
              gap: 4,
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              zIndex: 10
            }}
          >
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.28, z * 0.85))}
              title="Perkecil (Zoom Out)"
              style={{
                background: "none",
                border: "none",
                padding: "5px 7px",
                borderRadius: 4,
                cursor: "pointer",
                color: "#52525b",
                display: "flex",
                alignItems: "center"
              }}
            >
              <ZoomOut size={13} />
            </button>
            <span
              style={{
                fontSize: 10,
                fontFamily: "'DM Mono', monospace",
                fontWeight: 700,
                color: "#18181b",
                minWidth: 32,
                textAlign: "center"
              }}
            >
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(2.2, z * 1.15))}
              title="Perbesar (Zoom In)"
              style={{
                background: "none",
                border: "none",
                padding: "5px 7px",
                borderRadius: 4,
                cursor: "pointer",
                color: "#52525b",
                display: "flex",
                alignItems: "center"
              }}
            >
              <ZoomIn size={13} />
            </button>
          </div>
        </div>
      )}

      {/* 4. Detail Inspector Drawer on Node Selection */}
      {selectedNode && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "absolute",
            bottom: 16,
            right: 16,
            maxWidth: 360,
            width: "calc(100% - 32px)",
            backgroundColor: "#ffffff",
            border: "1px solid #e4e4e7",
            borderRadius: 10,
            boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
            padding: "16px",
            animation: "fadeIn 0.2s ease-out",
            zIndex: 100
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
            <span
              style={{
                fontSize: 9.5,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "#52525b",
                backgroundColor: "#f4f4f5",
                border: "1px solid #e4e4e7",
                padding: "2px 8px",
                borderRadius: 4,
                fontFamily: "'DM Mono', monospace"
              }}
            >
              {selectedNode.depth === 0
                ? "Topik Utama"
                : selectedNode.depth === 1
                ? `Tahap 0${selectedNode.stageNumber || 1} • Bab`
                : selectedNode.depth === 2
                ? "Sub-Modul Materi"
                : "Konsep Atomik"}
            </span>
            <button
              type="button"
              onClick={() => setSelectedNode(null)}
              style={{
                background: "none",
                border: "none",
                color: "#a1a1aa",
                cursor: "pointer",
                padding: 2
              }}
            >
              <X size={15} />
            </button>
          </div>

          <h4 style={{ fontSize: 14.5, fontWeight: 800, color: "#09090b", margin: "0 0 6px" }}>
            {selectedNode.title}
          </h4>

          <p style={{ fontSize: 12, color: "#52525b", lineHeight: 1.5, margin: "0 0 12px" }}>
            {selectedNode.desc || "Konsep ini merupakan salah satu cabang penting dari alur belajar materi ini."}
          </p>

          {onAskNara && (
            <button
              type="button"
              onClick={() => {
                onAskNara(`Jelaskan konsep "${selectedNode.title}" beserta contoh aplikasinya dalam ujian.`);
                setSelectedNode(null);
              }}
              style={{
                width: "100%",
                padding: "8px 12px",
                backgroundColor: "#18181b",
                color: "#ffffff",
                border: "none",
                borderRadius: 6,
                fontSize: 11.5,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6
              }}
            >
              <Sparkles size={12} />
              <span>Tanya Nara tentang konsep ini</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
