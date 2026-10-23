import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { MathView } from "../../common/MathView";

interface GNode {
  id: string;
  label: string;
  sub: string;
  badge: string;
  title: string;
  x: number;
  y: number;
  def: string;
}

const NODES: readonly GNode[] = [
  {
    id: "himpunan",
    label: "Himpunan",
    sub: "{ x | P(x) }",
    badge: "Konsep Dasar",
    title: "Teori Himpunan",
    x: 56,
    y: 170,
    def: "Kumpulan objek terdefinisi jelas, ditulis dengan notasi himpunan $\\{x \\mid P(x)\\}$."
  },
  {
    id: "relasi",
    label: "Relasi",
    sub: "A ↦ B",
    badge: "Prasyarat",
    title: "Relasi Himpunan",
    x: 186,
    y: 170,
    def: "Aturan pengaitan yang memasangkan anggota himpunan $A$ ke himpunan $B$."
  },
  {
    id: "fungsi",
    label: "Fungsi",
    sub: "y = f(x)",
    badge: "Pilar Utama",
    title: "Konsep Fungsi",
    x: 316,
    y: 170,
    def: "Relasi khusus di mana setiap anggota domain $A$ dipasangkan tepat satu anggota kodomain $B$."
  },
  {
    id: "komposisi",
    label: "Komposisi",
    sub: "(f ∘ g)(x)",
    badge: "Operasi Lanjutan",
    title: "Fungsi Komposisi",
    x: 446,
    y: 100,
    def: "$(f \\circ g)(x) = f(g(x))$: nilai keluaran $g(x)$ menjadi masukan bagi fungsi luar $f$."
  },
  {
    id: "grafik",
    label: "Grafik",
    sub: "(x, y) ∈ ℝ²",
    badge: "Visual Geometri",
    title: "Grafik Cartesius",
    x: 446,
    y: 240,
    def: "Representasi visual himpunan pasangan terurut $(x, f(x))$ pada bidang koordinat."
  },
  {
    id: "invers",
    label: "Invers",
    sub: "f⁻¹(x)",
    badge: "Target Penguasaan",
    title: "Fungsi Invers",
    x: 576,
    y: 100,
    def: "Fungsi kebalikan $f^{-1}$ yang memenuhi $f(f^{-1}(x)) = x$. Syarat ada jika $f$ bersifat bijektif."
  }
];

const EDGES: ReadonlyArray<readonly [string, string]> = [
  ["himpunan", "relasi"],
  ["relasi", "fungsi"],
  ["fungsi", "komposisi"],
  ["fungsi", "grafik"],
  ["komposisi", "invers"]
];

const HALF_W = 48;
const byId = (id: string): GNode => NODES.find((n) => n.id === id) ?? NODES[0];

function ancestorsOf(id: string): Set<string> {
  const out = new Set<string>();
  const stack = [id];
  while (stack.length > 0) {
    const cur = stack.pop();
    if (cur === undefined) break;
    for (const [from, to] of EDGES) {
      if (to === cur && !out.has(from)) {
        out.add(from);
        stack.push(from);
      }
    }
  }
  return out;
}

/** Peta konsep interaktif hidup: klik simpul, alur prasyarat menyala, partikel mengalir. */
export function KnowledgeGraph() {
  const [hover, setHover] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string>("invers");
  const reduce = useReducedMotion();

  const focusId = hover ?? pinned;
  const prereq = ancestorsOf(focusId);
  const lit = new Set<string>([...prereq, focusId]);
  const node = byId(focusId);
  const prereqNodes = NODES.filter((n) => prereq.has(n.id));

  return (
    <section id="peta-konsep" className="kg-section" aria-labelledby="kg-title">
      <div className="kg-copy">
        <h2 id="kg-title">Lihat topik mana yang harus dikuasai lebih dulu.</h2>
        <p>
          Tanka menyusun peta konsep dari materimu. Pilih satu simpul, dan seluruh rantai prasyaratnya menyala dengan
          aliran pemahaman hidup.
        </p>

        <div className="kg-panel" role="status" aria-live="polite">
          <AnimatePresence mode="wait">
            <motion.div
              key={node.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <strong>{node.title}</strong>
                <span className="kg-node-badge">{node.badge}</span>
              </div>
              <div style={{ margin: "8px 0", fontSize: 14.5, lineHeight: 1.55 }}>
                <MathView text={node.def} />
              </div>

              <div className="kg-prereq-chain">
                <span className="kg-chain-label">
                  {prereqNodes.length > 0 ? "URUTAN PENGUASAAN PRASYARAT:" : "STATUS TOPIK:"}
                </span>
                <div className="kg-chain-pills">
                  {prereqNodes.map((pn) => (
                    <span key={pn.id} className="kg-chain-pill">
                      ✓ {pn.label}
                    </span>
                  ))}
                  <span className="kg-chain-pill active">★ {node.label}</span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <svg className="kg-svg" viewBox="0 0 640 340" role="group" aria-label="Peta konsep Matematika interaktif">
        <defs>
          <marker id="kg-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="currentColor" />
          </marker>
        </defs>

        {/* 1. Garis konektor antar simpul */}
        {EDGES.map(([a, b]) => {
          const s = byId(a);
          const t = byId(b);
          const x1 = s.x + HALF_W;
          const x2 = t.x - HALF_W - 3;
          const on = lit.has(a) && lit.has(b);
          const pathD = `M${x1} ${s.y} C ${x1 + 28} ${s.y}, ${x2 - 28} ${t.y}, ${x2} ${t.y}`;
          return (
            <g key={`${a}-${b}`}>
              <path
                d={pathD}
                className={`kg-edge${on ? " on" : ""}`}
                fill="none"
                markerEnd="url(#kg-arrow)"
              />
              {/* Partikel energi yang mengalir sepanjang jalur aktif */}
              {on && !reduce && (
                <circle r={3.2} fill="#c8f064" stroke="#18221f" strokeWidth={1}>
                  <animateMotion
                    dur="1.7s"
                    repeatCount="indefinite"
                    path={pathD}
                  />
                </circle>
              )}
            </g>
          );
        })}

        {/* 2. Simpul-simpul materi */}
        {NODES.map((n) => {
          const isLit = lit.has(n.id);
          const isFocus = n.id === focusId;
          return (
            <motion.g
              key={n.id}
              className={`kg-node${isLit ? " lit" : ""}${isFocus ? " focus" : ""}`}
              role="button"
              tabIndex={0}
              aria-pressed={pinned === n.id}
              aria-label={`${n.title}. ${n.def}`}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 350, damping: 20 }}
              style={{ originX: `${n.x}px`, originY: `${n.y}px` }}
              onMouseEnter={() => setHover(n.id)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(n.id)}
              onBlur={() => setHover(null)}
              onClick={() => setPinned(n.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setPinned(n.id);
                }
              }}
            >
              {/* Cincin denyut radar pada simpul yang sedang dipilih */}
              {isFocus && !reduce && (
                <motion.rect
                  x={n.x - HALF_W - 5}
                  y={n.y - 23}
                  width={HALF_W * 2 + 10}
                  height={46}
                  rx={23}
                  fill="none"
                  stroke="#c8f064"
                  strokeWidth={2}
                  animate={{ scale: [1, 1.14, 1.2], opacity: [0.8, 0.25, 0] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
                  style={{ originX: `${n.x}px`, originY: `${n.y}px` }}
                />
              )}

              {/* Badan Simpul */}
              <rect x={n.x - HALF_W} y={n.y - 20} width={HALF_W * 2} height={40} rx={12} />

              {/* Teks Judul Simpul */}
              <text x={n.x} y={n.y - 2} textAnchor="middle">
                {n.label}
              </text>

              {/* Sub-label notasi formula */}
              <text x={n.x} y={n.y + 12} textAnchor="middle" className="kg-sub">
                {n.sub}
              </text>
            </motion.g>
          );
        })}
      </svg>
    </section>
  );
}

export default KnowledgeGraph;