import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { motion, useMotionValueEvent, useScroll, useSpring, useTransform, type MotionValue } from "motion/react";

const INK = "#18221f";
const LIME = "#c8f064";
const SAGE = "#dce2da";
const OLIVE = "#4b6623";
const DANGER = "#c2410c";

type P = MotionValue<number>;
type Pt = readonly [number, number];

const IDS = ["Himpunan", "Relasi", "Fungsi", "Komposisi", "Grafik", "Invers"] as const;
const SHEET: readonly Pt[] = IDS.map((_, i) => [462, 148 + i * 54] as const);
const G: readonly Pt[] = [[330, 380], [450, 330], [580, 270], [710, 190], [720, 370], [850, 150]];
const G2 = (g: Pt): Pt => [(g[0] - 330) * 0.5 + 40, (g[1] - 150) * 0.5 + 285];
const C: readonly Pt[] = [[690, 152], [760, 152], [690, 267], [690, 382], [760, 267], [760, 382]];
const EDGES: ReadonlyArray<readonly [number, number]> = [[0, 1], [1, 2], [2, 3], [2, 4], [3, 5]];
const K = [0, 0.1, 0.3, 0.52, 0.8, 1];

interface NodeMV { x: MotionValue<number>; y: MotionValue<number>; scale: MotionValue<number>; opacity: MotionValue<number>; label: MotionValue<number>; fill: MotionValue<string> }

function useNode(i: number, p: P): NodeMV {
  const g = G[i];
  const g2 = G2(g);
  const x = useTransform(p, K, [SHEET[i][0], SHEET[i][0], g[0], g2[0], C[i][0], C[i][0]]);
  const y = useTransform(p, K, [SHEET[i][1], SHEET[i][1], g[1], g2[1], C[i][1], C[i][1]]);
  const scale = useTransform(p, K, [0.5, 0.8, 1, i === 3 ? 1.4 : 0.8, 0.5, 0.5]);
  const opacity = useTransform(p, [0, 0.05 + i * 0.012, 0.11 + i * 0.012], [0, 0, 1]);
  const label = useTransform(p, i === 3 ? [0.28, 0.34, 0.62, 0.68] : [0.28, 0.34, 0.44, 0.5], [0, 1, 1, 0]);
  const fill = useTransform(p, [0.86, 0.92], [i === 3 ? "#ffffff" : "#ffffff", i === 3 ? DANGER : "#ffffff"]);
  return { x, y, scale, opacity, label, fill };
}

function Edge({ a, b, p }: { a: NodeMV; b: NodeMV; p: P }) {
  const len = useTransform([a.x, a.y, b.x, b.y, p], ([x1, y1, x2, y2, v]: number[]) => Math.hypot(x2 - x1, y2 - y1) * Math.min(1, Math.max(0, (v - 0.2) / 0.1)));
  const rotate = useTransform([a.x, a.y, b.x, b.y], ([x1, y1, x2, y2]: number[]) => (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI);
  const opacity = useTransform(p, [0.2, 0.28, 0.6, 0.7], [0, 1, 1, 0]);
  return <motion.line className="ls-edge" x1={0} y1={0} x2={1} y2={0} vectorEffect="non-scaling-stroke" style={{ x: a.x, y: a.y, rotate, scaleX: len, opacity, originX: 0, originY: 0 }} />;
}

function Dot({ i, n }: { i: number; n: NodeMV }) {
  return (
    <motion.g style={{ x: n.x, y: n.y, opacity: n.opacity }}>
      <motion.circle r={14} stroke={INK} strokeWidth={2.5} style={{ scale: n.scale, fill: n.fill }} />
      <motion.circle r={4.5} fill={INK} style={{ scale: n.scale }} />
      <motion.text className="ls-lbl" y={36} textAnchor="middle" style={{ opacity: n.label }}>{IDS[i]}</motion.text>
    </motion.g>
  );
}

function Win({ p, from, to, dx = 0, children }: { p: P; from: number; to: number; dx?: number; children: ReactNode }) {
  const opacity = useTransform(p, [from, from + 0.05], [0, 1]);
  const x = useTransform(p, [from, to], [dx, 0]);
  return <motion.g style={{ opacity, x }}>{children}</motion.g>;
}

function Reveal({ p, id, from, to, w, h = 26, children }: { p: P; id: string; from: number; to: number; w: number; h?: number; children: ReactNode }) {
  const width = useTransform(p, [from, to], [0, w]);
  return (
    <>
      <clipPath id={id}><motion.rect x={0} y={-h + 6} height={h} style={{ width }} /></clipPath>
      <g clipPath={`url(#${id})`}>{children}</g>
    </>
  );
}

function SheetLine({ p, i }: { p: P; i: number }) {
  const y = 118 + i * 27;
  const t = ((y - 100) / 300) * 0.1;
  const fill = useTransform(p, [t, t + 0.015], [SAGE, i % 2 === 0 ? "#8da868" : "#c9d3c5"]);
  return <motion.rect x={32} y={y} width={[210, 180, 220, 150, 200, 225, 170, 215, 190, 140, 205, 90][i]} height={8} rx={4} style={{ fill }} />;
}

function Numeral({ p, n, a, b }: { p: P; n: string; a: number; b: number }) {
  const opacity = useTransform(p, [a, a + 0.04, b - 0.04, b], [a === 0 ? 1 : 0, 1, 1, b === 1 ? 1 : 0]);
  return <motion.text className="ls-numeral" x={24} y={520} style={{ opacity }}>{n}</motion.text>;
}

function SourceTags({ p }: { p: P }) {
  const opacity = useTransform(p, [0, 0.13, 0.21], [1, 1, 0]);
  const x = useTransform(p, [0, 0.21], [0, -50]);
  const items = ["PDF", "SLIDE", "FOTO CATATAN", "TAUTAN YOUTUBE"];
  return (
    <motion.g style={{ opacity, x }}>
      {items.map((t, i) => {
        const y = 150 + i * 62;
        return (
          <g key={t}>
            <path d={`M640 ${y + 18} C 590 ${y + 18}, 560 ${y + 18 - (i - 1.5) * 10}, 500 ${200 + i * 40}`} fill="none" stroke="#8da868" strokeWidth={1.6} strokeDasharray="4 5" />
            <rect x={640} y={y} width={190} height={36} rx={8} fill="#fff" stroke={INK} strokeWidth={1.8} />
            <text x={658} y={y + 23} className="ls-note" style={{ fontSize: 13, fill: INK }}>{t}</text>
          </g>
        );
      })}
    </motion.g>
  );
}

const TICKS = Array.from({ length: 41 }, (_, i) => `M${40 + i * 23} 540 v${i % 5 === 0 ? 10 : 5}`).join(" ");

/** Adegan yang benar-benar bertransformasi: baris teks menjadi simpul, simpul menyusut menjadi isi bab. */
export function LearningScene({ progress, vb }: { progress: P; vb?: string }) {
  const p = progress;
  const nodes = [useNode(0, p), useNode(1, p), useNode(2, p), useNode(3, p), useNode(4, p), useNode(5, p)];
  const sx = useTransform(p, [0, 0.25, 0.5, 0.75, 1], [190, 40, 20, 10, 10]);
  const sy = useTransform(p, [0, 0.25, 0.5, 0.75, 1], [30, 150, 90, 60, 60]);
  const ss = useTransform(p, [0, 0.25, 0.5, 0.75, 1], [1, 0.58, 0.4, 0.3, 0.3]);
  const so = useTransform(p, [0, 0.25, 0.5, 0.75, 1], [1, 1, 0.7, 0.35, 0.35]);
  const scanY = useTransform(p, [0, 0.1], [100, 400]);
  const scanO = useTransform(p, [0, 0.01, 0.1, 0.12], [0, 1, 1, 0]);
  const panelO = useTransform(p, [0.42, 0.47, 0.63, 0.68], [0, 1, 1, 0]);
  const link = useTransform(p, [0.44, 0.52], [0, 1]);
  const markX = useTransform(p, [0, 1], [40, 960]);
  const tokenY = useTransform(p, [0.9, 0.97], [382, 471]);
  const tokenX = useTransform(p, [0.9, 0.97], [690, 752]);
  const tokenO = useTransform(p, [0.89, 0.9, 0.97, 0.98], [0, 1, 1, 0]);

  return (
    <motion.svg className="ls-svg" viewBox="0 0 1000 560" animate={vb ? { viewBox: vb } : undefined} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} role="img" aria-label="Materi diurai menjadi konsep, dijelaskan Nara, disusun jadi bab, lalu diuji">
      <Numeral p={p} n="01" a={0} b={0.25} />
      <Numeral p={p} n="02" a={0.25} b={0.5} />
      <Numeral p={p} n="03" a={0.5} b={0.75} />
      <Numeral p={p} n="04" a={0.75} b={1} />

      {EDGES.map(([a, b]) => <Edge key={`${a}${b}`} a={nodes[a]} b={nodes[b]} p={p} />)}

      <motion.g style={{ x: sx, y: sy, scale: ss, opacity: so, originX: 0, originY: 0 }}>
        <rect width={300} height={480} rx={14} fill="#fff" stroke={INK} strokeWidth={2} />
        <path d="M260 0 L300 40 L260 40 Z" fill={SAGE} stroke={INK} strokeWidth={2} strokeLinejoin="round" />
        <rect x={32} y={36} width={96} height={14} rx={3} fill={INK} />
        <text x={32} y={80} className="ls-note">§ 2.1 FUNGSI</text>
        <path d="M18 100 V460" stroke={LIME} strokeWidth={3} />
        {Array.from({ length: 12 }, (_, i) => <SheetLine key={i} p={p} i={i} />)}
        <motion.rect x={14} width={272} height={3} rx={1.5} fill={LIME} style={{ y: scanY, opacity: scanO }} />
      </motion.g>

      <SourceTags p={p} />

      <motion.path d="M246 305 C 350 305, 370 215, 440 215" fill="none" stroke={OLIVE} strokeWidth={2} strokeLinecap="round" style={{ pathLength: link, opacity: panelO }} />

      {[
        { y: 80, t: "Bab 1 · 2 mnt", s: "Himpunan dan relasi", f: 0.72 },
        { y: 195, t: "Bab 2 · 3 mnt", s: "Fungsi dan grafik", f: 0.76 },
        { y: 310, t: "Bab 3 · 4 mnt", s: "Komposisi dan invers", f: 0.8 }
      ].map((c) => (
        <Win key={c.t} p={p} from={c.f - 0.04} to={c.f + 0.06} dx={90}>
          <rect x={650} y={c.y} width={310} height={100} rx={12} fill="#fff" stroke={INK} strokeWidth={2} />
          <text x={796} y={c.y + 44} className="ls-card-h">{c.t}</text>
          <text x={796} y={c.y + 68} className="ls-card-s">{c.s}</text>
        </Win>
      ))}

      {nodes.map((n, i) => <Dot key={IDS[i]} i={i} n={n} />)}

      <motion.g style={{ opacity: panelO }}>
        <rect x={440} y={60} width={520} height={330} rx={14} fill="#fff" stroke={INK} strokeWidth={2} />
        <path d="M440 74 a14 14 0 0 1 14 -14 h492 a14 14 0 0 1 14 14 v36 h-520 z" fill={INK} />
        <text x={462} y={92} className="ls-panel-h">Tanya Nara</text>
        <rect x={462} y={128} width={430} height={44} rx={10} fill="#f4f6f1" stroke={SAGE} />
        <text x={478} y={156} className="ls-panel-t">Hitung (f∘g)(2) untuk f(x)=2x+3, g(x)=x²</text>
        <g transform="translate(478 218)"><Reveal p={p} id="ls-r1" from={0.46} to={0.5} w={400}><text className="ls-panel-t">g(2) = 2² = 4</text></Reveal></g>
        <g transform="translate(478 258)"><Reveal p={p} id="ls-r2" from={0.5} to={0.54} w={400}><text className="ls-panel-t">f(4) = 2 · 4 + 3 = 11</text></Reveal></g>
        <g transform="translate(462 288)"><Reveal p={p} id="ls-r3" from={0.54} to={0.58} w={440} h={60}><rect y={0} width={430} height={46} rx={10} fill={LIME} /><text x={16} y={30} className="ls-panel-h">(f∘g)(2) = 11</text></Reveal></g>
      </motion.g>

      <Win p={p} from={0.86} to={0.93} dx={0}>
        <rect x={650} y={425} width={310} height={92} rx={12} fill={INK} />
        <circle cx={684} cy={471} r={11} fill={LIME} /><path d="M678.5 471 l4 4 l7.5 -8" fill="none" stroke={INK} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={718} cy={471} r={11} fill={LIME} /><path d="M712.5 471 l4 4 l7.5 -8" fill="none" stroke={INK} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={752} cy={471} r={11} fill={DANGER} /><path d="M747 466 l10 10 M757 466 l-10 10" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" />
        <text x={782} y={466} className="ls-tray-a">salah tercatat</text>
        <text x={782} y={484} className="ls-tray-b">Bank Soal Salah</text>
      </Win>
      <motion.circle r={7} fill={DANGER} stroke="#fff" strokeWidth={2} style={{ x: tokenX, y: tokenY, opacity: tokenO }} />

      <path d={TICKS} stroke="#b9c4b5" strokeWidth={1.2} />
      <motion.path d="M0 530 l7 -12 h-14 z" fill={LIME} stroke={INK} strokeWidth={1.5} style={{ x: markX }} />
    </motion.svg>
  );
}

const STEPS = [
  { k: "Input", d: "Unggah PDF, slide, foto catatan, atau tempel tautan video. Tanka membaca dan merapikan isinya." },
  { k: "Baca", d: "Baris-baris penting menjadi konsep, lengkap dengan prasyaratnya, lalu disusun jadi bab pendek." },
  { k: "Tanya", d: "Mentok di satu langkah? Tanya Nara. Penjelasannya langsung ke rumus dan langkah hitungnya." },
  { k: "Uji", d: "Kuis dari materimu sendiri. Soal yang salah masuk Bank Soal Salah untuk diulang." }
] as const;
const VBS = ["170 20 340 490", "290 110 600 330", "430 50 540 350", "630 50 340 480"];

function useNarrow(): boolean {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 720px)");
    const on = (): void => setNarrow(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return narrow;
}

export function LearningStory({ container }: { container: RefObject<HTMLElement | null> }) {
  const ref = useRef<HTMLElement>(null);
  const [step, setStep] = useState(0);
  const narrow = useNarrow();
  const { scrollYProgress } = useScroll({ target: ref, container, offset: ["start start", "end end"] });
  const p = useSpring(
    scrollYProgress,
    narrow
      ? { stiffness: 180, damping: 26, mass: 0.3 }
      : { stiffness: 80, damping: 24, mass: 0.6 }
  );
  useMotionValueEvent(p, "change", (v) => setStep(v < 0.25 ? 0 : v < 0.5 ? 1 : v < 0.75 ? 2 : 3));

  return (
    <section id="alur-cerita" className="ls-story" ref={ref} aria-label="Dari materi mentah sampai siap diuji">
      <div className="ls-sticky">
        <h2 className="ls-title">Dari tumpukan materi ke bab yang siap diuji.</h2>
        <LearningScene progress={p} vb={narrow ? VBS[step] : undefined} />
        <ol className="ls-steps">
          {STEPS.map((s, i) => (
            <li key={s.k} className={i === step ? "on" : ""} aria-current={i === step ? "step" : undefined}>
              <b>{String(i + 1).padStart(2, "0")} {s.k}</b>
              <span>{s.d}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
