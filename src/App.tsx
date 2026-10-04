import { QuizTab } from "./components/tabs/QuizTab";
import { MaterialTab } from "./components/tabs/MaterialTab";
import { HomeHubTab } from "./components/tabs/HomeHubTab";
import { TopBar } from "./components/layout/TopBar";
import { Sidebar } from "./components/layout/Sidebar";
import { MobileBottomNav } from "./components/layout/MobileBottomNav";
import { StagingUploadModal } from "./components/modals/StagingUploadModal";
import { EnrichModal } from "./components/modals/EnrichModal";
import { TopicModal } from "./components/modals/TopicModal";
import { FormulaDrawer } from "./components/modals/FormulaDrawer";
import { TanyaNaraPanel } from "./components/modals/TanyaNaraPanel";
import { MistakesTab } from "./components/tabs/MistakesTab";
import { ChatTab } from "./components/tabs/ChatTab";
import { SummaryTab } from "./components/tabs/SummaryTab";
import { FeynmanTab } from "./components/tabs/FeynmanTab";
import { FlashcardsTab } from "./components/tabs/FlashcardsTab";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { useStudyTimer } from "./hooks/useStudyTimer";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import katex from "katex";
import "katex/dist/katex.min.css";
import {
  BookOpen,
  Sparkles,
  Layers,
  MessageSquare,
  Plus,
  Trash2,
  Send,
  RotateCw,
  CheckCircle2,
  XCircle,
  Upload,
  FileText,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Sparkle,
  Check,
  X,
  FileUp,
  Target,
  Award,
  AlertTriangle,
  Clock,
  Play,
  Pause,
  Bell,
  BellRing,
  Sliders,
  Brain,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Lightbulb,
  Menu,
  Cpu,
  ListChecks,
  Camera,
  Calculator,
  Flag,
  Bookmark,
  Compass,
  Download,
  Printer,
  Copy,
  Globe,
  Home,
  Search,
  ArrowRight
} from "lucide-react";

// Tasteskill Dials: VARIANCE: 6 | MOTION: 6 | DENSITY: 4
// Mobile-first responsive touch engineering:
// - Drawer overlay on <=768px
// - Full-width touch targets (min 44px)
// - Horizontal scrollable tabs with no-scrollbar
// - Zero em-dashes strictly enforced

interface DocumentItem {
  id: string;
  title: string;
  content_length?: number;
  created_at: number;
  flashcard_count?: number;
}

interface Flashcard {
  id: string;
  doc_id: string;
  front: string;
  back: string;
  difficulty: "new" | "again" | "hard" | "good" | "easy";
  review_count: number;
  created_at: number;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface QuizStep {
  step?: number;
  title?: string;
  desc?: string;
}

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  formula?: string;
  steps?: QuizStep[];
  explanation: string;
  pitfall: string;
}

interface FeynmanResult {
  score: number;
  verdict: string;
  accuratePoints: string[];
  missedOrFlawedPoints: string[];
  perfectAnalogy: string;
  feedback: string;
}

interface MistakeItem {
  id: string;
  docId: string;
  docTitle?: string;
  question: string;
  options: string[];
  correctIndex: number;
  userAnswerIndex: number;
  formula?: string;
  steps?: QuizStep[];
  explanation?: string;
  pitfall?: string;
  resolved: number;
  createdAt: number;
}

interface FormulaItem {
  name: string;
  formula: string;
  meaning?: string;
  category?: string;
}

// High-performance KaTeX Math Renderer with fast-path token bypass and memory cache
import { MathView, getSubjectBadge } from "./components/common/MathView";
import {
  extractTextFromNode,
  isAsciiDiagramText,
  normalizeDiagramsInMarkdown,
  renderVisualDiagramOrPre,
  WebSearchProgressView
} from "./components/common/DiagramRenderer";
import { AIProcessLoader } from "./components/common/AIProcessLoader";

export default function App() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [activeDocTitle, setActiveDocTitle] = useState("");
  const [activeDocContent, setActiveDocContent] = useState("");
  const [activeDocSummary, setActiveDocSummary] = useState("");
  const activeDoc = documents.find((d) => d.id === activeDocId) || null;

  const [activeTab, setActiveTab] = useState<"home" | "material" | "flashcards" | "quiz" | "feynman" | "summary" | "chat" | "mistakes">("home");
  const [homeSearchQuery, setHomeSearchQuery] = useState("");
  const [homeSubjectFilter, setHomeSubjectFilter] = useState("Semua");

  // AI Tutor Drawer & Creation Tabs
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);
  const [materialCreationTab, setMaterialCreationTab] = useState<"upload" | "topic" | "manual">("upload");

  // Mobile drawer state
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Auto-close mobile drawer on tab or document change
  useEffect(() => {
    setIsMobileDrawerOpen(false);
  }, [activeTab, activeDocId]);

  // Global escape key handler to dismiss all drawers & overlays
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMobileDrawerOpen(false);
        setIsFormulaDrawerOpen(false);
        setIsTopicModalOpen(false);
        setIsEnrichModalOpen(false);
        setIsStagingModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Material state
  const [showRawText, setShowRawText] = useState(false);

  // Flashcards state
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isGeneratingCards, setIsGeneratingCards] = useState(false);

  // Quiz state
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizQuestionCount, setQuizQuestionCount] = useState(5);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [isQuizCompleted, setIsQuizCompleted] = useState(false);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [solutionStep, setSolutionStep] = useState(0);

  // Exam Mode state
  const [quizMode, setQuizMode] = useState<"study" | "exam">("study");
  const [examTimeLeft, setExamTimeLeft] = useState(0);
  const [isExamTimerRunning, setIsExamTimerRunning] = useState(false);
  const [examFlagged, setExamFlagged] = useState<Record<number, boolean>>({});
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [examDurationSeconds, setExamDurationSeconds] = useState(0);


  const {
    mistakes, setMistakes,
    isDrillingMistakes, setIsDrillingMistakes,
    mistakeFilterScope, setMistakeFilterScope,
    activeDocMistakes, displayedMistakes,
    fetchMistakes, recordMistake, resolveMistake, deleteMistake, handleClearMistakes
  } = useMistakes({ activeDocId, activeDocTitle, showNotice });


  // Formula Cheatsheet Drawer state
  const [isFormulaDrawerOpen, setIsFormulaDrawerOpen] = useState(false);
  const [formulas, setFormulas] = useState<FormulaItem[]>([]);
  const [isLoadingFormulas, setIsLoadingFormulas] = useState(false);
  const [formulaFilter, setFormulaFilter] = useState("");

  // Direct Camera capture ref
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Topic Discovery & Generator Modal state
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [topicInput, setTopicInput] = useState("");
  const [topicStep, setTopicStep] = useState<1 | 2 | 3>(1);
  const [topicClarificationData, setTopicClarificationData] = useState<{
    subject: string;
    formalTitle: string;
    questions: { id: string; question: string; choices: string[] }[];
  } | null>(null);
  const [topicAnswers, setTopicAnswers] = useState<Record<string, string>>({});
  const [isClarifyingTopic, setIsClarifyingTopic] = useState(false);
  const [isGeneratingTopic, setIsGeneratingTopic] = useState(false);

  // Quiz Inline Question Chat state
  const [isQuizChatOpen, setIsQuizChatOpen] = useState(false);
  const [quizChatMessages, setQuizChatMessages] = useState<Record<number, { role: "user" | "assistant", content: string }[]>>({});
  const [quizChatInput, setQuizChatInput] = useState("");
  const [isQuizChatSending, setIsQuizChatSending] = useState(false);

  // Title detection state
  const [isDetectingTitle, setIsDetectingTitle] = useState(false);

  // Feynman state
  const [feynmanTopic, setFeynmanTopic] = useState("");
  const [feynmanExplanation, setFeynmanExplanation] = useState("");
  const [isEvaluatingFeynman, setIsEvaluatingFeynman] = useState(false);
  const [feynmanResult, setFeynmanResult] = useState<FeynmanResult | null>(null);

  // Feynman Voice Recording state
  const [isRecordingFeynman, setIsRecordingFeynman] = useState(false);
  const [feynmanRecordingSeconds, setFeynmanRecordingSeconds] = useState(0);
  const feynmanRecognitionRef = useRef<any>(null);
  const feynmanMediaStreamRef = useRef<MediaStream | null>(null);

  // Focus & Study Timer state

  const {
    timerDurationMinutes, setTimerDurationMinutes,
    timerSeconds, setTimerSeconds,
    timerMode, setTimerMode,
    isTimerRunning, setIsTimerRunning,
    completedSessions, setCompletedSessions,
    isTimerSettingsOpen, setIsTimerSettingsOpen,
    isAlarmActive, setIsAlarmActive,
    customMinutesInput, setCustomMinutesInput,
    playAlarmSound,
    applyTimerDuration
  } = useStudyTimer(showNotice);

  // Text to speech state
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatSending, setIsChatSending] = useState(false);
  const [models, setModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState("ag/gemini-3.8-flash-low");

  // Summary state
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [summaryStyle, setSummaryStyle] = useState<"tutor" | "intuitive" | "memorization">("tutor");

  // Quiz Type state
  const [quizType, setQuizType] = useState<"beginner" | "conceptual" | "analytical">("beginner");

  // Document Enrichment (Web Search / Eksternal) state
  const [isEnriching, setIsEnriching] = useState(false);
  const [isEnrichModalOpen, setIsEnrichModalOpen] = useState(false);
  const [enrichFocus, setEnrichFocus] = useState("");
  const [enrichSuggestions, setEnrichSuggestions] = useState<Array<{ title: string; focus: string; reason: string }>>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Document Enrichment Multi-select state
  const [selectedEnrichTitles, setSelectedEnrichTitles] = useState<string[]>([]);

  // Staging Tray for uploaded files/photos before processing
  const [stagedFiles, setStagedFiles] = useState<Array<{ id: string; file: File; name: string; size: number; ext: string; previewUrl?: string }>>([]);
  const [isStagingModalOpen, setIsStagingModalOpen] = useState(false);
  const [stagedDocTitle, setStagedDocTitle] = useState("");
  const [stagedGoal, setStagedGoal] = useState<string>("theory");
  const [stagedCustomInstruction, setStagedCustomInstruction] = useState<string>("");

  // Status notification toast
  const [statusNotice, setStatusNotice] = useState("");

  function showNotice(text: string) {
    setStatusNotice(text);
    setTimeout(() => setStatusNotice(""), 3500);
  }

  const [copiedId, setCopiedId] = useState<string | null>(null);

  function copyToClipboard(text: string, label = "Teks", key = "default") {
    if (!text || !text.trim()) {
      showNotice(`Tidak ada teks ${label.toLowerCase()} yang dapat disalin`);
      return;
    }

    const onCopiedSuccess = () => {
      setCopiedId(key);
      setTimeout(() => setCopiedId(null), 2000);
      showNotice(`${label} berhasil disalin ke clipboard`);
    };

    // 1. Jika Secure Context (HTTPS / localhost), gunakan navigator.clipboard.writeText
    const isSecure = typeof window !== "undefined" && window.isSecureContext === true;
    if (isSecure && typeof navigator !== "undefined" && navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      navigator.clipboard.writeText(text).then(() => {
        onCopiedSuccess();
      }).catch(() => {
        fallbackCopy(text, onCopiedSuccess);
      });
      return;
    }

    // 2. Jika diakses via HTTP LAN (misal IP 192.168.x.x di HP), WAJIB sinkron panggil fallbackCopy saat gesture sentuh masih aktif
    fallbackCopy(text, onCopiedSuccess);
  }

  function fallbackCopy(text: string, onSuccess: () => void) {
    let successful = false;
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.width = "2em";
      textArea.style.height = "2em";
      textArea.style.padding = "0";
      textArea.style.border = "none";
      textArea.style.outline = "none";
      textArea.style.boxShadow = "none";
      textArea.style.background = "transparent";
      textArea.style.opacity = "0.01";
      document.body.appendChild(textArea);

      textArea.focus();
      textArea.select();
      textArea.setSelectionRange(0, textArea.value.length);

      successful = document.execCommand("copy");
      document.body.removeChild(textArea);
    } catch (err) {
      console.error("Fallback execCommand error:", err);
      successful = false;
    }

    if (successful) {
      onSuccess();
    } else {
      // Fallback terakhir: jika clipboard sistem memblokir akses otomatis, beri opsi salin manual lewat modal/prompt
      try {
        const ok = window.prompt("Salin teks di bawah ini (tekan Salin / Ctrl+C):", text);
        if (ok !== null) {
          onSuccess();
        } else {
          showNotice("Gagal menyalin teks ke clipboard");
        }
      } catch {
        showNotice("Gagal menyalin teks ke clipboard");
      }
    }
  }

  function downloadAsMarkdown(filename: string, content: string) {
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showNotice(`Berkas ${filename} berhasil diunduh`);
  }

  // Initial data fetch
  useEffect(() => {
    fetchDocuments();
    fetchModels();
    fetchMistakes();
  }, []);

  // Auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isChatSending]);

  // Keyboard shortcuts for quiz navigation
  useEffect(() => {
    if (activeTab !== "quiz" || quizQuestions.length === 0) return;
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const q = quizQuestions[currentQuestionIndex];
      if (!q) return;
      // 1-5 or A-E to select option
      const numKey = parseInt(e.key);
      if (numKey >= 1 && numKey <= q.options.length) {
        e.preventDefault();
        handleSelectQuizOption(numKey - 1);
      }
      const letterIdx = "abcde".indexOf(e.key.toLowerCase());
      if (letterIdx >= 0 && letterIdx < q.options.length) {
        e.preventDefault();
        handleSelectQuizOption(letterIdx);
      }
      // N = next, P = prev
      if (e.key === "n" || e.key === "N") { e.preventDefault(); handleNextQuizQuestion(); }
      if (e.key === "p" || e.key === "P") { e.preventDefault(); handlePrevQuizQuestion(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeTab, quizQuestions, currentQuestionIndex]);

  // Exam countdown timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (quizMode === "exam" && isExamTimerRunning && !examSubmitted && examTimeLeft > 0) {
      interval = setInterval(() => {
        setExamTimeLeft((prev) => {
          if (prev <= 1) {
            handleExamSubmit();
            showNotice("Waktu Tryout Habis! Lembar jawaban telah dikumpulkan.");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [quizMode, isExamTimerRunning, examSubmitted, examTimeLeft]);

  // Focus & Rest Timer countdown effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0 && isTimerRunning) {
      // Timer cycle completed -> Trigger Alarm
      setIsTimerRunning(false);
      setIsAlarmActive(true);
      playAlarmSound();

      if (timerMode === "focus") {
        setCompletedSessions((prev) => prev + 1);
        showNotice(`Sesi fokus ${timerDurationMinutes} menit selesai! Saatnya istirahat.`);
      } else {
        showNotice("Waktu istirahat selesai! Siap mulai sesi fokus baru?");
      }
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timerSeconds, timerMode, timerDurationMinutes]);

  // Set timer duration in minutes
  // Melodic, rich chime alarm via Web Audio API + Mobile Vibration
  // Text-to-speech handler
  function toggleSpeech(text: string) {
    if (!("speechSynthesis" in window)) {
      showNotice("Browser tidak mendukung fitur audio pembaca teks");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const cleanText = text.replace(/[*#`_\[\]]/g, "").slice(0, 3000);
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "id-ID";
    utterance.rate = 1.05;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  }

  // Format math expressions to clean, elegant Unicode symbols (no raw LaTeX bugs)
  function formatMathUnicode(text: string): string {
    if (!text) return "";
    return text
      .replace(/\\times/g, "×")
      .replace(/\\div/g, "÷")
      .replace(/\\leq|\\le/g, "≤")
      .replace(/\\geq|\\ge/g, "≥")
      .replace(/\\neq/g, "≠")
      .replace(/\\pm/g, "±")
      .replace(/\\cdot/g, "·")
      .replace(/\\sqrt\{([^}]+)\}/g, "√($1)")
      .replace(/\\sqrt([a-zA-Z0-9]+)/g, "√$1")
      .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "($1/$2)")
      .replace(/\\alpha/g, "α")
      .replace(/\\beta/g, "β")
      .replace(/\\theta/g, "θ")
      .replace(/\\pi/g, "π")
      .replace(/\\infty/g, "∞")
      .replace(/\\rightarrow|\\to/g, "→")
      .replace(/\$([^\$]+)\$/g, "$1")
      .replace(/\$\$([^\$]+)\$\$/g, "$1")
      .replace(/\^2\b/g, "²")
      .replace(/\^3\b/g, "³")
      .replace(/\^4\b/g, "⁴")
      .replace(/\^n\b/g, "ⁿ")
      .replace(/_1\b/g, "₁")
      .replace(/_2\b/g, "₂");
  }

  function startMistakeDrill() {
    const targetList = mistakeFilterScope === "current" && activeDocId ? activeDocMistakes : mistakes;
    if (targetList.length === 0) return;
    const questions: QuizQuestion[] = targetList.map((m, idx) => ({
      id: idx + 1,
      question: m.question,
      options: m.options,
      correctIndex: m.correctIndex,
      formula: m.formula,
      steps: m.steps,
      explanation: m.explanation || "",
      pitfall: m.pitfall || ""
    }));
    setQuizQuestions(questions);
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setUserAnswers({});
    setScore(0);
    setIsQuizCompleted(false);
    setQuizMode("study");
    setIsDrillingMistakes(true);
    setActiveTab("quiz");
    showNotice(`Memulai Drill Ulang ${questions.length} Soal ${mistakeFilterScope === "current" && activeDocId ? "pada modul ini" : "lintas modul"}!`);
  }

  async function fetchOrExtractFormulas() {
    if (!activeDocId) {
      showNotice("Pilih materi terlebih dahulu");
      return;
    }
    setIsFormulaDrawerOpen(true);
    setIsLoadingFormulas(true);
    try {
      const res = await fetch(`/api/documents/${activeDocId}/formulas`);
      const data = await res.json();
      if (data.success && data.formulas && data.formulas.length > 0) {
        setFormulas(data.formulas);
      } else {
        const aiRes = await fetch("/api/ai/extract-formulas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ docId: activeDocId, model: selectedModel })
        });
        const aiData = await aiRes.json();
        if (aiData.success && aiData.formulas) {
          setFormulas(aiData.formulas);
        }
      }
    } catch (e) {
      console.error("Failed to load formulas:", e);
    } finally {
      setIsLoadingFormulas(false);
    }
  }

  function handleExamSubmit() {
    setIsExamTimerRunning(false);
    setExamSubmitted(true);
    setIsQuizCompleted(true);
    let correct = 0;
    quizQuestions.forEach((q, idx) => {
      const userAns = userAnswers[idx];
      if (userAns === q.correctIndex) {
        correct++;
      } else if (userAns !== undefined) {
        recordMistake(q, userAns);
      }
    });
    const finalScore = Math.round((correct / (quizQuestions.length || 1)) * 100);
    setScore(finalScore);
    showNotice(`Tryout Selesai! Skor Anda: ${finalScore} / 100 (${correct} Benar dari ${quizQuestions.length} Soal)`);
  }

  async function fetchModels() {
    try {
      const res = await fetch("/api/models");
      const data = await res.json();
      if (data.models && Array.isArray(data.models)) {
        const ids = data.models.map((m: any) => typeof m === "string" ? m : (m?.id || String(m))).filter(Boolean);
        setModels(ids);
        if (ids.includes("ag/gemini-3.8-flash-low")) {
          setSelectedModel("ag/gemini-3.8-flash-low");
        } else if (ids.length > 0) {
          setSelectedModel(ids[0]);
        }
      }
    } catch {
      setModels(["ag/gemini-3.8-flash-low", "ag/claude-sonnet-4-6", "ag/claude-opus-4-6-thinking"]);
    }
  }

  async function fetchDocuments() {
    try {
      const res = await fetch("/api/documents");
      const data = await res.json();
      if (data.documents) {
        setDocuments(data.documents);
        if (data.documents.length > 0 && !activeDocId) {
          loadDocument(data.documents[0].id);
        }
      }
    } catch (e) {
      console.error("Gagal mengambil daftar dokumen:", e);
    }
  }

  async function handleStartTopicClarify(topicText?: string) {
    const raw = (topicText || topicInput).trim();
    if (!raw) {
      showNotice("Ketik nama materi yang ingin dipelajari");
      return;
    }
    setTopicInput(raw);
    setIsClarifyingTopic(true);
    try {
      const res = await fetch("/api/ai/topic-clarify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: raw, model: selectedModel })
      });
      const data = await res.json();
      if (data.success) {
        setTopicClarificationData({
          subject: data.subject || "Umum",
          formalTitle: data.formalTitle || raw,
          questions: data.questions || []
        });
        const defaults: Record<string, string> = {};
        (data.questions || []).forEach((q: any) => {
          if (q.choices && q.choices[0]) defaults[q.id] = q.choices[0];
        });
        setTopicAnswers(defaults);
        setTopicStep(2);
      } else {
        showNotice(data.error || "Gagal menganalisis topik");
      }
    } catch {
      showNotice("Koneksi ke 9Router gagal");
    } finally {
      setIsClarifyingTopic(false);
    }
  }

  async function handleGenerateTopicDocument() {
    if (!topicClarificationData) return;
    setIsGeneratingTopic(true);
    setTopicStep(3);
    try {
      const res = await fetch("/api/ai/topic-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topicInput,
          formalTitle: topicClarificationData.formalTitle,
          subject: topicClarificationData.subject,
          answers: topicAnswers,
          model: selectedModel
        })
      });
      const data = await res.json();
      if (data.success && data.docId) {
        await fetchDocuments();
        await loadDocument(data.docId);
        setIsTopicModalOpen(false);
        setTopicStep(1);
        setTopicInput("");
        setTopicClarificationData(null);
        setActiveTab("material");
        showNotice(`Materi "${data.title}" berhasil disusun dan siap dipelajari!`);
      } else {
        showNotice(data.error || "Gagal menyusun materi");
        setTopicStep(2);
      }
    } catch {
      showNotice("Gagal menyusun dokumen materi");
      setTopicStep(2);
    } finally {
      setIsGeneratingTopic(false);
    }
  }

  async function loadDocument(id: string) {
    try {
      const res = await fetch(`/api/documents/${id}`);
      const data = await res.json();
      if (data.document) {
        setActiveDocId(data.document.id);
        setActiveDocTitle(data.document.title);
        setActiveDocContent(data.document.content);
        setActiveDocSummary(data.document.summary || "");
        setFlashcards(data.flashcards || []);
        setCurrentCardIndex(0);
        setIsFlipped(false);
        setShowRawText(false);
        setFeynmanTopic(data.document.title.split(" - ")[0] || data.document.title);
        setFeynmanExplanation("");
        setFeynmanResult(null);
        setMessages([
          {
            id: "msg_init",
            role: "assistant",
            content: `Halo Eka. Materi "${data.document.title}" siap dipelajari. Tanyakan konsep yang ingin dibedah atau gunakan tab Latihan Soal dan Uji Feynman untuk menguji pemahaman aktif.`
          }
        ]);
        loadQuizForDoc(id);
      }
    } catch (e) {
      console.error("Gagal memuat dokumen:", e);
    }
  }

  async function loadQuizForDoc(docId: string) {
    try {
      const res = await fetch(`/api/documents/${docId}/quizzes`);
      const data = await res.json();
      if (data.quiz && data.quiz.questions) {
        setQuizQuestions(data.quiz.questions);
        resetQuizState();
      } else {
        setQuizQuestions([]);
        resetQuizState();
      }
    } catch {
      setQuizQuestions([]);
      resetQuizState();
    }
  }

  function resetQuizState() {
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setScore(0);
    setUserAnswers({});
    setIsQuizCompleted(false);
    setIsQuizChatOpen(false);
    setExamSubmitted(false);
    setExamFlagged({});
    setIsExamTimerRunning(false);
  }

  async function handleCreateNewDoc() {
    setActiveDocId(null);
    setActiveDocTitle("");
    setActiveDocContent("");
    setActiveDocSummary("");
    setFlashcards([]);
    setQuizQuestions([]);
    setMessages([]);
    setShowRawText(true);
    setActiveTab("material");
    setIsMobileDrawerOpen(false);
  }

  async function handleSaveDocument() {
    if (!activeDocTitle.trim() || !activeDocContent.trim()) {
      showNotice("Judul dan isi materi tidak boleh kosong");
      return;
    }

    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: activeDocTitle.trim(),
          content: activeDocContent.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        if (data.isExamSheet && data.questionCount > 0) {
          showNotice(`📋 Terdeteksi ${data.questionCount} Soal Kisi-Kisi! Materi teori disusun & soal siap dilatih.`);
          if (data.detectedQuestions && data.detectedQuestions.length > 0) {
            setQuizQuestions(data.detectedQuestions);
            setCurrentQuestionIndex(0);
            setUserAnswers({});
            setQuestionEvaluations({});
            setExamSubmitted(false);
          }
        } else {
          showNotice("Materi berhasil disimpan");
        }
        await fetchDocuments();
        setActiveDocId(data.id);
        setActiveDocContent(data.content || activeDocContent);
        setShowRawText(false);
      }
    } catch {
      showNotice("Gagal menyimpan materi");
    }
  }

  async function handleDeleteDocument(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Hapus materi ini beserta kartu dan riwayat obrolannya?")) return;

    try {
      await fetch(`/api/documents/${id}`, { method: "DELETE" });
      showNotice("Materi dan seluruh catatan terkait berhasil dihapus");
      if (activeDocId === id) {
        setActiveDocId(null);
        setActiveDocTitle("");
        setActiveDocContent("");
        setFlashcards([]);
        setQuizQuestions([]);
      }
      setMistakes((prev) => prev.filter((m) => m.docId !== id));
      fetchDocuments();
      fetchMistakes();
    } catch {
      showNotice("Gagal menghapus dokumen");
    }
  }

  // Staging handler for uploaded files and photos before processing
  function handleStageFiles(filesInput: FileList | File[] | File) {
    let files: File[] = [];
    if (filesInput instanceof File) files = [filesInput];
    else files = Array.from(filesInput);

    if (files.length === 0) return;

    const newItems = files.map((f) => {
      const ext = (f.name.split(".").pop() || "").toLowerCase();
      const isImg = ["png", "jpg", "jpeg", "webp", "bmp"].includes(ext);
      return {
        id: "staged_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
        file: f,
        name: f.name,
        size: f.size,
        ext,
        previewUrl: isImg ? URL.createObjectURL(f) : undefined
      };
    });

    setStagedFiles((prev) => {
      const combined = [...prev, ...newItems];
      if (!stagedDocTitle && combined.length > 0) {
        const cleanName = combined[0].name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ").trim();
        setStagedDocTitle(cleanName);
      }
      return combined;
    });

    setIsStagingModalOpen(true);
  }

  function handleRemoveStagedFile(id: string) {
    setStagedFiles((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      const remaining = prev.filter((item) => item.id !== id);
      if (remaining.length === 0) {
        setIsStagingModalOpen(false);
        setStagedDocTitle("");
      }
      return remaining;
    });
  }

  function handleCancelStaging() {
    stagedFiles.forEach((item) => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    });
    setStagedFiles([]);
    setIsStagingModalOpen(false);
    setStagedDocTitle("");
    setUploadError("");
  }

  // Confirm and upload all staged files together
  async function handleConfirmStagedUpload() {
    if (stagedFiles.length === 0) return;
    setIsUploading(true);
    setUploadError("");

    try {
      const filesPayload = await Promise.all(
        stagedFiles.map((item) => {
          return new Promise<{ fileName: string; fileData: string }>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const base64Data = (reader.result as string).split(",")[1];
              resolve({ fileName: item.name, fileData: base64Data });
            };
            reader.onerror = () => reject(new Error(`Gagal membaca ${item.name}`));
            reader.readAsDataURL(item.file);
          });
        })
      );

      const res = await fetch("/api/documents/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: stagedDocTitle.trim() || undefined,
          files: filesPayload,
          goal: stagedGoal,
          instruction: stagedCustomInstruction.trim() || undefined
        })
      });
      const data = await res.json();
      if (data.success) {
        if (data.isExamSheet && data.questionCount > 0) {
          showNotice(`📋 Terdeteksi ${data.questionCount} Soal Kisi-Kisi! Materi teori berhasil disusun & soal siap dikerjakan.`);
          if (data.detectedQuestions && data.detectedQuestions.length > 0) {
            setQuizQuestions(data.detectedQuestions);
            setCurrentQuestionIndex(0);
            setUserAnswers({});
            setQuestionEvaluations({});
            setExamSubmitted(false);
          }
        } else {
          showNotice(`Materi "${data.title}" berhasil dibuat dan siap dipelajari!`);
        }
        handleCancelStaging();
        await fetchDocuments();
        loadDocument(data.id);
        setActiveTab("material");
        setIsMobileDrawerOpen(false);
      } else {
        setUploadError(data.error || "Gagal memproses berkas dokumen");
      }
    } catch (err: any) {
      setUploadError("Gagal mengunggah berkas: " + err.message);
    } finally {
      setIsUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleStageFiles(e.dataTransfer.files);
    }
  }

  // Document Enrichment (AI Web Search / Eksternal)
  async function handleEnrichDocument() {
    if (!activeDocId) return;
    setIsEnriching(true);
    try {
      const res = await fetch(`/api/documents/${activeDocId}/enrich`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ focusTopic: enrichFocus, model: selectedModel })
      });
      const data = await res.json();
      if (data.success) {
        setActiveDocContent(data.content);
        showNotice(`Materi berhasil diperkaya (+${Math.round(data.addedLength / 5)} kata referensi baru)`);
        setIsEnrichModalOpen(false);
        setEnrichFocus("");
        await fetchDocuments();
      } else {
        showNotice(data.error || "Gagal memperkaya materi");
      }
    } catch {
      showNotice("Koneksi ke 9Router gagal");
    } finally {
      setIsEnriching(false);
    }
  }

  // Flashcards AI Generation
  async function handleGenerateFlashcards() {
    if (!activeDocId) {
      showNotice("Pilih atau simpan materi terlebih dahulu");
      return;
    }
    setIsGeneratingCards(true);
    try {
      const res = await fetch("/api/ai/generate-flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docId: activeDocId,
          model: selectedModel
        })
      });
      const data = await res.json();
      if (data.success && data.flashcards) {
        setFlashcards(data.flashcards);
        setCurrentCardIndex(0);
        setIsFlipped(false);
        showNotice(`${data.flashcards.length} kartu baru berhasil dibuat`);
      } else {
        showNotice(data.error || "Gagal menghasilkan flashcards");
      }
    } catch {
      showNotice("Koneksi ke 9Router gagal");
    } finally {
      setIsGeneratingCards(false);
    }
  }

  // Flashcard difficulty review
  async function handleReviewCard(difficulty: "again" | "hard" | "good" | "easy") {
    if (flashcards.length === 0) return;
    const currentCard = flashcards[currentCardIndex];
    try {
      await fetch(`/api/flashcards/${currentCard.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ difficulty })
      });
      const updated = [...flashcards];
      updated[currentCardIndex].difficulty = difficulty;
      setFlashcards(updated);
    } catch (e) {
      console.error(e);
    }

    setIsFlipped(false);
    setTimeout(() => {
      if (currentCardIndex < flashcards.length - 1) {
        setCurrentCardIndex(currentCardIndex + 1);
      } else {
        showNotice("Putaran kartu selesai!");
      }
    }, 200);
  }

  // Auto-detect academic title from content
  async function handleAutoDetectTitle() {
    if (!activeDocId) return;
    setIsDetectingTitle(true);
    try {
      const res = await fetch(`/api/documents/${activeDocId}/detect-title`, { method: "POST" });
      const data = await res.json();
      if (data.success && data.title) {
        setActiveDocTitle(data.title);
        await fetchDocuments();
        showNotice(`Judul materi diperbarui: "${data.title}"`);
      } else {
        showNotice(data.error || "Gagal mendeteksi judul materi");
      }
    } catch {
      showNotice("Koneksi ke server gagal");
    } finally {
      setIsDetectingTitle(false);
    }
  }

  // Quiz Drill Generation (with dynamic count)
  async function handleGenerateQuiz(customCount?: number | unknown) {
    const targetCount =
      typeof customCount === "number" && !isNaN(customCount) && customCount > 0
        ? customCount
        : (quizQuestionCount || 5);

    if (!activeDocId) {
      showNotice("Pilih atau simpan materi terlebih dahulu");
      return;
    }
    setIsGeneratingQuiz(true);
    try {
      const res = await fetch("/api/ai/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docId: activeDocId,
          model: selectedModel,
          count: targetCount,
          quizType,
          lastScore: isQuizCompleted ? score : null
        })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success && Array.isArray(data.questions) && data.questions.length > 0) {
        setQuizQuestions(data.questions);
        resetQuizState();
        showNotice(`Paket latihan ${data.questions.length} soal berhasil dibuat`);
      } else {
        showNotice(data.error || "Gagal membuat soal latihan");
      }
    } catch (err: any) {
      console.error("Quiz generation error:", err);
      showNotice(err?.message ? `Gagal terhubung ke 9Router: ${err.message}` : "Koneksi ke 9Router gagal");
    } finally {
      setIsGeneratingQuiz(false);
    }
  }

  // Handle quiz option selection
  function handleSelectQuizOption(optionIdx: number) {
    if (quizMode === "study") {
      if (isAnswerSubmitted) return;
      setSelectedOption(optionIdx);
      setIsAnswerSubmitted(true);

      const currentQ = quizQuestions[currentQuestionIndex];
      const isCorrect = optionIdx === currentQ.correctIndex;
      if (isCorrect) {
        const points = Math.round(100 / (quizQuestions.length || 5));
        setScore((prev) => prev + points);
      } else {
        recordMistake(currentQ, optionIdx);
      }

      setUserAnswers((prev) => ({
        ...prev,
        [currentQuestionIndex]: optionIdx
      }));
    } else {
      // In Exam Mode: record answer directly, can switch back and forth
      setSelectedOption(optionIdx);
      setUserAnswers((prev) => ({
        ...prev,
        [currentQuestionIndex]: optionIdx
      }));
    }
  }

  function handlePrevQuizQuestion() {
    if (currentQuestionIndex > 0) {
      const prevIdx = currentQuestionIndex - 1;
      setCurrentQuestionIndex(prevIdx);
      setSolutionStep(0);
      const prevAnswer = userAnswers[prevIdx];
      setSelectedOption(prevAnswer !== undefined ? prevAnswer : null);
      if (quizMode === "study") {
        setIsAnswerSubmitted(prevAnswer !== undefined);
      }
    }
  }

  function toggleFlagQuestion(idx: number) {
    setExamFlagged((prev) => ({ ...prev, [idx]: !prev[idx] }));
  }

  function handleNextQuizQuestion() {
    setIsQuizChatOpen(false);
    setSolutionStep(0);
    const nextIdx = currentQuestionIndex + 1;
    if (nextIdx < quizQuestions.length) {
      setCurrentQuestionIndex(nextIdx);
      const nextAnswer = userAnswers[nextIdx];
      if (nextAnswer !== undefined) {
        setSelectedOption(nextAnswer);
        setIsAnswerSubmitted(quizMode === "study");
      } else {
        setSelectedOption(null);
        setIsAnswerSubmitted(false);
      }
    } else {
      if (quizMode === "study") {
        setIsQuizCompleted(true);
      }
    }
  }

  // Handle asking AI questions about the current quiz question
  async function handleSendQuizQuestionChat(presetText?: string) {
    const text = presetText || quizChatInput;
    if (!text.trim() || isQuizChatSending) return;
    const currentQ = quizQuestions[currentQuestionIndex];
    if (!currentQ) return;

    const currentHistory = quizChatMessages[currentQuestionIndex] || [];
    const newHistory = [...currentHistory, { role: "user" as const, content: text.trim() }];
    setQuizChatMessages((prev) => ({
      ...prev,
      [currentQuestionIndex]: newHistory
    }));
    if (!presetText) setQuizChatInput("");
    setIsQuizChatSending(true);

    try {
      const res = await fetch("/api/ai/quiz-question-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docId: activeDocId,
          question: currentQ.question,
          options: currentQ.options,
          correctIndex: currentQ.correctIndex,
          userSelectedIndex: selectedOption,
          userMessage: text.trim(),
          chatHistory: currentHistory,
          model: selectedModel
        })
      });
      const data = await res.json();
      if (data.success && data.reply) {
        setQuizChatMessages((prev) => ({
          ...prev,
          [currentQuestionIndex]: [
            ...(prev[currentQuestionIndex] || []),
            { role: "assistant", content: data.reply }
          ]
        }));
      } else {
        showNotice(data.error || "Gagal menghubungi Tutor AI");
      }
    } catch {
      showNotice("Koneksi ke server AI gagal");
    } finally {
      setIsQuizChatSending(false);
    }
  }

  // Feynman Voice Recording handler
  const handleToggleFeynmanRecording = async () => {
    if (isRecordingFeynman) {
      if (feynmanRecognitionRef.current) {
        try {
          feynmanRecognitionRef.current.stop();
        } catch {}
      }
      if (feynmanMediaStreamRef.current) {
        feynmanMediaStreamRef.current.getTracks().forEach((track) => track.stop());
        feynmanMediaStreamRef.current = null;
      }
      setIsRecordingFeynman(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      feynmanMediaStreamRef.current = stream;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = "id-ID";
        recognition.continuous = true;
        recognition.interimResults = true;

        const baseText = feynmanExplanation.trim();

        recognition.onresult = (event: any) => {
          let currentSessionText = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentSessionText += event.results[i][0].transcript + " ";
          }
          const fullText = (baseText ? baseText + " " : "") + currentSessionText.trim();
          setFeynmanExplanation(fullText);
        };

        recognition.onerror = (event: any) => {
          console.warn("Speech recognition warning:", event.error);
        };

        recognition.start();
        feynmanRecognitionRef.current = recognition;
      } else {
        showNotice("Browser tidak mendukung transkripsi langsung, mikrofon aktif.");
      }

      setIsRecordingFeynman(true);
      setFeynmanRecordingSeconds(0);
    } catch (err: any) {
      console.error("Gagal akses mikrofon:", err);
      showNotice("Izin mikrofon diperlukan untuk merekam penjelasan.");
    }
  };

  // Timer effect for voice recording
  useEffect(() => {
    let interval: any = null;
    if (isRecordingFeynman) {
      interval = setInterval(() => {
        setFeynmanRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setFeynmanRecordingSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isRecordingFeynman]);

  // Fetch AI smart suggestions when Enrich Modal opens
  useEffect(() => {
    if (isEnrichModalOpen && activeDocContent) {
      setIsLoadingSuggestions(true);
      fetch("/api/documents/enrich-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: activeDocTitle,
          content: activeDocContent.slice(0, 3500)
        })
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.suggestions && data.suggestions.length > 0) {
            setEnrichSuggestions(data.suggestions);
          }
        })
        .catch((err) => {
          console.error("Gagal muat saran pengayaan:", err);
        })
        .finally(() => {
          setIsLoadingSuggestions(false);
        });
    }
  }, [isEnrichModalOpen, activeDocId]);

  // Feynman Active Recall Evaluation
  async function handleEvaluateFeynman() {
    if (!feynmanExplanation.trim() || !activeDocId) {
      showNotice("Tuliskan penjelasan pemahaman Anda terlebih dahulu");
      return;
    }
    setIsEvaluatingFeynman(true);
    try {
      const res = await fetch("/api/ai/feynman-evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docId: activeDocId,
          topic: feynmanTopic.trim(),
          explanation: feynmanExplanation.trim(),
          model: selectedModel
        })
      });
      const data = await res.json();
      if (data.success && data.evaluation) {
        setFeynmanResult(data.evaluation);
        showNotice("Evaluasi Feynman selesai");
      } else {
        showNotice(data.error || "Gagal mengevaluasi pemahaman");
      }
    } catch {
      showNotice("Koneksi ke 9Router gagal");
    } finally {
      setIsEvaluatingFeynman(false);
    }
  }

  // AI Summary Generation
  async function handleGenerateSummary() {
    if (!activeDocId) {
      showNotice("Pilih atau simpan materi terlebih dahulu");
      return;
    }
    setIsGeneratingSummary(true);
    try {
      const res = await fetch("/api/ai/generate-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docId: activeDocId,
          model: selectedModel,
          style: summaryStyle
        })
      });
      const data = await res.json();
      if (data.success && data.summary) {
        setActiveDocSummary(data.summary);
        showNotice("Rangkuman cerdas berhasil dibuat");
      } else {
        showNotice(data.error || "Gagal membuat rangkuman");
      }
    } catch {
      showNotice("Koneksi ke 9Router gagal");
    } finally {
      setIsGeneratingSummary(false);
    }
  }

  // AI Chat Tutor
  async function handleSendMessage(customPrompt?: string) {
    const text = customPrompt || chatInput;
    if (!text.trim() || !activeDocId || isChatSending) return;

    const userMsg: ChatMessage = {
      id: "msg_" + Date.now(),
      role: "user",
      content: text.trim()
    };
    setMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setChatInput("");
    setIsChatSending(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docId: activeDocId,
          message: text.trim(),
          model: selectedModel
        })
      });
      const data = await res.json();
      if (data.reply) {
        const assistantMsg: ChatMessage = {
          id: "msg_reply_" + Date.now(),
          role: "assistant",
          content: data.reply
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        showNotice(data.error || "Gagal mendapatkan respon tutor AI");
      }
    } catch {
      showNotice("Koneksi ke tutor AI terputus");
    } finally {
      setIsChatSending(false);
    }
  }

  const currentCard = flashcards[currentCardIndex];
  const currentQuestion = quizQuestions[currentQuestionIndex];
  const wordCount = activeDocContent ? activeDocContent.trim().split(/\s+/).length : 0;

  // Format timer MM:SS
  const timerMins = Math.floor(timerSeconds / 60);
  const timerSecs = timerSeconds % 60;
  const timerDisplay = `${timerMins.toString().padStart(2, "0")}:${timerSecs.toString().padStart(2, "0")}`;

  // Clean raw LaTeX arrows and normalize ASCII diagrams for markdown rendering
  const formattedSummary = useMemo(() => {
    if (!activeDocSummary) return "";
    const cleaned = activeDocSummary.replace(/\$\\rightarrow\$/g, "→");
    return normalizeDiagramsInMarkdown(cleaned);
  }, [activeDocSummary]);

  const formattedContent = useMemo(() => {
    if (!activeDocContent) return "";
    return normalizeDiagramsInMarkdown(activeDocContent);
  }, [activeDocContent]);

  return (
    <div className="app-shell" style={{ display: "flex", height: "100dvh", backgroundColor: "#eef1eb", color: "#17201d", overflow: "hidden" }}>
      {/* Toast Notification */}
      {statusNotice && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            left: 24,
            zIndex: 9999,
            backgroundColor: "#18221f",
            color: "#c8f064",
            padding: "10px 16px",
            borderRadius: 8,
            border: "1px solid #34413c",
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 13,
            fontWeight: 600,
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.25)"
          }}
        >
          <CheckCircle2 size={16} />
          <span>{statusNotice}</span>
        </div>
      )}

      {/* ⏰ ALARM MODAL KETIKA WAKTU BELAJAR/ISTIRAHAT SELESAI */}
      {isAlarmActive && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(24, 33, 30, 0.65)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
            padding: 20
          }}
        >
          <div
            className="modal-scale-in"
            style={{
              backgroundColor: "#ffffff",
              borderRadius: 16,
              maxWidth: 420,
              width: "100%",
              padding: "28px 24px",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.25)",
              textAlign: "center",
              border: "2px solid #c8e6a0"
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                backgroundColor: "#f4f8ed",
                border: "2px solid #a3e635",
                margin: "0 auto 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                animation: "pulseGlow 1.5s infinite"
              }}
            >
              <BellRing size={32} color="#4b6623" />
            </div>

            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: "#166534",
                backgroundColor: "#dcfce7",
                padding: "3px 9px",
                borderRadius: 999,
                letterSpacing: "0.06em"
              }}
            >
              WAKTU {timerMode === "focus" ? "BELAJAR" : "ISTIRAHAT"} TUNTAS
            </span>

            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#18211e", margin: "10px 0 6px" }}>
              {timerMode === "focus" ? "Sesi Fokus Selesai!" : "Waktu Istirahat Selesai!"}
            </h2>

            <p style={{ fontSize: 13, color: "#52625b", lineHeight: 1.5, margin: "0 0 20px" }}>
              {timerMode === "focus"
                ? `Hebat! Anda telah menyelesaikan fokus ${timerDurationMinutes} menit. Saatnya meregangkan badan dan istirahat 10 menit agar otak tetap segar.`
                : "Pikiran Anda sudah segar kembali. Siap untuk melanjutkan sesi fokus berikutnya?"}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {timerMode === "focus" ? (
                <>
                  <button
                    onClick={() => {
                      setIsAlarmActive(false);
                      setTimerMode("break");
                      setTimerSeconds(600); // 10 mins break
                      setIsTimerRunning(true);
                      showNotice("Sesi istirahat 10 menit dimulai");
                    }}
                    style={{
                      backgroundColor: "#c8f064",
                      color: "#18211e",
                      border: "none",
                      borderRadius: 10,
                      padding: "12px",
                      fontSize: 13.5,
                      fontWeight: 800,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6
                    }}
                  >
                    <span>☕ Mulai Istirahat (10 Menit)</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsAlarmActive(false);
                      setTimerMode("focus");
                      setTimerSeconds(timerDurationMinutes * 60);
                      setIsTimerRunning(true);
                      showNotice(`Sesi fokus baru ${timerDurationMinutes} menit dimulai`);
                    }}
                    style={{
                      backgroundColor: "#f4f8ed",
                      color: "#4b6623",
                      border: "1px solid #c8e6a0",
                      borderRadius: 10,
                      padding: "10px",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    <span>⚡ Lanjut Fokus {timerDurationMinutes} Menit Lagi</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setIsAlarmActive(false);
                    setTimerMode("focus");
                    setTimerSeconds(timerDurationMinutes * 60);
                    setIsTimerRunning(true);
                    showNotice(`Sesi fokus ${timerDurationMinutes} menit dimulai`);
                  }}
                  style={{
                    backgroundColor: "#c8f064",
                    color: "#18211e",
                    border: "none",
                    borderRadius: 10,
                    padding: "12px",
                    fontSize: 13.5,
                    fontWeight: 800,
                    cursor: "pointer"
                  }}
                >
                  <span>Mulai Sesi Fokus ({timerDurationMinutes}m)</span>
                </button>
              )}

              <button
                onClick={() => setIsAlarmActive(false)}
                style={{
                  backgroundColor: "transparent",
                  color: "#6b7280",
                  border: "none",
                  padding: "8px",
                  fontSize: 12.5,
                  cursor: "pointer"
                }}
              >
                Tutup Alarm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop overlay for mobile drawer */}
      {isMobileDrawerOpen && (
        <div
          className="drawer-overlay"
          onClick={() => setIsMobileDrawerOpen(false)}
          onTouchStart={() => setIsMobileDrawerOpen(false)}
        />
      )}

      {/* Left Sidebar: Figma Make "nalar." aesthetic */}
      {/* Left Sidebar: Figma Make "nalar." aesthetic */}
      <Sidebar
        isMobileDrawerOpen={isMobileDrawerOpen}
        setIsMobileDrawerOpen={setIsMobileDrawerOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        setIsAiPanelOpen={setIsAiPanelOpen}
        documents={documents}
        activeDocId={activeDocId}
        loadDocument={loadDocument}
        handleDeleteDocument={handleDeleteDocument}
        quizQuestions={quizQuestions}
        activeDocMistakes={activeDocMistakes}
        mistakes={mistakes}
        flashcards={flashcards}
        fileInputRef={fileInputRef}
        cameraInputRef={cameraInputRef}
        isUploading={isUploading}
        handleStageFiles={handleStageFiles}
        setIsTopicModalOpen={setIsTopicModalOpen}
        setIsStagingModalOpen={setIsStagingModalOpen}
      />

      {/* Right / Center Workspace Shell */}
      <div className="workspace-shell">
        {/* Topbar Bar */}
        <TopBar
          setIsMobileDrawerOpen={setIsMobileDrawerOpen}
          activeTab={activeTab}
          activeDocTitle={activeDocTitle}
          activeDocContent={activeDocContent}
          timerMode={timerMode}
          timerSeconds={timerSeconds}
          setTimerSeconds={setTimerSeconds}
          timerDurationMinutes={timerDurationMinutes}
          setTimerDurationMinutes={setTimerDurationMinutes}
          isTimerRunning={isTimerRunning}
          setIsTimerRunning={setIsTimerRunning}
          applyTimerDuration={applyTimerDuration}
          isTimerSettingsOpen={isTimerSettingsOpen}
          setIsTimerSettingsOpen={setIsTimerSettingsOpen}
          customMinutesInput={customMinutesInput}
          setCustomMinutesInput={setCustomMinutesInput}
          playAlarmSound={playAlarmSound}
          fetchOrExtractFormulas={fetchOrExtractFormulas}
          activeDocFormulas={formulas}
          setIsFormulaDrawerOpen={setIsFormulaDrawerOpen}
          isAiPanelOpen={isAiPanelOpen}
          setIsAiPanelOpen={setIsAiPanelOpen}
          models={models}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
        />

        {/* Responsive Grid: Full width workspace by default, 2-column split when Tanya Nara is open */}
        <div className="figma-grid" style={{ gridTemplateColumns: (activeTab !== "home" && isAiPanelOpen) ? "minmax(0, 1fr) 360px" : "1fr" }}>
          <section className="lesson-panel-box no-scrollbar" style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
          {/* Sub Navigation Tabs (Segmented Control Bar) */}
          <div
            className="tab-bar-container no-scrollbar mode-tabs"
            style={{
              height: 52,
              borderBottom: "1px solid #dce2da",
              backgroundColor: "#f4f6f1",
              display: activeTab === "home" ? "none" : "flex",
              alignItems: "center",
              padding: "0 24px",
              gap: 4,
              overflowX: "auto",
              flexShrink: 0
            }}
          >
            {[
              { id: "material", label: "Materi", icon: BookOpen },
              { id: "quiz", label: "Latihan Soal", count: quizQuestions.length, icon: Target },
              { id: "mistakes", label: "Bank Kesalahan", count: activeDocMistakes.length, icon: AlertTriangle, highlight: activeDocMistakes.length > 0 },
              { id: "feynman", label: "Uji Feynman", icon: Brain },
              { id: "flashcards", label: "Flashcards", count: flashcards.length, icon: Layers },
              { id: "summary", label: "Rangkuman AI", icon: Sparkles }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const isHighlight = tab.highlight;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  style={{
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "0 15px",
                    color: isActive ? "#18211e" : (isHighlight ? "#a2574a" : "#78827e"),
                    backgroundColor: "transparent",
                    border: "none",
                    borderBottom: isActive ? "2.5px solid #779f2f" : "2.5px solid transparent",
                    fontSize: 13.5,
                    fontWeight: isActive ? 800 : 600,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                    transition: "color 0.15s ease, border-color 0.15s ease"
                  }}
                >
                  <Icon size={14} color={isActive ? "#18211e" : (isHighlight ? "#a2574a" : "#78827e")} />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <small
                      style={{
                        padding: "2px 6px",
                        borderRadius: 5,
                        fontFamily: "'DM Mono', monospace",
                        fontSize: 10.5,
                        fontWeight: 700,
                        backgroundColor: isActive
                          ? (isHighlight ? "#faece8" : "#e4f1c8")
                          : (isHighlight ? "#faece8" : "#e4e9e1"),
                        color: isActive
                          ? (isHighlight ? "#a2574a" : "#41541d")
                          : (isHighlight ? "#a2574a" : "#8e9893")
                      }}
                    >
                      {tab.count}
                    </small>
                  )}
                </button>
              );
            })}
          </div>

          {/* Workspace Tab Panels */}
          <div className="main-content-area" style={{ flex: 1, overflowY: "auto", padding: 24 }}>
            {/* TAB 0: BERANDA / STUDY HUB (CLEAN DESKTOP UTILITY DASHBOARD) */}
            {/* TAB 0: BERANDA / STUDY HUB (CLEAN DESKTOP UTILITY DASHBOARD) */}
            {activeTab === "home" && (
              <HomeHubTab
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                documents={documents}
                activeDocId={activeDocId}
                activeDocTitle={activeDocTitle}
                activeDocContent={activeDocContent}
                loadDocument={loadDocument}
                handleDeleteDocument={handleDeleteDocument}
                homeSearchQuery={homeSearchQuery}
                setHomeSearchQuery={setHomeSearchQuery}
                homeSubjectFilter={homeSubjectFilter}
                setHomeSubjectFilter={setHomeSubjectFilter}
                fileInputRef={fileInputRef}
                setIsTopicModalOpen={setIsTopicModalOpen}
                setIsStagingModalOpen={setIsStagingModalOpen}
                quizQuestions={quizQuestions}
                flashcards={flashcards}
                mistakes={mistakes}
                handleGenerateQuiz={handleGenerateQuiz}
              />
            )}

            {/* TAB 1: MATERIAL & INGESTION (CLEAN OVERVIEW CARD) */}
            {activeTab === "material" && (
              <MaterialTab
                activeDocId={activeDocId}
                activeDocTitle={activeDocTitle}
                setActiveDocTitle={setActiveDocTitle}
                activeDocContent={activeDocContent}
                setActiveDocContent={setActiveDocContent}
                activeDocSummary={activeDocSummary}
                formattedContent={formattedContent}
                wordCount={wordCount}
                flashcards={flashcards}
                quizQuestions={quizQuestions}
                isDetectingTitle={isDetectingTitle}
                handleAutoDetectTitle={handleAutoDetectTitle}
                fileInputRef={fileInputRef}
                setIsEnrichModalOpen={setIsEnrichModalOpen}
                copyToClipboard={copyToClipboard}
                copiedId={copiedId}
                handleSaveDocument={handleSaveDocument}
                setActiveTab={setActiveTab}
                materialCreationTab={materialCreationTab}
                setMaterialCreationTab={setMaterialCreationTab}
                cameraInputRef={cameraInputRef}
                handleGenerateSummary={handleGenerateSummary}
                isUploading={isUploading}
                uploadError={uploadError}
                topicInput={topicInput}
                setTopicInput={setTopicInput}
                setIsTopicModalOpen={setIsTopicModalOpen}
                handleStartTopicClarify={handleStartTopicClarify}
                isEnriching={isEnriching}
                showRawText={showRawText}
                setShowRawText={setShowRawText}
                isDragging={isDragging}
                setIsDragging={setIsDragging}
                handleDrop={handleDrop}
                handleGenerateQuiz={handleGenerateQuiz}
                handleGenerateFlashcards={handleGenerateFlashcards}
              />
            )}

            {/* TAB 2: MULTIPLE CHOICE QUIZ DRILL (LATIHAN SOAL PILIHAN GANDA) */}
            {/* TAB 2: MULTIPLE CHOICE QUIZ DRILL (LATIHAN SOAL PILIHAN GANDA) */}
            {activeTab === "quiz" && (
              <QuizTab
                quizQuestions={quizQuestions}
                currentQuestionIndex={currentQuestionIndex}
                setCurrentQuestionIndex={setCurrentQuestionIndex}
                quizQuestionCount={quizQuestionCount}
                setQuizQuestionCount={setQuizQuestionCount}
                quizMode={quizMode}
                setQuizMode={setQuizMode}
                quizType={quizType}
                setQuizType={setQuizType}
                isDrillingMistakes={isDrillingMistakes}
                userAnswers={userAnswers}
                selectedOption={selectedOption}
                setSelectedOption={setSelectedOption}
                isAnswerSubmitted={isAnswerSubmitted}
                isQuizCompleted={isQuizCompleted}
                score={score}
                solutionStep={solutionStep}
                setSolutionStep={setSolutionStep}
                examTimeLeft={examTimeLeft}
                setExamTimeLeft={setExamTimeLeft}
                examDurationSeconds={examDurationSeconds}
                setExamDurationSeconds={setExamDurationSeconds}
                isExamTimerRunning={isExamTimerRunning}
                setIsExamTimerRunning={setIsExamTimerRunning}
                examSubmitted={examSubmitted}
                setExamSubmitted={setExamSubmitted}
                examFlagged={examFlagged}
                toggleFlagQuestion={toggleFlagQuestion}
                isGeneratingQuiz={isGeneratingQuiz}
                handleGenerateQuiz={handleGenerateQuiz}
                handleSelectQuizOption={handleSelectQuizOption}
                handleNextQuizQuestion={handleNextQuizQuestion}
                handlePrevQuizQuestion={handlePrevQuizQuestion}
                handleExamSubmit={handleExamSubmit}
                resetQuizState={resetQuizState}
                isQuizChatOpen={isQuizChatOpen}
                setIsQuizChatOpen={setIsQuizChatOpen}
                quizChatMessages={quizChatMessages}
                quizChatInput={quizChatInput}
                setQuizChatInput={setQuizChatInput}
                isQuizChatSending={isQuizChatSending}
                handleSendQuizQuestionChat={handleSendQuizQuestionChat}
                activeDocTitle={activeDocTitle}
                activeDocId={activeDocId}
                setActiveTab={setActiveTab}
                setMistakeFilterScope={setMistakeFilterScope}
                activeDocMistakes={activeDocMistakes}
                mistakes={mistakes}
                selectedModel={selectedModel}
                setQuizQuestions={setQuizQuestions}
              />
            )}

            {/* TAB: BANK SOAL SALAH (MISTAKE NOTEBOOK - FIGMA MAKE DESIGN) */}
            {/* TAB: BANK SOAL SALAH (MISTAKE NOTEBOOK - FIGMA MAKE DESIGN) */}
            {activeTab === "mistakes" && (
              <MistakesTab
                mistakes={mistakes}
                displayedMistakes={displayedMistakes}
                activeDocMistakes={activeDocMistakes}
                activeDocId={activeDocId}
                activeDocTitle={activeDocTitle}
                mistakeFilterScope={mistakeFilterScope}
                setMistakeFilterScope={setMistakeFilterScope}
                handleClearMistakes={handleClearMistakes}
                startMistakeDrill={startMistakeDrill}
                deleteMistake={deleteMistake}
                resolveMistake={resolveMistake}
                loadDocument={loadDocument}
              />
            )}

            {/* TAB 3: ACTIVE RECALL FEYNMAN EVALUATOR */}
            {/* TAB 3: ACTIVE RECALL FEYNMAN EVALUATOR */}
            {activeTab === "feynman" && (
              <FeynmanTab
                feynmanTopic={feynmanTopic}
                setFeynmanTopic={setFeynmanTopic}
                feynmanExplanation={feynmanExplanation}
                setFeynmanExplanation={setFeynmanExplanation}
                feynmanResult={feynmanResult}
                isRecordingFeynman={isRecordingFeynman}
                feynmanRecordingSeconds={feynmanRecordingSeconds}
                isEvaluatingFeynman={isEvaluatingFeynman}
                handleToggleFeynmanRecording={handleToggleFeynmanRecording}
                handleEvaluateFeynman={handleEvaluateFeynman}
              />
            )}
            {/* TAB 4: 3D INTERACTIVE FLASHCARDS */}
            {/* TAB 4: 3D INTERACTIVE FLASHCARDS */}
            {activeTab === "flashcards" && (
              <FlashcardsTab
                flashcards={flashcards}
                currentCardIndex={currentCardIndex}
                setCurrentCardIndex={setCurrentCardIndex}
                isFlipped={isFlipped}
                setIsFlipped={setIsFlipped}
                handleGenerateFlashcards={handleGenerateFlashcards}
                handleReviewCard={handleReviewCard}
                isGeneratingCards={isGeneratingCards}
              />
            )}

            {/* TAB 5: BEAUTIFULLY PARSED MARKDOWN SUMMARY + AUDIO TTS */}
            {/* TAB 5: BEAUTIFULLY PARSED MARKDOWN SUMMARY + AUDIO TTS */}
            {activeTab === "summary" && (
              <SummaryTab
                activeDoc={activeDoc}
                activeDocTitle={activeDocTitle}
                activeDocSummary={activeDocSummary}
                formattedSummary={formattedSummary}
                summaryStyle={summaryStyle}
                setSummaryStyle={setSummaryStyle}
                isGeneratingSummary={isGeneratingSummary}
                handleGenerateSummary={handleGenerateSummary}
                isSpeaking={isSpeaking}
                toggleSpeech={toggleSpeech}
                downloadAsMarkdown={downloadAsMarkdown}
                copyToClipboard={copyToClipboard}
                copiedId={copiedId}
                quizQuestions={quizQuestions}
                flashcards={flashcards}
                activeDocId={activeDocId}
                selectedModel={selectedModel}
                setActiveDocSummary={setActiveDocSummary}
              />
            )}

            {/* TAB 6: GROUNDED AI TUTOR CHAT */}
            {activeTab === "chat" && (
              <ChatTab
                activeDocTitle={activeDocTitle}
                selectedModel={selectedModel}
                messages={messages}
                chatInput={chatInput}
                setChatInput={setChatInput}
                handleSendMessage={handleSendMessage}
                isChatSending={isChatSending}
              />
            )}
          </div>
        </section>

          {/* Right Column: Figma Make "Tanya Nara" AI Panel (Collapsible) */}
          <TanyaNaraPanel
            activeTab={activeTab}
            isAiPanelOpen={isAiPanelOpen}
            setIsAiPanelOpen={setIsAiPanelOpen}
            activeDocTitle={activeDocTitle}
            messages={messages}
            setMessages={setMessages}
            isChatSending={isChatSending}
            chatEndRef={chatEndRef}
            chatInput={chatInput}
            setChatInput={setChatInput}
            handleSendMessage={handleSendMessage}
          />
        </div>
      </div>

      {/* 📐 FORMULA CHEATSHEET DRAWER OVERLAY */}
      <FormulaDrawer
        isFormulaDrawerOpen={isFormulaDrawerOpen}
        setIsFormulaDrawerOpen={setIsFormulaDrawerOpen}
        activeDocTitle={activeDocTitle}
        activeDocId={activeDocId}
        selectedModel={selectedModel}
        formulas={formulas}
        setFormulas={setFormulas}
        isLoadingFormulas={isLoadingFormulas}
        setIsLoadingFormulas={setIsLoadingFormulas}
        formulaFilter={formulaFilter}
        setFormulaFilter={setFormulaFilter}
        fetchOrExtractFormulas={fetchOrExtractFormulas}
        downloadAsMarkdown={downloadAsMarkdown}
      />

              {/* 🧭 AI TOPIC DISCOVERY & GENERATOR MODAL */}
              <TopicModal
                isTopicModalOpen={isTopicModalOpen}
                setIsTopicModalOpen={setIsTopicModalOpen}
                topicStep={topicStep}
                setTopicStep={setTopicStep}
                topicInput={topicInput}
                setTopicInput={setTopicInput}
                isClarifyingTopic={isClarifyingTopic}
                isGeneratingTopic={isGeneratingTopic}
                topicClarificationData={topicClarificationData}
                topicAnswers={topicAnswers}
                setTopicAnswers={setTopicAnswers}
                handleStartTopicClarify={handleStartTopicClarify}
                handleGenerateTopicDocument={handleGenerateTopicDocument}
              />

              {/* 🌐 AI WEB RESEARCH & ENRICHMENT MODAL */}
              <EnrichModal
                isEnrichModalOpen={isEnrichModalOpen}
                setIsEnrichModalOpen={setIsEnrichModalOpen}
                activeDocTitle={activeDocTitle}
                isEnriching={isEnriching}
                enrichSuggestions={enrichSuggestions}
                isLoadingSuggestions={isLoadingSuggestions}
                selectedEnrichTitles={selectedEnrichTitles}
                setSelectedEnrichTitles={setSelectedEnrichTitles}
                enrichFocus={enrichFocus}
                setEnrichFocus={setEnrichFocus}
                handleEnrichDocument={handleEnrichDocument}
              />
      {/* 📥 WHATSAPP/TELEGRAM-STYLE UPLOAD & PHOTO STAGING PREVIEW TRAY */}
      <StagingUploadModal
        isStagingModalOpen={isStagingModalOpen}
        setIsStagingModalOpen={setIsStagingModalOpen}
        stagedFiles={stagedFiles}
        isUploading={isUploading}
        uploadError={uploadError}
        stagedDocTitle={stagedDocTitle}
        setStagedDocTitle={setStagedDocTitle}
        stagedGoal={stagedGoal}
        setStagedGoal={setStagedGoal}
        stagedCustomInstruction={stagedCustomInstruction}
        setStagedCustomInstruction={setStagedCustomInstruction}
        fileInputRef={fileInputRef}
        cameraInputRef={cameraInputRef}
        handleCancelStaging={handleCancelStaging}
        handleRemoveStagedFile={handleRemoveStagedFile}
        handleConfirmStagedUpload={handleConfirmStagedUpload}
      />

      {/* Mobile FAB Tanya Nara (Fixed on <= 768px) */}
      <button
        className="mobile-only fab-bounce"
        onClick={() => setIsAiPanelOpen(!isAiPanelOpen)}
        style={{
          position: "fixed",
          bottom: "76px",
          right: "20px",
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          backgroundColor: "#18221f",
          color: "#c8f064",
          border: "none",
          boxShadow: "0 8px 24px rgba(24, 34, 31, 0.25)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 3400,
          cursor: "pointer"
        }}
      >
        <Brain size={24} />
      </button>

      {/* Hidden File Inputs for Upload & Camera */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        multiple
        accept=".pdf,.docx,.pptx,.txt,.md,image/png,image/jpeg,image/webp"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleStageFiles(e.target.files);
            e.target.value = "";
          }
        }}
      />
      <input
        type="file"
        ref={cameraInputRef}
        style={{ display: "none" }}
        accept="image/*"
        capture="environment"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleStageFiles(e.target.files);
            e.target.value = "";
          }
        }}
      />

      {/* Mobile Bottom Navigation Bar (Fixed on <= 768px) */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isAiPanelOpen={isAiPanelOpen}
        setIsAiPanelOpen={setIsAiPanelOpen}
        setIsMobileDrawerOpen={setIsMobileDrawerOpen}
        mistakes={mistakes}
      />
    </div>
  );
}
