import React from "react";
import { ArrowRight } from "lucide-react";

export interface CtaBannerProps {
  onActionLaunch: () => void;
}

export function CtaBanner({ onActionLaunch }: CtaBannerProps) {
  return (
    <div className="landing-cta-banner reveal-scroll">
      <h2
        style={{
          fontSize: "clamp(1.9rem, 4.2vw, 3rem)",
          fontWeight: 800,
          letterSpacing: "-0.03em",
          marginBottom: 16,
          color: "#ffffff"
        }}
      >
        Siap Paham Materi Lebih Cepat dan Tenang?
      </h2>
      <p
        style={{
          fontSize: 16.5,
          color: "#b5c2bc",
          maxWidth: 660,
          margin: "0 auto 34px",
          lineHeight: 1.65
        }}
      >
        Buka materi pertamamu sekarang. 100% bebas biaya, tanpa iklan mengganggu, dan catatan belajarmu tersimpan aman di perangkatmu.
      </p>
      <button
        className="landing-cta-btn"
        onClick={onActionLaunch}
        style={{
          background: "#c8f064",
          color: "#18221f",
          border: "none",
          borderRadius: 12,
          padding: "16px 38px",
          fontSize: 16,
          fontWeight: 800,
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
          boxShadow: "0 8px 26px rgba(200, 240, 100, 0.35)",
          transition: "transform 0.2s ease"
        }}
      >
        <span>Mulai Belajar Sekarang — Gratis</span>
        <ArrowRight size={18} />
      </button>
    </div>
  );
}

export default CtaBanner;
