import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { Magnetic } from "./motion/MotionKit";

export interface CtaBannerProps {
  onActionLaunch: () => void;
}

const VIEW = { once: true, margin: "-20% 0px" } as const;

export function CtaBanner({ onActionLaunch }: CtaBannerProps) {
  return (
    <section className="cx" aria-labelledby="cx-title">
      <svg className="cx-art" viewBox="0 0 600 460" aria-hidden="true">
        <motion.circle cx={380} cy={230} r={200} fill="none" stroke="#2c3d36" strokeWidth={1.5} initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={VIEW} transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }} />
        <g transform="rotate(5 380 230)">
          <rect x={270} y={70} width={220} height={320} rx={12} fill="#1f2c27" stroke="#33463e" strokeWidth={1.5} />
          <rect x={292} y={96} width={70} height={10} rx={3} fill="#33463e" />
          {Array.from({ length: 9 }, (_, i) => <rect key={i} x={292} y={130 + i * 22} width={[170, 150, 176, 120, 160, 176, 140, 170, 100][i]} height={6} rx={3} fill={i % 3 === 0 ? "#4a6a3a" : "#2e3f38"} />)}
        </g>
        <motion.g initial={{ scale: 1.8, rotate: -24, opacity: 0 }} whileInView={{ scale: 1, rotate: -8, opacity: 1 }} viewport={VIEW} transition={{ type: "spring", stiffness: 140, damping: 11, delay: 0.5 }} style={{ originX: "400px", originY: "300px" }}>
          <circle cx={400} cy={300} r={58} fill="#c8f064" stroke="#fcfdfa" strokeWidth={3} />
          <path d="M374 302 l18 18 l36 -40" fill="none" stroke="#18221f" strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
        </motion.g>
        <motion.path d="M60 400 C 140 400, 180 330, 250 300" fill="none" stroke="#c8f064" strokeWidth={2} strokeLinecap="round" strokeDasharray="3 10" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={VIEW} transition={{ duration: 1.4, delay: 0.3 }} />
      </svg>
      <div className="cx-inner">
        <p className="cx-kicker">SIAP MULAI</p>
        <h2 id="cx-title">Satu materi hari ini, satu bab yang benar-benar paham.</h2>
        <p className="cx-sub">Buka materi pertamamu sekarang. Bebas iklan, tanpa distraksi, dan dapat dibaca offline.</p>
        <div className="cx-actions">
          <Magnetic><button className="cx-btn" onClick={onActionLaunch}>Mulai Belajar Sekarang, Gratis <ArrowRight size={18} /></button></Magnetic>
          <a className="cx-link" href="#tanya-nara">Coba Nara dulu</a>
        </div>
        <ul className="cx-chips" aria-label="Yang kamu dapat">
          <li>Bebas iklan</li><li>Bisa dibaca offline</li><li>Dapat dipasang sebagai PWA</li>
        </ul>
      </div>
    </section>
  );
}

export default CtaBanner;
