import { useCallback, useState, type KeyboardEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { MathView } from "../../common/MathView";

interface DemoQuestion {
  subject: string;
  level: string;
  badge?: string;
  timeEst?: string;
  stem: string;
  imageUrl?: string;
  imageCaption?: string;
  options: readonly string[];
  correct: number;
  steps: string;
  pitfall: string;
  trick: string;
}

const QUESTIONS: readonly DemoQuestion[] = [
  {
    subject: "Matematika Wajib",
    level: "Sedang",
    badge: "HOTS",
    timeEst: "⏱️ 45 detik",
    stem: "Jika $f(x) = 2x + 3$ dan $g(x) = x^2$, maka nilai komposisi $(f \\circ g)(2) = \\dots$",
    options: ["7", "11", "49", "8"],
    correct: 1,
    steps: "$g(2) = 2^2 = 4$, lalu $f(4) = 2(4) + 3 = 11$.",
    pitfall: "Urutan komposisi sering terbalik! Menghitung $(g \\circ f)(2)$ menghasilkan $49$, bukan $(f \\circ g)(2)$.",
    trick: "Prinsip bawang: kupas dari fungsi paling dalam $g(2)$, lalu oper hasilnya ke fungsi luar $f$."
  },
  {
    subject: "Ekonomi UTBK",
    level: "Sedang",
    badge: "Analisis Kurva",
    timeEst: "⏱️ 50 detik",
    imageUrl: "/uploads/exam_images/ekonomi_img-018.png",
    imageCaption: "Grafik Keseimbangan Pasar: Pergeseran Titik Permintaan dan Elastisitas",
    stem: "Berdasarkan grafik kurva di atas, ketika harga naik dari $P_1 = 10$ ke $P_2 = 12$, jumlah permintaan bergerak dari $Q_1 = 50$ ke $Q_2 = 40$. Berapa koefisien elastisitas permintaan $|E_d|$?",
    options: ["0{,}5", "1", "2", "0{,}2"],
    correct: 1,
    steps: "$\\%\\Delta Q = \\frac{10}{50} = 20\\%$. $\\%\\Delta P = \\frac{2}{10} = 20\\%$. Maka $|E_d| = \\frac{20\\%}{20\\%} = 1$ (Elastisitas Uniter).",
    pitfall: "Persentase perubahan elastisitas dihitung terhadap basis nilai mula-mula ($Q_1$), bukan nilai akhir ($Q_2$).",
    trick: "Kedua persentase perubahan sama besar ($20\\%$), jadi rasionya langsung $1$ tanpa perlu coretan panjang."
  },
  {
    subject: "Matematika Wajib",
    level: "Mudah",
    badge: "Aljabar",
    timeEst: "⏱️ 30 detik",
    stem: "Tentukan rumus invers fungsi $f^{-1}(x)$ jika $f(x) = 3x - 6$.",
    options: ["\\frac{x - 6}{3}", "\\frac{x + 6}{3}", "3x + 6", "\\frac{1}{3x - 6}"],
    correct: 1,
    steps: "Misalkan $y = 3x - 6$. Tukar variabel $x$ dan $y$: $x = 3y - 6 \\implies 3y = x + 6 \\implies y = \\frac{x + 6}{3}$.",
    pitfall: "Invers bukan sekadar membalik tanda aljabar. Tukar variabel $x$ dan $y$, lalu selesaikan kembali untuk $y$.",
    trick: "Cek substitusi cepat: nilai $f(f^{-1}(x))$ harus kembali menjadi identitas $x$."
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
              type="button"
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

        <AnimatePresence initial={false}>
          <motion.div
            key={index}
            className="bd-grid"
            initial={{ opacity: 0, x: 14 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -14 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="bd-card">
              <div className="bd-meta">
                <span>#{index + 1}</span>
                <span>{q.subject}</span>
                <span>{q.level}</span>
                {q.badge && <span className="bd-meta-badge">{q.badge}</span>}
                {q.timeEst && <span className="bd-meta-time">{q.timeEst}</span>}
              </div>
              <div className="bd-stem">
                <MathView text={q.stem} />
              </div>
              {q.imageUrl && (
                <div className="bd-image-wrapper">
                  <img src={q.imageUrl} alt={q.imageCaption || "Stimulus grafik ujian"} className="bd-image" loading="lazy" />
                  {q.imageCaption && <div className="bd-image-caption">{q.imageCaption}</div>}
                </div>
              )}
            </div>

            <div className="bd-card">
              <div className="bd-options" role="group" aria-label="Pilihan jawaban">
                {q.options.map((opt, i) => {
                  const isUserPick = choice === i;
                  const isCorrectAnswer = i === q.correct;
                  const state = !answered ? "" : isCorrectAnswer ? " correct" : isUserPick ? " wrong" : "";
                  return (
                    <button key={opt} className={`bd-opt${state}`} onClick={() => pick(i)} disabled={answered && i !== choice && i !== q.correct}>
                      <b>{LETTERS[i]}</b>
                      <span><MathView text={opt} /></span>
                      {answered && isUserPick && !isCorrectAnswer && (
                        <span className="bd-opt-badge wrong">✗ Pilihanmu</span>
                      )}
                      {answered && isCorrectAnswer && (
                        <span className="bd-opt-badge correct">✓ Kunci Jawaban</span>
                      )}
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
                      <div><MathView text={q.steps} /></div>
                    </div>
                    <div className={`bd-fb-box ${right ? "trick" : "pitfall"}`}>
                      <b>{right ? "Trik cepat" : "Radar jebakan"}</b>
                      <div><MathView text={right ? q.trick : q.pitfall} /></div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="bd-nav">
          <button
            type="button"
            onClick={() => (index > 0 ? go(index - 1) : null)}
            className={index === 0 ? "is-disabled" : ""}
            aria-disabled={index === 0}
          >
            ← Soal sebelumnya
          </button>
          {index === QUESTIONS.length - 1 ? (
            <button
              type="button"
              onClick={() => go(0)}
              className="bd-nav-restart"
            >
              Ulangi dari #1 ↺
            </button>
          ) : (
            <button
              type="button"
              onClick={() => go(index + 1)}
            >
              Soal berikutnya →
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

export default BentoDrillPreview;
