import React, { useState, useEffect } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Lock,
  Star,
  ExternalLink,
  Zap,
  ChevronRight,
  Bot,
  Sparkles,
  Wifi,
  WifiOff,
  Check,
  X,
  Play,
  RotateCcw,
  BookOpen,
  Send,
  Layers,
  GraduationCap,
  Quote
} from "lucide-react";
import { UserAccount } from "../../types";
import { MathView } from "../common/MathView";

export interface LandingPageProps {
  onLaunchApp: () => void;
  onOpenAuth: (mode?: "login" | "register") => void;
  currentUser?: UserAccount | null;
}

export function LandingPage({
  onLaunchApp,
  onOpenAuth,
  currentUser
}: LandingPageProps) {
  // Stepper state
  const [activeStep, setActiveStep] = useState(0);

  // Hero Nara AI Simulator state
  const [activeHeroQ, setActiveHeroQ] = useState(0);
  const [isHeroThinking, setIsHeroThinking] = useState(false);
  const [heroPromptInput, setHeroPromptInput] = useState("");

  const heroQuestions = [
    {
      q: "Bagaimana cara mencari irisan himpunan A ∩ B?",
      summary: "Konsep Irisan Himpunan",
      answer:
        "Irisan dua himpunan $A \\cap B$ adalah himpunan anggota yang ada di **himpunan A sekaligus himpunan B**:\n\n$$A \\cap B = \\{x \\mid x \\in A \\land x \\in B\\}$$\n\n**Contoh Nyata:**\nJika $A = \\{2, 4, 6\\}$ dan $B = \\{4, 6, 8\\}$, maka angka yang sama di kedua himpunan adalah $\\{4, 6\\}$."
    },
    {
      q: "Jelaskan hukum fotosintesis secara singkat",
      summary: "Reaksi Kimia Fotosintesis",
      answer:
        "Fotosintesis adalah reaksi pembentukan energi glukosa oleh klorofil tanaman memanfaatkan sinar matahari:\n\n$$6CO_2 + 6H_2O \\xrightarrow{\\text{cahaya}} C_6H_{12}O_6 + 6O_2$$\n\nKarbon dioksida ($CO_2$) dari udara dan air ($H_2O$) diubah menjadi glukosa ($C_6H_{12}O_6$) untuk cadangan makanan dan oksigen ($O_2$) untuk bernapas."
    },
    {
      q: "Kenapa rumus pythagoras a² + b² = c²?",
      summary: "Penurunan Teorema Pythagoras",
      answer:
        "Pada setiap segitiga siku-siku, luas bujur sangkar di sisi miring ($c$) sama dengan jumlah luas bujur sangkar kedua sisi penyikunya ($a$ dan $b$):\n\n$$a^2 + b^2 = c^2 \\implies c = \\sqrt{a^2 + b^2}$$\n\nIni hukum fundamental ruang datar Euclidean: jarak terpendek menghubungkan dua titik tegak lurus selalu merupakan hipotenusa."
    }
  ];

  const handleSelectHeroQuestion = (idx: number) => {
    if (idx === activeHeroQ) return;
    setIsHeroThinking(true);
    setActiveHeroQ(idx);
    setTimeout(() => {
      setIsHeroThinking(false);
    }, 240);
  };

  // Bento Card 2: Interactive Atomic Quiz state
  const [quizSelected, setQuizSelected] = useState<string | null>(null);

  // Bento Card 3: Interactive YouTube summary simulator state
  const [ytSimulating, setYtSimulating] = useState(false);
  const [ytSimulated, setYtSimulated] = useState(false);
  const [ytProgress, setYtProgress] = useState(0);

  const handleSimulateYouTube = () => {
    if (ytSimulating) return;
    setYtSimulating(true);
    setYtProgress(15);
    setTimeout(() => setYtProgress(45), 200);
    setTimeout(() => setYtProgress(85), 450);
    setTimeout(() => {
      setYtProgress(100);
      setYtSimulating(false);
      setYtSimulated(true);
    }, 700);
  };

  // Bento Card 4: Radial Knowledge Graph state
  const [activeGraphNode, setActiveGraphNode] = useState("Kalkulus Dasar");

  // Bento Card 5: Offline vs Online switch state
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  // Section Comparison state: 'both' | 'old' | 'tanka'
  const [comparisonView, setComparisonView] = useState<"both" | "old" | "tanka">("both");

  const steps = [
    {
      num: "01",
      tag: "INPUT MATERI",
      title: "Unggah Dokumen atau Tempel Link YouTube",
      summary:
        "Tarik intisari dari file PDF, catatan foto, slide PPTX, atau video YouTube secara instan.",
      detail:
        "Cukup masukkan bahan belajarmu. Tanka otomatis mengekstrak materi dan merapikannya menjadi modul siap baca tanpa iklan dan tanpa ribet.",
      chips: ["Multi-format PDF, Foto & PPTX", "Transkrip Video YouTube Otomatis", "Ekstraksi Rapi & Cepat"]
    },
    {
      num: "02",
      tag: "STRUKTUR BAB",
      title: "Rangkuman Terstruktur Bab demi Bab",
      summary:
        "Materi panjang dipecah jadi modul-modul kecil terstruktur agar mudah dipelajari berurutan.",
      detail:
        "Tidak ada lagi tumpukan materi tebal yang bikin pusing. Tanka merapikan materi menjadi bab-bab terurut lengkap dengan penurunan rumus matematika yang jelas.",
      chips: ["Modul Belajar Ringkas", "Urutan Materi Logis", "Rumus Ditata Rapi"]
    },
    {
      num: "03",
      tag: "TANYA NARA AI",
      title: "Diskusi & Tanya Rumus Sepuasnya",
      summary:
        "Tutor AI pribadi yang sabar menerangkan konsep sulit dan penurunan rumus kapan saja.",
      detail:
        "Nara mendampingi setiap halaman belajarmu. Tanya rumus yang belum dipahami, dan Nara akan menjelaskannya dengan contoh analogi nyata langkah demi langkah.",
      chips: ["Penjelasan Langkah demi Langkah", "Analogi Ramah & Sederhana", "Respon Cepat Kapan Saja"]
    },
    {
      num: "04",
      tag: "UJI PEMAHAMAN",
      title: "Latihan Kuis Pintar & Lacak Bank Salah",
      summary:
        "Uji pemahaman dengan kuis fakta objektif dan arsipkan materi yang belum dikuasai ke Bank Salah.",
      detail:
        "Selesaikan kuis interaktif tanpa soal jebakan. Setiap jawaban yang salah otomatis masuk ke Bank Salah agar kamu bisa mereview materi tersebut sampai siap ujian.",
      chips: ["Kuis Akurat Anti-Halusinasi", "Pembahasan Otomatis", "Bank Khusus Soal Salah"]
    }
  ];

  return (
    <div className="tanka-landing-container">
      <style>{`
        .tanka-landing-container {
          position: relative;
          width: 100%;
          height: 100%;
          min-height: 100vh;
          overflow-y: auto;
          overflow-x: hidden;
          background-color: #fcfdfa;
          background-image: 
            linear-gradient(to right, rgba(24, 34, 31, 0.035) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(24, 34, 31, 0.035) 1px, transparent 1px);
          background-size: 32px 32px;
          color: #18221f;
          font-family: 'Plus Jakarta Sans', 'Manrope', -apple-system, BlinkMacSystemFont, sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        /* Ambient Glowing Orbs */
        .landing-ambient-orb-1 {
          position: absolute;
          top: 100px;
          left: 50%;
          transform: translateX(-50%);
          width: 720px;
          height: 420px;
          background: radial-gradient(ellipse at center, rgba(200, 240, 100, 0.16) 0%, rgba(75, 102, 35, 0.06) 50%, transparent 75%);
          filter: blur(64px);
          pointer-events: none;
          z-index: 0;
          animation: orbFloat 8s ease-in-out infinite alternate;
        }

        .landing-ambient-orb-2 {
          position: absolute;
          top: 1550px;
          right: 5%;
          width: 580px;
          height: 380px;
          background: radial-gradient(ellipse at center, rgba(168, 196, 138, 0.14) 0%, rgba(24, 34, 31, 0.04) 55%, transparent 75%);
          filter: blur(70px);
          pointer-events: none;
          z-index: 0;
          animation: orbFloatReverse 10s ease-in-out infinite alternate;
        }

        @keyframes orbFloat {
          0% { transform: translateX(-50%) translateY(0) scale(1); }
          100% { transform: translateX(-48%) translateY(28px) scale(1.06); }
        }

        @keyframes orbFloatReverse {
          0% { transform: translateY(0) scale(1); }
          100% { transform: translateY(-30px) scale(1.08); }
        }

        /* Nav */
        .landing-nav {
          position: sticky;
          top: 0;
          z-index: 1000;
          background: rgba(252, 253, 250, 0.90);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border-bottom: 1px solid #e2e8df;
        }

        .landing-nav-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 12px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .landing-brand {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          user-select: none;
          text-decoration: none;
        }

        .landing-brand-box {
          width: 26px;
          height: 26px;
          border-radius: 6px;
          background: #18221f;
          color: #c8f064;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'DM Mono', monospace;
          font-weight: 700;
          font-size: 15px;
          line-height: 1;
        }

        .landing-brand-text {
          font-size: 18px;
          font-weight: 800;
          letter-spacing: -0.03em;
          color: #18221f;
        }

        .landing-nav-links {
          display: flex;
          align-items: center;
          gap: 22px;
        }

        .landing-nav-link {
          font-size: 13.5px;
          font-weight: 600;
          color: #5f6b66;
          text-decoration: none;
          transition: color 0.15s ease;
        }

        .landing-nav-link:hover {
          color: #18221f;
        }

        .landing-nav-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .landing-btn-ghost {
          background: transparent;
          border: 1px solid transparent;
          color: #18221f;
          padding: 7px 14px;
          border-radius: 8px;
          font-size: 13.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .landing-btn-ghost:hover {
          background: rgba(24, 34, 31, 0.05);
          border-color: #e2e8df;
        }

        .landing-btn-primary {
          background: #18221f;
          color: #c8f064;
          border: 1px solid #18221f;
          padding: 8px 18px;
          border-radius: 8px;
          font-size: 13.5px;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 0.15s ease;
          box-shadow: 0 4px 12px rgba(24, 34, 31, 0.1);
        }

        .landing-btn-primary:hover {
          background: #24342f;
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(24, 34, 31, 0.16);
        }

        /* Hero */
        .landing-hero {
          position: relative;
          z-index: 1;
          max-width: 1200px;
          margin: 0 auto;
          padding: 56px 24px 64px;
          text-align: center;
        }

        .hero-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          border-radius: 999px;
          background: #ffffff;
          border: 1px solid #dce2da;
          box-shadow: 0 2px 8px rgba(24, 34, 31, 0.04);
          font-family: 'DM Mono', monospace;
          font-size: 12px;
          font-weight: 600;
          color: #18221f;
          letter-spacing: 0.02em;
          margin-bottom: 22px;
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
            box-shadow: 0 0 8px rgba(200, 240, 100, 0.9);
          }
          50% {
            transform: scale(1.15);
            opacity: 0.85;
            box-shadow: 0 0 14px rgba(200, 240, 100, 1);
          }
        }

        .hero-pill-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #c8f064;
          border: 1.5px solid #18221f;
          box-shadow: 0 0 8px rgba(200, 240, 100, 0.9);
          animation: pulse 2s infinite ease-in-out;
        }

        .hero-title {
          font-size: clamp(2.2rem, 5.2vw, 3.8rem);
          font-weight: 800;
          line-height: 1.15;
          letter-spacing: -0.035em;
          color: #18221f;
          max-width: 890px;
          margin: 0 auto 18px;
        }

        .hero-title-sub {
          display: block;
          font-size: clamp(1.1rem, 2.7vw, 1.8rem);
          font-weight: 700;
          color: #45544e;
          margin-top: 8px;
          letter-spacing: -0.02em;
        }

        .hero-subtitle {
          font-size: clamp(1rem, 2vw, 1.15rem);
          line-height: 1.62;
          color: #5f6b66;
          max-width: 720px;
          margin: 0 auto 32px;
        }

        .hero-cta-group {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
          flex-wrap: wrap;
          margin-bottom: 38px;
        }

        @keyframes ctaGlow {
          0%, 100% {
            box-shadow: 0 10px 24px -4px rgba(24, 34, 31, 0.22);
          }
          50% {
            box-shadow: 0 12px 30px rgba(200, 240, 100, 0.45);
          }
        }

        .hero-btn-launch {
          background: #18221f;
          color: #c8f064;
          border: 1px solid #18221f;
          padding: 14px 28px;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          animation: ctaGlow 4s infinite ease-in-out;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .hero-btn-launch:hover {
          background: #24342f;
          transform: translateY(-2px);
          box-shadow: 0 14px 34px -4px rgba(24, 34, 31, 0.32);
        }

        .hero-btn-github {
          background: #ffffff;
          color: #18221f;
          border: 1px solid #dce2da;
          padding: 14px 24px;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 600;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 2px 8px rgba(24, 34, 31, 0.04);
          transition: all 0.2s ease;
        }

        .hero-btn-github:hover {
          background: #f7f9f5;
          border-color: #cbd4c8;
          transform: translateY(-1px);
        }

        /* Hero Live Simulator */
        .hero-simulator-wrapper {
          max-width: 820px;
          margin: 0 auto 50px;
          text-align: left;
        }

        .hero-simulator-card {
          background: #ffffff;
          border: 1px solid #dce2da;
          border-radius: 16px;
          box-shadow: 0 16px 40px -10px rgba(24, 34, 31, 0.08), 0 0 0 1px rgba(24, 34, 31, 0.02);
          overflow: hidden;
          transition: border-color 0.2s ease;
        }

        .hero-simulator-card:hover {
          border-color: #8da868;
        }

        .simulator-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 18px;
          background: #f7f9f5;
          border-bottom: 1px solid #e2e8df;
        }

        .simulator-title-left {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: 'DM Mono', monospace;
          font-size: 12px;
          font-weight: 700;
          color: #283832;
        }

        .simulator-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          font-weight: 600;
          color: #2f4520;
          background: #eef8da;
          padding: 4px 9px;
          border-radius: 6px;
          border: 1px solid #cbe5a3;
        }

        .simulator-chip-selector {
          padding: 14px 18px 8px;
          display: flex;
          align-items: center;
          gap: 8px;
          overflow-x: auto;
          scrollbar-width: none;
        }

        .simulator-chip-selector::-webkit-scrollbar {
          display: none;
        }

        .sim-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 12px;
          border-radius: 8px;
          background: #f2f5ef;
          border: 1px solid #dde3d8;
          font-size: 12.5px;
          font-weight: 600;
          color: #45544e;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s ease;
        }

        .sim-chip:hover {
          background: #e6ece0;
          color: #18221f;
        }

        .sim-chip.active {
          background: #18221f;
          color: #c8f064;
          border-color: #18221f;
          box-shadow: 0 4px 12px rgba(24, 34, 31, 0.12);
        }

        .simulator-chat-body {
          padding: 18px 20px;
          min-height: 160px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .sim-bubble-user {
          align-self: flex-end;
          background: #18221f;
          color: #f7f9f5;
          padding: 10px 16px;
          border-radius: 12px 12px 2px 12px;
          font-size: 13.5px;
          max-width: 85%;
          line-height: 1.45;
          font-weight: 500;
        }

        .sim-bubble-ai {
          align-self: flex-start;
          background: #f8faf6;
          border: 1px solid #e2e8df;
          color: #18221f;
          padding: 14px 18px;
          border-radius: 12px 12px 12px 2px;
          font-size: 13.5px;
          line-height: 1.6;
          max-width: 92%;
          box-shadow: 0 4px 12px rgba(24, 34, 31, 0.03);
        }

        .sim-typing-indicator {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 10px 14px;
        }

        .sim-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #798782;
          animation: simBounce 1.2s infinite ease-in-out;
        }

        .sim-dot:nth-child(2) { animation-delay: 0.2s; }
        .sim-dot:nth-child(3) { animation-delay: 0.4s; }

        @keyframes simBounce {
          0%, 80%, 100% { transform: scale(0.7); opacity: 0.4; }
          40% { transform: scale(1.1); opacity: 1; }
        }

        .simulator-input-fake {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px 14px;
          border-top: 1px solid #f0f3ed;
        }

        .sim-input-box {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 8px;
          background: #f7f9f5;
          border: 1px solid #dde3d8;
          border-radius: 8px;
          padding: 8px 12px;
          font-size: 13px;
          color: #798782;
        }

        .sim-input-send-btn {
          background: #18221f;
          color: #c8f064;
          border: none;
          padding: 8px 14px;
          border-radius: 8px;
          font-size: 12.5px;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        /* Mockup Window */
        .mockup-window {
          max-width: 1100px;
          margin: 0 auto;
          border-radius: 14px;
          border: 1px solid #dce2da;
          background: #ffffff;
          box-shadow: 0 24px 64px -12px rgba(24, 34, 31, 0.12), 0 0 0 1px rgba(24, 34, 31, 0.03);
          overflow: hidden;
        }

        .mockup-chrome {
          height: 40px;
          background: #f4f6f1;
          border-bottom: 1px solid #e2e8df;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 14px;
        }

        .mockup-dots {
          display: flex;
          gap: 6px;
          align-items: center;
        }

        .mockup-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }

        .mockup-url-pill {
          background: #ffffff;
          border: 1px solid #e2e8df;
          border-radius: 6px;
          padding: 3px 16px;
          font-size: 11.5px;
          font-family: 'DM Mono', monospace;
          color: #5f6b66;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .mockup-img {
          width: 100%;
          height: auto;
          display: block;
        }

        /* Bento Section */
        .landing-section {
          position: relative;
          z-index: 1;
          max-width: 1200px;
          margin: 0 auto;
          padding: 80px 24px;
        }

        .section-header {
          text-align: center;
          max-width: 760px;
          margin: 0 auto 48px;
        }

        .section-tag {
          font-family: 'DM Mono', monospace;
          font-size: 11.5px;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: #283832;
          text-transform: uppercase;
          background: rgba(40, 56, 50, 0.08);
          border: 1px solid rgba(40, 56, 50, 0.14);
          padding: 4px 10px;
          border-radius: 6px;
          display: inline-block;
          margin-bottom: 14px;
        }

        .section-title {
          font-size: clamp(1.8rem, 4vw, 2.6rem);
          font-weight: 800;
          letter-spacing: -0.03em;
          color: #18221f;
          margin-bottom: 14px;
          line-height: 1.2;
        }

        .section-desc {
          font-size: 15.5px;
          line-height: 1.6;
          color: #5f6b66;
        }

        .bento-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
        }

        .bento-card {
          position: relative;
          background: #ffffff;
          border: 1px solid #e2e8df;
          border-radius: 16px;
          padding: 32px;
          box-shadow: 0 8px 30px rgba(24, 34, 31, 0.04);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          overflow: hidden;
          transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.25s ease;
        }

        @media (hover: hover) and (pointer: fine) {
          .bento-card:hover {
            transform: translateY(-4px);
            border-color: #8da868 !important;
            box-shadow: 0 20px 40px rgba(24, 34, 31, 0.09) !important;
          }
        }

        .bento-span-2 {
          grid-column: span 2;
        }

        .bento-label {
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.06em;
          color: #5f6b66;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .bento-title {
          font-size: 21px;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: #18221f;
          margin-bottom: 10px;
          line-height: 1.25;
        }

        .bento-desc {
          font-size: 14px;
          line-height: 1.6;
          color: #5f6b66;
          margin-bottom: 22px;
        }

        .mini-device-frame {
          border-radius: 10px;
          border: 1px solid #e2e8df;
          background: #f7f9f5;
          overflow: hidden;
          box-shadow: 0 6px 18px rgba(24, 34, 31, 0.05);
        }

        .mini-device-header {
          height: 28px;
          background: #eef2eb;
          border-bottom: 1px solid #e2e8df;
          display: flex;
          align-items: center;
          padding: 0 10px;
          gap: 6px;
        }

        .mini-device-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #c5cec3;
        }

        .bento-two-col {
          display: grid;
          grid-template-columns: 1.1fr 1.3fr;
          gap: 28px;
          align-items: center;
        }

        .chip-group {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 16px;
        }

        .metric-chip {
          font-family: 'DM Mono', monospace;
          font-size: 11.5px;
          font-weight: 600;
          background: #18221f;
          color: #c8f064;
          padding: 6px 12px;
          border-radius: 6px;
          border: 1px solid #283832;
        }

        /* Interactive Quiz Card Styles */
        .quiz-demo-box {
          background: #f7f9f5;
          border: 1px solid #dde3d8;
          border-radius: 12px;
          padding: 16px;
          margin-top: 14px;
        }

        .quiz-option-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          margin-top: 8px;
          border-radius: 8px;
          border: 1px solid #dde3d8;
          background: #ffffff;
          font-size: 13.5px;
          font-weight: 600;
          color: #18221f;
          cursor: pointer;
          transition: all 0.15s ease;
          text-align: left;
        }

        .quiz-option-btn:hover {
          border-color: #8da868;
          background: #fcfdfa;
        }

        .quiz-option-btn.selected-correct {
          background: #f3fae8;
          border-color: #8da868;
          box-shadow: 0 0 0 1px #8da868;
          color: #1b3814;
        }

        .quiz-option-btn.selected-wrong {
          background: #fdf2f2;
          border-color: #fca5a5;
          color: #991b1b;
        }

        .quiz-feedback-banner {
          margin-top: 12px;
          padding: 10px 12px;
          border-radius: 8px;
          font-size: 12.5px;
          line-height: 1.5;
          display: flex;
          align-items: flex-start;
          gap: 8px;
        }

        .quiz-feedback-banner.correct {
          background: #eef8da;
          color: #2b421c;
          border: 1px solid #c8e89f;
        }

        .quiz-feedback-banner.wrong {
          background: #fee2e2;
          color: #991b1b;
          border: 1px solid #fecaca;
        }

        /* YouTube Interactive Simulator */
        .yt-demo-box {
          background: #f8faf6;
          border: 1px solid #e2e8df;
          border-radius: 12px;
          padding: 14px;
          margin-top: 16px;
        }

        .yt-input-row {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .yt-input-field {
          flex: 1;
          background: #ffffff;
          border: 1px solid #dce2da;
          border-radius: 8px;
          padding: 8px 12px;
          font-size: 12px;
          font-family: 'DM Mono', monospace;
          color: #45544e;
          outline: none;
        }

        .yt-action-btn {
          background: #18221f;
          color: #c8f064;
          border: none;
          padding: 8px 14px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
          transition: background 0.15s ease;
        }

        .yt-action-btn:hover {
          background: #24342f;
        }

        .yt-progress-bar-bg {
          width: 100%;
          height: 5px;
          background: #e2e8df;
          border-radius: 4px;
          margin-top: 10px;
          overflow: hidden;
        }

        .yt-progress-bar-fill {
          height: 100%;
          background: #8da868;
          transition: width 0.25s ease;
        }

        .yt-chapter-pill {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 7px 10px;
          background: #ffffff;
          border: 1px solid #e2e8df;
          border-radius: 6px;
          margin-top: 6px;
          font-size: 12px;
          font-weight: 600;
          color: #18221f;
        }

        /* Radial Knowledge Graph Canvas */
        .radial-graph-wrapper {
          background: #f7f9f5;
          border: 1px solid #e2e8df;
          border-radius: 12px;
          padding: 12px;
          margin-top: 14px;
          text-align: center;
        }

        .graph-node {
          cursor: pointer;
          transition: transform 0.2s ease;
        }

        .graph-node:hover {
          filter: drop-shadow(0 2px 6px rgba(141, 168, 104, 0.4));
        }

        /* Offline Toggle */
        .offline-toggle-container {
          background: #f7f9f5;
          border: 1px solid #dde3d8;
          border-radius: 12px;
          padding: 16px;
          margin-top: 16px;
        }

        .offline-toggle-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #ffffff;
          border: 1px solid #dce2da;
          padding: 10px 14px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 700;
          color: #18221f;
          transition: all 0.2s ease;
        }

        .offline-toggle-btn:hover {
          border-color: #8da868;
        }

        .offline-toggle-btn.offline-active {
          background: #18221f;
          color: #c8f064;
          border-color: #18221f;
        }

        /* Section Comparison */
        .comparison-tabs {
          display: flex;
          justify-content: center;
          gap: 10px;
          margin-bottom: 32px;
          flex-wrap: wrap;
        }

        .comp-tab-btn {
          padding: 9px 18px;
          border-radius: 999px;
          font-size: 13.5px;
          font-weight: 700;
          cursor: pointer;
          border: 1px solid #dce2da;
          background: #ffffff;
          color: #5f6b66;
          transition: all 0.15s ease;
        }

        .comp-tab-btn:hover {
          border-color: #8da868;
          color: #18221f;
        }

        .comp-tab-btn.active {
          background: #18221f;
          color: #c8f064;
          border-color: #18221f;
          box-shadow: 0 4px 14px rgba(24, 34, 31, 0.12);
        }

        .comparison-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 28px;
        }

        .comparison-card {
          border-radius: 16px;
          padding: 32px;
          border: 1px solid #e2e8df;
          box-shadow: 0 8px 30px rgba(24, 34, 31, 0.04);
        }

        .comparison-card.old-way {
          background: #fdfaf8;
          border-color: #edd5cb;
        }

        .comparison-card.tanka-way {
          background: #f6faf3;
          border-color: #cbe3b3;
          box-shadow: 0 12px 36px rgba(141, 168, 104, 0.12);
        }

        .comp-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-top: 22px;
        }

        .comp-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          font-size: 14.5px;
          line-height: 1.55;
          color: #18221f;
        }

        /* Personas / Testimonials */
        .persona-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 22px;
        }

        .persona-card {
          background: #ffffff;
          border: 1px solid #e2e8df;
          border-radius: 16px;
          padding: 28px;
          box-shadow: 0 8px 24px rgba(24, 34, 31, 0.04);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          transition: transform 0.2s ease, border-color 0.2s ease;
        }

        .persona-card:hover {
          transform: translateY(-3px);
          border-color: #8da868;
        }

        /* Stepper */
        .stepper-tabs {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 24px;
        }

        .stepper-tab {
          background: #ffffff;
          border: 1px solid #e2e8df;
          border-radius: 12px;
          padding: 16px;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .stepper-tab:hover {
          border-color: #cbd4c8;
        }

        .stepper-tab.active {
          background: #18221f;
          border-color: #18221f;
          box-shadow: 0 6px 20px rgba(24, 34, 31, 0.12);
        }

        .stepper-num {
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          font-weight: 700;
          color: #798782;
        }

        .stepper-tab.active .stepper-num {
          color: #c8f064;
        }

        .stepper-tab-title {
          font-size: 13.5px;
          font-weight: 700;
          color: #18221f;
          line-height: 1.3;
        }

        .stepper-tab.active .stepper-tab-title {
          color: #eff5ec;
        }

        .stepper-card {
          background: #ffffff;
          border: 1px solid #e2e8df;
          border-radius: 16px;
          padding: 36px;
          box-shadow: 0 8px 30px rgba(24, 34, 31, 0.04);
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 36px;
          align-items: center;
        }

        /* Banner CTA */
        .landing-cta-banner {
          background: #18221f;
          color: #eff5ec;
          border-radius: 20px;
          padding: 56px 36px;
          text-align: center;
          margin: 40px auto 80px;
          max-width: 1200px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 20px 50px -10px rgba(24, 34, 31, 0.3);
        }

        /* Footer */
        .landing-footer {
          border-top: 1px solid #e2e8df;
          background: #f7f9f5;
          padding: 54px 24px 44px;
        }

        .landing-footer-inner {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 36px;
        }

        .footer-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 28px;
        }

        .footer-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid #e2e8df;
          padding-top: 24px;
          font-size: 13px;
          color: #798782;
          flex-wrap: wrap;
          gap: 12px;
        }

        /* Responsive Adjustments */
        @media (max-width: 860px) {
          .landing-nav-links {
            display: none;
          }
          .bento-grid {
            grid-template-columns: 1fr;
          }
          .bento-span-2 {
            grid-column: span 1;
          }
          .bento-two-col {
            grid-template-columns: 1fr;
          }
          .stepper-tabs {
            grid-template-columns: 1fr 1fr;
          }
          .stepper-card {
            grid-template-columns: 1fr;
          }
          .comparison-grid {
            grid-template-columns: 1fr;
          }
          .persona-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* Ambient Radial Glowing Orbs */}
      <div className="landing-ambient-orb-1" />
      <div className="landing-ambient-orb-2" />

      {/* Top Navigation Bar */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <div className="landing-brand" onClick={onLaunchApp}>
            <div className="landing-brand-box">t</div>
            <span className="landing-brand-text">tanka.</span>
          </div>

          <div className="landing-nav-links">
            <a href="#demo-nara" className="landing-nav-link">Demo Nara AI</a>
            <a href="#keunggulan" className="landing-nav-link">Keunggulan</a>
            <a href="#perbandingan" className="landing-nav-link">Cara Tanka</a>
            <a href="#testimoni" className="landing-nav-link">Kata Mereka</a>
            <a href="#alur" className="landing-nav-link">Alur Belajar</a>
            <a
              href="https://github.com/kaarlyz/Tanka"
              target="_blank"
              rel="noopener noreferrer"
              className="landing-nav-link"
              style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
            >
              GitHub <ExternalLink size={12} />
            </a>
          </div>

          <div className="landing-nav-actions">
            {currentUser ? (
              <span
                style={{
                  fontSize: 13,
                  fontFamily: "'DM Mono', monospace",
                  fontWeight: 600,
                  color: "#283832",
                  padding: "6px 10px",
                  background: "#eef2eb",
                  borderRadius: 6
                }}
              >
                @{currentUser.username}
              </span>
            ) : (
              <button
                className="landing-btn-ghost"
                onClick={() => onOpenAuth("login")}
              >
                Masuk
              </button>
            )}
            <button
              className="landing-btn-primary"
              onClick={onLaunchApp}
            >
              <span>Buka Aplikasi</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="hero-pill">
          <span className="hero-pill-dot" />
          <span>⚡ Belajar Cepat & Tuntas • 100% Bebas Iklan</span>
        </div>

        <h1 className="hero-title">
          Ubah Materi Apapun Jadi Paham Seketika.
          <span className="hero-title-sub">
            Belajar Mandiri Berdaya Tinggi, Bebas Gimmick.
          </span>
        </h1>

        <p className="hero-subtitle">
          Pecah PDF tebal, catatan kuliah, atau video YouTube 1 jam menjadi bab bacaan modular dalam hitungan detik. Didampingi tutor Nara AI yang sabar menjelaskan rumus langkah demi langkah.
        </p>

        <div className="hero-cta-group">
          <button className="hero-btn-launch" onClick={onLaunchApp}>
            <span>Mulai Belajar Sekarang (Gratis)</span>
            <ArrowRight size={16} />
          </button>
          <a
            href="https://github.com/kaarlyz/Tanka"
            target="_blank"
            rel="noopener noreferrer"
            className="hero-btn-github"
          >
            <span>Lihat Sumber Terbuka (GitHub)</span>
            <Star size={16} color="#eab308" fill="#eab308" />
          </a>
        </div>

        {/* Live Interactive Nara AI Simulator in Hero */}
        <div className="hero-simulator-wrapper" id="demo-nara">
          <div className="hero-simulator-card">
            <div className="simulator-header">
              <div className="simulator-title-left">
                <Bot size={16} color="#45544e" />
                <span>Simulasi Langsung: Tanya Nara AI</span>
              </div>
              <div className="simulator-badge">
                <Zap size={11} color="#527928" />
                <span>⚡ Dijawab dalam 0.18ms • Nara AI Model 3.8</span>
              </div>
            </div>

            <div className="simulator-chip-selector">
              <span style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: "#798782", marginRight: 4, textTransform: "uppercase" }}>
                Pilih Contoh:
              </span>
              {heroQuestions.map((item, idx) => (
                <button
                  key={idx}
                  className={`sim-chip ${activeHeroQ === idx ? "active" : ""}`}
                  onClick={() => handleSelectHeroQuestion(idx)}
                >
                  <Sparkles size={12} />
                  <span>{item.summary}</span>
                </button>
              ))}
            </div>

            <div className="simulator-chat-body">
              <div className="sim-bubble-user">
                <span>{heroQuestions[activeHeroQ].q}</span>
              </div>

              {isHeroThinking ? (
                <div className="sim-bubble-ai sim-typing-indicator">
                  <span className="sim-dot" />
                  <span className="sim-dot" />
                  <span className="sim-dot" />
                  <span style={{ fontSize: 12, color: "#798782", marginLeft: 6 }}>Nara sedang merumuskan jawaban...</span>
                </div>
              ) : (
                <div className="sim-bubble-ai">
                  <MathView text={heroQuestions[activeHeroQ].answer} />
                </div>
              )}
            </div>

            <div className="simulator-input-fake">
              <div className="sim-input-box">
                <BookOpen size={14} color="#798782" />
                <input
                  type="text"
                  placeholder="Ketik pertanyaan atau rumusmu sendiri..."
                  value={heroPromptInput}
                  onChange={(e) => setHeroPromptInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onLaunchApp();
                  }}
                  style={{
                    border: "none",
                    background: "transparent",
                    outline: "none",
                    width: "100%",
                    fontSize: 13,
                    color: "#18221f"
                  }}
                />
              </div>
              <button className="sim-input-send-btn" onClick={onLaunchApp}>
                <span>Tanya Nara</span>
                <Send size={12} />
              </button>
            </div>
          </div>
        </div>

        {/* Hero Device Mockup Frame */}
        <div className="mockup-window">
          <div className="mockup-chrome">
            <div className="mockup-dots">
              <span className="mockup-dot" style={{ background: "#ff5f56" }} />
              <span className="mockup-dot" style={{ background: "#ffbd2e" }} />
              <span className="mockup-dot" style={{ background: "#27c93f" }} />
            </div>
            <div className="mockup-url-pill">
              <Lock size={11} />
              <span>tanka.app/study/operasi-himpunan</span>
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
      </section>

      {/* Bento Grid Showcase Section */}
      <section id="keunggulan" className="landing-section">
        <div className="section-header">
          <span className="section-tag">KEUNGGULAN UTAMA</span>
          <h2 className="section-title">Belajar Lebih Efektif Tanpa Rasa Frustrasi</h2>
          <p className="section-desc">
            Dirancang khusus untuk memecah kerumitan materi belajar. Pahami konsep sulit lebih cepat, bebas distraksi iklan, dan didampingi tutor AI 24/7.
          </p>
        </div>

        <div className="bento-grid">
          {/* Card 1: 2 Kolom Lebar (Nara AI) */}
          <div className="bento-card bento-span-2">
            <div className="bento-two-col">
              <div>
                <div className="bento-label">TUTOR PRIBADI 24/7</div>
                <h3 className="bento-title">Tanya Rumus & Konsep Tanpa Rasa Malu</h3>
                <p className="bento-desc">
                  Gak paham satu langkah di soal matematika atau konsep teori rumit? Tanya Nara AI. Dijelaskan dengan analogi sederhana dan penurunan rumus bertahap sampai kamu benar-benar paham.
                </p>
                <div className="chip-group">
                  <span className="metric-chip">Analogi Ramah</span>
                  <span className="metric-chip">Penjelasan Bertahap</span>
                  <span className="metric-chip">Respon Seketika</span>
                </div>
              </div>
              <div className="mini-device-frame">
                <div className="mini-device-header">
                  <span className="mini-device-dot" />
                  <span className="mini-device-dot" />
                  <span className="mini-device-dot" />
                  <span style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", color: "#798782", marginLeft: 4 }}>
                    tanya-nara.ai [asisten-belajar]
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
          </div>

          {/* Card 2: 1 Kolom (Interactive Atomic Quiz) */}
          <div className="bento-card" id="fitur">
            <div>
              <div className="bento-label">LATIHAN INTERAKTIF TERUJI</div>
              <h3 className="bento-title">Kuis Pintar 1 Kartu 1 Fakta</h3>
              <p className="bento-desc">
                Coba langsung kuis interaktif di bawah. Setiap butir soal menguji inti logika tanpa jebakan halusinasi:
              </p>

              {/* Interactive Quiz Box */}
              <div className="quiz-demo-box">
                <div style={{ fontSize: 12, fontFamily: "'DM Mono', monospace", color: "#798782", marginBottom: 6 }}>
                  SOAL LATIHAN INTERAKTIF:
                </div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: "#18221f", lineHeight: 1.45 }}>
                  <MathView text="Jika himpunan $A = \{2, 4, 6\}$ dan $B = \{4, 6, 8\}$, maka anggota $A \cap B$ adalah..." />
                </div>

                <div style={{ marginTop: 10 }}>
                  <button
                    className={`quiz-option-btn ${quizSelected === "A" ? "selected-wrong" : ""}`}
                    onClick={() => setQuizSelected("A")}
                  >
                    <span>[A] <MathView text="$\{2, 8\}$" /></span>
                    {quizSelected === "A" && <X size={15} color="#dc2626" />}
                  </button>

                  <button
                    className={`quiz-option-btn ${quizSelected === "B" ? "selected-correct" : ""}`}
                    onClick={() => setQuizSelected("B")}
                  >
                    <span>[B] <MathView text="$\{4, 6\}$" /></span>
                    {quizSelected === "B" && <Check size={15} color="#15803d" />}
                  </button>

                  <button
                    className={`quiz-option-btn ${quizSelected === "C" ? "selected-wrong" : ""}`}
                    onClick={() => setQuizSelected("C")}
                  >
                    <span>[C] <MathView text="$\{2, 4, 6, 8\}$" /></span>
                    {quizSelected === "C" && <X size={15} color="#dc2626" />}
                  </button>
                </div>

                {quizSelected === "B" && (
                  <div className="quiz-feedback-banner correct">
                    <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                    <div>
                      <strong>Jawaban Benar!</strong> Irisan ($A \cap B$) adalah elemen yang ada di kedua himpunan ($4$ dan $6$).
                    </div>
                  </div>
                )}

                {(quizSelected === "A" || quizSelected === "C") && (
                  <div className="quiz-feedback-banner wrong">
                    <X size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                    <div>
                      {quizSelected === "A"
                        ? "Kurang tepat. Angka 2 tidak ada di B, dan angka 8 tidak ada di A. Irisan hanya mengambil yang sama di keduanya."
                        : "Kurang tepat. Itu adalah hasil gabungan (A ∪ B), bukan irisan (A ∩ B)."}
                      <button
                        onClick={() => setQuizSelected(null)}
                        style={{
                          display: "block",
                          marginTop: 6,
                          background: "none",
                          border: "none",
                          color: "#991b1b",
                          fontWeight: 700,
                          cursor: "pointer",
                          textDecoration: "underline",
                          fontSize: 11.5,
                          padding: 0
                        }}
                      >
                        Coba lagi
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="chip-group" style={{ marginTop: 20 }}>
              <span className="metric-chip">Anti-Halusinasi</span>
              <span className="metric-chip">Pembahasan Lengkap</span>
              <span className="metric-chip">Lacak Bank Salah</span>
            </div>
          </div>

          {/* Card 3: 1 Kolom (Interactive YouTube to Summary Preview) */}
          <div className="bento-card">
            <div>
              <div className="bento-label">INSTANT SUMMARY</div>
              <h3 className="bento-title">Video YouTube 1 Jam Jadi Rangkuman 3 Menit</h3>
              <p className="bento-desc">
                Cukup tempel link video YouTube. Tanka otomatis merapikannya menjadi modul bab interaktif layaknya buku saku digital.
              </p>

              {/* Interactive YouTube Simulator */}
              <div className="yt-demo-box">
                <div style={{ fontSize: 11.5, fontFamily: "'DM Mono', monospace", color: "#798782", marginBottom: 6 }}>
                  SIMULASI INPUT YOUTUBE:
                </div>
                <div className="yt-input-row">
                  <input
                    type="text"
                    readOnly
                    value="youtube.com/watch?v=kalkulus-dasar-1"
                    className="yt-input-field"
                  />
                  <button
                    className="yt-action-btn"
                    onClick={handleSimulateYouTube}
                    disabled={ytSimulating}
                  >
                    {ytSimulating ? "Meringkas..." : ytSimulated ? "Ulangi" : "Simulasikan"}
                  </button>
                </div>

                {ytSimulating && (
                  <div className="yt-progress-bar-bg">
                    <div
                      className="yt-progress-bar-fill"
                      style={{ width: `${ytProgress}%` }}
                    />
                  </div>
                )}

                {ytSimulated && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: "#283832", marginBottom: 6 }}>
                      ⚡ Hasil Ekstraksi Otomatis (3 Bab Ringkas):
                    </div>
                    <div className="yt-chapter-pill">
                      <span>1. Konsep Limit & Laju Perubahan</span>
                      <span style={{ color: "#5f6b66", fontSize: 11 }}>⏱️ 3 mnt</span>
                    </div>
                    <div className="yt-chapter-pill">
                      <span>2. Pembuktian Rumus Turunan Pertama</span>
                      <span style={{ color: "#5f6b66", fontSize: 11 }}>⏱️ 4 mnt</span>
                    </div>
                    <div className="yt-chapter-pill">
                      <span>3. Aplikasi Nilai Maksimum & Minimum</span>
                      <span style={{ color: "#5f6b66", fontSize: 11 }}>⏱️ 3 mnt</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="chip-group" style={{ marginTop: "auto", paddingTop: 16 }}>
              <span className="metric-chip">Auto-Chapter</span>
              <span className="metric-chip">Rangkuman Rumus</span>
              <span className="metric-chip">Estetika Paper-Ledger</span>
            </div>
          </div>

          {/* Card 4: 1 Kolom (Radial Knowledge Graph Visualizer) */}
          <div className="bento-card">
            <div>
              <div className="bento-label">VISUAL RETENTION</div>
              <h3 className="bento-title">Petakan Hubungan Antar-Konsep</h3>
              <p className="bento-desc">
                Visualisasikan alur keterkaitan materi secara menyeluruh agar tidak ada konsep yang tercecer. Klik simpul di bawah untuk eksplorasi:
              </p>

              {/* Radial Graph Visualizer */}
              <div className="radial-graph-wrapper">
                <svg width="100%" height="150" viewBox="0 0 320 150">
                  {/* Curved Connection Lines */}
                  <path d="M 160 75 Q 110 35 60 40" stroke="#a8c48a" strokeWidth="1.5" fill="none" strokeDasharray="3 3" />
                  <path d="M 160 75 Q 210 35 260 40" stroke="#a8c48a" strokeWidth="1.5" fill="none" strokeDasharray="3 3" />
                  <path d="M 160 75 Q 110 115 60 115" stroke="#a8c48a" strokeWidth="1.5" fill="none" strokeDasharray="3 3" />
                  <path d="M 160 75 Q 210 115 260 115" stroke="#a8c48a" strokeWidth="1.5" fill="none" strokeDasharray="3 3" />

                  {/* Outer Nodes */}
                  <g className="graph-node" onClick={() => setActiveGraphNode("Limit Aljabar")}>
                    <circle cx="60" cy="40" r="14" fill={activeGraphNode === "Limit Aljabar" ? "#18221f" : "#ffffff"} stroke="#8da868" strokeWidth="2" />
                    <text x="60" y="44" fontSize="9" textAnchor="middle" fill={activeGraphNode === "Limit Aljabar" ? "#c8f064" : "#18221f"} fontWeight="700">Limit</text>
                  </g>

                  <g className="graph-node" onClick={() => setActiveGraphNode("Turunan Fungsi")}>
                    <circle cx="260" cy="40" r="14" fill={activeGraphNode === "Turunan Fungsi" ? "#18221f" : "#ffffff"} stroke="#8da868" strokeWidth="2" />
                    <text x="260" y="44" fontSize="9" textAnchor="middle" fill={activeGraphNode === "Turunan Fungsi" ? "#c8f064" : "#18221f"} fontWeight="700">Turunan</text>
                  </g>

                  <g className="graph-node" onClick={() => setActiveGraphNode("Integral Riemann")}>
                    <circle cx="60" cy="115" r="14" fill={activeGraphNode === "Integral Riemann" ? "#18221f" : "#ffffff"} stroke="#8da868" strokeWidth="2" />
                    <text x="60" y="119" fontSize="9" textAnchor="middle" fill={activeGraphNode === "Integral Riemann" ? "#c8f064" : "#18221f"} fontWeight="700">Integral</text>
                  </g>

                  <g className="graph-node" onClick={() => setActiveGraphNode("Optimasi Nilai")}>
                    <circle cx="260" cy="115" r="14" fill={activeGraphNode === "Optimasi Nilai" ? "#18221f" : "#ffffff"} stroke="#8da868" strokeWidth="2" />
                    <text x="260" y="119" fontSize="9" textAnchor="middle" fill={activeGraphNode === "Optimasi Nilai" ? "#c8f064" : "#18221f"} fontWeight="700">Optimasi</text>
                  </g>

                  {/* Central Node */}
                  <g className="graph-node" onClick={() => setActiveGraphNode("Kalkulus Dasar")}>
                    <circle cx="160" cy="75" r="22" fill="#18221f" stroke="#c8f064" strokeWidth="2.5" />
                    <text x="160" y="79" fontSize="10" textAnchor="middle" fill="#c8f064" fontWeight="800">Kalkulus</text>
                  </g>
                </svg>

                <div style={{ marginTop: 6, fontSize: 12, fontFamily: "'DM Mono', monospace", color: "#283832" }}>
                  Simpul Terpilih: <strong>{activeGraphNode}</strong>
                  <span style={{ display: "block", color: "#798782", fontSize: 11, marginTop: 2 }}>
                    {activeGraphNode === "Kalkulus Dasar" && "Pusat fondasi keterkaitan aljabar limit, turunan, dan integral."}
                    {activeGraphNode === "Limit Aljabar" && "Prasyarat mutlak untuk memahami konsep turunan dan kemiringan kurva."}
                    {activeGraphNode === "Turunan Fungsi" && "Dipakai langsung untuk menyelesaikan persoalan laju perubahan dan optimasi."}
                    {activeGraphNode === "Integral Riemann" && "Operasi kebalikan turunan untuk menghitung akumulasi volume dan luas."}
                    {activeGraphNode === "Optimasi Nilai" && "Aplikasi praktis turunan pertama bernilai nol untuk mencari titik ekstrim."}
                  </span>
                </div>
              </div>
            </div>

            <div className="chip-group" style={{ marginTop: "auto", paddingTop: 16 }}>
              <span className="metric-chip">Peta Radial</span>
              <span className="metric-chip">Navigasi Simpul</span>
              <span className="metric-chip">Retensi Jangka Panjang</span>
            </div>
          </div>

          {/* Card 5: 1 Kolom (Interactive Offline & Ringan) */}
          <div className="bento-card">
            <div>
              <div className="bento-label">HEMAT & PRIVAT</div>
              <h3 className="bento-title">Bisa Dipelajari Offline & Hemat Kuota</h3>
              <p className="bento-desc">
                Semua data materi tersimpan di perangkatmu sendiri. Buka materi di mana saja tanpa pusing jaringan internet putus-nyambung:
              </p>

              {/* Interactive Offline Switch */}
              <div className="offline-toggle-container">
                <button
                  className={`offline-toggle-btn ${isOfflineMode ? "offline-active" : ""}`}
                  onClick={() => setIsOfflineMode(!isOfflineMode)}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {isOfflineMode ? <WifiOff size={16} color="#c8f064" /> : <Wifi size={16} color="#18221f" />}
                    <span>{isOfflineMode ? "Mode Pesawat / Offline Aktif" : "Mode Standar (Online)"}</span>
                  </div>
                  <span style={{ fontSize: 11, fontFamily: "'DM Mono', monospace" }}>
                    [Klik Switch]
                  </span>
                </button>

                <div style={{ marginTop: 12, fontSize: 12.5, lineHeight: 1.5, color: "#45544e" }}>
                  {isOfflineMode ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <CheckCircle2 size={15} color="#527928" />
                      <span>Data tetap terbuka instan <strong>0 ms</strong> walau tanpa kuota atau internet di kafe / perpus.</span>
                    </div>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Zap size={15} color="#18221f" />
                      <span>Tersinkron otomatis. Coba klik tombol di atas untuk simulasi buka offline.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="chip-group" style={{ marginTop: "auto", paddingTop: 16 }}>
              <span className="metric-chip">Local-First</span>
              <span className="metric-chip">Ringan di HP</span>
              <span className="metric-chip">Nol Iklan Mengganggu</span>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Comparison Section: Cara Lama vs Cara Tanka */}
      <section id="perbandingan" className="landing-section" style={{ paddingTop: 30 }}>
        <div className="section-header">
          <span className="section-tag">PERBANDINGAN NYATA</span>
          <h2 className="section-title">Tinggalkan Frustrasi Belajar Konvensional</h2>
          <p className="section-desc">
            Lihat bagaimana Tanka mengubah cara belajarmu dari scroll tanpa arah menjadi penguasaan materi yang terarah dan menyenangkan.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="comparison-tabs">
          <button
            className={`comp-tab-btn ${comparisonView === "both" ? "active" : ""}`}
            onClick={() => setComparisonView("both")}
          >
            Bandingkan Berdampingan
          </button>
          <button
            className={`comp-tab-btn ${comparisonView === "old" ? "active" : ""}`}
            onClick={() => setComparisonView("old")}
          >
            Cara Lama (Bikin Pusing)
          </button>
          <button
            className={`comp-tab-btn ${comparisonView === "tanka" ? "active" : ""}`}
            onClick={() => setComparisonView("tanka")}
          >
            Cara Tanka (Otonom & Cepat)
          </button>
        </div>

        <div className="comparison-grid">
          {(comparisonView === "both" || comparisonView === "old") && (
            <div className="comparison-card old-way">
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 700, color: "#991b1b", background: "#fee2e2", padding: "3px 8px", borderRadius: 4 }}>
                  CARA LAMA
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#7f1d1d" }}>
                  Bikin Pusing & Boros Waktu
                </span>
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: "#18221f", marginBottom: 6 }}>
                Belajar Konvensional Tanpa Arah
              </h3>
              <p style={{ fontSize: 13.5, color: "#6b7280", lineHeight: 1.5 }}>
                Tumpukan materi tebal yang sering membuat lelah sebelum paham intinya.
              </p>

              <div className="comp-list">
                <div className="comp-item">
                  <X size={18} color="#dc2626" style={{ flexShrink: 0, marginTop: 2 }} />
                  <span>Nonton video 2 jam, baru paham 1 rumus di menit 45.</span>
                </div>
                <div className="comp-item">
                  <X size={18} color="#dc2626" style={{ flexShrink: 0, marginTop: 2 }} />
                  <span>Buka PDF 200 halaman, scroll tanpa arah dan hilang fokus.</span>
                </div>
                <div className="comp-item">
                  <X size={18} color="#dc2626" style={{ flexShrink: 0, marginTop: 2 }} />
                  <span>Tanya guru atau teman malu karena takut dikira tidak menyimak.</span>
                </div>
                <div className="comp-item">
                  <X size={18} color="#dc2626" style={{ flexShrink: 0, marginTop: 2 }} />
                  <span>Belajar terdistraksi pop-up iklan dan notifikasi media sosial.</span>
                </div>
              </div>
            </div>
          )}

          {(comparisonView === "both" || comparisonView === "tanka") && (
            <div className="comparison-card tanka-way">
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 700, color: "#18221f", background: "#c8f064", padding: "3px 8px", borderRadius: 4 }}>
                  DENGAN TANKA
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#283832" }}>
                  Otonom, Rapi & Efisien
                </span>
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: "#18221f", marginBottom: 6 }}>
                Langsung Paham Inti Materi
              </h3>
              <p style={{ fontSize: 13.5, color: "#45544e", lineHeight: 1.5 }}>
                Modul kecil terstruktur yang dirancang agar retensi materi bertahan lama.
              </p>

              <div className="comp-list">
                <div className="comp-item">
                  <CheckCircle2 size={18} color="#527928" style={{ flexShrink: 0, marginTop: 2 }} />
                  <span>Video 2 jam langsung diringkas jadi 4 bab modul baca 3 menit.</span>
                </div>
                <div className="comp-item">
                  <CheckCircle2 size={18} color="#527928" style={{ flexShrink: 0, marginTop: 2 }} />
                  <span>PDF tebal otomatis dipotong per topik logis + penurunan rumus KaTeX rapi.</span>
                </div>
                <div className="comp-item">
                  <CheckCircle2 size={18} color="#527928" style={{ flexShrink: 0, marginTop: 2 }} />
                  <span>Tanya Nara AI 24 jam tanpa rasa malu, dijelaskan dari dasar sampai paham.</span>
                </div>
                <div className="comp-item">
                  <CheckCircle2 size={18} color="#527928" style={{ flexShrink: 0, marginTop: 2 }} />
                  <span>100% bebas iklan, local-first, hemat kuota dan fokus terjaga penuh.</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Social Proof: 3 Student Personas */}
      <section id="testimoni" className="landing-section" style={{ paddingTop: 30 }}>
        <div className="section-header">
          <span className="section-tag">CERITA PELAJAR</span>
          <h2 className="section-title">Dipercaya Siswa, Pejuang UTBK & Mahasiswa</h2>
          <p className="section-desc">
            Bukan klaim kosong. Inilah pengalaman nyata mereka yang belajar mandiri lebih cepat bersama Tanka.
          </p>
        </div>

        <div className="persona-grid">
          {/* Persona 1: Dafa */}
          <div className="persona-card">
            <div>
              <div style={{ display: "flex", gap: 3, marginBottom: 12 }}>
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={15} color="#eab308" fill="#eab308" />
                ))}
              </div>
              <p style={{ fontSize: 14.5, lineHeight: 1.6, color: "#18221f", fontStyle: "italic", marginBottom: 20 }}>
                "Paling kebantu sama Bank Salah dan kuis 1 kartu 1 fakta. Gak ada soal jebakan ngaco, rumus matematika langsung diterjemahin step by step."
              </p>
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: "#18221f" }}>Dafa</div>
              <div style={{ fontSize: 12.5, color: "#5f6b66" }}>Siswa Kelas XII / Pejuang UTBK</div>
              <div style={{ marginTop: 8 }}>
                <span style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", background: "#f2f5ef", padding: "3px 8px", borderRadius: 4, color: "#283832", fontWeight: 600 }}>
                  ✓ Lolos Target Tryout SNBT
                </span>
              </div>
            </div>
          </div>

          {/* Persona 2: Nadia */}
          <div className="persona-card">
            <div>
              <div style={{ display: "flex", gap: 3, marginBottom: 12 }}>
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={15} color="#eab308" fill="#eab308" />
                ))}
              </div>
              <p style={{ fontSize: 14.5, lineHeight: 1.6, color: "#18221f", fontStyle: "italic", marginBottom: 20 }}>
                "Kuliah sering dikasih jurnal 40 halaman. Dimasukin ke Tanka langsung jadi bab-bab kecil yang gampang dicerna sebelum kuis mingguan."
              </p>
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: "#18221f" }}>Nadia</div>
              <div style={{ fontSize: 12.5, color: "#5f6b66" }}>Mahasiswi Biologi</div>
              <div style={{ marginTop: 8 }}>
                <span style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", background: "#f2f5ef", padding: "3px 8px", borderRadius: 4, color: "#283832", fontWeight: 600 }}>
                  ✓ Rangkum Jurnal dalam 2 Menit
                </span>
              </div>
            </div>
          </div>

          {/* Persona 3: Rian */}
          <div className="persona-card">
            <div>
              <div style={{ display: "flex", gap: 3, marginBottom: 12 }}>
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={15} color="#eab308" fill="#eab308" />
                ))}
              </div>
              <p style={{ fontSize: 14.5, lineHeight: 1.6, color: "#18221f", fontStyle: "italic", marginBottom: 20 }}>
                "Bisa belajar offline di cafe atau perpus tanpa takut kuota jebol. Tampilannya bersih banget kayak aplikasi luar negeri."
              </p>
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: "#18221f" }}>Rian</div>
              <div style={{ fontSize: 12.5, color: "#5f6b66" }}>Pelajar Gap Year</div>
              <div style={{ marginTop: 8 }}>
                <span style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", background: "#f2f5ef", padding: "3px 8px", borderRadius: 4, color: "#283832", fontWeight: 600 }}>
                  ✓ Belajar Mandiri Tanpa Kuota
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Stepper Section */}
      <section id="alur" className="landing-section" style={{ paddingTop: 20 }}>
        <div className="section-header">
          <span className="section-tag">CARA KERJA</span>
          <h2 className="section-title">Dari Tumpukan Materi Jadi Paham Tuntas</h2>
          <p className="section-desc">
            Empat langkah mudah untuk memecah materi sulit menjadi unit belajar yang siap kamu kuasai.
          </p>
        </div>

        {/* Stepper Tabs */}
        <div className="stepper-tabs">
          {steps.map((s, idx) => (
            <button
              key={idx}
              className={`stepper-tab ${activeStep === idx ? "active" : ""}`}
              onClick={() => setActiveStep(idx)}
            >
              <span className="stepper-num">{s.num} // {s.tag}</span>
              <span className="stepper-tab-title">{s.title}</span>
            </button>
          ))}
        </div>

        {/* Stepper Active Detail Card */}
        <div className="stepper-card">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <span
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#18221f",
                  background: "#c8f064",
                  padding: "3px 8px",
                  borderRadius: 4
                }}
              >
                TAHAP {steps[activeStep].num}
              </span>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#798782" }}>
                {steps[activeStep].tag}
              </span>
            </div>

            <h3 style={{ fontSize: 24, fontWeight: 800, color: "#18221f", marginBottom: 14 }}>
              {steps[activeStep].title}
            </h3>

            <p style={{ fontSize: 15, lineHeight: 1.65, color: "#5f6b66", marginBottom: 24 }}>
              {steps[activeStep].detail}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {steps[activeStep].chips.map((c, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, color: "#18221f", fontWeight: 600 }}>
                  <CheckCircle2 size={16} color="#283832" />
                  <span>{c}</span>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              background: "#18221f",
              color: "#eff5ec",
              borderRadius: 14,
              padding: 28,
              border: "1px solid #283832",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#c8f064", letterSpacing: "0.05em" }}>
                METODE BELAJAR TERUJI
              </span>
              <Zap size={14} color="#c8f064" />
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: "#d5dfd9", marginBottom: 20 }}>
              "{steps[activeStep].summary}"
            </p>
            <button
              onClick={onLaunchApp}
              style={{
                width: "100%",
                background: "#c8f064",
                color: "#18221f",
                border: "none",
                borderRadius: 8,
                padding: "10px 16px",
                fontSize: 13.5,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8
              }}
            >
              <span>Mulai Belajar Sekarang</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <div className="landing-cta-banner">
        <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 14, color: "#ffffff" }}>
          Siap Paham Materi Lebih Cepat dan Tuntas?
        </h2>
        <p style={{ fontSize: 16, color: "#b5c2bc", maxWidth: 640, margin: "0 auto 32px", lineHeight: 1.6 }}>
          Mulai olah materi belajarmu sekarang. 100% bebas biaya, tanpa iklan mengganggu, dan catatan belajarmu tersimpan aman di perangkatmu.
        </p>
        <button
          onClick={onLaunchApp}
          style={{
            background: "#c8f064",
            color: "#18221f",
            border: "none",
            borderRadius: 10,
            padding: "16px 36px",
            fontSize: 16,
            fontWeight: 800,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            boxShadow: "0 8px 24px rgba(200, 240, 100, 0.3)"
          }}
        >
          <span>Mulai Belajar Sekarang (Gratis)</span>
          <ArrowRight size={18} />
        </button>
      </div>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="footer-top">
            <div style={{ maxWidth: 360 }}>
              <div className="landing-brand" onClick={onLaunchApp} style={{ marginBottom: 12 }}>
                <div className="landing-brand-box">t</div>
                <span className="landing-brand-text">tanka.</span>
              </div>
              <p style={{ fontSize: 13.5, lineHeight: 1.6, color: "#5f6b66" }}>
                Tanka — Platform Belajar Mandiri Cerdas untuk Pelajar SMA, Pejuang UTBK & Mahasiswa.
              </p>
            </div>

            <div style={{ display: "flex", gap: 48, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 700, color: "#18221f", marginBottom: 12, letterSpacing: "0.06em" }}>
                  KONTRIBUTOR & KODE
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <a
                    href="https://github.com/kaarlyz/Tanka"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 13, color: "#5f6b66", textDecoration: "none" }}
                  >
                    GitHub Repository
                  </a>
                  <a
                    href="https://github.com/kaarlyz/Tanka/blob/main/LICENSE"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 13, color: "#5f6b66", textDecoration: "none" }}
                  >
                    MIT License
                  </a>
                </div>
              </div>

              <div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 700, color: "#18221f", marginBottom: 12, letterSpacing: "0.06em" }}>
                  PRIVASI & KEAMANAN
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <span style={{ fontSize: 13, color: "#5f6b66" }}>
                    Data Privat di Perangkat
                  </span>
                  <span style={{ fontSize: 13, color: "#5f6b66" }}>
                    Kuis Akurat & Bebas Halusinasi
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <span>© 2026 Tanka by kaarlyz. All rights reserved.</span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12 }}>
              Belajar Mandiri Cerdas • Bebas Iklan • 100% Privat
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
