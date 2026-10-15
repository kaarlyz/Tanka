import React from "react";
import { ArrowRight, BookOpen, Brain, Lock } from "lucide-react";
import { SimulatorNaraCard } from "./SimulatorNaraCard";

export interface HeroSectionProps {
  onActionLaunch: () => void;
}

export function HeroSection({ onActionLaunch }: HeroSectionProps) {
  return (
    <>
      <section className="landing-hero-asymmetric">
        <div className="hero-split-grid">
          {/* Kolom Kiri: Headline & Value Proposition Rata Kiri */}
          <div className="hero-split-left">
            <h1 className="hero-title-left">
              Ubah materi apapun,
              <span className="hero-title-highlight">
                jadi langsung bisa dipahami.
              </span>
            </h1>

            <p className="hero-subtitle-left">
              Tumpahkan materi kuliah, buku tebal, atau video YouTube panjang. Tanka membedahnya jadi bab terstruktur dan mendampingimu langkah demi langkah sampai benar-benar mengerti konsep dasarnya.
            </p>

            <div className="hero-cta-left">
              <button className="hero-btn-main" onClick={onActionLaunch}>
                <span>Mulai Belajar Sekarang — Gratis</span>
                <ArrowRight size={17} />
              </button>
            </div>
          </div>

          {/* Kolom Kanan: Simulator Chat Nara AI yang Hidup */}
          <div className="hero-split-right" id="tanya-nara">
            <SimulatorNaraCard onActionLaunch={onActionLaunch} />
          </div>
        </div>
      </section>

      {/* Ritme Tengah: Full-Width 3D Mockup & Satellite Badges */}
      <div className="mockup-break-section">
        <div className="hero-mockup-container reveal-scroll delay-2">
          {/* Floating Badges */}
          <div className="hero-float-badge float-top-left">
            <div className="float-badge-icon-box">
              <BookOpen size={18} color="#4b6623" />
            </div>
            <div className="float-badge-text">
              <strong>Bab Santai 3 Menit</strong>
              <small>Otomatis dipotong ringkas</small>
            </div>
          </div>

          <div className="hero-float-badge float-top-right">
            <div className="float-badge-icon-box">
              <Brain size={18} color="#4b6623" />
            </div>
            <div className="float-badge-text">
              <strong>Nara AI Siaga 24 Jam</strong>
              <small>Tanya rumus tanpa batas</small>
            </div>
          </div>

          <div className="mockup-window">
            <div className="mockup-chrome">
              <div className="mockup-dots">
                <span className="mockup-dot" style={{ background: "#ff5f56" }} />
                <span className="mockup-dot" style={{ background: "#ffbd2e" }} />
                <span className="mockup-dot" style={{ background: "#27c93f" }} />
              </div>
              <div className="mockup-url-pill">
                <Lock size={11} />
                <span>tanka.app/modul/operasi-himpunan</span>
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
        </div>
      </div>
    </>
  );
}

export default HeroSection;
