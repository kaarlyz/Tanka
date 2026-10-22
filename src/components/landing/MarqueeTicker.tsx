import React from "react";

export function MarqueeTicker() {
  return (
    <div className="landing-marquee-wrapper reveal-scroll">
      <div className="landing-marquee-track">
        {[...Array(2)].map((_, trackIdx) => (
          <div className="landing-marquee-content" key={trackIdx}>
            <span className="marquee-pill">
              <span className="marquee-dot-pulse" />
              RUMUS DIJELASKAN LANGKAH DEMI LANGKAH
            </span>
            <span className="marquee-separator">•</span>
            <span className="marquee-pill">
              <span className="marquee-dot-pulse" />
              TANYA NARA KAPAN SAJA
            </span>
            <span className="marquee-separator">•</span>
            <span className="marquee-pill">
              <span className="marquee-dot-pulse" />
              MATERI DIPECAH JADI BAB PENDEK
            </span>
            <span className="marquee-separator">•</span>
            <span className="marquee-pill">
              <span className="marquee-dot-pulse" />
              KUIS DARI MATERIMU SENDIRI
            </span>
            <span className="marquee-separator">•</span>
            <span className="marquee-pill">
              <span className="marquee-dot-pulse" />
              SOAL SALAH DICATAT OTOMATIS
            </span>
            <span className="marquee-separator">•</span>
            <span className="marquee-pill">
              <span className="marquee-dot-pulse" />
              TANPA IKLAN, BEBAS DISTRAKSI
            </span>
            <span className="marquee-separator">•</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MarqueeTicker;
