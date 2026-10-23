import React from "react";
import { ArrowRight } from "lucide-react";
import { UserAccount } from "../../types";

export interface LandingNavbarProps {
  onActionLaunch: () => void;
  onOpenAuth: (mode?: "login" | "register") => void;
  currentUser?: UserAccount | null;
}

export function LandingNavbar({
  onActionLaunch,
  onOpenAuth,
  currentUser
}: LandingNavbarProps) {
  return (
    <nav className="landing-nav">
      <div className="landing-nav-inner">
        <div className="landing-brand" onClick={onActionLaunch}>
          <div className="landing-brand-box">t</div>
          <span className="landing-brand-text">tanka.</span>
        </div>

        <div className="landing-nav-links">
          <a href="#tanya-nara" className="landing-nav-link">Tanya Nara</a>
          <a href="#keunggulan" className="landing-nav-link">Keunggulan</a>
          <a href="#peta-konsep" className="landing-nav-link">Peta Konsep</a>
          <a href="#bedah-soal" className="landing-nav-link">Bedah Soal</a>
          <a href="#perbandingan" className="landing-nav-link">Bandingkan</a>
          <a href="#alur" className="landing-nav-link">Cara Kerja</a>
          <a href="#testimoni" className="landing-nav-link">Cerita Mereka</a>
        </div>

        <div className="landing-nav-actions">
          {currentUser ? (
            <span
              style={{
                fontSize: 13,
                fontFamily: "'DM Mono', monospace",
                fontWeight: 600,
                color: "#283832",
                padding: "6px 12px",
                background: "#eef2eb",
                borderRadius: 8
              }}
            >
              @{currentUser.username}
            </span>
          ) : (
            <button
              className="landing-btn-ghost"
              onClick={() => onOpenAuth("register")}
            >
              Masuk
            </button>
          )}
          <button
            className="landing-btn-primary"
            onClick={onActionLaunch}
          >
            <span>Buka Aplikasi</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </nav>
  );
}

export default LandingNavbar;
