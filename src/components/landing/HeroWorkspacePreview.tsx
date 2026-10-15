import React from "react";
import { BookOpen, Brain, Lock } from "lucide-react";

export interface HeroWorkspacePreviewProps {
  onActionLaunch?: () => void;
}

export function HeroWorkspacePreview({ onActionLaunch }: HeroWorkspacePreviewProps = {}) {
  return (
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
  );
}

export default HeroWorkspacePreview;
