import { useState } from "react";
import { MathView } from "../../common/MathView";

const PARTS = [
  {
    k: "c",
    t: "c",
    def: "Panjang sisi miring: sisi terpanjang, berhadapan dengan sudut $90^\\circ$. Contoh $a = 3$ dan $b = 4$ menghasilkan $c = \\sqrt{9 + 16} = 5$."
  },
  {
    k: "root",
    t: "√",
    def: "Akar kuadrat: bilangan non-negatif yang bila dikuadratkan sama dengan isi akar. Dipakai untuk membalik $c^2 = a^2 + b^2$ menjadi $c$."
  },
  {
    k: "a",
    t: "a²",
    def: "Kuadrat panjang salah satu sisi siku-siku, yaitu $a \\times a$."
  },
  {
    k: "plus",
    t: "+",
    def: "Teorema Pythagoras: pada segitiga siku-siku, $c^2 = a^2 + b^2$. Jumlah kuadrat kedua sisi siku-siku sama dengan kuadrat sisi miring."
  },
  {
    k: "b",
    t: "b²",
    def: "Kuadrat panjang sisi siku-siku yang lain, yaitu $b \\times b$."
  }
] as const;

/** Rumus yang bisa dibongkar: klik tiap bagian untuk definisi literalnya. */
export function FormulaBreakdown() {
  const [key, setKey] = useState<string>("c");
  const part = PARTS.find((p) => p.k === key) ?? PARTS[0];
  const show = (k: string): void => setKey(k);

  return (
    <section id="bongkar-rumus" className="fb-section" aria-labelledby="fb-title">
      <div>
        <h2 id="fb-title">Setiap simbol punya arti. Bongkar satu per satu.</h2>
        <p>Klik tiap bagian rumus untuk melihat definisinya. Begitulah Nara menjelaskan: langsung ke rumus, tanpa perumpamaan.</p>
      </div>
      <div className="fb-card">
        <div className="fb-formula" role="group" aria-label="Rumus Pythagoras">
          {PARTS.slice(0, 2).map((p) => (
            <button key={p.k} className={key === p.k ? "on" : ""} onClick={() => show(p.k)} onMouseEnter={() => show(p.k)}>{p.t}</button>
          ))}
          <span aria-hidden="true">= (</span>
          {PARTS.slice(2).map((p) => (
            <button key={p.k} className={key === p.k ? "on" : ""} onClick={() => show(p.k)} onMouseEnter={() => show(p.k)}>{p.t}</button>
          ))}
          <span aria-hidden="true">)</span>
        </div>
        <div className="fb-def" role="status" aria-live="polite" key={part.k}>
          <MathView text={part.def} />
        </div>
      </div>
    </section>
  );
}

export default FormulaBreakdown;
