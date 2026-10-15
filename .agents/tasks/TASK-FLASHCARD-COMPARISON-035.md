# TASK: TASK-FLASHCARD-COMPARISON-035
## MODE: VISUAL_PRODUCT & INTERACTION DESIGN
## SURFACE ARCHETYPE: 3D Interactive Comparison Flashcards

## METADATA
- Project: Tanka (/home/vallencia/Projects/tanka)
- Target Files:
  - `src/components/landing/ComparisonLedger.tsx`
  - `src/components/landing/landing.css`
- Assigned: MARAKA (maraka)
- Reviewer & Auditor: AURA (gikano)
- Authority: Eka

---

## 1. OBJECTIVE & ROOT CAUSE EXPLANATION
Pengguna menginstruksikan:
> *"btw unntuk tanka ak mau dong diubah designnya dimana untuk yg page "perbandingan nyata" nah itu buat kek style flashcard gitu ... dan buat lebih bagus"*
> Pilihan yang dikonfirmasi: **Grid 4 Flashcard 3D (4 kartu berdampingan, tiap kartu bisa diklik bolak-balik: Masalah ➔ Solusi Tanka)**.

### Konsep Desain Kelas Dunia (Linear / Apple Books Standard):
1. Mengubah tampilan komparasi 2 kolom statis menjadi **Grid 4 Kartu Flashcard 3D Interaktif**.
2. Setiap kartu merepresentasikan 1 pilar perbandingan nyata:
   - Kartu 01: Video YouTube (Video 2 Jam vs Rangkuman 3 Menit)
   - Kartu 02: PDF & Dokumen Tebal (PDF 200 Halaman vs Modular per Bab)
   - Kartu 03: Bertanya ke Mentor (Malu & Segan vs Nara AI Siaga 24 Jam)
   - Kartu 04: Lingkungan Belajar (Distraksi Iklan vs 100% Bersih & Offline)
3. Interaktivitas Flashcard 3D:
   - Sisi Depan (Front): Menampilkan masalah nyata Cara Lama (merah lembut `#fee2e2`, tag `❌ CARA LAMA`).
   - Sisi Belakang (Back): Menampilkan transformasi solusi Tanka (dark slate `#18221f`, aksen lime `#c8f064`, tag `⚡ BERSAMA TANKA`).
   - Setiap kartu bisa diklik mandiri untuk membalik (*3D perspective flip*).
   - Terdapat tombol kontrol di header: `[ ↻ Balik Semua Kartu ]` yang membalik keempat kartu sekaligus secara berjenjang (*staggered cascade flip*).
4. Desain tenang, bersih, modern, dan bebas warna neon norak.

---

## 2. DETAIL SPESIFIKASI IMPLEMENTASI

### A. Komponen `src/components/landing/ComparisonLedger.tsx`
Ganti isi komponen:
```tsx
import React, { useState } from "react";
import { X, Check, RotateCw, Video, FileText, Brain, ShieldCheck } from "lucide-react";

interface ComparisonItem {
  id: string;
  icon: any;
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
    tankaTitle: "100% Bebas Iklan & Offline",
    tankaDesc: "Nol iklan, data tersimpan aman di perangkatmu, dan materi bisa dibaca offline.",
    tankaDetail: "PWA modern hemat kuota dengan persistensi data lokal SQLite yang privat."
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
    <section id="perbandingan" className="landing-section">
      <div className="section-header-left reveal-scroll">
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
        {COMPARISON_DATA.map((item) => {
          const Icon = item.icon;
          const isFlipped = !!flippedCards[item.id];

          return (
            <div
              key={item.id}
              className={`comparison-flashcard-container ${isFlipped ? "is-flipped" : ""}`}
              onClick={() => toggleCard(item.id)}
            >
              <div className="comparison-flashcard-inner">
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
```

### B. Stylesheet `src/components/landing/landing.css`
Tambahkan gaya CSS Flashcard 3D:
```css
/* 3D Comparison Flashcards Grid */
.comparison-flashcard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(270px, 1fr));
  gap: 20px;
  margin-top: 24px;
}

.flashcard-toggle-all-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  background: #ffffff;
  border: 1px solid #dce4d6;
  color: #283832;
  font-family: 'DM Mono', monospace;
  font-size: 11.5px;
  font-weight: 700;
  padding: 8px 16px;
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(24, 34, 31, 0.04);
}

.flashcard-toggle-all-btn:hover {
  background: #f4f7ee;
  border-color: #8da868;
  color: #18221f;
  transform: translateY(-1px);
}

.comparison-flashcard-container {
  perspective: 1000px;
  min-height: 380px;
  cursor: pointer;
}

.comparison-flashcard-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  border-radius: 20px;
}

.comparison-flashcard-container.is-flipped .comparison-flashcard-inner {
  transform: rotateY(180deg);
}

.comparison-flashcard-face {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
  border-radius: 20px;
  padding: 26px 24px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-sizing: border-box;
  transition: box-shadow 0.25s ease, transform 0.25s ease;
}

.comparison-flashcard-container:hover .comparison-flashcard-face {
  box-shadow: 0 20px 45px -10px rgba(24, 34, 31, 0.08);
}

/* Sisi Depan (Cara Lama) */
.comparison-face-front {
  background: #ffffff;
  border: 1px solid #e2e8de;
  border-top: 4px solid #dc2626;
  box-shadow: 0 8px 24px rgba(24, 34, 31, 0.03);
}

/* Sisi Belakang (Cara Tanka) */
.comparison-face-back {
  background: #18221f;
  color: #eff5ec;
  border: 1px solid rgba(200, 240, 100, 0.35);
  border-top: 4px solid #c8f064;
  transform: rotateY(180deg);
  box-shadow: 0 16px 40px rgba(20, 31, 26, 0.25);
}

.flashcard-meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.flashcard-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 10px;
  font-weight: 800;
  padding: 3px 9px;
  border-radius: 999px;
  letter-spacing: 0.05em;
  font-family: 'DM Mono', monospace;
}

.flashcard-badge.old {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.flashcard-badge.tanka {
  background: #c8f064;
  color: #18221f;
}

.flashcard-step-num {
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  font-weight: 700;
  color: #8a9691;
}

.flashcard-step-num.tanka {
  color: #94a89e;
}

.flashcard-category-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 10.5px;
  font-weight: 800;
  color: #55635e;
  font-family: 'DM Mono', monospace;
  letter-spacing: 0.04em;
  margin-bottom: 8px;
}

.flashcard-category-tag.tanka {
  color: #b5c7bc;
}

.flashcard-title {
  font-size: 18px;
  font-weight: 800;
  line-height: 1.3;
  margin-bottom: 10px;
  letter-spacing: -0.02em;
}

.flashcard-title.old {
  color: #18221f;
}

.flashcard-title.tanka {
  color: #ffffff;
}

.flashcard-desc {
  font-size: 13.5px;
  line-height: 1.6;
  margin-bottom: 14px;
}

.flashcard-desc.old {
  color: #4b5a54;
}

.flashcard-desc.tanka {
  color: #d1ded6;
}

.flashcard-detail-pill {
  font-size: 12px;
  line-height: 1.5;
  padding: 8px 12px;
  border-radius: 8px;
}

.flashcard-detail-pill.old {
  background: #f8faf6;
  border: 1px solid #e6ece1;
  color: #55665e;
}

.flashcard-detail-pill.tanka {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(200, 240, 100, 0.15);
  color: #c4d6cb;
}

.flashcard-flip-prompt {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  font-family: 'DM Mono', monospace;
  padding-top: 14px;
  border-top: 1px solid;
}

.flashcard-flip-prompt.old {
  color: #4b6623;
  border-top-color: #edf2ea;
}

.flashcard-flip-prompt.tanka {
  color: #c8f064;
  border-top-color: rgba(255, 255, 255, 0.1);
}
```

---

## 3. ACCEPTANCE CRITERIA
- [ ] Section "Perbandingan Nyata" tampil sebagai 4 kartu Flashcard 3D interaktif.
- [ ] Tiap kartu dapat diklik untuk membalik (*flip*) antara sisi masalah (Cara Lama) dan sisi solusi (Bersama Tanka).
- [ ] Tombol `Balik Semua Kartu` membalik keempat kartu sekaligus.
- [ ] Desain clean editorial (soft red `#fee2e2`, dark slate `#18221f`, aksen lime `#c8f064`, nol neon norak).
- [ ] Responsif penuh di mobile 390px dan desktop.
- [ ] `npm run build` sukses.
- [ ] `env TANKA_DB_PATH=:memory: node --test tests/*.test.js` 83/83 pass.
- [ ] DILARANG melakukan `git push` ke remote GitHub.
