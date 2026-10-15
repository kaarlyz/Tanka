import React from "react";
import { ShieldCheck, WifiOff, Database, Target } from "lucide-react";

export function MarqueeTicker() {
  const PILLARS = [
    {
      icon: Target,
      tag: "TKA 2026 READY",
      desc: "Matematika, Sosiologi, Ekonomi & B. Indo"
    },
    {
      icon: WifiOff,
      tag: "100% OFFLINE PWA",
      desc: "Simpan lokal & belajar tanpa internet"
    },
    {
      icon: Database,
      tag: "SQLITE PRIVAT",
      desc: "Data tersimpan di perangkatmu, tanpa tracker"
    },
    {
      icon: ShieldCheck,
      tag: "ZERO DISTRAKSI",
      desc: "Bebas iklan, tanpa langganan jebakan"
    }
  ];

  return (
    <section className="landing-trust-ledger-section reveal-scroll">
      <div className="trust-ledger-container">
        <div className="trust-ledger-grid">
          {PILLARS.map((p, idx) => {
            const Icon = p.icon;
            return (
              <div key={idx} className="trust-ledger-card">
                <div className="trust-card-header">
                  <span className="trust-card-icon">
                    <Icon size={15} />
                  </span>
                  <span className="trust-card-tag font-mono">{p.tag}</span>
                </div>
                <p className="trust-card-desc">{p.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default MarqueeTicker;