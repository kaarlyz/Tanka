import { useState } from "react";
import { motion } from "motion/react";
import { MathView } from "../../common/MathView";

interface GNode {
  id: string;
  label: string;
  title: string;
  x: number;
  y: number;
  def: string;
}

const NODES: readonly GNode[] = [
  { id: "himpunan", label: "Himpunan", title: "Himpunan", x: 56, y: 170, def: "Kumpulan objek yang terdefinisi jelas, ditulis dengan notasi $\\{x \\mid P(x)\\}$." },
  { id: "relasi", label: "Relasi", title: "Relasi", x: 186, y: 170, def: "Aturan pengaitan anggota himpunan $A$ ke himpunan $B$." },
  { id: "fungsi", label: "Fungsi", title: "Fungsi", x: 316, y: 170, def: "Relasi khusus di mana setiap anggota $A$ dipasangkan tepat satu anggota $B$." },
  { id: "komposisi", label: "Komposisi", title: "Fungsi Komposisi", x: 446, y: 100, def: "$(f \\circ g)(x) = f(g(x))$: nilai keluaran $g(x)$ menjadi masukan bagi fungsi $f$." },
  { id: "grafik", label: "Grafik", title: "Grafik Fungsi", x: 446, y: 240, def: "Himpunan titik koordinat $(x, f(x))$ pada bidang Cartesius." },
  { id: "invers", label: "Invers", title: "Fungsi Invers", x: 576, y: 100, def: "Fungsi $f^{-1}$ memenuhi $f(f^{-1}(x)) = x$. Syarat ada jika $f$ bijektif." }
];

const EDGES: ReadonlyArray<readonly [string, string]> = [
  ["himpunan", "relasi"],
  ["relasi", "fungsi"],
  ["fungsi", "komposisi"],
  ["fungsi", "grafik"],
  ["komposisi", "invers"]
];

const HALF_W = 46;
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

/** Peta konsep interaktif: arahkan kursor, fokus, atau klik simpul untuk melihat prasyaratnya. */
export function KnowledgeGraph() {
  const [hover, setHover] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string>("invers");
  const focusId = hover ?? pinned;
  const prereq = ancestorsOf(focusId);
  const lit = new Set<string>([...prereq, focusId]);
  const node = byId(focusId);
  const prereqNames = NODES.filter((n) => prereq.has(n.id)).map((n) => n.title);

  return (
    <section id="peta-konsep" className="kg-section" aria-labelledby="kg-title">
      <div className="kg-copy">
        <h2 id="kg-title">Lihat topik mana yang harus dikuasai lebih dulu.</h2>
        <p>
          Tanka menyusun peta konsep dari materimu. Pilih satu simpul, dan semua prasyaratnya menyala. Ini contoh
          topik Matematika.
        </p>
        <div className="kg-panel" role="status" aria-live="polite">
          <strong>{node.title}</strong>
          <div style={{ margin: "8px 0", fontSize: 14.5, lineHeight: 1.55 }}>
            <MathView text={node.def} />
          </div>
          <small>{prereqNames.length > 0 ? `Prasyarat: ${prereqNames.join(" → ")}` : "Tidak ada prasyarat di peta ini."}</small>
        </div>
      </div>

      <svg className="kg-svg" viewBox="0 0 640 340" role="group" aria-label="Peta konsep Matematika">
        <defs>
          <marker id="kg-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" fill="currentColor" />
          </marker>
        </defs>

        {EDGES.map(([a, b]) => {
          const s = byId(a);
          const t = byId(b);
          const x1 = s.x + HALF_W;
          const x2 = t.x - HALF_W - 4;
          const on = lit.has(a) && lit.has(b);
          return (
            <motion.path
              key={`${a}-${b}`}
              d={`M${x1} ${s.y} C ${x1 + 26} ${s.y}, ${x2 - 26} ${t.y}, ${x2} ${t.y}`}
              className={`kg-edge${on ? " on" : ""}`}
              fill="none"
              markerEnd="url(#kg-arrow)"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            />
          );
        })}

        {NODES.map((n) => {
          const isLit = lit.has(n.id);
          const isFocus = n.id === focusId;
          return (
            <g
              key={n.id}
              className={`kg-node${isLit ? " lit" : ""}${isFocus ? " focus" : ""}`}
              role="button"
              tabIndex={0}
              aria-pressed={pinned === n.id}
              aria-label={`${n.title}. ${n.def}`}
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
              <rect x={n.x - HALF_W} y={n.y - 18} width={HALF_W * 2} height={36} rx={18} />
              <text x={n.x} y={n.y + 4.5} textAnchor="middle">
                {n.label}
              </text>
            </g>
          );
        })}
      </svg>
    </section>
  );
}

export default KnowledgeGraph;
