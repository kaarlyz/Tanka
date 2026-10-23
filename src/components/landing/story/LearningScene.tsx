import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { animate, motion, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, useSpring, useTransform, type MotionValue } from "motion/react";

const INK = "#18221f";
const LIME = "#c8f064";
const SAGE = "#dce2da";
const OLIVE = "#4b6623";
const DANGER = "#c2410c";

type P = MotionValue<number>;

function Fade({ p, from, to, dy = 14, children }: { p: P; from: number; to: number; dy?: number; children: ReactNode }) {
  const opacity = useTransform(p, [from, to], [0, 1]);
  const y = useTransform(p, [from, to], [dy, 0]);
  return <motion.g style={{ opacity, y }}>{children}</motion.g>;
}

function Draw({ p, from, to, d, stroke = OLIVE, w = 2, dash }: { p: P; from: number; to: number; d: string; stroke?: string; w?: number; dash?: string }) {
  const pathLength = useTransform(p, [from, to], [0, 1]);
  const opacity = useTransform(p, [from, from + 0.008], [0, 1]);
  return <motion.path d={d} fill="none" stroke={stroke} strokeWidth={w} strokeLinecap="round" strokeDasharray={dash} style={{ pathLength, opacity }} />;
}

function TextLine({ p, i, w }: { p: P; i: number; w: number }) {
  const t = 0.03 + i * 0.026;
  const fill = useTransform(p, [t, t + 0.025], [SAGE, "#8da868"]);
  return <motion.rect x={64} y={104 + i * 24} width={w} height={7} rx={3.5} style={{ fill }} />;
}

function Scan({ p }: { p: P }) {
  const y = useTransform(p, [0, 0.26], [92, 328]);
  const opacity = useTransform(p, [0, 0.02, 0.26, 0.3], [0, 1, 1, 0]);
  return <motion.rect x={52} width={176} height={3} rx={1.5} fill={LIME} style={{ y, opacity }} />;
}

function Pop({ p, from, to, x, y, children }: { p: P; from: number; to: number; x: number; y: number; children: ReactNode }) {
  const scale = useTransform(p, [from, to], [0.2, 1]);
  const opacity = useTransform(p, [from, from + 0.02], [0, 1]);
  return <motion.g style={{ opacity, scale, x, y, originX: 0.5, originY: 0.5 }}>{children}</motion.g>;
}

const NODES = [
  { id: "himpunan", label: "Himpunan", x: 350, y: 235, t: 0.3 },
  { id: "relasi", label: "Relasi", x: 450, y: 235, t: 0.36 },
  { id: "fungsi", label: "Fungsi", x: 550, y: 235, t: 0.42 },
  { id: "komposisi", label: "Komposisi", x: 550, y: 140, t: 0.48 },
  { id: "grafik", label: "Grafik", x: 650, y: 320, t: 0.48 },
  { id: "invers", label: "Invers", x: 650, y: 140, t: 0.54 }
] as const;

const LINKS: ReadonlyArray<readonly [string, string, number]> = [
  ["himpunan", "relasi", 0.36],
  ["relasi", "fungsi", 0.42],
  ["fungsi", "komposisi", 0.48],
  ["fungsi", "grafik", 0.5],
  ["komposisi", "invers", 0.54]
];
const at = (id: string) => NODES.find((n) => n.id === id) ?? NODES[0];

const CHAPTERS = [
  { y: 64, t: "Bab 1", s: "Himpunan dan relasi", m: "2 mnt", f: 0.62 },
  { y: 158, t: "Bab 2", s: "Fungsi dan grafik", m: "3 mnt", f: 0.68 },
  { y: 252, t: "Bab 3", s: "Komposisi dan invers", m: "4 mnt", f: 0.74 }
] as const;

/** Satu adegan SVG yang berevolusi dari progress 0..1: materi, konsep, bab, uji. */
export function LearningScene({ progress, vb }: { progress: P; vb?: string }) {
  const p = progress;
  return (
    <motion.svg className="ls-svg" viewBox="0 0 1000 440" animate={vb ? { viewBox: vb } : undefined} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} role="img" aria-label="Materi mentah diurai menjadi konsep, disusun jadi bab pendek, lalu diuji">
      {/* halaman materi */}
      <Fade p={p} from={0} to={0.02} dy={0}>
        <rect x={40} y={60} width={210} height={320} rx={12} fill="#fff" stroke={SAGE} strokeWidth={1.5} />
        <rect x={64} y={80} width={70} height={12} rx={3} fill={INK} />
      </Fade>
      {[150, 170, 120, 160, 150, 100, 160, 140, 110, 160, 130, 90].map((w, i) => (
        <TextLine key={i} p={p} i={i} w={w} />
      ))}
      <Scan p={p} />

      {/* jalur dari halaman ke konsep */}
      {[130, 230, 330].map((y, i) => (
        <Draw key={y} p={p} from={0.22 + i * 0.02} to={0.34 + i * 0.02} d={`M250 ${y} C 290 ${y}, 300 235, 334 235`} stroke="#8da868" />
      ))}

      {/* prasyarat */}
      {LINKS.map(([a, b, t]) => {
        const s = at(a);
        const e = at(b);
        return <Draw key={`${a}${b}`} p={p} from={t - 0.05} to={t} d={`M${s.x + 16} ${s.y} L${e.x - 16 * Math.sign(e.x - s.x)} ${e.y}`.replace(/L(\S+) (\S+)/, (_m, x, y) => `L${x} ${y}`)} w={2.2} />;
      })}

      {/* simpul konsep */}
      {NODES.map((n) => (
        <Pop key={n.id} p={p} from={n.t - 0.05} to={n.t} x={n.x} y={n.y}>
          <circle r={15} fill={n.id === "invers" ? LIME : "#fff"} stroke={INK} strokeWidth={2} />
          <circle r={5} fill={INK} />
          <text y={34} textAnchor="middle" fontSize={12} fontWeight={600} fill={INK} fontFamily="'DM Mono', monospace">{n.label}</text>
        </Pop>
      ))}

      {/* bab */}
      {CHAPTERS.map((c) => (
        <Fade key={c.t} p={p} from={c.f - 0.05} to={c.f} dy={22}>
          <rect x={750} y={c.y} width={230} height={78} rx={10} fill="#fff" stroke={INK} strokeWidth={1.5} />
          <rect x={766} y={c.y + 14} width={50} height={18} rx={9} fill={LIME} />
          <text x={791} y={c.y + 27} textAnchor="middle" fontSize={11} fontWeight={700} fill={INK} fontFamily="'DM Mono', monospace">{c.m}</text>
          <text x={766} y={c.y + 54} fontSize={14} fontWeight={800} fill={INK} fontFamily="'Syne', sans-serif">{c.t}</text>
          <text x={766} y={c.y + 70} fontSize={11.5} fill="#56615d" fontFamily="'Inter', sans-serif">{c.s}</text>
        </Fade>
      ))}

      {/* uji */}
      <Fade p={p} from={0.82} to={0.9}>
        <rect x={750} y={352} width={230} height={52} rx={10} fill={INK} />
        <circle cx={776} cy={378} r={9} fill={LIME} />
        <path d="M771.5 378 l3.2 3.2 l6 -6.4" fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={802} cy={378} r={9} fill={LIME} />
        <path d="M797.5 378 l3.2 3.2 l6 -6.4" fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={828} cy={378} r={9} fill={DANGER} />
        <path d="M824.5 374.5 l7 7 M831.5 374.5 l-7 7" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
      </Fade>
      <Fade p={p} from={0.92} to={0.98} dy={6}>
        <text x={850} y={374} fontSize={10.5} fill="#eff5ec" fontFamily="'DM Mono', monospace">salah tercatat</text>
        <text x={850} y={388} fontSize={10.5} fill={LIME} fontFamily="'DM Mono', monospace">Bank Soal Salah</text>
      </Fade>
    </motion.svg>
  );
}

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

/** Hero: adegan berjalan sendiri sekali saat halaman dimuat. */
export function HeroScene() {
  const reduce = useReducedMotion();
  const narrow = useNarrow();
  const p = useMotionValue(reduce ? 1 : 0);
  useEffect(() => {
    if (reduce) {
      p.set(1);
      return;
    }
    const c = animate(p, 1, { duration: 7, ease: [0.45, 0, 0.2, 1], delay: 0.8 });
    return () => c.stop();
  }, [p, reduce]);
  return (
    <section className="ls-hero" aria-label="Bagaimana Tanka mengolah materi">
      <LearningScene progress={p} vb={narrow ? "300 60 420 330" : undefined} />
    </section>
  );
}

const STEPS = [
  { k: "Input", d: "Unggah PDF, slide, foto catatan, atau tempel tautan video. Tanka membaca dan merapikan isinya." },
  { k: "Baca", d: "Konsep diurai beserta prasyaratnya, lalu disusun jadi bab pendek yang selesai dalam beberapa menit." },
  { k: "Tanya", d: "Mentok di satu langkah? Tanya Nara. Penjelasannya langsung ke rumus dan langkah hitungnya." },
  { k: "Uji", d: "Kuis dari materimu sendiri. Soal yang salah masuk Bank Soal Salah untuk diulang." }
] as const;

/** Adegan sticky: scroll menggerakkan progress yang sama. */
export function LearningStory({ container }: { container: RefObject<HTMLElement | null> }) {
  const ref = useRef<HTMLElement>(null);
  const [step, setStep] = useState(0);
  const narrow = useNarrow();
  const { scrollYProgress } = useScroll({ target: ref, container, offset: ["start start", "end end"] });
  const p = useSpring(scrollYProgress, { stiffness: 80, damping: 24, mass: 0.6 });
  useMotionValueEvent(p, "change", (v) => setStep(v < 0.24 ? 0 : v < 0.6 ? 1 : v < 0.8 ? 2 : 3));
  const vbs = ["20 40 260 360", "300 70 420 320", "730 40 270 380", "730 40 270 380"];

  return (
    <section id="alur-cerita" className="ls-story" ref={ref} aria-label="Dari materi mentah sampai siap diuji">
      <div className="ls-sticky">
        <h2 className="ls-title">Dari tumpukan materi ke bab yang siap diuji.</h2>
        <LearningScene progress={p} vb={narrow ? vbs[step] : undefined} />
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
