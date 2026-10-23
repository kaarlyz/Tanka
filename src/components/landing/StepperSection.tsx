import React, { useState, type RefObject } from "react";
import { CheckCircle2, Zap, ChevronRight } from "lucide-react";
import { StepRail } from "./story/StepRail";

export interface StepperSectionProps {
  onActionLaunch: () => void;
  container?: RefObject<HTMLElement | null>;
}

export function StepperSection({ onActionLaunch, container }: StepperSectionProps) {
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
        "Mentok di baris rumus tertentu? Langsung buka Nara AI. Tanya dari mana asal suatu angka atau alur langkah hitungannya. Nara menerangkan langkah demi langkah tanpa menghakimi.",
      chips: ["Tutor Siaga 24 Jam", "Penjelasan Langsung ke Inti", "Respon Langsung Tanpa Jeda"],
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

      {/* Interactive Step Rail */}
      {container && <StepRail container={container} />}

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
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <span
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 12,
                fontWeight: 700,
                color: "#18221f",
                background: "#c8f064",
                padding: "4px 10px",
                borderRadius: 6
              }}
            >
              LANGKAH {steps[activeStep].num}
            </span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#60706a" }}>
              {steps[activeStep].tag}
            </span>
          </div>

          <h3 style={{ fontSize: 24, fontWeight: 800, color: "#18221f", marginBottom: 14 }}>
            {steps[activeStep].title}
          </h3>

          <p style={{ fontSize: 15, lineHeight: 1.68, color: "#55635e", marginBottom: 24 }}>
            {steps[activeStep].detail}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {steps[activeStep].chips.map((c, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#18221f", fontWeight: 600 }}>
                <CheckCircle2 size={16} color="#4b6623" />
                <span>{c}</span>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            background: "#18221f",
            color: "#eff5ec",
            borderRadius: 16,
            padding: 30,
            border: "1px solid #283832",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11.5, color: "#c8f064", letterSpacing: "0.06em", fontWeight: 700 }}>
              METODE TERARAH
            </span>
            <Zap size={15} color="#c8f064" />
          </div>
          <p style={{ fontSize: 14.5, lineHeight: 1.65, color: "#d5dfd9", marginBottom: 22 }}>
            "{steps[activeStep].summary}"
          </p>
          <button
            className="stepper-cta-btn"
            onClick={onActionLaunch}
            style={{
              width: "100%",
              background: "#c8f064",
              color: "#18221f",
              border: "none",
              borderRadius: 10,
              padding: "12px 18px",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transition: "background 0.15s ease"
            }}
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
