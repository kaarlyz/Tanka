import React, { useState, useEffect, useRef } from "react";
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
  BookOpen,
  Send,
  HelpCircle,
  Layers,
  Brain,
  Flame,
  FileText,
  Play
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

  // Hero Live Nara AI Simulator state
  const [activeHeroQ, setActiveHeroQ] = useState(0);
  const [isHeroThinking, setIsHeroThinking] = useState(false);
  const [heroPromptInput, setHeroPromptInput] = useState("");

  const heroQuestions = [
    {
      q: "Bagaimana cara mencari irisan himpunan A ∩ B?",
      chip: "Irisan Himpunan A ∩ B",
      answer:
        "Irisan dua himpunan $A \\cap B$ adalah anggota yang ada di **kedua himpunan sekaligus**:\n\n$$A \\cap B = \\{x \\mid x \\in A \\land x \\in B\\}$$\n\n**Contoh simpel:**\nKalau $A = \\{2, 4, 6\\}$ dan $B = \\{4, 6, 8\\}$, angka yang kembar di dua himpunan itu cuma $\\{4, 6\\}$. Gampang kan?"
    },
    {
      q: "Jelaskan hukum fotosintesis secara singkat",
      chip: "Fotosintesis Singkat",
      answer:
        "Intinya, tanaman memasak makanannya sendiri memanfaatkan sinar matahari:\n\n$$6CO_2 + 6H_2O \\xrightarrow{\\text{cahaya}} C_6H_{12}O_6 + 6O_2$$\n\nKarbon dioksida dan air diubah jadi **gula (energi tanaman)** plus melepas **oksigen bersih** yang kita hirup setiap hari."
    },
    {
      q: "Kenapa rumus pythagoras a² + b² = c²?",
      chip: "Rumus Pythagoras Berlaku",
      answer:
        "Pada segitiga siku-siku, luas bujur sangkar di sisi miring ($c$) selalu persis sama dengan gabungan luas kedua sisi lainnya:\n\n$$a^2 + b^2 = c^2 \\implies c = \\sqrt{a^2 + b^2}$$\n\nIni bukti kenapa jalan pintas diagonal selalu jadi rute paling efisien saat mengukur jarak lurus."
    }
  ];

  const handleSelectHeroQuestion = (idx: number) => {
    if (idx === activeHeroQ && !isHeroThinking) return;
    setIsHeroThinking(true);
    setActiveHeroQ(idx);
    setTimeout(() => {
      setIsHeroThinking(false);
    }, 450);
  };

  // Bento Interactive Quiz state
  const [quizSelected, setQuizSelected] = useState<string | null>(null);

  // Bento YouTube Simulator state
  const [ytUrlInput, setYtUrlInput] = useState("https://youtube.com/watch?v=kalkulus-dasar");
  const [isYtProcessing, setIsYtProcessing] = useState(false);
  const [ytProcessed, setYtProcessed] = useState(true);

  const handleSimulateYt = () => {
    setIsYtProcessing(true);
    setYtProcessed(false);
    setTimeout(() => {
      setIsYtProcessing(false);
      setYtProcessed(true);
    }, 700);
  };

  // Bento Radial Graph state
  const [activeGraphNode, setActiveGraphNode] = useState("Kalkulus Dasar");

  // Bento Offline state
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  // Cursor Spotlight State for Bento Section
  const [bentoMouse, setBentoMouse] = useState({ x: 300, y: 200 });
  const handleBentoMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setBentoMouse({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  // Scroll Reveal Observer
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
          }
        });
      },
      {
        root: containerRef.current,
        threshold: 0.08,
        rootMargin: "0px 0px -40px 0px"
      }
    );

    const elements = document.querySelectorAll(".reveal-scroll");
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
      observer.disconnect();
    };
  }, []);

  const steps = [
    {
      num: "01",
      tag: "INPUT BAHAN",
      title: "Tumpahkan Materi Belajarmu",
      detail:
        "Punya PDF 200 halaman, slide presentasi dosen, foto catatan di buku tulis, atau video YouTube 2 jam? Cukup unggah ke Tanka. Sistem akan langsung membersihkan teks dan merapikannya.",
      chips: ["Multi-format PDF & Dokumen", "Transkrip YouTube Otomatis", "Bebas Iklan & Bersih"],
      summary: "Gak perlu lagi buang waktu berjam-jam cuma buat merapikan atau mencatat ulang materi."
    },
    {
      num: "02",
      tag: "BACA RINGKAS",
      title: "Materi Jadi Bab Kecil Siap Santap",
      detail:
        "Tanka memotong materi tebal menjadi modul bab terstruktur yang bisa diselesaikan dalam 3-5 menit baca. Rumus matematika dan grafik diterjemahkan presisi tanpa font rusak.",
      chips: ["Modul Bab 3 Menitan", "Penurunan Rumus Rapi", "Tampilan Ramah Mata"],
      summary: "Belajar jadi gak kerasa berat karena materi dipecah jadi potongan-potongan kecil yang ringan."
    },
    {
      num: "03",
      tag: "TANYA TUTOR",
      title: "Tanya Rumus Kapan Saja Tanpa Rasa Malu",
      detail:
        "Mentok di baris rumus tertentu? Langsung buka Nara AI. Tanya dari mana asal suatu angka atau minta analogi sehari-hari. Nara menerangkan langkah demi langkah tanpa menghakimi.",
      chips: ["Tutor Siaga 24 Jam", "Analogi Sederhana", "Respon Langsung Tanpa Jeda"],
      summary: "Keleluasaan bertanya sepuasnya sampai kepalamu bener-bener ngeh konsep dasarnya."
    },
    {
      num: "04",
      tag: "UJI PEMAHAMAN",
      title: "Kuis Pintar & Bank Salah Pribadi",
      detail:
        "Uji ingatanmu lewat kuis 1 kartu 1 fakta. Setiap kesalahan otomatis dicatat ke Bank Salah pribadimu, jadi kamu tahu persis titik lemah yang perlu diulang sebelum hari H ujian.",
      chips: ["Kuis Logika Teruji", "Bank Salah Otomatis", "Peta Konsep Menyeluruh"],
      summary: "Bukan sekadar merasa sudah baca, tapi kamu benar-benar siap saat ujian di depan mata."
    }
  ];

  return (
    <div className="tanka-landing-container" ref={containerRef}>
      <style>{`
        .tanka-landing-container {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          width: 100%;
          height: 100%;
          overflow-y: auto;
          overflow-x: hidden;
          -webkit-overflow-scrolling: touch;
          background-color: #fbfdf9;
          background-image: 
            radial-gradient(circle at 50% 0%, rgba(200, 240, 100, 0.14) 0%, transparent 60%),
            linear-gradient(to right, rgba(24, 34, 31, 0.035) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(24, 34, 31, 0.035) 1px, transparent 1px);
          background-size: 100% 100%, 36px 36px, 36px 36px;
          color: #18221f;
          font-family: 'Plus Jakarta Sans', 'Manrope', -apple-system, BlinkMacSystemFont, sans-serif;
          -webkit-font-smoothing: antialiased;
          scroll-behavior: smooth;
        }

        /* Ambient Glowing Background Orbs */
        .landing-ambient-orb-1 {
          position: absolute;
          top: 40px;
          left: 30%;
          width: 820px;
          height: 480px;
          background: radial-gradient(ellipse at center, rgba(200, 240, 100, 0.28) 0%, rgba(75, 102, 35, 0.1) 50%, transparent 75%);
          filter: blur(80px);
          pointer-events: none;
          z-index: 0;
          animation: orbDrift 9s ease-in-out infinite alternate;
        }

        .landing-ambient-orb-2 {
          position: absolute;
          top: 1300px;
          right: 0%;
          width: 720px;
          height: 460px;
          background: radial-gradient(ellipse at center, rgba(168, 196, 138, 0.24) 0%, rgba(24, 34, 31, 0.06) 55%, transparent 75%);
          filter: blur(90px);
          pointer-events: none;
          z-index: 0;
          animation: orbDriftReverse 11s ease-in-out infinite alternate;
        }

        @keyframes orbDrift {
          0% { transform: translateY(0) scale(1); }
          100% { transform: translateY(38px) scale(1.1); }
        }

        @keyframes orbDriftReverse {
          0% { transform: translateY(0) scale(1); }
          100% { transform: translateY(-42px) scale(1.08); }
        }

        /* Dynamic Scroll Reveal */
        .reveal-scroll {
          opacity: 0;
          transform: translateY(32px);
          transition: opacity 0.75s cubic-bezier(0.16, 1, 0.3, 1), transform 0.75s cubic-bezier(0.16, 1, 0.3, 1);
          will-change: opacity, transform;
        }

        .reveal-scroll.is-revealed {
          opacity: 1;
          transform: translateY(0);
        }

        .delay-1 { transition-delay: 0.12s; }
        .delay-2 { transition-delay: 0.24s; }
        .delay-3 { transition-delay: 0.36s; }

        /* Top Navigation */
        .landing-nav {
          position: sticky;
          top: 0;
          z-index: 1000;
          background: rgba(251, 253, 249, 0.88);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(226, 232, 223, 0.8);
        }

        .landing-nav-inner {
          max-width: 1440px;
          margin: 0 auto;
          padding: 16px clamp(24px, 4.5vw, 64px);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .landing-brand {
          display: flex;
          align-items: center;
          gap: 9px;
          cursor: pointer;
          user-select: none;
          text-decoration: none;
        }

        .landing-brand-box {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          background: #18221f;
          color: #c8f064;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'DM Mono', monospace;
          font-weight: 800;
          font-size: 16px;
          box-shadow: 0 2px 8px rgba(24, 34, 31, 0.12);
        }

        .landing-brand-text {
          font-size: 19px;
          font-weight: 800;
          letter-spacing: -0.03em;
          color: #18221f;
        }

        .landing-nav-links {
          display: flex;
          align-items: center;
          gap: 26px;
        }

        .landing-nav-link {
          font-size: 14px;
          font-weight: 600;
          color: #55635e;
          text-decoration: none;
          transition: color 0.15s ease;
        }

        .landing-nav-link:hover {
          color: #18221f;
        }

        .landing-nav-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .landing-btn-ghost {
          background: transparent;
          border: none;
          color: #18221f;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .landing-btn-ghost:hover {
          background: rgba(24, 34, 31, 0.05);
        }

        .landing-btn-primary {
          background: #18221f;
          color: #c8f064;
          border: 1px solid #18221f;
          padding: 9px 20px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 4px 14px rgba(24, 34, 31, 0.12);
        }

        .landing-btn-primary:hover {
          background: #24352f;
          transform: translateY(-1.5px);
          box-shadow: 0 8px 20px rgba(24, 34, 31, 0.2);
        }

        /* ========================================================
           HERO SECTION: ASYMMETRIC SPLIT (Kiri Teks, Kanan Simulator)
           ======================================================== */
        .landing-hero-asymmetric {
          position: relative;
          z-index: 1;
          max-width: 1440px;
          margin: 0 auto;
          padding: clamp(56px, 8vh, 96px) clamp(24px, 4.5vw, 64px) clamp(44px, 6vh, 68px);
        }

        .hero-split-grid {
          display: grid;
          grid-template-columns: 1.12fr 1fr;
          gap: clamp(40px, 5vw, 72px);
          align-items: center;
        }

        @keyframes heroFadeUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .hero-split-left {
          text-align: left;
          animation: heroFadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .hero-kicker-wrap {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          border-radius: 999px;
          background: rgba(200, 240, 100, 0.22);
          color: #273e1c;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.03em;
          margin-bottom: 18px;
        }

        .hero-kicker-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #4b6623;
          box-shadow: 0 0 10px rgba(75, 102, 35, 0.8);
          animation: dotPulse 2s infinite ease-in-out;
        }

        @keyframes dotPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.65; }
        }

        .hero-title-left {
          font-size: clamp(2.35rem, 4.1vw, 3.85rem);
          font-weight: 800;
          line-height: 1.12;
          letter-spacing: -0.035em;
          color: #18221f;
          margin-bottom: 20px;
        }

        .hero-title-highlight {
          display: block;
          color: #4b6623;
          margin-top: 6px;
          letter-spacing: -0.025em;
          background: linear-gradient(135deg, #18221f 20%, #4b6623 85%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hero-subtitle-left {
          font-size: clamp(15px, 1.15vw, 17.5px);
          line-height: 1.68;
          color: #52605b;
          margin-bottom: 32px;
          max-width: 580px;
        }

        .hero-cta-left {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 28px;
        }

        .hero-btn-main {
          background: #18221f;
          color: #c8f064;
          border: 1px solid #18221f;
          padding: 14px 28px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 10px 28px -4px rgba(24, 34, 31, 0.25);
        }

        .hero-btn-main:hover {
          background: #24352f;
          transform: translateY(-2px);
          box-shadow: 0 14px 36px -4px rgba(24, 34, 31, 0.35);
        }

        .hero-btn-sub {
          background: #ffffff;
          color: #18221f;
          border: 1px solid #dce2da;
          padding: 14px 22px;
          border-radius: 12px;
          font-size: 14.5px;
          font-weight: 600;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(24, 34, 31, 0.04);
        }

        .hero-btn-sub:hover {
          background: #f7f9f5;
          border-color: #cbd4c8;
          transform: translateY(-1px);
        }

        .hero-trust-row {
          display: flex;
          align-items: center;
          gap: 24px;
          font-size: 13px;
          color: #60706a;
          font-weight: 600;
        }

        .hero-trust-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        /* Hero Right: Live Interactive Simulator */
        .hero-split-right {
          position: relative;
          animation: heroFadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.15s both;
        }

        .hero-simulator-card {
          background: #ffffff;
          border: 1px solid #dce3d8;
          border-radius: 16px;
          box-shadow: 0 20px 50px -12px rgba(24, 34, 31, 0.1), 0 0 0 1px rgba(24, 34, 31, 0.02);
          overflow: hidden;
          transition: border-color 0.25s ease, box-shadow 0.25s ease;
        }

        .hero-simulator-card:hover {
          border-color: #8da868;
          box-shadow: 0 24px 60px -14px rgba(24, 34, 31, 0.14);
        }

        .simulator-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 11px 16px;
          background: #f6f8f4;
          border-bottom: 1px solid #e2e8df;
        }

        .simulator-title-left {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12.5px;
          font-weight: 700;
          color: #18221f;
        }

        .simulator-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 600;
          color: #273e1c;
          background: rgba(200, 240, 100, 0.25);
          padding: 3px 9px;
          border-radius: 999px;
        }

        .simulator-chip-selector {
          padding: 10px 16px 6px;
          display: flex;
          align-items: center;
          gap: 7px;
          overflow-x: auto;
          scrollbar-width: none;
        }

        .simulator-chip-selector::-webkit-scrollbar {
          display: none;
        }

        .sim-chip {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 6px 11px;
          border-radius: 8px;
          background: #f3f6f0;
          border: 1px solid #dfe5da;
          font-size: 12px;
          font-weight: 600;
          color: #45544e;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s ease;
        }

        .sim-chip:hover {
          background: #e7ede2;
          color: #18221f;
        }

        .sim-chip.active {
          background: #18221f;
          color: #c8f064;
          border-color: #18221f;
          box-shadow: 0 4px 12px rgba(24, 34, 31, 0.12);
        }

        .simulator-chat-body {
          padding: 14px 16px;
          min-height: 130px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        @keyframes bubblePop {
          0% { transform: scale(0.94) translateY(6px); opacity: 0; }
          70% { transform: scale(1.02) translateY(-2px); opacity: 1; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }

        .sim-bubble-user {
          align-self: flex-end;
          background: #18221f;
          color: #f7f9f5;
          padding: 8px 14px;
          border-radius: 12px 12px 2px 12px;
          font-size: 13px;
          max-width: 88%;
          line-height: 1.45;
          font-weight: 500;
          animation: bubblePop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }

        .sim-bubble-ai {
          align-self: flex-start;
          background: #f8faf6;
          border: 1px solid #e2e8df;
          color: #18221f;
          padding: 12px 16px;
          border-radius: 12px 12px 12px 2px;
          font-size: 13px;
          line-height: 1.6;
          max-width: 96%;
          box-shadow: 0 4px 14px rgba(24, 34, 31, 0.03);
          animation: bubblePop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }

        .sim-typing-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 14px;
        }

        .sim-dot {
          width: 5px;
          height: 5px;
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

        /* Seamless Single-Border Input Bar */
        .simulator-input-seamless {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px 12px;
          background: #ffffff;
          border-top: 1px solid #eef2eb;
        }

        .sim-input-shell {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 8px;
          background: #f4f7f1;
          border-radius: 10px;
          padding: 8px 12px;
          border: 1px solid #e2e8df;
          transition: all 0.2s ease;
        }

        .sim-input-shell:focus-within {
          background: #ffffff;
          border-color: #8da868;
          box-shadow: 0 0 0 3px rgba(141, 168, 104, 0.15);
        }

        input.sim-input-field,
        .sim-input-shell input {
          border: none !important;
          background: transparent !important;
          outline: none !important;
          box-shadow: none !important;
          padding: 0 !important;
          width: 100% !important;
          font-size: 12.5px !important;
          color: #18221f !important;
          font-family: inherit !important;
        }

        .sim-input-submit-btn {
          background: #c8f064 !important;
          color: #18221f !important;
          border: 1px solid #b2dc4a !important;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 12.5px;
          font-weight: 800;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.15s ease;
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(75, 102, 35, 0.15);
        }

        .sim-input-submit-btn:hover {
          background: #d4f87c !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(75, 102, 35, 0.22);
        }

        /* ========================================================
           FULL-WIDTH MOCKUP BREAK (Ritme Tengah dengan 3D Depth)
           ======================================================== */
        .mockup-break-section {
          max-width: 1260px;
          margin: 40px auto 30px;
          padding: 0 28px;
        }

        .hero-mockup-container {
          position: relative;
          max-width: 1100px;
          margin: 0 auto;
          perspective: 1400px;
        }

        @keyframes floatSlow1 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-11px) rotate(-1.5deg); }
        }

        @keyframes floatSlow2 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-13px) rotate(1.5deg); }
        }

        @keyframes floatSlow3 {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-9px); }
        }

        .hero-float-badge {
          position: absolute;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border: 1px solid rgba(200, 240, 100, 0.4);
          border-radius: 14px;
          padding: 12px 18px;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: 0 20px 42px rgba(24, 34, 31, 0.12);
          z-index: 10;
          text-align: left;
          pointer-events: none;
        }

        .float-top-left {
          top: -24px;
          left: -16px;
          animation: floatSlow1 5.5s ease-in-out infinite;
        }

        .float-top-right {
          top: -18px;
          right: -16px;
          animation: floatSlow2 6.5s ease-in-out infinite 0.8s;
        }

        .float-mid-left {
          top: 240px;
          left: -28px;
          animation: floatSlow3 6s ease-in-out infinite 1.4s;
        }

        .float-badge-icon {
          font-size: 20px;
          line-height: 1;
        }

        .float-badge-text strong {
          display: block;
          font-size: 13px;
          font-weight: 800;
          color: #18221f;
        }

        .float-badge-text small {
          display: block;
          font-size: 11px;
          color: #60706a;
        }

        @media (max-width: 860px) {
          .hero-float-badge {
            display: none !important;
          }
          .hero-split-grid {
            grid-template-columns: 1fr;
            gap: 36px;
          }
        }

        /* Mockup Window with 3D Perspective Tilt */
        .mockup-window {
          border-radius: 18px;
          border: 1px solid #dce2da;
          background: #ffffff;
          box-shadow: 0 40px 100px -20px rgba(24, 34, 31, 0.28), 0 0 0 1px rgba(24, 34, 31, 0.04);
          overflow: hidden;
          transform: rotateX(10deg) rotateY(-2deg) scale(0.98);
          transform-style: preserve-3d;
          transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.5s ease;
        }

        @media (hover: hover) and (pointer: fine) {
          .hero-mockup-container:hover .mockup-window {
            transform: rotateX(0deg) rotateY(0deg) scale(1);
            box-shadow: 0 45px 110px -18px rgba(24, 34, 31, 0.32);
          }
        }

        .mockup-chrome {
          height: 42px;
          background: #f4f6f1;
          border-bottom: 1px solid #e2e8df;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
        }

        .mockup-dots {
          display: flex;
          gap: 7px;
          align-items: center;
        }

        .mockup-dot {
          width: 11px;
          height: 11px;
          border-radius: 50%;
        }

        .mockup-url-pill {
          background: #ffffff;
          border: 1px solid #e2e8df;
          border-radius: 8px;
          padding: 4px 18px;
          font-size: 12px;
          font-family: 'DM Mono', monospace;
          color: #55635e;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .mockup-img {
          width: 100%;
          height: auto;
          display: block;
        }

        /* Animated Marquee Ticker */
        .landing-marquee-wrapper {
          overflow: hidden;
          padding: 42px 0 16px;
          user-select: none;
          max-width: 100%;
          position: relative;
        }

        .landing-marquee-wrapper::before,
        .landing-marquee-wrapper::after {
          content: "";
          position: absolute;
          top: 0;
          bottom: 0;
          width: 120px;
          z-index: 2;
          pointer-events: none;
        }

        .landing-marquee-wrapper::before {
          left: 0;
          background: linear-gradient(to right, #fbfdf9 30%, transparent);
        }

        .landing-marquee-wrapper::after {
          right: 0;
          background: linear-gradient(to left, #fbfdf9 30%, transparent);
        }

        .landing-marquee-track {
          display: flex;
          width: max-content;
          animation: marqueeLoop 28s linear infinite;
        }

        @keyframes marqueeLoop {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        .landing-marquee-content {
          display: flex;
          align-items: center;
          gap: 24px;
          padding-right: 24px;
          font-family: 'DM Mono', monospace;
          font-size: 12px;
          font-weight: 700;
          color: #4b6623;
          letter-spacing: 0.08em;
        }

        .marquee-dot {
          color: #a8be98;
          font-size: 14px;
        }

        /* Generic Section Elements */
        .landing-section {
          position: relative;
          z-index: 1;
          max-width: 1260px;
          margin: 0 auto;
          padding: 90px 28px;
        }

        /* Left-aligned or Centered Header Rhythm */
        .section-header-left {
          text-align: left;
          max-width: 760px;
          margin-bottom: 48px;
        }

        .section-header-center {
          text-align: center;
          max-width: 800px;
          margin: 0 auto 52px;
        }

        /* Borderless Section Kicker */
        .section-kicker {
          display: inline-block;
          font-family: 'DM Mono', monospace;
          font-size: 11.5px;
          font-weight: 800;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #4b6623;
          margin-bottom: 12px;
        }

        .section-title {
          font-size: clamp(2rem, 4.2vw, 2.9rem);
          font-weight: 800;
          letter-spacing: -0.03em;
          color: #18221f;
          margin-bottom: 16px;
          line-height: 1.2;
        }

        .section-desc {
          font-size: 16px;
          line-height: 1.65;
          color: #55635e;
        }

        /* ========================================================
           EDITORIAL FEATURE SHOWCASE (Rombak Bento Box Jadi Alur Bebas Border)
           ======================================================== */
        .features-flow-wrapper {
          display: flex;
          flex-direction: column;
          gap: clamp(48px, 6vh, 72px);
          position: relative;
        }

        .feature-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-family: 'DM Mono', monospace;
          font-size: 11.5px;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #4b6623;
          margin-bottom: 12px;
        }

        .feature-headline {
          font-size: clamp(1.85rem, 2.5vw, 2.45rem);
          font-weight: 800;
          line-height: 1.2;
          letter-spacing: -0.025em;
          color: #18221f;
          margin-bottom: 16px;
        }

        .feature-lead {
          font-size: clamp(14.5px, 1.1vw, 16px);
          line-height: 1.68;
          color: #55635e;
          margin-bottom: 24px;
        }

        /* Block 1: Master Spotlight Card (Tutor Nara AI 2-Col) */
        .feature-hero-card {
          background: #ffffff;
          border: 1px solid rgba(226, 232, 223, 0.85);
          border-radius: 28px;
          padding: clamp(38px, 4.5vw, 64px);
          box-shadow: 0 20px 60px -15px rgba(24, 34, 31, 0.05);
          transition: transform 0.28s ease, box-shadow 0.28s ease, border-color 0.25s ease;
        }

        @media (hover: hover) and (pointer: fine) {
          .feature-hero-card:hover {
            border-color: #8da868;
            box-shadow: 0 28px 70px -15px rgba(24, 34, 31, 0.09);
          }
        }

        .feature-hero-split {
          display: grid;
          grid-template-columns: 1.05fr 1.15fr;
          gap: clamp(36px, 4.5vw, 68px);
          align-items: center;
        }

        .feature-checklist {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .feature-check-item {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14.5px;
          font-weight: 600;
          color: #18221f;
        }

        .mini-device-frame {
          border-radius: 14px;
          border: 1px solid #e2e8df;
          background: #f7f9f5;
          overflow: hidden;
          box-shadow: 0 20px 50px -10px rgba(24, 34, 31, 0.08);
        }

        .mini-device-header {
          height: 32px;
          background: #edf1e9;
          border-bottom: 1px solid #e2e8df;
          display: flex;
          align-items: center;
          padding: 0 14px;
          gap: 6px;
        }

        .mini-device-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #c2cbbd;
        }

        /* Block 2: Dual Grid (Kuis Cerdas & YouTube) */
        .feature-dual-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: clamp(32px, 4vw, 48px);
        }

        .feature-card-item {
          background: #ffffff;
          border: 1px solid rgba(226, 232, 223, 0.85);
          border-radius: 26px;
          padding: clamp(36px, 4vw, 50px);
          box-shadow: 0 16px 45px -12px rgba(24, 34, 31, 0.05);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          transition: transform 0.28s ease, box-shadow 0.28s ease, border-color 0.25s ease;
        }

        @media (hover: hover) and (pointer: fine) {
          .feature-card-item:hover {
            transform: translateY(-4px);
            border-color: #8da868;
            box-shadow: 0 24px 55px rgba(24, 34, 31, 0.09);
          }
        }

        /* Seamless Interactive Quiz (Tanpa Nested Box Gray Border) */
        .seamless-interactive-area {
          margin-top: 18px;
        }

        .quiz-prompt-text {
          font-size: 14.5px;
          font-weight: 700;
          color: #18221f;
          line-height: 1.5;
          padding: 12px 14px;
          background: #f7f9f5;
          border-radius: 12px;
          margin-bottom: 12px;
        }

        .quiz-option-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          margin-top: 8px;
          border-radius: 12px;
          border: 1px solid #dfe5da;
          background: #ffffff;
          font-size: 14px;
          font-weight: 600;
          color: #18221f;
          cursor: pointer;
          transition: all 0.15s ease;
          text-align: left;
        }

        .quiz-option-btn:hover {
          border-color: #8da868;
          background: #f8faf5;
        }

        .quiz-option-btn.selected-correct {
          background: #f2fae6;
          border-color: #8da868 !important;
          box-shadow: 0 0 0 2px #8da868;
          color: #183312;
        }

        .quiz-option-btn.selected-wrong {
          background: #fef2f2;
          border-color: #fca5a5;
          color: #991b1b;
        }

        .quiz-feedback-banner {
          margin-top: 14px;
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 13px;
          line-height: 1.55;
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }

        .quiz-feedback-banner.correct {
          background: #eff8db;
          color: #273e1c;
          border: 1px solid #c7e89d;
        }

        .quiz-feedback-banner.wrong {
          background: #fee2e2;
          color: #991b1b;
          border: 1px solid #fecaca;
        }

        /* Seamless YouTube Area (Tanpa Nested Box Gray Border) */
        .yt-input-row {
          display: flex;
          gap: 8px;
          align-items: center;
          margin-top: 14px;
        }

        .yt-input-field {
          flex: 1;
          background: #f6f8f4;
          border: 1px solid #dce2da;
          border-radius: 10px;
          padding: 11px 14px;
          font-size: 13px;
          font-family: 'DM Mono', monospace;
          color: #45544e;
          outline: none;
          transition: border-color 0.15s ease;
        }

        .yt-input-field:focus {
          border-color: #8da868;
          background: #ffffff;
        }

        .yt-action-btn {
          background: #18221f;
          color: #c8f064;
          border: none;
          padding: 11px 18px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
          transition: background 0.15s ease;
        }

        .yt-action-btn:hover {
          background: #24352f;
        }

        .yt-progress-bar-bg {
          width: 100%;
          height: 6px;
          background: #e2e8df;
          border-radius: 4px;
          margin-top: 14px;
          overflow: hidden;
        }

        .yt-progress-bar-fill {
          height: 100%;
          background: #4b6623;
          transition: width 0.3s ease;
        }

        .yt-chapter-pill {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          background: #f8faf5;
          border: 1px solid #e2e8df;
          border-radius: 10px;
          margin-top: 8px;
          font-size: 13px;
          font-weight: 600;
          color: #18221f;
        }

        /* Block 3: Asymmetric Duo (Peta Konsep & Offline) */
        .feature-dual-asym {
          display: grid;
          grid-template-columns: 1.12fr 0.88fr;
          gap: clamp(32px, 4vw, 48px);
        }

        @keyframes flowEnergy {
          from { stroke-dashoffset: 24; }
          to { stroke-dashoffset: 0; }
        }

        .graph-link-pulse {
          stroke-dasharray: 6 6;
          animation: flowEnergy 1.2s linear infinite;
        }

        .graph-node {
          cursor: pointer;
          transition: transform 0.2s ease;
        }

        .graph-node:hover {
          filter: drop-shadow(0 2px 8px rgba(141, 168, 104, 0.5));
        }

        /* Seamless Offline Switch */
        .offline-toggle-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #f7f9f4;
          border: 1px solid #dce2da;
          padding: 14px 18px;
          border-radius: 12px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 700;
          color: #18221f;
          transition: all 0.2s ease;
          margin-top: 14px;
        }

        .offline-toggle-btn:hover {
          border-color: #8da868;
        }

        .offline-toggle-btn.offline-active {
          background: #18221f;
          color: #c8f064;
          border-color: #18221f;
        }

        /* Side-By-Side Visual Battle Comparison with Rotating Glow Beam */
        .comparison-dual-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: clamp(30px, 3.5vw, 48px);
          margin-top: 16px;
        }

        .battle-card {
          border-radius: 26px;
          padding: clamp(40px, 4.2vw, 54px);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          box-shadow: 0 16px 40px rgba(24, 34, 31, 0.04);
        }

        .battle-card.old-way {
          background: #f3f5f0;
          border: 1px solid #e1e7dc;
        }

        @keyframes rotateBorderBeam {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .battle-card.tanka-way {
          background: #141f1a;
          color: #eff5ec;
          border: 1px solid rgba(200, 240, 100, 0.35);
          position: relative;
          box-shadow: 0 30px 75px -15px rgba(20, 31, 26, 0.45);
        }

        .battle-card.tanka-way .battle-title {
          color: #ffffff;
          font-size: clamp(23px, 2.3vw, 27px);
        }

        .battle-card.tanka-way .battle-desc {
          color: #b5c4bd;
          font-size: 15px;
        }

        .battle-card.tanka-way .battle-item {
          color: #f0f5ee;
          font-size: 15px;
        }

        .battle-header-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11.5px;
          font-weight: 800;
          padding: 4px 10px;
          border-radius: 999px;
          margin-bottom: 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .battle-header-pill.old {
          background: #fee2e2;
          color: #991b1b;
        }

        .battle-header-pill.tanka {
          background: #c8f064;
          color: #18221f;
          font-weight: 800;
        }

        .battle-title {
          font-size: 23px;
          font-weight: 800;
          color: #18221f;
          margin-bottom: 8px;
          line-height: 1.25;
        }

        .battle-desc {
          font-size: 14.5px;
          line-height: 1.6;
          color: #55635e;
          margin-bottom: 26px;
        }

        .battle-list {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .battle-item {
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
          gap: clamp(24px, 3vw, 36px);
        }

        .persona-card {
          background: #ffffff;
          border: 1px solid rgba(226, 232, 223, 0.85);
          border-radius: 24px;
          padding: clamp(32px, 3.2vw, 42px);
          box-shadow: 0 16px 42px -10px rgba(24, 34, 31, 0.05);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          transition: transform 0.25s ease, border-color 0.25s ease;
        }

        .persona-card:hover {
          transform: translateY(-4px);
          border-color: #8da868;
        }

        /* Stepper */
        .stepper-tabs {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 32px;
        }

        .stepper-tab {
          background: #ffffff;
          border: 1px solid rgba(226, 232, 223, 0.85);
          border-radius: 16px;
          padding: 20px;
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
          box-shadow: 0 8px 24px rgba(24, 34, 31, 0.14);
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
          font-size: 14.5px;
          font-weight: 700;
          color: #18221f;
          line-height: 1.3;
        }

        .stepper-tab.active .stepper-tab-title {
          color: #eff5ec;
        }

        .stepper-card {
          background: #ffffff;
          border: 1px solid rgba(226, 232, 223, 0.85);
          border-radius: 26px;
          padding: clamp(40px, 4.2vw, 54px);
          box-shadow: 0 20px 50px -12px rgba(24, 34, 31, 0.06);
          display: grid;
          grid-template-columns: 1.15fr 1fr;
          gap: clamp(36px, 4vw, 56px);
          align-items: center;
        }

        /* Banner CTA */
        .landing-cta-banner {
          background: #101915;
          color: #eff5ec;
          border-radius: 32px;
          padding: clamp(80px, 10vh, 120px) clamp(24px, 5vw, 64px);
          text-align: center;
          margin: clamp(70px, 9vh, 110px) auto clamp(90px, 11vh, 130px);
          max-width: 1440px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 32px 80px -12px rgba(16, 25, 21, 0.45);
        }

        /* Footer */
        .landing-footer {
          border-top: 1px solid #e2e8df;
          background: #f6f8f3;
          padding: clamp(64px, 8vh, 88px) 0 clamp(48px, 6vh, 64px);
        }

        .landing-footer-inner {
          max-width: 1440px;
          margin: 0 auto;
          padding-left: clamp(24px, 4.5vw, 64px);
          padding-right: clamp(24px, 4.5vw, 64px);
          display: flex;
          flex-direction: column;
          gap: 48px;
        }

        /* Responsive Adjustments */
        @media (max-width: 860px) {
          .landing-nav-links {
            display: none;
          }
          .hero-split-grid {
            grid-template-columns: 1fr;
            gap: 36px;
          }
          .feature-hero-split,
          .feature-dual-grid,
          .feature-dual-asym {
            grid-template-columns: 1fr;
            gap: 28px;
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
          .comparison-dual-grid {
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
            <a href="#tanya-nara" className="landing-nav-link">Tanya Nara</a>
            <a href="#keunggulan" className="landing-nav-link">Keunggulan</a>
            <a href="#perbandingan" className="landing-nav-link">Bandingkan</a>
            <a href="#alur" className="landing-nav-link">Cara Kerja</a>
            <a href="#testimoni" className="landing-nav-link">Cerita Mereka</a>
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

      {/* ========================================================
          HERO SECTION: ASYMMETRIC SPLIT (Kiri Teks Tegas, Kanan Simulator Hidup)
          ======================================================== */}
      <section className="landing-hero-asymmetric">
        <div className="hero-split-grid">
          {/* Kolom Kiri: Headline & Value Proposition Rata Kiri */}
          <div className="hero-split-left">
            <div className="hero-kicker-wrap">
              <span className="hero-kicker-dot" />
              <span>Belajar Mandiri Lebih Tenang & Tuntas</span>
            </div>

            <h1 className="hero-title-left">
              Gak ada lagi cerita mentok belajar sendirian.
              <span className="hero-title-highlight">
                Pecah materi tersulit jadi bab santai 3 menit.
              </span>
            </h1>

            <p className="hero-subtitle-left">
              Punya file PDF setebal skripsi atau video materi YouTube 2 jam yang bikin ngantuk? Cukup masukkan ke Tanka. Materi langsung diringkas per topik, rumus KaTeX diterjemahkan jelas, dan kamu didampingi Nara — tutor AI yang sabar menjelaskan sampai tuntas.
            </p>

            <div className="hero-cta-left">
              <button className="hero-btn-main" onClick={onLaunchApp}>
                <span>Mulai Belajar Sekarang — Gratis</span>
                <ArrowRight size={17} />
              </button>
              <a
                href="https://github.com/kaarlyz/Tanka"
                target="_blank"
                rel="noopener noreferrer"
                className="hero-btn-sub"
              >
                <Star size={16} color="#eab308" fill="#eab308" />
                <span>Lihat di GitHub</span>
              </a>
            </div>

            <div className="hero-trust-row">
              <div className="hero-trust-item">
                <CheckCircle2 size={15} color="#4b6623" />
                <span>100% Bebas Iklan</span>
              </div>
              <div className="hero-trust-item">
                <CheckCircle2 size={15} color="#4b6623" />
                <span>Bisa Offline & Hemat Kuota</span>
              </div>
            </div>
          </div>

          {/* Kolom Kanan: Simulator Chat Nara AI yang Hidup */}
          <div className="hero-split-right" id="tanya-nara">
            <div className="hero-simulator-card">
              <div className="simulator-header">
                <div className="simulator-title-left">
                  <Bot size={17} color="#4b6623" />
                  <span>Coba Tanya Nara Sekarang</span>
                </div>
                <div className="simulator-badge">
                  <Zap size={11} color="#4b6623" />
                  <span>Tutor Pribadi Siap Sedia</span>
                </div>
              </div>

              <div className="simulator-chip-selector">
                <span style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: "#60706a", marginRight: 4, textTransform: "uppercase" }}>
                  PILIH CONTOH:
                </span>
                {heroQuestions.map((item, idx) => (
                  <button
                    key={idx}
                    className={`sim-chip ${activeHeroQ === idx ? "active" : ""}`}
                    onClick={() => handleSelectHeroQuestion(idx)}
                  >
                    <Sparkles size={12} />
                    <span>{item.chip}</span>
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
                    <span style={{ fontSize: 12.5, color: "#60706a", marginLeft: 8 }}>Nara sedang menerangkan konsep...</span>
                  </div>
                ) : (
                  <div className="sim-bubble-ai">
                    <MathView text={heroQuestions[activeHeroQ].answer} />
                  </div>
                )}
              </div>

              {/* Clean Single Input Bar */}
              <div className="simulator-input-seamless">
                <div className="sim-input-shell">
                  <BookOpen size={16} color="#798782" />
                  <input
                    type="text"
                    placeholder="Ketik topik atau rumus yang bikin kamu bingung..."
                    value={heroPromptInput}
                    onChange={(e) => setHeroPromptInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") onLaunchApp();
                    }}
                    className="clean-input sim-input-field"
                    style={{
                      border: "none",
                      background: "transparent",
                      outline: "none",
                      boxShadow: "none"
                    }}
                  />
                </div>
                <button className="sim-input-submit-btn" onClick={onLaunchApp}>
                  <span>Tanya Nara</span>
                  <Send size={13} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          RITME TENGAH: FULL-WIDTH 3D MOCKUP & SATELLITE BADGES
          ======================================================== */}
      <div className="mockup-break-section">
        <div className="hero-mockup-container reveal-scroll delay-2">
          {/* Floating Badges */}
          <div className="hero-float-badge float-top-left">
            <span className="float-badge-icon">✨</span>
            <div className="float-badge-text">
              <strong>Bab Santai 3 Menit</strong>
              <small>Otomatis dipotong ringkas</small>
            </div>
          </div>

          <div className="hero-float-badge float-top-right">
            <span className="float-badge-icon">⚡</span>
            <div className="float-badge-text">
              <strong>Nara AI Siaga 24 Jam</strong>
              <small>Tanya rumus tanpa batas</small>
            </div>
          </div>

          <div className="hero-float-badge float-mid-left">
            <span className="float-badge-icon">🛡️</span>
            <div className="float-badge-text">
              <strong>Bisa Dibuka Offline</strong>
              <small>Data tersimpan di perangkat</small>
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

      {/* Animated Marquee Ticker */}
      <div className="landing-marquee-wrapper reveal-scroll">
        <div className="landing-marquee-track">
          {[...Array(2)].map((_, trackIdx) => (
            <div className="landing-marquee-content" key={trackIdx}>
              <span>✨ 100% BEBAS IKLAN</span>
              <span className="marquee-dot">•</span>
              <span>⚡ TANYA RUMUS SEPUASNYA</span>
              <span className="marquee-dot">•</span>
              <span>📚 RANGKUM OTOMATIS VIDEO YOUTUBE</span>
              <span className="marquee-dot">•</span>
              <span>🎯 KUIS PINTAR 1 KARTU 1 FAKTA</span>
              <span className="marquee-dot">•</span>
              <span>📱 RINGAN DI SEMUA HP</span>
              <span className="marquee-dot">•</span>
              <span>🛡️ DATA PRIVAT TERSIMPAN LOKAL</span>
              <span className="marquee-dot">•</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bento Grid Showcase Section (Rhythm Header Kiri) */}
      <section id="keunggulan" className="landing-section">
        <div className="section-header-left reveal-scroll">
          <span className="section-kicker">MENGAPA TANKA BERBEDA</span>
          <h2 className="section-title">Dibuat Buat Kamu yang Mau Paham, Bukan Cuma Menghafal</h2>
          <p className="section-desc">
            Tinggalkan metode belajar yang bertele-tele dan penuh iklan. Tanka mendampingimu menguasai konsep inti materi langkah demi langkah.
          </p>
        </div>

        <div className="features-flow-wrapper">
          {/* Track 1: Master Spotlight Card (Tutor Nara AI 2-Kolom) */}
          <div className="feature-hero-card reveal-scroll">
            <div className="feature-hero-split">
              <div>
                <span className="feature-eyebrow">
                  <Bot size={14} color="#4b6623" />
                  <span>01 // TUTOR PRIBADI 24 JAM</span>
                </span>
                <h3 className="feature-headline">Tanya Rumus & Konsep Sepuasnya Tanpa Rasa Malu</h3>
                <p className="feature-lead">
                  Sering segan bertanya di kelas karena takut dikira gak nyimak? Di sini kamu bebas menanyakan konsep serumit apapun. Nara menjelaskan memakai analogi sehari-hari sampai kamu benar-benar paham.
                </p>
                <div className="feature-checklist">
                  <div className="feature-check-item">
                    <CheckCircle2 size={17} color="#4b6623" />
                    <span>Analogi sederhana dari kejadian sehari-hari</span>
                  </div>
                  <div className="feature-check-item">
                    <CheckCircle2 size={17} color="#4b6623" />
                    <span>Penurunan rumus KaTeX langkah demi langkah</span>
                  </div>
                  <div className="feature-check-item">
                    <CheckCircle2 size={17} color="#4b6623" />
                    <span>Respon sabar dan siap mendampingi 24 jam</span>
                  </div>
                </div>
              </div>

              <div className="mini-device-frame">
                <div className="mini-device-header">
                  <span className="mini-device-dot" />
                  <span className="mini-device-dot" />
                  <span className="mini-device-dot" />
                  <span style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: "#60706a", marginLeft: 6 }}>
                    tanya-nara.ai • tutor pribadi
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

          {/* Track 2: The Interactive Playground Duo (Kuis Cerdas & YouTube) */}
          <div className="feature-dual-grid">
            {/* Card A: Kuis Cerdas */}
            <div className="feature-card-item reveal-scroll delay-1">
              <div>
                <span className="feature-eyebrow">
                  <Sparkles size={13} color="#4b6623" />
                  <span>02 // LATIHAN TERARAH</span>
                </span>
                <h3 className="feature-headline" style={{ fontSize: "clamp(1.5rem, 2vw, 1.85rem)" }}>
                  Kuis Cerdas: Uji Logika & Catat Bank Salah
                </h3>
                <p className="feature-lead" style={{ marginBottom: 14 }}>
                  Coba langsung kuis interaktif di bawah. Soal dirancang untuk menguji pemahaman intimu tanpa jebakan ngawur:
                </p>

                {/* Seamless Interactive Quiz */}
                <div className="seamless-interactive-area">
                  <div className="quiz-prompt-text">
                    <MathView text="Jika himpunan $A = \{2, 4, 6\}$ dan $B = \{4, 6, 8\}$, maka anggota $A \cap B$ adalah..." />
                  </div>

                  <div>
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
                        <strong>✓ Jawaban Benar!</strong> Irisan adalah angka yang ada di kedua himpunan ($4$ dan $6$).
                      </div>
                    </div>
                  )}

                  {(quizSelected === "A" || quizSelected === "C") && (
                    <div className="quiz-feedback-banner wrong">
                      <X size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                      <div>
                        {quizSelected === "A"
                          ? "Kurang pas. Angka 2 tidak ada di B, dan angka 8 tidak ada di A. Irisan cuma mengambil yang sama di dua-duanya."
                          : "Kurang pas. Itu hasil gabungan (A ∪ B), bukan irisan (A ∩ B)."}
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
                            fontSize: 12,
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

              <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#4b6623", background: "rgba(200, 240, 100, 0.22)", padding: "4px 10px", borderRadius: 6 }}>
                  ✓ Otomatis Catat Bank Salah
                </span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#60706a", background: "#f2f5ef", padding: "4px 10px", borderRadius: 6 }}>
                  Penjelasan Step-by-Step
                </span>
              </div>
            </div>

            {/* Card B: YouTube Summarizer */}
            <div className="feature-card-item reveal-scroll delay-2">
              <div>
                <span className="feature-eyebrow">
                  <Zap size={13} color="#4b6623" />
                  <span>03 // RANGKUM CEPAT</span>
                </span>
                <h3 className="feature-headline" style={{ fontSize: "clamp(1.5rem, 2vw, 1.85rem)" }}>
                  Video 2 Jam Dipotong Jadi Modul 3 Menit
                </h3>
                <p className="feature-lead" style={{ marginBottom: 14 }}>
                  Cukup tempel tautan video kuliah atau materi YouTube. Tanka otomatis merapikannya menjadi modul bab siap baca:
                </p>

                {/* Seamless YouTube Input & Simulator */}
                <div className="seamless-interactive-area">
                  <div className="yt-input-row">
                    <input
                      type="text"
                      value={ytUrlInput}
                      onChange={(e) => setYtUrlInput(e.target.value)}
                      className="yt-input-field"
                      placeholder="Tempel link video YouTube..."
                    />
                    <button className="yt-action-btn" onClick={handleSimulateYt}>
                      {isYtProcessing ? "Merangkum..." : "Simulasikan"}
                    </button>
                  </div>

                  {isYtProcessing && (
                    <div className="yt-progress-bar-bg">
                      <div className="yt-progress-bar-fill" style={{ width: "70%" }} />
                    </div>
                  )}

                  {ytProcessed && !isYtProcessing && (
                    <div style={{ marginTop: 12 }}>
                      <div className="yt-chapter-pill">
                        <span>Bab 1: Konsep Dasar Limit & Gradien</span>
                        <span style={{ fontSize: 11, color: "#4b6623", fontWeight: 700 }}>2 mnt baca</span>
                      </div>
                      <div className="yt-chapter-pill">
                        <span>Bab 2: Turunan Fungsi Aljabar</span>
                        <span style={{ fontSize: 11, color: "#4b6623", fontWeight: 700 }}>3 mnt baca</span>
                      </div>
                      <div className="yt-chapter-pill">
                        <span>Bab 3: Aturan Rantai & Nilai Maksimum</span>
                        <span style={{ fontSize: 11, color: "#4b6623", fontWeight: 700 }}>4 mnt baca</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#4b6623", background: "rgba(200, 240, 100, 0.22)", padding: "4px 10px", borderRadius: 6 }}>
                  ✓ Ekstraksi Bab Otomatis
                </span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#60706a", background: "#f2f5ef", padding: "4px 10px", borderRadius: 6 }}>
                  Transkrip & Rumus Rapi
                </span>
              </div>
            </div>
          </div>

          {/* Track 3: The Knowledge Freedom Duo (Peta Konsep & Offline) */}
          <div className="feature-dual-asym">
            {/* Card C: Peta Konsep */}
            <div className="feature-card-item reveal-scroll delay-1">
              <div>
                <span className="feature-eyebrow">
                  <Lock size={13} color="#4b6623" />
                  <span>04 // PETA BESAR MATERI</span>
                </span>
                <h3 className="feature-headline" style={{ fontSize: "clamp(1.5rem, 2vw, 1.85rem)" }}>
                  Petakan Hubungan Antar-Konsep Sebelum Ujian
                </h3>
                <p className="feature-lead" style={{ marginBottom: 14 }}>
                  Lihat keterkaitan materi secara menyeluruh agar tidak ada mata rantai ilmu yang bolong. Klik salah satu simpul untuk melihat hubungannya:
                </p>

                {/* Seamless SVG Graph */}
                <div style={{ background: "#f8faf5", borderRadius: 14, padding: 14, marginTop: 12, textAlign: "center" }}>
                  <svg width="100%" height="150" viewBox="0 0 320 150">
                    <path d="M 160 75 Q 110 35 60 40" stroke="#8da868" strokeWidth="2" fill="none" className="graph-link-pulse" />
                    <path d="M 160 75 Q 210 35 260 40" stroke="#8da868" strokeWidth="2" fill="none" className="graph-link-pulse" />
                    <path d="M 160 75 Q 110 115 60 115" stroke="#8da868" strokeWidth="2" fill="none" className="graph-link-pulse" />
                    <path d="M 160 75 Q 210 115 260 115" stroke="#8da868" strokeWidth="2" fill="none" className="graph-link-pulse" />

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

                    <g className="graph-node" onClick={() => setActiveGraphNode("Kalkulus Dasar")}>
                      <circle cx="160" cy="75" r="22" fill="#18221f" stroke="#c8f064" strokeWidth="2.5" />
                      <text x="160" y="79" fontSize="10" textAnchor="middle" fill="#c8f064" fontWeight="800">Kalkulus</text>
                    </g>
                  </svg>

                  <div style={{ marginTop: 8, fontSize: 12.5, color: "#18221f" }}>
                    Konsep Terpilih: <strong>{activeGraphNode}</strong>
                    <span style={{ display: "block", color: "#60706a", fontSize: 11.5, marginTop: 3 }}>
                      {activeGraphNode === "Kalkulus Dasar" && "Pusat fondasi aljabar menghubungkan materi limit, turunan, dan integral."}
                      {activeGraphNode === "Limit Aljabar" && "Syarat utama sebelum bisa memahami rumus turunan dan gradien garis."}
                      {activeGraphNode === "Turunan Fungsi" && "Kunci menyelesaikan soal laju perubahan dan mencari nilai maksimum."}
                      {activeGraphNode === "Integral Riemann" && "Operasi kebalikan turunan untuk menghitung total akumulasi dan luas daerah."}
                      {activeGraphNode === "Optimasi Nilai" && "Aplikasi praktis turunan pertama bernilai nol untuk mencari titik puncak."}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#4b6623", background: "rgba(200, 240, 100, 0.22)", padding: "4px 10px", borderRadius: 6 }}>
                  ✓ Peta Visual Lengkap
                </span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#60706a", background: "#f2f5ef", padding: "4px 10px", borderRadius: 6 }}>
                  Ingatan Jangka Panjang
                </span>
              </div>
            </div>

            {/* Card D: Mode Offline */}
            <div className="feature-card-item reveal-scroll delay-2">
              <div>
                <span className="feature-eyebrow">
                  <WifiOff size={13} color="#4b6623" />
                  <span>05 // HEMAT & MANDIRI</span>
                </span>
                <h3 className="feature-headline" style={{ fontSize: "clamp(1.5rem, 2vw, 1.85rem)" }}>
                  Tetap Bisa Belajar Walau Kuota Habis
                </h3>
                <p className="feature-lead" style={{ marginBottom: 14 }}>
                  Semua materi dan catatanmu tersimpan di HP/laptopmu sendiri. Bebas dibuka di mana saja tanpa pusing sinyal internet putus-nyambung:
                </p>

                {/* Seamless Offline Switch */}
                <div className="seamless-interactive-area">
                  <button
                    className={`offline-toggle-btn ${isOfflineMode ? "offline-active" : ""}`}
                    onClick={() => setIsOfflineMode(!isOfflineMode)}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {isOfflineMode ? <WifiOff size={16} color="#c8f064" /> : <Wifi size={16} color="#18221f" />}
                      <span>{isOfflineMode ? "Mode Offline / Tanpa Internet Aktif" : "Mode Online"}</span>
                    </div>
                    <span style={{ fontSize: 11, fontFamily: "'DM Mono', monospace" }}>
                      [Coba Klik]
                    </span>
                  </button>

                  <div style={{ marginTop: 14, fontSize: 13, lineHeight: 1.55, color: "#45544e" }}>
                    {isOfflineMode ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <CheckCircle2 size={16} color="#4b6623" />
                        <span>Semua modul tetap terbuka lancar tanpa kuota internet di kafe atau perpustakaan.</span>
                      </div>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Zap size={16} color="#18221f" />
                        <span>Data otomatis tersimpan di perangkatmu. Coba klik tombol di atas untuk simulasi buka offline.</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#4b6623", background: "rgba(200, 240, 100, 0.22)", padding: "4px 10px", borderRadius: 6 }}>
                  ✓ 100% Bebas Iklan
                </span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#60706a", background: "#f2f5ef", padding: "4px 10px", borderRadius: 6 }}>
                  Data Privat di Perangkat
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

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

      {/* Social Proof: 3 Student Personas (Rhythm Header Center) */}
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
          <div className="persona-card reveal-scroll">
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
          </div>

          {/* Persona 2: Nadia */}
          <div className="persona-card reveal-scroll delay-1">
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
          </div>

          {/* Persona 3: Rian */}
          <div className="persona-card reveal-scroll delay-2">
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
          </div>
        </div>
      </section>

      {/* Feature Stepper Section (Rhythm Header Kiri) */}
      <section id="alur" className="landing-section">
        <div className="section-header-left reveal-scroll">
          <span className="section-kicker">CARA KERJA</span>
          <h2 className="section-title">4 Langkah Menguasai Materi Apapun</h2>
          <p className="section-desc">
            Empat langkah mudah untuk memecah materi sulit menjadi unit belajar yang siap kamu kuasai.
          </p>
        </div>

        {/* Stepper Tabs */}
        <div className="stepper-tabs reveal-scroll">
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
        <div className="stepper-card reveal-scroll delay-1">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <span
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#18221f",
                  background: "#c8f064",
                  padding: "4px 10px",
                  borderRadius: 6
                }}
              >
                LANGKAH {steps[activeStep].num}
              </span>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#60706a" }}>
                {steps[activeStep].tag}
              </span>
            </div>

            <h3 style={{ fontSize: 24, fontWeight: 800, color: "#18221f", marginBottom: 14 }}>
              {steps[activeStep].title}
            </h3>

            <p style={{ fontSize: 15, lineHeight: 1.68, color: "#55635e", marginBottom: 24 }}>
              {steps[activeStep].detail}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {steps[activeStep].chips.map((c, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#18221f", fontWeight: 600 }}>
                  <CheckCircle2 size={16} color="#4b6623" />
                  <span>{c}</span>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              background: "#18221f",
              color: "#eff5ec",
              borderRadius: 16,
              padding: 30,
              border: "1px solid #283832",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11.5, color: "#c8f064", letterSpacing: "0.06em", fontWeight: 700 }}>
                METODE TERARAH
              </span>
              <Zap size={15} color="#c8f064" />
            </div>
            <p style={{ fontSize: 14.5, lineHeight: 1.65, color: "#d5dfd9", marginBottom: 22 }}>
              "{steps[activeStep].summary}"
            </p>
            <button
              onClick={onLaunchApp}
              style={{
                width: "100%",
                background: "#c8f064",
                color: "#18221f",
                border: "none",
                borderRadius: 10,
                padding: "12px 18px",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                transition: "background 0.15s ease"
              }}
            >
              <span>Coba Mulai Belajar</span>
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </section>

      {/* Call to Action Banner (Full-Width Finale) */}
      <div className="landing-cta-banner reveal-scroll">
        <h2 style={{ fontSize: "clamp(1.9rem, 4.2vw, 3rem)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 16, color: "#ffffff" }}>
          Siap Paham Materi Lebih Cepat dan Tenang?
        </h2>
        <p style={{ fontSize: 16.5, color: "#b5c2bc", maxWidth: 660, margin: "0 auto 34px", lineHeight: 1.65 }}>
          Buka materi pertamamu sekarang. 100% bebas biaya, tanpa iklan mengganggu, dan catatan belajarmu tersimpan aman di perangkatmu.
        </p>
        <button
          onClick={onLaunchApp}
          style={{
            background: "#c8f064",
            color: "#18221f",
            border: "none",
            borderRadius: 12,
            padding: "16px 38px",
            fontSize: 16,
            fontWeight: 800,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            boxShadow: "0 8px 26px rgba(200, 240, 100, 0.35)",
            transition: "transform 0.2s ease"
          }}
        >
          <span>Mulai Belajar Sekarang — Gratis</span>
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
              <p style={{ fontSize: 14, lineHeight: 1.65, color: "#55635e" }}>
                Tanka — Teman Belajar Mandiri Cerdas untuk Siswa SMA, Pejuang Ujian & Mahasiswa.
              </p>
            </div>

            <div style={{ display: "flex", gap: 54, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11.5, fontWeight: 700, color: "#18221f", marginBottom: 14, letterSpacing: "0.06em" }}>
                  KONTRIBUTOR & KODE
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <a
                    href="https://github.com/kaarlyz/Tanka"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 13.5, color: "#55635e", textDecoration: "none" }}
                  >
                    GitHub Repository
                  </a>
                  <a
                    href="https://github.com/kaarlyz/Tanka/blob/main/LICENSE"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 13.5, color: "#55635e", textDecoration: "none" }}
                  >
                    MIT License
                  </a>
                </div>
              </div>

              <div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11.5, fontWeight: 700, color: "#18221f", marginBottom: 14, letterSpacing: "0.06em" }}>
                  PRIVASI & KEAMANAN
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <span style={{ fontSize: 13.5, color: "#55635e" }}>
                    Data Privat di Perangkat
                  </span>
                  <span style={{ fontSize: 13.5, color: "#55635e" }}>
                    Kuis Logika Tanpa Halusinasi
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <span>© 2026 Tanka by kaarlyz. Dibuat dengan integritas tinggi.</span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12.5 }}>
              Belajar Mandiri • Bebas Iklan • 100% Privat
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
