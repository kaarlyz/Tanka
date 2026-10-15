import React from "react";
import { GraduationCap, FileText, Compass, Check } from "lucide-react";

export function PersonasSection() {
  const SCENARIOS = [
    {
      icon: GraduationCap,
      tag: "SKENARIO 01 // PERSIAPAN INTENSIF",
      title: "Siswa SNBT & Ujian Sekolah",
      quote:
        "Silabus ujian tebal dipecah jadi modul terstruktur 3-5 menit. Kuis logika dan Bank Salah otomatis mengisolasi konsep yang belum dikuasai tanpa membuang waktu mengulang soal yang sudah dipahami.",
      metrics: [
        "94% Retensi Konsep Dasar",
        "Bank Salah Otomatis Terisolasi"
      ],
      author: "Dafa",
      role: "Siswa Kelas XII // Target PTN 2026"
    },
    {
      icon: FileText,
      tag: "SKENARIO 02 // RISET & AKADEMIK",
      title: "Mahasiswa & Penelaah Jurnal",
      quote:
        "Paper jurnal 40+ halaman dan kuliah panjang langsung diekstraksi menjadi pokok bahasan terarah. Penurunan rumus matematika KaTeX presisi memudahkan verifikasi sebelum evaluasi mingguan.",
      metrics: [
        "Ekstraksi Dokumen & YouTube",
        "Penurunan Rumus KaTeX Presisi"
      ],
      author: "Nadia",
      role: "Mahasiswi Biologi // Riset Literatur"
    },
    {
      icon: Compass,
      tag: "SKENARIO 03 // BELAJAR MANDIRI",
      title: "Pejuang Belajar Mandiri & Gap Year",
      quote:
        "Belajar konsisten dengan ritme mandiri tanpa distraksi iklan atau biaya langganan berulang. Seluruh modul dan catatan progres tersimpan privat di perangkat lokal untuk akses offline penuh.",
      metrics: [
        "Akses Penuh Tanpa Iklan",
        "Data Privat di Perangkat Anda"
      ],
      author: "Rian",
      role: "Gap Year // Belajar Mandiri Terjadwal"
    }
  ];

  return (
    <section id="testimoni" className="landing-section">
      <div className="section-header-center reveal-scroll">
        <span className="section-kicker">SKENARIO PENGGUNAAN</span>
        <h2 className="section-title">Dirancang untuk Kasus Belajar Nyata</h2>
        <p className="section-desc">
          Bukan klaim artifisial. Tanka membuktikan keunggulan arsitekturnya di tiga pola belajar harian paling menuntut.
        </p>
      </div>

      <div className="persona-grid">
        {SCENARIOS.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className={`persona-card reveal-scroll ${idx > 0 ? `delay-${idx}` : ""}`}
            >
              <div className="persona-card-top">
                <div className="persona-scenario-header">
                  <span className="persona-scenario-icon">
                    <Icon size={16} />
                  </span>
                  <span className="persona-scenario-tag font-mono">{item.tag}</span>
                </div>
                <h3 className="persona-scenario-title">{item.title}</h3>
                <p className="persona-scenario-quote">"{item.quote}"</p>
                <div className="persona-scenario-metrics">
                  {item.metrics.map((m, mIdx) => (
                    <div key={mIdx} className="persona-metric-pill">
                      <Check size={12} className="persona-metric-check" />
                      <span>{m}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="persona-card-footer">
                <div className="persona-author-name">{item.author}</div>
                <div className="persona-author-role">{item.role}</div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default PersonasSection;