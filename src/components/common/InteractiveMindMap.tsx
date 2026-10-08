import React, { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { 
  ZoomIn, ZoomOut, RotateCcw, Layers, X, Sparkles, 
  Compass, ArrowDown, ChevronRight, CheckCircle2, BookOpen
} from "lucide-react";

export interface MindMapColor {
  primary: string;
  light: string;
  border: string;
  text: string;
}

export interface MindMapNode {
  id: string;
  title: string;
  desc?: string;
  color?: MindMapColor;
  children?: MindMapNode[];
  stageNumber?: number;
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
}

const PALETTE: MindMapColor[] = [
  { primary: "#10b981", light: "#ecfdf5", border: "#a7f3d0", text: "#065f46" },
  { primary: "#3b82f6", light: "#eff6ff", border: "#bfdbfe", text: "#1e40af" },
  { primary: "#8b5cf6", light: "#f5f3ff", border: "#ddd6fe", text: "#5b21b6" },
  { primary: "#f59e0b", light: "#fffbeb", border: "#fde68a", text: "#92400e" },
  { primary: "#ec4899", light: "#fdf2f8", border: "#fbcfe8", text: "#9d174d" },
  { primary: "#14b8a6", light: "#f0fdfa", border: "#99f6e4", text: "#115e59" },
  { primary: "#6366f1", light: "#eef2ff", border: "#c7d2fe", text: "#3730a3" },
  { primary: "#0ea5e9", light: "#f0f9ff", border: "#bae6fd", text: "#0369a1" },
  { primary: "#eab308", light: "#fefce8", border: "#fef08a", text: "#854d0e" },
];

/**
 * Robust & Pedagogy-Aware Markdown to Mind Map Parser
 * Excludes quiz questions, worked examples, steps, and options.
 * Organizes by: Root -> Chapters (Stages) -> Sub-topics -> Core Concepts with Definitions.
 */
export function parseMarkdownToMindMapTree(markdown: string, fallbackTitle: string): MindMapNode {
  if (!markdown || !markdown.trim()) {
    return { id: "root", title: fallbackTitle || "Peta Konsep", children: [] };
  }

  const lines = markdown.split("\n");
  let rootTitle = fallbackTitle || "Peta Konsep Materi";
  const branches: MindMapNode[] = [];
  let currentBranch: MindMapNode | null = null;
  let currentSub: MindMapNode | null = null;
  let inQuizOrWorkedExample = false;

  for (let rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

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
      const stageNumber = branches.length + 1;
      const color = PALETTE[branches.length % PALETTE.length];
      currentBranch = {
        id: "b_" + branches.length,
        title,
        color,
        stageNumber,
        children: []
      };
      branches.push(currentBranch);
      currentSub = null;
      continue;
    }

    // Detect Sub-topics (### )
    if (line.startsWith("### ")) {
      inQuizOrWorkedExample = false;
      const title = line.replace(/^###\s+/, "").replace(/[*_#]/g, "").trim();
      if (!currentBranch) {
        currentBranch = {
          id: "b_0",
          title: "Fondasi Materi",
          color: PALETTE[0],
          stageNumber: 1,
          children: []
        };
        branches.push(currentBranch);
      }
      currentSub = {
        id: `${currentBranch.id}_s${currentBranch.children?.length || 0}`,
        title,
        color: currentBranch.color,
        children: []
      };
      currentBranch.children = currentBranch.children || [];
      currentBranch.children.push(currentSub);
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
      currentSub.desc = defText.slice(0, 200);
      continue;
    }

    // In Practical Growth mode: capture section headers like #### Filter Realita, #### Actionable Playbook
    if (line.startsWith("#### ") && !inQuizOrWorkedExample) {
      const subHeader = line.replace(/^####\s+/, "").replace(/[*_#]/g, "").trim();
      if (currentSub && (currentSub.children?.length || 0) < 5) {
        currentSub.children = currentSub.children || [];
        currentSub.children.push({
          id: `leaf_${Math.random().toString(36).slice(2, 8)}`,
          title: subHeader,
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
        lower.startsWith("langkah") ||
        lower.startsWith("jawaban benar") ||
        lower.startsWith("soal") ||
        lower.startsWith("opsi") ||
        lower.startsWith("definisi baku") ||
        lower.startsWith("peringatan")
      ) {
        continue;
      }

      const leaf: MindMapNode = {
        id: "leaf_" + Math.random().toString(36).slice(2, 8),
        title: conceptName,
        desc: conceptDesc.slice(0, 220)
      };

      if (currentSub) {
        if ((currentSub.children?.length || 0) < 6) {
          currentSub.children = currentSub.children || [];
          currentSub.children.push(leaf);
        }
      } else if (currentBranch) {
        if ((currentBranch.children?.length || 0) < 6) {
          currentBranch.children = currentBranch.children || [];
          currentBranch.children.push(leaf);
        }
      }
      continue;
    }
  }

  return {
    id: "root",
    title: rootTitle,
    color: { primary: "#18221f", light: "#f8faf6", border: "#34413c", text: "#ffffff" },
    children: branches.length > 0 ? branches : [
      { id: "b_0", title: "Ringkasan Konsep", color: PALETTE[0], stageNumber: 1, children: [] },
      { id: "b_1", title: "Poin-Poin Utama", color: PALETTE[1], stageNumber: 2, children: [] }
    ]
  };
}

interface InteractiveMindMapProps {
  markdown: string;
  title: string;
  onAskNara?: (questionText: string) => void;
  height?: number | string;
}

export function InteractiveMindMap({
  markdown,
  title,
  onAskNara,
  height = "640px"
}: InteractiveMindMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // View Mode: "mindmap" (radial/two-sided) or "flow" (step-by-step roadmap sequence)
  const [viewMode, setViewMode] = useState<"mindmap" | "flow">("mindmap");

  // Transform State (Pan & Zoom)
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Node collapse and inspection state
  const [collapsedNodes, setCollapsedNodes] = useState<Record<string, boolean>>({});
  const [selectedNode, setSelectedNode] = useState<{
    id: string;
    title: string;
    desc?: string;
    depth: number;
    color: MindMapColor;
    stageNumber?: number;
  } | null>(null);

  // Parse markdown into pedagogical tree
  const tree = useMemo(() => parseMarkdownToMindMapTree(markdown, title), [markdown, title]);

  // Toggle Collapse
  const toggleCollapse = useCallback((id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCollapsedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const expandAll = useCallback(() => {
    setCollapsedNodes({});
  }, []);

  const collapseAll = useCallback(() => {
    const newCollapsed: Record<string, boolean> = {};
    if (tree.children) {
      tree.children.forEach((branch) => {
        if (branch.children && branch.children.length > 0) {
          branch.children.forEach((sub) => {
            newCollapsed[sub.id] = true;
          });
        }
      });
    }
    setCollapsedNodes(newCollapsed);
  }, [tree]);

  // Calculate layout for Two-Sided Mind Map Canvas
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
      hasChildren: (tree.children?.length || 0) > 0,
      isCollapsed: false
    };
    items.push(rootItem);

    const children = tree.children || [];
    if (children.length === 0) return { nodes: items, connections: conns };

    const rightBranches: MindMapNode[] = [];
    const leftBranches: MindMapNode[] = [];
    children.forEach((c, idx) => {
      if (idx % 2 === 0) rightBranches.push(c);
      else leftBranches.push(c);
    });

    const getSubtreeHeight = (node: MindMapNode): number => {
      if (collapsedNodes[node.id] || !node.children || node.children.length === 0) {
        return 56;
      }
      return node.children.reduce((acc, child) => acc + getSubtreeHeight(child), 0);
    };

    const layoutSide = (branches: MindMapNode[], side: "left" | "right") => {
      const totalSideHeight = branches.reduce((acc, b) => acc + getSubtreeHeight(b), 0);
      let currentY = -totalSideHeight / 2;

      branches.forEach((b) => {
        const bHeight = getSubtreeHeight(b);
        const bCenterY = currentY + bHeight / 2;
        const bWidth = Math.min(230, Math.max(140, b.title.length * 8 + 36));
        const bX = side === "right" ? 180 : -180 - bWidth;
        const bY = bCenterY - 22;

        const branchItem: LayoutItem = {
          id: b.id,
          title: b.title,
          desc: b.desc,
          stageNumber: b.stageNumber,
          x: bX,
          y: bY,
          width: bWidth,
          height: 44,
          depth: 1,
          side,
          color: b.color || PALETTE[0],
          hasChildren: (b.children?.length || 0) > 0,
          isCollapsed: !!collapsedNodes[b.id],
          parentId: "root",
          parentX: side === "right" ? rootWidth / 2 : -rootWidth / 2,
          parentY: 0
        };
        items.push(branchItem);

        conns.push({
          id: `root->${b.id}`,
          fromX: side === "right" ? rootWidth / 2 : -rootWidth / 2,
          fromY: 0,
          toX: side === "right" ? bX : bX + bWidth,
          toY: bY + 22,
          color: b.color?.primary || "#10b981"
        });

        // Sub-topics
        if (!collapsedNodes[b.id] && b.children && b.children.length > 0) {
          const subHeight = b.children.reduce((acc, sub) => acc + getSubtreeHeight(sub), 0);
          let subY = bCenterY - subHeight / 2;

          b.children.forEach((sub) => {
            const leafHeight = getSubtreeHeight(sub);
            const subCenterY = subY + leafHeight / 2;
            const subWidth = Math.min(210, Math.max(120, sub.title.length * 7.5 + 30));
            const subX = side === "right" ? bX + bWidth + 60 : bX - 60 - subWidth;
            const itemY = subCenterY - 18;

            const subItem: LayoutItem = {
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
              hasChildren: (sub.children?.length || 0) > 0,
              isCollapsed: !!collapsedNodes[sub.id],
              parentId: b.id,
              parentX: side === "right" ? bX + bWidth : bX,
              parentY: bY + 22
            };
            items.push(subItem);

            conns.push({
              id: `${b.id}->${sub.id}`,
              fromX: side === "right" ? bX + bWidth : bX,
              fromY: bY + 22,
              toX: side === "right" ? subX : subX + subWidth,
              toY: itemY + 19,
              color: b.color?.primary || "#10b981"
            });

            // Core concept leaves
            if (!collapsedNodes[sub.id] && sub.children && sub.children.length > 0) {
              let leafY = subCenterY - (sub.children.length * 36) / 2;
              sub.children.forEach((leaf) => {
                const lWidth = Math.min(190, Math.max(100, leaf.title.length * 7 + 24));
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
                  color: b.color?.primary || "#10b981"
                });

                leafY += 36;
              });
            }

            subY += leafHeight;
          });
        }

        currentY += bHeight;
      });
    };

    layoutSide(rightBranches, "right");
    layoutSide(leftBranches, "left");

    return { nodes: items, connections: conns };
  }, [tree, collapsedNodes]);

  // Reset Canvas View
  const handleResetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // Touch & Pinch gestures for mobile
  const panRef = useRef(pan);
  panRef.current = pan;
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const pinchStartRef = useRef<{ dist: number; zoom: number } | null>(null);

  useEffect(() => {
    const el = containerRef.current;
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
        setIsDragging(false);
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
  }, []);

  // Desktop Mouse Pan interaction handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.08 : 0.92;
    setZoom((prev) => Math.min(2.2, Math.max(0.35, prev * factor)));
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        height,
        backgroundColor: "#f8faf6",
        backgroundImage: "radial-gradient(#dce3d8 1px, transparent 1px)",
        backgroundSize: "24px 24px",
        borderRadius: 14,
        border: "1px solid #dce2da",
        overflow: "hidden",
        userSelect: "none"
      }}
    >
      {/* Top Bar: Mode Switch & Controls */}
      <div
        style={{
          position: "absolute",
          top: 12,
          left: 12,
          right: 12,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
          zIndex: 20,
          pointerEvents: "none"
        }}
      >
        {/* Left: View Mode Toggle Segmented Control */}
        <div
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.94)",
            backdropFilter: "blur(6px)",
            border: "1px solid #dce2da",
            borderRadius: 10,
            padding: "3px",
            display: "flex",
            alignItems: "center",
            gap: 2,
            boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
            pointerEvents: "auto"
          }}
        >
          <button
            onClick={() => setViewMode("mindmap")}
            style={{
              padding: "5px 10px",
              borderRadius: 7,
              border: "none",
              backgroundColor: viewMode === "mindmap" ? "#18221f" : "transparent",
              color: viewMode === "mindmap" ? "#c8f064" : "#45544e",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 5,
              transition: "all 0.15s ease"
            }}
          >
            <Layers size={13} />
            <span>Peta Konsep</span>
          </button>

          <button
            onClick={() => setViewMode("flow")}
            style={{
              padding: "5px 10px",
              borderRadius: 7,
              border: "none",
              backgroundColor: viewMode === "flow" ? "#18221f" : "transparent",
              color: viewMode === "flow" ? "#c8f064" : "#45544e",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 5,
              transition: "all 0.15s ease"
            }}
          >
            <Compass size={13} />
            <span>Alur Belajar</span>
          </button>
        </div>

        {/* Right: Controls based on active mode */}
        <div
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.94)",
            backdropFilter: "blur(6px)",
            border: "1px solid #dce2da",
            borderRadius: 10,
            padding: "3px 6px",
            display: "flex",
            alignItems: "center",
            gap: 4,
            boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
            pointerEvents: "auto"
          }}
        >
          {viewMode === "mindmap" ? (
            <>
              <button
                onClick={handleResetView}
                title="Posisikan ke tengah layar (Fit View)"
                style={{
                  background: "none",
                  border: "none",
                  padding: "5px 8px",
                  borderRadius: 6,
                  cursor: "pointer",
                  color: "#283912",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 11,
                  fontWeight: 700
                }}
              >
                <RotateCcw size={12} />
                <span>Fit</span>
              </button>
              <div style={{ width: 1, height: 14, backgroundColor: "#dce2da" }} />
              <button
                onClick={expandAll}
                title="Buka Semua Cabang"
                style={{
                  background: "none",
                  border: "none",
                  padding: "5px 8px",
                  borderRadius: 6,
                  cursor: "pointer",
                  color: "#45544e",
                  fontSize: 11,
                  fontWeight: 700
                }}
              >
                Buka
              </button>
              <button
                onClick={collapseAll}
                title="Tutup Cabang Luar"
                style={{
                  background: "none",
                  border: "none",
                  padding: "5px 8px",
                  borderRadius: 6,
                  cursor: "pointer",
                  color: "#45544e",
                  fontSize: 11,
                  fontWeight: 700
                }}
              >
                Tutup
              </button>
            </>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "2px 6px", fontSize: 11, fontWeight: 700, color: "#2d3c34" }}>
              <BookOpen size={13} color="#10b981" />
              <span>{tree.children?.length || 0} Tahap Materi</span>
            </div>
          )}
        </div>
      </div>

      {/* VIEW 1: RADIAL / TWO-SIDED MIND MAP */}
      {viewMode === "mindmap" ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            cursor: isDragging ? "grabbing" : "grab",
            touchAction: "none"
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          {/* Mind Map Canvas (SVG + HTML Nodes) */}
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
            {/* SVG Bezier Connection Lines */}
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
                const dx = Math.abs(x2 - x1) * 0.55;
                const cpx1 = x1 + (x2 > x1 ? dx : -dx);
                const cpx2 = x2 - (x2 > x1 ? dx : -dx);

                return (
                  <path
                    key={c.id}
                    d={`M ${x1} ${y1} C ${cpx1} ${y1}, ${cpx2} ${y2}, ${x2} ${y2}`}
                    fill="none"
                    stroke={c.color}
                    strokeWidth={
                      selectedNode?.id && (c.id.includes(selectedNode.id) || selectedNode.id === c.id)
                        ? "2.5"
                        : "1.8"
                    }
                    strokeOpacity={selectedNode ? (c.id.includes(selectedNode.id) ? 0.95 : 0.45) : 0.75}
                  />
                );
              })}
            </svg>

            {/* HTML Interactive Node Cards */}
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
                    backgroundColor: isRoot ? "#18221f" : node.color.light,
                    border: `1.5px solid ${
                      isRoot ? "#34413c" : isSelected ? node.color.primary : node.color.border
                    }`,
                    borderRadius: isRoot ? 14 : node.depth === 1 ? 10 : 8,
                    boxShadow: isSelected
                      ? `0 0 0 3px ${node.color.primary}33, 0 6px 20px rgba(0,0,0,0.08)`
                      : isRoot
                      ? "0 8px 24px rgba(24, 34, 31, 0.25)"
                      : "0 2px 8px rgba(0,0,0,0.03)",
                    padding: isRoot ? "10px 16px" : node.depth === 1 ? "8px 12px" : "6px 10px",
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
                    {/* Stage number badge for Level 1 (Chapters) */}
                    {node.depth === 1 && node.stageNumber && (
                      <span
                        style={{
                          fontSize: 9.5,
                          fontWeight: 800,
                          backgroundColor: node.color.primary,
                          color: "#ffffff",
                          width: 18,
                          height: 18,
                          borderRadius: "50%",
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
                        fontWeight: isRoot || node.depth === 1 ? 800 : 600,
                        color: isRoot ? "#ffffff" : node.depth === 1 ? node.color.text : "#2d3748",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        lineHeight: 1.25
                      }}
                    >
                      {node.title}
                    </span>
                  </div>

                  {/* Collapse / Expand Toggle Button for parent nodes */}
                  {node.hasChildren && (
                    <button
                      onClick={(e) => toggleCollapse(node.id, e)}
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: "50%",
                        border: "none",
                        backgroundColor: isRoot ? "#32443e" : node.color.primary,
                        color: "#ffffff",
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

          {/* Bottom Left: Touch & Mouse Gesture Hint */}
          <div
            style={{
              position: "absolute",
              bottom: 12,
              left: 12,
              fontSize: 10,
              color: "#6b7a74",
              backgroundColor: "rgba(255, 255, 255, 0.8)",
              backdropFilter: "blur(4px)",
              padding: "4px 8px",
              borderRadius: 6,
              border: "1px solid #e2e8e0",
              pointerEvents: "none",
              zIndex: 10
            }}
          >
            💡 Geser layar untuk menggeser · Cubit / scroll untuk zoom
          </div>

          {/* Bottom Right: Zoom Controls */}
          <div
            style={{
              position: "absolute",
              bottom: 12,
              right: 12,
              backgroundColor: "rgba(255, 255, 255, 0.92)",
              backdropFilter: "blur(6px)",
              border: "1px solid #dce2da",
              borderRadius: 8,
              padding: "3px 6px",
              display: "flex",
              alignItems: "center",
              gap: 4,
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              zIndex: 10
            }}
          >
            <button
              onClick={() => setZoom((z) => Math.max(0.28, z * 0.85))}
              title="Perkecil (Zoom Out)"
              style={{
                background: "none",
                border: "none",
                padding: "5px 7px",
                borderRadius: 5,
                cursor: "pointer",
                color: "#45544e",
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
                color: "#45544e",
                minWidth: 32,
                textAlign: "center"
              }}
            >
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(2.2, z * 1.15))}
              title="Perbesar (Zoom In)"
              style={{
                background: "none",
                border: "none",
                padding: "5px 7px",
                borderRadius: 5,
                cursor: "pointer",
                color: "#45544e",
                display: "flex",
                alignItems: "center"
              }}
            >
              <ZoomIn size={13} />
            </button>
          </div>
        </div>
      ) : (
        /* VIEW 2: ALUR BELAJAR BERURUTAN (ROADMAP SEQUENCE FLOW) */
        <div
          style={{
            position: "absolute",
            inset: 0,
            overflowY: "auto",
            padding: "60px 16px 24px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            userSelect: "text"
          }}
        >
          {/* Roadmap Header Card */}
          <div
            style={{
              maxWidth: 620,
              width: "100%",
              backgroundColor: "#18221f",
              color: "#ffffff",
              padding: "16px 20px",
              borderRadius: 14,
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
              marginBottom: 16,
              textAlign: "center",
              border: "1.5px solid #2b3a34"
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                backgroundColor: "#273831",
                color: "#c8f064",
                padding: "3px 10px",
                borderRadius: 999,
                fontSize: 10,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: 8
              }}
            >
              <Compass size={12} /> Roadmap Pembelajaran
            </div>
            <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 800, color: "#ffffff" }}>
              {tree.title}
            </h3>
            <p style={{ margin: 0, fontSize: 12, color: "#a5b5ad", lineHeight: 1.5 }}>
              Pelajari materi secara bertahap dari bab awal hingga mahakarya konsep di bab akhir.
            </p>
          </div>

          {/* Sequential Stage Cards */}
          <div style={{ maxWidth: 620, width: "100%", display: "flex", flexDirection: "column", gap: 14 }}>
            {tree.children?.map((branch, bIdx) => {
              const color = branch.color || PALETTE[bIdx % PALETTE.length];
              const isLast = bIdx === (tree.children?.length || 0) - 1;

              return (
                <div key={branch.id} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  {/* Stage Card */}
                  <div
                    style={{
                      width: "100%",
                      backgroundColor: "#ffffff",
                      border: `1.5px solid ${color.border}`,
                      borderRadius: 14,
                      padding: "16px 18px",
                      boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
                      transition: "transform 0.15s ease",
                      position: "relative"
                    }}
                  >
                    {/* Stage Header */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: "50%",
                            backgroundColor: color.primary,
                            color: "#ffffff",
                            fontSize: 12,
                            fontWeight: 900,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: `0 2px 8px ${color.primary}44`
                          }}
                        >
                          {branch.stageNumber || bIdx + 1}
                        </span>
                        <div>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 800,
                              textTransform: "uppercase",
                              color: color.text,
                              letterSpacing: "0.05em"
                            }}
                          >
                            Tahap {branch.stageNumber || bIdx + 1}
                          </span>
                          <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#17201d" }}>
                            {branch.title}
                          </h4>
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          setSelectedNode({
                            id: branch.id,
                            title: branch.title,
                            desc: branch.desc || "Tahap pembelajaran ini membedah fondasi utama konsep pada bab terkait.",
                            depth: 1,
                            color,
                            stageNumber: branch.stageNumber
                          })
                        }
                        style={{
                          backgroundColor: color.light,
                          color: color.text,
                          border: `1px solid ${color.border}`,
                          padding: "4px 8px",
                          borderRadius: 6,
                          fontSize: 10,
                          fontWeight: 700,
                          cursor: "pointer"
                        }}
                      >
                        Detail
                      </button>
                    </div>

                    {/* Sub-topics list inside this chapter */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
                      {branch.children?.map((sub, sIdx) => (
                        <div
                          key={sub.id}
                          style={{
                            backgroundColor: "#f9faf8",
                            border: "1px solid #e2e8e0",
                            borderRadius: 10,
                            padding: "10px 12px"
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <CheckCircle2 size={13} color={color.primary} />
                              <strong style={{ fontSize: 12.5, color: "#1c2522" }}>
                                {sub.title}
                              </strong>
                            </div>
                            <button
                              onClick={() =>
                                setSelectedNode({
                                  id: sub.id,
                                  title: sub.title,
                                  desc: sub.desc || "Sub-bab materi penting.",
                                  depth: 2,
                                  color
                                })
                              }
                              style={{
                                background: "none",
                                border: "none",
                                color: "#60726a",
                                fontSize: 10,
                                fontWeight: 700,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: 2
                              }}
                            >
                              <span>Buka</span> <ChevronRight size={11} />
                            </button>
                          </div>

                          {/* Definisi Baku Snippet */}
                          {sub.desc && (
                            <p style={{ margin: "2px 0 8px 18px", fontSize: 11, color: "#4d5d56", lineHeight: 1.45 }}>
                              {sub.desc}
                            </p>
                          )}

                          {/* Atomic Concepts pills */}
                          {sub.children && sub.children.length > 0 && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginLeft: 18, marginTop: 4 }}>
                              {sub.children.map((leaf) => (
                                <button
                                  key={leaf.id}
                                  onClick={() =>
                                    setSelectedNode({
                                      id: leaf.id,
                                      title: leaf.title,
                                      desc: leaf.desc || "Konsep kunci penting.",
                                      depth: 3,
                                      color
                                    })
                                  }
                                  style={{
                                    backgroundColor: "#ffffff",
                                    border: `1px solid ${color.border}`,
                                    color: color.text,
                                    borderRadius: 6,
                                    padding: "3px 8px",
                                    fontSize: 10.5,
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 4
                                  }}
                                >
                                  <span>•</span>
                                  <span>{leaf.title}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Connecting Arrow between Stages */}
                  {!isLast && (
                    <div
                      style={{
                        height: 28,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: color.primary,
                        opacity: 0.85
                      }}
                    >
                      <ArrowDown size={18} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Node Detail Popup / Inspector Drawer (Shared across both modes) */}
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
            border: `1.5px solid ${selectedNode.color.border}`,
            borderRadius: 14,
            boxShadow: "0 12px 36px rgba(0,0,0,0.15)",
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
                color: selectedNode.color.text,
                backgroundColor: selectedNode.color.light,
                border: `1px solid ${selectedNode.color.border}`,
                padding: "2px 8px",
                borderRadius: 4,
                fontFamily: "'DM Mono', monospace"
              }}
            >
              {selectedNode.depth === 0
                ? "Topik Utama"
                : selectedNode.depth === 1
                ? `Tahap ${selectedNode.stageNumber || 1} • Bab`
                : selectedNode.depth === 2
                ? "Sub-Bab Materi"
                : "Konsep Inti"}
            </span>
            <button
              onClick={() => setSelectedNode(null)}
              style={{
                background: "none",
                border: "none",
                color: "#8a9691",
                cursor: "pointer",
                padding: 2
              }}
            >
              <X size={15} />
            </button>
          </div>

          <h4 style={{ fontSize: 14.5, fontWeight: 800, color: "#17201d", margin: "0 0 6px" }}>
            {selectedNode.title}
          </h4>

          <p style={{ fontSize: 12, color: "#45544e", lineHeight: 1.5, margin: "0 0 12px" }}>
            {selectedNode.desc || "Konsep ini merupakan salah satu cabang penting dari alur belajar materi ini."}
          </p>

          {onAskNara && (
            <button
              onClick={() => {
                onAskNara(`Jelaskan konsep "${selectedNode.title}" beserta contoh aplikasinya dalam ujian.`);
                setSelectedNode(null);
              }}
              style={{
                width: "100%",
                padding: "8px 12px",
                backgroundColor: "#18221f",
                color: "#c8f064",
                border: "none",
                borderRadius: 8,
                fontSize: 11.5,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6
              }}
            >
              <Sparkles size={12} color="#c8f064" />
              <span>Tanya Nara tentang konsep ini</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
