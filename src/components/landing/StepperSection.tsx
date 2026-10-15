import React, { useState } from "react";
import { CheckCircle2, Zap, ChevronRight } from "lucide-react";

export interface StepperSectionProps {
  onActionLaunch: () => void;
}

export function StepperSection({ onActionLaunch }: StepperSectionProps) {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      num: "01",
      tag: "INPUT BAHAN",
      title: "Tumpahkan Materi Belajarmu",
      detail:
        "Punya PDF 200 halaman, slide presentasi dosen, foto catatan di buku tulis, atau video YouTube 2 jam? Cukup unggah ke Tanka. Sistem akan langsung membersihkan teks dan merapikannya.",
      chips: ["Multi-format PDF & Dokumen", "Transkrip YouTube Otomatis", "Bebas Iklan & Bersih"],
      summary: "Gak perlu lagi buang waktu berjam-jam cuma buat merapikan atau mencatat ulang materi."
    },
    {
      num: "02",
      tag: "BACA RINGKAS",
      title: "Materi Jadi Bab Kecil Siap Santap",
      detail:
        "Tanka memotong materi tebal menjadi modul bab terstruktur yang bisa diselesaikan dalam 3-5 menit baca. Rumus matematika dan grafik diterjemahkan presisi tanpa font rusak.",
      chips: ["Modul Bab 3 Menitan", "Penurunan Rumus Rapi", "Tampilan Ramah Mata"],
      summary: "Belajar jadi gak kerasa berat karena materi dipecah jadi potongan-potongan kecil yang ringan."
    },
    {
      num: "03",
      tag: "TANYA TUTOR",
      title: "Tanya Rumus Kapan Saja Tanpa Rasa Malu",
      detail:
        "Mentok di baris rumus tertentu? Langsung buka Nara AI. Tanya dari mana asal suatu angka atau minta analogi sehari-hari. Nara menerangkan langkah demi langkah tanpa menghakimi.",
      chips: ["Tutor Siaga 24 Jam", "Analogi Sederhana", "Respon Langsung Tanpa Jeda"],
      summary: "Keleluasaan bertanya sepuasnya sampai kepalamu bener-bener ngeh konsep dasarnya."
    },
    {
      num: "04",
      tag: "UJI PEMAHAMAN",
      title: "Kuis Pintar & Bank Salah Pribadi",
      detail:
        "Uji ingatanmu lewat kuis 1 kartu 1 fakta. Setiap kesalahan otomatis dicatat ke Bank Salah pribadimu, jadi kamu tahu persis titik lemah yang perlu diulang sebelum hari H ujian.",
      chips: ["Kuis Logika Teruji", "Bank Salah Otomatis", "Peta Konsep Menyeluruh"],
      summary: "Bukan sekadar merasa sudah baca, tapi kamu benar-benar siap saat ujian di depan mata."
    }
  ];

  return (
    <section id="alur" className="landing-section">
      <div className="section-header-left reveal-scroll">
        <span className="section-kicker">CARA KERJA</span>
        <h2 className="section-title">4 Langkah Menguasai Materi Apapun</h2>
        <p className="section-desc">
          Empat langkah mudah untuk memecah materi sulit menjadi unit belajar yang siap kamu kuasai.
        </p>
      </div>

      {/* Stepper Tabs */}
      <div className="stepper-tabs reveal-scroll">
        {steps.map((s, idx) => (
          <button
            key={idx}
            className={`stepper-tab ${activeStep === idx ? "active" : ""}`}
            onClick={() => setActiveStep(idx)}
          >
            <span className="stepper-num">{s.num} // {s.tag}</span>
            <span className="stepper-tab-title">{s.title}</span>
          </button>
        ))}
      </div>

      {/* Stepper Active Detail Card */}
      <div className="stepper-card reveal-scroll delay-1">
        <div className="stepper-card-info">
          <div className="stepper-step-header">
            <span className="stepper-step-badge font-mono">
              LANGKAH {steps[activeStep].num}
            </span>
            <span className="stepper-step-tag font-mono">
              {steps[activeStep].tag}
            </span>
          </div>

          <h3 className="stepper-card-title">
            {steps[activeStep].title}
          </h3>

          <p className="stepper-card-desc">
            {steps[activeStep].detail}
          </p>

          <div className="stepper-chips-list">
            {steps[activeStep].chips.map((c, i) => (
              <div key={i} className="stepper-chip-item">
                <CheckCircle2 size={16} color="#4b6623" />
                <span>{c}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="stepper-method-box">
          <div className="stepper-method-header">
            <span className="stepper-method-tag font-mono">
              METODE TERARAH
            </span>
            <Zap size={15} color="#c8f064" />
          </div>
          <p className="stepper-method-quote">
            "{steps[activeStep].summary}"
          </p>
          <button
            className="stepper-cta-btn"
            onClick={onActionLaunch}
          >
            <span>Coba Mulai Belajar</span>
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </section>
  );
}

export default StepperSection;
