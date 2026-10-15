import React from "react";
import { ArrowRight } from "lucide-react";
import { SimulatorNaraCard } from "./SimulatorNaraCard";

export interface HeroSectionProps {
  onActionLaunch: () => void;
}

export function HeroSection({ onActionLaunch }: HeroSectionProps) {
  return (
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
  );
}

export default HeroSection;
