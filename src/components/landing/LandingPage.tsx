import React, { useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Lock,
  Star,
  ExternalLink,
  Zap,
  ChevronRight
} from "lucide-react";
import { UserAccount } from "../../types";

export interface LandingPageProps {
  onLaunchApp: () => void;
  onOpenAuth: (mode?: "login" | "register") => void;
  currentUser?: UserAccount | null;
}

export function LandingPage({
  onLaunchApp,
  onOpenAuth,
  currentUser
}: LandingPageProps) {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      num: "01",
      tag: "INPUT MATERI",
      title: "Unggah Dokumen atau Tempel Link YouTube",
      summary:
        "Tarik intisari dari file PDF, catatan foto, slide PPTX, atau video YouTube secara instan.",
      detail:
        "Cukup masukkan bahan belajarmu. Tanka otomatis mengekstrak materi dan merapikannya menjadi modul siap baca tanpa iklan dan tanpa ribet.",
      chips: ["Multi-format PDF, Foto & PPTX", "Transkrip Video YouTube Otomatis", "Ekstraksi Rapi & Cepat"]
    },
    {
      num: "02",
      tag: "STRUKTUR BAB",
      title: "Rangkuman Terstruktur Bab demi Bab",
      summary:
        "Materi panjang dipecah jadi modul-modul kecil terstruktur agar mudah dipelajari berurutan.",
      detail:
        "Tidak ada lagi tumpukan materi tebal yang bikin pusing. Tanka merapikan materi menjadi bab-bab terurut lengkap dengan penurunan rumus matematika yang jelas.",
      chips: ["Modul Belajar Ringkas", "Urutan Materi Logis", "Rumus Ditata Rapi"]
    },
    {
      num: "03",
      tag: "TANYA NARA AI",
      title: "Diskusi & Tanya Rumus Sepuasnya",
      summary:
        "Tutor AI pribadi yang sabar menerangkan konsep sulit dan penurunan rumus kapan saja.",
      detail:
        "Nara mendampingi setiap halaman belajarmu. Tanya rumus yang belum dipahami, dan Nara akan menjelaskannya dengan contoh analogi nyata langkah demi langkah.",
      chips: ["Penjelasan Langkah demi Langkah", "Analogi Ramah & Sederhana", "Respon Cepat Kapan Saja"]
    },
    {
      num: "04",
      tag: "UJI PEMAHAMAN",
      title: "Latihan Kuis Pintar & Lacak Bank Salah",
      summary:
        "Uji pemahaman dengan kuis fakta objektif dan arsipkan materi yang belum dikuasai ke Bank Salah.",
      detail:
        "Selesaikan kuis interaktif tanpa soal jebakan. Setiap jawaban yang salah otomatis masuk ke Bank Salah agar kamu bisa mereview materi tersebut sampai siap ujian.",
      chips: ["Kuis Akurat Anti-Halusinasi", "Pembahasan Otomatis", "Bank Khusus Soal Salah"]
    }
  ];

  return (
    <div className="tanka-landing-container">
      <style>{`
        .tanka-landing-container {
          width: 100%;
          height: 100%;
          min-height: 100vh;
          overflow-y: auto;
          overflow-x: hidden;
          background-color: #fcfdfa;
          background-image: 
            linear-gradient(to right, rgba(24, 34, 31, 0.035) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(24, 34, 31, 0.035) 1px, transparent 1px);
          background-size: 32px 32px;
          color: #18221f;
          font-family: 'Plus Jakarta Sans', 'Manrope', -apple-system, BlinkMacSystemFont, sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        .landing-nav {
          position: sticky;
          top: 0;
          z-index: 1000;
          background: rgba(252, 253, 250, 0.90);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border-bottom: 1px solid #e2e8df;
        }

        .landing-nav-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 12px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .landing-brand {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          user-select: none;
          text-decoration: none;
        }

        .landing-brand-box {
          width: 26px;
          height: 26px;
          border-radius: 6px;
          background: #18221f;
          color: #c8f064;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'DM Mono', monospace;
          font-weight: 700;
          font-size: 15px;
          line-height: 1;
        }

        .landing-brand-text {
          font-size: 18px;
          font-weight: 800;
          letter-spacing: -0.03em;
          color: #18221f;
        }

        .landing-nav-links {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .landing-nav-link {
          font-size: 13.5px;
          font-weight: 600;
          color: #5f6b66;
          text-decoration: none;
          transition: color 0.15s ease;
        }

        .landing-nav-link:hover {
          color: #18221f;
        }

        .landing-nav-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .landing-btn-ghost {
          background: transparent;
          border: 1px solid transparent;
          color: #18221f;
          padding: 7px 14px;
          border-radius: 8px;
          font-size: 13.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .landing-btn-ghost:hover {
          background: rgba(24, 34, 31, 0.05);
          border-color: #e2e8df;
        }

        .landing-btn-primary {
          background: #18221f;
          color: #c8f064;
          border: 1px solid #18221f;
          padding: 8px 18px;
          border-radius: 8px;
          font-size: 13.5px;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 0.15s ease;
          box-shadow: 0 4px 12px rgba(24, 34, 31, 0.1);
        }

        .landing-btn-primary:hover {
          background: #24342f;
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(24, 34, 31, 0.16);
        }

        /* Hero */
        .landing-hero {
          max-width: 1200px;
          margin: 0 auto;
          padding: 64px 24px 72px;
          text-align: center;
        }

        .hero-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          border-radius: 999px;
          background: #ffffff;
          border: 1px solid #dce2da;
          box-shadow: 0 2px 8px rgba(24, 34, 31, 0.04);
          font-family: 'DM Mono', monospace;
          font-size: 12px;
          font-weight: 600;
          color: #18221f;
          letter-spacing: 0.02em;
          margin-bottom: 24px;
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
            box-shadow: 0 0 8px rgba(200, 240, 100, 0.9);
          }
          50% {
            transform: scale(1.15);
            opacity: 0.85;
            box-shadow: 0 0 14px rgba(200, 240, 100, 1);
          }
        }

        .hero-pill-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #c8f064;
          border: 1.5px solid #18221f;
          box-shadow: 0 0 8px rgba(200, 240, 100, 0.9);
          animation: pulse 2s infinite ease-in-out;
        }

        .hero-title {
          font-size: clamp(2.2rem, 5.5vw, 3.8rem);
          font-weight: 800;
          line-height: 1.15;
          letter-spacing: -0.035em;
          color: #18221f;
          max-width: 880px;
          margin: 0 auto 20px;
        }

        .hero-title-sub {
          display: block;
          font-size: clamp(1.1rem, 2.8vw, 1.8rem);
          font-weight: 700;
          color: #45544e;
          margin-top: 8px;
          letter-spacing: -0.02em;
        }

        .hero-subtitle {
          font-size: clamp(1rem, 2vw, 1.15rem);
          line-height: 1.62;
          color: #5f6b66;
          max-width: 720px;
          margin: 0 auto 36px;
        }

        .hero-cta-group {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
          flex-wrap: wrap;
        }

        .hero-btn-launch {
          background: #18221f;
          color: #c8f064;
          border: 1px solid #18221f;
          padding: 14px 28px;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          box-shadow: 0 10px 24px -4px rgba(24, 34, 31, 0.22);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .hero-btn-launch:hover {
          background: #24342f;
          transform: translateY(-2px);
          box-shadow: 0 14px 30px -4px rgba(24, 34, 31, 0.28);
        }

        .hero-btn-github {
          background: #ffffff;
          color: #18221f;
          border: 1px solid #dce2da;
          padding: 14px 24px;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 600;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 2px 8px rgba(24, 34, 31, 0.04);
          transition: all 0.2s ease;
        }

        .hero-btn-github:hover {
          background: #f7f9f5;
          border-color: #cbd4c8;
          transform: translateY(-1px);
        }

        /* Mockup Window */
        .mockup-window {
          max-width: 1100px;
          margin: 54px auto 0;
          border-radius: 14px;
          border: 1px solid #dce2da;
          background: #ffffff;
          box-shadow: 0 24px 64px -12px rgba(24, 34, 31, 0.12), 0 0 0 1px rgba(24, 34, 31, 0.03);
          overflow: hidden;
        }

        .mockup-chrome {
          height: 40px;
          background: #f4f6f1;
          border-bottom: 1px solid #e2e8df;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 14px;
        }

        .mockup-dots {
          display: flex;
          gap: 6px;
          align-items: center;
        }

        .mockup-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }

        .mockup-url-pill {
          background: #ffffff;
          border: 1px solid #e2e8df;
          border-radius: 6px;
          padding: 3px 16px;
          font-size: 11.5px;
          font-family: 'DM Mono', monospace;
          color: #5f6b66;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .mockup-img {
          width: 100%;
          height: auto;
          display: block;
        }

        /* Bento Section */
        .landing-section {
          max-width: 1200px;
          margin: 0 auto;
          padding: 80px 24px;
        }

        .section-header {
          text-align: center;
          max-width: 760px;
          margin: 0 auto 48px;
        }

        .section-tag {
          font-family: 'DM Mono', monospace;
          font-size: 11.5px;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: #283832;
          text-transform: uppercase;
          background: rgba(40, 56, 50, 0.08);
          border: 1px solid rgba(40, 56, 50, 0.14);
          padding: 4px 10px;
          border-radius: 6px;
          display: inline-block;
          margin-bottom: 14px;
        }

        .section-title {
          font-size: clamp(1.8rem, 4vw, 2.6rem);
          font-weight: 800;
          letter-spacing: -0.03em;
          color: #18221f;
          margin-bottom: 14px;
          line-height: 1.2;
        }

        .section-desc {
          font-size: 15.5px;
          line-height: 1.6;
          color: #5f6b66;
        }

        .bento-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
        }

        .bento-card {
          background: #ffffff;
          border: 1px solid #e2e8df;
          border-radius: 16px;
          padding: 32px;
          box-shadow: 0 8px 30px rgba(24, 34, 31, 0.04);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @media (hover: hover) and (pointer: fine) {
          .bento-card:hover {
            transform: translateY(-3px);
            border-color: #a8c48a !important;
            box-shadow: 0 16px 36px rgba(24, 34, 31, 0.08) !important;
          }
        }

        .bento-span-2 {
          grid-column: span 2;
        }

        .bento-label {
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.06em;
          color: #5f6b66;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .bento-title {
          font-size: 21px;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: #18221f;
          margin-bottom: 10px;
          line-height: 1.25;
        }

        .bento-desc {
          font-size: 14px;
          line-height: 1.6;
          color: #5f6b66;
          margin-bottom: 22px;
        }

        .mini-device-frame {
          border-radius: 10px;
          border: 1px solid #e2e8df;
          background: #f7f9f5;
          overflow: hidden;
          box-shadow: 0 6px 18px rgba(24, 34, 31, 0.05);
        }

        .mini-device-header {
          height: 28px;
          background: #eef2eb;
          border-bottom: 1px solid #e2e8df;
          display: flex;
          align-items: center;
          padding: 0 10px;
          gap: 6px;
        }

        .mini-device-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #c5cec3;
        }

        .bento-two-col {
          display: grid;
          grid-template-columns: 1.1fr 1.3fr;
          gap: 28px;
          align-items: center;
        }

        .chip-group {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 16px;
        }

        .metric-chip {
          font-family: 'DM Mono', monospace;
          font-size: 11.5px;
          font-weight: 600;
          background: #18221f;
          color: #c8f064;
          padding: 6px 12px;
          border-radius: 6px;
          border: 1px solid #283832;
        }

        /* Stepper */
        .stepper-tabs {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 24px;
        }

        .stepper-tab {
          background: #ffffff;
          border: 1px solid #e2e8df;
          border-radius: 12px;
          padding: 16px;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .stepper-tab:hover {
          border-color: #cbd4c8;
        }

        .stepper-tab.active {
          background: #18221f;
          border-color: #18221f;
          box-shadow: 0 6px 20px rgba(24, 34, 31, 0.12);
        }

        .stepper-num {
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          font-weight: 700;
          color: #798782;
        }

        .stepper-tab.active .stepper-num {
          color: #c8f064;
        }

        .stepper-tab-title {
          font-size: 13.5px;
          font-weight: 700;
          color: #18221f;
          line-height: 1.3;
        }

        .stepper-tab.active .stepper-tab-title {
          color: #eff5ec;
        }

        .stepper-card {
          background: #ffffff;
          border: 1px solid #e2e8df;
          border-radius: 16px;
          padding: 36px;
          box-shadow: 0 8px 30px rgba(24, 34, 31, 0.04);
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 36px;
          align-items: center;
        }

        /* Banner CTA */
        .landing-cta-banner {
          background: #18221f;
          color: #eff5ec;
          border-radius: 20px;
          padding: 56px 36px;
          text-align: center;
          margin: 40px auto 80px;
          max-width: 1200px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 20px 50px -10px rgba(24, 34, 31, 0.3);
        }

        /* Footer */
        .landing-footer {
          border-top: 1px solid #e2e8df;
          background: #f7f9f5;
          padding: 54px 24px 44px;
        }

        .landing-footer-inner {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 36px;
        }

        .footer-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 28px;
        }

        .footer-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid #e2e8df;
          padding-top: 24px;
          font-size: 13px;
          color: #798782;
          flex-wrap: wrap;
          gap: 12px;
        }

        /* Mobile Adjustments */
        @media (max-width: 860px) {
          .landing-nav-links {
            display: none;
          }
          .bento-grid {
            grid-template-columns: 1fr;
          }
          .bento-span-2 {
            grid-column: span 1;
          }
          .bento-two-col {
            grid-template-columns: 1fr;
          }
          .stepper-tabs {
            grid-template-columns: 1fr 1fr;
          }
          .stepper-card {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* Top Navigation Bar */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <div className="landing-brand" onClick={onLaunchApp}>
            <div className="landing-brand-box">t</div>
            <span className="landing-brand-text">tanka.</span>
          </div>

          <div className="landing-nav-links">
            <a href="#fitur" className="landing-nav-link">Fitur Inti</a>
            <a href="#keunggulan" className="landing-nav-link">Keunggulan</a>
            <a href="#alur" className="landing-nav-link">Alur Belajar</a>
            <a
              href="https://github.com/kaarlyz/Tanka"
              target="_blank"
              rel="noopener noreferrer"
              className="landing-nav-link"
              style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
            >
              GitHub <ExternalLink size={12} />
            </a>
          </div>

          <div className="landing-nav-actions">
            {currentUser ? (
              <span
                style={{
                  fontSize: 13,
                  fontFamily: "'DM Mono', monospace",
                  fontWeight: 600,
                  color: "#283832",
                  padding: "6px 10px",
                  background: "#eef2eb",
                  borderRadius: 6
                }}
              >
                @{currentUser.username}
              </span>
            ) : (
              <button
                className="landing-btn-ghost"
                onClick={() => onOpenAuth("login")}
              >
                Masuk
              </button>
            )}
            <button
              className="landing-btn-primary"
              onClick={onLaunchApp}
            >
              <span>Buka Aplikasi</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="hero-pill">
          <span className="hero-pill-dot" />
          <span>⚡ Belajar Cepat & Tuntas • 100% Bebas Iklan</span>
        </div>

        <h1 className="hero-title">
          Ubah Materi Apapun Jadi Paham Seketika.
          <span className="hero-title-sub">
            Belajar Mandiri Berdaya Tinggi, Bebas Gimmick.
          </span>
        </h1>

        <p className="hero-subtitle">
          Pecah PDF tebal, catatan kuliah, atau video YouTube 1 jam menjadi bab bacaan modular dalam hitungan detik. Didampingi tutor Nara AI yang sabar menjelaskan rumus langkah demi langkah.
        </p>

        <div className="hero-cta-group">
          <button className="hero-btn-launch" onClick={onLaunchApp}>
            <span>Mulai Belajar Sekarang (Gratis)</span>
            <ArrowRight size={16} />
          </button>
          <a
            href="https://github.com/kaarlyz/Tanka"
            target="_blank"
            rel="noopener noreferrer"
            className="hero-btn-github"
          >
            <span>Lihat Sumber Terbuka (GitHub)</span>
            <Star size={16} color="#eab308" fill="#eab308" />
          </a>
        </div>

        {/* Hero Device Mockup Frame */}
        <div className="mockup-window">
          <div className="mockup-chrome">
            <div className="mockup-dots">
              <span className="mockup-dot" style={{ background: "#ff5f56" }} />
              <span className="mockup-dot" style={{ background: "#ffbd2e" }} />
              <span className="mockup-dot" style={{ background: "#27c93f" }} />
            </div>
            <div className="mockup-url-pill">
              <Lock size={11} />
              <span>tanka.app/study/operasi-himpunan</span>
            </div>
            <div style={{ width: 48 }} />
          </div>
          <img
            src="/assets/landing/hero-reader.png"
            alt="Tanka Book Reader & Chapter Strip"
            className="mockup-img"
            loading="eager"
          />
        </div>
      </section>

      {/* Bento Grid Showcase Section */}
      <section id="keunggulan" className="landing-section">
        <div className="section-header">
          <span className="section-tag">KEUNGGULAN UTAMA</span>
          <h2 className="section-title">Belajar Lebih Efektif Tanpa Rasa Frustrasi</h2>
          <p className="section-desc">
            Dirancang khusus untuk memecah kerumitan materi belajar. Pahami konsep sulit lebih cepat, bebas distraksi iklan, dan didampingi tutor AI 24/7.
          </p>
        </div>

        <div className="bento-grid">
          {/* Card 1: 2 Kolom Lebar (Nara AI) */}
          <div className="bento-card bento-span-2">
            <div className="bento-two-col">
              <div>
                <div className="bento-label">TUTOR PRIBADI 24/7</div>
                <h3 className="bento-title">Tanya Rumus & Konsep Tanpa Rasa Malu</h3>
                <p className="bento-desc">
                  Gak paham satu langkah di soal matematika atau konsep teori rumit? Tanya Nara AI. Dijelaskan dengan analogi sederhana dan penurunan rumus bertahap sampai kamu benar-benar paham.
                </p>
                <div className="chip-group">
                  <span className="metric-chip">Analogi Ramah</span>
                  <span className="metric-chip">Penjelasan Bertahap</span>
                  <span className="metric-chip">Respon Seketika</span>
                </div>
              </div>
              <div className="mini-device-frame">
                <div className="mini-device-header">
                  <span className="mini-device-dot" />
                  <span className="mini-device-dot" />
                  <span className="mini-device-dot" />
                  <span style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", color: "#798782", marginLeft: 4 }}>
                    tanya-nara.ai [asisten-belajar]
                  </span>
                </div>
                <img
                  src="/assets/landing/bento-nara.png"
                  alt="Tanya Nara AI Tutor Pribadi"
                  className="mockup-img"
                  loading="eager"
                />
              </div>
            </div>
          </div>

          {/* Card 2: 1 Kolom (Atomic Quiz) */}
          <div className="bento-card" id="fitur">
            <div>
              <div className="bento-label">LATIHAN TERUJI</div>
              <h3 className="bento-title">Kuis Pintar 1 Kartu 1 Fakta</h3>
              <p className="bento-desc">
                Bukan kuis tebak-tebakan asal jadi. Setiap soal menguji inti logika materi tanpa soal jebakan halusinasi, dilengkapi pembahasan instan.
              </p>
              <div className="chip-group" style={{ marginBottom: 20 }}>
                <span className="metric-chip">Anti-Halusinasi</span>
                <span className="metric-chip">Pembahasan Lengkap</span>
                <span className="metric-chip">Lacak Bank Salah</span>
              </div>
            </div>
            <div className="mini-device-frame">
              <div className="mini-device-header">
                <span className="mini-device-dot" />
                <span className="mini-device-dot" />
                <span className="mini-device-dot" />
                <span style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", color: "#798782", marginLeft: 4 }}>
                  kuis-pemahaman.ai [evaluasi-akurat]
                </span>
              </div>
              <img
                src="/assets/landing/bento-quiz.png"
                alt="Kuis Pintar 1 Kartu 1 Fakta"
                className="mockup-img"
                loading="eager"
              />
            </div>
          </div>

          {/* Card 4: 1 Kolom (Peta Konsep) */}
          <div className="bento-card">
            <div>
              <div className="bento-label">VISUAL RETENTION</div>
              <h3 className="bento-title">Petakan Hubungan Antar-Konsep</h3>
              <p className="bento-desc">
                Visualisasikan alur keterkaitan materi secara menyeluruh agar tidak ada mata rantai ilmu yang tercecer sebelum ujian.
              </p>
              <div className="chip-group" style={{ marginBottom: 20 }}>
                <span className="metric-chip">Peta Radial</span>
                <span className="metric-chip">Navigasi Cepat</span>
                <span className="metric-chip">Retensi Jangka Panjang</span>
              </div>
            </div>
            <div className="mini-device-frame">
              <div className="mini-device-header">
                <span className="mini-device-dot" />
                <span className="mini-device-dot" />
                <span className="mini-device-dot" />
                <span style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", color: "#798782", marginLeft: 4 }}>
                  peta-konsep.ai [visual-roadmap]
                </span>
              </div>
              <img
                src="/assets/landing/bento-mindmap.png"
                alt="Petakan Hubungan Antar-Konsep"
                className="mockup-img"
                loading="eager"
              />
            </div>
          </div>

          {/* Card 3: 1 Kolom (YouTube & Dokumen) */}
          <div className="bento-card">
            <div>
              <div className="bento-label">INSTANT SUMMARY</div>
              <h3 className="bento-title">Video YouTube 1 Jam Jadi Rangkuman 3 Menit</h3>
              <p className="bento-desc">
                Cukup tempel link video YouTube atau unggah dokumen. Tanka otomatis merapikannya menjadi modul bab interaktif layaknya buku saku digital.
              </p>
            </div>
            <div className="chip-group" style={{ marginTop: "auto", paddingTop: 16 }}>
              <span className="metric-chip">Auto-Chapter</span>
              <span className="metric-chip">Rangkuman Rumus</span>
              <span className="metric-chip">Estetika Paper-Ledger</span>
            </div>
          </div>

          {/* Card 5: 1 Kolom (Offline & Ringan) */}
          <div className="bento-card">
            <div>
              <div className="bento-label">HEMAT & PRIVAT</div>
              <h3 className="bento-title">Bisa Dipelajari Offline & Hemat Kuota</h3>
              <p className="bento-desc">
                Semua data materi tersimpan di perangkatmu sendiri. Buka materi di mana saja tanpa pusing jaringan internet putus-nyambung.
              </p>
            </div>
            <div className="chip-group" style={{ marginTop: "auto", paddingTop: 16 }}>
              <span className="metric-chip">Local-First</span>
              <span className="metric-chip">Ringan di HP</span>
              <span className="metric-chip">Nol Iklan Mengganggu</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Stepper Section */}
      <section id="alur" className="landing-section" style={{ paddingTop: 20 }}>
        <div className="section-header">
          <span className="section-tag">CARA KERJA</span>
          <h2 className="section-title">Dari Tumpukan Materi Jadi Paham Tuntas</h2>
          <p className="section-desc">
            Empat langkah mudah untuk memecah materi sulit menjadi unit belajar yang siap kamu kuasai.
          </p>
        </div>

        {/* Stepper Tabs */}
        <div className="stepper-tabs">
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
        <div className="stepper-card">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <span
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#18221f",
                  background: "#c8f064",
                  padding: "3px 8px",
                  borderRadius: 4
                }}
              >
                TAHAP {steps[activeStep].num}
              </span>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#798782" }}>
                {steps[activeStep].tag}
              </span>
            </div>

            <h3 style={{ fontSize: 24, fontWeight: 800, color: "#18221f", marginBottom: 14 }}>
              {steps[activeStep].title}
            </h3>

            <p style={{ fontSize: 15, lineHeight: 1.65, color: "#5f6b66", marginBottom: 24 }}>
              {steps[activeStep].detail}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {steps[activeStep].chips.map((c, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, color: "#18221f", fontWeight: 600 }}>
                  <CheckCircle2 size={16} color="#283832" />
                  <span>{c}</span>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              background: "#18221f",
              color: "#eff5ec",
              borderRadius: 14,
              padding: 28,
              border: "1px solid #283832",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#c8f064", letterSpacing: "0.05em" }}>
                METODE BELAJAR TERUJI
              </span>
              <Zap size={14} color="#c8f064" />
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: "#d5dfd9", marginBottom: 20 }}>
              "{steps[activeStep].summary}"
            </p>
            <button
              onClick={onLaunchApp}
              style={{
                width: "100%",
                background: "#c8f064",
                color: "#18221f",
                border: "none",
                borderRadius: 8,
                padding: "10px 16px",
                fontSize: 13.5,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8
              }}
            >
              <span>Mulai Belajar Sekarang</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <div className="landing-cta-banner">
        <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 14, color: "#ffffff" }}>
          Siap Paham Materi Lebih Cepat dan Tuntas?
        </h2>
        <p style={{ fontSize: 16, color: "#b5c2bc", maxWidth: 640, margin: "0 auto 32px", lineHeight: 1.6 }}>
          Mulai olah materi belajarmu sekarang. 100% bebas biaya, tanpa iklan mengganggu, dan catatan belajarmu tersimpan aman di perangkatmu.
        </p>
        <button
          onClick={onLaunchApp}
          style={{
            background: "#c8f064",
            color: "#18221f",
            border: "none",
            borderRadius: 10,
            padding: "16px 36px",
            fontSize: 16,
            fontWeight: 800,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            boxShadow: "0 8px 24px rgba(200, 240, 100, 0.3)"
          }}
        >
          <span>Mulai Belajar Sekarang (Gratis)</span>
          <ArrowRight size={18} />
        </button>
      </div>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="footer-top">
            <div style={{ maxWidth: 360 }}>
              <div className="landing-brand" onClick={onLaunchApp} style={{ marginBottom: 12 }}>
                <div className="landing-brand-box">t</div>
                <span className="landing-brand-text">tanka.</span>
              </div>
              <p style={{ fontSize: 13.5, lineHeight: 1.6, color: "#5f6b66" }}>
                Tanka — Platform Belajar Mandiri Cerdas untuk Pelajar SMA, Pejuang UTBK & Mahasiswa.
              </p>
            </div>

            <div style={{ display: "flex", gap: 48, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 700, color: "#18221f", marginBottom: 12, letterSpacing: "0.06em" }}>
                  KONTRIBUTOR & KODE
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <a
                    href="https://github.com/kaarlyz/Tanka"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 13, color: "#5f6b66", textDecoration: "none" }}
                  >
                    GitHub Repository
                  </a>
                  <a
                    href="https://github.com/kaarlyz/Tanka/blob/main/LICENSE"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 13, color: "#5f6b66", textDecoration: "none" }}
                  >
                    MIT License
                  </a>
                </div>
              </div>

              <div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 700, color: "#18221f", marginBottom: 12, letterSpacing: "0.06em" }}>
                  PRIVASI & KEAMANAN
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <span style={{ fontSize: 13, color: "#5f6b66" }}>
                    Data Privat di Perangkat
                  </span>
                  <span style={{ fontSize: 13, color: "#5f6b66" }}>
                    Kuis Akurat & Bebas Halusinasi
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <span>© 2026 Tanka by kaarlyz. All rights reserved.</span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12 }}>
              Belajar Mandiri Cerdas • Bebas Iklan • 100% Privat
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
