import { motion, useReducedMotion } from "motion/react";

const EASE = [0.16, 1, 0.3, 1] as const;
const INK = "#18221f";
const LIME = "#c8f064";
const SAGE = "#dce2da";
const OLIVE = "#4b6623";

const IN_PATHS = [
  "M170 105 C 225 105, 215 210, 246 210",
  "M170 210 C 205 210, 215 210, 246 210",
  "M170 315 C 225 315, 215 210, 246 210"
];
const OUT_PATHS = [
  "M314 210 C 350 210, 345 100, 392 100",
  "M314 210 C 350 210, 350 210, 392 210",
  "M314 210 C 350 210, 345 320, 392 320"
];

/** 
 * Motion graphic hero: alur data materi mentah (PDF/Video/Slide) masuk ke Nara,
 * diproses secara cerdas, lalu keluar menjadi modul bab ringkas 3 menit.
 * Menggunakan whileInView (once: false) agar animasi memicu ulang secara anggun
 * setiap kali pengguna scroll masuk dan kembali ke seksi ini.
 */
export function HeroGraphic() {
  const reduce = useReducedMotion();

  return (
    <svg
      className="lm-hero-graphic"
      viewBox="0 0 560 420"
      role="img"
      aria-label="Materi PDF, video, dan slide diolah Nara menjadi bab-bab pendek"
    >
      {/* 1. Jalur dasar yang terlukis saat scroll in-view */}
      {[...IN_PATHS, ...OUT_PATHS].map((d, i) => (
        <motion.path
          key={`base-${d}`}
          d={d}
          fill="none"
          stroke={i < 3 ? "#b0c49b" : "#658245"}
          strokeWidth={2}
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0.3 }}
          whileInView={{ pathLength: 1, opacity: 1 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{
            duration: 0.85,
            ease: EASE,
            delay: i < 3 ? 0.25 + (i % 3) * 0.1 : 0.75 + (i % 3) * 0.1
          }}
        />
      ))}

      {/* 2. Jalur arus data putus-putus elektrik yang mengalir tanpa henti */}
      {!reduce &&
        [...IN_PATHS, ...OUT_PATHS].map((d, i) => (
          <path
            key={`flow-${d}`}
            d={d}
            fill="none"
            stroke={i < 3 ? LIME : "#a3e635"}
            strokeWidth={1.8}
            strokeDasharray="6 8"
            className="lm-flow-dash"
            opacity={0.85}
          />
        ))}

      {/* 3. Titik partikel data kinetik berdenyut */}
      {!reduce &&
        [...IN_PATHS, ...OUT_PATHS].map((d, i) => (
          <circle key={`dot-${d}`} r={3.8} fill={LIME} stroke={INK} strokeWidth={1}>
            <animateMotion
              dur={`${2.2 + (i % 3) * 0.35}s`}
              begin={`${0.5 + i * 0.3}s`}
              repeatCount="indefinite"
              path={d}
            />
          </circle>
        ))}

      {/* 4. Materi mentah: PDF, video, slide (masuk dari kiri saat scroll) */}
      {[
        { y: 60, rot: -4, kind: "pdf" },
        { y: 165, rot: 3, kind: "video" },
        { y: 270, rot: -2, kind: "slide" }
      ].map((s, i) => (
        <motion.g
          key={s.kind}
          initial={{ opacity: 0, x: -32 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.65, ease: EASE, delay: 0.08 + i * 0.1 }}
        >
          <motion.g
            animate={reduce ? undefined : { y: [0, -6, 0], rotate: [s.rot, s.rot + 2, s.rot] }}
            transition={{ duration: 4.5 + i, repeat: Infinity, ease: "easeInOut" }}
          >
            <rect x={20} y={s.y} width={150} height={90} rx={10} fill="#fff" stroke={SAGE} strokeWidth={1.5} />
            {s.kind === "pdf" && (
              <>
                <rect x={34} y={s.y + 14} width={34} height={14} rx={3} fill={INK} />
                {[0, 1, 2, 3].map((l) => (
                  <rect key={l} x={34} y={s.y + 38 + l * 10} width={l === 3 ? 60 : 112} height={4} rx={2} fill={SAGE} />
                ))}
              </>
            )}
            {s.kind === "video" && (
              <>
                <rect x={34} y={s.y + 12} width={122} height={52} rx={6} fill={INK} />
                <path d={`M 88 ${s.y + 26} L 88 ${s.y + 50} L 108 ${s.y + 38} Z`} fill={LIME} />
                <rect x={34} y={s.y + 72} width={122} height={4} rx={2} fill={SAGE} />
                <rect x={34} y={s.y + 72} width={44} height={4} rx={2} fill={OLIVE} />
              </>
            )}
            {s.kind === "slide" && (
              <>
                <rect x={34} y={s.y + 14} width={64} height={7} rx={3} fill={INK} />
                <rect x={34} y={s.y + 30} width={50} height={46} rx={4} fill={SAGE} />
                {[0, 1, 2].map((l) => (
                  <rect key={l} x={96} y={s.y + 32 + l * 14} width={58} height={4} rx={2} fill={SAGE} />
                ))}
              </>
            )}
          </motion.g>
        </motion.g>
      ))}

      {/* 5. Inti Pemrosesan Nara (muncul dan berdenyut di tengah saat scroll) */}
      <motion.g
        initial={{ scale: 0.35, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: false, amount: 0.2 }}
        transition={{ type: "spring", stiffness: 150, damping: 15, delay: 0.4 }}
        style={{ originX: "280px", originY: "210px" }}
      >
        {!reduce &&
          [0, 1].map((n) => (
            <motion.circle
              key={n}
              cx={280}
              cy={210}
              fill="none"
              stroke={LIME}
              strokeWidth={2}
              initial={{ r: 34, opacity: 0.8 }}
              animate={{ r: [34, 72], opacity: [0.8, 0] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: "easeOut", delay: n * 1.3 }}
            />
          ))}
        <motion.circle
          cx={280}
          cy={210}
          r={50}
          fill="none"
          stroke="#8da868"
          strokeWidth={1.2}
          strokeDasharray="3 7"
          animate={reduce ? undefined : { rotate: 360 }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          style={{ originX: "280px", originY: "210px" }}
        />
        <motion.g
          animate={reduce ? undefined : { scale: [1, 1.05, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          style={{ originX: "280px", originY: "210px" }}
        >
          <circle cx={280} cy={210} r={34} fill={INK} stroke={LIME} strokeWidth={2.5} />
          <path
            d="M280 192 L285 205 L298 210 L285 215 L280 228 L275 215 L262 210 L275 205 Z"
            fill={LIME}
          />
        </motion.g>
      </motion.g>

      {/* 6. Modul Bab Rapi Siap Santap (meluncur dari kanan saat scroll) */}
      {[
        { y: 55, t: "Bab 1", m: "2 mnt" },
        { y: 165, t: "Bab 2", m: "3 mnt" },
        { y: 275, t: "Bab 3", m: "4 mnt" }
      ].map((c, i) => (
        <motion.g
          key={c.t}
          initial={{ opacity: 0, x: 32 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.65, ease: EASE, delay: 0.75 + i * 0.12 }}
        >
          <rect x={392} y={c.y} width={150} height={90} rx={10} fill="#fff" stroke={INK} strokeWidth={1.5} />
          <rect x={406} y={c.y + 14} width={46} height={16} rx={8} fill={LIME} />
          <text x={429} y={c.y + 26} fontSize={10} fontWeight={700} textAnchor="middle" fill={INK} fontFamily="'DM Mono', monospace">
            {c.m}
          </text>
          <text x={406} y={c.y + 52} fontSize={13} fontWeight={800} fill={INK} fontFamily="'Syne', sans-serif">
            {c.t}
          </text>
          <rect x={406} y={c.y + 64} width={122} height={5} rx={2.5} fill={SAGE} />
          <motion.rect
            x={406}
            y={c.y + 64}
            width={122}
            height={5}
            rx={2.5}
            fill={OLIVE}
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: [0, 1 - i * 0.28] }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 1.1, ease: EASE, delay: 1.05 + i * 0.15 }}
            style={{ originX: 0, originY: 0.5 }}
          />
        </motion.g>
      ))}
    </svg>
  );
}