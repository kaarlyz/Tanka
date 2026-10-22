import React from "react";
import { Star } from "lucide-react";
import { TiltCard } from "./motion/MotionKit";

export function PersonasSection() {
  return (
    <section id="testimoni" className="landing-section">
      <div className="section-header-center reveal-scroll">
        <span className="section-kicker">CERITA TEMAN BELAJAR</span>
        <h2 className="section-title">Teman Belajar Pejuang Ujian & Mahasiswa</h2>
        <p className="section-desc">
          Bukan sekadar klaim. Inilah pengalaman nyata teman-teman yang belajar lebih tenang bersama Tanka.
        </p>
      </div>

      <div className="persona-grid">
        {/* Persona 1: Dafa */}
        <TiltCard className="persona-card reveal-scroll">
          <div>
            <div style={{ display: "flex", gap: 3, marginBottom: 14 }}>
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={15} color="#eab308" fill="#eab308" />
              ))}
            </div>
            <p style={{ fontSize: 14.5, lineHeight: 1.65, color: "#18221f", fontStyle: "italic", marginBottom: 20 }}>
              "Paling kebantu sama Bank Salah dan kuis 1 kartu 1 fakta. Gak ada soal jebakan ngaco, rumus matematika langsung diterjemahin step by step."
            </p>
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: "#18221f" }}>Dafa</div>
            <div style={{ fontSize: 12.5, color: "#60706a" }}>Siswa Kelas XII / Pejuang SNBT</div>
            <div style={{ marginTop: 8 }}>
              <span style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", background: "#f2f5ef", padding: "4px 9px", borderRadius: 6, color: "#283832", fontWeight: 600 }}>
                ✓ Pejuang Ujian 2026
              </span>
            </div>
          </div>
        </TiltCard>

        {/* Persona 2: Nadia */}
        <TiltCard className="persona-card reveal-scroll delay-1">
          <div>
            <div style={{ display: "flex", gap: 3, marginBottom: 14 }}>
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={15} color="#eab308" fill="#eab308" />
              ))}
            </div>
            <p style={{ fontSize: 14.5, lineHeight: 1.65, color: "#18221f", fontStyle: "italic", marginBottom: 20 }}>
              "Kuliah sering dikasih jurnal 40 halaman. Dimasukin ke Tanka langsung jadi bab-bab kecil yang gampang dicerna sebelum kuis mingguan."
            </p>
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: "#18221f" }}>Nadia</div>
            <div style={{ fontSize: 12.5, color: "#60706a" }}>Mahasiswi Biologi</div>
            <div style={{ marginTop: 8 }}>
              <span style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", background: "#f2f5ef", padding: "4px 9px", borderRadius: 6, color: "#283832", fontWeight: 600 }}>
                ✓ Rangkum Jurnal Cepat
              </span>
            </div>
          </div>
        </TiltCard>

        {/* Persona 3: Rian */}
        <TiltCard className="persona-card reveal-scroll delay-2">
          <div>
            <div style={{ display: "flex", gap: 3, marginBottom: 14 }}>
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={15} color="#eab308" fill="#eab308" />
              ))}
            </div>
            <p style={{ fontSize: 14.5, lineHeight: 1.65, color: "#18221f", fontStyle: "italic", marginBottom: 20 }}>
              "Bisa belajar offline di cafe atau perpus tanpa takut kuota jebol. Tampilannya bersih banget dan gak ada iklan bikin pusing."
            </p>
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: "#18221f" }}>Rian</div>
            <div style={{ fontSize: 12.5, color: "#60706a" }}>Gap Year Pejuang Kampus</div>
            <div style={{ marginTop: 8 }}>
              <span style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", background: "#f2f5ef", padding: "4px 9px", borderRadius: 6, color: "#283832", fontWeight: 600 }}>
                ✓ 100% Offline di Kafe
              </span>
            </div>
          </div>
        </TiltCard>
      </div>
    </section>
  );
}

export default PersonasSection;
