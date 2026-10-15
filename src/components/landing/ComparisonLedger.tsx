import React from "react";
import { X, Check, CheckCircle2 } from "lucide-react";

export function ComparisonLedger() {
  return (
    <section id="perbandingan" className="landing-section">
      <div className="section-header-left reveal-scroll">
        <span className="section-kicker">PERBANDINGAN NYATA</span>
        <h2 className="section-title">Tinggalkan Frustrasi Belajar Cara Lama</h2>
        <p className="section-desc">
          Bandingkan rasanya belajar konvensional yang menguras tenaga dengan sistem belajar mandiri di Tanka.
        </p>
      </div>

      {/* Side-by-side permanent comparison cards */}
      <div className="comparison-dual-grid reveal-scroll">
        {/* Left Card: Cara Lama */}
        <div className="battle-card old-way">
          <div>
            <div className="battle-header-pill old">
              <X size={12} />
              <span>CARA LAMA YANG MENGURAS ENERGI</span>
            </div>
            <h3 className="battle-title">Bikin Lelah Sebelum Paham Intinya</h3>
            <p className="battle-desc">
              Tumpukan materi tebal yang sering membuat overthinking dan bingung harus mulai dari mana.
            </p>
          </div>

          <div className="battle-list">
            <div className="battle-item">
              <X size={18} color="#dc2626" style={{ flexShrink: 0, marginTop: 2 }} />
              <span>Nonton video penjelasan 2 jam, baru paham 1 rumus di menit ke-45.</span>
            </div>
            <div className="battle-item">
              <X size={18} color="#dc2626" style={{ flexShrink: 0, marginTop: 2 }} />
              <span>Buka PDF 200 halaman, scroll tanpa arah sampai mata capek dan hilang fokus.</span>
            </div>
            <div className="battle-item">
              <X size={18} color="#dc2626" style={{ flexShrink: 0, marginTop: 2 }} />
              <span>Mau nanya guru atau teman segan dan malu, takut dikira gak memperhatikan.</span>
            </div>
            <div className="battle-item">
              <X size={18} color="#dc2626" style={{ flexShrink: 0, marginTop: 2 }} />
              <span>Belajar di internet sering terdistraksi pop-up iklan dan notifikasi aplikasi lain.</span>
            </div>
          </div>
        </div>

        {/* Right Card: Cara Tanka with Border Glow Beam */}
        <div className="battle-card tanka-way">
          <div>
            <div className="battle-header-pill tanka">
              <Check size={12} />
              <span>BERSAMA TANKA</span>
            </div>
            <h3 className="battle-title">Langsung Paham, Terarah & Cepat</h3>
            <p className="battle-desc">
              Pecah materi jadi modul kecil yang dirancang agar pemahamanmu bertahan lama sampai ujian.
            </p>
          </div>

          <div className="battle-list">
            <div className="battle-item">
              <CheckCircle2 size={18} color="#4b6623" style={{ flexShrink: 0, marginTop: 2 }} />
              <span>Video panjang dipadatkan jadi 3 bab modul bacaan 3 menitan siap santap.</span>
            </div>
            <div className="battle-item">
              <CheckCircle2 size={18} color="#4b6623" style={{ flexShrink: 0, marginTop: 2 }} />
              <span>Dokumen tebal otomatis dipotong per konsep logis lengkap dengan rumus KaTeX rapi.</span>
            </div>
            <div className="battle-item">
              <CheckCircle2 size={18} color="#4b6623" style={{ flexShrink: 0, marginTop: 2 }} />
              <span>Tanya tutor Nara AI kapan saja tanpa rasa malu, diterangkan sampai kamu benar-benar paham.</span>
            </div>
            <div className="battle-item">
              <CheckCircle2 size={18} color="#4b6623" style={{ flexShrink: 0, marginTop: 2 }} />
              <span>100% bebas iklan, catatan tersimpan aman di perangkatmu sendiri, dan bisa dibuka offline.</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ComparisonLedger;
