import React from "react";
import { ArrowRight } from "lucide-react";
import { SimulatorNaraCard } from "./SimulatorNaraCard";
import { SplitWords, Magnetic } from "./motion/MotionKit";

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
            <SplitWords text="Ubah materi apapun," />
            <span className="hero-title-highlight">
              <SplitWords text="jadi langsung bisa dipahami." delay={0.25} />
            </span>
          </h1>

          <p className="hero-subtitle-left">
            Unggah PDF, slide, foto catatan, atau tempel link video kuliah. Tanka memecahnya jadi bab pendek, menjelaskan rumus langkah demi langkah, lalu menguji pemahamanmu.
          </p>

          <div className="hero-cta-left">
            <Magnetic>
              <button className="hero-btn-main" onClick={onActionLaunch}>
                <span>Mulai Belajar Sekarang — Gratis</span>
                <ArrowRight size={17} />
              </button>
            </Magnetic>
          </div>
        </div>

        {/* Kolom Kanan: Simulator Chat Nara AI */}
        <div className="hero-split-right" id="tanya-nara">
          <SimulatorNaraCard onActionLaunch={onActionLaunch} />
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
