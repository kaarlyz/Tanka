import { useRef, type ReactNode, type RefObject } from "react";
import { ArrowRight } from "lucide-react";
import { motion, useScroll, useSpring } from "motion/react";

export interface StepperSectionProps {
  onActionLaunch: () => void;
  container: RefObject<HTMLElement | null>;
}

const VIEW = { once: true, margin: "-15% 0px" } as const;
const INK = "#18221f";
const LIME = "#c8f064";
const SAGE = "#dce2da";

function Art({ children }: { children: ReactNode }) {
  return <svg viewBox="0 0 240 150" className="sp-art" aria-hidden="true">{children}</svg>;
}

const ART: readonly ReactNode[] = [
  <Art key="a">
    <path d="M30 110 h180 l-14 24 h-152 z" fill="#fff" stroke={INK} strokeWidth={2} strokeLinejoin="round" />
    {["PDF", "SLIDE", "FOTO", "YT"].map((t, i) => (
      <motion.g key={t} initial={{ y: -60, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={VIEW} transition={{ type: "spring", stiffness: 120, damping: 14, delay: i * 0.12 }}>
        <rect x={34 + i * 44} y={56 + (i % 2) * 8} width={38} height={46} rx={5} fill={i === 0 ? LIME : "#fff"} stroke={INK} strokeWidth={2} />
        <text x={53 + i * 44} y={84 + (i % 2) * 8} textAnchor="middle" fontSize={9.5} fontWeight={700} fill={INK} fontFamily="'DM Mono', monospace">{t}</text>
      </motion.g>
    ))}
  </Art>,
  <Art key="b">
    {[0, 1, 2].map((i) => (
      <g key={i}>
        <rect x={30} y={22 + i * 38} width={180} height={30} rx={8} fill="#fff" stroke={INK} strokeWidth={2} />
        <rect x={42} y={34 + i * 38} width={120} height={6} rx={3} fill={SAGE} />
        <motion.rect x={42} y={34 + i * 38} width={120} height={6} rx={3} fill="#4b6623" initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 - i * 0.3 }} viewport={VIEW} transition={{ duration: 1, delay: 0.2 + i * 0.2, ease: [0.16, 1, 0.3, 1] }} style={{ originX: 0, originY: 0.5 }} />
        <text x={186} y={42 + i * 38} textAnchor="middle" fontSize={10} fontWeight={700} fill={INK} fontFamily="'DM Mono', monospace">{2 + i} mnt</text>
      </g>
    ))}
  </Art>,
  <Art key="c">
    <rect x={20} y={18} width={130} height={36} rx={10} fill="#fff" stroke={INK} strokeWidth={2} />
    <text x={32} y={41} fontSize={12} fill={INK} fontFamily="'DM Mono', monospace">g(2) = ?</text>
    <rect x={70} y={66} width={150} height={66} rx={10} fill={INK} />
    {["g(2) = 2² = 4", "f(4) = 11"].map((t, i) => (
      <motion.text key={t} x={84} y={92 + i * 24} fontSize={12.5} fill={i === 1 ? LIME : "#eff5ec"} fontFamily="'DM Mono', monospace" initial={{ opacity: 0, x: -8 }} whileInView={{ opacity: 1, x: 0 }} viewport={VIEW} transition={{ delay: 0.3 + i * 0.5, duration: 0.5 }}>{t}</motion.text>
    ))}
  </Art>,
  <Art key="d">
    {[0, 1, 2].map((i) => (
      <motion.g key={i} initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={VIEW} transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.1 + i * 0.2 }} style={{ originX: `${50 + i * 70}px`, originY: "50px" }}>
        <circle cx={50 + i * 70} cy={50} r={22} fill={i === 2 ? "#c2410c" : LIME} stroke={INK} strokeWidth={2} />
        {i === 2 ? <path d={`M${41 + i * 70} 41 l18 18 M${59 + i * 70} 41 l-18 18`} stroke="#fff" strokeWidth={3} strokeLinecap="round" /> : <path d={`M${40 + i * 70} 51 l7 7 l13 -14`} fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />}
      </motion.g>
    ))}
    <motion.path d="M190 76 C 190 100, 160 108, 130 112" fill="none" stroke="#c2410c" strokeWidth={2} strokeLinecap="round" strokeDasharray="5 5" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={VIEW} transition={{ delay: 0.9, duration: 0.8 }} />
    <rect x={30} y={106} width={110} height={30} rx={8} fill={INK} />
    <text x={42} y={126} fontSize={11} fontWeight={700} fill={LIME} fontFamily="'DM Mono', monospace">Bank Soal Salah</text>
  </Art>
];

const STEPS = [
  { k: "Input", t: "Masukkan materimu", d: "PDF, slide, foto catatan, atau tautan video. Tanka membaca dan merapikannya jadi satu modul.", out: "Hasil: modul yang tersusun dari materimu." },
  { k: "Baca", t: "Baca bab yang pendek", d: "Setiap bab diberi perkiraan waktu baca, jadi kamu tahu persis berapa menit yang dibutuhkan.", out: "Hasil: bab pendek dengan rumus yang terbaca jelas." },
  { k: "Tanya", t: "Tanya Nara saat mentok", d: "Nara menjelaskan langsung ke rumus dan menurunkan tiap langkah hitungnya.", out: "Hasil: penjelasan literal, tanpa perumpamaan." },
  { k: "Uji", t: "Uji, lalu ulangi yang salah", d: "Kuis dibuat dari materimu sendiri. Soal yang keliru masuk Bank Soal Salah.", out: "Hasil: daftar ulang yang fokus pada kelemahanmu." }
] as const;

export function StepperSection({ onActionLaunch, container }: StepperSectionProps) {
  const listRef = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({ target: listRef, container, offset: ["start 70%", "end 55%"] });
  const fill = useSpring(scrollYProgress, { stiffness: 90, damping: 24 });
  return (
    <section id="alur" className="sp-section" aria-labelledby="sp-title">
      <div className="sp-head">
        <p className="section-kicker">CARA KERJA</p>
        <h2 id="sp-title">Empat langkah, satu kebiasaan belajar.</h2>
      </div>
      <ol className="sp-list" ref={listRef}>
        <span className="sp-rail" aria-hidden="true"><motion.span style={{ scaleY: fill }} /></span>
        {STEPS.map((s, i) => (
          <li key={s.k} className="sp-row">
            <motion.span className="sp-dot" aria-hidden="true" initial={{ scale: 0.6 }} whileInView={{ scale: 1 }} viewport={VIEW}>{i + 1}</motion.span>
            <div className="sp-copy">
              <small>{s.k.toUpperCase()}</small>
              <h3>{s.t}</h3>
              <p>{s.d}</p>
              <em>{s.out}</em>
            </div>
            <div className="sp-visual">{ART[i]}</div>
          </li>
        ))}
      </ol>
      <div className="sp-end">
        <button className="cx-btn" onClick={onActionLaunch}>Mulai dari langkah pertama <ArrowRight size={18} /></button>
      </div>
    </section>
  );
}

export default StepperSection;
