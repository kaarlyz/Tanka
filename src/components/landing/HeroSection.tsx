import React, { useState } from "react";
import { ArrowRight, Sparkles, FileText } from "lucide-react";
import { SimulatorNaraCard } from "./SimulatorNaraCard";

export interface HeroSectionProps {
  onActionLaunch: () => void;
}

export function HeroSection({ onActionLaunch }: HeroSectionProps) {
  const [sourceQuery, setSourceQuery] = useState("");

  const handleChipClick = (topic: string) => {
    setSourceQuery(topic);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onActionLaunch();
  };

  return (
    <section className="landing-hero-asymmetric">
      <div className="hero-split-grid">
        {/* Kolom Kiri: Headline, Direct Action Input & Value Prop */}
        <div className="hero-split-left">
          <div className="hero-badge-tag">
            <span className="hero-badge-dot" />
            <span>PERSIAPAN TKA & UTBK 2026</span>
          </div>

          <h1 className="hero-title-left">
            Ubah materi apapun,
            <span className="hero-title-highlight">
              jadi langsung bisa dipahami.
            </span>
          </h1>

          <p className="hero-subtitle-left">
            Tumpahkan materi kuliah, buku tebal, atau video YouTube panjang. Tanka membedahnya jadi bab terstruktur dan mendampingimu langkah demi langkah sampai benar-benar mengerti konsep dasarnya.
          </p>

          {/* Direct Interactive Action Bar (Argon Blueprint) */}
          <form className="hero-direct-input-form" onSubmit={handleSubmit}>
            <div className="hero-input-shell">
              <input
                type="text"
                className="clean-input hero-direct-input"
                value={sourceQuery}
                onChange={(e) => setSourceQuery(e.target.value)}
                placeholder="Tempel link YouTube atau ketik topik materi..."
                aria-label="Sumber materi belajar"
              />
              <button type="submit" className="hero-btn-direct">
                <span>Bedah Materi</span>
                <ArrowRight size={15} />
              </button>
            </div>

            <div className="hero-quick-chips">
              <span className="chips-label">COBA TOPIK:</span>
              <button
                type="button"
                className="hero-quick-chip"
                onClick={() => handleChipClick("Limit Trigonometri Tak Hingga")}
              >
                <Sparkles size={11} />
                <span>Limit Trigonometri</span>
              </button>
              <button
                type="button"
                className="hero-quick-chip"
                onClick={() => handleChipClick("Determinan Matriks 2×2 & Invers")}
              >
                <FileText size={11} />
                <span>Matriks & Invers</span>
              </button>
            </div>
          </form>
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