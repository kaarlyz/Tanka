import React, { useState } from "react";
import {
  Bot,
  Play,
  Sparkles,
  Brain,
  CheckCircle2,
  ArrowRight,
  Check,
  X,
  Flame
} from "lucide-react";
import { MathView } from "../common/MathView";

export interface StudioCockpitProps {
  onActionLaunch: () => void;
}

export function StudioCockpit({ onActionLaunch }: StudioCockpitProps) {
  const [studioMode, setStudioMode] = useState<"nara" | "video" | "quiz" | "graph">("nara");
  const [quizSelected, setQuizSelected] = useState<string | null>(null);
  const [ytUrlInput, setYtUrlInput] = useState("https://youtube.com/watch?v=kalkulus-dasar");
  const [isYtProcessing, setIsYtProcessing] = useState(false);
  const [_ytProcessed, setYtProcessed] = useState(true);
  const [activeGraphNode, setActiveGraphNode] = useState("Kalkulus Dasar");

  const handleSimulateYt = () => {
    setIsYtProcessing(true);
    setYtProcessed(false);
    setTimeout(() => {
      setIsYtProcessing(false);
      setYtProcessed(true);
    }, 700);
  };

  return (
    <section
      id="keunggulan"
      className="landing-section"
      style={{ padding: "clamp(60px, 8vh, 100px) clamp(24px, 4.5vw, 64px)" }}
    >
      <div className="section-header-left reveal-scroll">
        <span className="section-kicker">ARSITEKTUR BELAJAR TANKA</span>
        <h2 className="section-title">Bukan Sekadar Baca Materi. Ini Mesin Belajar Mandiri.</h2>
        <p className="section-desc">
          Coba langsung 4 instrumen inti Tanka di bawah. Klik tiap mode untuk merasakan bagaimana materi tersulit dipecah menjadi pemahaman utuh.
        </p>
      </div>

      {/* Floating Studio Dock Switcher (Linear / Stripe Style) */}
      <div className="studio-dock-container reveal-scroll">
        <div className="studio-dock">
          <button
            className={`studio-dock-btn ${studioMode === "nara" ? "active" : ""}`}
            onClick={() => setStudioMode("nara")}
          >
            <Bot size={15} />
            <span>Tutor Nara AI</span>
          </button>

          <button
            className={`studio-dock-btn ${studioMode === "video" ? "active" : ""}`}
            onClick={() => setStudioMode("video")}
          >
            <Play size={15} />
            <span>Rangkum Video & PDF</span>
          </button>

          <button
            className={`studio-dock-btn ${studioMode === "quiz" ? "active" : ""}`}
            onClick={() => setStudioMode("quiz")}
          >
            <Sparkles size={15} />
            <span>Kuis & Bank Salah</span>
          </button>

          <button
            className={`studio-dock-btn ${studioMode === "graph" ? "active" : ""}`}
            onClick={() => setStudioMode("graph")}
          >
            <Brain size={15} />
            <span>Peta Saraf Materi</span>
          </button>
        </div>
      </div>

      {/* The Unified Living Cockpit / Stage */}
      <div className="studio-cockpit-canvas bento-card reveal-scroll">
        {/* Left Spec & Rationale Rail */}
        <div className="studio-spec-rail">
          {studioMode === "nara" && (
            <div className="spec-content-fade" key="nara-spec">
              <span className="spec-eyebrow">
                <Bot size={14} color="#4b6623" />
                <span>KAPABILITAS 01 // TUTOR EMPATIK 24 JAM</span>
              </span>
              <h3 className="spec-title">Tanya Rumus Serumit Apapun Tanpa Rasa Malu</h3>
              <p className="spec-desc">
                Sering segan bertanya di kelas karena takut dinilai lambat? Nara adalah ruang amanmu. Menerangkan dari mana asal angka atau rumus dengan penurunan logika langkah demi langkah sampai kepalamu benar-benar paham.
              </p>
              <div className="spec-chips-row">
                <div className="spec-chip">
                  <CheckCircle2 size={16} color="#4b6623" />
                  <span>Penjelasan Langsung ke Inti Konsep</span>
                </div>
                <div className="spec-chip">
                  <CheckCircle2 size={16} color="#4b6623" />
                  <span>Penurunan KaTeX Step-by-Step</span>
                </div>
                <div className="spec-chip">
                  <CheckCircle2 size={16} color="#4b6623" />
                  <span>Bebas Bertanya Kapan Saja 24 Jam</span>
                </div>
              </div>
              <button className="spec-action-btn" onClick={onActionLaunch}>
                <span>Mulai Tanya Nara Sekarang</span>
                <ArrowRight size={15} />
              </button>
            </div>
          )}

          {studioMode === "video" && (
            <div className="spec-content-fade" key="video-spec">
              <span className="spec-eyebrow">
                <Play size={14} color="#4b6623" />
                <span>KAPABILITAS 02 // RANGKUM VIDEO & DOKUMEN</span>
              </span>
              <h3 className="spec-title">Video 2 Jam Dipotong Jadi Bab Santai 3 Menit</h3>
              <p className="spec-desc">
                Tempel link kuliah YouTube 2 jam atau slide presentasi PDF tebal. Mesin Tanka memotongnya otomatis menjadi modul bab kecil siap santap lengkap dengan penurunan rumus KaTeX rapi.
              </p>
              <div className="spec-chips-row">
                <div className="spec-chip">
                  <CheckCircle2 size={16} color="#4b6623" />
                  <span>Dipecah Rapi per Bab 3 Menit</span>
                </div>
                <div className="spec-chip">
                  <CheckCircle2 size={16} color="#4b6623" />
                  <span>Rangkuman Rumus Terstruktur</span>
                </div>
                <div className="spec-chip">
                  <CheckCircle2 size={16} color="#4b6623" />
                  <span>Estimasi Waktu Baca Jelas</span>
                </div>
              </div>
              <button className="spec-action-btn" onClick={onActionLaunch}>
                <span>Coba Rangkum Video Sekarang</span>
                <ArrowRight size={15} />
              </button>
            </div>
          )}

          {studioMode === "quiz" && (
            <div className="spec-content-fade" key="quiz-spec">
              <span className="spec-eyebrow">
                <Sparkles size={14} color="#4b6623" />
                <span>KAPABILITAS 03 // KUIS & BANK SALAH PRIBADI</span>
              </span>
              <h3 className="spec-title">Kuis Cerdas & Bank Salah Otomatis</h3>
              <p className="spec-desc">
                Uji pemahaman lewat 1 kartu 1 fakta. Gak ada soal jebakan ngaco. Setiap jawaban yang salah otomatis dicatat rapi ke Bank Salah pribadimu untuk direvisi sebelum hari H ujian.
              </p>
              <div className="spec-chips-row">
                <div className="spec-chip">
                  <CheckCircle2 size={16} color="#4b6623" />
                  <span>Kuis dari Materimu Sendiri</span>
                </div>
                <div className="spec-chip">
                  <CheckCircle2 size={16} color="#4b6623" />
                  <span>Bank Salah Otomatis Tanpa Ribet</span>
                </div>
                <div className="spec-chip">
                  <CheckCircle2 size={16} color="#4b6623" />
                  <span>Langkah Hitungan Jelas & Pasti</span>
                </div>
              </div>
              <button className="spec-action-btn" onClick={onActionLaunch}>
                <span>Buka Arena Kuis</span>
                <ArrowRight size={15} />
              </button>
            </div>
          )}

          {studioMode === "graph" && (
            <div className="spec-content-fade" key="graph-spec">
              <span className="spec-eyebrow">
                <Brain size={14} color="#4b6623" />
                <span>KAPABILITAS 04 // PETA PRASYARAT KONSEP</span>
              </span>
              <h3 className="spec-title">Petakan Hubungan Antar-Konsep Sebelum Ujian</h3>
              <p className="spec-desc">
                Lihat keterkaitan prasyarat materi dari hulu ke hilir. Ketahui topik mana yang harus dikuasai lebih dulu sebelum lanjut ke konsep yang lebih rumit.
              </p>
              <div className="spec-chips-row">
                <div className="spec-chip">
                  <CheckCircle2 size={16} color="#4b6623" />
                  <span>Deteksi Rantai Prasyarat Materi</span>
                </div>
                <div className="spec-chip">
                  <CheckCircle2 size={16} color="#4b6623" />
                  <span>Visualisasi Konsep Terhubung</span>
                </div>
                <div className="spec-chip">
                  <CheckCircle2 size={16} color="#4b6623" />
                  <span>Tingkatkan Daya Ingat Jangka Panjang</span>
                </div>
              </div>
              <button className="spec-action-btn" onClick={onActionLaunch}>
                <span>Eksplorasi Peta Konsep</span>
                <ArrowRight size={15} />
              </button>
            </div>
          )}
        </div>

        {/* Right Apparatus Screen */}
        <div className="studio-apparatus-screen">
          {studioMode === "nara" && (
            <div className="spec-content-fade" key="nara-apparatus">
              <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid #dce2da", boxShadow: "0 20px 50px -10px rgba(24,34,31,0.1)" }}>
                <div style={{ height: 34, background: "#edf1e9", borderBottom: "1px solid #e2e8df", display: "flex", alignItems: "center", padding: "0 14px", gap: 6 }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#ff5f56" }} />
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#ffbd2e" }} />
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#27c93f" }} />
                  <span style={{ fontSize: 11.5, fontFamily: "'DM Mono', monospace", color: "#60706a", marginLeft: 6 }}>
                    tanya-nara.ai • tutor pribadi siap sedia
                  </span>
                </div>
                <img
                  src="/assets/landing/bento-nara.png"
                  alt="Tanya Nara AI Tutor Pribadi"
                  className="mockup-img"
                  loading="eager"
                />
              </div>
            </div>
          )}

          {studioMode === "video" && (
            <div className="spec-content-fade cockpit-video-box" key="video-apparatus">
              <div className="cockpit-video-header">
                <span style={{ fontWeight: 700, color: "#eff5ec" }}>Kalkulus Dasar: Dari Limit ke Turunan</span>
                <span style={{ fontFamily: "'DM Mono', monospace", background: "rgba(255,255,255,0.12)", padding: "3px 8px", borderRadius: 6, color: "#c8f064", fontSize: 11, fontWeight: 700 }}>
                  1:42:18 • Full HD
                </span>
              </div>

              <div className="cockpit-timeline-track">
                <div className="cockpit-seg-1" title="Bab 1: Limit" />
                <div className="cockpit-seg-2" title="Bab 2: Turunan" />
                <div className="cockpit-seg-3" title="Bab 3: Aturan Rantai" />
              </div>

              <div>
                <div className="cockpit-chapter-strip">
                  <span style={{ fontWeight: 600, color: "#eff5ec" }}>Bab 1: Konsep Limit & Laju Perubahan</span>
                  <span style={{ color: "#c8f064", fontWeight: 700, fontSize: 11.5 }}>2 mnt baca</span>
                </div>
                <div className="cockpit-chapter-strip">
                  <span style={{ fontWeight: 600, color: "#eff5ec" }}>Bab 2: Turunan Aljabar & Gradien Garis</span>
                  <span style={{ color: "#f59e0b", fontWeight: 700, fontSize: 11.5 }}>3 mnt baca</span>
                </div>
                <div className="cockpit-chapter-strip">
                  <span style={{ fontWeight: 600, color: "#eff5ec" }}>Bab 3: Aturan Rantai & Nilai Maksimum</span>
                  <span style={{ color: "#c8f064", fontWeight: 700, fontSize: 11.5 }}>4 mnt baca</span>
                </div>
              </div>

              <div className="cockpit-input-bar">
                <input
                  type="text"
                  value={ytUrlInput}
                  onChange={(e) => setYtUrlInput(e.target.value)}
                  className="cockpit-input-field"
                  placeholder="Tempel link video YouTube..."
                />
                <button className="cockpit-submit-btn" onClick={handleSimulateYt}>
                  {isYtProcessing ? "Merangkum..." : "Simulasikan"}
                </button>
              </div>
            </div>
          )}

          {studioMode === "quiz" && (
            <div className="spec-content-fade cockpit-quiz-box" key="quiz-apparatus">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 700, color: "#d97706", background: "#fef3c7", padding: "4px 10px", borderRadius: 999 }}>
                  <Flame size={13} color="#d97706" />
                  <span>3 Hari Berturut-turut</span>
                </span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11.5, fontWeight: 800, color: "#273e1c", background: "#c8f064", padding: "3px 9px", borderRadius: 6 }}>
                  +50 XP
                </span>
              </div>

              <div style={{ fontSize: 14.5, fontWeight: 700, color: "#18221f", lineHeight: 1.5, padding: "14px 16px", background: "#ffffff", border: "1px solid #e1e7dc", borderRadius: 12, marginBottom: 14 }}>
                <MathView text="Jika himpunan $A = \{2, 4, 6\}$ dan $B = \{4, 6, 8\}$, tentukan anggota $A \cap B$..." />
              </div>

              <div>
                <button
                  className={`cockpit-quiz-opt ${quizSelected === "A" ? "wrong" : ""}`}
                  onClick={() => setQuizSelected("A")}
                >
                  <span>[A] <MathView text="$\{2, 8\}$" /></span>
                  {quizSelected === "A" && <X size={15} color="#dc2626" />}
                </button>

                <button
                  className={`cockpit-quiz-opt ${quizSelected === "B" ? "correct" : ""}`}
                  onClick={() => setQuizSelected("B")}
                >
                  <span>[B] <MathView text="$\{4, 6\}$" /></span>
                  {quizSelected === "B" && <Check size={16} color="#15803d" />}
                </button>

                <button
                  className={`cockpit-quiz-opt ${quizSelected === "C" ? "wrong" : ""}`}
                  onClick={() => setQuizSelected("C")}
                >
                  <span>[C] <MathView text="$\{2, 4, 6, 8\}$" /></span>
                  {quizSelected === "C" && <X size={15} color="#dc2626" />}
                </button>
              </div>

              {quizSelected === "B" && (
                <div style={{ marginTop: 14, padding: "12px 14px", borderRadius: 10, background: "#eef8dc", color: "#273e1c", border: "1px solid #c7e89d", fontSize: 13 }}>
                  <strong>✓ Jawaban Tepat! +50 XP Diperoleh</strong>
                  <div style={{ fontSize: 12, marginTop: 2 }}>
                    Irisan ($A \cap B$) adalah angka yang ada di kedua himpunan ($4$ dan $6$).
                  </div>
                </div>
              )}

              {(quizSelected === "A" || quizSelected === "C") && (
                <div style={{ marginTop: 14, padding: "12px 14px", borderRadius: 10, background: "#fee2e2", color: "#991b1b", border: "1px solid #fecaca", fontSize: 13 }}>
                  <strong>⚠️ Dicatat ke Bank Salah Pribadi!</strong>
                  <div style={{ fontSize: 12, marginTop: 2 }}>
                    {quizSelected === "A" ? "Angka 2 bukan anggota B dan angka 8 bukan anggota A." : "Itu hasil gabungan ($A \cup B$), bukan irisan ($A \cap B$)."}
                  </div>
                </div>
              )}
            </div>
          )}

          {studioMode === "graph" && (
            <div className="spec-content-fade cockpit-graph-box" key="graph-apparatus">
              <div style={{ position: "absolute", top: "30%", left: "40%", width: 240, height: 160, background: "radial-gradient(circle, rgba(200, 240, 100, 0.16) 0%, transparent 70%)", pointerEvents: "none", filter: "blur(30px)" }} />
              <svg width="100%" height="160" viewBox="0 0 320 160">
                <path d="M 160 80 Q 110 40 60 45" stroke="#c8f064" strokeWidth="2" fill="none" className="graph-link-pulse" opacity="0.85" />
                <path d="M 160 80 Q 210 40 260 45" stroke="#c8f064" strokeWidth="2" fill="none" className="graph-link-pulse" opacity="0.85" />
                <path d="M 160 80 Q 110 120 60 120" stroke="#c8f064" strokeWidth="2" fill="none" className="graph-link-pulse" opacity="0.85" />
                <path d="M 160 80 Q 210 120 260 120" stroke="#c8f064" strokeWidth="2" fill="none" className="graph-link-pulse" opacity="0.85" />

                <g className="graph-node" onClick={() => setActiveGraphNode("Limit Aljabar")}>
                  <circle cx="60" cy="45" r="16" fill={activeGraphNode === "Limit Aljabar" ? "#c8f064" : "#1c2a23"} stroke="#8da868" strokeWidth="2" />
                  <text x="60" y="49" fontSize="9.5" textAnchor="middle" fill={activeGraphNode === "Limit Aljabar" ? "#18221f" : "#eff5ec"} fontWeight="800">Limit</text>
                </g>

                <g className="graph-node" onClick={() => setActiveGraphNode("Turunan Fungsi")}>
                  <circle cx="260" cy="45" r="16" fill={activeGraphNode === "Turunan Fungsi" ? "#c8f064" : "#1c2a23"} stroke="#8da868" strokeWidth="2" />
                  <text x="260" y="49" fontSize="9.5" textAnchor="middle" fill={activeGraphNode === "Turunan Fungsi" ? "#18221f" : "#eff5ec"} fontWeight="800">Turunan</text>
                </g>

                <g className="graph-node" onClick={() => setActiveGraphNode("Integral Riemann")}>
                  <circle cx="60" cy="120" r="16" fill={activeGraphNode === "Integral Riemann" ? "#c8f064" : "#1c2a23"} stroke="#8da868" strokeWidth="2" />
                  <text x="60" y="124" fontSize="9.5" textAnchor="middle" fill={activeGraphNode === "Integral Riemann" ? "#18221f" : "#eff5ec"} fontWeight="800">Integral</text>
                </g>

                <g className="graph-node" onClick={() => setActiveGraphNode("Optimasi Nilai")}>
                  <circle cx="260" cy="120" r="16" fill={activeGraphNode === "Optimasi Nilai" ? "#c8f064" : "#1c2a23"} stroke="#8da868" strokeWidth="2" />
                  <text x="260" y="124" fontSize="9.5" textAnchor="middle" fill={activeGraphNode === "Optimasi Nilai" ? "#18221f" : "#eff5ec"} fontWeight="800">Optimasi</text>
                </g>

                <g className="graph-node" onClick={() => setActiveGraphNode("Kalkulus Dasar")}>
                  <circle cx="160" cy="80" r="24" fill="#18221f" stroke="#c8f064" strokeWidth="3" />
                  <text x="160" y="84" fontSize="10.5" textAnchor="middle" fill="#c8f064" fontWeight="800">Kalkulus</text>
                </g>
              </svg>

              <div style={{ marginTop: 14, background: "#192721", border: "1px solid #283d34", borderRadius: 12, padding: "12px 16px", color: "#eff5ec" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: "#c8f064" }}>{activeGraphNode}</span>
                  <span style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: "#8da868" }}>Prasyarat: Terpenuhi</span>
                </div>
                <p style={{ fontSize: 12, lineHeight: 1.5, color: "#b5c4bd", margin: 0 }}>
                  {activeGraphNode === "Kalkulus Dasar" && "Fondasi aljabar utama yang menghubungkan materi limit, turunan, dan integral."}
                  {activeGraphNode === "Limit Aljabar" && "Syarat mutlak untuk memahami konsep turunan dan gradien kemiringan garis."}
                  {activeGraphNode === "Turunan Fungsi" && "Kunci untuk menyelesaikan problem laju perubahan dan optimasi nilai."}
                  {activeGraphNode === "Integral Riemann" && "Operasi invers turunan untuk mencari total akumulasi luasan daerah."}
                  {activeGraphNode === "Optimasi Nilai" && "Aplikasi praktis turunan pertama sama dengan nol untuk menentukan titik ekstrim."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default StudioCockpit;
