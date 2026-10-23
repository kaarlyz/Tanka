import { useRef, type ReactNode, type PointerEvent, type RefObject } from "react";
import {
  motion,
  useScroll,
  useSpring,
  useMotionValue,
  useMotionTemplate,
  useTransform,
  useReducedMotion
} from "motion/react";

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

/** Garis progres scroll di puncak halaman. Taruh sebagai anak pertama container. */
export function ScrollProgress({ container }: { container: RefObject<HTMLElement | null> }) {
  const { scrollYProgress } = useScroll({ container });
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 24, mass: 0.4 });
  return <motion.div className="lm-progress" style={{ scaleX }} aria-hidden="true" />;
}

/** Headline muncul kata per kata dari balik masker. Momen load utama di hero. */
export function SplitWords({
  text,
  className,
  delay = 0
}: {
  text: string;
  className?: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={className} aria-label={text}>
      {text.split(" ").map((word, i) => (
        <span className="lm-word-mask" aria-hidden="true" key={`${word}-${i}`}>
          <motion.span
            className="lm-word"
            initial={{ y: "115%", rotate: 5 }}
            animate={{ y: 0, rotate: 0 }}
            transition={{ duration: 0.95, ease: EASE_OUT, delay: delay + i * 0.07 }}
          >
            {word}&nbsp;
          </motion.span>
        </span>
      ))}
    </span>
  );
}

/** Tombol/elemen yang tertarik pelan ke arah kursor. */
export function Magnetic({ children, strength = 0.28 }: { children: ReactNode; strength?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 16, mass: 0.5 });
  const sy = useSpring(y, { stiffness: 220, damping: 16, mass: 0.5 });

  const onMove = (e: PointerEvent<HTMLSpanElement>): void => {
    if (reduce || !ref.current || e.pointerType !== "mouse") return;
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  };
  const onLeave = (): void => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.span
      ref={ref}
      className="lm-magnetic"
      style={{ x: sx, y: sy }}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      {children}
    </motion.span>
  );
}

/** Kartu dengan tilt 3D halus + sorot lime yang mengikuti kursor. */
export function TiltCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const rx = useSpring(useMotionValue(0), { stiffness: 180, damping: 18 });
  const ry = useSpring(useMotionValue(0), { stiffness: 180, damping: 18 });
  const mx = useMotionValue(50);
  const my = useMotionValue(50);
  const glow = useMotionTemplate`radial-gradient(280px circle at ${mx}% ${my}%, rgba(200,240,100,0.26), transparent 70%)`;

  const onMove = (e: PointerEvent<HTMLDivElement>): void => {
    if (reduce || !ref.current || e.pointerType !== "mouse") return;
    const r = ref.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    mx.set(px * 100);
    my.set(py * 100);
    ry.set((px - 0.5) * 8);
    rx.set((0.5 - py) * 8);
  };
  const onLeave = (): void => {
    rx.set(0);
    ry.set(0);
  };

  return (
    <motion.div
      ref={ref}
      className={`lm-tilt ${className}`}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      <motion.span className="lm-tilt-glow" style={{ background: glow }} aria-hidden="true" />
      {children}
    </motion.div>
  );
}

/** Bar durasi yang menyusut mengikuti scroll: 120 menit jadi 3 menit. */
export function TimeShrink({ container }: { container: RefObject<HTMLElement | null> }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, container, offset: ["start 85%", "center 45%"] });
  const p = useSpring(scrollYProgress, { stiffness: 90, damping: 22 });
  const minutes = useTransform(p, (v) => Math.max(3, Math.round(120 - v * 117)));
  const width = useTransform(p, [0, 1], ["100%", "2.5%"]);
  const chapterOpacity = useTransform(p, [0.7, 1], [0, 1]);
  const chapterScale = useTransform(p, [0.7, 1], [0.92, 1]);

  return (
    <section className="lm-shrink" ref={ref} aria-label="Dua jam materi menjadi tiga menit baca">
      <div className="lm-shrink-copy">
        <h2>Dua jam materi, tiga menit baca.</h2>
        <p>Gulir ke bawah dan lihat video kuliah panjang menyusut jadi bab-bab pendek yang siap kamu pahami.</p>
      </div>
      <div className="lm-shrink-stage">
        <div className="lm-shrink-num">
          <motion.span>{minutes}</motion.span>
          <small>menit</small>
        </div>
        <div className="lm-shrink-track">
          <motion.div className="lm-shrink-fill" style={{ width }} />
        </div>
        <motion.div className="lm-shrink-chapters" style={{ opacity: chapterOpacity, scale: chapterScale }}>
          <span>Bab 1</span>
          <span>Bab 2</span>
          <span>Bab 3</span>
        </motion.div>
      </div>
    </section>
  );
}
