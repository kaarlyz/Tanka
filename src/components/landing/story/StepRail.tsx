import { useRef, type RefObject } from "react";
import { motion, useScroll, useSpring, useTransform, type MotionValue } from "motion/react";

const STEPS = ["Input", "Baca", "Tanya", "Uji"] as const;

function StepNode({ label, index, progress }: { label: string; index: number; progress: MotionValue<number> }) {
  const at = index / (STEPS.length - 1);
  const fill = useTransform(progress, [Math.max(0, at - 0.06), at], [0, 1]);
  return (
    <div className="sr-node" style={{ left: `${at * 100}%` }}>
      <span className="sr-dot">
        <motion.span className="sr-dot-fill" style={{ opacity: fill, scale: fill }} />
      </span>
      <span className="sr-label">
        <i>{String(index + 1).padStart(2, "0")}</i> {label}
      </span>
    </div>
  );
}

/** Rel putus-putus yang terisi lime mengikuti scroll: Input, Baca, Tanya, Uji. */
export function StepRail({ container }: { container: RefObject<HTMLElement | null> }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, container, offset: ["start 85%", "end 55%"] });
  const progress = useSpring(scrollYProgress, { stiffness: 90, damping: 24 });

  return (
    <div className="sr-rail" ref={ref} role="img" aria-label="Alur belajar: Input, Baca, Tanya, Uji">
      <div className="sr-track" />
      <motion.div className="sr-fill" style={{ scaleX: progress }} />
      {STEPS.map((s, i) => (
        <StepNode key={s} label={s} index={i} progress={progress} />
      ))}
    </div>
  );
}

export default StepRail;
