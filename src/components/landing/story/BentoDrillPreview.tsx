import { useCallback, useState, type KeyboardEvent } from "react";
import { AnimatePresence, motion } from "motion/react";

interface DemoQuestion {
  subject: string;
  level: string;
  stem: string;
  options: readonly string[];
  correct: number;
  steps: string;
  pitfall: string;
  trick: string;
}

const QUESTIONS: readonly DemoQuestion[] = [
  {
    subject: "Matematika",
    level: "sedang",
    stem: "Jika f(x) = 2x + 3 dan g(x) = x², maka (f∘g)(2) = …",
    options: ["7", "11", "49", "8"],
    correct: 1,
    steps: "g(2) = 2² = 4, lalu f(4) = 2·4 + 3 = 11.",
    pitfall: "Urutan komposisi sering terbalik. (g∘f)(2) memberi 49, bukan (f∘g)(2).",
    trick: "Kerjakan dari fungsi paling dalam: g dulu, hasilnya masuk ke f."
  },
  {
    subject: "Ekonomi",
    level: "sedang",
    stem: "Harga naik dari 10 ke 12 (ribu rupiah), jumlah diminta turun dari 50 ke 40. Berapa |Ed|?",
    options: ["0,5", "1", "2", "0,2"],
    correct: 1,
    steps: "%ΔQ = 10/50 = 20%. %ΔP = 2/10 = 20%. |Ed| = 20/20 = 1.",
    pitfall: "Persentase perubahan dihitung terhadap nilai awal, bukan nilai akhir.",
    trick: "Kedua persentase sama besar, jadi rasionya langsung 1."
  },
  {
    subject: "Matematika",
    level: "mudah",
    stem: "Tentukan f⁻¹(x) jika f(x) = 3x − 6.",
    options: ["(x − 6)/3", "(x + 6)/3", "3x + 6", "1/(3x − 6)"],
    correct: 1,
    steps: "y = 3x − 6. Tukar x dan y: x = 3y − 6. Maka y = (x + 6)/3.",
    pitfall: "Invers bukan sekadar membalik tanda. Tukar x dan y, lalu selesaikan untuk y.",
    trick: "Cek cepat: f(f⁻¹(x)) harus kembali menjadi x."
  }
];

const LETTERS = ["A", "B", "C", "D"] as const;

async function celebrate(): Promise<void> {
  try {
    const mod = await import("canvas-confetti");
    mod.default({
      particleCount: 70,
      spread: 70,
      origin: { y: 0.7 },
      colors: ["#c8f064", "#4b6623", "#18221f"],
      disableForReducedMotion: true
    });
  } catch {
    /* efek opsional, abaikan bila gagal dimuat */
  }
}

/** Cuplikan panggung Bento: rel nomor soal di atas, satu soal di panggung, tanpa scroll vertikal panjang. */
export function BentoDrillPreview() {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<Record<number, number>>({});
  const q = QUESTIONS[index];
  const choice = picked[index];
  const answered = choice !== undefined;
  const right = answered && choice === q.correct;

  const go = useCallback((next: number) => {
    setIndex(Math.min(QUESTIONS.length - 1, Math.max(0, next)));
  }, []);

  const pick = (i: number): void => {
    if (answered) return;
    setPicked((p) => ({ ...p, [index]: i }));
    if (i === q.correct) void celebrate();
  };

  const onKey = (e: KeyboardEvent<HTMLDivElement>): void => {
    if (e.key === "ArrowLeft") go(index - 1);
    if (e.key === "ArrowRight") go(index + 1);
  };

  return (
    <section id="bedah-soal" className="bd-section" aria-labelledby="bd-title">
      <div className="bd-head">
        <h2 id="bd-title">Satu soal di panggung. Tanpa scroll berpuluh nomor.</h2>
        <p>
          Coba jawab. Pilihan salah menampilkan jebakan yang mengecoh, pilihan benar menampilkan trik cepat. Contoh soal
          buatan untuk demo ini.
        </p>
      </div>

      <div className="bd-stage" tabIndex={0} onKeyDown={onKey} aria-label="Panggung bedah soal. Gunakan panah kiri dan kanan untuk pindah nomor.">
        <div className="bd-rail" role="tablist" aria-label="Nomor soal">
          {QUESTIONS.map((_, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === index}
              className={`bd-rail-btn${i === index ? " active" : ""}${picked[i] !== undefined ? " done" : ""}`}
              onClick={() => go(i)}
            >
              #{i + 1}
            </button>
          ))}
          <span className="bd-rail-hint">← → pindah soal</span>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={index}
            className="bd-grid"
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -18 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="bd-card">
              <div className="bd-meta">
                <span>#{index + 1}</span>
                <span>{q.subject}</span>
                <span>{q.level}</span>
              </div>
              <p className="bd-stem">{q.stem}</p>
            </div>

            <div className="bd-card">
              <div className="bd-options" role="group" aria-label="Pilihan jawaban">
                {q.options.map((opt, i) => {
                  const state = !answered ? "" : i === q.correct ? " correct" : i === choice ? " wrong" : "";
                  return (
                    <button key={opt} className={`bd-opt${state}`} onClick={() => pick(i)} disabled={answered && i !== choice && i !== q.correct}>
                      <b>{LETTERS[i]}</b>
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>

              <AnimatePresence>
                {answered && (
                  <motion.div
                    key="fb"
                    className="bd-feedback"
                    role="status"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <div className="bd-fb-box steps">
                      <b>Langkah penyelesaian</b>
                      <span>{q.steps}</span>
                    </div>
                    <div className={`bd-fb-box ${right ? "trick" : "pitfall"}`}>
                      <b>{right ? "Trik cepat" : "Radar jebakan"}</b>
                      <span>{right ? q.trick : q.pitfall}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="bd-nav">
          <button onClick={() => go(index - 1)} disabled={index === 0}>Soal sebelumnya</button>
          <button onClick={() => go(index + 1)} disabled={index === QUESTIONS.length - 1}>Soal berikutnya</button>
        </div>
      </div>
    </section>
  );
}

export default BentoDrillPreview;
