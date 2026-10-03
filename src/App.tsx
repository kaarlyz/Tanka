import React, { useState, useEffect, useRef, useMemo } from "react";
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
  Brain,
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
  Globe
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

// Publication-grade KaTeX Math Renderer (renders horizontal fractions, roots, sigmas, matrices)
function MathView({ text, style, className }: { text?: string; style?: React.CSSProperties; className?: string }) {
  if (!text) return null;

  const renderedHTML = React.useMemo(() => {
    try {
      let str = text;

      // 0. Pre-normalize fractions with slash: (A)/(B) or (A) / (B) -> $\frac{A}{B}$
      str = str.replace(/\(([^()]+)\)\s*\/\s*\(([^()]+)\)/g, (_, a, b) => `$\\frac{${a}}{${b}}$`);
      str = str.replace(/\(([^()]+)\)\s*\/\s*([a-zA-Z0-9]+)\b/g, (_, a, b) => `$\\frac{${a}}{${b}}$`);
      str = str.replace(/\b([a-zA-Z0-9]+)\s*\/\s*\(([^()]+)\)/g, (_, a, b) => `$\\frac{${a}}{${b}}$`);
      str = str.replace(/\b([a-zA-Z0-9]{1,3})\/([a-zA-Z0-9]{1,3})\b/g, (match, a, b) => {
        if (a === "dan" || a === "atau" || a === "and" || a === "or" || match === "10/10") return match;
        return `$\\frac{${a}}{${b}}$`;
      });

      // 0b. Pre-normalize Unicode roots: √(expr) -> $\sqrt{expr}$
      str = str.replace(/√\(([^)]+)\)/g, (_, r) => `$\\sqrt{${r}}$`);
      str = str.replace(/√([a-zA-Z0-9]+)/g, (_, r) => `$\\sqrt{${r}}$`);

      // 0c. Pre-normalize Unicode sigma: ∑_{i=1}^{n} -> $\sum_{i=1}^{n}$
      str = str.replace(/∑_\{([^}]+)\}\^\{([^}]+)\}\s*([a-zA-Z0-9_]+)/g, (_, sub, sup, term) => `$\\sum_{${sub}}^{${sup}} ${term}$`);
      str = str.replace(/∑_\{([^}]+)\}\^\{([^}]+)\}/g, (_, sub, sup) => `$\\sum_{${sub}}^{${sup}}$`);

      // 1. Process block math $$...$$
      str = str.replace(/\$\$([\s\S]+?)\$\$/g, (_, math) => {
        try {
          let cleanMath = math
            .replace(/±/g, "\\pm ")
            .replace(/≤/g, "\\le ")
            .replace(/≥/g, "\\ge ")
            .replace(/≠/g, "\\neq ")
            .replace(/\\ddot\{a\}/g, "ä")
            .replace(/\\ddot\{o\}/g, "ö")
            .replace(/\\ddot\{u\}/g, "ü")
            .replace(/\\ddot\{A\}/g, "Ä")
            .replace(/\\ddot\{O\}/g, "Ö")
            .replace(/\\ddot\{U\}/g, "Ü");
          return `<div class="katex-block-wrapper" style="margin: 10px 0; overflow-x: auto; text-align: center;">${katex.renderToString(cleanMath.trim(), { displayMode: true, throwOnError: false })}</div>`;
        } catch {
          return `$$${math}$$`;
        }
      });

      // 2. Process inline math $...$
      str = str.replace(/\$([^\$\n]+?)\$/g, (_, math) => {
        try {
          let cleanMath = math
            .replace(/±/g, "\\pm ")
            .replace(/≤/g, "\\le ")
            .replace(/≥/g, "\\ge ")
            .replace(/≠/g, "\\neq ");
          return katex.renderToString(cleanMath.trim(), { displayMode: false, throwOnError: false });
        } catch {
          return `$${math}$`;
        }
      });

      // 3. Process naked LaTeX commands like \frac{...}{...}, \sqrt{...}, \sum_{...}^{...}
      str = str.replace(/(\\frac\{[^{}]+\}\{[^{}]+\}|\\sqrt\{[^{}]+\}|\\sum_\{[^{}]+\}\^\{[^{}]+\})/g, (math) => {
        try {
          return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false });
        } catch {
          return math;
        }
      });

      // 4. Process standalone algebraic equations containing ^ (e.g. ax^2 + bx + c = 0, D = b^2 - 4ac, x^2 - 4x + 7)
      str = str.replace(/\b([a-zA-Z0-9()+\-*/\s]*[a-zA-Z0-9()]\^[a-zA-Z0-9()]+[a-zA-Z0-9()+\-*/=\s]*)\b/g, (match) => {
        if (match.includes("<") || match.includes(">") || match.length < 3) return match;
        try {
          return katex.renderToString(match.trim(), { displayMode: false, throwOnError: false });
        } catch {
          return match;
        }
      });

      // 5. Ultimate fallback for any remaining carets: x^2 -> x² or <sup>...</sup>
      str = str
        .replace(/\^2\b/g, "²")
        .replace(/\^3\b/g, "³")
        .replace(/\^4\b/g, "⁴")
        .replace(/\^5\b/g, "⁵")
        .replace(/\^6\b/g, "⁶")
        .replace(/\^7\b/g, "⁷")
        .replace(/\^8\b/g, "⁸")
        .replace(/\^9\b/g, "⁹")
        .replace(/\^0\b/g, "⁰")
        .replace(/\^n\b/g, "ⁿ")
        .replace(/\^x\b/g, "ˣ")
        .replace(/\^\{([^}]+)\}/g, "<sup>$1</sup>")
        .replace(/\^([0-9a-zA-Z]+)/g, "<sup>$1</sup>");

      return str;
    } catch {
      return text;
    }
  }, [text]);

  return (
    <span
      className={className}
      style={style}
      dangerouslySetInnerHTML={{ __html: renderedHTML }}
    />
  );
}

export default function App() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [activeDocTitle, setActiveDocTitle] = useState("");
  const [activeDocContent, setActiveDocContent] = useState("");
  const [activeDocSummary, setActiveDocSummary] = useState("");
  const activeDoc = documents.find((d) => d.id === activeDocId) || null;

  const [activeTab, setActiveTab] = useState<"material" | "flashcards" | "quiz" | "feynman" | "summary" | "chat" | "mistakes">("material");

  // Mobile drawer state
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

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

  // Mistake Notebook state
  const [mistakes, setMistakes] = useState<MistakeItem[]>([]);
  const [isDrillingMistakes, setIsDrillingMistakes] = useState(false);
  const [mistakeFilterScope, setMistakeFilterScope] = useState<"current" | "all">("current");

  const activeDocMistakes = useMemo(() => {
    if (!activeDocId) return mistakes;
    return mistakes.filter((m) => m.docId === activeDocId);
  }, [mistakes, activeDocId]);

  const displayedMistakes = mistakeFilterScope === "current" && activeDocId ? activeDocMistakes : mistakes;

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

  // 10/10 Micro-burst focus timer state
  const [timerSeconds, setTimerSeconds] = useState(600); // 10 minutes default
  const [timerMode, setTimerMode] = useState<"focus" | "break">("focus");
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);

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

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Status notification toast
  const [statusNotice, setStatusNotice] = useState("");

  function showNotice(text: string) {
    setStatusNotice(text);
    setTimeout(() => setStatusNotice(""), 3500);
  }

  function copyToClipboard(text: string, label = "Teks") {
    navigator.clipboard.writeText(text).then(() => {
      showNotice(`${label} berhasil disalin ke clipboard`);
    }).catch(() => {
      showNotice("Gagal menyalin teks");
    });
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

  // 10/10 Focus & Rest Timer countdown effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      // Cycle completed
      playNotificationSound();
      if (timerMode === "focus") {
        setCompletedSessions((prev) => prev + 1);
        setTimerMode("break");
        setTimerSeconds(600); // 10 mins break
        showNotice("Sesi 10 Menit Fokus Selesai. Waktunya Istirahat!");
      } else {
        setTimerMode("focus");
        setTimerSeconds(600); // 10 mins focus
        showNotice("Istirahat Selesai. Siap Mulai 10 Menit Fokus Lagi!");
      }
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timerSeconds, timerMode]);

  function playNotificationSound() {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.3); // A5
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch {
      // Audio context fallback
    }
  }

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

  async function fetchMistakes() {
    try {
      const res = await fetch("/api/mistakes");
      const data = await res.json();
      if (data.success && data.mistakes) {
        setMistakes(data.mistakes);
      }
    } catch (e) {
      console.error("Failed to fetch mistakes:", e);
    }
  }

  async function recordMistake(q: QuizQuestion, userAnsIdx: number) {
    try {
      await fetch("/api/mistakes/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docId: activeDocId,
          docTitle: activeDocTitle,
          question: q.question,
          options: q.options,
          correctIndex: q.correctIndex,
          userAnswerIndex: userAnsIdx,
          formula: q.formula || "",
          steps: q.steps || [],
          explanation: q.explanation || "",
          pitfall: q.pitfall || ""
        })
      });
      fetchMistakes();
    } catch (e) {
      console.error("Failed to record mistake:", e);
    }
  }

  async function resolveMistake(id: string) {
    try {
      await fetch(`/api/mistakes/${id}/resolve`, { method: "POST" });
      setMistakes((prev) => prev.filter((m) => m.id !== id));
      showNotice("Soal ditandai sudah dikuasai! Dihapus dari Bank Soal Salah.");
    } catch (e) {
      console.error(e);
    }
  }

  async function deleteMistake(id: string) {
    try {
      await fetch(`/api/mistakes/${id}`, { method: "DELETE" });
      setMistakes((prev) => prev.filter((m) => m.id !== id));
      showNotice("Soal dihapus dari Bank Soal Salah.");
    } catch (e) {
      console.error(e);
    }
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
        const ids = data.models.map((m: any) => m.id);
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
        showNotice("Materi berhasil disimpan");
        await fetchDocuments();
        setActiveDocId(data.id);
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
      showNotice("Materi berhasil dihapus");
      if (activeDocId === id) {
        setActiveDocId(null);
        setActiveDocTitle("");
        setActiveDocContent("");
        setFlashcards([]);
        setQuizQuestions([]);
      }
      fetchDocuments();
    } catch {
      showNotice("Gagal menghapus dokumen");
    }
  }

  // Upload handler for single or multiple PDF, PPTX, DOCX, MD, TXT, images
  async function handleFilesUpload(filesInput: FileList | File[] | File) {
    let files: File[] = [];
    if (filesInput instanceof File) files = [filesInput];
    else files = Array.from(filesInput);

    if (files.length === 0) return;
    setIsUploading(true);
    setUploadError("");

    try {
      const filesPayload = await Promise.all(
        files.map((file) => {
          return new Promise<{ fileName: string; fileData: string }>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const base64Data = (reader.result as string).split(",")[1];
              resolve({ fileName: file.name, fileData: base64Data });
            };
            reader.onerror = () => reject(new Error(`Gagal membaca ${file.name}`));
            reader.readAsDataURL(file);
          });
        })
      );

      const res = await fetch("/api/documents/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: filesPayload })
      });
      const data = await res.json();
      if (data.success) {
        showNotice(`Berhasil memproses ${data.fileCount || 1} berkas: "${data.title}" (${data.wordCount} kata)`);
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
      handleFilesUpload(e.dataTransfer.files);
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
  async function handleGenerateQuiz(customCount?: number) {
    const targetCount = customCount || quizQuestionCount || 5;
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
          quizType
        })
      });
      const data = await res.json();
      if (data.success && data.questions) {
        setQuizQuestions(data.questions);
        resetQuizState();
        showNotice(`Paket latihan ${data.questions.length} soal berhasil dibuat`);
      } else {
        showNotice(data.error || "Gagal membuat soal latihan");
      }
    } catch {
      showNotice("Koneksi ke 9Router gagal");
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

  // Clean raw LaTeX arrows for markdown rendering
  const formattedSummary = activeDocSummary ? activeDocSummary.replace(/\$\\rightarrow\$/g, "→") : "";

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

      {/* Backdrop overlay for mobile drawer */}
      {isMobileDrawerOpen && (
        <div
          className="drawer-overlay"
          onClick={() => setIsMobileDrawerOpen(false)}
        />
      )}

      {/* Left Sidebar: Figma Make "nalar." aesthetic */}
      <aside
        className={`figma-sidebar ${isMobileDrawerOpen ? "sidebar-drawer open" : "desktop-only"}`}
      >
        <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
          {/* Brand Row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <div className="brand-box" style={{ padding: 0 }}>
              <div className="brand-symbol-box">t</div>
              <span>tanka.</span>
            </div>
            {isMobileDrawerOpen && (
              <button
                className="mobile-only"
                onClick={() => setIsMobileDrawerOpen(false)}
                style={{ background: "none", border: "none", color: "#aeb9b4", cursor: "pointer", padding: 4 }}
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Main Navigation Links with Side Mark Chips */}
          <nav className="main-nav" style={{ marginBottom: 18 }}>
            {[
              { id: "material", label: "Materi Saya", mark: "M" },
              { id: "quiz", label: "Latihan Kuis", mark: "L", count: quizQuestions.length },
              { id: "mistakes", label: "Bank Soal Salah", mark: "B", count: activeDocId ? activeDocMistakes.length : mistakes.length, highlight: (activeDocId ? activeDocMistakes.length : mistakes.length) > 0 },
              { id: "flashcards", label: "Flashcard 3D", mark: "K", count: flashcards.length },
              { id: "feynman", label: "Uji Feynman", mark: "F" }
            ].map((nav) => {
              const isActive = activeTab === nav.id;
              return (
                <button
                  key={nav.id}
                  className={`figma-nav-link ${isActive ? "active" : ""}`}
                  onClick={() => {
                    setActiveTab(nav.id as any);
                    setIsMobileDrawerOpen(false);
                  }}
                >
                  <div className="side-mark-box">{nav.mark}</div>
                  <span style={{ flex: 1 }}>{nav.label}</span>
                  {nav.count !== undefined && nav.count > 0 && (
                    <span
                      style={{
                        fontSize: 10,
                        fontFamily: "'DM Mono', monospace",
                        fontWeight: 700,
                        backgroundColor: nav.highlight ? "#ef4444" : "#25322e",
                        color: nav.highlight ? "#ffffff" : "#c8f064",
                        padding: "2px 6px",
                        borderRadius: 999
                      }}
                    >
                      {nav.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Materi Tersimpan & Actions */}
          <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, padding: "0 4px" }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#86938e", fontFamily: "'DM Mono', monospace", letterSpacing: 1.2 }}>
                MATERI TERSIMPAN ({documents.length})
              </span>
              <button
                onClick={handleCreateNewDoc}
                style={{
                  backgroundColor: "#25322e",
                  color: "#d6f58d",
                  border: "1px solid #34413c",
                  borderRadius: 6,
                  padding: "2px 8px",
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 3
                }}
              >
                <Plus size={11} /> Baru
              </button>
            </div>

            {/* Document list */}
            <div className="no-scrollbar" style={{ flex: "0 1 auto", maxHeight: 110, overflowY: "auto", paddingRight: 2 }}>
              {documents.length === 0 ? (
                <div style={{ padding: "16px 8px", color: "#6e7c77", fontSize: 11.5, textAlign: "center" }}>
                  Belum ada dokumen. Unggah atau buat topik AI.
                </div>
              ) : (
                documents.map((doc) => {
                  const isSelected = doc.id === activeDocId;
                  return (
                    <div
                      key={doc.id}
                      onClick={() => {
                        loadDocument(doc.id);
                        setIsMobileDrawerOpen(false);
                      }}
                      style={{
                        padding: "8px 10px",
                        borderRadius: 8,
                        marginBottom: 4,
                        backgroundColor: isSelected ? "#25322e" : "transparent",
                        border: isSelected ? "1px solid #34413c" : "1px solid transparent",
                        cursor: "pointer",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        transition: "all 0.15s ease"
                      }}
                    >
                      <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, marginRight: 6 }}>
                        <div style={{ fontSize: 12, fontWeight: isSelected ? 700 : 500, color: isSelected ? "#f5f8f3" : "#aeb9b4" }}>
                          {doc.title}
                        </div>
                        <div style={{ fontSize: 10, color: "#6e7c77", fontFamily: "'DM Mono', monospace" }}>
                          {doc.flashcard_count || 0} kartu
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleDeleteDocument(doc.id, e)}
                        style={{ background: "none", border: "none", color: "#6e7c77", cursor: "pointer", padding: 4 }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Quick Action Buttons */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 8, marginBottom: 6 }}>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                style={{
                  backgroundColor: "#212d29",
                  border: "1px solid #34413c",
                  color: "#d6f58d",
                  borderRadius: 8,
                  padding: "7px 6px",
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: isUploading ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4
                }}
              >
                <Upload size={12} />
                <span>Unggah</span>
              </button>
              <button
                onClick={() => cameraInputRef.current?.click()}
                disabled={isUploading}
                style={{
                  backgroundColor: "#212d29",
                  border: "1px solid #34413c",
                  color: "#c8f064",
                  borderRadius: 8,
                  padding: "7px 6px",
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: isUploading ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4
                }}
              >
                <Camera size={12} />
                <span>Foto Soal</span>
              </button>
            </div>

            <button
              onClick={() => {
                setIsTopicModalOpen(true);
                setTopicStep(1);
              }}
              style={{
                backgroundColor: "#212d29",
                border: "1px dashed #657358",
                color: "#c8f064",
                borderRadius: 8,
                padding: "7px 10px",
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 5,
                marginBottom: 8
              }}
            >
              <Compass size={13} />
              <span>Cari / Buat Topik AI</span>
            </button>

            <input
              type="file"
              ref={cameraInputRef}
              accept="image/*"
              capture="environment"
              style={{ display: "none" }}
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFilesUpload(e.target.files);
                }
              }}
            />
            <input
              type="file"
              ref={fileInputRef}
              multiple
              accept=".pdf,.docx,.pptx,.png,.jpg,.jpeg,.webp,.bmp,.txt,.md"
              style={{ display: "none" }}
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFilesUpload(e.target.files);
                }
              }}
            />
          </div>
        </div>

        {/* Sidebar Bottom: Streak Widget & Profile Row */}
        <div>
          <div className="streak-card-box">
            <div className="streak-top-row">
              <span>Target mingguan</span>
              <strong style={{ fontFamily: "'DM Mono', monospace" }}>4/5 hari</strong>
            </div>
            <div className="streak-days">
              {["S", "S", "R", "K", "J"].map((day, idx) => (
                <span className={idx < 4 ? "filled" : ""} key={`${day}-${idx}`}>
                  {idx < 4 ? "✓" : day}
                </span>
              ))}
            </div>
            <p>Satu sesi lagi untuk mencapai target belajarmu.</p>
          </div>

          <button className="profile-row-box">
            <div className="avatar-box">ER</div>
            <span>
              <strong>Eka Restu Syahputra</strong>
              <small>Pelajar aktif XII-6</small>
            </span>
            <span className="profile-more-dots">•••</span>
          </button>
        </div>
      </aside>

      {/* Right / Center Workspace Shell */}
      <div className="workspace-shell">
        {/* Topbar Bar */}
        <header className="topbar-bar">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={() => setIsMobileDrawerOpen(true)}
              className="mobile-only"
              style={{ background: "none", border: "none", color: "#17201d", cursor: "pointer", padding: 4 }}
            >
              <Menu size={22} />
            </button>
            <div style={{ minWidth: 0 }}>
              <span className="topbar-eyebrow">RUANG BELAJAR CERDAS</span>
              <h1 className="topbar-title" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{activeDocTitle || "Dasar Pembelajaran"}</h1>
            </div>
          </div>

          {/* Center: Timer */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              backgroundColor: timerMode === "focus" ? "#f0f6eb" : "#fbf4e8",
              border: `1px solid ${timerMode === "focus" ? "#d2e3c3" : "#ecd8b5"}`,
              borderRadius: 999,
              padding: "4px 10px",
              fontFamily: "'DM Mono', monospace",
              flexShrink: 0
            }}
          >
            <Clock size={12} color={timerMode === "focus" ? "#4b6623" : "#b45309"} />
            <span style={{ fontSize: 12, fontWeight: 700, color: timerMode === "focus" ? "#4b6623" : "#b45309" }}>
              {timerDisplay}
            </span>
            <button
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              style={{ background: "none", border: "none", color: "#4b6623", cursor: "pointer", padding: "2px 4px", display: "flex" }}
            >
              {isTimerRunning ? <Pause size={11} /> : <Play size={11} />}
            </button>
            <button
              onClick={() => {
                setIsTimerRunning(false);
                setTimerSeconds(600);
              }}
              className="desktop-only"
              style={{ background: "none", border: "none", color: "#88918d", cursor: "pointer", padding: "2px 4px", display: "flex" }}
            >
              <RotateCw size={10} />
            </button>
          </div>

          {/* Right: Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="session-status-badge desktop-only">
              <i />
              Sesi tersimpan
            </div>

            <button
              onClick={fetchOrExtractFormulas}
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #dce1da",
                color: "#17201d",
                borderRadius: 8,
                padding: "6px 12px",
                fontSize: 11.5,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 5
              }}
            >
              <Calculator size={13} color="#4b6623" />
              <span className="desktop-only">Lembar Rumus</span>
            </button>

            <div className="desktop-only" style={{ display: "flex", alignItems: "center", gap: 6, backgroundColor: "#ffffff", border: "1px solid #dce1da", borderRadius: 8, padding: "5px 8px" }}>
              <Cpu size={12} color="#4b6623" />
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                style={{ backgroundColor: "transparent", color: "#17201d", border: "none", fontSize: 11, outline: "none", cursor: "pointer", maxWidth: 120 }}
              >
                {models.map((m) => (
                  <option key={m} value={m}>
                    {m.replace("ag/", "")}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </header>

        {/* 2-Column Split: Main Study Panel + AI Tutor Panel */}
        <div className="figma-grid">
          <section className="lesson-panel-box no-scrollbar" style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
          {/* Sub Navigation Tabs (Segmented Control Bar) */}
          <div
            className="tab-bar-container no-scrollbar"
            style={{
              height: 48,
              borderBottom: "1px solid #dce1da",
              backgroundColor: "#ffffff",
              display: "flex",
              alignItems: "center",
              padding: "0 18px",
              gap: 6,
              overflowX: "auto",
              flexShrink: 0
            }}
          >
            {[
              { id: "material", label: "Materi & Status", icon: BookOpen },
              { id: "quiz", label: "Latihan Soal", count: quizQuestions.length, icon: Target },
              { id: "mistakes", label: "Bank Soal Salah", count: activeDocMistakes.length, icon: AlertTriangle, highlight: activeDocMistakes.length > 0 },
              { id: "feynman", label: "Uji Feynman", icon: Brain },
              { id: "flashcards", label: "Flashcards 3D", count: flashcards.length, icon: Layers },
              { id: "summary", label: "Rangkuman AI", icon: Sparkles }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const isHighlight = tab.highlight;
              return (
                <button
                  key={tab.id}
                  className="tab-btn"
                  onClick={() => setActiveTab(tab.id as any)}
                  style={{
                    backgroundColor: isActive ? (isHighlight ? "#fef2f2" : "#18221f") : "transparent",
                    color: isActive ? (isHighlight ? "#ef4444" : "#c8f064") : (isHighlight ? "#b45309" : "#6f7975"),
                    border: isActive ? (isHighlight ? "1px solid #fecaca" : "1px solid #18221f") : "1px solid transparent",
                    borderRadius: 8,
                    padding: "5px 12px",
                    fontSize: 12.5,
                    fontWeight: isActive ? 700 : 500,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                    transition: "all 0.15s ease"
                  }}
                >
                  <Icon size={13} color={isActive ? (isHighlight ? "#ef4444" : "#c8f064") : (isHighlight ? "#b45309" : "#6f7975")} />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "1px 6px",
                        borderRadius: 999,
                        backgroundColor: isActive ? (isHighlight ? "#fee2e2" : "#25322e") : (isHighlight ? "#fef3c7" : "#e5e7eb"),
                        color: isActive ? (isHighlight ? "#ef4444" : "#c8f064") : (isHighlight ? "#b45309" : "#4b5563")
                      }}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Workspace Tab Panels */}
          <div className="main-content-area" style={{ flex: 1, overflowY: "auto", padding: 24 }}>
            {/* TAB 1: MATERIAL & INGESTION (CLEAN OVERVIEW CARD) */}
            {activeTab === "material" && (
              <div style={{ maxWidth: 880, margin: "0 auto" }}>
                {/* Drag and Drop Zone */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: isDragging ? "2px dashed #72a728" : "1px dashed #dce1da",
                    backgroundColor: isDragging ? "#eef8db" : "#ffffff",
                    borderRadius: 12,
                    padding: "24px 26px",
                    textAlign: "center",
                    cursor: "pointer",
                    marginBottom: 20,
                    boxShadow: "0 10px 35px rgba(27, 39, 35, 0.04)",
                    transition: "border 0.2s ease, background 0.2s ease"
                  }}
                >
                  <FileUp size={24} color="#72a728" style={{ margin: "0 auto 8px" }} />
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#17201d", lineHeight: 1.4, wordBreak: "break-word" }}>
                    Unggah Dokumen PDF, Word, PPTX, Foto, atau Teks
                  </div>
                  <div style={{ fontSize: 12, color: "#6f7975", marginTop: 3, lineHeight: 1.4 }}>
                    PDF, Word, PowerPoint, Foto (OCR), dan Teks (.txt, .md).
                  </div>

                  {/* Direct Action Chips */}
                  <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      style={{
                        backgroundColor: "#18221f",
                        border: "1px solid #18221f",
                        color: "#c8f064",
                        borderRadius: 8,
                        padding: "7px 14px",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 6
                      }}
                    >
                      <Upload size={13} />
                      <span>Pilih Berkas Dokumen</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        cameraInputRef.current?.click();
                      }}
                      style={{
                        backgroundColor: "#ffffff",
                        border: "1px solid #dce1da",
                        color: "#17201d",
                        borderRadius: 8,
                        padding: "7px 14px",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 6
                      }}
                    >
                      <Camera size={13} color="#4b6623" />
                      <span>Foto Soal Langsung (Kamera HP)</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsTopicModalOpen(true);
                        setTopicStep(1);
                      }}
                      style={{
                        backgroundColor: "#eef8db",
                        border: "1px solid #c2e28f",
                        color: "#273f15",
                        borderRadius: 8,
                        padding: "7px 14px",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 6
                      }}
                    >
                      <Compass size={13} color="#4b6623" />
                      <span>Belum Punya Berkas? Buat dari Topik (AI)</span>
                    </button>
                  </div>

                  {isUploading && (
                    <div style={{ marginTop: 12, fontSize: 12, color: "#4b6623", fontWeight: 600 }}>
                      Mengekstrak teks dokumen ke memori...
                    </div>
                  )}
                  {uploadError && (
                    <div style={{ marginTop: 8, fontSize: 12, color: "#ef4444" }}>
                      Gagal mengunggah: {uploadError}
                    </div>
                  )}
                </div>

                {/* If a Document is Active, Show Clean Executive Overview Card */}
                {activeDocId ? (
                  <div
                    style={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #dde1da",
                      borderRadius: 12,
                      padding: "24px 26px",
                      marginBottom: 20,
                      boxShadow: "0 10px 35px rgba(27, 39, 35, 0.04)"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 800,
                              textTransform: "uppercase",
                              letterSpacing: "0.08em",
                              color: "#273f15",
                              backgroundColor: "#eef8db",
                              border: "1px solid #c2e28f",
                              padding: "3px 8px",
                              borderRadius: 4,
                              fontFamily: "'DM Mono', monospace"
                            }}
                          >
                            Modul Terindeks
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginTop: 8 }}>
                          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#17201d", letterSpacing: "-0.03em", margin: 0, lineHeight: 1.25 }}>
                            {activeDocTitle}
                          </h1>
                          <button
                            onClick={handleAutoDetectTitle}
                            disabled={isDetectingTitle}
                            style={{
                              backgroundColor: "#f4f6f2",
                              border: "1px solid #dce1da",
                              color: "#45544e",
                              borderRadius: 6,
                              padding: "4px 8px",
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: isDetectingTitle ? "not-allowed" : "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4
                            }}
                            title="Deteksi topik pembelajaran secara otomatis berdasarkan isi materi"
                          >
                            <Sparkles size={11} />
                            {isDetectingTitle ? "Mendeteksi..." : "Deteksi Judul dari Isi"}
                          </button>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                        <button
                          onClick={() => setIsEnrichModalOpen(true)}
                          disabled={isEnriching || !activeDocId}
                          style={{
                            backgroundColor: "#f0f6eb",
                            border: "1px solid #c2e28f",
                            color: "#22370c",
                            borderRadius: 8,
                            padding: "6px 12px",
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: isEnriching ? "not-allowed" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 6
                          }}
                          title="Cari referensi internet atau perluas materi dengan riset AI"
                        >
                          <Globe size={14} color="#4b6623" />
                          <span>{isEnriching ? "Meneliti..." : "Perkaya Materi (Web Search)"}</span>
                        </button>

                        <button
                          onClick={() => setShowRawText(!showRawText)}
                          style={{
                            backgroundColor: "#ffffff",
                            border: "1px solid #dce1da",
                            color: "#56615d",
                            borderRadius: 8,
                            padding: "6px 12px",
                            fontSize: 12,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 6
                          }}
                        >
                          {showRawText ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          {showRawText ? "Sembunyikan Teks Mentah" : "Lihat / Edit Teks Mentah"}
                        </button>
                      </div>
                    </div>

                    {/* Stats Metrics Bento Grid (Responsive 1-col mobile, 3-col desktop) */}
                    <div className="metrics-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 20 }}>
                      <div style={{ padding: "14px 16px", backgroundColor: "#f8f9f5", borderRadius: 10, border: "1px solid #dde1da" }}>
                        <div style={{ fontSize: 10.5, color: "#727d78", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.08em", fontFamily: "'DM Mono', monospace" }}>Total Kosakata</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: "#17201d", marginTop: 4, letterSpacing: "-0.02em" }}>
                          {wordCount.toLocaleString("id-ID")} <span style={{ fontSize: 12, fontWeight: 500, color: "#727d78" }}>kata</span>
                        </div>
                        <div style={{ fontSize: 11, color: "#8a9691", marginTop: 3 }}>{activeDocContent.length} karakter sumber</div>
                      </div>

                      <div style={{ padding: "14px 16px", backgroundColor: "#f8f9f5", borderRadius: 10, border: "1px solid #dde1da" }}>
                        <div style={{ fontSize: 10.5, color: "#727d78", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.08em", fontFamily: "'DM Mono', monospace" }}>Kartu Flashcard</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: "#22370c", marginTop: 4, letterSpacing: "-0.02em" }}>
                          {flashcards.length} <span style={{ fontSize: 12, fontWeight: 500, color: "#4b6623" }}>kartu</span>
                        </div>
                        <div style={{ fontSize: 11, color: "#8a9691", marginTop: 3 }}>Spaced repetition 3D</div>
                      </div>

                      <div style={{ padding: "14px 16px", backgroundColor: "#f8f9f5", borderRadius: 10, border: "1px solid #dde1da" }}>
                        <div style={{ fontSize: 10.5, color: "#727d78", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.08em", fontFamily: "'DM Mono', monospace" }}>Paket Latihan Soal</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: "#17201d", marginTop: 4, letterSpacing: "-0.02em" }}>
                          {quizQuestions.length} <span style={{ fontSize: 12, fontWeight: 500, color: "#4b6623" }}>butir</span>
                        </div>
                        <div style={{ fontSize: 11, color: "#8a9691", marginTop: 3 }}>Penalaran bertingkat HOTS</div>
                      </div>
                    </div>

                    {/* Quick Launch Buttons (Primary CTA vs Secondary Actions) */}
                    <div className="action-chips-grid" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <button
                        onClick={() => {
                          setActiveTab("quiz");
                          if (quizQuestions.length === 0) handleGenerateQuiz();
                        }}
                        style={{
                          backgroundColor: "#18221f",
                          color: "#c8f064",
                          border: "none",
                          borderRadius: 8,
                          padding: "12px 20px",
                          fontSize: 13.5,
                          fontWeight: 700,
                          letterSpacing: "-0.01em",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.15)"
                        }}
                      >
                        <Target size={16} />
                        Mulai Latihan Pilihan Ganda
                      </button>

                      <button
                        onClick={() => {
                          setActiveTab("feynman");
                        }}
                        style={{
                          backgroundColor: "#ffffff",
                          color: "#17201d",
                          border: "1px solid #dce1da",
                          borderRadius: 8,
                          padding: "11px 16px",
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 6
                        }}
                      >
                        <Brain size={15} color="#4b6623" />
                        Uji Feynman Sendiri
                      </button>

                      <button
                        onClick={() => {
                          setActiveTab("flashcards");
                          if (flashcards.length === 0) handleGenerateFlashcards();
                        }}
                        style={{
                          backgroundColor: "#ffffff",
                          color: "#17201d",
                          border: "1px solid #dce1da",
                          borderRadius: 8,
                          padding: "11px 16px",
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 6
                        }}
                      >
                        <Layers size={15} color="#4b6623" />
                        Buka Flashcards 3D
                      </button>

                      <button
                        onClick={() => {
                          setActiveTab("summary");
                          if (!activeDocSummary) handleGenerateSummary();
                        }}
                        style={{
                          backgroundColor: "#ffffff",
                          color: "#17201d",
                          border: "1px solid #dce1da",
                          borderRadius: 8,
                          padding: "11px 16px",
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 6
                        }}
                      >
                        <Sparkles size={15} color="#10b981" />
                        Baca Rangkuman
                      </button>
                    </div>

                    {/* 💡 Catatan Nara Insight Box (from Figma Make design) */}
                    <div className="insight-box">
                      <span className="nara-mini">N</span>
                      <div>
                        <strong style={{ fontSize: 11, color: "#18221f", fontWeight: 800 }}>
                          Catatan Nara · Panduan Belajar
                        </strong>
                        <p style={{ margin: "4px 0 0", color: "#56645e", fontSize: 12, lineHeight: "1.55" }}>
                          Kuasai konsep inti materi terlebih dahulu sebelum menguji diri lewat kuis. Jika ada kalimat atau bagian materi yang membingungkan, tanyakan langsung ke panel tutor Nara di sisi kanan.
                        </p>
                      </div>
                    </div>

                    {/* Collapsible Raw Text Editor */}
                    {showRawText && (
                      <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #dde1da" }}>
                        <div style={{ marginBottom: 12 }}>
                          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#45544e", marginBottom: 6 }}>
                            Ubah Judul Materi
                          </label>
                          <input
                            type="text"
                            value={activeDocTitle}
                            onChange={(e) => setActiveDocTitle(e.target.value)}
                            style={{
                              width: "100%",
                              backgroundColor: "#fafbf8",
                              border: "1px solid #dce1da",
                              borderRadius: 8,
                              padding: "10px 14px",
                              fontSize: 14,
                              color: "#17201d",
                              outline: "none"
                            }}
                          />
                        </div>

                        <div style={{ marginBottom: 14 }}>
                          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#45544e", marginBottom: 6 }}>
                            Teks Sumber Lengkap (Disimpan di latar belakang)
                          </label>
                          <textarea
                            rows={10}
                            value={activeDocContent}
                            onChange={(e) => setActiveDocContent(e.target.value)}
                            style={{
                              width: "100%",
                              backgroundColor: "#fafbf8",
                              border: "1px solid #dce1da",
                              borderRadius: 8,
                              padding: "12px",
                              fontSize: 13,
                              lineHeight: "1.6",
                              color: "#17201d",
                              fontFamily: "'DM Mono', monospace",
                              outline: "none",
                              resize: "vertical"
                            }}
                          />
                        </div>

                        <button
                          onClick={handleSaveDocument}
                          style={{
                            backgroundColor: "#18221f",
                            color: "#c8f064",
                            border: "none",
                            borderRadius: 8,
                            padding: "9px 18px",
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: "pointer"
                          }}
                        >
                          Simpan Perubahan Teks
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Manual Create / Initial State */
                  <div
                    style={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #dde1da",
                      borderRadius: 12,
                      padding: "24px 26px",
                      boxShadow: "0 10px 35px rgba(27, 39, 35, 0.04)"
                    }}
                  >
                    <h2 style={{ fontSize: 18, fontWeight: 800, color: "#17201d", marginBottom: 14 }}>
                      Tulis atau Tempel Catatan Manual
                    </h2>

                    <div style={{ marginBottom: 12 }}>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#45544e", marginBottom: 6 }}>
                        Judul Materi
                      </label>
                      <input
                        type="text"
                        value={activeDocTitle}
                        onChange={(e) => setActiveDocTitle(e.target.value)}
                        placeholder="Contoh: Sosiologi Konflik dan Resolusi..."
                        style={{
                          width: "100%",
                          backgroundColor: "#fafbf8",
                          border: "1px solid #dce1da",
                          borderRadius: 8,
                          padding: "10px 14px",
                          fontSize: 14,
                          color: "#17201d",
                          outline: "none"
                        }}
                      />
                    </div>

                    <div style={{ marginBottom: 14 }}>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#45544e", marginBottom: 6 }}>
                        Isi Catatan / Materi Teks
                      </label>
                      <textarea
                        rows={10}
                        value={activeDocContent}
                        onChange={(e) => setActiveDocContent(e.target.value)}
                        placeholder="Tempel catatan atau teks di sini..."
                        style={{
                          width: "100%",
                          backgroundColor: "#fafbf8",
                          border: "1px solid #dce1da",
                          borderRadius: 8,
                          padding: "12px",
                          fontSize: 14,
                          lineHeight: "1.6",
                          color: "#17201d",
                          outline: "none",
                          resize: "vertical"
                        }}
                      />
                    </div>

                    <button
                      onClick={handleSaveDocument}
                      style={{
                        backgroundColor: "#18221f",
                        color: "#c8f064",
                        border: "none",
                        borderRadius: 8,
                        padding: "10px 20px",
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: "pointer"
                      }}
                    >
                      Simpan Dokumen
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: MULTIPLE CHOICE QUIZ DRILL (LATIHAN SOAL PILIHAN GANDA) */}
            {activeTab === "quiz" && (
              <div style={{ maxWidth: 760, margin: "0 auto" }}>
                {/* Quiz Question Count Selector (Quick Presets + Stepper / Custom Number Input) */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    backgroundColor: "#ffffff",
                    border: "1px solid #dde1da",
                    borderRadius: 12,
                    padding: "12px 16px",
                    marginBottom: 16,
                    boxShadow: "0 10px 35px rgba(27, 39, 35, 0.04)",
                    flexWrap: "wrap",
                    gap: 10
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#45544e" }}>Jumlah Soal:</span>
                    {[3, 5, 10, 15, 20].map((num) => (
                      <button
                        key={num}
                        onClick={() => setQuizQuestionCount(num)}
                        style={{
                          backgroundColor: quizQuestionCount === num ? "#18221f" : "#fafbf8",
                          color: quizQuestionCount === num ? "#c8f064" : "#56615d",
                          border: `1px solid ${quizQuestionCount === num ? "#18221f" : "#dce1da"}`,
                          borderRadius: 6,
                          padding: "5px 10px",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                          transition: "all 0.15s ease"
                        }}
                      >
                        {num}
                      </button>
                    ))}

                    {/* Stepper / Custom Number Input */}
                    <div style={{ display: "inline-flex", alignItems: "center", backgroundColor: "#fafbf8", border: "1px solid #dce1da", borderRadius: 6, padding: "2px 4px", gap: 2 }}>
                      <button
                        onClick={() => setQuizQuestionCount((prev) => Math.max(1, prev - 1))}
                        style={{ background: "none", border: "none", color: "#56615d", cursor: "pointer", fontSize: 14, fontWeight: 700, padding: "0 6px" }}
                        title="Kurangi 1 soal"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={quizQuestionCount}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (!isNaN(val)) setQuizQuestionCount(Math.max(1, Math.min(30, val)));
                        }}
                        style={{
                          width: 38,
                          textAlign: "center",
                          backgroundColor: "transparent",
                          border: "none",
                          color: "#18221f",
                          fontSize: 13,
                          fontWeight: 700,
                          fontFamily: "'DM Mono', monospace",
                          outline: "none"
                        }}
                      />
                      <button
                        onClick={() => setQuizQuestionCount((prev) => Math.min(30, prev + 1))}
                        style={{ background: "none", border: "none", color: "#56615d", cursor: "pointer", fontSize: 14, fontWeight: 700, padding: "0 6px" }}
                        title="Tambah 1 soal"
                      >
                        +
                      </button>
                    </div>
                    <span style={{ fontSize: 11, color: "#727d78" }}>butir</span>

                    {/* Quiz Focus / Difficulty Selector */}
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 3, marginLeft: 6, backgroundColor: "#fafbf8", padding: 2, borderRadius: 6, border: "1px solid #dce1da" }}>
                      {[
                        { id: "beginner", label: "Pemula", title: "Pemula & Bertahap: Mulai dari angka kecil sederhana dan pilihan ringkas" },
                        { id: "conceptual", label: "Standar", title: "Standar Ujian Sekolah: Pemahaman konsep dan skenario harian" },
                        { id: "analytical", label: "HOTS", title: "HOTS / Ujian Seleksi: Analisis tingkat tinggi dan pemecahan masalah non-rutin" }
                      ].map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setQuizType(item.id as any)}
                          style={{
                            backgroundColor: quizType === item.id ? "#18221f" : "transparent",
                            color: quizType === item.id ? "#c8f064" : "#56615d",
                            border: quizType === item.id ? "1px solid #18221f" : "1px solid transparent",
                            borderRadius: 5,
                            padding: "4px 8px",
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: "pointer",
                            transition: "0.15s ease"
                          }}
                          title={item.title}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => handleGenerateQuiz()}
                    disabled={isGeneratingQuiz || !activeDocId}
                    style={{
                      backgroundColor: "#18221f",
                      color: "#c8f064",
                      border: "none",
                      borderRadius: 8,
                      padding: "8px 16px",
                      fontSize: 12.5,
                      fontWeight: 700,
                      cursor: isGeneratingQuiz ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)"
                    }}
                  >
                    <Sparkles size={13} />
                    {isGeneratingQuiz ? "Menyusun Soal..." : `Generate ${quizQuestionCount} Soal Baru`}
                  </button>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
                  <div>
                    <h2 style={{ fontSize: 19, fontWeight: 800, letterSpacing: "-0.02em", color: "#17201d" }}>
                      {isDrillingMistakes ? "Drill Khusus Soal yang Pernah Salah" : (quizMode === "exam" ? "Simulasi Tryout Ujian Asli" : "Simulasi Latihan Soal Pemahaman")}
                    </h2>
                    <p style={{ fontSize: 12, color: "#6f7975", marginTop: 2 }}>
                      {quizMode === "exam"
                        ? "Waktu berjalan mundur, lembar jawaban dinilai sekaligus setelah seluruh nomor selesai dikumpulkan."
                        : "Format pilihan ganda HOTS dengan pembahasan konsep dan analisis jebakan soal."}
                    </p>
                  </div>

                  {/* Mode Toggle Switch */}
                  {!isDrillingMistakes && (
                    <div style={{ display: "flex", alignItems: "center", gap: 4, backgroundColor: "#ffffff", border: "1px solid #dce1da", borderRadius: 8, padding: 3 }}>
                      <button
                        onClick={() => {
                          setQuizMode("study");
                          resetQuizState();
                        }}
                        style={{
                          backgroundColor: quizMode === "study" ? "#18221f" : "transparent",
                          color: quizMode === "study" ? "#c8f064" : "#6f7975",
                          border: quizMode === "study" ? "1px solid #18221f" : "1px solid transparent",
                          borderRadius: 6,
                          padding: "5px 10px",
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 5
                        }}
                      >
                        <BookOpen size={12} />
                        <span>Mode Belajar</span>
                      </button>
                      <button
                        onClick={() => {
                          setQuizMode("exam");
                          resetQuizState();
                          setExamTimeLeft(quizQuestions.length * 90);
                          setIsExamTimerRunning(true);
                          setExamDurationSeconds(quizQuestions.length * 90);
                        }}
                        style={{
                          backgroundColor: quizMode === "exam" ? "#fef3c7" : "transparent",
                          color: quizMode === "exam" ? "#b45309" : "#6f7975",
                          border: quizMode === "exam" ? "1px solid #f59e0b" : "1px solid transparent",
                          borderRadius: 6,
                          padding: "5px 10px",
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 5
                        }}
                      >
                        <Clock size={12} />
                        <span>Mode Tryout</span>
                        {quizMode === "exam" && (
                          <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700, color: "#b45309", marginLeft: 4 }}>
                            {Math.floor(examTimeLeft / 60)}:{(examTimeLeft % 60).toString().padStart(2, "0")}
                          </span>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {quizQuestions.length === 0 ? (
                  <div
                    style={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #dde1da",
                      borderRadius: 12,
                      padding: "36px 20px",
                      textAlign: "center",
                      boxShadow: "0 10px 35px rgba(27, 39, 35, 0.04)"
                    }}
                  >
                    <Target size={32} color="#727d78" style={{ margin: "0 auto 10px" }} />
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#17201d" }}>
                      Belum Ada Paket Latihan Soal
                    </div>
                    <p style={{ fontSize: 13, color: "#6f7975", maxWidth: 400, margin: "6px auto 16px" }}>
                      Pilih jumlah butir di atas dan biarkan AI menyusun paket soal penalaran bertingkat berdasarkan materi ini.
                    </p>
                    <button
                      onClick={() => handleGenerateQuiz()}
                      disabled={isGeneratingQuiz || !activeDocId}
                      style={{
                        backgroundColor: "#18221f",
                        color: "#c8f064",
                        border: "none",
                        borderRadius: 8,
                        padding: "10px 20px",
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: "pointer"
                      }}
                    >
                      {isGeneratingQuiz ? "Menyusun Soal..." : `Generate ${quizQuestionCount} Soal Sekarang`}
                    </button>
                  </div>
                ) : isQuizCompleted || (quizMode === "exam" && examSubmitted) ? (
                  /* Quiz / Exam Completed Screen */
                  <div
                    style={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #dde1da",
                      borderRadius: 12,
                      padding: "32px 20px",
                      textAlign: "center",
                      boxShadow: "0 10px 35px rgba(27, 39, 35, 0.04)"
                    }}
                  >
                    <Award size={40} color={quizMode === "exam" ? "#b45309" : "#4b6623"} style={{ margin: "0 auto 10px" }} />
                    <h3 style={{ fontSize: 20, fontWeight: 800, color: "#17201d" }}>
                      {quizMode === "exam" ? "Rapor Hasil Tryout Simulasi" : "Hasil Latihan Selesai"}
                    </h3>
                    <div style={{ fontSize: 44, fontWeight: 800, color: score >= 75 ? "#22370c" : "#b45309", margin: "12px 0", fontFamily: "'DM Mono', monospace" }}>
                      {score} / 100
                    </div>

                    <div style={{ display: "inline-flex", gap: 10, marginBottom: 16, fontSize: 12, fontWeight: 600 }}>
                      <span style={{ color: "#22370c", backgroundColor: "#eef8db", border: "1px solid #c2e28f", padding: "4px 10px", borderRadius: 999 }}>
                        {quizQuestions.filter((q, i) => userAnswers[i] === q.correctIndex).length} Benar
                      </span>
                      <span style={{ color: "#991b1b", backgroundColor: "#fef2f2", border: "1px solid #fecaca", padding: "4px 10px", borderRadius: 999 }}>
                        {quizQuestions.filter((q, i) => userAnswers[i] !== undefined && userAnswers[i] !== q.correctIndex).length} Salah
                      </span>
                      <span style={{ color: "#56615d", backgroundColor: "#f4f6f2", border: "1px solid #dce1da", padding: "4px 10px", borderRadius: 999 }}>
                        {quizQuestions.filter((q, i) => userAnswers[i] === undefined).length} Dilewati
                      </span>
                    </div>

                    <p style={{ fontSize: 13, color: "#6f7975", maxWidth: 420, margin: "0 auto 20px" }}>
                      {score >= 80
                        ? "Luar biasa! Tingkat pemahaman materi sangat tinggi dan memenuhi target kelulusan ujian."
                        : score >= 60
                        ? "Cukup baik. Soal-soal yang keliru telah otomatis dicatat ke Bank Soal Salah untuk dilatih ulang."
                        : "Perlu drill intensif. Buka Bank Soal Salah untuk membedah akar kekeliruan konsep."}
                    </p>

                    <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
                      <button
                        onClick={() => {
                          setExamSubmitted(false);
                          resetQuizState();
                        }}
                        style={{
                          backgroundColor: "#ffffff",
                          border: "1px solid #dce1da",
                          color: "#17201d",
                          borderRadius: 8,
                          padding: "10px 18px",
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: "pointer"
                        }}
                      >
                        Ulangi Tryout
                      </button>

                      {activeDocMistakes.length > 0 && (
                        <button
                          onClick={() => {
                            setMistakeFilterScope("current");
                            setActiveTab("mistakes");
                          }}
                          style={{
                            backgroundColor: "#fef2f2",
                            border: "1px solid #fecaca",
                            color: "#ef4444",
                            borderRadius: 8,
                            padding: "10px 18px",
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 6
                          }}
                        >
                          <AlertTriangle size={14} />
                          <span>Buka Bank Soal Salah ({activeDocMistakes.length})</span>
                        </button>
                      )}

                      <button
                        onClick={handleGenerateQuiz}
                        style={{
                          backgroundColor: "#18221f",
                          border: "none",
                          color: "#c8f064",
                          borderRadius: 8,
                          padding: "10px 18px",
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: "pointer"
                        }}
                      >
                        Paket Soal Baru
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Active Question Card */
                  <div>
                    {/* Exam Mode CBT Question Strip Navigation */}
                    {quizMode === "exam" && (
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14, padding: "10px 12px", backgroundColor: "#ffffff", border: "1px solid #dde1da", borderRadius: 10 }}>
                        {quizQuestions.map((q, idx) => {
                          const isAns = userAnswers[idx] !== undefined;
                          const isCur = currentQuestionIndex === idx;
                          const isFlg = !!examFlagged[idx];
                          return (
                            <button
                              key={idx}
                              onClick={() => {
                                setCurrentQuestionIndex(idx);
                                setSelectedOption(userAnswers[idx] !== undefined ? userAnswers[idx] : null);
                              }}
                              style={{
                                width: 34,
                                height: 34,
                                borderRadius: 6,
                                backgroundColor: isCur ? "#18221f" : (isFlg ? "#fef3c7" : (isAns ? "#eef8db" : "#fafbf8")),
                                color: isCur ? "#c8f064" : (isFlg ? "#b45309" : (isAns ? "#22370c" : "#56615d")),
                                border: isCur ? "2px solid #18221f" : (isFlg ? "1px solid #f59e0b" : (isAns ? "1px solid #8dbd42" : "1px solid #dce1da")),
                                fontSize: 12.5,
                                fontWeight: 700,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                position: "relative"
                              }}
                            >
                              {idx + 1}
                              {isFlg && <Flag size={8} color="#f59e0b" style={{ position: "absolute", top: -3, right: -2 }} />}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Header Progress Tracker */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#6f7975" }}>
                        Soal {currentQuestionIndex + 1} dari {quizQuestions.length}
                        {examFlagged[currentQuestionIndex] && (
                          <span style={{ color: "#b45309", marginLeft: 8, fontSize: 12, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}>
                            <Flag size={11} /> Ditandai Ragu-ragu
                          </span>
                        )}
                      </span>
                      {quizMode === "study" && (
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#22370c", backgroundColor: "#eef8db", padding: "2px 8px", borderRadius: 4, fontFamily: "'DM Mono', monospace" }}>
                          Skor: {score} Poin
                        </span>
                      )}
                    </div>

                    {/* Question Card */}
                    <div
                      style={{
                        backgroundColor: "#ffffff",
                        border: "1px solid #dde1da",
                        borderRadius: 12,
                        padding: "20px 16px",
                        marginBottom: 16,
                        boxShadow: "0 10px 35px rgba(27, 39, 35, 0.04)"
                      }}
                    >
                      <div style={{ fontSize: 16, fontWeight: 600, lineHeight: "1.6", color: "#17201d", marginBottom: currentQuestion?.formula ? 12 : 18 }}>
                        <MathView text={currentQuestion?.question} />
                      </div>

                      {/* Question Formula Card (Blackboard styling from Figma Make) */}
                      {currentQuestion?.formula && (
                        <div className="question-formula">
                          <MathView text={currentQuestion.formula} />
                        </div>
                      )}

                      {/* 5 Options (A, B, C, D, E) */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {currentQuestion?.options.map((opt, idx) => {
                          const optionLetter = String.fromCharCode(65 + idx);
                          const isSelected = selectedOption === idx;
                          const isCorrect = idx === currentQuestion.correctIndex;

                          let bgColor = "#fafbf8";
                          let borderColor = "#dfe4dc";
                          let textColor = "#56615d";
                          let shadow = "none";

                          if (quizMode === "study") {
                            if (isAnswerSubmitted) {
                              if (isCorrect) {
                                bgColor = "#eef8db";
                                borderColor = "#8dbd42";
                                textColor = "#22370c";
                              } else if (isSelected && !isCorrect) {
                                bgColor = "#fdf2f2";
                                borderColor = "#f87171";
                                textColor = "#991b1b";
                              } else {
                                textColor = "#9ca3af";
                                bgColor = "#f8f9f5";
                              }
                            }
                          } else {
                            if (isSelected) {
                              bgColor = "#18221f";
                              borderColor = "#18221f";
                              textColor = "#c8f064";
                            }
                          }

                          return (
                            <button
                              key={idx}
                              className="quiz-option-btn"
                              onClick={() => handleSelectQuizOption(idx)}
                              disabled={quizMode === "study" && isAnswerSubmitted}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                textAlign: "left",
                                gap: 12,
                                padding: "13px 15px",
                                minHeight: 48,
                                backgroundColor: bgColor,
                                border: `1px solid ${borderColor}`,
                                borderRadius: 10,
                                color: textColor,
                                fontSize: 13.5,
                                lineHeight: "1.5",
                                cursor: quizMode === "study" && isAnswerSubmitted ? "default" : "pointer",
                                transition: "all 0.15s ease",
                                boxShadow: shadow
                              }}
                            >
                              <div
                                style={{
                                  width: 26,
                                  height: 26,
                                  borderRadius: 6,
                                  backgroundColor: quizMode === "study" && isAnswerSubmitted && isCorrect ? "#8dbd42" : quizMode === "study" && isAnswerSubmitted && isSelected ? "#ef4444" : (quizMode === "exam" && isSelected ? "#c8f064" : "#ffffff"),
                                  color: (quizMode === "study" && isAnswerSubmitted && (isCorrect || isSelected)) ? "#ffffff" : (quizMode === "exam" && isSelected ? "#18221f" : "#17201d"),
                                  border: "1px solid #dce1da",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: 12,
                                  fontWeight: 700,
                                  fontFamily: "'DM Mono', monospace",
                                  flexShrink: 0
                                }}
                              >
                                {quizMode === "study" && isAnswerSubmitted && isCorrect ? (
                                  <Check size={14} />
                                ) : quizMode === "study" && isAnswerSubmitted && isSelected ? (
                                  <X size={14} />
                                ) : (
                                  optionLetter
                                )}
                              </div>
                              <MathView text={opt} style={{ flex: 1 }} />
                            </button>
                          );
                        })}
                      </div>

                      {/* Explanation & Pitfalls Box when answered (ONLY in Study Mode) */}
                      {quizMode === "study" && isAnswerSubmitted && (
                        <div
                          style={{
                            marginTop: 18,
                            padding: "16px",
                            backgroundColor: "#f8f9f5",
                            borderRadius: 12,
                            border: "1px solid #dde1da",
                            borderLeft: selectedOption === currentQuestion.correctIndex ? "3px solid #8dbd42" : "3px solid #ef4444"
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                            {selectedOption === currentQuestion.correctIndex ? (
                              <>
                                <CheckCircle2 size={16} color="#4b6623" />
                                <span style={{ fontSize: 13, fontWeight: 700, color: "#22370c" }}>Jawaban Anda Benar</span>
                              </>
                            ) : (
                              <>
                                <XCircle size={16} color="#ef4444" />
                                <span style={{ fontSize: 13, fontWeight: 700, color: "#991b1b" }}>
                                  Kunci Benar: Pilihan {String.fromCharCode(65 + currentQuestion.correctIndex)}
                                </span>
                              </>
                            )}
                          </div>

                          {/* 1. Formula Highlight Box (if available) */}
                          {currentQuestion.formula && (
                            <div
                              style={{
                                backgroundColor: "#1d2824",
                                border: "1px solid #34413c",
                                borderRadius: 10,
                                padding: "12px 16px",
                                marginBottom: 14
                              }}
                            >
                              <div
                                style={{
                                  fontSize: 10.5,
                                  fontWeight: 700,
                                  textTransform: "uppercase",
                                  letterSpacing: "0.08em",
                                  color: "#c8f064",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 6,
                                  marginBottom: 6,
                                  fontFamily: "'DM Mono', monospace"
                                }}
                              >
                                <Sparkles size={13} /> Rumus Kunci & Konsep Utama
                              </div>
                              <div style={{ textAlign: "center", fontSize: 16, color: "#e8eee9", padding: "4px 0" }}>
                                <MathView text={currentQuestion.formula} />
                              </div>
                            </div>
                          )}

                          {/* 2. Interactive Solution Stepper (from Figma Make design) */}
                          {currentQuestion.steps && currentQuestion.steps.length > 0 ? (
                            <div className="solution-panel">
                              <div className="solution-head">
                                <div>
                                  <span>PEMBAHASAN TERSTRUKTUR</span>
                                  <h3>Bedah Langkah Pengerjaan</h3>
                                </div>
                                <strong>{currentQuestion.steps.length} langkah</strong>
                              </div>

                              <div className="solution-stepper">
                                {currentQuestion.steps.map((st, sIdx) => (
                                  <button
                                    key={sIdx}
                                    type="button"
                                    className={`${solutionStep === sIdx ? "active" : ""} ${solutionStep > sIdx ? "passed" : ""}`}
                                    onClick={() => setSolutionStep(sIdx)}
                                  >
                                    <span>{solutionStep > sIdx ? "✓" : sIdx + 1}</span>
                                    <small>Langkah {sIdx + 1}</small>
                                  </button>
                                ))}
                              </div>

                              {(() => {
                                const activeSt = currentQuestion.steps[Math.min(solutionStep, currentQuestion.steps.length - 1)];
                                return (
                                  <div className="solution-content-card">
                                    <span>LANGKAH {Math.min(solutionStep, currentQuestion.steps.length - 1) + 1}</span>
                                    {activeSt.title && <h4><MathView text={activeSt.title} /></h4>}
                                    <p><MathView text={activeSt.desc} /></p>
                                    {activeSt.formula && (
                                      <div className="solution-formula-box">
                                        <MathView text={activeSt.formula} />
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}

                              <div className="solution-actions-row">
                                <button
                                  type="button"
                                  disabled={solutionStep === 0}
                                  onClick={() => setSolutionStep((s) => Math.max(0, s - 1))}
                                  style={{
                                    backgroundColor: "#ffffff",
                                    border: "1px solid #dce1da",
                                    color: solutionStep === 0 ? "#9ca3af" : "#17201d",
                                    cursor: solutionStep === 0 ? "not-allowed" : "pointer"
                                  }}
                                >
                                  <ChevronLeft size={14} /> Langkah Sebelumnya
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (solutionStep < currentQuestion.steps.length - 1) {
                                      setSolutionStep((s) => s + 1);
                                    } else {
                                      handleNextQuizQuestion();
                                    }
                                  }}
                                  style={{
                                    backgroundColor: "#18221f",
                                    border: "none",
                                    color: "#c8f064",
                                    cursor: "pointer"
                                  }}
                                >
                                  <span>{solutionStep === currentQuestion.steps.length - 1 ? "Soal Berikutnya" : "Langkah Lanjut"}</span>
                                  <ChevronRight size={14} />
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* Legacy / Standard Explanation */
                            <div style={{ fontSize: 13, color: "#45544e", lineHeight: "1.6", marginBottom: 10 }}>
                              <strong style={{ color: "#17201d" }}>Pembahasan: </strong>
                              <MathView text={currentQuestion.explanation} />
                            </div>
                          )}

                          {/* 3. Pitfalls & Trap Analysis */}
                          {currentQuestion.pitfall && (
                            <div
                              style={{
                                fontSize: 12,
                                color: "#92400e",
                                backgroundColor: "#fffbeb",
                                border: "1px solid #fde68a",
                                borderRadius: 8,
                                padding: "8px 12px",
                                display: "flex",
                                alignItems: "flex-start",
                                gap: 6
                              }}
                            >
                              <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 2 }} />
                              <span><strong>Analisis Jebakan: </strong><MathView text={currentQuestion.pitfall} /></span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Bottom Actions: Exam Mode Stepper vs Study Mode Action Bar */}
                    <div>
                      {quizMode === "exam" ? (
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginTop: 16 }}>
                          <button
                            onClick={handlePrevQuizQuestion}
                            disabled={currentQuestionIndex === 0}
                            style={{
                              backgroundColor: "#ffffff",
                              color: currentQuestionIndex === 0 ? "#9ca3af" : "#17201d",
                              border: "1px solid #dce1da",
                              borderRadius: 8,
                              padding: "10px 16px",
                              fontSize: 13,
                              fontWeight: 600,
                              cursor: currentQuestionIndex === 0 ? "not-allowed" : "pointer"
                            }}
                          >
                            ← Sebelumnya
                          </button>

                          <button
                            onClick={() => toggleFlagQuestion(currentQuestionIndex)}
                            style={{
                              backgroundColor: examFlagged[currentQuestionIndex] ? "#fef3c7" : "#ffffff",
                              color: examFlagged[currentQuestionIndex] ? "#b45309" : "#56615d",
                              border: examFlagged[currentQuestionIndex] ? "1px solid #f59e0b" : "1px solid #dce1da",
                              borderRadius: 8,
                              padding: "10px 14px",
                              fontSize: 12.5,
                              fontWeight: 600,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: 6
                            }}
                          >
                            <Flag size={13} />
                            <span>{examFlagged[currentQuestionIndex] ? "Batal Tandai" : "Tandai Ragu-ragu"}</span>
                          </button>

                          <div style={{ display: "flex", gap: 8 }}>
                            {currentQuestionIndex < quizQuestions.length - 1 && (
                              <button
                                onClick={handleNextQuizQuestion}
                                style={{
                                  backgroundColor: "#ffffff",
                                  color: "#17201d",
                                  border: "1px solid #dce1da",
                                  borderRadius: 8,
                                  padding: "10px 18px",
                                  fontSize: 13,
                                  fontWeight: 600,
                                  cursor: "pointer"
                                }}
                              >
                                Berikutnya →
                              </button>
                            )}

                            <button
                              onClick={handleExamSubmit}
                              style={{
                                backgroundColor: "#18221f",
                                color: "#c8f064",
                                border: "none",
                                borderRadius: 8,
                                padding: "10px 18px",
                                fontSize: 13,
                                fontWeight: 700,
                                cursor: "pointer",
                                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)"
                              }}
                            >
                              Kumpulkan Lembar Tryout
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="quiz-action-bar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginTop: 14 }}>
                          <button
                            className="quiz-ask-ai-btn"
                            onClick={() => setIsQuizChatOpen(!isQuizChatOpen)}
                            style={{
                              backgroundColor: isQuizChatOpen ? "#eef8db" : "#ffffff",
                              border: `1px solid ${isQuizChatOpen ? "#8dbd42" : "#dce1da"}`,
                              color: isQuizChatOpen ? "#22370c" : "#17201d",
                              borderRadius: 8,
                              padding: "10px 16px",
                              fontSize: 13,
                              fontWeight: 600,
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              transition: "all 0.15s ease"
                            }}
                          >
                            <MessageSquare size={14} color="#4b6623" />
                            {isQuizChatOpen
                              ? "Tutup Tanya AI"
                              : isAnswerSubmitted
                              ? "Diskusi & Tanya AI Soal Ini"
                              : "Minta Petunjuk / Tanya AI"}
                          </button>

                          {isAnswerSubmitted && (
                            <button
                              className="next-quiz-btn"
                              onClick={handleNextQuizQuestion}
                              style={{
                                backgroundColor: "#18221f",
                                color: "#c8f064",
                                border: "none",
                                borderRadius: 8,
                                padding: "11px 22px",
                                fontSize: 13,
                                fontWeight: 700,
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                boxShadow: "0 2px 10px rgba(0, 0, 0, 0.2)"
                              }}
                            >
                              {currentQuestionIndex < quizQuestions.length - 1 ? "Soal Berikutnya" : "Lihat Hasil Akhir"}
                              <ChevronRight size={16} />
                            </button>
                          )}
                        </div>
                      )}

                      {/* Inline AI Question Tutor Chat Drawer */}
                      {isQuizChatOpen && (
                        <div
                          style={{
                            marginTop: 16,
                            backgroundColor: "#111116",
                            border: "1px solid rgba(16, 185, 129, 0.3)",
                            borderRadius: 12,
                            padding: "18px",
                            boxShadow: "0 8px 30px rgba(0, 0, 0, 0.5)"
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <MessageSquare size={16} color="#10b981" />
                              <span style={{ fontSize: 14, fontWeight: 700, color: "#f4f4f5" }}>
                                Tutor Bedah Soal AI
                              </span>
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 700,
                                  textTransform: "uppercase",
                                  color: "#10b981",
                                  backgroundColor: "rgba(16, 185, 129, 0.12)",
                                  padding: "2px 8px",
                                  borderRadius: 999
                                }}
                              >
                                {isAnswerSubmitted ? "Konteks Kunci & Pembahasan" : "Mode Petunjuk Berpikir"}
                              </span>
                            </div>
                            <button
                              onClick={() => setIsQuizChatOpen(false)}
                              style={{ background: "none", border: "none", color: "#71717a", cursor: "pointer", padding: 4 }}
                              title="Tutup Chat"
                            >
                              <X size={16} />
                            </button>
                          </div>

                          {/* Quick suggestion chips */}
                          <div className="no-scrollbar" style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 10, WebkitOverflowScrolling: "touch" }}>
                            {(isAnswerSubmitted
                              ? [
                                  "Kenapa opsi yang saya pilih keliru?",
                                  "Jelaskan konsep soal ini pakai analogi sederhana",
                                  "Apa kata kunci utama untuk menjawab soal seperti ini?",
                                  "Apa beda mendasar opsi benar vs opsi pengecoh?"
                                ]
                              : [
                                  "Beri petunjuk cara menganalisis soal ini tanpa bocorkan kunci",
                                  "Apa arti istilah teknis dalam soal ini?",
                                  "Apa langkah eliminasi opsi yang tepat?",
                                  "Jelaskan materi terkait soal ini secara ringkas"
                                ]
                            ).map((chip, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleSendQuizQuestionChat(chip)}
                                disabled={isQuizChatSending}
                                style={{
                                  whiteSpace: "nowrap",
                                  backgroundColor: "#16161d",
                                  border: "1px solid rgba(255, 255, 255, 0.08)",
                                  color: "#a1a1aa",
                                  borderRadius: 999,
                                  padding: "4px 10px",
                                  fontSize: 11,
                                  cursor: isQuizChatSending ? "not-allowed" : "pointer",
                                  flexShrink: 0
                                }}
                              >
                                {chip}
                              </button>
                            ))}
                          </div>

                          {/* Chat messages thread */}
                          <div style={{ maxHeight: 280, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, marginBottom: 12, paddingRight: 4 }}>
                            {(!quizChatMessages[currentQuestionIndex] || quizChatMessages[currentQuestionIndex].length === 0) ? (
                              <div style={{ fontSize: 12.5, color: "#71717a", padding: "12px 0", textAlign: "center" }}>
                                {isAnswerSubmitted
                                  ? "Ada yang membingungkan dari pembahasan? Tanyakan ke AI atau ketuk salah satu pertanyaan cepat di atas."
                                  : "Bingung cara menjawab soal ini? Ketuk salah satu petunjuk cepat di atas atau tanyakan ke AI."}
                              </div>
                            ) : (
                              quizChatMessages[currentQuestionIndex].map((m, i) => {
                                const isUser = m.role === "user";
                                return (
                                  <div
                                    key={i}
                                    style={{
                                      alignSelf: isUser ? "flex-end" : "flex-start",
                                      maxWidth: "88%",
                                      backgroundColor: isUser ? "#10b981" : "#16161d",
                                      color: isUser ? "#09090b" : "#d4d4d8",
                                      border: isUser ? "none" : "1px solid rgba(255, 255, 255, 0.08)",
                                      borderRadius: 10,
                                      padding: "10px 14px",
                                      fontSize: 13,
                                      lineHeight: "1.55",
                                      whiteSpace: "pre-wrap"
                                    }}
                                  >
                                    <MathView text={m.content} />
                                  </div>
                                );
                              })
                            )}
                            {isQuizChatSending && (
                              <div
                                style={{
                                  alignSelf: "flex-start",
                                  backgroundColor: "#16161d",
                                  border: "1px solid rgba(255, 255, 255, 0.08)",
                                  borderRadius: 10,
                                  padding: "8px 12px",
                                  fontSize: 12,
                                  color: "#10b981"
                                }}
                              >
                                Tutor AI sedang menganalisis soal dan opsi...
                              </div>
                            )}
                          </div>

                          {/* Chat input box */}
                          <div style={{ display: "flex", gap: 8 }}>
                            <input
                              type="text"
                              value={quizChatInput}
                              onChange={(e) => setQuizChatInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault();
                                  handleSendQuizQuestionChat();
                                }
                              }}
                              placeholder={isAnswerSubmitted ? "Tanyakan hal spesifik tentang pembahasan..." : "Minta petunjuk atau klarifikasi soal..."}
                              style={{
                                flex: 1,
                                backgroundColor: "#16161d",
                                border: "1px solid rgba(255, 255, 255, 0.1)",
                                borderRadius: 8,
                                padding: "9px 12px",
                                fontSize: 13,
                                color: "#f4f4f5",
                                outline: "none"
                              }}
                            />
                            <button
                              onClick={() => handleSendQuizQuestionChat()}
                              disabled={isQuizChatSending || !quizChatInput.trim()}
                              style={{
                                backgroundColor: "#10b981",
                                color: "#09090b",
                                border: "none",
                                borderRadius: 8,
                                padding: "0 14px",
                                fontSize: 12.5,
                                fontWeight: 700,
                                cursor: isQuizChatSending || !quizChatInput.trim() ? "not-allowed" : "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: 4
                              }}
                            >
                              <Send size={13} />
                              <span>Kirim</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB: BANK SOAL SALAH (MISTAKE NOTEBOOK) */}
            {activeTab === "mistakes" && (
              <div style={{ maxWidth: 780, margin: "0 auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <AlertTriangle size={20} color="#b45309" />
                      <h2 style={{ fontSize: 19, fontWeight: 800, letterSpacing: "-0.02em", color: "#17201d" }}>
                        Buku Dosa & Bank Soal Salah ({displayedMistakes.length})
                      </h2>
                    </div>
                    <p style={{ fontSize: 12.5, color: "#6f7975", marginTop: 4 }}>
                      Daftar soal yang pernah Anda jawab keliru. Latih ulang secara terarah hingga konsep 100% tuntas dikuasai.
                    </p>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {/* Scope Filter Buttons: Modul Ini vs Semua Modul */}
                    {activeDocId && (
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 3, backgroundColor: "#fafbf8", padding: 2, borderRadius: 6, border: "1px solid #dce1da" }}>
                        <button
                          onClick={() => setMistakeFilterScope("current")}
                          style={{
                            backgroundColor: mistakeFilterScope === "current" ? "#18221f" : "transparent",
                            color: mistakeFilterScope === "current" ? "#c8f064" : "#56615d",
                            border: mistakeFilterScope === "current" ? "1px solid #18221f" : "1px solid transparent",
                            borderRadius: 5,
                            padding: "4px 10px",
                            fontSize: 11.5,
                            fontWeight: 700,
                            cursor: "pointer",
                            transition: "0.15s ease"
                          }}
                          title="Tampilkan hanya soal salah dari materi aktif"
                        >
                          Modul Ini ({activeDocMistakes.length})
                        </button>
                        <button
                          onClick={() => setMistakeFilterScope("all")}
                          style={{
                            backgroundColor: mistakeFilterScope === "all" ? "#18221f" : "transparent",
                            color: mistakeFilterScope === "all" ? "#c8f064" : "#56615d",
                            border: mistakeFilterScope === "all" ? "1px solid #18221f" : "1px solid transparent",
                            borderRadius: 5,
                            padding: "4px 10px",
                            fontSize: 11.5,
                            fontWeight: 700,
                            cursor: "pointer",
                            transition: "0.15s ease"
                          }}
                          title="Tampilkan seluruh catatan soal salah dari semua modul"
                        >
                          Semua Modul ({mistakes.length})
                        </button>
                      </div>
                    )}

                    {displayedMistakes.length > 0 && (
                      <button
                        onClick={startMistakeDrill}
                        style={{
                          backgroundColor: "#18221f",
                          color: "#c8f064",
                          border: "none",
                          borderRadius: 8,
                          padding: "9px 16px",
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)"
                        }}
                      >
                        <Target size={14} />
                        <span>Drill {mistakeFilterScope === "current" && activeDocId ? "Soal Modul Ini" : "Semua Soal"} ({displayedMistakes.length})</span>
                      </button>
                    )}
                  </div>
                </div>

                {displayedMistakes.length === 0 ? (
                  <div
                    style={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #dde1da",
                      borderRadius: 12,
                      padding: "48px 24px",
                      textAlign: "center",
                      boxShadow: "0 10px 35px rgba(27, 39, 35, 0.04)"
                    }}
                  >
                    <Check size={36} color="#4b6623" style={{ margin: "0 auto 12px" }} />
                    <h3 style={{ fontSize: 18, fontWeight: 800, color: "#17201d" }}>
                      {mistakeFilterScope === "current" && activeDocId
                        ? `Buku Dosa Bersih untuk "${activeDocTitle || "Modul Ini"}"!`
                        : "Buku Dosa Bersih!"}
                    </h3>
                    <p style={{ fontSize: 13, color: "#6f7975", maxWidth: 440, margin: "6px auto 16px" }}>
                      {mistakeFilterScope === "current" && activeDocId && mistakes.length > 0
                        ? `Tidak ada soal yang salah pada modul ini. (Terdapat ${mistakes.length} catatan soal salah di modul lain).`
                        : "Belum ada catatan soal yang keliru, atau semua soal salah telah berhasil Anda kuasai. Lanjutkan latihan mandiri dengan paket soal baru!"}
                    </p>
                    <button
                      onClick={() => setActiveTab("quiz")}
                      style={{
                        backgroundColor: "#18221f",
                        color: "#c8f064",
                        border: "none",
                        borderRadius: 8,
                        padding: "9px 16px",
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: "pointer"
                      }}
                    >
                      Buka Latihan Soal
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {displayedMistakes.map((m, idx) => (
                      <div
                        key={m.id}
                        style={{
                          backgroundColor: "#ffffff",
                          border: "1px solid #dde1da",
                          borderRadius: 12,
                          padding: "22px 26px",
                          boxShadow: "0 10px 35px rgba(27, 39, 35, 0.04)"
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 800,
                              textTransform: "uppercase",
                              letterSpacing: "0.08em",
                              color: "#b45309",
                              backgroundColor: "#fef3c7",
                              border: "1px solid #fde68a",
                              padding: "3px 8px",
                              borderRadius: 4,
                              fontFamily: "'DM Mono', monospace"
                            }}
                          >
                            {m.docTitle || "Latihan Mandiri"} • Nomor {idx + 1}
                          </span>
                          <span style={{ fontSize: 11, color: "#8a9691", fontFamily: "'DM Mono', monospace" }}>
                            Dicatat {new Date(m.createdAt).toLocaleDateString("id-ID")}
                          </span>
                        </div>

                        <div style={{ fontSize: 15.5, fontWeight: 600, color: "#17201d", lineHeight: "1.6", marginBottom: 14 }}>
                          <MathView text={m.question} />
                        </div>

                        {/* User answer vs Key comparison */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                          <div
                            style={{
                              backgroundColor: "#fdf2f2",
                              border: "1px solid #fecaca",
                              borderRadius: 8,
                              padding: "10px 12px"
                            }}
                          >
                            <div style={{ fontSize: 11, fontWeight: 700, color: "#991b1b", textTransform: "uppercase", marginBottom: 4 }}>
                              Jawaban Anda (Keliru)
                            </div>
                            <div style={{ fontSize: 13, color: "#b91c1c" }}>
                              {m.options && m.options[m.userAnswerIndex] ? (
                                <MathView text={m.options[m.userAnswerIndex]} />
                              ) : (
                                "Tidak terjawab"
                              )}
                            </div>
                          </div>

                          <div
                            style={{
                              backgroundColor: "#eef8db",
                              border: "1px solid #c2e28f",
                              borderRadius: 8,
                              padding: "10px 12px"
                            }}
                          >
                            <div style={{ fontSize: 11, fontWeight: 700, color: "#22370c", textTransform: "uppercase", marginBottom: 4 }}>
                              Kunci Jawaban Benar
                            </div>
                            <div style={{ fontSize: 13, color: "#273f15" }}>
                              {m.options && m.options[m.correctIndex] ? (
                                <MathView text={m.options[m.correctIndex]} />
                              ) : (
                                "Opsi Benar"
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Formula Box if present */}
                        {m.formula && (
                          <div
                            style={{
                              backgroundColor: "#1d2824",
                              border: "1px solid #34413c",
                              borderRadius: 10,
                              padding: "10px 14px",
                              marginBottom: 12
                            }}
                          >
                            <div style={{ fontSize: 10.5, fontWeight: 700, color: "#c8f064", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4, fontFamily: "'DM Mono', monospace" }}>
                              Rumus Utama
                            </div>
                            <div style={{ textAlign: "center", fontSize: 14, color: "#e8eee9" }}>
                              <MathView text={m.formula} />
                            </div>
                          </div>
                        )}

                        {/* Steps if present */}
                        {m.steps && m.steps.length > 0 ? (
                          <div style={{ marginBottom: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                            {m.steps.map((st, sIdx) => (
                              <div
                                key={sIdx}
                                style={{
                                  backgroundColor: "#f8f9f5",
                                  border: "1px solid #dde1da",
                                  borderRadius: 8,
                                  padding: "8px 12px",
                                  fontSize: 12.5,
                                  color: "#17201d",
                                  display: "flex",
                                  gap: 8
                                }}
                              >
                                <span style={{ fontWeight: 800, color: "#22370c", fontFamily: "'DM Mono', monospace" }}>{st.step || (sIdx + 1)}.</span>
                                <div>
                                  {st.title && <strong style={{ color: "#17201d" }}>{st.title}: </strong>}
                                  <MathView text={st.desc} />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          m.explanation && (
                            <div style={{ fontSize: 12.5, color: "#45544e", backgroundColor: "#f8f9f5", border: "1px solid #dde1da", padding: "10px 12px", borderRadius: 8, marginBottom: 12 }}>
                              <strong style={{ color: "#17201d" }}>Pembahasan: </strong>
                              <MathView text={m.explanation} />
                            </div>
                          )
                        )}

                        {/* Pitfall callout */}
                        {m.pitfall && (
                          <div
                            style={{
                              fontSize: 12,
                              color: "#92400e",
                              backgroundColor: "#fffbeb",
                              border: "1px solid #fde68a",
                              borderRadius: 8,
                              padding: "8px 12px",
                              marginBottom: 14,
                              display: "flex",
                              gap: 6
                            }}
                          >
                            <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1, color: "#b45309" }} />
                            <div>
                              <strong>Penyebab Kesalahan: </strong>
                              <MathView text={m.pitfall} />
                            </div>
                          </div>
                        )}

                        {/* Action buttons */}
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                          <button
                            onClick={() => deleteMistake(m.id)}
                            style={{
                              backgroundColor: "#ffffff",
                              border: "1px solid #dce1da",
                              color: "#6f7975",
                              borderRadius: 6,
                              padding: "6px 12px",
                              fontSize: 12,
                              cursor: "pointer"
                            }}
                          >
                            Hapus
                          </button>
                          <button
                            onClick={() => resolveMistake(m.id)}
                            style={{
                              backgroundColor: "#eef8db",
                              border: "1px solid #c2e28f",
                              color: "#22370c",
                              borderRadius: 6,
                              padding: "6px 12px",
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: 5
                            }}
                          >
                            <Check size={12} />
                            <span>Tandai Sudah Paham & Hapus</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: ACTIVE RECALL FEYNMAN EVALUATOR */}
            {activeTab === "feynman" && (
              <div style={{ maxWidth: 780, margin: "0 auto" }}>
                <div style={{ marginBottom: 18 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Brain size={20} color="#4b6623" />
                    <h2 style={{ fontSize: 19, fontWeight: 800, letterSpacing: "-0.02em", color: "#17201d" }}>
                      Mode Feynman: Uji Pemahaman Sendiri
                    </h2>
                  </div>
                  <p style={{ fontSize: 12.5, color: "#6f7975", marginTop: 4 }}>
                    Jelaskan kembali suatu konsep dengan kata-kata sendiri. AI akan menguji akurasi, mendeteksi miskonsepsi, dan memberi analogi pengunci memori.
                  </p>
                </div>

                <div
                  style={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #dde1da",
                    borderRadius: 12,
                    padding: "24px 26px",
                    marginBottom: 18,
                    boxShadow: "0 10px 35px rgba(27, 39, 35, 0.04)"
                  }}
                >
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#45544e", marginBottom: 6 }}>
                      Konsep atau Istilah yang Ingin Dijelaskan
                    </label>
                    <input
                      type="text"
                      value={feynmanTopic}
                      onChange={(e) => setFeynmanTopic(e.target.value)}
                      placeholder="Contoh: Arbitrase vs Mediasi, Hukum Permintaan..."
                      style={{
                        width: "100%",
                        backgroundColor: "#fafbf8",
                        border: "1px solid #dce1da",
                        borderRadius: 8,
                        padding: "10px 14px",
                        fontSize: 14,
                        color: "#17201d",
                        outline: "none"
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#45544e", marginBottom: 6 }}>
                      Penjelasan Anda (Gunakan bahasa sendiri)
                    </label>
                    <textarea
                      rows={5}
                      value={feynmanExplanation}
                      onChange={(e) => setFeynmanExplanation(e.target.value)}
                      placeholder="Tuliskan pemahaman Anda di sini seperti menjelaskan ke teman..."
                      style={{
                        width: "100%",
                        backgroundColor: "#fafbf8",
                        border: "1px solid #dce1da",
                        borderRadius: 8,
                        padding: "12px 14px",
                        fontSize: 14,
                        lineHeight: "1.6",
                        color: "#17201d",
                        outline: "none",
                        resize: "vertical"
                      }}
                    />
                  </div>

                  <button
                    onClick={handleEvaluateFeynman}
                    disabled={isEvaluatingFeynman || !feynmanExplanation.trim()}
                    style={{
                      backgroundColor: "#18221f",
                      color: "#c8f064",
                      border: "none",
                      borderRadius: 8,
                      padding: "10px 18px",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: isEvaluatingFeynman || !feynmanExplanation.trim() ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6
                    }}
                  >
                    <Sparkles size={15} />
                    {isEvaluatingFeynman ? "Mengevaluasi Penjelasan..." : "Uji & Nilai Pemahaman Saya"}
                  </button>
                </div>

                {/* Feynman Evaluation Feedback Card */}
                {feynmanResult && (
                  <div
                    style={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #dde1da",
                      borderRadius: 12,
                      padding: "24px 26px",
                      boxShadow: "0 10px 35px rgba(27, 39, 35, 0.04)"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                      <div>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 800,
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                            color: "#22370c",
                            backgroundColor: "#eef8db",
                            border: "1px solid #c2e28f",
                            padding: "3px 8px",
                            borderRadius: 4,
                            fontFamily: "'DM Mono', monospace"
                          }}
                        >
                          {feynmanResult.verdict}
                        </span>
                        <h3 style={{ fontSize: 17, fontWeight: 800, color: "#17201d", marginTop: 6 }}>
                          Analisis Retensi Memori Aktif
                        </h3>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 28, fontWeight: 800, color: "#22370c", fontFamily: "'DM Mono', monospace" }}>
                          {feynmanResult.score}%
                        </div>
                        <div style={{ fontSize: 10, color: "#727d78" }}>Tingkat Akurasi</div>
                      </div>
                    </div>

                    {/* Accurate Points */}
                    {feynmanResult.accuratePoints?.length > 0 && (
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#22370c", textTransform: "uppercase", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                          <CheckCircle2 size={14} color="#4b6623" /> Poin yang Dipahami dengan Tepat
                        </div>
                        <ul style={{ paddingLeft: 18, fontSize: 13, color: "#17201d", lineHeight: "1.6" }}>
                          {feynmanResult.accuratePoints.map((pt, i) => (
                            <li key={i}><MathView text={pt} /></li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Missed Nuances */}
                    {feynmanResult.missedOrFlawedPoints?.length > 0 && (
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#b45309", textTransform: "uppercase", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                          <AlertTriangle size={14} color="#f59e0b" /> Bagian yang Kurang Presisi / Terlewat
                        </div>
                        <ul style={{ paddingLeft: 18, fontSize: 13, color: "#45544e", lineHeight: "1.6" }}>
                          {feynmanResult.missedOrFlawedPoints.map((pt, i) => (
                            <li key={i}><MathView text={pt} /></li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Perfect Analogy Box */}
                    {feynmanResult.perfectAnalogy && (
                      <div
                        style={{
                          backgroundColor: "#eef8db",
                          border: "1px solid #c2e28f",
                          borderRadius: 8,
                          padding: "12px 14px",
                          marginBottom: 14
                        }}
                      >
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#22370c", display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                          <Lightbulb size={15} color="#4b6623" /> Analogi Pengunci Memori
                        </div>
                        <div style={{ fontSize: 13, color: "#273f15", lineHeight: "1.55" }}>
                          <MathView text={feynmanResult.perfectAnalogy} />
                        </div>
                      </div>
                    )}

                    {/* Overall Coach Feedback */}
                    <div style={{ fontSize: 13, color: "#45544e", lineHeight: "1.6", borderTop: "1px solid #dde1da", paddingTop: 12 }}>
                      <strong style={{ color: "#17201d" }}>Catatan Mentor: </strong>
                      <MathView text={feynmanResult.feedback} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: 3D INTERACTIVE FLASHCARDS */}
            {activeTab === "flashcards" && (
              <div style={{ maxWidth: 740, margin: "0 auto" }}>
                {/* Flashcard Header Controls */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <h2 style={{ fontSize: 19, fontWeight: 800, letterSpacing: "-0.02em", color: "#17201d" }}>
                      Review Spaced Repetition 3D
                    </h2>
                    <p style={{ fontSize: 12, color: "#6f7975", marginTop: 2 }}>
                      Sentuh kartu untuk membalik sisi pertanyaan dan jawaban.
                    </p>
                  </div>
                  <button
                    onClick={handleGenerateFlashcards}
                    disabled={isGeneratingCards}
                    style={{
                      backgroundColor: "#18221f",
                      border: "none",
                      color: "#c8f064",
                      borderRadius: 8,
                      padding: "8px 14px",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: isGeneratingCards ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6
                    }}
                  >
                    <Sparkles size={14} />
                    {isGeneratingCards ? "Menganalisis..." : "Buat Kartu Baru"}
                  </button>
                </div>

                {/* Empty State */}
                {flashcards.length === 0 ? (
                  <div
                    style={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #dde1da",
                      borderRadius: 12,
                      padding: "36px 20px",
                      textAlign: "center",
                      boxShadow: "0 10px 35px rgba(27, 39, 35, 0.04)"
                    }}
                  >
                    <Layers size={32} color="#727d78" style={{ margin: "0 auto 10px" }} />
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#17201d" }}>
                      Belum Ada Flashcards
                    </div>
                    <p style={{ fontSize: 13, color: "#6f7975", maxWidth: 400, margin: "6px auto 16px" }}>
                      Gunakan tombol di atas agar AI membaca materi dan menyusun kartu pertanyaan dengan animasi 3D.
                    </p>
                    <button
                      onClick={handleGenerateFlashcards}
                      disabled={isGeneratingCards}
                      style={{
                        backgroundColor: "#18221f",
                        color: "#c8f064",
                        border: "none",
                        borderRadius: 8,
                        padding: "10px 20px",
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: "pointer"
                      }}
                    >
                      Ekstrak Kartu Sekarang
                    </button>
                  </div>
                ) : (
                  <div>
                    {/* Progress Bar & Indicators */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#6f7975", fontFamily: "'DM Mono', monospace" }}>
                        Kartu {currentCardIndex + 1} dari {flashcards.length}
                      </span>
                      <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                        {flashcards.map((fc, i) => (
                          <div
                            key={fc.id}
                            style={{
                              width: i === currentCardIndex ? 18 : 6,
                              height: 6,
                              borderRadius: 4,
                              transition: "all 0.2s ease",
                              backgroundColor:
                                i === currentCardIndex
                                  ? "#65a30d"
                                  : fc.difficulty === "easy"
                                  ? "#0ea5e9"
                                  : fc.difficulty === "good"
                                  ? "#72a728"
                                  : fc.difficulty === "hard"
                                  ? "#f59e0b"
                                  : fc.difficulty === "again"
                                  ? "#ef4444"
                                  : "#dce1da"
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* 3D Spatial Flip Card Container */}
                    <div className="flashcard-stage">
                      <div
                        className={`flashcard-card ${isFlipped ? "flipped" : ""}`}
                        onClick={() => setIsFlipped(!isFlipped)}
                      >
                        {/* Front Face: Concept & Question */}
                        <div className="flashcard-face flashcard-front">
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 800,
                                textTransform: "uppercase",
                                letterSpacing: "0.08em",
                                color: "#22370c",
                                backgroundColor: "#eef8db",
                                border: "1px solid #c2e28f",
                                padding: "3px 8px",
                                borderRadius: 4,
                                fontFamily: "'DM Mono', monospace"
                              }}
                            >
                              Konsep / Istilah Kunci
                            </span>
                            <span style={{ fontSize: 11, color: "#4b5563", display: "flex", alignItems: "center", gap: 4 }}>
                              <RotateCw size={12} />
                              Sentuh untuk balik
                            </span>
                          </div>

                          <div className="card-q" style={{ fontSize: 18, fontWeight: 700, lineHeight: "1.45", color: "#17201d", margin: "20px 0" }}>
                            <MathView text={currentCard?.front} />
                          </div>

                          <div style={{ fontSize: 11, color: "#4b5563", fontFamily: "'DM Mono', monospace" }}>
                            Status penguasaan: {currentCard?.difficulty || "Baru"}
                          </div>
                        </div>

                        {/* Back Face: Answer & Resolution */}
                        <div className="flashcard-face flashcard-back">
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 800,
                                textTransform: "uppercase",
                                letterSpacing: "0.08em",
                                color: "#c8f064",
                                backgroundColor: "rgba(200, 240, 100, 0.15)",
                                border: "1px solid #34413c",
                                padding: "3px 8px",
                                borderRadius: 4,
                                fontFamily: "'DM Mono', monospace"
                              }}
                            >
                              Definisi & Kaidah Inti
                            </span>
                            <span style={{ fontSize: 11, color: "#c8f064", display: "flex", alignItems: "center", gap: 4 }}>
                              <RotateCw size={12} />
                              Sentuh kembali
                            </span>
                          </div>

                          <div style={{ fontSize: 15, fontWeight: 500, lineHeight: "1.6", color: "#eff5ec", margin: "20px 0" }}>
                            <MathView text={currentCard?.back} />
                          </div>

                          <div style={{ fontSize: 11, color: "#c8f064", fontFamily: "'DM Mono', monospace" }}>
                            Beri nilai penguasaan di bawah
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Flip and Navigation Button */}
                    <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 16 }}>
                      <button
                        onClick={() => {
                          if (currentCardIndex > 0) {
                            setIsFlipped(false);
                            setCurrentCardIndex(currentCardIndex - 1);
                          }
                        }}
                        disabled={currentCardIndex === 0}
                        style={{
                          backgroundColor: "#ffffff",
                          border: "1px solid #dce1da",
                          color: currentCardIndex === 0 ? "#9ca3af" : "#17201d",
                          borderRadius: 8,
                          padding: "8px 14px",
                          fontSize: 12,
                          cursor: currentCardIndex === 0 ? "not-allowed" : "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 4
                        }}
                      >
                        <ChevronLeft size={14} /> Sebelumnya
                      </button>

                      <button
                        onClick={() => setIsFlipped(!isFlipped)}
                        style={{
                          backgroundColor: "#ffffff",
                          border: "1px solid #dce1da",
                          color: "#17201d",
                          borderRadius: 8,
                          padding: "8px 16px",
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 6
                        }}
                      >
                        <RotateCw size={13} /> Balik Kartu
                      </button>

                      <button
                        onClick={() => {
                          if (currentCardIndex < flashcards.length - 1) {
                            setIsFlipped(false);
                            setCurrentCardIndex(currentCardIndex + 1);
                          }
                        }}
                        disabled={currentCardIndex === flashcards.length - 1}
                        style={{
                          backgroundColor: "#ffffff",
                          border: "1px solid #dce1da",
                          color: currentCardIndex === flashcards.length - 1 ? "#9ca3af" : "#17201d",
                          borderRadius: 8,
                          padding: "8px 14px",
                          fontSize: 12,
                          cursor: currentCardIndex === flashcards.length - 1 ? "not-allowed" : "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 4
                        }}
                      >
                        Berikutnya <ChevronRight size={14} />
                      </button>
                    </div>

                    {/* Spaced Repetition Grading Actions */}
                    <div style={{ marginTop: 20, padding: "16px", backgroundColor: "#ffffff", borderRadius: 12, border: "1px solid #dde1da", boxShadow: "0 10px 35px rgba(27, 39, 35, 0.04)" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#6f7975", textAlign: "center", marginBottom: 10 }}>
                        Beri Nilai Pemahaman Untuk Algoritma Pengulangan
                      </div>
                      <div className="spaced-rep-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                        <button
                          onClick={() => handleReviewCard("again")}
                          style={{
                            backgroundColor: "#fdf2f2",
                            border: "1px solid #fecaca",
                            color: "#991b1b",
                            borderRadius: 8,
                            padding: "10px 0",
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer"
                          }}
                        >
                          Ulangi
                        </button>
                        <button
                          onClick={() => handleReviewCard("hard")}
                          style={{
                            backgroundColor: "#fffbeb",
                            border: "1px solid #fde68a",
                            color: "#92400e",
                            borderRadius: 8,
                            padding: "10px 0",
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer"
                          }}
                        >
                          Sulit
                        </button>
                        <button
                          onClick={() => handleReviewCard("good")}
                          style={{
                            backgroundColor: "#eef8db",
                            border: "1px solid #c2e28f",
                            color: "#22370c",
                            borderRadius: 8,
                            padding: "10px 0",
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer"
                          }}
                        >
                          Baik
                        </button>
                        <button
                          onClick={() => handleReviewCard("easy")}
                          style={{
                            backgroundColor: "#f0fdf4",
                            border: "1px solid #bbf7d0",
                            color: "#166534",
                            borderRadius: 8,
                            padding: "10px 0",
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer"
                          }}
                        >
                          Mudah
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: BEAUTIFULLY PARSED MARKDOWN SUMMARY + AUDIO TTS */}
            {activeTab === "summary" && (
              <div style={{ maxWidth: 840, margin: "0 auto" }}>
                {/* Summary Style Selection Pills */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14, flexWrap: "wrap", backgroundColor: "#fafbf8", padding: "8px 12px", borderRadius: 8, border: "1px solid #dde1da" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#6f7975", textTransform: "uppercase", letterSpacing: "0.06em", marginRight: 4 }}>
                    Gaya Rangkuman:
                  </span>
                  {[
                    { id: "tutor", label: "Tutor Bertahap & Latihan", desc: "Panduan bertahap dari nol, contoh angka/kasus nyata, trik ingat, dan 5 latihan mandiri" },
                    { id: "intuitive", label: "Sederhana & Intuitif", desc: "Bahasa santai & mudah dimengerti, konsep 100% utuh" },
                    { id: "memorization", label: "Poin Hafalan & Ujian", desc: "Istilah kunci, klasifikasi, dan mnemonik cepat" }
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSummaryStyle(s.id as any)}
                      title={s.desc}
                      style={{
                        backgroundColor: summaryStyle === s.id ? "#18221f" : "#ffffff",
                        color: summaryStyle === s.id ? "#c8f064" : "#45544e",
                        border: `1px solid ${summaryStyle === s.id ? "#18221f" : "#dce1da"}`,
                        borderRadius: 999,
                        padding: "4px 12px",
                        fontSize: 11.5,
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "0.15s ease"
                      }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <h2 style={{ fontSize: 19, fontWeight: 800, letterSpacing: "-0.02em", color: "#17201d" }}>
                      Rangkuman Cerdas & Poin Kritis Ujian
                    </h2>
                    <p style={{ fontSize: 12, color: "#6f7975", marginTop: 2 }}>
                      Struktur intisari materi dan analisis jebakan soal oleh model AI.
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    {activeDocSummary && (
                      <>
                        <button
                          onClick={() => toggleSpeech(activeDocSummary)}
                          style={{
                            backgroundColor: isSpeaking ? "#fef2f2" : "#ffffff",
                            border: `1px solid ${isSpeaking ? "#ef4444" : "#dce1da"}`,
                            color: isSpeaking ? "#ef4444" : "#17201d",
                            borderRadius: 8,
                            padding: "8px 12px",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 6
                          }}
                          title="Dengarkan pembacaan teks audio"
                        >
                          {isSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
                          {isSpeaking ? "Hentikan" : "Dengarkan"}
                        </button>

                        <button
                          onClick={() => copyToClipboard(activeDocSummary, "Rangkuman")}
                          style={{
                            backgroundColor: "#ffffff",
                            border: "1px solid #dce1da",
                            color: "#17201d",
                            borderRadius: 8,
                            padding: "8px 12px",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 6
                          }}
                          title="Salin Markdown ke clipboard"
                        >
                          <Copy size={14} />
                          <span>Salin</span>
                        </button>

                        <button
                          onClick={() => downloadAsMarkdown(`${(activeDocTitle || "rangkuman").toLowerCase().replace(/\s+/g, "_")}_ringkasan.md`, `# ${activeDocTitle}\n\n${activeDocSummary}`)}
                          style={{
                            backgroundColor: "#ffffff",
                            border: "1px solid #dce1da",
                            color: "#17201d",
                            borderRadius: 8,
                            padding: "8px 12px",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 6
                          }}
                          title="Unduh sebagai berkas Markdown .md"
                        >
                          <Download size={14} />
                          <span>Unduh .md</span>
                        </button>

                        <button
                          onClick={() => window.print()}
                          style={{
                            backgroundColor: "#ffffff",
                            border: "1px solid #dce1da",
                            color: "#17201d",
                            borderRadius: 8,
                            padding: "8px 12px",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 6
                          }}
                          title="Cetak materi atau simpan ke PDF"
                        >
                          <Printer size={14} />
                          <span>Cetak PDF</span>
                        </button>
                      </>
                    )}

                    <button
                      onClick={handleGenerateSummary}
                      disabled={isGeneratingSummary}
                      style={{
                        backgroundColor: "#18221f",
                        border: "none",
                        color: "#c8f064",
                        borderRadius: 8,
                        padding: "8px 14px",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: isGeneratingSummary ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 6
                      }}
                    >
                      <Sparkles size={14} />
                      {isGeneratingSummary ? "Meringkas..." : "Rangkum Baru"}
                    </button>
                  </div>
                </div>

                {!activeDocSummary ? (
                  <div
                    style={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #dde1da",
                      borderRadius: 12,
                      padding: "36px 20px",
                      textAlign: "center",
                      boxShadow: "0 10px 35px rgba(27, 39, 35, 0.04)"
                    }}
                  >
                    <FileText size={32} color="#727d78" style={{ margin: "0 auto 10px" }} />
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#17201d" }}>
                      Belum Ada Rangkuman
                    </div>
                    <p style={{ fontSize: 13, color: "#6f7975", maxWidth: 380, margin: "6px auto 16px" }}>
                      Klik tombol di atas untuk menghasilkan ringkasan poin inti materi dan daftar jebakan soal.
                    </p>
                    <button
                      onClick={handleGenerateSummary}
                      disabled={isGeneratingSummary}
                      style={{
                        backgroundColor: "#18221f",
                        color: "#c8f064",
                        border: "none",
                        borderRadius: 8,
                        padding: "10px 20px",
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: "pointer"
                      }}
                    >
                      Generate Rangkuman
                    </button>
                  </div>
                ) : (
                  <div
                    className="learning-card-white markdown-body print-document-container"
                    style={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #dde1da",
                      borderRadius: 12,
                      padding: "26px",
                      lineHeight: "1.7",
                      color: "#17201d",
                      fontSize: 14,
                      boxShadow: "0 10px 35px rgba(27, 39, 35, 0.04)"
                    }}
                  >
                    {/* Publication Header for Print only */}
                    <div className="print-only" style={{ borderBottom: "2px solid #18221f", paddingBottom: 14, marginBottom: 20 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                        <div>
                          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", color: "#4b6623", fontFamily: "'DM Mono', monospace" }}>
                            TANKA · MODUL BELAJAR EDITORIAL
                          </span>
                          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#18221f", margin: "4px 0 0" }}>
                            {activeDoc?.title || "Modul Pembelajaran"}
                          </h1>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <span style={{ fontSize: 10, color: "#6b7280", fontFamily: "'DM Mono', monospace" }}>
                            Dicetak: {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 14, marginTop: 8, fontSize: 11, color: "#4b5563", fontFamily: "'DM Mono', monospace" }}>
                        <span>Panjang: {formattedSummary ? formattedSummary.trim().split(/\s+/).filter(Boolean).length : 0} kata</span>
                        <span>•</span>
                        <span>Estimasi Baca: {Math.max(1, Math.ceil((formattedSummary ? formattedSummary.trim().split(/\s+/).filter(Boolean).length : 0) / 180))} menit</span>
                        <span>•</span>
                        <span>Gaya: {summaryStyle === "tutor" ? "Tutor Bertahap & Latihan" : summaryStyle === "intuitive" ? "Sederhana & Intuitif" : "Poin Hafalan"}</span>
                      </div>
                    </div>

                    <ReactMarkdown
                      remarkPlugins={[remarkGfm, remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                      components={{
                        h1: ({ children }) => (
                          <h1 style={{ fontSize: 21, fontWeight: 800, color: "#17201d", marginTop: 20, marginBottom: 10, borderBottom: "1px solid #dde1da", paddingBottom: 6 }}>
                            {children}
                          </h1>
                        ),
                        h2: ({ children }) => (
                          <h2 style={{ fontSize: 17, fontWeight: 700, color: "#22370c", marginTop: 20, marginBottom: 8 }}>
                            {children}
                          </h2>
                        ),
                        h3: ({ children }) => (
                          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#17201d", marginTop: 16, marginBottom: 6 }}>
                            {children}
                          </h3>
                        ),
                        p: ({ children }) => (
                          <p style={{ marginBottom: 10, color: "#45544e" }}>{children}</p>
                        ),
                        ul: ({ children }) => (
                          <ul style={{ paddingLeft: 18, marginBottom: 12 }}>{children}</ul>
                        ),
                        ol: ({ children }) => (
                          <ol style={{ paddingLeft: 18, marginBottom: 12 }}>{children}</ol>
                        ),
                        li: ({ children }) => (
                          <li style={{ marginBottom: 5, color: "#45544e" }}>{children}</li>
                        ),
                        strong: ({ children }) => (
                          <strong style={{ color: "#17201d", fontWeight: 700 }}>{children}</strong>
                        ),
                        blockquote: ({ children }) => (
                          <blockquote style={{ borderLeft: "3px solid #8dbd42", backgroundColor: "#eef8db", padding: "10px 14px", borderRadius: "0 8px 8px 0", margin: "12px 0", color: "#22370c" }}>
                            {children}
                          </blockquote>
                        ),
                        pre: ({ children }) => (
                          <pre
                            style={{
                              backgroundColor: "#f6f8f5",
                              border: "1px solid #d4ded2",
                              borderLeft: "3px solid #65a30d",
                              borderRadius: 8,
                              padding: "12px 14px",
                              fontFamily: "'DM Mono', monospace",
                              fontSize: 11.5,
                              lineHeight: 1.45,
                              color: "#18221f",
                              overflowX: "auto",
                              whiteSpace: "pre-wrap",
                              wordBreak: "break-word",
                              margin: "14px 0"
                            }}
                          >
                            {children}
                          </pre>
                        ),
                        code: ({ children }) => (
                          <code
                            style={{
                              fontFamily: "'DM Mono', monospace",
                              fontSize: 12,
                              backgroundColor: "#f0f4ee",
                              color: "#1f2b26",
                              padding: "2px 5px",
                              borderRadius: 4
                            }}
                          >
                            {children}
                          </code>
                        ),
                        table: ({ children }) => (
                          <div style={{ overflowX: "auto", margin: "14px 0" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, border: "1px solid #dde1da", borderRadius: 8, overflow: "hidden" }}>
                              {children}
                            </table>
                          </div>
                        ),
                        thead: ({ children }) => (
                          <thead style={{ backgroundColor: "#f8f9f5", borderBottom: "1px solid #dde1da" }}>
                            {children}
                          </thead>
                        ),
                        th: ({ children }) => (
                          <th style={{ padding: "8px 12px", textAlign: "left", color: "#22370c", fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            {children}
                          </th>
                        ),
                        td: ({ children }) => (
                          <td style={{ padding: "8px 12px", borderBottom: "1px solid #eef1eb", color: "#17201d" }}>
                            {children}
                          </td>
                        ),
                      }}
                    >
                      {formattedSummary}
                    </ReactMarkdown>

                    {/* Print Appendix 1: Flashcards / Glosarium Konsep Kunci */}
                    {flashcards && flashcards.length > 0 && (
                      <div className="print-only" style={{ marginTop: 28, paddingTop: 20, borderTop: "2px solid #18221f", breakBefore: "page" }}>
                        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", color: "#4b6623", fontFamily: "'DM Mono', monospace" }}>
                          LAMPIRAN I · FLASHCARDS & DEFINISI KUNCI
                        </span>
                        <h2 style={{ fontSize: 16, fontWeight: 800, color: "#18221f", margin: "4px 0 14px 0" }}>
                          Glosarium Konsep & Kaidah Inti
                        </h2>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                          {flashcards.map((fc, fIdx) => (
                            <div key={fc.id || fIdx} style={{ border: "1px solid #dce1da", borderRadius: 8, padding: "10px 12px", background: "#f8f9f5", breakInside: "avoid" }}>
                              <strong style={{ fontSize: 12, color: "#22370c", display: "block", marginBottom: 4 }}>
                                <MathView text={fc.front} />
                              </strong>
                              <p style={{ fontSize: 11, color: "#374151", margin: 0, lineHeight: 1.5 }}>
                                <MathView text={fc.back} />
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Print Appendix 2: Soal Latihan & Pembahasan Kunci */}
                    {quizQuestions && quizQuestions.length > 0 && (
                      <div className="print-only" style={{ marginTop: 28, paddingTop: 20, borderTop: "2px solid #18221f", breakBefore: "page" }}>
                        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", color: "#4b6623", fontFamily: "'DM Mono', monospace" }}>
                          LAMPIRAN II · LATIHAN KUIS & PEMBAHASAN
                        </span>
                        <h2 style={{ fontSize: 16, fontWeight: 800, color: "#18221f", margin: "4px 0 14px 0" }}>
                          Paket Soal & Pembahasan Terstruktur
                        </h2>
                        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                          {quizQuestions.map((q, qIdx) => (
                            <div key={q.id || qIdx} style={{ border: "1px solid #dce1da", borderRadius: 8, padding: "12px 14px", background: "#ffffff", breakInside: "avoid" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                                <span style={{ fontSize: 11, fontWeight: 700, color: "#4b6623", fontFamily: "'DM Mono', monospace" }}>SOAL {qIdx + 1}</span>
                              </div>
                              <div style={{ fontSize: 12.5, fontWeight: 600, color: "#111827", marginBottom: 8 }}>
                                <MathView text={q.question} />
                              </div>
                              {Array.isArray(q.options) && q.options.length > 0 && (
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 8 }}>
                                  {q.options.map((opt, oIdx) => (
                                    <div key={oIdx} style={{ fontSize: 11, padding: "4px 8px", borderRadius: 4, background: oIdx === q.correctIndex ? "#ecfccb" : "#f3f4f6", border: oIdx === q.correctIndex ? "1px solid #bef264" : "1px solid transparent", color: oIdx === q.correctIndex ? "#365314" : "#374151" }}>
                                      <strong>{String.fromCharCode(65 + oIdx)}.</strong> <MathView text={opt} /> {oIdx === q.correctIndex && "✓ (Kunci)"}
                                    </div>
                                  ))}
                                </div>
                              )}
                              <div style={{ fontSize: 11, color: "#4b5563", background: "#f8f9f5", padding: "8px 10px", borderRadius: 6, lineHeight: 1.5 }}>
                                <strong style={{ color: "#1f2937" }}>Pembahasan: </strong>
                                <MathView text={q.explanation} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB 6: GROUNDED AI TUTOR CHAT */}
            {activeTab === "chat" && (
              <div style={{ maxWidth: 840, margin: "0 auto", display: "flex", flexDirection: "column", height: "calc(100dvh - 160px)", minHeight: 400 }}>
                {/* Active grounding info banner */}
                <div
                  style={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #dde1da",
                    borderRadius: 10,
                    padding: "10px 14px",
                    marginBottom: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    boxShadow: "0 10px 35px rgba(27, 39, 35, 0.04)"
                  }}
                >
                  <div style={{ fontSize: 12, color: "#6f7975", display: "flex", alignItems: "center", gap: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    <BookOpen size={13} color="#4b6623" />
                    <span>Materi: <strong style={{ color: "#17201d" }}>{activeDocTitle || "Belum dipilih"}</strong></span>
                  </div>
                  <div className="desktop-only" style={{ fontSize: 11, color: "#8a9691", fontFamily: "'DM Mono', monospace" }}>
                    Engine: {selectedModel}
                  </div>
                </div>

                {/* Chat Messages Log */}
                <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12, paddingRight: 4, marginBottom: 12 }}>
                  {messages.map((m) => {
                    const isUser = m.role === "user";
                    return (
                      <div
                        key={m.id}
                        style={{
                          alignSelf: isUser ? "flex-end" : "flex-start",
                          maxWidth: "85%",
                          backgroundColor: isUser ? "#18221f" : "#ffffff",
                          color: isUser ? "#eff5ec" : "#17201d",
                          border: isUser ? "none" : "1px solid #dde1da",
                          borderRadius: 12,
                          padding: "10px 14px",
                          fontSize: 13,
                          lineHeight: "1.5",
                          whiteSpace: "pre-wrap",
                          boxShadow: isUser ? "none" : "0 4px 15px rgba(27, 39, 35, 0.03)"
                        }}
                      >
                        <MathView text={m.content} />
                      </div>
                    );
                  })}
                  {isChatSending && (
                    <div
                      style={{
                        alignSelf: "flex-start",
                        backgroundColor: "#ffffff",
                        border: "1px solid #dde1da",
                        borderRadius: 12,
                        padding: "10px 14px",
                        fontSize: 12,
                        color: "#4b6623"
                      }}
                    >
                      Tutor sedang menganalisis materi dan menyusun jawaban...
                    </div>
                  )}
                </div>

                {/* Quick Prompt Pills */}
                <div className="no-scrollbar" style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 8, WebkitOverflowScrolling: "touch" }}>
                  {[
                    "Jelaskan bagian tersulit materi ini",
                    "Buat 3 soal jebakan analisis beserta jawabannya",
                    "Sederhanakan definisi di atas dengan analogi nyata"
                  ].map((pill, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(pill)}
                      style={{
                        whiteSpace: "nowrap",
                        backgroundColor: "#ffffff",
                        border: "1px solid #dce1da",
                        color: "#45544e",
                        borderRadius: 999,
                        padding: "4px 10px",
                        fontSize: 11,
                        cursor: "pointer",
                        flexShrink: 0
                      }}
                    >
                      {pill}
                    </button>
                  ))}
                </div>

                {/* Input Bar */}
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Tanyakan konsep..."
                    style={{
                      flex: 1,
                      backgroundColor: "#ffffff",
                      border: "1px solid #dce1da",
                      borderRadius: 8,
                      padding: "10px 14px",
                      fontSize: 14,
                      color: "#17201d",
                      outline: "none"
                    }}
                  />
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={isChatSending || !chatInput.trim()}
                    style={{
                      backgroundColor: "#18221f",
                      color: "#c8f064",
                      border: "none",
                      borderRadius: 8,
                      padding: "0 16px",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: isChatSending || !chatInput.trim() ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 4
                    }}
                  >
                    <Send size={14} />
                    <span className="desktop-only">Kirim</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

          {/* Right Column: Figma Make "Tanya Nara" AI Panel */}
          <aside className="ai-panel-box desktop-only">
            <div style={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between" }}>
              <div>
                <div className="ai-heading-box">
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div className="ai-orbit-box">N</div>
                    <div>
                      <h2 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: "#17201d" }}>Tanya Nara</h2>
                      <p style={{ fontSize: 10.5, color: "#727d78", margin: 0 }}>Tutor belajar pribadimu</p>
                    </div>
                  </div>
                  <span className="online-label-box">
                    <i />
                    Online
                  </span>
                </div>

                <div className="chat-window-box no-scrollbar" style={{ minHeight: 240, maxHeight: "calc(100vh - 360px)" }}>
                  <div className="ai-note-box">
                    Aku sudah membaca modul dan soal yang sedang kamu pelajari. Tanyakan apa saja jika ada rumus atau konsep yang membingungkan.
                  </div>
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: m.role === "user" ? "flex-end" : "flex-start",
                        gap: 3
                      }}
                    >
                      <div
                        style={{
                          maxWidth: "88%",
                          padding: "9px 12px",
                          borderRadius: m.role === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                          backgroundColor: m.role === "user" ? "#18221f" : "#f4f6f2",
                          color: m.role === "user" ? "#eff5ec" : "#17201d",
                          fontSize: 12,
                          lineHeight: 1.5,
                          border: m.role === "user" ? "none" : "1px solid #dce4d7"
                        }}
                      >
                        {m.role === "assistant" ? (
                          <div className="nara-md-response" style={{ fontSize: 12, lineHeight: 1.5 }}>
                            <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                              {m.content}
                            </ReactMarkdown>
                          </div>
                        ) : m.content}
                      </div>
                    </div>
                  ))}
                  {isChatSending && (
                    <div style={{ fontSize: 11, color: "#727d78", fontStyle: "italic", padding: "4px 8px" }}>
                      Nara sedang menyusun penjelasan...
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
              </div>

              <div>
                <div className="prompt-chips-box">
                  {(activeTab === "quiz"
                    ? ["Bahas soal ini", "Kenapa jawaban itu benar?", "Rumus terkait"]
                    : activeTab === "flashcards"
                    ? ["Jelaskan kartu ini", "Beri analogi", "Contoh penerapan"]
                    : activeTab === "feynman"
                    ? ["Koreksi penjelasanku", "Bantu susun analogi", "Apa yang kurang?"]
                    : ["Jelaskan lebih sederhana", "Beri contoh soal lain", "Trik cepat rumus"]
                  ).map((chip) => (
                    <button
                      key={chip}
                      className="prompt-chip-btn"
                      onClick={() => handleSendMessage(chip)}
                      disabled={isChatSending}
                    >
                      {chip}
                    </button>
                  ))}
                </div>

                <form
                  className="chat-form-box"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                >
                  <input
                    type="text"
                    placeholder="Ketik pertanyaanmu..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    disabled={isChatSending}
                  />
                  <button type="submit" disabled={isChatSending || !chatInput.trim()}>
                    ↑
                  </button>
                </form>
                <p style={{ margin: "8px 0 0", fontSize: 9.5, color: "#8a9691", textAlign: "center" }}>
                  AI dapat membuat kesalahan. Tetap periksa rumus penting.
                </p>
              </div>
            </div>
          </aside>
        </div>

        {/* Lesson Footer Bar */}
        {(() => {
          const hasContent = activeDocContent.length > 0 ? 1 : 0;
          const hasFlashcards = flashcards.length > 0 ? 1 : 0;
          const hasQuiz = quizQuestions.length > 0 ? 1 : 0;
          const hasSummary = activeDocSummary.length > 0 ? 1 : 0;
          const progressPct = Math.round(((hasContent + hasFlashcards + hasQuiz + hasSummary) / 4) * 100);
          return (
        <footer className="lesson-footer-bar desktop-only">
          <div className="course-progress-box">
            <span>Progres modul</span>
            <div className="course-progress-bar">
              <div className="course-progress-bar-fill" style={{ width: `${progressPct}%` }} />
            </div>
            <strong style={{ color: "#17201d", fontFamily: "'DM Mono', monospace" }}>{progressPct}%</strong>
          </div>

          <div className="footer-steps">
            <span className={hasContent ? "done" : ""}>Materi</span>
            <span className={hasFlashcards ? "done" : ""}>Flashcard</span>
            <span className={hasQuiz ? "done" : ""}>Latihan</span>
            <span className={hasSummary ? "done" : ""}>Rangkuman</span>
          </div>

          <button
            onClick={() => {
              if (activeTab === "material") setActiveTab("flashcards");
              else if (activeTab === "flashcards") setActiveTab("quiz");
              else if (activeTab === "quiz") setActiveTab("summary");
              else setActiveTab("material");
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 14px",
              color: "#18221f",
              backgroundColor: "#c8f064",
              border: 0,
              borderRadius: 8,
              fontSize: 11.5,
              fontWeight: 700,
              cursor: "pointer",
              transition: "0.15s ease"
            }}
          >
            <span>
              {activeTab === "material" ? "Lanjut ke Flashcard" : activeTab === "flashcards" ? "Lanjut ke Latihan Soal" : activeTab === "quiz" ? "Lanjut ke Rangkuman" : "Kembali ke Materi"}
            </span>
            <ChevronRight size={14} />
          </button>
        </footer>
          );
        })()}
      </div>

      {/* 📐 FORMULA CHEATSHEET DRAWER OVERLAY */}
      {isFormulaDrawerOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9998,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(6px)",
            display: "flex",
            justifyContent: "flex-end"
          }}
          onClick={() => setIsFormulaDrawerOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 480,
              height: "100%",
              backgroundColor: "#ffffff",
              borderLeft: "1px solid #dde1da",
              display: "flex",
              flexDirection: "column",
              boxShadow: "-8px 0 35px rgba(27, 39, 35, 0.1)",
              animation: "slideInRight 0.2s ease",
              overflowX: "hidden"
              }}
              >
              {/* Drawer Header */}
              <div style={{ padding: "18px 20px", borderBottom: "1px solid #dde1da", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Calculator size={18} color="#4b6623" />
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: "#17201d", margin: 0 }}>
                    Lembar Rumus Cepat
                  </h3>
                  <div style={{ fontSize: 11, color: "#6f7975", marginTop: 2 }}>
                    {activeDocTitle || "Materi Aktif"}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {formulas.length > 0 && (
                  <>
                    <button
                      onClick={() => {
                        const md = `# Lembar Rumus: ${activeDocTitle || "Materi"}\n\n` +
                          formulas.map(f => `### ${f.name} (${f.category || "Umum"})\n\n${f.formula}\n\n**Keterangan**: ${f.meaning}\n`).join("\n---\n\n");
                        downloadAsMarkdown(`${(activeDocTitle || "rumus").toLowerCase().replace(/\s+/g, "_")}_rumus.md`, md);
                      }}
                      style={{
                        backgroundColor: "#ffffff",
                        border: "1px solid #dce1da",
                        color: "#17201d",
                        borderRadius: 8,
                        padding: "5px 9px",
                        fontSize: 11.5,
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 4
                      }}
                      title="Unduh seluruh rumus sebagai Markdown"
                    >
                      <Download size={13} />
                      <span>Unduh .md</span>
                    </button>
                    <button
                      onClick={() => window.print()}
                      style={{
                        backgroundColor: "#ffffff",
                        border: "1px solid #dce1da",
                        color: "#17201d",
                        borderRadius: 8,
                        padding: "5px 9px",
                        fontSize: 11.5,
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 4
                      }}
                      title="Cetak atau simpan ke PDF"
                    >
                      <Printer size={13} />
                      <span>Cetak</span>
                    </button>
                  </>
                )}
                <button
                  onClick={() => setIsFormulaDrawerOpen(false)}
                  style={{ background: "none", border: "none", color: "#6f7975", cursor: "pointer", padding: 4 }}
                >
                  <X size={18} />
                </button>
              </div>
              </div>

              {/* Filter Search Input */}
              <div style={{ padding: "12px 20px", borderBottom: "1px solid #dde1da" }}>
              <input
                type="text"
                value={formulaFilter}
                onChange={(e) => setFormulaFilter(e.target.value)}
                placeholder="Cari rumus atau kata kunci (mis: kuadrat, diskriminan)..."
                style={{
                  width: "100%",
                  backgroundColor: "#fafbf8",
                  border: "1px solid #dce1da",
                  borderRadius: 8,
                  padding: "8px 12px",
                  fontSize: 12.5,
                  color: "#17201d",
                  outline: "none"
                }}
              />
              </div>

              {/* Formulas List */}
              <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px 48px", display: "flex", flexDirection: "column", gap: 14 }}>
              {isLoadingFormulas ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#4b6623" }}>
                  <Sparkles size={24} style={{ margin: "0 auto 8px", animation: "spin 2s linear infinite" }} />
                  <div style={{ fontSize: 13, fontWeight: 700 }}>Mengekstrak seluruh rumus akademik...</div>
                </div>
              ) : formulas.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "#6f7975" }}>
                  <Calculator size={32} style={{ margin: "0 auto 10px", color: "#aeb9b4" }} />
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#17201d" }}>Belum Ada Rumus Terekstrak</div>
                  <p style={{ fontSize: 12, marginTop: 4 }}>
                    Klik tombol di bawah untuk meminta AI membedah seluruh rumus matematis dari dokumen ini.
                  </p>
                  <button
                    onClick={fetchOrExtractFormulas}
                    style={{
                      marginTop: 12,
                      backgroundColor: "#18221f",
                      color: "#c8f064",
                      border: "none",
                      borderRadius: 8,
                      padding: "8px 16px",
                      fontSize: 12.5,
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    Ekstrak Rumus Sekarang
                  </button>
                </div>
              ) : (
                formulas
                  .filter((f) => !formulaFilter || f.name.toLowerCase().includes(formulaFilter.toLowerCase()) || (f.meaning && f.meaning.toLowerCase().includes(formulaFilter.toLowerCase())))
                  .map((f, i) => (
                    <div
                      key={i}
                      style={{
                        backgroundColor: "#ffffff",
                        border: "1px solid #dde1da",
                        borderRadius: 12,
                        padding: "16px",
                        boxShadow: "0 4px 15px rgba(27, 39, 35, 0.04)"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <span style={{ fontSize: 13.5, fontWeight: 800, color: "#17201d" }}>
                          {f.name}
                        </span>
                        {f.category && (
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 800,
                              color: "#22370c",
                              backgroundColor: "#eef8db",
                              border: "1px solid #c2e28f",
                              padding: "2px 6px",
                              borderRadius: 4,
                              fontFamily: "'DM Mono', monospace"
                            }}
                          >
                            {f.category}
                          </span>
                        )}
                      </div>

                      {/* Centered Formula Display */}
                      <div
                        className="no-scrollbar"
                        style={{
                          backgroundColor: "#1d2824",
                          border: "1px solid #34413c",
                          borderRadius: 8,
                          padding: "10px 14px",
                          textAlign: "center",
                          fontSize: 14,
                          color: "#e8eee9",
                          marginBottom: 8,
                          overflowX: "auto",
                          maxWidth: "100%",
                          WebkitOverflowScrolling: "touch",
                          wordBreak: "break-word",
                          overflowWrap: "anywhere",
                          whiteSpace: "normal",
                          lineHeight: "1.6"
                        }}
                      >
                        <MathView text={f.formula} />
                      </div>

                      {f.meaning && (
                        <div style={{ fontSize: 12, color: "#45544e", lineHeight: "1.5" }}>
                          <MathView text={f.meaning} />
                        </div>
                      )}
                    </div>
                  ))
              )}
              </div>

              {/* Drawer Footer */}
              <div style={{ padding: "14px 20px", borderTop: "1px solid #dde1da", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 11, color: "#6f7975", fontFamily: "'DM Mono', monospace" }}>
                {formulas.length} rumus terekstrak
              </span>
              <button
                onClick={async () => {
                  setFormulas([]);
                  setIsLoadingFormulas(true);
                  try {
                    const aiRes = await fetch("/api/ai/extract-formulas", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ docId: activeDocId, model: selectedModel })
                    });
                    const aiData = await aiRes.json();
                    if (aiData.success && aiData.formulas) {
                      setFormulas(aiData.formulas);
                    }
                  } finally {
                    setIsLoadingFormulas(false);
                  }
                }}
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #dce1da",
                  color: "#17201d",
                  borderRadius: 6,
                  padding: "5px 10px",
                  fontSize: 11.5,
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                <RotateCw size={12} /> Refresh Rumus
              </button>
              </div>
              </div>
              </div>
              )}

              {/* 🧭 AI TOPIC DISCOVERY & GENERATOR MODAL */}
              {isTopicModalOpen && (
              <div
              style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 9999,
              backgroundColor: "rgba(0, 0, 0, 0.6)",
              backdropFilter: "blur(6px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 16
              }}
              onClick={() => {
              if (!isGeneratingTopic) setIsTopicModalOpen(false);
              }}
              >
              <div
              onClick={(e) => e.stopPropagation()}
              style={{
              width: "100%",
              maxWidth: 580,
              maxHeight: "85vh",
              backgroundColor: "#ffffff",
              border: "1px solid #dde1da",
              borderRadius: 12,
              boxShadow: "0 20px 60px rgba(27, 39, 35, 0.15)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column"
              }}
              >
              {/* Modal Header */}
              <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid #dde1da",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: "#f8f9f5"
              }}
              >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    backgroundColor: "#eef8db",
                    border: "1px solid #c2e28f",
                    borderRadius: 8,
                    padding: 6,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <Compass size={17} color="#4b6623" />
                </div>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: "#17201d", margin: 0, letterSpacing: "-0.01em" }}>
                    Belajar Mandiri Tanpa Berkas
                  </h3>
                  <div style={{ fontSize: 11, color: "#6f7975", marginTop: 2 }}>
                    Tentukan topik materi, AI mengonfirmasi fokus kebutuhan dan menyusun kurikulum resmi
                  </div>
                </div>
              </div>
              {!isGeneratingTopic && (
                <button
                  onClick={() => setIsTopicModalOpen(false)}
                  style={{ background: "none", border: "none", color: "#6f7975", cursor: "pointer", padding: 4 }}
                >
                  <X size={18} />
                </button>
              )}
              </div>

              {/* Modal Body */}
              <div style={{ flex: 1, padding: "20px", overflowY: "auto" }}>
              {/* STEP 1: Input Topic */}
              {topicStep === 1 && (
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#17201d", marginBottom: 8 }}>
                    Apa materi atau topik yang ingin Anda kuasai hari ini?
                  </label>
                  <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                    <input
                      type="text"
                      value={topicInput}
                      onChange={(e) => setTopicInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleStartTopicClarify();
                      }}
                      placeholder="Contoh: Matriks Transformasi, Teori Elastisitas, Konflik Sosial..."
                      style={{
                        flex: 1,
                        backgroundColor: "#fafbf8",
                        border: "1px solid #dce1da",
                        borderRadius: 8,
                        padding: "10px 14px",
                        fontSize: 13,
                        color: "#17201d",
                        outline: "none"
                      }}
                      autoFocus
                    />
                    <button
                      onClick={() => handleStartTopicClarify()}
                      disabled={isClarifyingTopic || !topicInput.trim()}
                      style={{
                        backgroundColor: "#18221f",
                        color: "#c8f064",
                        border: "none",
                        borderRadius: 8,
                        padding: "0 18px",
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: isClarifyingTopic || !topicInput.trim() ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 6
                      }}
                    >
                      {isClarifyingTopic ? (
                        <>
                          <Sparkles size={14} style={{ animation: "spin 1.5s linear infinite" }} />
                          <span>Menganalisis...</span>
                        </>
                      ) : (
                        <>
                          <span>Lanjut</span>
                          <ChevronRight size={15} />
                        </>
                      )}
                    </button>
                  </div>

                  {/* Quick suggestion pills */}
                  <div style={{ marginTop: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#6f7975", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                      Pilih Cepat Topik Ujian & Studi Populer:
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                      {[
                        "Matriks Transformasi Geometri 2x2",
                        "Persamaan & Fungsi Kuadrat",
                        "Barisan & Deret Aritmetika",
                        "Teori Permintaan & Penawaran Pasar",
                        "Struktur Sosial & Mobilitas Sosial",
                        "Ide Pokok & Kalimat Efektif Teks",
                        "The Unseen Reading Passage (B. Inggris)"
                      ].map((sug, sIdx) => (
                        <button
                          key={sIdx}
                          onClick={() => {
                            setTopicInput(sug);
                            handleStartTopicClarify(sug);
                          }}
                          style={{
                            backgroundColor: "#fafbf8",
                            border: "1px solid #dce1da",
                            color: "#45544e",
                            borderRadius: 999,
                            padding: "6px 12px",
                            fontSize: 11.5,
                            cursor: "pointer",
                            textAlign: "left"
                          }}
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: AI Diagnostic Clarification Questions */}
              {topicStep === 2 && topicClarificationData && (
                <div>
                  <div
                    style={{
                      backgroundColor: "#eef8db",
                      border: "1px solid #c2e28f",
                      borderRadius: 10,
                      padding: "12px 14px",
                      marginBottom: 16
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          color: "#22370c",
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          backgroundColor: "#ffffff",
                          border: "1px solid #c2e28f",
                          padding: "2px 6px",
                          borderRadius: 4,
                          fontFamily: "'DM Mono', monospace"
                        }}
                      >
                        {topicClarificationData.subject}
                      </span>
                      <button
                        onClick={() => setTopicStep(1)}
                        style={{ background: "none", border: "none", color: "#45544e", fontSize: 11, cursor: "pointer" }}
                      >
                        Ubah Topik
                      </button>
                    </div>
                    <div style={{ fontSize: 14.5, fontWeight: 800, color: "#17201d" }}>
                      {topicClarificationData.formalTitle}
                    </div>
                  </div>

                  <div style={{ fontSize: 12, color: "#6f7975", marginBottom: 14 }}>
                    Tentukan fokus dan preferensi belajar untuk modul materi ini:
                  </div>

                  {/* Clarification questions */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {topicClarificationData.questions.map((q, qIdx) => (
                      <div
                        key={q.id || qIdx}
                        style={{
                          backgroundColor: "#f8f9f5",
                          border: "1px solid #dde1da",
                          borderRadius: 10,
                          padding: "14px 16px"
                        }}
                      >
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#17201d", marginBottom: 10 }}>
                          {qIdx + 1}. {q.question}
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {q.choices.map((choice, cIdx) => {
                            const isSelected = topicAnswers[q.id] === choice;
                            return (
                              <button
                                key={cIdx}
                                onClick={() => {
                                  setTopicAnswers((prev) => ({ ...prev, [q.id]: choice }));
                                }}
                                style={{
                                  backgroundColor: isSelected ? "#18221f" : "#ffffff",
                                  border: isSelected ? "1px solid #18221f" : "1px solid #dce1da",
                                  color: isSelected ? "#c8f064" : "#45544e",
                                  borderRadius: 8,
                                  padding: "7px 12px",
                                  fontSize: 12,
                                  fontWeight: isSelected ? 700 : 500,
                                  cursor: "pointer",
                                  textAlign: "left"
                                }}
                              >
                                {isSelected ? "✓ " : ""}{choice}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 3: Generation in Progress */}
              {topicStep === 3 && (
                <div style={{ textAlign: "center", padding: "40px 10px" }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 999,
                      backgroundColor: "#eef8db",
                      border: "2px solid #8dbd42",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 16px",
                      animation: "spin 2s linear infinite"
                    }}
                  >
                    <Sparkles size={22} color="#4b6623" />
                  </div>
                  <h4 style={{ fontSize: 16, fontWeight: 800, color: "#17201d", marginBottom: 6 }}>
                    Menyusun Kurikulum & Modul Mandiri
                  </h4>
                  <p style={{ fontSize: 12.5, color: "#6f7975", maxWidth: 380, margin: "0 auto 12px", lineHeight: "1.5" }}>
                    AI sedang menyusun peta konsep, rumus KaTeX horizontal murni, contoh soal bertingkat, dan analisis jebakan...
                  </p>
                  <div style={{ fontSize: 11, color: "#8a9691", fontFamily: "'DM Mono', monospace" }}>
                    Target: {topicClarificationData?.formalTitle || topicInput}
                  </div>
                </div>
              )}
              </div>

              {/* Modal Sticky Footer (Only shown in Step 2) */}
              {topicStep === 2 && (
              <div
                style={{
                  padding: "14px 20px",
                  borderTop: "1px solid #dde1da",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  backgroundColor: "#f8f9f5"
                }}
              >
                <button
                  onClick={() => setTopicStep(1)}
                  style={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #dce1da",
                    color: "#17201d",
                    borderRadius: 8,
                    padding: "9px 14px",
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  ← Kembali
                </button>
                <button
                  onClick={handleGenerateTopicDocument}
                  disabled={isGeneratingTopic}
                  style={{
                    backgroundColor: "#18221f",
                    color: "#c8f064",
                    border: "none",
                    borderRadius: 8,
                    padding: "10px 18px",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: isGeneratingTopic ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)"
                  }}
                >
                  <Sparkles size={14} />
                  <span>Susun Dokumen & Modul Mandiri</span>
                </button>
              </div>
              )}
              </div>
              </div>
              )}

              {/* 🌐 AI WEB RESEARCH & ENRICHMENT MODAL */}
              {isEnrichModalOpen && (
                <div
                  style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 9999,
                    backgroundColor: "rgba(0, 0, 0, 0.6)",
                    backdropFilter: "blur(6px)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 16
                  }}
                  onClick={() => {
                    if (!isEnriching) setIsEnrichModalOpen(false);
                  }}
                >
                  <div
                    style={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #dde1da",
                      borderRadius: 12,
                      width: "100%",
                      maxWidth: 480,
                      padding: "24px 26px",
                      boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)"
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Globe size={20} color="#4b6623" />
                        <div>
                          <h3 style={{ fontSize: 16, fontWeight: 800, color: "#17201d", margin: 0 }}>
                            Perkaya Materi dari Internet
                          </h3>
                          <div style={{ fontSize: 11, color: "#6f7975", marginTop: 2 }}>
                            {activeDocTitle}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setIsEnrichModalOpen(false)}
                        disabled={isEnriching}
                        style={{ background: "none", border: "none", color: "#6f7975", cursor: "pointer", padding: 4 }}
                      >
                        <X size={18} />
                      </button>
                    </div>

                    <p style={{ fontSize: 12.5, color: "#45544e", lineHeight: "1.5", marginBottom: 16 }}>
                      AI akan meneliti internet (9Router Search) untuk menemukan referensi pendukung, studi kasus dunia nyata, glosarium istilah, dan menyempurnakan bagian materi yang masih dangkal.
                    </p>

                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#17201d", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                      Fokus Tambahan (Opsional)
                    </label>
                    <input
                      type="text"
                      value={enrichFocus}
                      onChange={(e) => setEnrichFocus(e.target.value)}
                      placeholder="Contoh: berikan contoh kasus nyata, materi hafalan penting..."
                      style={{
                        width: "100%",
                        backgroundColor: "#fafbf8",
                        border: "1px solid #dce1da",
                        borderRadius: 8,
                        padding: "10px 12px",
                        fontSize: 13,
                        color: "#17201d",
                        marginBottom: 16,
                        outline: "none"
                      }}
                    />

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                      <button
                        onClick={() => setIsEnrichModalOpen(false)}
                        disabled={isEnriching}
                        style={{
                          backgroundColor: "#ffffff",
                          border: "1px solid #dce1da",
                          color: "#56615d",
                          borderRadius: 8,
                          padding: "8px 14px",
                          fontSize: 12.5,
                          fontWeight: 600,
                          cursor: "pointer"
                        }}
                      >
                        Batal
                      </button>
                      <button
                        onClick={handleEnrichDocument}
                        disabled={isEnriching}
                        style={{
                          backgroundColor: "#18221f",
                          border: "none",
                          color: "#c8f064",
                          borderRadius: 8,
                          padding: "8px 16px",
                          fontSize: 12.5,
                          fontWeight: 700,
                          cursor: isEnriching ? "not-allowed" : "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 6
                        }}
                      >
                        {isEnriching ? (
                          <>
                            <Sparkles size={14} />
                            <span>Mencari & Menyusun...</span>
                          </>
                        ) : (
                          <>
                            <Globe size={14} />
                            <span>Mulai Riset Tambahan</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
    </div>
  );
}
