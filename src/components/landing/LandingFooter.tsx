import React from "react";

export interface LandingFooterProps {
  onActionLaunch: () => void;
}

export function LandingFooter({ onActionLaunch }: LandingFooterProps) {
  return (
    <footer className="landing-footer">
      <div className="landing-footer-inner">
        <div className="footer-top">
          <div className="footer-col-main">
            <div
              className="landing-brand footer-brand-wrap"
              onClick={onActionLaunch}
            >
              <div className="landing-brand-box">t</div>
              <span className="landing-brand-text">tanka.</span>
            </div>
            <p className="footer-brand-desc">
              Platform Belajar Mandiri Adaptif dengan Pendamping AI Nara untuk Siswa SMA & Mahasiswa.
            </p>
          </div>

          <div className="footer-col-nav">
            <div className="footer-col-title font-mono">
              NAVIGASI FITUR
            </div>
            <div className="footer-links-list">
              <a href="#keunggulan" className="footer-link">
                Tutor Nara AI 24 Jam
              </a>
              <a href="#keunggulan" className="footer-link">
                Rangkum Video & Dokumen
              </a>
              <a href="#keunggulan" className="footer-link">
                Kuis Logika & Bank Salah
              </a>
              <a href="#keunggulan" className="footer-link">
                Peta Saraf Materi
              </a>
            </div>
          </div>

          <div className="footer-col-principles">
            <div className="footer-col-title font-mono">
              PRINSIP & PRIVASI
            </div>
            <div className="footer-text-list">
              <span className="footer-text-item">
                100% Data Privat di Perangkat
              </span>
              <span className="footer-text-item">
                Fokus Penuh pada Materi
              </span>
              <span className="footer-text-item">
                Pendamping AI Nara 24 Jam
              </span>
              <span className="footer-text-item">
                Arsitektur Berintegritas Tinggi
              </span>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© 2026 Tanka. Designed & Architected by Eka Restu Syahputra. Seluruh hak cipta dilindungi.</span>
          <span className="footer-badge font-mono">
            Platform Belajar Mandiri Adaptif
          </span>
        </div>
      </div>
    </footer>
  );
}

export default LandingFooter;
