import { useRef, type PointerEvent, type ReactNode, type RefObject } from "react";
import { ArrowRight } from "lucide-react";
import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform, type MotionValue } from "motion/react";
import { Magnetic, SplitWords } from "../motion/MotionKit";
import { SimulatorNaraCard } from "../SimulatorNaraCard";

const EASE = [0.16, 1, 0.3, 1] as const;
const LIME = "#c8f064";
const MUTED = "#8da868";

type Pt = readonly [number, number];
const NET: readonly Pt[] = [[250, 735], [430, 685], [610, 605], [780, 515], [960, 610], [1140, 520], [1000, 330], [1220, 380], [1310, 235]];
const LINKS: ReadonlyArray<readonly [number, number]> = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [3, 6], [6, 7], [7, 8], [5, 7]];
const NAMES: Readonly<Record<number, string>> = { 0: "Himpunan", 1: "Relasi", 2: "Fungsi", 3: "Komposisi" };

const curve = (a: Pt, b: Pt): string => {
  const mx = (a[0] + b[0]) / 2;
  return `M${a[0]} ${a[1]} C ${mx} ${a[1]}, ${mx} ${b[1]}, ${b[0]} ${b[1]}`;
};

const RULES = Array.from({ length: 21 }, (_, i) => `M0 ${i * 44} H1440`).join(" ");
const TICKS = Array.from({ length: 72 }, (_, i) => {
  const a = (i / 72) * Math.PI * 2;
  const r2 = i % 6 === 0 ? 456 : 442;
  const c = (r: number): string => `${(1120 + Math.cos(a) * r).toFixed(1)} ${(450 + Math.sin(a) * r).toFixed(1)}`;
  return `M${c(430)} L${c(r2)}`;
}).join(" ");

function Layer({ mx, my, sp, depth, rise, children }: { mx: MotionValue<number>; my: MotionValue<number>; sp: MotionValue<number>; depth: number; rise: number; children: ReactNode }) {
  const x = useTransform(mx, (v) => v * depth);
  const y = useTransform([my, sp], ([m, s]: number[]) => m * depth * 0.6 + s * rise);
  return <motion.g style={{ x, y }}>{children}</motion.g>;
}

function Tag({ x, y, r, w, bg, fg, text, delay }: { x: number; y: number; r: number; w: number; bg: string; fg: string; text: string; delay: number }) {
  return (
    <motion.g initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 160, damping: 13, delay }} style={{ originX: `${x}px`, originY: `${y}px` }}>
      <g transform={`rotate(${r} ${x} ${y})`}>
        <rect x={x} y={y} width={w} height={34} rx={6} fill={bg} />
        <text x={x + 14} y={y + 22} fontSize={12.5} fontWeight={700} fill={fg} fontFamily="'DM Mono', monospace">{text}</text>
      </g>
    </motion.g>
  );
}

function HeroArt({ mx, my, sp }: { mx: MotionValue<number>; my: MotionValue<number>; sp: MotionValue<number> }) {
  return (
    <svg className="hx-art" viewBox="0 0 1440 860" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <Layer mx={mx} my={my} sp={sp} depth={6} rise={30}>
        <path d={RULES} stroke="#22302b" strokeWidth={1} fill="none" />
        <path d="M120 0 V860 M1320 0 V860" stroke={LIME} strokeOpacity={0.18} strokeWidth={1} />
        <motion.circle cx={1120} cy={450} r={430} fill="none" stroke="#2c3d36" strokeWidth={1.5} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2.4, ease: EASE, delay: 0.2 }} />
        <path d={TICKS} stroke="#2c3d36" strokeWidth={1.2} />
      </Layer>

      <Layer mx={mx} my={my} sp={sp} depth={16} rise={80}>
        <g transform="rotate(-5 1010 420)">
          <rect x={800} y={120} width={420} height={560} rx={14} fill="#1f2c27" stroke="#33463e" strokeWidth={1.5} />
          <rect x={832} y={158} width={110} height={14} rx={3} fill="#33463e" />
          {Array.from({ length: 14 }, (_, i) => (
            <rect key={i} x={832} y={200 + i * 30} width={[330, 290, 340, 250, 310, 340, 280, 330, 300, 240, 320, 340, 270, 200][i]} height={7} rx={3.5} fill={i % 3 === 0 ? "#4a6a3a" : "#2e3f38"} />
          ))}
          <motion.rect x={812} width={396} height={3} rx={1.5} fill={LIME} initial={{ y: 190, opacity: 0 }} animate={{ y: [190, 600], opacity: [0, 1, 1, 0] }} transition={{ duration: 3.4, delay: 1, ease: "easeInOut", times: [0, 0.05, 0.92, 1] }} />
          <text x={1172} y={150} fontSize={11} fill={MUTED} textAnchor="end" fontFamily="'DM Mono', monospace">§ 2.1 fungsi</text>
        </g>
        <motion.path d="M790 300 C 740 300, 740 380, 690 380" fill="none" stroke={MUTED} strokeWidth={1.4} strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, delay: 2 }} />
        <text x={560} y={372} fontSize={12} fill={MUTED} fontFamily="'DM Mono', monospace">prasyarat dicatat</text>
      </Layer>

      <Layer mx={mx} my={my} sp={sp} depth={26} rise={140}>
        {LINKS.map(([a, b], i) => (
          <g key={`${a}-${b}`}>
            <motion.path d={curve(NET[a], NET[b])} fill="none" stroke="#3d5a43" strokeWidth={2} strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.3, ease: EASE, delay: 0.9 + i * 0.14 }} />
            <path d={curve(NET[a], NET[b])} className="hx-flow" fill="none" stroke={LIME} strokeWidth={2} strokeLinecap="round" />
          </g>
        ))}
        {NET.map((p, i) => (
          <motion.g key={i} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200, damping: 14, delay: 1.1 + i * 0.12 }} style={{ originX: `${p[0]}px`, originY: `${p[1]}px` }}>
            <circle cx={p[0]} cy={p[1]} r={i === 3 ? 13 : 8} fill="#18221f" stroke={LIME} strokeWidth={2} />
            {i === 3 && <circle cx={p[0]} cy={p[1]} r={4} fill={LIME} />}
            {NAMES[i] && <text x={p[0]} y={p[1] + 32} textAnchor="middle" fontSize={12} fill="#b5c2bc" fontFamily="'DM Mono', monospace">{NAMES[i]}</text>}
          </motion.g>
        ))}
      </Layer>

      <Layer mx={mx} my={my} sp={sp} depth={40} rise={220}>
        <Tag x={110} y={640} r={-4} w={158} bg={LIME} fg="#18221f" text="BAB 1 · 2 MNT" delay={2.6} />
        <Tag x={330} y={700} r={3} w={158} bg="#fcfdfa" fg="#18221f" text="BAB 2 · 3 MNT" delay={2.8} />
        <Tag x={640} y={735} r={-3} w={176} bg="#c2410c" fg="#fff" text="SALAH TERCATAT" delay={3} />
      </Layer>
    </svg>
  );
}

export function HeroStage({ container, onActionLaunch }: { container: RefObject<HTMLElement | null>; onActionLaunch: () => void }) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const mx = useSpring(rx, { stiffness: 60, damping: 20, mass: 0.8 });
  const my = useSpring(ry, { stiffness: 60, damping: 20, mass: 0.8 });
  const { scrollYProgress } = useScroll({ target: ref, container, offset: ["start start", "end start"] });
  const sp = useSpring(scrollYProgress, { stiffness: 90, damping: 26 });

  const onMove = (e: PointerEvent<HTMLElement>): void => {
    if (reduce || e.pointerType !== "mouse" || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    rx.set(((e.clientX - r.left) / r.width - 0.5) * 2);
    ry.set(((e.clientY - r.top) / r.height - 0.5) * 2);
  };

  return (
    <section className="hx" ref={ref} onPointerMove={onMove} aria-label="Pembuka">
      <HeroArt mx={mx} my={my} sp={sp} />
      <div className="hx-inner">
        <div className="hx-left">
          <p className="hx-kicker">PLATFORM BELAJAR MANDIRI</p>
          <h1 className="hx-title">
            <SplitWords text="Ubah materi apapun," delay={0.1} />
            <br />
            <span className="hl"><SplitWords text="jadi langsung bisa dipahami." delay={0.35} /></span>
          </h1>
          <p className="hx-sub">Unggah PDF, slide, foto catatan, atau tempel tautan video. Tanka memecahnya jadi bab pendek, menjelaskan rumus langkah demi langkah, lalu menguji pemahamanmu.</p>
          <div className="hx-cta">
            <Magnetic>
              <button className="hx-btn" onClick={onActionLaunch}>
                <span>Mulai Belajar Sekarang, Gratis</span>
                <ArrowRight size={18} />
              </button>
            </Magnetic>
            <a className="hx-link" href="#alur-cerita">Lihat cara kerjanya</a>
          </div>
          <ul className="hx-chips" aria-label="Jenis materi">
            <li>PDF</li><li>Slide</li><li>Foto catatan</li><li>Tautan YouTube</li>
          </ul>
        </div>
        <div className="hx-sim" id="tanya-nara">
          <SimulatorNaraCard onActionLaunch={onActionLaunch} />
        </div>
      </div>
      <svg className="hx-edge" viewBox="0 0 1440 90" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 90 V46 C 200 8, 420 78, 720 40 S 1230 2, 1440 44 V90 Z" fill="#fcfdfa" />
        <path d="M0 46 C 200 8, 420 78, 720 40 S 1230 2, 1440 44" fill="none" stroke={LIME} strokeWidth={3} />
      </svg>
    </section>
  );
}

export default HeroStage;
