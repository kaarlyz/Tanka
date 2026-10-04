import React, { useState, useRef, useMemo, useCallback, useEffect } from "react";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Layers,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Maximize2,
  Minimize2,
  X,
  BookOpen,
  Compass
} from "lucide-react";

export interface MindMapNode {
  id: string;
  title: string;
  desc?: string;
  children?: MindMapNode[];
  color?: {
    primary: string;
    light: string;
    border: string;
    text: string;
  };
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
  color: {
    primary: string;
    light: string;
    border: string;
    text: string;
  };
  hasChildren: boolean;
  isCollapsed: boolean;
  parentId?: string;
  parentX?: number;
  parentY?: number;
}

const PALETTE = [
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

export function parseMarkdownToMindMapTree(markdown: string, fallbackTitle: string): MindMapNode {
  if (!markdown || !markdown.trim()) {
    return { id: "root", title: fallbackTitle || "Peta Konsep", children: [] };
  }

  const lines = markdown.split("\n");
  let rootTitle = fallbackTitle || "Peta Konsep Materi";
  const branches: MindMapNode[] = [];
  let currentBranch: MindMapNode | null = null;
  let currentSub: MindMapNode | null = null;

  for (let rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (line.startsWith("# ") && (!rootTitle || rootTitle === "Peta Konsep Materi")) {
      rootTitle = line.replace(/^#\s+/, "").replace(/[*_#]/g, "").trim();
    } else if (line.startsWith("## ")) {
      const title = line.replace(/^##\s+/, "").replace(/[*_#]/g, "").trim();
      const color = PALETTE[branches.length % PALETTE.length];
      currentBranch = {
        id: "b_" + branches.length,
        title,
        color,
        children: []
      };
      branches.push(currentBranch);
      currentSub = null;
    } else if (line.startsWith("### ")) {
      const title = line.replace(/^###\s+/, "").replace(/[*_#]/g, "").trim();
      if (!currentBranch) {
        currentBranch = {
          id: "b_" + branches.length,
          title: "Intisari Materi",
          color: PALETTE[0],
          children: []
        };
        branches.push(currentBranch);
      }
      currentSub = {
        id: currentBranch.id + "_s" + (currentBranch.children?.length || 0),
        title,
        color: currentBranch.color,
        children: []
      };
      currentBranch.children = currentBranch.children || [];
      currentBranch.children.push(currentSub);
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      const rawText = line.replace(/^[-*]\s+/, "").replace(/[*_]/g, "").trim();
      if (rawText.length < 3 || rawText.includes("---")) continue;
      
      const parts = rawText.split(/:\s+/);
      const title = parts[0].slice(0, 48);
      const desc = parts.length > 1 ? parts.slice(1).join(": ") : rawText;

      const leaf: MindMapNode = {
        id: "leaf_" + Math.random().toString(36).slice(2, 8),
        title,
        desc
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
    }
  }

  return {
    id: "root",
    title: rootTitle,
    color: { primary: "#18221f", light: "#f8faf6", border: "#34413c", text: "#ffffff" },
    children: branches.length > 0 ? branches : [
      { id: "b_0", title: "Ringkasan Konsep", color: PALETTE[0], children: [] },
      { id: "b_1", title: "Poin-Poin Utama", color: PALETTE[1], children: [] }
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
  
  // Transform State (Pan & Zoom)
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Node collapse and inspection state
  const [collapsedNodes, setCollapsedNodes] = useState<Record<string, boolean>>({});
  const [selectedNode, setSelectedNode] = useState<LayoutItem | null>(null);

  // Parse markdown into tree
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
    const next: Record<string, boolean> = {};
    (tree.children || []).forEach((c) => {
      next[c.id] = true;
    });
    setCollapsedNodes(next);
  }, [tree]);

  // Compute Layout coordinates for 2-sided horizontal tree
  const { nodes, connections, bounds } = useMemo(() => {
    const items: LayoutItem[] = [];
    const conns: {
      fromX: number;
      fromY: number;
      toX: number;
      toY: number;
      color: string;
      id: string;
    }[] = [];

    const rootWidth = Math.min(260, Math.max(160, tree.title.length * 8.5 + 40));
    const rootHeight = 52;
    const rootItem: LayoutItem = {
      id: tree.id,
      title: tree.title,
      x: -rootWidth / 2,
      y: -rootHeight / 2,
      width: rootWidth,
      height: rootHeight,
      depth: 0,
      side: "root",
      color: tree.color || { primary: "#18221f", light: "#f8faf6", border: "#34413c", text: "#ffffff" },
      hasChildren: (tree.children?.length || 0) > 0,
      isCollapsed: false
    };
    items.push(rootItem);

    const children = tree.children || [];
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

    // Layout function for one side
    const layoutSide = (
      branches: MindMapNode[],
      side: "left" | "right"
    ) => {
      const totalSideHeight = branches.reduce((acc, b) => acc + getSubtreeHeight(b), 0);
      let currentY = -totalSideHeight / 2;

      branches.forEach((b) => {
        const bHeight = getSubtreeHeight(b);
        const bCenterY = currentY + bHeight / 2;
        const bWidth = Math.min(220, Math.max(140, b.title.length * 8 + 32));
        const bX = side === "right" ? 180 : -180 - bWidth;
        const bY = bCenterY - 22;

        const branchItem: LayoutItem = {
          id: b.id,
          title: b.title,
          desc: b.desc,
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

        // Connection from root to branch
        conns.push({
          id: `root->${b.id}`,
          fromX: side === "right" ? rootWidth / 2 : -rootWidth / 2,
          fromY: 0,
          toX: side === "right" ? bX : bX + bWidth,
          toY: bY + 22,
          color: b.color?.primary || "#10b981"
        });

        // Layout Level 2 children if not collapsed
        if (!collapsedNodes[b.id] && b.children && b.children.length > 0) {
          const subHeight = b.children.reduce((acc, sub) => acc + getSubtreeHeight(sub), 0);
          let subY = bCenterY - subHeight / 2;

          b.children.forEach((sub) => {
            const leafHeight = getSubtreeHeight(sub);
            const subCenterY = subY + leafHeight / 2;
            const subWidth = Math.min(200, Math.max(120, sub.title.length * 7.5 + 28));
            const subX = side === "right" ? bX + bWidth + 60 : bX - 60 - subWidth;
            const itemY = subCenterY - 18;

            const subItem: LayoutItem = {
              id: sub.id,
              title: sub.title,
              desc: sub.desc,
              x: subX,
              y: itemY,
              width: subWidth,
              height: 36,
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
              toY: itemY + 18,
              color: b.color?.primary || "#10b981"
            });

            // Layout Level 3 leaves
            if (!collapsedNodes[sub.id] && sub.children && sub.children.length > 0) {
              let leafY = subCenterY - (sub.children.length * 36) / 2;
              sub.children.forEach((leaf) => {
                const lWidth = Math.min(180, Math.max(100, leaf.title.length * 7 + 24));
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
                  parentY: itemY + 18
                });

                conns.push({
                  id: `${sub.id}->${leaf.id}`,
                  fromX: side === "right" ? subX + subWidth : subX,
                  fromY: itemY + 18,
                  toX: side === "right" ? lX : lX + lWidth,
                  toY: lItemY + 16,
                  color: b.color?.border || "#94a3b8"
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

    // Calculate bounding box for auto-centering
    let minX = 0, maxX = 0, minY = 0, maxY = 0;
    items.forEach((item) => {
      minX = Math.min(minX, item.x);
      maxX = Math.max(maxX, item.x + item.width);
      minY = Math.min(minY, item.y);
      maxY = Math.max(maxY, item.y + item.height);
    });

    return {
      nodes: items,
      connections: conns,
      bounds: { minX, maxX, minY, maxY, width: maxX - minX, height: maxY - minY }
    };
  }, [tree, collapsedNodes]);

  // Auto-fit and center the view on mount, window resize, or topic change
  const handleResetView = useCallback(() => {
    if (containerRef.current) {
      const cw = containerRef.current.clientWidth || 360;
      const ch = containerRef.current.clientHeight || 560;
      const tw = Math.max(520, bounds.width + 80);
      const th = Math.max(380, bounds.height + 80);
      const scaleX = (cw - 32) / tw;
      const scaleY = (ch - 32) / th;
      const fitZoom = Math.min(1.0, Math.max(0.35, Math.min(scaleX, scaleY)));
      setZoom(Number(fitZoom.toFixed(2)));
      setPan({ x: 0, y: 0 });
    } else {
      const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
      setZoom(isMobile ? 0.45 : 0.85);
      setPan({ x: 0, y: 0 });
    }
  }, [bounds.width, bounds.height]);

  useEffect(() => {
    handleResetView();
  }, [title, handleResetView]);

  // Keep refs for touch event listeners
  const panRef = useRef(pan);
  panRef.current = pan;
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;

  // Touch Gesture Listeners (Smooth 1-finger Pan & 2-finger Pinch-to-Zoom on Mobile)
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
                strokeWidth={selectedNode?.id && (c.id.includes(selectedNode.id) || selectedNode.parentId === c.id) ? "2.5" : "1.8"}
                strokeOpacity={selectedNode ? (c.id.includes(selectedNode.id) ? 0.95 : 0.4) : 0.75}
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
                setSelectedNode(node);
              }}
              style={{
                position: "absolute",
                left: node.x,
                top: node.y,
                width: node.width,
                minHeight: node.height,
                backgroundColor: isRoot ? "#18221f" : node.color.light,
                border: `1.5px solid ${isRoot ? "#34413c" : isSelected ? node.color.primary : node.color.border}`,
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
                transition: "all 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
                transform: isSelected ? "scale(1.04)" : "scale(1)",
                zIndex: isRoot ? 20 : isSelected ? 30 : 10
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <span
                  style={{
                    display: "block",
                    fontSize: isRoot ? 13.5 : node.depth === 1 ? 12 : 11,
                    fontWeight: isRoot ? 800 : 700,
                    color: isRoot ? "#ffffff" : node.color.text,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    letterSpacing: isRoot ? "-0.01em" : "0"
                  }}
                  title={node.title}
                >
                  {node.title}
                </span>
              </div>

              {/* Expand/Collapse Action Badge */}
              {node.hasChildren && (
                <button
                  onClick={(e) => toggleCollapse(node.id, e)}
                  title={node.isCollapsed ? "Buka cabang" : "Tutup cabang"}
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 999,
                    border: "none",
                    backgroundColor: isRoot ? "#34413c" : node.color.primary,
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 10,
                    cursor: "pointer",
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

      {/* Top Left: Title & Concept Count */}
      <div
        style={{
          position: "absolute",
          top: 12,
          left: 12,
          backgroundColor: "rgba(255, 255, 255, 0.92)",
          backdropFilter: "blur(6px)",
          border: "1px solid #dce2da",
          borderRadius: 8,
          padding: "5px 10px",
          display: "flex",
          alignItems: "center",
          gap: 6,
          boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
          zIndex: 10
        }}
      >
        <Layers size={13} color="#4b6623" />
        <span style={{ fontSize: 11, fontWeight: 800, color: "#17201d" }}>
          Mind Map • {nodes.length} Simpul
        </span>
      </div>

      {/* Top Right: Layout Action Controls */}
      <div
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          backgroundColor: "rgba(255, 255, 255, 0.92)",
          backdropFilter: "blur(6px)",
          border: "1px solid #dce2da",
          borderRadius: 8,
          padding: "3px 6px",
          display: "flex",
          alignItems: "center",
          gap: 4,
          boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
          zIndex: 10
        }}
      >
        <button
          onClick={handleResetView}
          title="Posisikan ke tengah layar (Fit View)"
          style={{
            background: "none",
            border: "none",
            padding: "5px 7px",
            borderRadius: 5,
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
            padding: "5px 7px",
            borderRadius: 5,
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
            padding: "5px 7px",
            borderRadius: 5,
            cursor: "pointer",
            color: "#45544e",
            fontSize: 11,
            fontWeight: 700
          }}
        >
          Tutup
        </button>
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
        💡 Geser layar untuk geser · Cubit untuk zoom
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
            fontSize: 10.5,
            fontWeight: 700,
            fontFamily: "'DM Mono', monospace",
            color: "#18221f",
            minWidth: 34,
            textAlign: "center"
          }}
        >
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom((z) => Math.min(2.5, z * 1.15))}
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

      {/* Node Detail Popup / Inspector Drawer */}
      {selectedNode && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "absolute",
            bottom: 16,
            right: 16,
            maxWidth: 340,
            width: "calc(100% - 32px)",
            backgroundColor: "#ffffff",
            border: `1.5px solid ${selectedNode.color.border}`,
            borderRadius: 12,
            boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
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
              {selectedNode.depth === 0 ? "Topik Utama" : selectedNode.depth === 1 ? "Pilar Bab" : "Konsep Inti"}
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
            {selectedNode.desc || "Konsep ini merupakan salah satu cabang penting dari silabus materi."}
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
