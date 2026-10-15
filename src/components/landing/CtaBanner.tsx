import React from "react";
import { ArrowRight } from "lucide-react";

export interface CtaBannerProps {
  onActionLaunch: () => void;
}

export function CtaBanner({ onActionLaunch }: CtaBannerProps) {
  return (
    <div className="landing-cta-banner reveal-scroll">
      <h2 className="landing-cta-title">
        Siap Paham Materi Lebih Cepat dan Tenang?
      </h2>
      <p className="landing-cta-desc">
        Buka materi pertamamu sekarang. 100% bebas biaya, tanpa iklan mengganggu, dan catatan belajarmu tersimpan aman di perangkatmu.
      </p>
      <button
        className="landing-cta-btn"
        onClick={onActionLaunch}
      >
        <span>Mulai Belajar Sekarang — Gratis</span>
        <ArrowRight size={18} />
      </button>
    </div>
  );
}

export default CtaBanner;
