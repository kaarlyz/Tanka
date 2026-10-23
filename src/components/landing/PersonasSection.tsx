import { TiltCard } from "./motion/MotionKit";

const CASES = [
  { who: "Pejuang TKA dan UTBK", problem: "Soal variasi HOTS terasa menekan dan waktu terbatas.", how: "Bedah lembar soal: langkah penyelesaian, trik cepat, dan radar jebakan di tiap nomor. Soal yang salah masuk Bank Soal Salah." },
  { who: "Mahasiswa", problem: "Jurnal dan slide dosen menumpuk sebelum kuis.", how: "Unggah PDF atau PPTX, dapatkan bab pendek dan peta konsep untuk melihat urutan belajarnya." },
  { who: "Pejuang kampus dan gap year", problem: "Belajar sendiri butuh ritme dan catatan yang rapi.", how: "Target belajar mingguan, rentetan hari aktif, dan timer fokus 10 menit untuk menjaga ritme." }
] as const;

export function PersonasSection() {
  return (
    <section id="testimoni" className="landing-section landing-section--ruled">
      <div className="section-header-center">
        <span className="section-kicker">UNTUK SIAPA</span>
        <h2 className="section-title">Dibuat untuk tiga cara belajar</h2>
        <p className="section-desc">Siapa pun kamu, alurnya sama: materi diurai, dipahami, lalu diuji.</p>
      </div>
      <div className="persona-grid">
        {CASES.map((c) => (
          <TiltCard key={c.who} className="persona-card">
            <div>
              <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, margin: "0 0 10px", color: "#18221f" }}>{c.who}</h3>
              <p style={{ fontSize: 14, color: "#56615d", margin: "0 0 14px" }}>{c.problem}</p>
            </div>
            <p style={{ fontSize: 14.5, lineHeight: 1.6, color: "#18221f", margin: 0, paddingTop: 14, borderTop: "1px solid #dce2da" }}>{c.how}</p>
          </TiltCard>
        ))}
      </div>
    </section>
  );
}

export default PersonasSection;
