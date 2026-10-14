import React, { useState } from "react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Lock,
  Star,
  ExternalLink,
  Zap,
  BookOpen,
  Cpu,
  Layers,
  Shield,
  Brain,
  Sparkles,
  ChevronRight,
  HelpCircle
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
      tag: "INGESTION",
      title: "Unggah Dokumen / Tempel Tautan YouTube",
      summary:
        "Tarik materi dari PDF, PPTX, gambar berbasis OCR lokal, atau transkrip video YouTube otomatis.",
      detail:
        "Engine Tanka memproses berkas materi kuliah, buku teks, atau video referensi tanpa perlu mengirim dokumen mentah ke server pihak ketiga. Semua teks diekstrak, dinormalisasi, dan dibersihkan secara lokal.",
      chips: ["Multi-format PDF/PPTX/Image", "Transkrip Video Otomatis", "Sanitasi Karakter KaTeX"]
    },
    {
      num: "02",
      tag: "SYNTHESIS",
      title: "AI Menyusun Kurikulum Modular Per Bab",
      summary:
        "Dekomposisi konsep kanonikal menjadi pohon hierarkis terstruktur dengan prasyarat keterhubungan.",
      detail:
        "Materi dipecah menjadi modul-modul belajar terisolasi. Setiap bab memuat penjelasan mendalam, rumus matematika KaTeX presisi, dan kaitan langsung dengan materi prasyarat.",
      chips: ["Modular Chapter Engine", "Prerequisite Concept Edges", "Auto-Repair Coverage"]
    },
    {
      num: "03",
      tag: "INTERACTIVE TUTOR",
      title: "Diskusi & Bedah Soal Bersama Nara AI",
      summary:
        "Tutor berlatensi sub-0.2ms untuk tanya jawab interaktif, penurunan rumus, dan klarifikasi bertingkat.",
      detail:
        "Nara mendampingi setiap baris bacaanmu. State colocation menjaga pengetikan rumus dan rendering KaTeX tetap halus di 60 FPS tanpa jeda frame.",
      chips: ["Sub-0.2ms Input Latency", "Formula Breakdown", "State Colocation 60 FPS"]
    },
    {
      num: "04",
      tag: "RETENTION DRILL",
      title: "Uji Retensi Kognitif (Feynman & Bank Salah)",
      summary:
        "Pengujian pemahaman aktif dengan teknik Feynman deterministik dan isolasi kelemahan di Bank Soal Salah.",
      detail:
        "Selesaikan kuis atomik berbasis rubrik objektif. Setiap jawaban salah langsung diarsipkan ke Bank Soal Salah untuk ditinjau ulang hingga pemahaman konsep tuntas 100%.",
      chips: ["Deterministic Scoring Rubric", "Anti-Halusinasi Evaluator", "Auto Mistake Isolation"]
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

        .hero-pill-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #c8f064;
          border: 1.5px solid #18221f;
          box-shadow: 0 0 8px rgba(200, 240, 100, 0.9);
        }

        .hero-title {
          font-size: clamp(2.2rem, 5.5vw, 3.8rem);
          font-weight: 800;
          line-height: 1.12;
          letter-spacing: -0.035em;
          color: #18221f;
          max-width: 880px;
          margin: 0 auto 20px;
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
          box-shadow: 0 26px 70px -15px rgba(24, 34, 31, 0.12), 0 0 0 1px rgba(24, 34, 31, 0.03);
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
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .bento-card:hover {
          border-color: #cbd4c8;
          box-shadow: 0 12px 36px rgba(24, 34, 31, 0.07);
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
            <a href="#arsitektur" className="landing-nav-link">Arsitektur Bento</a>
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
          <span>Sistem Studi Otonom Berbasis Bukti • Local-First</span>
        </div>

        <h1 className="hero-title">
          Belajar Mandiri Tanpa Kebisingan.<br />
          Sistem Studi Otonom Berbasis Bukti.
        </h1>

        <p className="hero-subtitle">
          Ubah dokumen tebal, catatan kuliah, atau video YouTube menjadi modul kurikulum terstruktur dalam hitungan detik. Diperkuat tutor AI berlatensi sub-0.2ms, formula KaTeX presisi, dan uji retensi deterministik.
        </p>

        <div className="hero-cta-group">
          <button className="hero-btn-launch" onClick={onLaunchApp}>
            <span>Buka Aplikasi Sekarang</span>
            <ArrowRight size={16} />
          </button>
          <a
            href="https://github.com/kaarlyz/Tanka"
            target="_blank"
            rel="noopener noreferrer"
            className="hero-btn-github"
          >
            <Star size={16} color="#eab308" fill="#eab308" />
            <span>Lihat di GitHub</span>
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
      <section id="arsitektur" className="landing-section">
        <div className="section-header">
          <span className="section-tag">ENGINE ARCHITECTURE</span>
          <h2 className="section-title">Engine Belajar Otonom Tanpa Kompromi</h2>
          <p className="section-desc">
            Arsitektur teruji yang memisahkan latensi antarmuka pengguna dari beban inferensi AI. Berjalan lokal, deterministik, dan bebas distorsi.
          </p>
        </div>

        <div className="bento-grid">
          {/* Card 1: 2 Kolom Lebar */}
          <div className="bento-card bento-span-2">
            <div className="bento-two-col">
              <div>
                <div className="bento-label">ENGINE PERFORMANCE</div>
                <h3 className="bento-title">Sub-0.2ms Input Latency & Zero Frame Drop</h3>
                <p className="bento-desc">
                  Engine rendering Markdown & KaTeX terisolasi dengan state colocation. Mengetik rumus dan berdiskusi dengan Nara AI tetap stabil di 60 FPS bahkan di smartphone terendah.
                </p>
                <div className="chip-group">
                  <span className="metric-chip">State Colocation</span>
                  <span className="metric-chip">Zero Frame Drop</span>
                  <span className="metric-chip">Isolated KaTeX Cache</span>
                </div>
              </div>
              <div className="mini-device-frame">
                <div className="mini-device-header">
                  <span className="mini-device-dot" />
                  <span className="mini-device-dot" />
                  <span className="mini-device-dot" />
                  <span style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", color: "#798782", marginLeft: 4 }}>
                    tanya-nara.tsx [sub-0.2ms]
                  </span>
                </div>
                <img
                  src="/assets/landing/bento-nara.png"
                  alt="Tanya Nara AI Engine Sub-0.2ms"
                  className="mockup-img"
                  loading="eager"
                />
              </div>
            </div>
          </div>

          {/* Card 2: 1 Kolom */}
          <div className="bento-card" id="fitur">
            <div>
              <div className="bento-label">COGNITIVE DRILL</div>
              <h3 className="bento-title">Atomic Fact Verification</h3>
              <p className="bento-desc">
                1 kartu 1 fakta atomik. Kuis dirancang dengan rubrik deterministik, menolak halusinasi AI dan melatih retensi kognitif aktif.
              </p>
            </div>
            <div className="mini-device-frame">
              <div className="mini-device-header">
                <span className="mini-device-dot" />
                <span className="mini-device-dot" />
                <span className="mini-device-dot" />
                <span style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", color: "#798782", marginLeft: 4 }}>
                  quiz-validator.ts [deterministic]
                </span>
              </div>
              <img
                src="/assets/landing/bento-quiz.png"
                alt="Atomic Quiz Verification"
                className="mockup-img"
                loading="eager"
              />
            </div>
          </div>

          {/* Card 3: 1 Kolom */}
          <div className="bento-card">
            <div>
              <div className="bento-label">KNOWLEDGE GRAPH</div>
              <h3 className="bento-title">Peta Konsep Radial Interaktif</h3>
              <p className="bento-desc">
                Visualisasi hierarki bab dan keterhubungan materi secara grafis dengan kurva bezier zaitun, memetakan alur prasyarat sebelum ujian.
              </p>
            </div>
            <div className="mini-device-frame">
              <div className="mini-device-header">
                <span className="mini-device-dot" />
                <span className="mini-device-dot" />
                <span className="mini-device-dot" />
                <span style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", color: "#798782", marginLeft: 4 }}>
                  radial-graph.svg [bezier-curves]
                </span>
              </div>
              <img
                src="/assets/landing/bento-mindmap.png"
                alt="Peta Konsep Radial Interaktif"
                className="mockup-img"
                loading="eager"
              />
            </div>
          </div>

          {/* Card 4: 2 Kolom Lebar */}
          <div className="bento-card bento-span-2">
            <div>
              <div className="bento-label">PIPELINE & OFFLINE RESILIENCE</div>
              <h3 className="bento-title">YouTube to Structured Curriculum & Offline Resilience</h3>
              <p className="bento-desc">
                Keringkan video materi 1 jam menjadi intisari bab terstruktur, tabel rumus, dan flashcards. Didukung database SQLite WAL mode dan PWA.
              </p>
              <div className="chip-group" style={{ marginTop: 12 }}>
                <span className="metric-chip">[ 100% Offline-First ]</span>
                <span className="metric-chip">[ SQLite WAL Engine ]</span>
                <span className="metric-chip">[ Zero Vendor Lock-in ]</span>
                <span className="metric-chip">[ KaTeX Math Native ]</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Stepper Section */}
      <section id="alur" className="landing-section" style={{ paddingTop: 20 }}>
        <div className="section-header">
          <span className="section-tag">ALUR KERJA DETERMINISTIK</span>
          <h2 className="section-title">Dari Tumpukan Bahan Jadi Penguasaan Konsep</h2>
          <p className="section-desc">
            Empat tahapan otomatis tanpa friksi untuk memecah materi sulit menjadi unit belajar siap uji.
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
                PIPELINE STATUS: DETERMINISTIC
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
              <span>Uji di Workspace Nyata</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <div className="landing-cta-banner">
        <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 14, color: "#ffffff" }}>
          Siap Membangun Fondasi Pemahaman Berbasis Bukti?
        </h2>
        <p style={{ fontSize: 16, color: "#b5c2bc", maxWidth: 640, margin: "0 auto 32px", lineHeight: 1.6 }}>
          Mulai olah modul belajarmu sekarang. 100% bebas biaya, tanpa iklan, dan data materi tetap tersimpan privat di browser dan perangkat lokalmu.
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
          <span>Luncurkan Tanka Sekarang</span>
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
                Tanka — Platform Belajar Mandiri Otonom untuk Pelajar & Mahasiswa Berorientasi Bukti.
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
                  PRIVASI & SPESIFIKASI
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <span style={{ fontSize: 13, color: "#5f6b66" }}>
                    Local-First SQLite Storage
                  </span>
                  <span style={{ fontSize: 13, color: "#5f6b66" }}>
                    Deterministic Evaluation
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <span>© 2026 Tanka by kaarlyz. All rights reserved.</span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12 }}>
              Built with React 19 • KaTeX • Local SQLite WAL
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
