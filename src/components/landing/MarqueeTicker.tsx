import React from "react";

export function MarqueeTicker() {
  return (
    <div className="landing-marquee-wrapper reveal-scroll">
      <div className="landing-marquee-track">
        {[...Array(2)].map((_, trackIdx) => (
          <div className="landing-marquee-content" key={trackIdx}>
            <span className="marquee-pill">
              <span className="marquee-dot-pulse" />
              PENURUNAN RUMUS KONTINU
            </span>
            <span className="marquee-separator">•</span>
            <span className="marquee-pill">
              <span className="marquee-dot-pulse" />
              TUTOR NARA SIAGA 24 JAM
            </span>
            <span className="marquee-separator">•</span>
            <span className="marquee-pill">
              <span className="marquee-dot-pulse" />
              MODUL PER BAB SIAP SANTAP
            </span>
            <span className="marquee-separator">•</span>
            <span className="marquee-pill">
              <span className="marquee-dot-pulse" />
              KUIS DETERMINISTIK ATOMIK
            </span>
            <span className="marquee-separator">•</span>
            <span className="marquee-pill">
              <span className="marquee-dot-pulse" />
              FOKUS BELAJAR BEBAS DISTRAKSI
            </span>
            <span className="marquee-separator">•</span>
            <span className="marquee-pill">
              <span className="marquee-dot-pulse" />
              PEMAHAMAN BERBASIS BUKTI
            </span>
            <span className="marquee-separator">•</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MarqueeTicker;
