import React, { useState } from "react";
import { X, Check, RotateCw, Video, FileText, Brain, ShieldCheck, LucideIcon } from "lucide-react";

interface ComparisonItem {
  id: string;
  icon: LucideIcon;
  category: string;
  number: string;
  // Sisi Depan (Cara Lama)
  oldTitle: string;
  oldDesc: string;
  oldDetail: string;
  // Sisi Belakang (Cara Tanka)
  tankaTitle: string;
  tankaDesc: string;
  tankaDetail: string;
}

const COMPARISON_DATA: ComparisonItem[] = [
  {
    id: "video",
    icon: Video,
    category: "VIDEO YOUTUBE",
    number: "01",
    oldTitle: "Video 2 Jam Bikin Lelah",
    oldDesc: "Nonton video panjang 2 jam, baru mulai paham 1 rumus di menit ke-45.",
    oldDetail: "Waktu terbuang untuk intro, sponsor, dan penjelasan bertele-tele.",
    tankaTitle: "Modul Ringkas 3 Menit",
    tankaDesc: "Video panjang dipadatkan jadi 3 bab modul bacaan siap santap.",
    tankaDetail: "Dilengkapi penurunan rumus langkah demi langkah tanpa membuang waktu."
  },
  {
    id: "pdf",
    icon: FileText,
    category: "PDF & BUKU TEBAL",
    number: "02",
    oldTitle: "PDF 200 Halaman Bikin Pusing",
    oldDesc: "Buka PDF tebal, scroll tanpa arah sampai mata capek dan hilang fokus.",
    oldDetail: "Materi tercampur aduk tanpa peta urutan konsep yang jelas.",
    tankaTitle: "Pecah Otomatis per Bab",
    tankaDesc: "Dokumen tebal otomatis dipotong per konsep logis siap dipelajari.",
    tankaDetail: "Format reader buku digital dengan rumus KaTeX rapi dan diagram alur."
  },
  {
    id: "mentor",
    icon: Brain,
    category: "BIMBINGAN BELAJAR",
    number: "03",
    oldTitle: "Malu & Segan Bertanya",
    oldDesc: "Mau nanya guru atau teman merasa segan, takut dikira tidak memperhatikan.",
    oldDetail: "Akhirnya materi yang belum dipahami dibiarkan menumpuk sampai ujian.",
    tankaTitle: "Nara AI Siaga 24 Jam",
    tankaDesc: "Tanya tutor AI kapan saja tanpa rasa malu, diterangkan sampai benar-benar paham.",
    tankaDetail: "Penjelasan adaptif langkah demi langkah, sabar, dan bebas penghakiman."
  },
  {
    id: "environment",
    icon: ShieldCheck,
    category: "FOKUS & PRIVASI",
    number: "04",
    oldTitle: "Terganggu Iklan & Notifikasi",
    oldDesc: "Belajar di internet sering terdistraksi pop-up iklan, kuota boros, dan notifikasi.",
    oldDetail: "Catatan belajar tercecer di berbagai aplikasi dan rentan hilang.",
    tankaTitle: "Tanpa Iklan, Bisa Dibaca Offline",
    tankaDesc: "Nol iklan yang mengalihkan perhatian, dan materi yang sudah dibuka bisa dibaca lagi tanpa internet.",
    tankaDetail: "Aplikasi PWA ringan, hemat kuota data, dan bebas dari pelacak komersial."
  }
];

export function ComparisonLedger() {
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({
    video: true,
    pdf: false,
    mentor: true,
    environment: false
  });

  const toggleCard = (id: string) => {
    setFlippedCards((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const flipAllCards = (targetState: boolean) => {
    const nextState: Record<string, boolean> = {};
    COMPARISON_DATA.forEach((item) => {
      nextState[item.id] = targetState;
    });
    setFlippedCards(nextState);
  };

  const isAllFlipped = Object.values(flippedCards).filter(Boolean).length >= 3;

  return (
    <section id="perbandingan" className="landing-section landing-section--dark">
      <div className="section-header-left comparison-header-area reveal-scroll">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 14 }}>
          <div>
            <span className="section-kicker">PERBANDINGAN NYATA</span>
            <h2 className="section-title">Tinggalkan Frustrasi Belajar Cara Lama</h2>
            <p className="section-desc">
              Klik setiap kartu flashcard untuk melihat transformasi belajar dari cara lama yang menguras energi ke cara Tanka.
            </p>
          </div>

          {/* Quick Toggle Button: Balik Semua Kartu */}
          <button
            type="button"
            className="flashcard-toggle-all-btn"
            onClick={() => flipAllCards(!isAllFlipped)}
            title="Balik semua kartu sekaligus"
          >
            <RotateCw size={13} />
            <span>{isAllFlipped ? "Tampilkan Semua Masalah" : "Tampilkan Semua Solusi Tanka"}</span>
          </button>
        </div>
      </div>

      {/* 4-Column Responsive 3D Flashcard Grid */}
      <div className="comparison-flashcard-grid reveal-scroll">
        {COMPARISON_DATA.map((item, idx) => {
          const Icon = item.icon;
          const isFlipped = !!flippedCards[item.id];

          return (
            <div
              key={item.id}
              className={`comparison-flashcard-container ${isFlipped ? "is-flipped" : ""}`}
              onClick={() => toggleCard(item.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggleCard(item.id);
                }
              }}
              role="button"
              tabIndex={0}
              aria-label={`Kartu ${item.category}: ${isFlipped ? "Solusi Tanka" : "Cara Lama"}. Klik untuk membalik.`}
            >
              <div
                className="comparison-flashcard-inner"
                style={{ "--i": idx } as React.CSSProperties}
              >
                {/* SISI DEPAN (CARA LAMA) */}
                <div className="comparison-flashcard-face comparison-face-front">
                  <div>
                    <div className="flashcard-meta-row">
                      <span className="flashcard-badge old">
                        <X size={11} />
                        <span>CARA LAMA</span>
                      </span>
                      <span className="flashcard-step-num">{item.number} / 04</span>
                    </div>

                    <div className="flashcard-category-tag">
                      <Icon size={12} color="#dc2626" />
                      <span>{item.category}</span>
                    </div>

                    <h3 className="flashcard-title old">{item.oldTitle}</h3>
                    <p className="flashcard-desc old">{item.oldDesc}</p>
                    <div className="flashcard-detail-pill old">{item.oldDetail}</div>
                  </div>

                  <div className="flashcard-flip-prompt old">
                    <RotateCw size={12} />
                    <span>Klik untuk lihat solusi Tanka ➔</span>
                  </div>
                </div>

                {/* SISI BELAKANG (CARA TANKA) */}
                <div className="comparison-flashcard-face comparison-face-back">
                  <div>
                    <div className="flashcard-meta-row">
                      <span className="flashcard-badge tanka">
                        <Check size={11} />
                        <span>BERSAMA TANKA</span>
                      </span>
                      <span className="flashcard-step-num tanka">{item.number} / 04</span>
                    </div>

                    <div className="flashcard-category-tag tanka">
                      <Icon size={12} color="#c8f064" />
                      <span>{item.category}</span>
                    </div>

                    <h3 className="flashcard-title tanka">{item.tankaTitle}</h3>
                    <p className="flashcard-desc tanka">{item.tankaDesc}</p>
                    <div className="flashcard-detail-pill tanka">{item.tankaDetail}</div>
                  </div>

                  <div className="flashcard-flip-prompt tanka">
                    <RotateCw size={12} />
                    <span>Klik untuk lihat cara lama ➔</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default ComparisonLedger;
