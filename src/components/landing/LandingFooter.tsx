import React from "react";

export interface LandingFooterProps {
  onActionLaunch: () => void;
}

export function LandingFooter({ onActionLaunch }: LandingFooterProps) {
  return (
    <footer className="landing-footer">
      <div className="landing-footer-inner">
        <div className="footer-top">
          <div>
            <div
              className="landing-brand"
              onClick={onActionLaunch}
              style={{ marginBottom: 14 }}
            >
              <div className="landing-brand-box">t</div>
              <span className="landing-brand-text">tanka.</span>
            </div>
            <p
              style={{
                fontSize: 14.5,
                lineHeight: 1.68,
                color: "#55635e",
                maxWidth: 380
              }}
            >
              Platform Belajar Mandiri Adaptif dengan Pendamping AI Nara untuk Siswa SMA & Mahasiswa.
            </p>
          </div>

          <div>
            <div
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 11.5,
                fontWeight: 800,
                color: "#18221f",
                marginBottom: 14,
                letterSpacing: "0.08em",
                textTransform: "uppercase"
              }}
            >
              NAVIGASI FITUR
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <a
                href="#keunggulan"
                style={{
                  fontSize: 13.5,
                  color: "#55635e",
                  textDecoration: "none",
                  transition: "color 0.15s ease"
                }}
              >
                Tutor Nara AI 24 Jam
              </a>
              <a
                href="#keunggulan"
                style={{
                  fontSize: 13.5,
                  color: "#55635e",
                  textDecoration: "none",
                  transition: "color 0.15s ease"
                }}
              >
                Rangkum Video & Dokumen
              </a>
              <a
                href="#keunggulan"
                style={{
                  fontSize: 13.5,
                  color: "#55635e",
                  textDecoration: "none",
                  transition: "color 0.15s ease"
                }}
              >
                Kuis Logika & Bank Salah
              </a>
              <a
                href="#keunggulan"
                style={{
                  fontSize: 13.5,
                  color: "#55635e",
                  textDecoration: "none",
                  transition: "color 0.15s ease"
                }}
              >
                Peta Saraf Materi
              </a>
            </div>
          </div>

          <div>
            <div
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 11.5,
                fontWeight: 800,
                color: "#18221f",
                marginBottom: 14,
                letterSpacing: "0.08em",
                textTransform: "uppercase"
              }}
            >
              PRINSIP & PRIVASI
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <span style={{ fontSize: 13.5, color: "#55635e" }}>
                100% Data Privat di Perangkat
              </span>
              <span style={{ fontSize: 13.5, color: "#55635e" }}>
                Fokus Penuh pada Materi
              </span>
              <span style={{ fontSize: 13.5, color: "#55635e" }}>
                Pendamping AI Nara 24 Jam
              </span>
              <span style={{ fontSize: 13.5, color: "#55635e" }}>
                Arsitektur Berintegritas Tinggi
              </span>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© 2026 Tanka. Seluruh hak cipta dilindungi.</span>
          <span
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 12.5,
              color: "#4b6623",
              fontWeight: 700
            }}
          >
            Platform Belajar Mandiri Adaptif
          </span>
        </div>
      </div>
    </footer>
  );
}

export default LandingFooter;
