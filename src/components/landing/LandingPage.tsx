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
      chip: "Kenapa Rumus Pythagoras Berlaku?",
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
        threshold: 0.1,
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
          top: 80px;
          left: 50%;
          transform: translateX(-50%);
          width: 760px;
          height: 440px;
          background: radial-gradient(ellipse at center, rgba(200, 240, 100, 0.26) 0%, rgba(75, 102, 35, 0.1) 50%, transparent 75%);
          filter: blur(75px);
          pointer-events: none;
          z-index: 0;
          animation: orbDrift 9s ease-in-out infinite alternate;
        }

        .landing-ambient-orb-2 {
          position: absolute;
          top: 1400px;
          right: 2%;
          width: 660px;
          height: 420px;
          background: radial-gradient(ellipse at center, rgba(168, 196, 138, 0.22) 0%, rgba(24, 34, 31, 0.06) 55%, transparent 75%);
          filter: blur(85px);
          pointer-events: none;
          z-index: 0;
          animation: orbDriftReverse 11s ease-in-out infinite alternate;
        }

        @keyframes orbDrift {
          0% { transform: translateX(-50%) translateY(0) scale(1); }
          100% { transform: translateX(-47%) translateY(34px) scale(1.1); }
        }

        @keyframes orbDriftReverse {
          0% { transform: translateY(0) scale(1); }
          100% { transform: translateY(-38px) scale(1.08); }
        }

        /* Dynamic Scroll Reveal */
        .reveal-scroll {
          opacity: 0;
          transform: translateY(34px);
          transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
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
          max-width: 1200px;
          margin: 0 auto;
          padding: 14px 24px;
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

        /* Hero Section */
        .landing-hero {
          position: relative;
          z-index: 1;
          max-width: 1200px;
          margin: 0 auto;
          padding: 60px 24px 70px;
          text-align: center;
        }

        /* Borderless Ambient Kicker */
        .hero-kicker-wrap {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 16px;
          border-radius: 999px;
          background: rgba(200, 240, 100, 0.22);
          color: #273e1c;
          font-size: 12.5px;
          font-weight: 700;
          letter-spacing: 0.03em;
          margin-bottom: 24px;
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

        .hero-title {
          font-size: clamp(2.3rem, 5.4vw, 4rem);
          font-weight: 800;
          line-height: 1.14;
          letter-spacing: -0.035em;
          color: #18221f;
          max-width: 920px;
          margin: 0 auto 18px;
        }

        .hero-title-highlight {
          display: block;
          color: #4b6623;
          margin-top: 8px;
          letter-spacing: -0.025em;
          background: linear-gradient(135deg, #18221f 20%, #4b6623 85%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hero-subtitle {
          font-size: clamp(1.05rem, 2.1vw, 1.2rem);
          line-height: 1.68;
          color: #55635e;
          max-width: 760px;
          margin: 0 auto 34px;
        }

        .hero-cta-group {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 42px;
        }

        .hero-btn-main {
          background: #18221f;
          color: #c8f064;
          border: 1px solid #18221f;
          padding: 15px 32px;
          border-radius: 12px;
          font-size: 15.5px;
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
          padding: 15px 26px;
          border-radius: 12px;
          font-size: 15px;
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

        /* Hero Live Simulator */
        .hero-simulator-wrapper {
          max-width: 840px;
          margin: 0 auto 54px;
          text-align: left;
        }

        .hero-simulator-card {
          background: #ffffff;
          border: 1px solid #dce3d8;
          border-radius: 18px;
          box-shadow: 0 20px 50px -12px rgba(24, 34, 31, 0.09), 0 0 0 1px rgba(24, 34, 31, 0.02);
          overflow: hidden;
          transition: border-color 0.25s ease, box-shadow 0.25s ease;
        }

        .hero-simulator-card:hover {
          border-color: #8da868;
          box-shadow: 0 24px 60px -12px rgba(24, 34, 31, 0.13);
        }

        .simulator-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 20px;
          background: #f6f8f4;
          border-bottom: 1px solid #e2e8df;
        }

        .simulator-title-left {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 700;
          color: #18221f;
        }

        .simulator-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11.5px;
          font-weight: 600;
          color: #273e1c;
          background: rgba(200, 240, 100, 0.25);
          padding: 4px 10px;
          border-radius: 999px;
        }

        .simulator-chip-selector {
          padding: 14px 20px 8px;
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
          padding: 8px 14px;
          border-radius: 10px;
          background: #f3f6f0;
          border: 1px solid #dfe5da;
          font-size: 13px;
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
          padding: 20px 22px;
          min-height: 160px;
          display: flex;
          flex-direction: column;
          gap: 16px;
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
          padding: 11px 18px;
          border-radius: 14px 14px 2px 14px;
          font-size: 14px;
          max-width: 85%;
          line-height: 1.5;
          font-weight: 500;
          animation: bubblePop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }

        .sim-bubble-ai {
          align-self: flex-start;
          background: #f8faf6;
          border: 1px solid #e2e8df;
          color: #18221f;
          padding: 16px 20px;
          border-radius: 14px 14px 14px 2px;
          font-size: 14px;
          line-height: 1.65;
          max-width: 94%;
          box-shadow: 0 4px 14px rgba(24, 34, 31, 0.03);
          animation: bubblePop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }

        .sim-typing-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 12px 16px;
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

        /* Seamless Single-Border Input Bar (No Box Inside A Box) */
        .simulator-input-seamless {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 18px 16px;
          background: #ffffff;
          border-top: 1px solid #eef2eb;
        }

        .sim-input-shell {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 10px;
          background: #f4f7f1;
          border-radius: 12px;
          padding: 10px 14px;
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
          font-size: 13.5px !important;
          color: #18221f !important;
          font-family: inherit !important;
        }

        .sim-input-submit-btn {
          background: #c8f064 !important;
          color: #18221f !important;
          border: 1px solid #b2dc4a !important;
          padding: 10px 20px;
          border-radius: 10px;
          font-size: 13.5px;
          font-weight: 800;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          transition: all 0.15s ease;
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(75, 102, 35, 0.15);
        }

        .sim-input-submit-btn:hover {
          background: #d4f87c !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(75, 102, 35, 0.22);
        }

        /* Hero Device Mockup Container & 3D Floating Satellite Badges */
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
        }

        /* Mockup Window with Pronounced 3D Perspective Tilt */
        .mockup-window {
          border-radius: 18px;
          border: 1px solid #dce2da;
          background: #ffffff;
          box-shadow: 0 40px 100px -20px rgba(24, 34, 31, 0.28), 0 0 0 1px rgba(24, 34, 31, 0.04);
          overflow: hidden;
          transform: rotateX(12deg) rotateY(-3deg) scale(0.97);
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
          padding: 32px 0 12px;
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
          width: 100px;
          z-index: 2;
          pointer-events: none;
        }

        .landing-marquee-wrapper::before {
          left: 0;
          background: linear-gradient(to right, #fbfdf9 20%, transparent);
        }

        .landing-marquee-wrapper::after {
          right: 0;
          background: linear-gradient(to left, #fbfdf9 20%, transparent);
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
          max-width: 1200px;
          margin: 0 auto;
          padding: 90px 24px;
        }

        .section-header {
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

        /* Bento Grid with Cursor Spotlight */
        .bento-grid-wrapper {
          position: relative;
          border-radius: 24px;
          overflow: hidden;
          padding: 8px;
        }

        .bento-spotlight-layer {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          transition: background 0.08s ease;
        }

        .bento-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 26px;
          position: relative;
          z-index: 1;
        }

        .bento-card {
          position: relative;
          background: #ffffff;
          border: 1px solid #e2e8df;
          border-radius: 18px;
          padding: 34px;
          box-shadow: 0 8px 30px rgba(24, 34, 31, 0.04);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          overflow: hidden;
          transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.28s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.25s ease;
        }

        @media (hover: hover) and (pointer: fine) {
          .bento-card:hover {
            transform: translateY(-5px);
            border-color: #8da868 !important;
            box-shadow: 0 22px 48px rgba(24, 34, 31, 0.1) !important;
          }
        }

        .bento-span-2 {
          grid-column: span 2;
        }

        .bento-label {
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.12em;
          color: #4b6623;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .bento-title {
          font-size: 22px;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: #18221f;
          margin-bottom: 12px;
          line-height: 1.3;
        }

        .bento-desc {
          font-size: 14.5px;
          line-height: 1.65;
          color: #55635e;
          margin-bottom: 22px;
        }

        .mini-device-frame {
          border-radius: 12px;
          border: 1px solid #e2e8df;
          background: #f7f9f5;
          overflow: hidden;
          box-shadow: 0 8px 24px rgba(24, 34, 31, 0.05);
        }

        .mini-device-header {
          height: 30px;
          background: #edf1e9;
          border-bottom: 1px solid #e2e8df;
          display: flex;
          align-items: center;
          padding: 0 12px;
          gap: 6px;
        }

        .mini-device-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #c2cbbd;
        }

        .bento-two-col {
          display: grid;
          grid-template-columns: 1.15fr 1.25fr;
          gap: 32px;
          align-items: center;
        }

        .chip-group {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 16px;
        }

        .metric-chip {
          font-size: 12px;
          font-weight: 600;
          background: #f2f6ee;
          color: #273e1c;
          padding: 6px 12px;
          border-radius: 8px;
          border: 1px solid #dce4d5;
        }

        /* Interactive Quiz Card Styles */
        .quiz-demo-box {
          background: #f7f9f4;
          border: 1px solid #dce3d6;
          border-radius: 14px;
          padding: 18px;
          margin-top: 12px;
        }

        .quiz-option-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 11px 16px;
          margin-top: 8px;
          border-radius: 10px;
          border: 1px solid #dce3d6;
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
          background: #fcfdfa;
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
          padding: 12px 14px;
          border-radius: 10px;
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

        /* YouTube Interactive Simulator */
        .yt-demo-box {
          background: #f8faf6;
          border: 1px solid #e2e8df;
          border-radius: 14px;
          padding: 16px;
          margin-top: 14px;
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
          padding: 9px 12px;
          font-size: 12.5px;
          font-family: 'DM Mono', monospace;
          color: #45544e;
          outline: none;
        }

        .yt-action-btn {
          background: #18221f;
          color: #c8f064;
          border: none;
          padding: 9px 16px;
          border-radius: 8px;
          font-size: 12.5px;
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
          margin-top: 12px;
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
          padding: 8px 12px;
          background: #ffffff;
          border: 1px solid #e2e8df;
          border-radius: 8px;
          margin-top: 7px;
          font-size: 12.5px;
          font-weight: 600;
          color: #18221f;
        }

        /* Moving Energy Flow in SVG Knowledge Graph */
        .radial-graph-wrapper {
          background: #f7f9f5;
          border: 1px solid #e2e8df;
          border-radius: 14px;
          padding: 14px;
          margin-top: 14px;
          text-align: center;
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

        /* Offline Toggle */
        .offline-toggle-container {
          background: #f7f9f5;
          border: 1px solid #dde3d8;
          border-radius: 14px;
          padding: 16px;
          margin-top: 14px;
        }

        .offline-toggle-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #ffffff;
          border: 1px solid #dce2da;
          padding: 11px 16px;
          border-radius: 10px;
          cursor: pointer;
          font-size: 13.5px;
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

        /* Side-By-Side Visual Battle Comparison with Rotating Glow Beam */
        .comparison-dual-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 28px;
          margin-top: 10px;
        }

        .battle-card {
          border-radius: 20px;
          padding: 38px 34px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 10px 32px rgba(24, 34, 31, 0.04);
        }

        .battle-card.old-way {
          background: #fcf6f3;
          border: 1px solid #f3d8cc;
        }

        @keyframes rotateBorderBeam {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .battle-card.tanka-way {
          background: #f4faee;
          border: 1.5px solid transparent;
          position: relative;
          box-shadow: 0 16px 44px rgba(75, 102, 35, 0.12);
        }

        .battle-card.tanka-way::before {
          content: "";
          position: absolute;
          inset: -1.5px;
          border-radius: 21px;
          background: linear-gradient(135deg, #c8f064, #4b6623, #c8f064, #7ca836);
          background-size: 300% 300%;
          animation: rotateBorderBeam 6s linear infinite;
          z-index: -1;
          opacity: 0.85;
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
          background: #18221f;
          color: #c8f064;
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
          gap: 24px;
        }

        .persona-card {
          background: #ffffff;
          border: 1px solid #e2e8df;
          border-radius: 18px;
          padding: 30px;
          box-shadow: 0 8px 24px rgba(24, 34, 31, 0.04);
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
          gap: 14px;
          margin-bottom: 28px;
        }

        .stepper-tab {
          background: #ffffff;
          border: 1px solid #e2e8df;
          border-radius: 14px;
          padding: 18px;
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
          font-size: 14px;
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
          border-radius: 18px;
          padding: 40px;
          box-shadow: 0 8px 30px rgba(24, 34, 31, 0.04);
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          align-items: center;
        }

        /* Banner CTA */
        .landing-cta-banner {
          background: #18221f;
          color: #eff5ec;
          border-radius: 24px;
          padding: 64px 40px;
          text-align: center;
          margin: 40px auto 90px;
          max-width: 1200px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 24px 60px -10px rgba(24, 34, 31, 0.32);
        }

        /* Footer */
        .landing-footer {
          border-top: 1px solid #e2e8df;
          background: #f6f8f3;
          padding: 60px 24px 48px;
        }

        .landing-footer-inner {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 40px;
        }

        .footer-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 32px;
        }

        .footer-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid #e2e8df;
          padding-top: 26px;
          font-size: 13.5px;
          color: #65746e;
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

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="reveal-scroll">
          <div className="hero-kicker-wrap">
            <span className="hero-kicker-dot" />
            <span>Belajar Mandiri Lebih Tenang & Tuntas</span>
          </div>
        </div>

        <h1 className="hero-title reveal-scroll delay-1">
          Gak ada lagi cerita mentok belajar sendirian.
          <span className="hero-title-highlight">
            Pecah materi tersulit jadi bab santai 3 menit.
          </span>
        </h1>

        <p className="hero-subtitle reveal-scroll delay-2">
          Punya file PDF setebal skripsi atau video materi YouTube 2 jam yang bikin ngantuk? Cukup masukkan ke Tanka. Materi langsung diringkas per topik, rumus KaTeX diterjemahkan jelas, dan kamu didampingi Nara — tutor AI yang sabar menjelaskan sampai tuntas.
        </p>

        <div className="hero-cta-group reveal-scroll delay-3">
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
            <span>Lihat Repositori GitHub</span>
          </a>
        </div>

        {/* Live Interactive Nara AI Simulator in Hero */}
        <div className="hero-simulator-wrapper reveal-scroll" id="tanya-nara">
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
              <span style={{ fontSize: 11.5, fontFamily: "'DM Mono', monospace", color: "#60706a", marginRight: 4, textTransform: "uppercase" }}>
                Pilih Contoh:
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

            {/* Clean Single Input Bar (No Box Inside A Box) */}
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

        {/* Hero Device Mockup Container with 3D Floating Satellite Badges */}
        <div className="hero-mockup-container reveal-scroll">
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
      </section>

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

      {/* Bento Grid Showcase Section */}
      <section id="keunggulan" className="landing-section">
        <div className="section-header reveal-scroll">
          <span className="section-kicker">MENGAPA TANKA BERBEDA</span>
          <h2 className="section-title">Dibuat Buat Kamu yang Mau Paham, Bukan Cuma Menghafal</h2>
          <p className="section-desc">
            Tinggalkan metode belajar yang bertele-tele dan penuh iklan. Tanka mendampingimu menguasai konsep inti materi langkah demi langkah.
          </p>
        </div>

        <div className="bento-grid-wrapper" onMouseMove={handleBentoMouseMove}>
          <div
            className="bento-spotlight-layer"
            style={{
              background: `radial-gradient(700px circle at ${bentoMouse.x}px ${bentoMouse.y}px, rgba(200, 240, 100, 0.18), transparent 75%)`
            }}
          />
          <div className="bento-grid">
            {/* Card 1: 2 Kolom Lebar (Nara AI) */}
            <div className="bento-card bento-span-2 reveal-scroll">
              <div className="bento-two-col">
                <div>
                  <div className="bento-label">TUTOR PRIBADI 24 JAM</div>
                  <h3 className="bento-title">Tanya Rumus & Konsep Sepuasnya Tanpa Rasa Malu</h3>
                  <p className="bento-desc">
                    Sering ragu bertanya di kelas karena takut dibilang gak nyimak? Di sini kamu bebas menanyakan rumus serumit apapun. Nara menjelaskan memakai analogi sehari-hari sampai kamu benar-benar paham.
                  </p>
                  <div className="chip-group">
                    <span className="metric-chip">Analogi Sederhana</span>
                    <span className="metric-chip">Penjelasan Bertahap</span>
                    <span className="metric-chip">Ramah & Siap Siaga</span>
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

            {/* Card 2: 1 Kolom (Interactive Atomic Quiz) */}
            <div className="bento-card reveal-scroll delay-1">
              <div>
                <div className="bento-label">LATIHAN TERARAH</div>
                <h3 className="bento-title">Kuis Cerdas: Uji Logika, Bukan Tebak-Tebakan</h3>
                <p className="bento-desc">
                  Coba langsung kuis interaktif di bawah. Soal dirancang untuk menguji pemahaman intimu tanpa jebakan ngawur:
                </p>

                {/* Interactive Quiz Box */}
                <div className="quiz-demo-box">
                  <div style={{ fontSize: 11.5, fontFamily: "'DM Mono', monospace", color: "#60706a", marginBottom: 6 }}>
                    SOAL LATIHAN INTERAKTIF:
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#18221f", lineHeight: 1.45 }}>
                    <MathView text="Jika himpunan $A = \{2, 4, 6\}$ dan $B = \{4, 6, 8\}$, maka anggota $A \cap B$ adalah..." />
                  </div>

                  <div style={{ marginTop: 10 }}>
                    <button
                      className={`quiz-option-btn ${quizSelected === "A" ? "selected-wrong" : ""}`}
                      onClick={() => setQuizSelected("A")}
                    >
                      <span>[A] <MathView text="$\\{2, 8\\}$" /></span>
                      {quizSelected === "A" && <X size={15} color="#dc2626" />}
                    </button>

                    <button
                      className={`quiz-option-btn ${quizSelected === "B" ? "selected-correct" : ""}`}
                      onClick={() => setQuizSelected("B")}
                    >
                      <span>[B] <MathView text="$\\{4, 6\\}$" /></span>
                      {quizSelected === "B" && <Check size={15} color="#15803d" />}
                    </button>

                    <button
                      className={`quiz-option-btn ${quizSelected === "C" ? "selected-wrong" : ""}`}
                      onClick={() => setQuizSelected("C")}
                    >
                      <span>[C] <MathView text="$\\{2, 4, 6, 8\\}$" /></span>
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

              <div className="chip-group" style={{ marginTop: 20 }}>
                <span className="metric-chip">Pembahasan Lengkap</span>
                <span className="metric-chip">Otomatis Catat Bank Salah</span>
              </div>
            </div>

            {/* Card 3: 1 Kolom (Interactive YouTube to Summary) */}
            <div className="bento-card reveal-scroll delay-2">
              <div>
                <div className="bento-label">RINGKASAN CEPAT</div>
                <h3 className="bento-title">Video 2 Jam Dirangkum Jadi Bacaan 3 Menit</h3>
                <p className="bento-desc">
                  Cukup tempel tautan video YouTube. Tanka otomatis merapikannya menjadi modul bab siap baca:
                </p>

                {/* YouTube Demo Interactive Box */}
                <div className="yt-demo-box">
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
                        <span>Bab 3: Aturan Rantai & Aplikasi Nilai Maksimum</span>
                        <span style={{ fontSize: 11, color: "#4b6623", fontWeight: 700 }}>4 mnt baca</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

            <div className="chip-group" style={{ marginTop: "auto", paddingTop: 16 }}>
              <span className="metric-chip">Auto-Chapter</span>
              <span className="metric-chip">Rangkuman Rumus</span>
              <span className="metric-chip">Buku Saku Digital</span>
            </div>
          </div>

          {/* Card 4: 1 Kolom (Radial Knowledge Graph with Moving Energy Flow) */}
          <div className="bento-card reveal-scroll delay-1">
            <div>
              <div className="bento-label">PETA BESAR MATERI</div>
              <h3 className="bento-title">Petakan Hubungan Antar-Konsep Sebelum Ujian</h3>
              <p className="bento-desc">
                Lihat keterkaitan materi secara menyeluruh agar tidak ada mata rantai ilmu yang bolong. Klik salah satu simpul untuk melihat hubungannya:
              </p>

              {/* Radial Graph Visualizer */}
              <div className="radial-graph-wrapper">
                <svg width="100%" height="150" viewBox="0 0 320 150">
                  <path d="M 160 75 Q 110 35 60 40" stroke="#8da868" strokeWidth="2" fill="none" className="graph-link-pulse" />
                  <path d="M 160 75 Q 210 35 260 40" stroke="#8da868" strokeWidth="2" fill="none" className="graph-link-pulse" />
                  <path d="M 160 75 Q 110 115 60 115" stroke="#8da868" strokeWidth="2" fill="none" className="graph-link-pulse" />
                  <path d="M 160 75 Q 210 115 260 115" stroke="#8da868" strokeWidth="2" fill="none" className="graph-link-pulse" />

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

            <div className="chip-group" style={{ marginTop: "auto", paddingTop: 16 }}>
              <span className="metric-chip">Peta Visual</span>
              <span className="metric-chip">Kaitkan Prasyarat</span>
              <span className="metric-chip">Ingatan Jangka Panjang</span>
            </div>
          </div>

          {/* Card 5: 1 Kolom (Interactive Offline) */}
          <div className="bento-card reveal-scroll delay-2">
            <div>
              <div className="bento-label">HEMAT & MANDIRI</div>
              <h3 className="bento-title">Tetap Bisa Belajar Walau Kuota Habis</h3>
              <p className="bento-desc">
                Semua materi dan catatanmu tersimpan di HP/laptopmu sendiri. Bebas dibuka di mana saja tanpa pusing sinyal internet putus-nyambung:
              </p>

              {/* Interactive Offline Switch */}
              <div className="offline-toggle-container">
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

                <div style={{ marginTop: 12, fontSize: 13, lineHeight: 1.55, color: "#45544e" }}>
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

            <div className="chip-group" style={{ marginTop: "auto", paddingTop: 16 }}>
              <span className="metric-chip">Bisa Offline</span>
              <span className="metric-chip">Ringan di HP</span>
              <span className="metric-chip">Nol Iklan Mengganggu</span>
            </div>
          </div>
        </div>
      </div>
      </section>

      {/* Dual Side-by-Side Visual Battle: Cara Lama vs Cara Tanka */}
      <section id="perbandingan" className="landing-section" style={{ paddingTop: 30 }}>
        <div className="section-header reveal-scroll">
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

      {/* Social Proof: 3 Student Personas */}
      <section id="testimoni" className="landing-section" style={{ paddingTop: 30 }}>
        <div className="section-header reveal-scroll">
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

      {/* Feature Stepper Section */}
      <section id="alur" className="landing-section" style={{ paddingTop: 20 }}>
        <div className="section-header reveal-scroll">
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

      {/* Call to Action Banner */}
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
