import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useReducedMotion, useDragControls } from "motion/react";
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  Award,
  Layers,
  Check,
  Flame,
  Search,
  BookOpen,
  X,
  Trash2,
  Copy,
  Printer,
  Download,
  Trophy,
  History
} from "lucide-react";
import { MathView } from "../common/MathView";
import { CbtContentRenderer } from "../common/CbtContentRenderer";
import {
  ActiveTab,
  ExamBankPackage,
  ExamBankItem,
  ExamBankSubmitResult,
  ExamBankSubmitBreakdown
} from "../../types";

interface ExamCbtTabProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenNara?: (query: string) => void;
  onOpenRoomModal?: (roomId?: string) => void;
  roomCbtSession?: { room: any; pkg: ExamBankPackage; items: ExamBankItem[] } | null;
  onClearRoomCbtSession?: () => void;
  onRunnerStateChange?: (isRunning: boolean, packageTitle?: string) => void;
}

type CbtMode = "selector" | "runner" | "review";
type CbtCategory = "sma_wajib" | "sma_pilihan" | "utbk_snbt" | "ai_drill" | "history";
type StudyMode = "exam" | "drill";

const SUBJECT_PATTERNS_MAP: Record<string, Array<{ id: string; name: string }>> = {
  "Bahasa Indonesia": [
    { id: "all", name: "Kombinasi Semua Pola Baku (Rekomendasi Simulasi)" },
    { id: "1", name: "Pola 1 — Makna Kosakata & Istilah Serapan" },
    { id: "2", name: "Pola 2 — Gagasan Utama & Kalimat Penutup" },
    { id: "3", name: "Pola 3 — Fakta Wacana & Kausalitas Paragraf" },
    { id: "4", name: "Pola 4 — Tujuan & Sikap Penulis" },
    { id: "5", name: "Pola 5 — Pernyataan Benar/Salah (Tabel Grid & Checkbox)" },
    { id: "6", name: "Pola 6 — Teks Sastra / Cerpen (Karakter & Konflik)" },
    { id: "7", name: "Pola 7 — Prediksi Skenario What-If Sastra" },
    { id: "8", name: "Pola 8 — Urutan Kronologis & Rekonstruksi Akhir Cerita" },
    { id: "9", name: "Pola 9 — Relevansi Nilai Sosial & Moral ke Realitas" },
    { id: "10", name: "Pola 10 — Komparasi Dua Teks (Dual-Passage)" },
    { id: "11", name: "Pola 11 — Evaluasi Dialog Tanggapan Pembaca (Setuju/Tidak)" },
  ],
  "Bahasa Inggris": [
    { id: "all", name: "All 6 Official Reading Patterns (Exam Simulation)" },
    { id: "1", name: "Pattern 1 — Main Idea & Primary Purpose" },
    { id: "2", name: "Pattern 2 — Stated Detail & Scanning Fact" },
    { id: "3", name: "Pattern 3 — Unstated / Negative Detail ('Which is NOT true...')" },
    { id: "4", name: "Pattern 4 — Inference & Implicit Meaning" },
    { id: "5", name: "Pattern 5 — Vocabulary in Context & Synonym" },
    { id: "6", name: "Pattern 6 — Author's Tone, Attitude & Text Structure" },
  ],
  "Matematika": [
    { id: "all", name: "Kombinasi 6 Pola Baku Aljabar & Geometri" },
    { id: "1", name: "Pola 1 — Transformasi Geometri Kurva (Translasi, Refleksi, Rotasi)" },
    { id: "2", name: "Pola 2 — Aljabar Pecahan & Persamaan/Pertidaksamaan Kuadrat" },
    { id: "3", name: "Pola 3 — Matriks & Sistem Persamaan Linear (SPLDV/SPLTV)" },
    { id: "4", name: "Pola 4 — Barisan & Deret (Aritmetika & Geometri)" },
    { id: "5", name: "Pola 5 — Trigonometri & Dimensi Tiga (Sudut & Jarak Ruang)" },
    { id: "6", name: "Pola 6 — Statistika & Peluang Kombinatorika" },
  ],
  "Ekonomi": [
    { id: "all", name: "Kombinasi 6 Pilar Ekonomi Mikro & Makro" },
    { id: "1", name: "Pola 1 — Kelangkaan & Biaya Peluang (Opportunity Cost)" },
    { id: "2", name: "Pola 2 — Mekanisme Pasar & Ekuilibrium (Qd = Qs, Elastisitas)" },
    { id: "3", name: "Pola 3 — Inflasi, Indeks Harga & Kebijakan Moneter Bank Sentral" },
    { id: "4", name: "Pola 4 — Kebijakan Fiskal, APBN/APBD & Pajak" },
    { id: "5", name: "Pola 5 — Manajemen Badan Usaha (BUMN, Koperasi) & Akuntansi" },
    { id: "6", name: "Pola 6 — Perdagangan Internasional, Kurs & Neraca Pembayaran" },
  ],
  "Sosiologi": [
    { id: "all", name: "Kombinasi 6 Pilar Teori & Dinamika Sosial" },
    { id: "1", name: "Pola 1 — Konsep Dasar Sosiologi & Karakter Non-Etis" },
    { id: "2", name: "Pola 2 — Interaksi Sosial & Teori Tokoh (Weber, Durkheim, Marx)" },
    { id: "3", name: "Pola 3 — Stratifikasi & Diferensiasi Sosial Multikultural" },
    { id: "4", name: "Pola 4 — Konflik Sosial, Integrasi & Resolusi Konflik" },
    { id: "5", name: "Pola 5 — Perubahan Sosial, Globalisasi & Modernisasi" },
    { id: "6", name: "Pola 6 — Metodologi Penelitian Sosial (Kualitatif & Kuantitatif)" },
  ],
};

function normalizeStatementValue(val?: string | null): string {
  if (!val) return "";
  const v = String(val).trim().toLowerCase();
  if (["true", "benar", "sesuai", "tepat", "setuju"].includes(v)) return "benar";
  if (["false", "salah", "tidak sesuai", "tidak tepat", "tidak setuju"].includes(v)) return "salah";
  return v;
}

function normalizeAnswer(ans: string | undefined | null): string {
  if (!ans) return "";
  const s = String(ans).trim().toLowerCase();
  const parts = s.split(/[;,]/).map((p) => {
    const trimmed = p.trim();
    if (trimmed.includes(":")) {
      const subParts = trimmed.split(":");
      const id = subParts[0].trim();
      const val = subParts.slice(1).join(":").trim();
      return `${id}:${normalizeStatementValue(val)}`;
    }
    return normalizeStatementValue(trimmed);
  }).filter(Boolean);
  if (parts.length > 1) {
    parts.sort();
    return parts.join(";");
  }
  return parts[0] || "";
}

function parseStatementAnswers(ansStr: string | undefined | null): Record<string, string> {
  if (!ansStr) return {};
  const map: Record<string, string> = {};
  const parts = ansStr.toLowerCase().split(/[;,]/).map((p) => p.trim()).filter(Boolean);
  for (const part of parts) {
    const [id, val] = part.split(":").map((s) => s.trim());
    if (id && val) {
      map[id] = val;
    }
  }
  return map;
}

function serializeStatementAnswers(map: Record<string, string>): string {
  return Object.keys(map)
    .sort()
    .map((k) => `${k}:${map[k]}`)
    .join(";");
}

function getStatementChoiceLabels(item: ExamBankItem): [string, string] {
  if (item.options && item.options[0]?.labels && Array.isArray(item.options[0].labels) && item.options[0].labels.length >= 2) {
    return [item.options[0].labels[0], item.options[0].labels[1]];
  }

  const rawKey = ((item.kunci_jawaban || "") + " " + (item.kunci_jawaban_text || "")).toLowerCase();
  const mapelLower = ((item as any).subtes_or_mapel || "").toLowerCase();
  const textCombined = ((item.bacaan || "") + " " + (item.soal || "")).toLowerCase();
  const isEnglish = mapelLower.includes("inggris") || mapelLower.includes("english") ||
    rawKey.includes("true") || rawKey.includes("false") ||
    textCombined.includes("following passage") || textCombined.includes("based on the text") ||
    /\b(which of the following|according to the text|statement)\b/i.test(textCombined);

  // Jika kunci mengandung true/false atau mapel/naskah English
  if (isEnglish) return ["True", "False"];

  // Prioritas 1: Ekstrak dari colonPairs di kunci_jawaban (misal a:sesuai;b:tidak sesuai)
  const colonPairs = (item.kunci_jawaban || "").split(";").map((p) => p.split(":")[1]?.trim()).filter(Boolean);
  const colonUnique = Array.from(new Set(colonPairs));
  if (colonUnique.length >= 2) {
    const capitalize = (s: string) => s.split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    const lower = colonUnique.map((u) => u.toLowerCase());
    if (lower.includes("false") && lower.includes("true")) return ["True", "False"];
    if (lower.includes("tidak setuju") && lower.includes("setuju")) return ["Setuju", "Tidak Setuju"];
    if (lower.includes("tidak tepat") && lower.includes("tepat")) return ["Tepat", "Tidak Tepat"];
    if (lower.includes("tidak sesuai") && lower.includes("sesuai")) return ["Sesuai", "Tidak Sesuai"];
    if (lower.includes("salah") && lower.includes("benar")) return ["Benar", "Salah"];
    return [capitalize(colonUnique[0]), capitalize(colonUnique[1])];
  }

  // Prioritas 2: Ekstrak dari teks kurung HANYA JIKA BUKAN huruf id tunggal (a, b, c)
  const parenMatches = Array.from(rawKey.matchAll(/\(([^)]+)\)/g))
    .map((m) => m[1].trim())
    .filter((txt) => !/^[a-eA-E]$/.test(txt));
  const unique = Array.from(new Set(parenMatches));
  if (unique.length >= 2) {
    const lower = unique.map((u) => u.toLowerCase());
    if (lower.includes("false") && lower.includes("true")) return ["True", "False"];
    if (lower.includes("tidak setuju") && lower.includes("setuju")) return ["Setuju", "Tidak Setuju"];
    if (lower.includes("tidak tepat") && lower.includes("tepat")) return ["Tepat", "Tidak Tepat"];
    if (lower.includes("tidak sesuai") && lower.includes("sesuai")) return ["Sesuai", "Tidak Sesuai"];
    if (lower.includes("salah") && lower.includes("benar")) return ["Benar", "Salah"];
    return [unique[0], unique[1]];
  }

  // Prioritas 3: Deteksi dari teks pertanyaan / soal
  const soalLower = (item.soal || "").toLowerCase();
  if (soalLower.includes("tidak sesuai") || soalLower.includes("sesuai")) return ["Sesuai", "Tidak Sesuai"];
  if (soalLower.includes("tidak setuju") || soalLower.includes("setuju")) return ["Setuju", "Tidak Setuju"];
  if (soalLower.includes("tidak tepat") || soalLower.includes("tepat")) return ["Tepat", "Tidak Tepat"];
  return ["Benar", "Salah"];
}

function formatStatementValue(val?: string): string {
  if (!val) return "-";
  return val.split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function isPositiveStatementValue(val?: string): boolean {
  if (!val) return false;
  const v = val.toLowerCase();
  return v === "true" || v === "benar" || v === "setuju" || v === "tepat" || v === "sesuai" || v === "similarity";
}

function isAnswerCorrect(userAns: string | undefined | null, keyAns: string | undefined | null, tipeSoal?: string): boolean {
  const normUser = normalizeAnswer(userAns);
  const normKey = normalizeAnswer(keyAns);
  if (!normUser || !normKey) return false;
  if (normUser === normKey) return true;

  if (tipeSoal === "pernyataan" || (normKey.includes(":") && normUser.includes(":"))) {
    const parsePairs = (str: string) => {
      const map: Record<string, string> = {};
      str.split(";").forEach((p) => {
        const [k, ...v] = p.split(":");
        if (k && v.length) map[k.trim()] = normalizeStatementValue(v.join(":"));
      });
      return map;
    };
    const userMap = parsePairs(normUser);
    const keyMap = parsePairs(normKey);
    const keyEntries = Object.entries(keyMap);
    if (keyEntries.length === 0) return false;
    return keyEntries.every(([k, v]) => userMap[k] === v);
  }

  return false;
}

function cleanHtmlEntities(str: string | undefined | null): string {
  if (!str) return "";
  return str
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&ldquo;|&rdquo;/gi, '"')
    .replace(/&lsquo;|&rsquo;/gi, "'")
    .trim();
}

export function cleanPlainText(str: string | undefined | null): string {
  if (!str) return "";
  return cleanHtmlEntities(str.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ")).trim();
}

export function getDeduplicatedSoalText(soal: string, bacaan?: string | null): string {
  if (!soal || typeof soal !== "string") return "";
  if (!bacaan || typeof bacaan !== "string" || !bacaan.trim()) return soal;

  let cleaned = soal;

  // 1. Remove any <div class="exam-bacaan"[^>]*>...</div> or <div class="wacana"[^>]*>...</div>
  cleaned = cleaned.replace(/<div\s+class=["'](?:exam-bacaan|wacana)[^"']*["'][^>]*>[\s\S]*?<\/div>/gi, "").trim();

  // Helper to extract clean plain text for comparison
  const stripTags = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const plainBacaan = stripTags(bacaan);
  const plainSoal = stripTags(cleaned);

  if (!plainBacaan || !plainSoal) return cleaned || soal;

  // 2. Check if soal has paragraphs (<p>...</p>) where initial paragraph(s) match bacaan
  const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  const pMatches = [...cleaned.matchAll(pRegex)];

  if (pMatches.length > 1) {
    let removeCount = 0;
    for (let i = 0; i < pMatches.length - 1; i++) {
      const pText = stripTags(pMatches[i][1]);
      if (pText.length > 15 && plainBacaan.includes(pText)) {
        removeCount++;
      } else {
        break;
      }
    }
    if (removeCount > 0 && removeCount < pMatches.length) {
      let remaining = cleaned;
      for (let i = 0; i < removeCount; i++) {
        remaining = remaining.replace(pMatches[i][0], "");
      }
      const trimmed = remaining.trim();
      if (trimmed) return trimmed;
    }
  }

  // 3. Check if soal is separated by double newlines (\n\n)
  const lines = cleaned.split(/\n\s*\n/);
  if (lines.length > 1) {
    let removeCount = 0;
    for (let i = 0; i < lines.length - 1; i++) {
      const lineText = stripTags(lines[i]);
      if (lineText.length > 15 && plainBacaan.includes(lineText)) {
        removeCount++;
      } else {
        break;
      }
    }
    if (removeCount > 0 && removeCount < lines.length) {
      const trimmed = lines.slice(removeCount).join("\n\n").trim();
      if (trimmed) return trimmed;
    }
  }

  // 4. Check if cleaned begins with plainBacaan prefix
  const minPrefix = 30;
  if (plainBacaan.length >= minPrefix) {
    const bacaanPrefix = plainBacaan.slice(0, Math.min(100, plainBacaan.length));
    if (plainSoal.startsWith(bacaanPrefix)) {
      const bacaanWords = plainBacaan.split(/\s+/);
      const soalWords = plainSoal.split(/\s+/);
      let matchIdx = 0;
      while (matchIdx < bacaanWords.length && matchIdx < soalWords.length && bacaanWords[matchIdx].toLowerCase() === soalWords[matchIdx].toLowerCase()) {
        matchIdx++;
      }
      if (matchIdx >= 5 && matchIdx < soalWords.length) {
        const remainingWords = soalWords.slice(matchIdx).join(" ");
        if (remainingWords.trim().length > 0) {
          const qMarkIdx = cleaned.lastIndexOf("?");
          if (qMarkIdx !== -1) {
            const beforeQ = cleaned.slice(0, qMarkIdx + 1);
            const lastPeriod = Math.max(beforeQ.lastIndexOf(". "), beforeQ.lastIndexOf("</p>"), beforeQ.lastIndexOf("\n"));
            if (lastPeriod !== -1) {
              const questionPrompt = cleaned.slice(lastPeriod).replace(/^[\.\s<\/p>]+/, "").trim();
              if (questionPrompt.length > 10) return questionPrompt;
            }
          }
          return remainingWords;
        }
      }
    }
  }

  return cleaned || soal;
}

export interface SubjectTrackGroup {
  subject: string;
  category: string;
  totalQuestions: number;
  packages: ExamBankPackage[];
}

export function groupPackagesBySubject(pkgs: ExamBankPackage[]): SubjectTrackGroup[] {
  const map = new Map<string, SubjectTrackGroup>();
  for (const pkg of pkgs) {
    const key = pkg.subtes_or_mapel || "Lainnya";
    if (!map.has(key)) {
      map.set(key, {
        subject: key,
        category: pkg.kategori || "wajib",
        totalQuestions: 0,
        packages: [],
      });
    }
    const grp = map.get(key)!;
    grp.packages.push(pkg);
    grp.totalQuestions += (pkg.total_questions || 0);
  }
  return Array.from(map.values());
}

export function pickQuickMatchPackage(pkgs: ExamBankPackage[]): ExamBankPackage | null {
  if (!pkgs || pkgs.length === 0) return null;
  const pusmendik = pkgs.filter((p) => p.source === "pusmendik_tka");
  const pool = pusmendik.length > 0 ? pusmendik : pkgs;
  return pool[Math.floor(Math.random() * pool.length)];
}

function getSubjectIcon(subject: string) {
  const s = subject.toLowerCase();
  if (s.includes("matematika") || s.includes("kuantitatif") || s.includes("penalaran matematika")) {
    return Layers;
  }
  if (s.includes("indonesia") || s.includes("bacaan") || s.includes("literasi dalam bahasa indonesia") || s.includes("ppu") || s.includes("pbm")) {
    return BookOpen;
  }
  if (s.includes("inggris") || s.includes("literasi dalam bahasa inggris")) {
    return Award;
  }
  if (s.includes("sosiologi")) {
    return Trophy;
  }
  if (s.includes("ekonomi")) {
    return Flame;
  }
  if (s.includes("drill") || s.includes("ai")) {
    return Sparkles;
  }
  return BookOpen;
}

function hasActualContent(htmlOrText?: string | null): boolean {
  if (!htmlOrText || typeof htmlOrText !== "string") return false;
  const textOnly = htmlOrText
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  const hasImg = /<img\b[^>]*>/i.test(htmlOrText);
  return textOnly.length > 0 || hasImg;
}

function ImageLightboxModal({
  image,
  onClose,
}: {
  image: { src: string; title?: string } | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!image) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [image, onClose]);

  if (!image) return null;

  return (
    <div
      className="cbt-lightbox-modal"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(15, 23, 42, 0.85)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        zIndex: 10000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: 14,
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
          maxWidth: "92vw",
          maxHeight: "90vh",
          width: "auto",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          border: "1px solid #e2e8f0",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 18px",
            borderBottom: "1px solid #e5ebe1",
            backgroundColor: "#f8faf7",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13.5, fontWeight: 800, color: "#18221f" }}>
              {image.title || "Zoom Diagram"}
            </span>
            <span style={{ fontSize: 11, color: "#64748b", fontWeight: 500 }}>
              (Resolusi Penuh)
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            title="Tutup (Esc)"
            style={{
              background: "none",
              border: "none",
              color: "#64748b",
              cursor: "pointer",
              padding: 4,
              borderRadius: 6,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div
          style={{
            padding: 16,
            overflow: "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#fcfdfc",
            maxHeight: "calc(90vh - 65px)",
          }}
        >
          <img
            src={image.src}
            alt={image.title || "Diagram Zoom"}
            style={{
              maxWidth: "100%",
              maxHeight: "calc(85vh - 75px)",
              width: "auto",
              height: "auto",
              objectFit: "contain",
              borderRadius: 8,
            }}
          />
        </div>
      </div>
    </div>
  );
}

export const ExamCbtTab = React.memo(function ExamCbtTab({
  activeTab,
  setActiveTab,
  onOpenNara,
  onOpenRoomModal,
  roomCbtSession,
  onClearRoomCbtSession,
  onRunnerStateChange
}: ExamCbtTabProps) {
  // Packages list state
  const [packages, setPackages] = useState<ExamBankPackage[]>([]);
  const [isLoadingPackages, setIsLoadingPackages] = useState(false);
  const [packageError, setPackageError] = useState<string | null>(null);

  // Submissions history state
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);

  // Filter state
  const [selectedCategory, setSelectedCategory] = useState<CbtCategory>("sma_wajib");
  const [selectedSubject, setSelectedSubject] = useState<string>("Semua");
  const [searchQuery, setSearchQuery] = useState("");

  // Live CBT runner state (Auto-restored from localStorage if refreshed)
  const [currentPackage, setCurrentPackage] = useState<ExamBankPackage | null>(() => {
    try {
      const saved = localStorage.getItem("tanka_cbt_active_package");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [items, setItems] = useState<ExamBankItem[]>(() => {
    try {
      const saved = localStorage.getItem("tanka_cbt_active_items");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [mode, setMode] = useState<CbtMode>(() => {
    try {
      const savedPkg = localStorage.getItem("tanka_cbt_active_package");
      const savedItems = localStorage.getItem("tanka_cbt_active_items");
      if (savedPkg && savedItems && JSON.parse(savedItems).length > 0) return "runner";
    } catch {}
    return "selector";
  });
  const [studyMode, setStudyMode] = useState<StudyMode>(() => {
    try {
      const saved = localStorage.getItem("tanka_cbt_study_mode");
      return (saved as StudyMode) || "exam";
    } catch {
      return "exam";
    }
  });
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(() => {
    try {
      const saved = localStorage.getItem("tanka_cbt_current_index");
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });
  const [answers, setAnswers] = useState<Record<number, string>>(() => {
    try {
      const saved = localStorage.getItem("tanka_cbt_answers");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [doubtful, setDoubtful] = useState<Record<number, boolean>>(() => {
    try {
      const saved = localStorage.getItem("tanka_cbt_doubtful");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [drillChecked, setDrillChecked] = useState<Record<number, boolean>>(() => {
    try {
      const saved = localStorage.getItem("tanka_cbt_drill_checked");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [timeLeft, setTimeLeft] = useState(() => {
    try {
      const saved = localStorage.getItem("tanka_cbt_time_left");
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });
  const [isTimerRunning, setIsTimerRunning] = useState(() => {
    try {
      const savedPkg = localStorage.getItem("tanka_cbt_active_package");
      return Boolean(savedPkg);
    } catch {
      return false;
    }
  });
  const [timeSpentSeconds, setTimeSpentSeconds] = useState(() => {
    try {
      const saved = localStorage.getItem("tanka_cbt_time_spent");
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isWacanaCollapsed, setIsWacanaCollapsed] = useState(false);
  const [zoomImage, setZoomImage] = useState<{ src: string; title?: string } | null>(null);
  const [isWacanaModalOpen, setIsWacanaModalOpen] = useState(false);
  const [isSoalModalOpen, setIsSoalModalOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const dragControls = useDragControls();

  // Native mobile back button & swipe gesture handling for open modal sheets
  const isPopStateRef = useRef(false);
  const currentModalRef = useRef<string | null>(null);

  useEffect(() => {
    const activeModalId = zoomImage
      ? "zoom"
      : isSoalModalOpen
      ? "soal"
      : isWacanaModalOpen
      ? "wacana"
      : isPaletteOpen
      ? "palette"
      : null;

    if (!activeModalId) {
      if (!isPopStateRef.current && typeof window !== "undefined" && window.history.state?.tanka_modal) {
        window.history.back();
      }
      isPopStateRef.current = false;
      currentModalRef.current = null;
      return;
    }

    if (!isPopStateRef.current && typeof window !== "undefined") {
      if (
        currentModalRef.current &&
        activeModalId !== currentModalRef.current &&
        window.history.state?.tanka_modal === currentModalRef.current
      ) {
        window.history.back();
      } else if (window.history.state?.tanka_modal !== activeModalId) {
        window.history.pushState({ tanka_modal: activeModalId, timestamp: Date.now() }, "");
      }
    }

    currentModalRef.current = activeModalId;
    isPopStateRef.current = false;

    const handlePopState = () => {
      isPopStateRef.current = true;
      if (zoomImage) {
        setZoomImage(null);
      } else if (isSoalModalOpen) {
        setIsSoalModalOpen(false);
      } else if (isWacanaModalOpen) {
        setIsWacanaModalOpen(false);
      } else if (isPaletteOpen) {
        setIsPaletteOpen(false);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isSoalModalOpen, isWacanaModalOpen, isPaletteOpen, zoomImage]);

  // Font zoom level state (14px, 16px, 18px)
  const [fontSizeLevel, setFontSizeLevel] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("tanka_cbt_font_size");
      return saved ? parseInt(saved, 10) : 15;
    } catch {
      return 15;
    }
  });

  const cycleFontSize = () => {
    setFontSizeLevel((prev) => {
      const next = prev === 14 ? 16 : prev === 16 ? 18 : 14;
      try { localStorage.setItem("tanka_cbt_font_size", String(next)); } catch {}
      return next;
    });
  };

  // Resizable CBT Split Pane state
  const [cbtSplitRatio, setCbtSplitRatio] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("tanka_cbt_split_ratio");
      return saved ? Math.max(25, Math.min(parseInt(saved, 10), 75)) : 46;
    } catch {
      return 46;
    }
  });
  const [isResizingCbt, setIsResizingCbt] = useState(false);
  const cbtGridRef = useRef<HTMLDivElement>(null);
  const splitRatioRef = useRef(cbtSplitRatio);
  splitRatioRef.current = cbtSplitRatio;

  const startCbtResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const container = cbtGridRef.current;
    if (!container) return;
    setIsResizingCbt(true);
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";

    const onMouseMove = (moveEvent: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const relativeX = moveEvent.clientX - rect.left;
      const pct = Math.max(25, Math.min(Math.round((relativeX / rect.width) * 100), 75));
      splitRatioRef.current = pct;
      setCbtSplitRatio(pct);
    };

    const onMouseUp = () => {
      setIsResizingCbt(false);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      try {
        localStorage.setItem("tanka_cbt_split_ratio", String(splitRatioRef.current));
      } catch {}
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }, []);

  // Auto-persist active runner session to localStorage
  useEffect(() => {
    if (mode === "runner" && currentPackage && items.length > 0) {
      try {
        localStorage.setItem("tanka_cbt_active_package", JSON.stringify(currentPackage));
        localStorage.setItem("tanka_cbt_active_items", JSON.stringify(items));
        localStorage.setItem("tanka_cbt_study_mode", studyMode);
        localStorage.setItem("tanka_cbt_current_index", String(currentIndex));
        localStorage.setItem("tanka_cbt_answers", JSON.stringify(answers));
        localStorage.setItem("tanka_cbt_doubtful", JSON.stringify(doubtful));
        localStorage.setItem("tanka_cbt_drill_checked", JSON.stringify(drillChecked));
        localStorage.setItem("tanka_cbt_time_left", String(timeLeft));
        localStorage.setItem("tanka_cbt_time_spent", String(timeSpentSeconds));
      } catch (e) {
        console.warn("Save CBT state error:", e);
      }
    } else if (mode === "selector" || mode === "review") {
      try {
        localStorage.removeItem("tanka_cbt_active_package");
        localStorage.removeItem("tanka_cbt_active_items");
        localStorage.removeItem("tanka_cbt_study_mode");
        localStorage.removeItem("tanka_cbt_current_index");
        localStorage.removeItem("tanka_cbt_answers");
        localStorage.removeItem("tanka_cbt_doubtful");
        localStorage.removeItem("tanka_cbt_drill_checked");
        localStorage.removeItem("tanka_cbt_time_left");
        localStorage.removeItem("tanka_cbt_time_spent");
      } catch {}
    }
  }, [mode, currentPackage, items, studyMode, currentIndex, answers, doubtful, drillChecked, timeLeft, timeSpentSeconds]);

  // Cloud CBT Active Session Auto-Save (Debounced 3.5s)
  useEffect(() => {
    if (mode !== "runner" || !currentPackage || items.length === 0) return;

    const rawUser = localStorage.getItem("tanka_user_account");
    const token = localStorage.getItem("tanka_session_token");
    let userId = "";
    if (rawUser) {
      try {
        const u = JSON.parse(rawUser);
        userId = u.id;
      } catch {}
    }

    if (!userId || userId === "user_guest") return;

    const timer = setTimeout(() => {
      fetch("/api/exam-bank/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          userId,
          packageId: currentPackage.id,
          currentIndex,
          answers,
          doubtful,
          drillChecked,
          timeLeft,
          studyMode
        })
      }).catch((e) => {
        console.warn("[CBT] Cloud auto-save failed:", e);
      });
    }, 3500);

    return () => clearTimeout(timer);
  }, [mode, currentPackage, items, currentIndex, answers, doubtful, drillChecked, timeLeft, studyMode]);

  // Cloud CBT Active Session Resume on Mount
  useEffect(() => {
    let isMounted = true;

    const resumeCloudSession = async () => {
      const rawUser = localStorage.getItem("tanka_user_account");
      const token = localStorage.getItem("tanka_session_token");
      let userId = "";
      if (rawUser) {
        try {
          const u = JSON.parse(rawUser);
          userId = u.id;
        } catch {}
      }

      if (!userId || userId === "user_guest") return;

      try {
        const res = await fetch(`/api/exam-bank/session?userId=${encodeURIComponent(userId)}`, {
          headers: {
            ...(token ? { "Authorization": `Bearer ${token}` } : {})
          }
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!isMounted || !data || !data.session) return;

        const sess = data.session;
        if (sess.package && sess.items && sess.items.length > 0) {
          const hasLocalRunner = Boolean(localStorage.getItem("tanka_cbt_active_package"));
          if (!hasLocalRunner || mode === "selector") {
            setCurrentPackage(sess.package);
            setItems(sess.items);
            setCurrentIndex(Number(sess.currentIndex || 0));
            setAnswers(sess.answers || {});
            setDoubtful(sess.doubtful || {});
            setDrillChecked(sess.drillChecked || {});
            setTimeLeft(Number(sess.timeLeft) || 0);
            setStudyMode((sess.studyMode as StudyMode) || "exam");
            setMode("runner");
            setIsTimerRunning(true);
          }
        }
      } catch (err) {
        console.warn("[CBT] Cloud resume session error:", err);
      }
    };

    resumeCloudSession();

    return () => {
      isMounted = false;
    };
  }, []);

  // Synchronize runner state & package title to root App (TopBar title & MobileBottomNav visibility)
  useEffect(() => {
    const isRunning = mode === "runner";
    const pkgTitle = currentPackage
      ? `${currentPackage.subtes_or_mapel}${currentPackage.paket ? ` (${currentPackage.paket})` : ""}`
      : "";
    onRunnerStateChange?.(isRunning, pkgTitle);
  }, [mode, currentPackage, onRunnerStateChange]);

  // Listen for Multiplayer Room CBT start
  useEffect(() => {
    if (roomCbtSession && roomCbtSession.items && roomCbtSession.items.length > 0) {
      setStudyMode("exam");
      setCurrentPackage(roomCbtSession.pkg);
      setItems(roomCbtSession.items);
      setCurrentIndex(0);
      setAnswers({});
      setDoubtful({});
      setDrillChecked({});

      const totalSeconds = Math.max(180, roomCbtSession.items.length * 90);
      setTimeLeft(totalSeconds);
      setTimeSpentSeconds(0);
      setIsTimerRunning(true);
      setMode("runner");
      setIsPaletteOpen(false);
      setReviewResult(null);

      if (onClearRoomCbtSession) {
        onClearRoomCbtSession();
      }
    }
  }, [roomCbtSession, onClearRoomCbtSession]);

  // AI Drill Generator state
  const [isAiGeneratorOpen, setIsAiGeneratorOpen] = useState(false);
  const [isGeneratingAiDrill, setIsGeneratingAiDrill] = useState(false);
  const [aiSubject, setAiSubject] = useState("Bahasa Indonesia");
  const [aiPola, setAiPola] = useState("all");
  const [aiTopic, setAiTopic] = useState("");
  const [aiCount, setAiCount] = useState(25);
  const [aiTier, setAiTier] = useState<"standard" | "challenge">("standard");
  const [aiError, setAiError] = useState<string | null>(null);

  // Review state
  const [reviewResult, setReviewResult] = useState<ExamBankSubmitResult | null>(null);
  const [reviewFilter, setReviewFilter] = useState<"all" | "wrong" | "correct">("all");
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({});

  // Dedicated AI Diagnostic Panel state
  const [isDiagnosticModalOpen, setIsDiagnosticModalOpen] = useState(false);
  const [isLoadingDiagnostic, setIsLoadingDiagnostic] = useState(false);
  const [diagnosticData, setDiagnosticData] = useState<any>(null);
  const [diagnosticError, setDiagnosticError] = useState<string | null>(null);
  const [isCopiedDiagnostic, setIsCopiedDiagnostic] = useState(false);

  const handleCopyDiagnosticReport = () => {
    if (!diagnosticData) return;
    let text = `Nara Pedagogical Autopsy\n`;
    text += `Laporan Bedah Diagnostik Kesalahan\n`;
    text += `Paket: ${currentPackage?.subtes_or_mapel || "Bahasa Indonesia"} (${currentPackage?.paket || "Simulasi"}) • Skor Akurasi: ${reviewResult?.score_percent}%\n\n`;
    text += `Ringkasan Evaluasi Kognitif:\n${diagnosticData.executiveSummary || ""}\n\n`;
    if (Array.isArray(diagnosticData.weaknessPatterns) && diagnosticData.weaknessPatterns.length > 0) {
      text += `Pola Soal yang Menjadi Titik Lemah:\n`;
      diagnosticData.weaknessPatterns.forEach((wp: any) => {
        text += `• ${wp.pola}\n  Gejala: ${wp.gejala}\n  Tips Cepat: ${wp.tipsCepat}\n\n`;
      });
    }
    if (Array.isArray(diagnosticData.items) && diagnosticData.items.length > 0) {
      text += `Bedah Rinci Per Butir Soal yang Salah:\n`;
      diagnosticData.items.forEach((it: any) => {
        text += `Nomor ${it.nomor} • ${it.pola}\n`;
        text += `Pilihan Anda: ${it.jawabanSiswa} | Kunci: ${it.kunciResmi}\n`;
        text += `Soal: ${it.pertanyaanRingkas}\n`;
        text += `Bukti Teks Wacana: "${it.buktiTeks}"\n`;
        text += `Bongkar Jebakan: ${it.analisisJebakan}\n\n`;
      });
    }
    if (Array.isArray(diagnosticData.actionPlan) && diagnosticData.actionPlan.length > 0) {
      text += `Rekomendasi Tindakan Sesi Berikutnya:\n`;
      diagnosticData.actionPlan.forEach((act: string) => {
        text += `• ${act}\n`;
      });
    }
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      setIsCopiedDiagnostic(true);
      setTimeout(() => setIsCopiedDiagnostic(false), 2000);
    }
  };

  const handlePrintDiagnosticReport = () => {
    window.print();
  };

  // 1. Fetch packages on initial mount
  const fetchPackages = useCallback(async () => {
    setIsLoadingPackages(true);
    setPackageError(null);
    try {
      const res = await fetch("/api/exam-bank/packages");
      if (!res.ok) throw new Error("Gagal memuat paket ujian");
      const data = await res.json();
      setPackages(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setPackageError(err.message || "Gagal memuat daftar paket");
    } finally {
      setIsLoadingPackages(false);
    }
  }, []);

  const fetchSubmissions = useCallback(async () => {
    setIsLoadingSubmissions(true);
    try {
      const res = await fetch("/api/exam-bank/submissions");
      if (!res.ok) throw new Error("Gagal mengambil riwayat");
      const data = await res.json();
      setSubmissions(Array.isArray(data.submissions) ? data.submissions : []);
    } catch (e) {
      console.warn("Failed to load cbt submissions:", e);
    } finally {
      setIsLoadingSubmissions(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "cbt") {
      if (packages.length === 0) {
        fetchPackages();
      }
      fetchSubmissions();
    }
  }, [activeTab, packages.length, fetchPackages, fetchSubmissions]);

  // Distinct subjects for current category
  const availableSubjects = useMemo(() => {
    const list = packages
      .filter((p) => {
        if (selectedCategory === "sma_wajib") return (p.source === "pusmendik_tka" || p.source === "ai_drill") && p.kategori === "wajib";
        if (selectedCategory === "sma_pilihan") return (p.source === "pusmendik_tka" || p.source === "ai_drill") && p.kategori === "pilihan";
        if (selectedCategory === "utbk_snbt") return p.source === "stekom_utbk";
        if (selectedCategory === "ai_drill") return p.source === "ai_drill";
        return true;
      })
      .map((p) => p.subtes_or_mapel);
    return Array.from(new Set(list));
  }, [packages, selectedCategory]);

  // Filtered packages
  const filteredPackages = useMemo(() => {
    return packages.filter((p) => {
      if (selectedCategory === "sma_wajib") {
        if (!((p.source === "pusmendik_tka" || p.source === "ai_drill") && p.kategori === "wajib")) return false;
      } else if (selectedCategory === "sma_pilihan") {
        if (!((p.source === "pusmendik_tka" || p.source === "ai_drill") && p.kategori === "pilihan")) return false;
      } else if (selectedCategory === "utbk_snbt") {
        if (p.source !== "stekom_utbk") return false;
      } else if (selectedCategory === "ai_drill") {
        if (p.source !== "ai_drill") return false;
      }

      if (selectedSubject !== "Semua" && p.subtes_or_mapel !== selectedSubject) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = p.subtes_or_mapel.toLowerCase().includes(q);
        const matchPaket = p.paket.toLowerCase().includes(q);
        if (!matchTitle && !matchPaket) return false;
      }
      return true;
    });
  }, [packages, selectedCategory, selectedSubject, searchQuery]);

  // Grouped packages for Subject-Grouped Tracklist
  const groupedPackages = useMemo(() => {
    return groupPackagesBySubject(filteredPackages);
  }, [filteredPackages]);

  // Subject accordion collapse state
  const [collapsedSubjects, setCollapsedSubjects] = useState<Record<string, boolean>>({});

  const toggleSubject = useCallback((subj: string) => {
    setCollapsedSubjects((prev) => ({
      ...prev,
      [subj]: !prev[subj],
    }));
  }, []);

  // Delete an AI drill package
  const handleDeletePackage = async (pkgId: string) => {
    if (!confirm("Hapus paket latihan AI ini dari database?")) return;
    try {
      const res = await fetch(`/api/exam-bank/packages/${encodeURIComponent(pkgId)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Gagal menghapus paket");
      setPackages((prev) => prev.filter((p) => p.id !== pkgId));
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  // 2. Start simulation or drill: load package items and start timer
  const handleStartSimulation = async (pkg: ExamBankPackage, chosenMode: StudyMode = "exam") => {
    setIsLoadingItems(true);
    try {
      const res = await fetch(`/api/exam-bank/packages/${encodeURIComponent(pkg.id)}`);
      if (!res.ok) throw new Error("Gagal mengambil soal simulasi");
      const data = await res.json();

      const fetchedItems: ExamBankItem[] = data.items || [];
      if (fetchedItems.length === 0) {
        alert("Paket ini belum memiliki soal.");
        return;
      }

      setStudyMode(chosenMode);
      setCurrentPackage(data.package || pkg);
      setItems(fetchedItems);
      setCurrentIndex(0);
      setAnswers({});
      setDoubtful({});
      setDrillChecked({});

      // Time allowance: 2 minutes per question
      const totalSeconds = (fetchedItems.length || 30) * 120;
      setTimeLeft(totalSeconds);
      setTimeSpentSeconds(0);
      setIsTimerRunning(true);
      setMode("runner");
      setIsPaletteOpen(false);
    } catch (err: any) {
      alert("Error memulai sesi CBT: " + err.message);
    } finally {
      setIsLoadingItems(false);
    }
  };

  // Quick Match Pusmendik (1-click random official exam package launch)
  const handleQuickMatch = useCallback(() => {
    const target = pickQuickMatchPackage(packages);
    if (target) {
      handleStartSimulation(target, "exam");
    } else {
      alert("Belum ada paket ujian yang tersedia.");
    }
  }, [packages, handleStartSimulation]);

  // Generate & Launch AI Drill Session (Can launch as 'exam' or 'drill')
  const handleGenerateAiDrill = async (targetMode: StudyMode = "exam") => {
    setIsGeneratingAiDrill(true);
    setAiError(null);
    try {
      const controller = new AbortController();
      const fetchTimer = setTimeout(() => controller.abort(), 180000);

      const res = await fetch("/api/exam-bank/generate-ai-drill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          subject: aiSubject,
          pola: aiPola,
          count: aiCount,
          topic: aiTopic,
          tier: aiTier
        })
      });
      clearTimeout(fetchTimer);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mencetak soal drill AI");

      if (data.package) {
        setPackages((prev) => [data.package, ...prev]);
        setIsAiGeneratorOpen(false);
        await handleStartSimulation(data.package, targetMode);
      }
    } catch (err: any) {
      console.error("[CBT] Gagal generate AI drill:", err);
      let errMsg = err.message || "Terjadi kesalahan saat generate drill";
      if (err.name === "AbortError" || errMsg.includes("aborted")) {
        errMsg = "Proses generate memakan waktu lebih dari 3 menit. Silakan pilih jumlah butir yang lebih sedikit (5 atau 10 butir).";
      } else if (errMsg.includes("Failed to fetch") || errMsg.includes("NetworkError")) {
        errMsg = "Koneksi ke backend lokal terputus sesaat. Coba klik sekali lagi, data model sedang dimuat.";
      }
      setAiError(errMsg);
    } finally {
      setIsGeneratingAiDrill(false);
    }
  };

  // Launch Multiplayer Study Room Challenge from this Exam Package
  const handleChallengeRoom = async (pkg: ExamBankPackage) => {
    try {
      const rawUser = localStorage.getItem("tanka_user_account");
      let user = { id: "user_guest", name: "Peserta TKA" };
      if (rawUser) {
        try {
          user = JSON.parse(rawUser);
        } catch {}
      }
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId: pkg.id,
          title: `Adu Soal TKA: ${pkg.subtes_or_mapel} (${pkg.paket})`,
          userId: user.id || "user_guest",
          userName: user.name || (user as any).username || "Peserta TKA",
          maxParticipants: 4,
          quizCount: pkg.total_questions || 5,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuat ruang adu");
      if (onOpenRoomModal && data.room) {
        onOpenRoomModal(data.room.id);
      }
    } catch (err: any) {
      alert("Gagal membuka ruang tantangan: " + err.message);
    }
  };

  // Generate & Launch AI Drill directly into Multiplayer Room
  const handleGenerateAiDrillWithRoom = async () => {
    setIsGeneratingAiDrill(true);
    setAiError(null);
    try {
      const res = await fetch("/api/exam-bank/generate-ai-drill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: aiSubject,
          pola: aiPola,
          count: aiCount,
          topic: aiTopic,
          tier: aiTier,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mencetak soal drill AI");

      if (data.package) {
        setPackages((prev) => [data.package, ...prev]);
        setIsAiGeneratorOpen(false);
        await handleChallengeRoom(data.package);
      }
    } catch (err: any) {
      setAiError(err.message || "Terjadi kesalahan saat generate drill kompetisi");
    } finally {
      setIsGeneratingAiDrill(false);
    }
  };

  // Dedicated AI Diagnostic Autopsy Handler (Opens Full Panel)
  const handleOpenDiagnosticPanel = async (targetItems?: ExamBankSubmitBreakdown[]) => {
    if (!reviewResult || !currentPackage) return;
    const wrongList = targetItems || reviewResult.breakdown.filter((b) => !b.is_correct);
    if (wrongList.length === 0) {
      alert("Hebat! Anda tidak memiliki jawaban salah pada simulasi ini.");
      return;
    }

    setIsDiagnosticModalOpen(true);
    setIsLoadingDiagnostic(true);
    setDiagnosticError(null);

    try {
      const res = await fetch("/api/exam-bank/diagnostic-autopsy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId: currentPackage.id,
          scorePercent: reviewResult.score_percent,
          estimatedIrt: reviewResult.estimated_irt,
          wrongItems: wrongList,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memproses bedah diagnostik");
      setDiagnosticData(data.diagnostic);
    } catch (err: any) {
      setDiagnosticError(err.message || "Gagal memuat evaluasi AI");
    } finally {
      setIsLoadingDiagnostic(false);
    }
  };

  // Retry only the wrong questions in interactive drill mode
  const handleRetryWrongQuestions = () => {
    if (!reviewResult || !currentPackage) return;
    const wrongNumbers = reviewResult.breakdown.filter((b) => !b.is_correct).map((b) => b.nomor);
    const retryItems = items.filter((it) => wrongNumbers.includes(it.nomor));
    if (retryItems.length === 0) return;

    setIsDiagnosticModalOpen(false);
    setItems(retryItems);
    setCurrentIndex(0);
    setAnswers({});
    setDoubtful({});
    setDrillChecked({});
    setStudyMode("drill");
    setMode("runner");
    setTimeSpentSeconds(0);
    setIsTimerRunning(true);
  };

  // Timer hook: countdown for exam mode, elapsed for drill mode
  useEffect(() => {
    if (mode !== "runner" || !isTimerRunning) return;

    const timer = setInterval(() => {
      if (studyMode === "exam") {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleSubmitExam(true);
            return 0;
          }
          return prev - 1;
        });
      }
      setTimeSpentSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [mode, isTimerRunning, studyMode]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // 3. Selection handler for current item
  const currentItem = items[currentIndex] || null;

  // Synchronize active CBT Question & Passage Context for Tanya Nara
  useEffect(() => {
    if (mode === "runner" && currentItem && currentPackage) {
      const context = {
        packageId: currentPackage.id,
        packageName: currentPackage.paket,
        subject: currentPackage.subtes_or_mapel,
        currentNomor: currentItem.nomor,
        totalQuestions: items.length,
        bacaan: currentItem.bacaan || "",
        currentItem: {
          nomor: currentItem.nomor,
          tipe_soal: currentItem.tipe_soal,
          soal: currentItem.soal,
          options: currentItem.options,
          userAnswer: answers[currentItem.nomor] || "",
          kunci: currentItem.kunci_jawaban,
          kunciText: currentItem.kunci_jawaban_text || "",
        },
        allQuestions: items.map((it) => ({
          nomor: it.nomor,
          soal: it.soal.replace(/<[^>]+>/g, " ").trim().slice(0, 90),
          tipe: it.tipe_soal,
        })),
      };
      try {
        localStorage.setItem("tanka_active_cbt_context", JSON.stringify(context));
      } catch {}
    } else if (mode === "review" && reviewResult && currentPackage) {
      const context = {
        packageId: currentPackage.id,
        packageName: currentPackage.paket,
        subject: currentPackage.subtes_or_mapel,
        mode: "review",
        scorePercent: reviewResult.score_percent,
        estimatedIrt: reviewResult.estimated_irt,
        breakdown: reviewResult.breakdown.map((b) => ({
          nomor: b.nomor,
          isCorrect: b.is_correct,
          userAnswer: b.user_answer,
          kunci: b.kunci_jawaban,
          soal: b.soal.replace(/<[^>]+>/g, " ").trim().slice(0, 90),
        })),
      };
      try {
        localStorage.setItem("tanka_active_cbt_context", JSON.stringify(context));
      } catch {}
    } else if (mode === "selector") {
      try {
        localStorage.removeItem("tanka_active_cbt_context");
      } catch {}
    }
  }, [mode, currentIndex, currentItem, currentPackage, answers, items, reviewResult]);

  const handleSelectOption = (optionId: string) => {
    if (!currentItem) return;
    const nomor = currentItem.nomor;
    const isComplex = currentItem.tipe_soal === "pilihan_ganda_kompleks" || currentItem.kunci_jawaban.includes(";");

    if (isComplex) {
      if (studyMode === "drill" && drillChecked[nomor]) {
        return;
      }
      setAnswers((prev) => {
        const currentVal = prev[nomor] || "";
        const selectedParts = currentVal ? currentVal.split(";").filter(Boolean) : [];
        let updated: string[];
        if (selectedParts.includes(optionId)) {
          updated = selectedParts.filter((id) => id !== optionId);
        } else {
          updated = [...selectedParts, optionId].sort();
        }
        return {
          ...prev,
          [nomor]: updated.join(";"),
        };
      });
    } else {
      setAnswers((prev) => ({
        ...prev,
        [nomor]: optionId,
      }));
    }
  };

  const handleSelectStatementRow = (statementId: string, choice: string) => {
    if (!currentItem) return;
    const nomor = currentItem.nomor;
    if (studyMode === "drill" && drillChecked[nomor]) {
      return;
    }
    setAnswers((prev) => {
      const currentVal = prev[nomor] || "";
      const map = parseStatementAnswers(currentVal);
      map[statementId.toLowerCase()] = choice;
      const updated = serializeStatementAnswers(map);
      return {
        ...prev,
        [nomor]: updated,
      };
    });
  };

  const handleCheckDrillAnswer = (nomor: number) => {
    setDrillChecked((prev) => ({
      ...prev,
      [nomor]: true,
    }));
  };

  const handleResetDrillAnswer = (nomor: number) => {
    setDrillChecked((prev) => ({
      ...prev,
      [nomor]: false,
    }));
  };

  const handleToggleDoubtful = () => {
    if (!currentItem) return;
    const nomor = currentItem.nomor;
    setDoubtful((prev) => ({
      ...prev,
      [nomor]: !prev[nomor],
    }));
  };

  // Keyboard shortcut listener (A-E, R, ArrowLeft, ArrowRight)
  useEffect(() => {
    if (mode !== "runner" || !currentItem) return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (isPaletteOpen || isSoalModalOpen || isWacanaModalOpen || Boolean(zoomImage) || isSubmitModalOpen) {
        return;
      }

      const key = e.key.toLowerCase();

      if (["a", "b", "c", "d", "e"].includes(key)) {
        if (currentItem.options && currentItem.options.length > 0) {
          const matched = currentItem.options.find(
            (opt) => opt.id.toLowerCase() === key
          );
          if (matched) {
            e.preventDefault();
            handleSelectOption(matched.id);
          }
        }
      } else if (key === "r") {
        e.preventDefault();
        handleToggleDoubtful();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setCurrentIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setCurrentIndex((prev) => Math.min(items.length - 1, prev + 1));
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [
    mode,
    currentItem,
    items.length,
    isPaletteOpen,
    isSoalModalOpen,
    isWacanaModalOpen,
    zoomImage,
    isSubmitModalOpen,
    handleSelectOption,
    handleToggleDoubtful,
  ]);

  // 4. Submit Exam
  const handleSubmitExam = async (isAuto = false) => {
    if (!currentPackage) return;
    setIsSubmitting(true);
    setIsSubmitModalOpen(false);
    setIsTimerRunning(false);

    try {
      const rawUser = localStorage.getItem("tanka_user_account");
      const token = localStorage.getItem("tanka_session_token");
      let uId = "user_guest";
      if (rawUser) {
        try { uId = JSON.parse(rawUser).id; } catch {}
      }
      if (uId && uId !== "user_guest") {
        fetch("/api/exam-bank/session", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { "Authorization": `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ userId: uId })
        }).catch(() => {});
      }

      let result: ExamBankSubmitResult;
      if (currentPackage.id.startsWith("room_")) {
        const roomId = currentPackage.id.replace("room_", "");
        let correctCount = 0;
        const breakdown: ExamBankSubmitBreakdown[] = items.map((it) => {
          const userAns = (answers[it.nomor] || "").trim().toLowerCase();
          const targetKunci = (it.kunci_jawaban || "").trim().toLowerCase();
          const isCorrect = Boolean(userAns && userAns === targetKunci);
          if (isCorrect) correctCount++;
          return {
            id: it.id,
            nomor: it.nomor,
            tipe_soal: it.tipe_soal,
            soal: it.soal,
            bacaan: it.bacaan,
            soal_img: it.soal_img,
            options: it.options,
            user_answer: answers[it.nomor] || "-",
            kunci_jawaban: it.kunci_jawaban,
            kunci_jawaban_text: it.kunci_jawaban_text,
            is_correct: isCorrect
          };
        });
        const finalScore = Math.round((correctCount / (items.length || 1)) * 100);
        result = {
          total: items.length,
          answered: Object.keys(answers).length,
          correct: correctCount,
          score_percent: finalScore,
          estimated_irt: Math.round(300 + finalScore * 4.5),
          breakdown
        };

        try {
          await fetch(`/api/rooms/${roomId}/submit`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: uId,
              score: finalScore,
              correctAnswers: correctCount,
              totalAnswered: items.length
            })
          });
        } catch (e) {
          console.warn("Failed to submit room score:", e);
        }
      } else {
        const res = await fetch(`/api/exam-bank/packages/${encodeURIComponent(currentPackage.id)}/submit`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { "Authorization": `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            answers,
            time_spent_seconds: timeSpentSeconds,
            userId: uId !== "user_guest" ? uId : undefined,
            study_mode: studyMode,
          }),
        });

        if (!res.ok) throw new Error("Gagal mengirim hasil ujian");
        result = await res.json();
      }

      setReviewResult(result);
      setMode("review");
      fetchSubmissions();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      alert("Gagal memproses evaluasi CBT: " + err.message);
      setIsTimerRunning(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5. Autopsy with Nara AI
  const handleBedahWithNara = (item?: ExamBankSubmitBreakdown) => {
    if (!onOpenNara) return;
    if (item) {
      const query = `Halo Nara AI, tolong bedah dan analisis konsep soal ujian ini:
Mata Pelajaran: ${currentPackage?.subtes_or_mapel || ""} (${currentPackage?.paket || ""})
Nomor Soal: ${item.nomor}
${item.bacaan ? `Stimulus/Wacana: "${item.bacaan.slice(0, 300)}..."\n` : ""}Pertanyaan: "${item.soal}"
Jawaban Saya: ${item.user_answer ? item.user_answer.toUpperCase() : "Kosong"}
Kunci Jawaban Resmi: ${item.kunci_jawaban_text || item.kunci_jawaban.toUpperCase()}
Status: ${item.is_correct ? "BENAR" : "SALAH / PERLU EVALUASI"}

Tolong jelaskan akar konsepnya, mengapa opsi kunci jawaban tersebut benar, serta jebakan atau kesalahan penalaran yang sering terjadi.`;
      onOpenNara(query);
    } else if (reviewResult) {
      const wrongItems = reviewResult.breakdown.filter((b) => !b.is_correct);
      const wrongNumbers = wrongItems.map((b) => `No. ${b.nomor}`).join(", ");
      const query = `Halo Nara AI, saya baru menyelesaikan simulasi CBT ${currentPackage?.subtes_or_mapel || ""} (${currentPackage?.paket || ""}) dengan skor ${reviewResult.score_percent}% (Estimasi IRT: ${reviewResult.estimated_irt}).
Saya salah/belum menjawab pada nomor: ${wrongNumbers || "tidak ada"}.
Tolong berikan bedah diagnostik umum tentang kelemahan konsep saya dan materi prioritas apa yang harus saya pelajari ulang.`;
      onOpenNara(query);
    }
  };

  // ==========================================
  // RENDER MODE A: PACKAGE SELECTOR
  // ==========================================
  if (mode === "selector") {
    return (
      <div style={{ padding: "8px 0 96px 0" }}>
        {/* Header Hero */}
        <div
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #dce2d6",
            borderRadius: 16,
            padding: "24px 28px",
            marginBottom: 24,
            boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, backgroundColor: "#f0f4ea", color: "#4b6623", padding: "4px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
              <Award size={14} />
              <span>Official CBT Cockpit</span>
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "#18221f", margin: "0 0 6px 0", letterSpacing: "-0.5px" }}>
              Simulasi CBT & Bank Soal Resmi
            </h1>
            <p style={{ fontSize: 14, color: "#526350", margin: 0, maxWidth: 640 }}>
              Kumpulan naskah asli Pusmendik Kemendikdasmen (TKA SMA) dan UTBK SNBT PTN. Kerjakan dengan antarmuka 1:1 mirip ujian resmi.
            </p>
          </div>

          {/* Quick Stats Pill & AI Drill Generator */}
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => setIsAiGeneratorOpen(true)}
              style={{
                backgroundColor: "#18221f",
                color: "#c8f064",
                border: "1px solid #23352e",
                borderRadius: 12,
                padding: "10px 18px",
                fontWeight: 800,
                fontSize: 13,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                transition: "all 0.15s ease",
              }}
            >
              <Sparkles size={16} color="#c8f064" />
              <span>Cetak Drill AI (6 Pola Baku)</span>
            </button>
            <div style={{ backgroundColor: "#f9fbf7", border: "1px solid #e1e7dd", borderRadius: 12, padding: "10px 16px", textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#18221f" }}>733+</div>
              <div style={{ fontSize: 11, color: "#6e826b", fontWeight: 600 }}>Soal Terverifikasi</div>
            </div>
            <div style={{ backgroundColor: "#f9fbf7", border: "1px solid #e1e7dd", borderRadius: 12, padding: "10px 16px", textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#18221f" }}>{packages.length || 26}</div>
              <div style={{ fontSize: 11, color: "#6e826b", fontWeight: 600 }}>Paket Naskah</div>
            </div>
          </div>
        </div>

        {/* Quick Match Pusmendik Hero Banner */}
        <div className="cbt-quick-match-banner">
          <div style={{ maxWidth: 560 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, backgroundColor: "#23342e", color: "#c8f064", border: "1px solid #334840", padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, marginBottom: 8, fontFamily: "'DM Mono', monospace" }}>
              <Sparkles size={12} color="#c8f064" />
              <span>PUSMENDIK OFFICIAL SPEED MATCH</span>
            </div>
            <h2 style={{ fontSize: 19, fontWeight: 800, color: "#ffffff", margin: "0 0 4px 0", letterSpacing: "-0.3px" }}>
              🎯 Ujian Acak Kilat (Quick Match Pusmendik)
            </h2>
            <p style={{ fontSize: 13, color: "#d1ded6", margin: 0, lineHeight: 1.4 }}>
              Langsung masuk ke simulasi naskah resmi acak dalam 1 klik tanpa pusing memilih. Dilengkapi timer ujian dan estimasi IRT otomatis.
            </p>
          </div>
          <button
            type="button"
            onClick={handleQuickMatch}
            disabled={isLoadingItems || packages.length === 0}
            className="cbt-quick-match-btn"
            title="Mulai simulasi acak paket naskah Pusmendik"
          >
            <Clock size={16} />
            <span>Mulai Ujian Acak Sekarang</span>
            <ArrowRight size={16} />
          </button>
        </div>

        {/* Source & Category Switcher (Segmented Control) */}
        <div className="cbt-filter-section">
          <div className="cbt-category-segmented">
            {[
              { id: "sma_wajib" as const, label: "SMA Wajib", icon: BookOpen },
              { id: "sma_pilihan" as const, label: "SMA Pilihan", icon: Layers },
              { id: "utbk_snbt" as const, label: "UTBK SNBT", icon: Award },
              { id: "ai_drill" as const, label: "AI Drill", icon: Sparkles },
              { id: "history" as const, label: "Riwayat", icon: History },
            ].map((tab) => {
              const isSelected = selectedCategory === tab.id;
              const count =
                tab.id === "sma_wajib"
                  ? packages.filter((p) => (p.source === "pusmendik_tka" || p.source === "ai_drill") && p.kategori === "wajib").length
                  : tab.id === "sma_pilihan"
                  ? packages.filter((p) => (p.source === "pusmendik_tka" || p.source === "ai_drill") && p.kategori === "pilihan").length
                  : tab.id === "utbk_snbt"
                  ? packages.filter((p) => p.source === "stekom_utbk").length
                  : tab.id === "ai_drill"
                  ? packages.filter((p) => p.source === "ai_drill").length
                  : submissions.length;
              const IconComp = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setSelectedCategory(tab.id);
                    setSelectedSubject("Semua");
                  }}
                  className={`cbt-category-tab-btn ${isSelected ? "active" : ""}`}
                >
                  <IconComp size={15} />
                  <span>{tab.label}</span>
                  <span className="cbt-category-badge">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="cbt-search-bar-wrap">
            <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#839780" }} />
            <input
              type="text"
              placeholder="Cari mata pelajaran atau nomor paket..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="cbt-search-input"
            />
          </div>
        </div>

        {/* Subject Pills Filter */}
        {selectedCategory !== "history" && (
          <div className="cbt-subject-pills-rail">
            <button
              onClick={() => setSelectedSubject("Semua")}
              className={`cbt-subject-chip ${selectedSubject === "Semua" ? "active" : ""}`}
            >
              Semua Mapel ({filteredPackages.length})
            </button>
            {availableSubjects.map((sub) => {
              const count = packages.filter((p) => {
                if (selectedCategory === "sma_wajib" && (p.source !== "pusmendik_tka" || p.kategori !== "wajib")) return false;
                if (selectedCategory === "sma_pilihan" && (p.source !== "pusmendik_tka" || p.kategori !== "pilihan")) return false;
                if (selectedCategory === "utbk_snbt" && p.source !== "stekom_utbk") return false;
                return p.subtes_or_mapel === sub;
              }).length;
              const isSelected = selectedSubject === sub;
              return (
                <button
                  key={sub}
                  onClick={() => setSelectedSubject(sub)}
                  className={`cbt-subject-chip ${isSelected ? "active" : ""}`}
                >
                  {sub} ({count})
                </button>
              );
            })}
          </div>
        )}

        {/* Riwayat Pengerjaan CBT */}
        {selectedCategory === "history" ? (
          <div>
            {isLoadingSubmissions ? (
              <div style={{ textAlign: "center", padding: "48px 20px", color: "#526350" }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Memuat riwayat pengerjaan...</div>
              </div>
            ) : submissions.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "48px 24px",
                  backgroundColor: "#ffffff",
                  borderRadius: 16,
                  border: "1px dashed #cbd5e1",
                  margin: "12px 0 24px",
                }}
              >
                <History size={36} color="#94a3b8" style={{ margin: "0 auto 12px" }} />
                <h4 style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", margin: "0 0 6px" }}>
                  Belum Ada Riwayat Pengerjaan
                </h4>
                <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 16px", maxWidth: 420, marginLeft: "auto", marginRight: "auto" }}>
                  Selesaikan simulasi ujian atau paket AI Drill untuk melihat catatan skor, estimasi IRT, dan analisis butir soal di sini.
                </p>
                <button
                  onClick={() => setSelectedCategory("sma_wajib")}
                  style={{
                    padding: "8px 18px",
                    backgroundColor: "#18221f",
                    color: "#c8f064",
                    borderRadius: 8,
                    border: "1px solid #334840",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Pilih Paket Soal
                </button>
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                  gap: 16,
                }}
              >
                {submissions.map((sub: any) => {
                  const dateStr = new Date(sub.createdAt || sub.created_at || Date.now()).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  const scorePct = sub.scorePercent ?? sub.score_percent ?? 0;
                  const isPass = scorePct >= 60;
                  const totalQ = sub.totalQuestions ?? sub.total_questions ?? 0;
                  const correctQ = sub.correctCount ?? sub.correct_count ?? 0;
                  const answeredQ = sub.answeredCount ?? sub.answered_count ?? 0;
                  const estIrt = sub.estimatedIrt ?? sub.estimated_irt ?? 250;
                  const modeTag = (sub.studyMode ?? sub.study_mode) === "drill" ? "AI Drill" : "Simulasi Ujian";

                  return (
                    <div
                      key={sub.id}
                      style={{
                        backgroundColor: "#ffffff",
                        border: "1px solid #dce2d6",
                        borderRadius: 14,
                        padding: 18,
                        boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        gap: 14,
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                          <span
                            style={{
                              backgroundColor: modeTag === "AI Drill" ? "#23342e" : "#18221f",
                              color: modeTag === "AI Drill" ? "#c8f064" : "#d1ded6",
                              border: "1px solid #334840",
                              fontSize: 11,
                              fontWeight: 700,
                              padding: "3px 8px",
                              borderRadius: 6,
                              textTransform: "uppercase",
                              fontFamily: "'DM Mono', monospace",
                            }}
                          >
                            {modeTag}
                          </span>
                          <span style={{ fontSize: 11, color: "#94a3b8" }}>{dateStr}</span>
                        </div>
                        <h4 style={{ fontSize: 16, fontWeight: 800, color: "#18221f", margin: "0 0 8px 0" }}>
                          {sub.packageTitle || sub.package_title || "Paket Latihan"}
                        </h4>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 10 }}>
                          <span style={{ fontSize: 24, fontWeight: 800, color: isPass ? "#16a34a" : "#e05353" }}>
                            {scorePct}%
                          </span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: "#526350" }}>
                            Estimasi IRT: <strong style={{ color: "#4b6623" }}>{estIrt}</strong>
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                          Dijawab: <strong>{answeredQ}</strong>/{totalQ} • Benar:{" "}
                          <strong style={{ color: "#16a34a" }}>{correctQ}</strong> • Salah:{" "}
                          <strong style={{ color: "#e05353" }}>{totalQ - correctQ}</strong>
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, borderTop: "1px solid #f1f5f9", paddingTop: 12 }}>
                        <button
                          onClick={() => {
                            const pkgId = sub.packageId || sub.package_id;
                            const foundPkg = packages.find((p) => p.id === pkgId);
                            const title = sub.packageTitle || sub.package_title || "Paket Soal";
                            setCurrentPackage(
                              foundPkg || {
                                id: pkgId,
                                source: pkgId.startsWith("ai_drill") ? "ai_drill" : "pusmendik_tka",
                                jenjang: "SMA",
                                kategori: "wajib",
                                subtes_or_mapel: title.split("(")[0].trim(),
                                paket: title,
                                total_questions: totalQ,
                              }
                            );
                            setReviewResult({
                              total: totalQ,
                              answered: answeredQ,
                              correct: correctQ,
                              score_percent: scorePct,
                              estimated_irt: estIrt,
                              breakdown: sub.breakdown || [],
                            });
                            setStudyMode((sub.studyMode ?? sub.study_mode) === "drill" ? "drill" : "exam");
                            setMode("review");
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          style={{
                            padding: "8px 10px",
                            backgroundColor: "#23342e",
                            color: "#d1ded6",
                            border: "1px solid #334840",
                            borderRadius: 8,
                            fontWeight: 700,
                            fontSize: 12,
                            cursor: "pointer",
                            textAlign: "center",
                          }}
                        >
                          Pembahasan
                        </button>
                        <button
                          onClick={() => {
                            const pkgId = sub.packageId || sub.package_id;
                            const foundPkg = packages.find((p) => p.id === pkgId);
                            const title = sub.packageTitle || sub.package_title || "Paket Soal";
                            const targetMode = (sub.studyMode ?? sub.study_mode) === "drill" ? "drill" : "exam";
                            if (foundPkg) {
                              handleStartSimulation(foundPkg, targetMode);
                            } else {
                              handleStartSimulation(
                                {
                                  id: pkgId,
                                  source: pkgId.startsWith("ai_drill") ? "ai_drill" : "pusmendik_tka",
                                  jenjang: "SMA",
                                  kategori: "wajib",
                                  subtes_or_mapel: title.split("(")[0].trim(),
                                  paket: title,
                                  total_questions: totalQ,
                                },
                                targetMode
                              );
                            }
                          }}
                          style={{
                            padding: "8px 10px",
                            backgroundColor: "#ffffff",
                            color: "#475569",
                            border: "1px solid #cbd5e1",
                            borderRadius: 8,
                            fontWeight: 700,
                            fontSize: 12,
                            cursor: "pointer",
                            textAlign: "center",
                          }}
                        >
                          Ulangi
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Loading / Error / Empty States */}
            {isLoadingPackages && (
              <div style={{ textAlign: "center", padding: "48px 20px", color: "#526350" }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Memuat daftar paket simulasi CBT...</div>
              </div>
            )}

            {packageError && (
              <div style={{ backgroundColor: "#2d1a1a", border: "1px solid #4a2323", padding: 16, borderRadius: 12, color: "#ff5c5c", marginBottom: 20 }}>
                {packageError}
                <button onClick={fetchPackages} style={{ marginLeft: 12, textDecoration: "underline", background: "none", border: "none", color: "#ff5c5c", cursor: "pointer", fontWeight: 700 }}>
                  Coba lagi
                </button>
              </div>
            )}

            {/* Subject-Grouped Tracklist */}
            {!isLoadingPackages && !packageError && (
              groupedPackages.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 20px", color: "#526350" }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#18221f", marginBottom: 6 }}>
                    Tidak ada paket simulasi yang sesuai
                  </div>
                  <div style={{ fontSize: 13, color: "#6e826b" }}>
                    Coba ubah kata kunci pencarian atau ganti filter kategori/subtes.
                  </div>
                </div>
              ) : (
                <div className="cbt-tracklist-hub">
                  {groupedPackages.map((group) => {
                    const isCollapsed = Boolean(collapsedSubjects[group.subject]);
                    const SubjectIcon = getSubjectIcon(group.subject);

                    return (
                      <div key={group.subject} className="cbt-subject-card">
                        {/* Accordion Header */}
                        <button
                          type="button"
                          onClick={() => toggleSubject(group.subject)}
                          className="cbt-subject-header"
                          aria-expanded={!isCollapsed}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                            <div className="cbt-subject-icon-box">
                              <SubjectIcon size={20} />
                            </div>
                            <div style={{ textAlign: "left", minWidth: 0 }}>
                              <h3 style={{ fontSize: 16, fontWeight: 800, color: "#18221f", margin: 0, letterSpacing: "-0.2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {group.subject}
                              </h3>
                              <div style={{ fontSize: 12, color: "#526350", marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
                                <span>{group.packages.length} Paket</span>
                                <span>•</span>
                                <span>{group.totalQuestions} Butir Soal</span>
                              </div>
                            </div>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                            <span
                              className="kg-chain-pill"
                              style={{
                                fontFamily: "'DM Mono', monospace",
                                fontSize: 11,
                                fontWeight: 600,
                                padding: "3px 8px",
                                borderRadius: 6,
                                backgroundColor: "#23342e",
                                color: "#d1ded6",
                                border: "1px solid #334840",
                                textTransform: "uppercase",
                              }}
                            >
                              {group.category}
                            </span>
                            <div style={{ color: "#526350", display: "flex", alignItems: "center" }}>
                              {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                            </div>
                          </div>
                        </button>

                        {/* Accordion Body / Tracklist */}
                        {!isCollapsed && (
                          <div className="cbt-tracklist-body">
                            {group.packages.map((pkg) => {
                              const lastSub = submissions.find((s) => (s.packageId || s.package_id) === pkg.id);
                              const scoreVal = lastSub ? (lastSub.scorePercent ?? lastSub.score_percent ?? 0) : null;
                              const isScorePass = scoreVal !== null ? scoreVal >= 60 : false;

                              return (
                                <div key={pkg.id} className="cbt-tracklist-row">
                                  {/* Left: Badge & Title */}
                                  <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
                                    <span
                                      className="kg-chain-pill active"
                                      style={{
                                        fontFamily: "'DM Mono', monospace",
                                        fontSize: 11,
                                        fontWeight: 700,
                                        padding: "3px 8px",
                                        borderRadius: 6,
                                        backgroundColor: "#c8f064",
                                        color: "#18221f",
                                        border: "1px solid #c8f064",
                                        flexShrink: 0,
                                      }}
                                    >
                                      {pkg.paket}
                                    </span>
                                    <div style={{ minWidth: 0, flex: 1 }}>
                                      <div style={{ fontSize: 13.5, fontWeight: 700, color: "#18221f", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                        {pkg.subtes_or_mapel} — {pkg.paket}
                                      </div>
                                      <div style={{ fontSize: 11.5, color: "#6e826b", marginTop: 2, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                                        <span>{pkg.total_questions} Soal</span>
                                        <span>•</span>
                                        <span>
                                          {pkg.source === "ai_drill"
                                            ? "AI Drill Baku"
                                            : pkg.source === "pusmendik_tka"
                                            ? `Pusmendik Resmi (${pkg.kategori === "wajib" ? "SMA Wajib" : "SMA Pilihan"})`
                                            : "UTBK SNBT"}
                                        </span>
                                        <span>•</span>
                                        <span>~{(pkg.total_questions || 20) * 2} Menit</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Middle: Status Badge */}
                                  <div style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>
                                    {scoreVal !== null ? (
                                      <span
                                        style={{
                                          fontFamily: "'DM Mono', monospace",
                                          fontSize: 11,
                                          fontWeight: 700,
                                          padding: "3px 9px",
                                          borderRadius: 6,
                                          backgroundColor: isScorePass ? "#23342e" : "#2d1a1a",
                                          color: isScorePass ? "#c8f064" : "#ff5c5c",
                                          border: `1px solid ${isScorePass ? "#334840" : "#4a2323"}`,
                                          display: "inline-flex",
                                          alignItems: "center",
                                          gap: 5,
                                        }}
                                      >
                                        <CheckCircle2 size={12} color={isScorePass ? "#c8f064" : "#ff5c5c"} />
                                        Skor {scoreVal}%
                                      </span>
                                    ) : (
                                      <span
                                        style={{
                                          fontSize: 11,
                                          fontWeight: 600,
                                          padding: "3px 9px",
                                          borderRadius: 6,
                                          backgroundColor: "#f5f7f4",
                                          color: "#6e826b",
                                          border: "1px solid #e1e7dd",
                                        }}
                                      >
                                        Belum Dikerjakan
                                      </span>
                                    )}
                                  </div>

                                  {/* Right: Actions */}
                                  <div className="cbt-track-actions" style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                                    <button
                                      type="button"
                                      onClick={() => handleStartSimulation(pkg, "exam")}
                                      disabled={isLoadingItems}
                                      className="cbt-btn-mulai-ujian"
                                      title="Mulai Ujian Resmi dengan Timer Countdown"
                                    >
                                      <Clock size={13} color="#c8f064" />
                                      <span>Mulai Ujian</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleStartSimulation(pkg, "drill")}
                                      disabled={isLoadingItems}
                                      className="cbt-btn-latihan-mandiri"
                                      title="Latihan Mandiri dengan Umpan Balik Langsung"
                                    >
                                      <Sparkles size={13} color="#4b6623" />
                                      <span>Latihan Mandiri</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleChallengeRoom(pkg)}
                                      disabled={isLoadingItems}
                                      className="cbt-btn-challenge"
                                      title="Ajak Teman Adu Skor CBT (Multiplayer)"
                                    >
                                      <Flame size={13} color="#ea580c" />
                                      <span>Adu Teman</span>
                                    </button>

                                    {pkg.source === "ai_drill" && (
                                      <button
                                        type="button"
                                        onClick={() => handleDeletePackage(pkg.id)}
                                        title="Hapus paket latihan AI ini"
                                        style={{
                                          backgroundColor: "#2d1a1a",
                                          border: "1px solid #4a2323",
                                          color: "#ff5c5c",
                                          borderRadius: 8,
                                          padding: "8px 10px",
                                          cursor: "pointer",
                                          display: "inline-flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          minHeight: 38,
                                        }}
                                      >
                                        <Trash2 size={13} color="#ff5c5c" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </>
        )}

        {/* Modal Generator Latihan Mandiri AI */}
        {isAiGeneratorOpen && typeof document !== "undefined" && createPortal(
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: "100vw",
              height: "100vh",
              backgroundColor: "rgba(10, 15, 13, 0.75)",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
              zIndex: 99999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 20,
              overflowY: "auto",
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget && !isGeneratingAiDrill) setIsAiGeneratorOpen(false);
            }}
          >
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: 20,
                border: "1px solid #dce2d6",
                padding: 28,
                maxWidth: 560,
                width: "100%",
                maxHeight: "90vh",
                overflowY: "auto",
                boxShadow: "0 25px 60px rgba(0,0,0,0.35)",
                position: "relative",
                margin: "auto",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 6, backgroundColor: "#f0fdf4", color: "#166534", border: "1px solid #86efac", padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, marginBottom: 8 }}>
                    <Sparkles size={12} color="#166534" />
                    <span>Nara AI Exam Generator</span>
                  </div>
                  <h3 style={{ fontSize: 20, fontWeight: 800, color: "#18221f", margin: 0 }}>
                    Cetak Latihan Mandiri AI
                  </h3>
                  <p style={{ fontSize: 13, color: "#526350", margin: "4px 0 0 0" }}>
                    Generate wacana dan butir soal baru 100% presisi mengacu pada 6 Pola Baku Pusmendik & SNBT.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => !isGeneratingAiDrill && setIsAiGeneratorOpen(false)}
                  style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", padding: 4 }}
                >
                  <X size={20} />
                </button>
              </div>

              {aiError && (
                <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: 12, color: "#991b1b", fontSize: 13, marginBottom: 16 }}>
                  {aiError}
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {/* 1. Mata Pelajaran */}
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#18221f", marginBottom: 6 }}>
                    Mata Pelajaran:
                  </label>
                  <select
                    value={aiSubject}
                    onChange={(e) => {
                      setAiSubject(e.target.value);
                      setAiPola("all");
                    }}
                    disabled={isGeneratingAiDrill}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: "1px solid #cbd5e1",
                      fontSize: 13.5,
                      fontWeight: 600,
                      color: "#18221f",
                      backgroundColor: "#f8fafc",
                    }}
                  >
                    <option value="Bahasa Indonesia">Bahasa Indonesia (TKA Wajib)</option>
                    <option value="Matematika">Matematika (TKA Wajib)</option>
                    <option value="Sosiologi">Sosiologi (TKA Pilihan)</option>
                    <option value="Ekonomi">Ekonomi (TKA Pilihan)</option>
                    <option value="Bahasa Inggris">Bahasa Inggris (TKA Wajib)</option>
                  </select>
                </div>

                {/* 2. Target Pola Baku */}
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#18221f", marginBottom: 6 }}>
                    Target Pola Soal Resmi ({aiSubject}):
                  </label>
                  <select
                    value={aiPola}
                    onChange={(e) => setAiPola(e.target.value)}
                    disabled={isGeneratingAiDrill}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: "1px solid #cbd5e1",
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#18221f",
                      backgroundColor: "#f8fafc",
                    }}
                  >
                    {(SUBJECT_PATTERNS_MAP[aiSubject] || SUBJECT_PATTERNS_MAP["Bahasa Indonesia"]).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Jumlah Soal */}
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#18221f", marginBottom: 6 }}>
                    Jumlah Butir Soal:
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6 }}>
                    {[
                      { n: 5, label: "5 Butir (Drill)" },
                      { n: 10, label: "10 Butir (Sedang)" },
                      { n: 20, label: "20 Butir (Paket 1)" },
                      { n: 25, label: "25 Butir (Resmi TKA)" },
                      { n: 30, label: "30 Butir (Maraton)" },
                    ].map((item) => (
                      <button
                        key={item.n}
                        type="button"
                        onClick={() => setAiCount(item.n)}
                        disabled={isGeneratingAiDrill}
                        style={{
                          padding: "8px 6px",
                          borderRadius: 8,
                          border: aiCount === item.n ? "2px solid #15803d" : "1px solid #cbd5e1",
                          backgroundColor: aiCount === item.n ? "#f0fdf4" : "#ffffff",
                          color: aiCount === item.n ? "#15803d" : "#475569",
                          fontWeight: 700,
                          fontSize: 12,
                          cursor: "pointer",
                          textAlign: "center",
                        }}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3b. Mode Tingkat Kesulitan */}
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#18221f", marginBottom: 6 }}>
                    Tingkat Kesulitan Bahasa & Soal:
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => setAiTier("standard")}
                      disabled={isGeneratingAiDrill}
                      style={{
                        padding: "8px 10px",
                        borderRadius: 8,
                        border: aiTier === "standard" ? "2px solid #15803d" : "1px solid #cbd5e1",
                        backgroundColor: aiTier === "standard" ? "#f0fdf4" : "#ffffff",
                        color: aiTier === "standard" ? "#15803d" : "#475569",
                        fontWeight: 700,
                        fontSize: 12,
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <span>🎯</span> Standar TKA SMA (Rekomendasi)
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 400, color: "#64748b", marginTop: 2, lineHeight: 1.35 }}>
                        Bahasa wajar kelas 12 (200-240 kata), jebakan murni logika teks, bebas istilah alien.
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAiTier("challenge")}
                      disabled={isGeneratingAiDrill}
                      style={{
                        padding: "8px 10px",
                        borderRadius: 8,
                        border: aiTier === "challenge" ? "2px solid #b91c1c" : "1px solid #cbd5e1",
                        backgroundColor: aiTier === "challenge" ? "#fef2f2" : "#ffffff",
                        color: aiTier === "challenge" ? "#b91c1c" : "#475569",
                        fontWeight: 700,
                        fontSize: 12,
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <span>🔥</span> Mode Challenge (Ekstrem)
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 400, color: "#64748b", marginTop: 2, lineHeight: 1.35 }}>
                        Wacana riset akademis padat (300-350 kata), kosakata berat, uji ketahanan kognitif.
                      </div>
                    </button>
                  </div>
                </div>

                {/* 4. Topik Spesifik (Opsional) */}
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#18221f", marginBottom: 6 }}>
                    Fokus Topik / Konteks Wacana (Opsional):
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Digitalisasi UMKM, Cerpen Nelayan, Pencemaran Mikroplastik..."
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    disabled={isGeneratingAiDrill}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: "1px solid #cbd5e1",
                      fontSize: 13,
                      color: "#18221f",
                      backgroundColor: "#ffffff",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24 }}>
                <button
                  type="button"
                  onClick={() => setIsAiGeneratorOpen(false)}
                  disabled={isGeneratingAiDrill}
                  style={{
                    backgroundColor: "transparent",
                    color: "#64748b",
                    border: "1px solid #cbd5e1",
                    borderRadius: 10,
                    padding: "10px 18px",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleGenerateAiDrillWithRoom}
                  disabled={isGeneratingAiDrill}
                  style={{
                    backgroundColor: "#fff7ed",
                    color: "#c2410c",
                    border: "1px solid #fed7aa",
                    borderRadius: 10,
                    padding: "10px 18px",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: isGeneratingAiDrill ? "wait" : "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                  title="Cetak paket AI dan langsung buat room kompetisi bareng teman"
                >
                  <Flame size={15} color="#ea580c" />
                  <span>Cetak & Adu Teman</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleGenerateAiDrill("drill")}
                  disabled={isGeneratingAiDrill}
                  style={{
                    backgroundColor: "#f0fdf4",
                    color: "#166534",
                    border: "1px solid #86efac",
                    borderRadius: 10,
                    padding: "10px 18px",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: isGeneratingAiDrill ? "wait" : "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                  title="Cetak dan buka langsung sebagai Latihan Mandiri (cek status benar/salah langsung di tiap soal)"
                >
                  <Sparkles size={15} color="#166534" />
                  <span>Cetak & Drill Mandiri</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleGenerateAiDrill("exam")}
                  disabled={isGeneratingAiDrill}
                  style={{
                    backgroundColor: "#18221f",
                    color: "#c8f064",
                    border: "none",
                    borderRadius: 10,
                    padding: "10px 20px",
                    fontWeight: 800,
                    fontSize: 13.5,
                    cursor: isGeneratingAiDrill ? "wait" : "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                  }}
                  title="Cetak dan jalankan sebagai Simulasi Ujian Resmi (ada timer countdown, kunci terkunci s/d submit)"
                >
                  {isGeneratingAiDrill ? (
                    <>
                      <RotateCcw size={16} className="animate-spin" />
                      <span>Sedang Meracik Soal...</span>
                    </>
                  ) : (
                    <>
                      <Clock size={16} color="#c8f064" />
                      <span>Cetak & Simulasi Ujian</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    );
  }

  // ==========================================
  // RENDER MODE B: 1:1 CBT RUNNER
  // ==========================================
  if (mode === "runner" && currentItem) {
    const total = items.length;
    const isAnswered = answers[currentItem.nomor] !== undefined && answers[currentItem.nomor] !== "";
    const isDoubt = Boolean(doubtful[currentItem.nomor]);
    const currentVal = answers[currentItem.nomor] || "";
    const selectedList = currentVal.split(";").filter(Boolean);

    const answeredCount = Object.keys(answers).filter((k) => answers[Number(k)]).length;
    const doubtfulCount = Object.keys(doubtful).filter((k) => doubtful[Number(k)]).length;

    const hasBacaan = hasActualContent(currentItem.bacaan);
    const shouldShowWacana = hasBacaan && !isWacanaCollapsed;

    // Drill Mode evaluation
    const isComplexType = currentItem.tipe_soal === "pilihan_ganda_kompleks" || currentItem.tipe_soal === "pernyataan";
    const isItemEvaluated = studyMode === "drill" ? (isComplexType ? Boolean(drillChecked[currentItem.nomor]) : isAnswered) : false;
    const isDrillCorrect = isAnswerCorrect(currentVal, currentItem.kunci_jawaban || "", currentItem.tipe_soal);

    const drillCorrectCount = items.filter((it) => {
      const isComplex = it.tipe_soal === "pilihan_ganda_kompleks" || it.tipe_soal === "pernyataan";
      const evaluated = studyMode === "drill" ? (isComplex ? Boolean(drillChecked[it.nomor]) : Boolean(answers[it.nomor])) : false;
      return evaluated && isAnswerCorrect(answers[it.nomor], it.kunci_jawaban, it.tipe_soal);
    }).length;
    const drillWrongCount = items.filter((it) => {
      const isComplex = it.tipe_soal === "pilihan_ganda_kompleks" || it.tipe_soal === "pernyataan";
      const evaluated = studyMode === "drill" ? (isComplex ? Boolean(drillChecked[it.nomor]) : Boolean(answers[it.nomor])) : false;
      return evaluated && !isAnswerCorrect(answers[it.nomor], it.kunci_jawaban, it.tipe_soal);
    }).length;

    return (
      <div className="cbt-runner-container" style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: "80vh" }}>
        {/* CBT Sticky Header */}
        <header
          className="cbt-runner-header"
          style={{
            backgroundColor: "#18221f",
            color: "#ffffff",
            padding: "12px 20px",
            borderRadius: 12,
            marginBottom: 16,
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
          }}
        >
          {/* Left: Package info & Exit */}
          <div className="cbt-runner-header-left" style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <motion.button
              type="button"
              onClick={() => {
                setMode("selector");
                setIsTimerRunning(false);
              }}
              className="cbt-header-btn-back"
              whileTap={shouldReduceMotion ? undefined : { scale: 0.94 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              style={{
                background: "rgba(255,255,255,0.1)",
                border: "none",
                borderRadius: 8,
                padding: "6px 10px",
                color: "#e2e8f0",
                fontSize: 12,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                flexShrink: 0,
                touchAction: "manipulation",
              }}
            >
              <ArrowLeft size={14} />
              <span className="cbt-desktop-only">Kembali</span>
            </motion.button>
            <div className="cbt-header-pkg-meta cbt-desktop-only">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: "#ffffff" }}>
                  {currentPackage?.subtes_or_mapel} ({currentPackage?.paket})
                </span>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 10.5,
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: 6,
                    backgroundColor: studyMode === "drill" ? "rgba(16, 185, 129, 0.2)" : "rgba(200, 240, 100, 0.15)",
                    color: studyMode === "drill" ? "#a7f3d0" : "#c8f064",
                    border: studyMode === "drill" ? "1px solid rgba(16, 185, 129, 0.4)" : "1px solid rgba(200, 240, 100, 0.3)",
                  }}
                >
                  {studyMode === "drill" ? <Sparkles size={11} /> : <Clock size={11} />}
                  <span>{studyMode === "drill" ? "Drill Mandiri" : "Simulasi Ujian"}</span>
                </span>
              </div>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>
                {currentPackage?.source === "pusmendik_tka"
                  ? currentPackage?.kategori === "wajib"
                    ? "SMA Wajib Pusmendik"
                    : "SMA Pilihan Pusmendik"
                  : "UTBK SNBT PTN"}
              </div>
            </div>
          </div>

          {/* Center: Timer (Countdown for Exam, Elapsed for Drill) */}
          <div className="cbt-runner-timer-wrap">
          {studyMode === "exam" ? (
            <div
              className={`cbt-header-timer-pill ${timeLeft < 300 ? "timer-alert" : ""}`}
              style={{
                backgroundColor: timeLeft < 300 ? "rgba(239, 68, 68, 0.2)" : "rgba(200, 240, 100, 0.12)",
                border: timeLeft < 300 ? "1px solid #ef4444" : "1px solid rgba(200, 240, 100, 0.25)",
                padding: "6px 14px",
                borderRadius: 9999,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Clock size={12} color={timeLeft < 300 ? "#ef4444" : "#c8f064"} />
              <div style={{ textAlign: "left" }}>
                <div className="cbt-desktop-only" style={{ fontSize: 9.5, textTransform: "uppercase", letterSpacing: "0.5px", color: "#cbd5e1" }}>
                  Sisa Waktu
                </div>
                <div
                  className="cbt-timer-digits"
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 16,
                    fontWeight: 800,
                    color: timeLeft < 300 ? "#fca5a5" : "#c8f064",
                    letterSpacing: "0.5px",
                  }}
                >
                  {formatTimer(timeLeft)}
                </div>
              </div>
            </div>
          ) : (
            <div
              className="cbt-header-timer-pill"
              style={{
                backgroundColor: "rgba(200, 240, 100, 0.12)",
                border: "1px solid rgba(200, 240, 100, 0.25)",
                padding: "6px 14px",
                borderRadius: 9999,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Clock size={12} color="#c8f064" />
              <div style={{ textAlign: "left" }}>
                <div className="cbt-desktop-only" style={{ fontSize: 9.5, textTransform: "uppercase", letterSpacing: "0.5px", color: "#cbd5e1" }}>
                  Waktu Latihan
                </div>
                <div
                  className="cbt-timer-digits"
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 16,
                    fontWeight: 800,
                    color: "#c8f064",
                    letterSpacing: "0.5px",
                  }}
                >
                  {formatTimer(timeSpentSeconds)}
                </div>
              </div>
            </div>
          )}
          </div>

          {/* Right: Palette Toggle & Finish Button */}
          <div className="cbt-runner-header-right" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Tombol Cepat Buka Soal (Mobile & Desktop) */}
            <motion.button
              type="button"
              onClick={() => setIsSoalModalOpen(true)}
              className="cbt-header-btn-quick-view"
              whileTap={shouldReduceMotion ? undefined : { scale: 0.94 }}
              style={{
                backgroundColor: "rgba(255,255,255,0.12)",
                color: "#ffffff",
                border: "1px solid rgba(255,255,255,0.18)",
                borderRadius: 8,
                padding: "6px 10px",
                fontSize: 12,
                fontWeight: 800,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                flexShrink: 0
              }}
              title="Buka popup teks soal nomor ini"
            >
              <HelpCircle size={14} color="#c8f064" />
              <span>Soal</span>
            </motion.button>

            {/* Tombol Cepat Buka Wacana (Jika ada bacaan) */}
            {hasBacaan && (
              <motion.button
                type="button"
                onClick={() => setIsWacanaModalOpen(true)}
                className="cbt-header-btn-quick-view"
                whileTap={shouldReduceMotion ? undefined : { scale: 0.94 }}
                style={{
                  backgroundColor: "rgba(200, 240, 100, 0.15)",
                  color: "#c8f064",
                  border: "1px solid rgba(200, 240, 100, 0.35)",
                  borderRadius: 8,
                  padding: "6px 10px",
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  flexShrink: 0
                }}
                title="Buka popup wacana / stimulus cerita"
              >
                <BookOpen size={14} color="#c8f064" />
                <span>Wacana</span>
              </motion.button>
            )}

            {/* Font Size Zoom Switcher (Desktop & Mobile) */}
            <motion.button
              type="button"
              onClick={cycleFontSize}
              title="Ubah ukuran huruf wacana & soal (14px, 16px, 18px)"
              className="cbt-header-btn-font"
              whileTap={shouldReduceMotion ? undefined : { scale: 0.94 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              style={{
                backgroundColor: "rgba(255,255,255,0.12)",
                color: "#ffffff",
                border: "none",
                borderRadius: 8,
                padding: "8px 12px",
                fontSize: 12.5,
                fontWeight: 800,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                flexShrink: 0,
                touchAction: "manipulation",
              }}
            >
              <span>Aa</span>
              <span className="cbt-desktop-only" style={{ fontSize: 10, color: "#c8f064" }}>{fontSizeLevel}px</span>
            </motion.button>

            {hasBacaan && (
              <button
                type="button"
                className="cbt-desktop-only"
                onClick={() => setIsWacanaCollapsed(!isWacanaCollapsed)}
                title={isWacanaCollapsed ? "Tampilkan Wacana" : "Sembunyikan Wacana (Layar Penuh Soal)"}
                style={{
                  backgroundColor: isWacanaCollapsed ? "#fef08a" : "rgba(255,255,255,0.12)",
                  color: isWacanaCollapsed ? "#854d0e" : "#ffffff",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 14px",
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  transition: "all 0.15s ease",
                  flexShrink: 0
                }}
              >
                <span>{isWacanaCollapsed ? "◨ Tampilkan Wacana" : "◧ Sembunyikan Wacana"}</span>
              </button>
            )}

            <motion.button
              type="button"
              onClick={() => setIsPaletteOpen(!isPaletteOpen)}
              className="cbt-header-btn-palette"
              whileTap={shouldReduceMotion ? undefined : { scale: 0.94 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              style={{
                backgroundColor: isPaletteOpen ? "#c8f064" : "rgba(255,255,255,0.12)",
                color: isPaletteOpen ? "#18221f" : "#ffffff",
                border: "none",
                borderRadius: 8,
                padding: "8px 14px",
                fontSize: 12.5,
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                flexShrink: 0,
                touchAction: "manipulation",
              }}
              title="Daftar Soal"
            >
              <LayoutGrid size={13} />
              <span className="cbt-desktop-only">Daftar Soal </span>
              <span style={{ fontFamily: "'DM Mono', monospace" }}>({answeredCount}/{total})</span>
            </motion.button>

            <motion.button
              type="button"
              onClick={() => setIsSubmitModalOpen(true)}
              className="cbt-header-btn-submit"
              whileTap={shouldReduceMotion ? undefined : { scale: 0.94 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              style={{
                backgroundColor: studyMode === "drill" ? "#10b981" : "#5b8026",
                color: "#ffffff",
                border: "none",
                borderRadius: 8,
                padding: "8px 16px",
                fontSize: 12.5,
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                whiteSpace: "nowrap",
                flexShrink: 0,
                touchAction: "manipulation",
              }}
            >
              <Check size={14} />
              <span className="cbt-mobile-only">Selesai</span>
              <span className="cbt-desktop-only">{studyMode === "drill" ? "Selesai Latihan" : "Selesai Ujian"}</span>
            </motion.button>
          </div>
        </header>

        {/* Split Screen or Full Width Layout */}
        <div
          ref={cbtGridRef}
          className="cbt-layout-grid"
          style={{
            flex: 1,
            display: "grid",
            gridTemplateColumns: shouldShowWacana
              ? `minmax(280px, ${cbtSplitRatio}%) auto minmax(320px, 1fr)`
              : "1fr",
            gap: shouldShowWacana ? 8 : 16,
            alignItems: "start",
            marginBottom: 20,
          }}
        >
          {/* Left Pane: Stimulus / Bacaan */}
          {shouldShowWacana && (
            <section
              className="cbt-pane cbt-pane-wacana-desktop"
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #dce2d6",
                borderRadius: 14,
                padding: 20,
                boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                minHeight: 380,
                maxHeight: "calc(100vh - 220px)",
                overflowY: "auto",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 14,
                }}
              >
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    backgroundColor: "#f0f4ea",
                    color: "#4b6623",
                    padding: "4px 10px",
                    borderRadius: 6,
                    fontSize: 11.5,
                    fontWeight: 700,
                    textTransform: "uppercase",
                  }}
                >
                  <BookOpen size={13} />
                  <span>Wacana / Stimulus</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsWacanaCollapsed(true)}
                  title="Sembunyikan Wacana (Layar Penuh Soal)"
                  style={{
                    backgroundColor: "transparent",
                    color: "#475569",
                    border: "1px solid #dce2d6",
                    borderRadius: 6,
                    padding: "4px 8px",
                    fontSize: 11.5,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <span>◧ Sembunyikan</span>
                </button>
              </div>

              {currentItem.bacaan ? (
                <div
                  style={{
                    fontSize: fontSizeLevel,
                    lineHeight: 1.75,
                    color: "#25322e",
                  }}
                >
                  <CbtContentRenderer
                    content={currentItem.bacaan}
                    onImageClick={(src, alt) => setZoomImage({ src, title: alt || `Diagram Wacana - Soal ${currentItem.nomor}` })}
                  />
                </div>
              ) : null}

              {currentItem.soal_img ? (
                <div style={{ marginTop: 14, textAlign: "center" }}>
                  <img
                    src={currentItem.soal_img}
                    alt={`Diagram Soal ${currentItem.nomor}`}
                    onClick={() => setZoomImage({ src: currentItem.soal_img!, title: `Diagram Soal ${currentItem.nomor}` })}
                    style={{
                      maxWidth: "100%",
                      maxHeight: 360,
                      width: "auto",
                      height: "auto",
                      objectFit: "contain",
                      borderRadius: 8,
                      border: "1px solid #e1e7dd",
                      backgroundColor: "#fdfdfd",
                      cursor: "zoom-in",
                    }}
                    loading="lazy"
                  />
                </div>
              ) : null}
            </section>
          )}

          {/* Vertical Divider / Resize Handle (Desktop) */}
          {shouldShowWacana && (
            <div
              className="cbt-desktop-resizer"
              onMouseDown={startCbtResize}
              onDoubleClick={() => {
                setCbtSplitRatio(46);
                splitRatioRef.current = 46;
                try { localStorage.setItem("tanka_cbt_split_ratio", "46"); } catch {}
              }}
              title="Tarik untuk atur proporsi wacana dan soal (klik 2x untuk reset)"
              style={{
                width: 12,
                alignSelf: "stretch",
                cursor: "col-resize",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 20,
                userSelect: "none",
                margin: "0 -2px"
              }}
            >
              <div
                style={{
                  width: 3,
                  height: 48,
                  borderRadius: 3,
                  backgroundColor: isResizingCbt ? "#166534" : "rgba(22, 101, 52, 0.22)",
                  transition: "background-color 0.15s ease",
                }}
              />
            </div>
          )}

          {/* Right Pane: Question & Options */}
          <section
            className="cbt-pane"
            style={{
              flex: 1,
              backgroundColor: "#ffffff",
              border: "1px solid #dce2d6",
              borderRadius: 14,
              padding: 20,
              boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
              minHeight: 380,
              maxHeight: "calc(100vh - 220px)",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              {/* Reminder banner when wacana is collapsed by user */}
              {hasBacaan && isWacanaCollapsed && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    backgroundColor: "#f4f7f2",
                    padding: "8px 14px",
                    borderRadius: 8,
                    border: "1px solid #dce2d6",
                    marginBottom: 14,
                  }}
                >
                  <span style={{ fontSize: 12.5, color: "#475569", fontWeight: 600 }}>
                    Wacana disembunyikan untuk memperluas ruang soal & diagram.
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsWacanaCollapsed(false)}
                    style={{
                      backgroundColor: "#18221f",
                      color: "#c8f064",
                      border: "none",
                      borderRadius: 6,
                      padding: "5px 12px",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <span>◨ Tampilkan Wacana</span>
                  </button>
                </div>
              )}

              {/* Question Number Banner */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#18221f" }}>
                    Soal Nomor {currentItem.nomor}{" "}
                    <span style={{ fontSize: 12, fontWeight: 500, color: "#6e826b" }}>
                      (dari {total} butir)
                    </span>
                  </div>
                  {hasBacaan && (
                    <motion.button
                      type="button"
                      className="cbt-mobile-read-btn"
                      onClick={() => setIsWacanaModalOpen(true)}
                      whileTap={shouldReduceMotion ? undefined : { scale: 0.93 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      style={{
                        display: "none",
                        alignItems: "center",
                        gap: 6,
                        backgroundColor: "#18221f",
                        color: "#c8f064",
                        border: "none",
                        padding: "6px 12px",
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 800,
                        cursor: "pointer",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                        touchAction: "manipulation",
                      }}
                    >
                      <BookOpen size={13} />
                      <span>Wacana</span>
                    </motion.button>
                  )}
                  {studyMode === "drill" && isItemEvaluated && (
                    isDrillCorrect ? (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          backgroundColor: "#ecfdf5",
                          color: "#047857",
                          border: "1px solid #10b981",
                          padding: "2px 8px",
                          borderRadius: 6,
                          fontSize: 11.5,
                          fontWeight: 800,
                        }}
                      >
                        <CheckCircle2 size={13} />
                        <span>BENAR</span>
                      </span>
                    ) : (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          backgroundColor: "#fff1f2",
                          color: "#be123c",
                          border: "1px solid #f43f5e",
                          padding: "2px 8px",
                          borderRadius: 6,
                          fontSize: 11.5,
                          fontWeight: 800,
                        }}
                      >
                        <XCircle size={13} />
                        <span>SALAH</span>
                      </span>
                    )
                  )}
                </div>
                {currentItem.tipe_soal === "pilihan_ganda_kompleks" && (
                  <span style={{ backgroundColor: "#fef3c7", color: "#92400e", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4 }}>
                    Pilihan Ganda Kompleks
                  </span>
                )}
                {currentItem.tipe_soal === "pernyataan" && (
                  <span style={{ backgroundColor: "#e0e7ff", color: "#3730a3", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4 }}>
                    Tabel Pernyataan (Benar / Salah)
                  </span>
                )}
              </div>

              {/* Question Text */}
              <div
                style={{
                  fontSize: fontSizeLevel,
                  fontWeight: 600,
                  lineHeight: 1.6,
                  color: "#18221f",
                  marginBottom: 20,
                }}
              >
                <CbtContentRenderer
                  content={shouldShowWacana ? getDeduplicatedSoalText(currentItem.soal, currentItem.bacaan) : currentItem.soal}
                  onImageClick={(src, alt) => setZoomImage({ src, title: alt || `Diagram Soal ${currentItem.nomor}` })}
                />
              </div>

              {/* Diagram Soal when wacana is collapsed or question has no separate reading passage */}
              {(!shouldShowWacana) && currentItem.soal_img ? (
                <div style={{ marginBottom: 20, textAlign: "center" }}>
                  <img
                    src={currentItem.soal_img}
                    alt={`Diagram Soal ${currentItem.nomor}`}
                    onClick={() => setZoomImage({ src: currentItem.soal_img!, title: `Diagram Soal ${currentItem.nomor}` })}
                    style={{
                      maxWidth: "100%",
                      maxHeight: 460,
                      width: "auto",
                      height: "auto",
                      objectFit: "contain",
                      borderRadius: 8,
                      border: "1px solid #e1e7dd",
                      backgroundColor: "#fdfdfd",
                      cursor: "zoom-in",
                    }}
                    loading="lazy"
                  />
                </div>
              ) : null}

              {/* Options / Statement Table */}
              {currentItem.tipe_soal === "pernyataan" ? (() => {
                const stmtLabels = getStatementChoiceLabels(currentItem);
                const valCol1 = stmtLabels[0].toLowerCase();
                const valCol2 = stmtLabels[1].toLowerCase();

                return (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div className="cbt-stmt-desktop-table" style={{ overflowX: "auto", borderRadius: 10, border: "1px solid #dce2d6", backgroundColor: "#ffffff" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
                      <thead>
                        <tr style={{ backgroundColor: "#f4f7f2", borderBottom: "1px solid #dce2d6", color: "#4b5d49" }}>
                          <th style={{ padding: "10px 8px", width: 36, textAlign: "center", fontWeight: 700 }}>No</th>
                          <th style={{ padding: "10px 12px", fontWeight: 700 }}>Pernyataan</th>
                          <th style={{ padding: "10px 6px", width: 95, textAlign: "center", fontWeight: 700 }}>{stmtLabels[0]}</th>
                          <th style={{ padding: "10px 6px", width: 95, textAlign: "center", fontWeight: 700 }}>{stmtLabels[1]}</th>
                          {studyMode === "drill" && isItemEvaluated && (
                            <th style={{ padding: "10px 8px", width: 95, textAlign: "center", fontWeight: 700 }}>Evaluasi</th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {currentItem.options.map((opt, rIdx) => {
                          const stmtId = opt.id.toLowerCase();
                          const userMap = parseStatementAnswers(currentVal);
                          const userChoice = userMap[stmtId];
                          const keyMap = parseStatementAnswers(currentItem.kunci_jawaban);
                          const keyChoice = keyMap[stmtId];

                          const isRowCorrect = Boolean(userChoice && keyChoice && normalizeStatementValue(userChoice) === normalizeStatementValue(keyChoice));
                          const isRowWrong = Boolean(userChoice && keyChoice && normalizeStatementValue(userChoice) !== normalizeStatementValue(keyChoice));

                          let rowBg = rIdx % 2 === 0 ? "#ffffff" : "#fafcf9";
                          if (studyMode === "drill" && isItemEvaluated) {
                            if (isRowCorrect) rowBg = "#f0fdf4";
                            else if (isRowWrong) rowBg = "#fff1f2";
                          }

                          return (
                            <tr key={opt.id} style={{ backgroundColor: rowBg, borderBottom: "1px solid #e5ebe1" }}>
                              <td style={{ padding: "10px 8px", textAlign: "center", fontWeight: 800, color: "#18221f" }}>
                                {rIdx + 1}
                              </td>
                              <td style={{ padding: "10px 12px", color: "#1f2937", lineHeight: 1.55 }}>
                                <CbtContentRenderer
                                  content={opt.text}
                                  onImageClick={(src, alt) => setZoomImage({ src, title: alt || `Diagram Pernyataan ${opt.id.toUpperCase()} - Soal ${currentItem.nomor}` })}
                                />
                                {opt.img ? (
                                  <div style={{ marginTop: 6 }}>
                                    <img
                                      src={opt.img}
                                      alt={`Pernyataan ${opt.id}`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setZoomImage({ src: opt.img!, title: `Diagram Pernyataan ${opt.id.toUpperCase()} - Soal ${currentItem.nomor}` });
                                      }}
                                      style={{
                                        maxHeight: 260,
                                        maxWidth: "100%",
                                        width: "auto",
                                        height: "auto",
                                        objectFit: "contain",
                                        borderRadius: 6,
                                        border: "1px solid #e1e7dd",
                                        cursor: "zoom-in",
                                      }}
                                      loading="lazy"
                                    />
                                  </div>
                                ) : null}
                              </td>
                              {/* Choice Col 1 cell */}
                              <td style={{ padding: "8px 6px", textAlign: "center", verticalAlign: "middle" }}>
                                <button
                                  type="button"
                                  className="cbt-stmt-btn"
                                  onClick={() => handleSelectStatementRow(opt.id, valCol1)}
                                  disabled={studyMode === "drill" && isItemEvaluated}
                                  style={{
                                    width: "100%",
                                    padding: "6px 4px",
                                    borderRadius: 6,
                                    border: userChoice === valCol1 ? "2px solid #16a34a" : "1.5px solid #cbd5e1",
                                    backgroundColor: userChoice === valCol1 ? "#16a34a" : "#f8fafc",
                                    color: userChoice === valCol1 ? "#ffffff" : "#334155",
                                    fontWeight: 700,
                                    fontSize: 11.5,
                                    cursor: (studyMode === "drill" && isItemEvaluated) ? "default" : "pointer",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 3,
                                    transition: "all 0.12s ease",
                                  }}
                                >
                                  {userChoice === valCol1 && <Check size={13} strokeWidth={3} />}
                                  <span>{stmtLabels[0]}</span>
                                </button>
                              </td>
                              {/* Choice Col 2 cell */}
                              <td style={{ padding: "8px 6px", textAlign: "center", verticalAlign: "middle" }}>
                                <button
                                  type="button"
                                  className="cbt-stmt-btn"
                                  onClick={() => handleSelectStatementRow(opt.id, valCol2)}
                                  disabled={studyMode === "drill" && isItemEvaluated}
                                  style={{
                                    width: "100%",
                                    padding: "6px 4px",
                                    borderRadius: 6,
                                    border: userChoice === valCol2 ? "2px solid #dc2626" : "1.5px solid #cbd5e1",
                                    backgroundColor: userChoice === valCol2 ? "#dc2626" : "#f8fafc",
                                    color: userChoice === valCol2 ? "#ffffff" : "#334155",
                                    fontWeight: 700,
                                    fontSize: 11.5,
                                    cursor: (studyMode === "drill" && isItemEvaluated) ? "default" : "pointer",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 3,
                                    transition: "all 0.12s ease",
                                  }}
                                >
                                  {userChoice === valCol2 && <Check size={13} strokeWidth={3} />}
                                  <span>{stmtLabels[1]}</span>
                                </button>
                              </td>
                              {/* Drill row feedback */}
                              {studyMode === "drill" && isItemEvaluated && (
                                <td style={{ padding: "10px 14px", textAlign: "center", verticalAlign: "middle" }}>
                                  {isRowCorrect ? (
                                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#15803d", fontWeight: 700, backgroundColor: "#dcfce7", padding: "4px 8px", borderRadius: 6, fontSize: 12 }}>
                                      <CheckCircle2 size={13} />
                                      <span>Tepat</span>
                                    </span>
                                  ) : isRowWrong ? (
                                    <div style={{ display: "flex", flexDirection: "column", gap: 3, alignItems: "center" }}>
                                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#be123c", fontWeight: 700, backgroundColor: "#fee2e2", padding: "3px 6px", borderRadius: 6, fontSize: 11.5 }}>
                                        <XCircle size={12} />
                                        <span>Salah</span>
                                      </span>
                                      {keyChoice && (
                                        <span style={{ fontSize: 11, color: "#15803d", fontWeight: 700 }}>
                                          Kunci: {formatStatementValue(keyChoice)}
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <span style={{ color: "#64748b", fontSize: 11, fontWeight: 600 }}>
                                      Bebas
                                    </span>
                                  )}
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Statement Cards (TASK-065) */}
                  <div className="cbt-stmt-mobile-list" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {currentItem.options.map((opt, rIdx) => {
                      const stmtId = opt.id.toLowerCase();
                      const userMap = parseStatementAnswers(currentVal);
                      const userChoice = userMap[stmtId];
                      const keyMap = parseStatementAnswers(currentItem.kunci_jawaban);
                      const keyChoice = keyMap[stmtId];
                      const isRowCorrect = Boolean(userChoice && keyChoice && normalizeStatementValue(userChoice) === normalizeStatementValue(keyChoice));
                      const isRowWrong = Boolean(userChoice && keyChoice && normalizeStatementValue(userChoice) !== normalizeStatementValue(keyChoice));

                      return (
                        <div
                          key={opt.id}
                          className="cbt-stmt-card"
                          style={{
                            backgroundColor: "#ffffff",
                            border: `1.5px solid ${userChoice ? (userChoice === valCol1 ? "#16a34a" : "#dc2626") : "#dce2d6"}`,
                            borderRadius: 12,
                            padding: "14px 16px",
                            display: "flex",
                            flexDirection: "column",
                            gap: 12,
                            boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
                          }}
                        >
                          {/* Header Kartu: Badge Nomor & Status Jawaban */}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: 11.5, fontWeight: 800, color: "#166534", backgroundColor: "#f0fdf4", padding: "3px 9px", borderRadius: 6 }}>
                              Pernyataan {rIdx + 1}
                            </span>
                            {userChoice && (
                              <span style={{ fontSize: 11, fontWeight: 700, color: userChoice === valCol1 ? "#15803d" : "#b91c1c" }}>
                                Dipilih: {formatStatementValue(userChoice)}
                              </span>
                            )}
                          </div>

                          {/* Isi Teks Pernyataan: 100% Lebar Penuh, Nyaman Dibaca */}
                          <div style={{ fontSize: 14, lineHeight: 1.65, color: "#1f2937", textAlign: "left", width: "100%" }}>
                            <CbtContentRenderer
                              content={opt.text}
                              onImageClick={(src, alt) => setZoomImage({ src, title: alt || `Diagram Pernyataan ${opt.id.toUpperCase()} - Soal ${currentItem.nomor}` })}
                            />
                            {opt.img ? (
                              <div style={{ marginTop: 8 }}>
                                <img
                                  src={opt.img}
                                  alt={`Pernyataan ${opt.id}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setZoomImage({ src: opt.img!, title: `Diagram Pernyataan ${opt.id.toUpperCase()} - Soal ${currentItem.nomor}` });
                                  }}
                                  style={{
                                    maxHeight: 260,
                                    maxWidth: "100%",
                                    width: "auto",
                                    height: "auto",
                                    objectFit: "contain",
                                    borderRadius: 6,
                                    border: "1px solid #e1e7dd",
                                    cursor: "zoom-in",
                                  }}
                                  loading="lazy"
                                />
                              </div>
                            ) : null}
                          </div>

                          {/* Drill mode feedback if evaluated */}
                          {studyMode === "drill" && isItemEvaluated && (
                            <div style={{ marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
                              {isRowCorrect ? (
                                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#15803d", fontWeight: 700, backgroundColor: "#dcfce7", padding: "4px 8px", borderRadius: 6, fontSize: 12 }}>
                                  <CheckCircle2 size={13} />
                                  <span>Tepat</span>
                                </span>
                              ) : isRowWrong ? (
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#be123c", fontWeight: 700, backgroundColor: "#fee2e2", padding: "3px 6px", borderRadius: 6, fontSize: 11.5 }}>
                                    <XCircle size={12} />
                                    <span>Salah</span>
                                  </span>
                                  {keyChoice && (
                                    <span style={{ fontSize: 11, color: "#15803d", fontWeight: 700 }}>
                                      Kunci: {formatStatementValue(keyChoice)}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span style={{ color: "#64748b", fontSize: 11, fontWeight: 600 }}>
                                  Bebas
                                </span>
                              )}
                            </div>
                          )}

                          {/* Bar Tombol Pilihan (Benar / Salah) Luas di Bawah */}
                          <div className="cbt-stmt-card-actions" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8, marginTop: 4 }}>
                            <motion.button
                              type="button"
                              className="cbt-stmt-btn cbt-stmt-btn-choice"
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleSelectStatementRow(opt.id, valCol1)}
                              disabled={studyMode === "drill" && isItemEvaluated}
                              style={{
                                padding: "10px 12px",
                                borderRadius: 8,
                                border: userChoice === valCol1 ? "2px solid #16a34a" : "1.5px solid #cbd5e1",
                                backgroundColor: userChoice === valCol1 ? "#16a34a" : "#f8fafc",
                                color: userChoice === valCol1 ? "#ffffff" : "#1e293b",
                                fontWeight: 800,
                                fontSize: 13,
                                cursor: (studyMode === "drill" && isItemEvaluated) ? "default" : "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 6,
                                minHeight: 44
                              }}
                            >
                              {userChoice === valCol1 && <Check size={15} strokeWidth={3} />}
                              <span>{stmtLabels[0]}</span>
                            </motion.button>

                            <motion.button
                              type="button"
                              className="cbt-stmt-btn cbt-stmt-btn-choice"
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleSelectStatementRow(opt.id, valCol2)}
                              disabled={studyMode === "drill" && isItemEvaluated}
                              style={{
                                padding: "10px 12px",
                                borderRadius: 8,
                                border: userChoice === valCol2 ? "2px solid #dc2626" : "1.5px solid #cbd5e1",
                                backgroundColor: userChoice === valCol2 ? "#dc2626" : "#f8fafc",
                                color: userChoice === valCol2 ? "#ffffff" : "#1e293b",
                                fontWeight: 800,
                                fontSize: 13,
                                cursor: (studyMode === "drill" && isItemEvaluated) ? "default" : "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 6,
                                minHeight: 44
                              }}
                            >
                              {userChoice === valCol2 && <Check size={15} strokeWidth={3} />}
                              <span>{stmtLabels[1]}</span>
                            </motion.button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Drill mode Periksa Jawaban button */}
                  {studyMode === "drill" && !isItemEvaluated && (
                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
                      <button
                        type="button"
                        className="cbt-check-btn"
                        onClick={() => handleCheckDrillAnswer(currentItem.nomor)}
                        disabled={!currentVal}
                        style={{
                          backgroundColor: currentVal ? "#18221f" : "#cbd5e1",
                          color: currentVal ? "#c8f064" : "#94a3b8",
                          padding: "10px 22px",
                          borderRadius: 8,
                          border: "none",
                          fontWeight: 700,
                          fontSize: 13,
                          cursor: currentVal ? "pointer" : "not-allowed",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <CheckCircle2 size={16} />
                        <span>Periksa Jawaban Pernyataan</span>
                      </button>
                    </div>
                  )}
                </div>
                );
              })() : currentItem.tipe_soal === "pilihan_ganda_kompleks" ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {currentItem.options.map((opt) => {
                    const isSelected = selectedList.includes(opt.id);
                    const keyParts = (currentItem.kunci_jawaban || "")
                      .toLowerCase()
                      .split(/[;,]/)
                      .map((s) => s.trim())
                      .filter(Boolean);
                    const isKey = keyParts.includes(opt.id.toLowerCase());

                    let border = isSelected ? "1.5px solid #16a34a" : "1px solid #dce2d6";
                    let bg = isSelected ? "#f0fdf4" : "#ffffff";
                    let checkBorder = isSelected ? "#16a34a" : "#94a3b8";
                    let checkBg = isSelected ? "#16a34a" : "#ffffff";
                    let badgeTag: React.ReactNode = null;
                    let opacity = 1;

                    if (studyMode === "drill" && isItemEvaluated) {
                      if (isKey && isSelected) {
                        border = "2px solid #10b981";
                        bg = "#f0fdf4";
                        checkBorder = "#10b981";
                        checkBg = "#10b981";
                        badgeTag = (
                          <span style={{ fontSize: 11, fontWeight: 700, color: "#15803d", backgroundColor: "#dcfce7", padding: "2px 8px", borderRadius: 4, display: "inline-flex", alignItems: "center", gap: 4 }}>
                            <Check size={12} strokeWidth={3} /> Kunci Jawaban (Pilihan Anda)
                          </span>
                        );
                      } else if (!isKey && isSelected) {
                        border = "2px solid #f43f5e";
                        bg = "#fff1f2";
                        checkBorder = "#f43f5e";
                        checkBg = "#f43f5e";
                        badgeTag = (
                          <span style={{ fontSize: 11, fontWeight: 700, color: "#be123c", backgroundColor: "#fee2e2", padding: "2px 8px", borderRadius: 4, display: "inline-flex", alignItems: "center", gap: 4 }}>
                            <X size={12} strokeWidth={3} /> Pilihan Anda (Salah)
                          </span>
                        );
                      } else if (isKey && !isSelected) {
                        border = "2px dashed #f59e0b";
                        bg = "#fffbeb";
                        checkBorder = "#f59e0b";
                        checkBg = "#ffffff";
                        badgeTag = (
                          <span style={{ fontSize: 11, fontWeight: 700, color: "#92400e", backgroundColor: "#fef3c7", padding: "2px 8px", borderRadius: 4, display: "inline-flex", alignItems: "center", gap: 4 }}>
                            <AlertCircle size={12} strokeWidth={2.5} /> Harusnya Dipilih (Kunci Jawaban)
                          </span>
                        );
                      } else {
                        border = "1px solid #e2e8f0";
                        bg = "#ffffff";
                        opacity = 0.65;
                      }
                    }

                    return (
                      <motion.button
                        key={opt.id}
                        type="button"
                        className={`cbt-option-btn ${isSelected ? "selected" : ""}`}
                        data-option-id={opt.id}
                        onClick={() => handleSelectOption(opt.id)}
                        disabled={studyMode === "drill" && isItemEvaluated}
                        whileTap={shouldReduceMotion || (studyMode === "drill" && isItemEvaluated) ? undefined : { scale: 0.96 }}
                        transition={{ type: "spring", stiffness: 450, damping: 25, mass: 0.4 }}
                        style={{
                          textAlign: "left",
                          width: "100%",
                          padding: "12px 16px",
                          borderRadius: 10,
                          border,
                          backgroundColor: bg,
                          cursor: (studyMode === "drill" && isItemEvaluated) ? "default" : "pointer",
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 12,
                          opacity,
                          touchAction: "manipulation",
                        }}
                      >
                        {/* Checkbox square */}
                        <motion.div
                          animate={isSelected && !shouldReduceMotion ? { scale: [1, 1.15, 1] } : { scale: 1 }}
                          transition={{ type: "spring", stiffness: 500, damping: 20 }}
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 6,
                            border: `2px solid ${checkBorder}`,
                            backgroundColor: checkBg,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#ffffff",
                            flexShrink: 0,
                            marginTop: 2,
                          }}
                        >
                          {isSelected && <Check size={14} strokeWidth={3} />}
                        </motion.div>

                        {/* Letter */}
                        <motion.span
                          animate={isSelected && !shouldReduceMotion ? { scale: [1, 1.15, 1] } : { scale: 1 }}
                          transition={{ type: "spring", stiffness: 500, damping: 20 }}
                          style={{ fontWeight: 800, fontSize: 13, color: "#18221f", width: 20, flexShrink: 0, marginTop: 3 }}
                        >
                          {opt.id.toUpperCase()}.
                        </motion.span>

                        {/* Text & Image */}
                        <div style={{ flex: 1, fontSize: 14, color: "#18221f", lineHeight: 1.5 }}>
                          <CbtContentRenderer
                            content={opt.text}
                            inline
                            onImageClick={(src, alt) => setZoomImage({ src, title: alt || `Diagram Pilihan ${opt.id.toUpperCase()} - Soal ${currentItem.nomor}` })}
                          />
                          {opt.img && (
                            <div style={{ marginTop: 8 }}>
                              <img
                                src={opt.img}
                                alt={`Pilihan ${opt.id}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setZoomImage({ src: opt.img!, title: `Diagram Pilihan ${opt.id.toUpperCase()} - Soal ${currentItem.nomor}` });
                                }}
                                style={{
                                  maxHeight: 260,
                                  maxWidth: "100%",
                                  width: "auto",
                                  height: "auto",
                                  objectFit: "contain",
                                  borderRadius: 6,
                                  border: "1px solid #e1e7dd",
                                  cursor: "zoom-in",
                                }}
                                loading="lazy"
                              />
                            </div>
                          )}
                          {badgeTag && <div style={{ marginTop: 6 }}>{badgeTag}</div>}
                        </div>
                      </motion.button>
                    );
                  })}

                  {/* Drill mode Periksa Jawaban button */}
                  {studyMode === "drill" && !isItemEvaluated && (
                    <div style={{ marginTop: 6, display: "flex", justifyContent: "flex-end" }}>
                      <button
                        type="button"
                        className="cbt-check-btn"
                        onClick={() => handleCheckDrillAnswer(currentItem.nomor)}
                        disabled={selectedList.length === 0}
                        style={{
                          backgroundColor: selectedList.length > 0 ? "#18221f" : "#cbd5e1",
                          color: selectedList.length > 0 ? "#c8f064" : "#94a3b8",
                          padding: "10px 22px",
                          borderRadius: 8,
                          border: "none",
                          fontWeight: 700,
                          fontSize: 13,
                          cursor: selectedList.length > 0 ? "pointer" : "not-allowed",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <CheckCircle2 size={16} />
                        <span>Periksa Jawaban ({selectedList.length} dipilih)</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* Default Single-Choice Options */
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {currentItem.options.map((opt) => {
                    const isSelected = selectedList.includes(opt.id);
                    const keyParts = (currentItem.kunci_jawaban || "")
                      .toLowerCase()
                      .split(/[;,]/)
                      .map((s) => s.trim())
                      .filter(Boolean);
                    const isKey = keyParts.includes(opt.id.toLowerCase());

                    let border = isSelected ? "1.5px solid #16a34a" : "1px solid #dce2d6";
                    let bg = isSelected ? "#f0fdf4" : "#ffffff";
                    let badgeBg = isSelected ? "#16a34a" : "#ffffff";
                    let badgeBorder = isSelected ? "#16a34a" : "#94a3b8";
                    let badgeColor = isSelected ? "#ffffff" : "#334155";
                    let opacity = 1;

                    if (studyMode === "drill" && isItemEvaluated) {
                      if (isKey) {
                        border = "2px solid #16a34a";
                        bg = "#f0fdf4";
                        badgeBg = "#16a34a";
                        badgeBorder = "#15803d";
                        badgeColor = "#ffffff";
                      } else if (isSelected && !isKey) {
                        border = "2px solid #dc2626";
                        bg = "#fef2f2";
                        badgeBg = "#dc2626";
                        badgeBorder = "#b91c1c";
                        badgeColor = "#ffffff";
                      } else {
                        border = "1px solid #e2e8f0";
                        bg = "#f8fafc";
                        badgeBg = "#f1f5f9";
                        badgeBorder = "#cbd5e1";
                        badgeColor = "#94a3b8";
                        opacity = 0.75;
                      }
                    }

                    return (
                      <motion.button
                        key={opt.id}
                        type="button"
                        className={`cbt-option-btn ${isSelected ? "selected" : ""}`}
                        data-option-id={opt.id}
                        onClick={() => handleSelectOption(opt.id)}
                        whileTap={shouldReduceMotion ? undefined : { scale: 0.96 }}
                        transition={{ type: "spring", stiffness: 450, damping: 25, mass: 0.4 }}
                        style={{
                          textAlign: "left",
                          width: "100%",
                          padding: "12px 16px",
                          borderRadius: 10,
                          border,
                          backgroundColor: bg,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 12,
                          opacity,
                          touchAction: "manipulation",
                        }}
                      >
                        {/* Letter badge / Radio Circle */}
                        <motion.span
                          animate={isSelected && !shouldReduceMotion ? { scale: [1, 1.15, 1] } : { scale: 1 }}
                          transition={{ type: "spring", stiffness: 500, damping: 20 }}
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: "50%",
                            backgroundColor: badgeBg,
                            color: badgeColor,
                            border: `2px solid ${badgeBorder}`,
                            fontSize: 12.5,
                            fontWeight: 800,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            boxShadow: isSelected ? "0 0 0 3px rgba(37,99,235,0.18)" : "none",
                          }}
                        >
                          {opt.id.toUpperCase()}
                        </motion.span>

                        {/* Text & Image */}
                        <div style={{ flex: 1, fontSize: Math.max(13.5, fontSizeLevel - 1), color: "#18221f", lineHeight: 1.5 }}>
                          <CbtContentRenderer
                            content={opt.text}
                            inline
                            onImageClick={(src, alt) => setZoomImage({ src, title: alt || `Diagram Pilihan ${opt.id.toUpperCase()} - Soal ${currentItem.nomor}` })}
                          />
                          {opt.img && (
                            <div style={{ marginTop: 8 }}>
                              <img
                                src={opt.img}
                                alt={`Pilihan ${opt.id}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setZoomImage({ src: opt.img!, title: `Diagram Pilihan ${opt.id.toUpperCase()} - Soal ${currentItem.nomor}` });
                                }}
                                style={{
                                  maxHeight: 260,
                                  maxWidth: "100%",
                                  width: "auto",
                                  height: "auto",
                                  objectFit: "contain",
                                  borderRadius: 6,
                                  border: "1px solid #e1e7dd",
                                  cursor: "zoom-in",
                                }}
                                loading="lazy"
                              />
                            </div>
                          )}
                        </div>

                        {/* Drill Feedback Badge on Option */}
                        {studyMode === "drill" && isItemEvaluated && isKey && (
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: "#15803d",
                              backgroundColor: "#dcfce7",
                              padding: "3px 8px",
                              borderRadius: 6,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              flexShrink: 0,
                            }}
                          >
                            <Check size={12} /> Kunci Jawaban
                          </span>
                        )}
                        {studyMode === "drill" && isItemEvaluated && isSelected && !isKey && (
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: "#b91c1c",
                              backgroundColor: "#fee2e2",
                              padding: "3px 8px",
                              borderRadius: 6,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              flexShrink: 0,
                            }}
                          >
                            <X size={12} /> Pilihan Anda
                          </span>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              )}

              {/* Drill Mode: Explanation / Key Card & Tanya Nara AI */}
              {studyMode === "drill" && isItemEvaluated && (
                <div
                  style={{
                    marginTop: 18,
                    padding: 16,
                    borderRadius: 12,
                    backgroundColor: isDrillCorrect ? "#f0fdf4" : "#fff1f2",
                    border: isDrillCorrect ? "1px solid #bbf7d0" : "1px solid #fecdd3",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 800, color: isDrillCorrect ? "#166534" : "#9f1239", display: "flex", alignItems: "center", gap: 6 }}>
                      {isDrillCorrect ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                      <span style={{ display: "inline-flex", alignItems: "center", flexWrap: "wrap", gap: 4 }}>
                        <span>Kunci Jawaban Resmi:</span>
                        <CbtContentRenderer
                          inline
                          content={currentItem.kunci_jawaban_text || `(${currentItem.kunci_jawaban.toUpperCase()})`}
                        />
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span
                        style={{
                          fontSize: 11.5,
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: 6,
                          backgroundColor: isDrillCorrect ? "#dcfce7" : "#fee2e2",
                          color: isDrillCorrect ? "#15803d" : "#be123c",
                        }}
                      >
                        {isDrillCorrect ? "Jawaban Anda Benar! 🎉" : "Perlu Evaluasi Konsep"}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleResetDrillAnswer(currentItem.nomor)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "4px 8px",
                          borderRadius: 6,
                          border: "1px solid #cbd5e1",
                          backgroundColor: "#ffffff",
                          color: "#475569",
                          fontSize: 11.5,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                        title="Ulangi pengerjaan soal ini"
                      >
                        <RotateCcw size={12} />
                        <span>Coba Lagi</span>
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (!onOpenNara) return;
                      const cleanBacaan = currentItem.bacaan
                        ? currentItem.bacaan.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 300)
                        : "";
                      const cleanSoal = currentItem.soal.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
                      const query = `Halo Nara AI, tolong bedah dan analisis konsep soal ujian ini:
Mata Pelajaran: ${currentPackage?.subtes_or_mapel || ""} (${currentPackage?.paket || ""})
Nomor Soal: ${currentItem.nomor}
${cleanBacaan ? `Stimulus/Wacana: "${cleanBacaan}..."\n` : ""}Pertanyaan: "${cleanSoal}"
Jawaban Saya: ${currentVal ? currentVal.toUpperCase() : "Kosong"}
Kunci Jawaban Resmi: ${cleanHtmlEntities(currentItem.kunci_jawaban_text || currentItem.kunci_jawaban.toUpperCase())}
Status: ${isDrillCorrect ? "BENAR" : "SALAH / PERLU EVALUASI"}

Tolong jelaskan akar konsepnya, mengapa opsi kunci jawaban tersebut benar, serta jebakan atau kesalahan penalaran yang sering terjadi.`;
                      onOpenNara(query);
                    }}
                    style={{
                      width: "100%",
                      marginTop: 8,
                      padding: "10px 16px",
                      borderRadius: 10,
                      backgroundColor: "#18221f",
                      color: "#c8f064",
                      border: "none",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <Sparkles size={16} />
                    <span>💬 Tanya Nara AI (Bedah Soal Ini)</span>
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Action Controls Bar */}
        <footer
          className="cbt-action-footer"
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #dce2d6",
            borderRadius: 12,
            padding: "10px 14px",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 8,
            boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
          }}
        >
          {/* Previous Button */}
          <motion.button
            onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
            whileTap={shouldReduceMotion || currentIndex === 0 ? undefined : { scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              border: "1px solid #dce2d6",
              backgroundColor: currentIndex === 0 ? "#f5f7f4" : "#ffffff",
              color: currentIndex === 0 ? "#a2b19e" : "#18221f",
              fontWeight: 700,
              fontSize: 12.5,
              cursor: currentIndex === 0 ? "not-allowed" : "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              flex: "1 1 auto",
              justifyContent: "center",
              maxWidth: 160,
              touchAction: "manipulation",
            }}
          >
            <ArrowLeft size={14} />
            <span>Sebelumnya</span>
          </motion.button>

          {/* Ragu-Ragu Toggle (Exam Mode only) */}
          {studyMode === "exam" && (
            <motion.button
              onClick={handleToggleDoubtful}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              style={{
                padding: "8px 14px",
                borderRadius: 8,
                border: isDoubt ? "1.5px solid #eab308" : "1.5px solid #cbd5e1",
                backgroundColor: isDoubt ? "#fef08a" : "#ffffff",
                color: isDoubt ? "#854d0e" : "#475569",
                fontWeight: 700,
                fontSize: 12.5,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                flex: "1 1 auto",
                justifyContent: "center",
                maxWidth: 180,
                touchAction: "manipulation",
              }}
            >
              <HelpCircle size={15} />
              <span>{isDoubt ? "Ragu-Ragu ✓" : "Ragu-Ragu"}</span>
            </motion.button>
          )}

          {/* Next / Finish Button */}
          {currentIndex < total - 1 ? (
            <motion.button
              onClick={() => setCurrentIndex((prev) => Math.min(total - 1, prev + 1))}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "1px solid #18221f",
                backgroundColor: "#18221f",
                color: "#c8f064",
                fontWeight: 700,
                fontSize: 12.5,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                flex: "1 1 auto",
                justifyContent: "center",
                maxWidth: 160,
                touchAction: "manipulation",
              }}
            >
              <span>Berikutnya</span>
              <ArrowRight size={14} />
            </motion.button>
          ) : (
            <motion.button
              onClick={() => setIsSubmitModalOpen(true)}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "none",
                backgroundColor: "#16a34a",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: 12.5,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                flex: "1 1 auto",
                justifyContent: "center",
                maxWidth: 160,
                touchAction: "manipulation",
              }}
            >
              <Check size={14} />
              <span>{studyMode === "drill" ? "Selesai Latihan" : "Selesai Ujian"}</span>
            </motion.button>
          )}
        </footer>

        {/* Floating Circular FAB Tanya Nara AI */}
        <motion.button
          type="button"
          onClick={() => {
            if (!onOpenNara) return;
            const cleanBacaan = currentItem.bacaan
              ? currentItem.bacaan.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 300)
              : "";
            const cleanSoal = currentItem.soal.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
            const query = `Halo Nara AI, saya sedang mengerjakan soal ujian ini dan butuh bantuan pemahaman konsep:
Mata Pelajaran: ${currentPackage?.subtes_or_mapel || ""} (${currentPackage?.paket || ""})
Nomor Soal: ${currentItem.nomor}
${cleanBacaan ? `Wacana: "${cleanBacaan}..."\n` : ""}Pertanyaan: "${cleanSoal}"

Tolong berikan petunjuk/clue pemikiran tanpa langsung membocorkan jawaban final.`;
            onOpenNara(query);
          }}
          whileHover={shouldReduceMotion ? undefined : { scale: 1.08 }}
          whileTap={shouldReduceMotion ? undefined : { scale: 0.92 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="cbt-nara-floating-fab"
          style={{
            position: "fixed",
            bottom: "calc(132px + env(safe-area-inset-bottom, 0px))",
            right: 16,
            width: 48,
            height: 48,
            borderRadius: "50%",
            backgroundColor: "#18221f",
            color: "#c8f064",
            border: "1.5px solid rgba(200, 240, 100, 0.4)",
            boxShadow: "0 6px 20px rgba(0, 0, 0, 0.25), 0 0 12px rgba(200, 240, 100, 0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            zIndex: 1600,
            touchAction: "manipulation",
          }}
          title="Tanya Nara AI seputar soal ini"
          aria-label="Tanya Nara AI"
        >
          <Sparkles size={20} color="#c8f064" />
          <span
            className="cbt-nara-fab-badge"
            style={{
              position: "absolute",
              top: -4,
              right: -4,
              backgroundColor: "#72a728",
              color: "#ffffff",
              fontSize: 9,
              fontWeight: 800,
              padding: "1px 5px",
              borderRadius: 999,
              letterSpacing: "0.5px",
            }}
          >
            AI
          </span>
        </motion.button>

        {/* Floating Wacana Sheet Modal on Mobile */}
        {typeof document !== "undefined" && createPortal(
          <AnimatePresence>
            {isWacanaModalOpen && hasBacaan && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{
                  position: "fixed",
                  inset: 0,
                  backgroundColor: "rgba(10, 15, 13, 0.7)",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                  zIndex: 100000,
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "center",
                }}
                onClick={() => setIsWacanaModalOpen(false)}
              >
                <motion.div
                  initial={shouldReduceMotion ? { opacity: 0 } : { y: "100%", scale: 0.98 }}
                  animate={shouldReduceMotion ? { opacity: 1 } : { y: 0, scale: 1 }}
                  exit={shouldReduceMotion ? { opacity: 0 } : { y: "100%", scale: 0.98 }}
                  transition={
                    shouldReduceMotion
                      ? { duration: 0.1 }
                      : {
                          type: "spring",
                          stiffness: 280,
                          damping: 26,
                          mass: 0.6,
                        }
                  }
                  drag={shouldReduceMotion ? false : "y"}
                  dragControls={dragControls}
                  dragListener={false}
                  dragConstraints={{ top: 0 }}
                  dragElastic={0.2}
                  onDragEnd={(_, info) => {
                    if (info.offset.y > 100 || info.velocity.y > 400) {
                      setIsWacanaModalOpen(false);
                    }
                  }}
                  className="cbt-wacana-sheet-motion cbt-wacana-sheet-modal"
                  style={{
                    width: "100%",
                    maxWidth: 580,
                    backgroundColor: "#ffffff",
                    borderTopLeftRadius: 20,
                    borderTopRightRadius: 20,
                    padding: "16px 18px calc(24px + env(safe-area-inset-bottom, 16px)) 18px",
                    maxHeight: "82vh",
                    boxShadow: "0 -10px 40px rgba(0,0,0,0.25)",
                    display: "flex",
                    flexDirection: "column",
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Header Drag Zone */}
                  <div
                    onPointerDown={(e) => dragControls.start(e)}
                    style={{
                      cursor: "grab",
                      touchAction: "none",
                      paddingBottom: 8,
                      borderBottom: "1px solid #e2e8e0",
                      marginBottom: 12,
                      userSelect: "none",
                    }}
                  >
                    {/* Drag Handle Pill */}
                    <div
                      style={{
                        width: 36,
                        height: 4,
                        borderRadius: 999,
                        backgroundColor: "#cbd5e1",
                        margin: "0 auto 12px auto",
                        flexShrink: 0,
                      }}
                    />

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, backgroundColor: "#f0fdf4", color: "#166534", padding: "4px 10px", borderRadius: 8, fontSize: 12, fontWeight: 700 }}>
                        <BookOpen size={13} />
                        <span>Wacana / Stimulus Soal</span>
                      </div>
                      <button
                        type="button"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={() => setIsWacanaModalOpen(false)}
                        style={{
                          backgroundColor: "#f1f5f9",
                          border: "none",
                          borderRadius: "50%",
                          width: 28,
                          height: 28,
                          display: "grid",
                          placeItems: "center",
                          cursor: "pointer",
                          color: "#475569",
                        }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Scrollable Content Area */}
                  <div
                    className="cbt-wacana-scroll-content"
                    style={{
                      flex: 1,
                      overflowY: "auto",
                      WebkitOverflowScrolling: "touch",
                      touchAction: "pan-y",
                      overscrollBehavior: "contain",
                      paddingRight: 4,
                    }}
                  >
                    <div style={{ fontSize: fontSizeLevel, lineHeight: 1.8, color: "#1e293b" }}>
                      <CbtContentRenderer
                        content={currentItem.bacaan}
                        onImageClick={(src, alt) => setZoomImage({ src, title: alt || `Diagram Wacana - Soal ${currentItem.nomor}` })}
                      />
                    </div>

                    {currentItem.soal_img && (
                      <div style={{ marginTop: 16, textAlign: "center" }}>
                        <img
                          src={currentItem.soal_img}
                          alt={`Diagram Soal ${currentItem.nomor}`}
                          onClick={() => setZoomImage({ src: currentItem.soal_img!, title: `Diagram Soal ${currentItem.nomor}` })}
                          style={{ maxWidth: "100%", maxHeight: 320, objectFit: "contain", borderRadius: 8, border: "1px solid #e2e8e0" }}
                        />
                      </div>
                    )}

                    {/* Safe-area bottom spacer so content never touches screen/sheet bottom edge */}
                    <div style={{ height: "calc(24px + env(safe-area-inset-bottom, 16px))", minHeight: 24, flexShrink: 0 }} />
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}

        {/* Modal Sheet Soal Cepat (TASK-069) */}
        {typeof document !== "undefined" && createPortal(
          <AnimatePresence>
            {isSoalModalOpen && currentItem && (
              <div
                style={{
                  position: "fixed",
                  inset: 0,
                  backgroundColor: "rgba(10, 15, 13, 0.75)",
                  backdropFilter: "blur(6px)",
                  WebkitBackdropFilter: "blur(6px)",
                  zIndex: 100000,
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "center",
                }}
                onClick={() => setIsSoalModalOpen(false)}
              >
                <motion.div
                  initial={shouldReduceMotion ? { opacity: 0 } : { y: "100%", opacity: 0.9 }}
                  animate={shouldReduceMotion ? { opacity: 1 } : { y: 0, opacity: 1 }}
                  exit={shouldReduceMotion ? { opacity: 0 } : { y: "100%", opacity: 0.9 }}
                  transition={
                    shouldReduceMotion
                      ? { duration: 0.1 }
                      : { type: "spring", stiffness: 300, damping: 28 }
                  }
                  className="cbt-soal-sheet-modal"
                  style={{
                    width: "100%",
                    maxWidth: 580,
                    backgroundColor: "#ffffff",
                    borderTopLeftRadius: 20,
                    borderTopRightRadius: 20,
                    padding: "16px 18px calc(24px + env(safe-area-inset-bottom, 16px)) 18px",
                    maxHeight: "80vh",
                    display: "flex",
                    flexDirection: "column",
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Handle pill */}
                  <div style={{ width: 38, height: 4.5, borderRadius: 999, backgroundColor: "#cbd5e1", margin: "0 auto 12px auto" }} />

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, paddingBottom: 10, borderBottom: "1px solid #e2e8e0" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, backgroundColor: "#f0fdf4", color: "#166534", padding: "4px 10px", borderRadius: 8, fontSize: 12, fontWeight: 800 }}>
                      <HelpCircle size={14} />
                      <span>Soal Nomor {currentItem.nomor} (dari {total} butir)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsSoalModalOpen(false)}
                      style={{ backgroundColor: "#f1f5f9", border: "none", borderRadius: "50%", width: 28, height: 28, display: "grid", placeItems: "center", cursor: "pointer", color: "#475569" }}
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div style={{ flex: 1, overflowY: "auto", fontSize: 14.5, lineHeight: 1.7, color: "#18221f" }}>
                    <CbtContentRenderer
                      content={currentItem.soal}
                      onImageClick={(src, alt) => setZoomImage({ src, title: alt || `Diagram Soal ${currentItem.nomor}` })}
                    />
                    {currentItem.soal_img && (
                      <div style={{ marginTop: 14, textAlign: "center" }}>
                        <img
                          src={currentItem.soal_img}
                          alt="Diagram Soal"
                          onClick={() => setZoomImage({ src: currentItem.soal_img!, title: `Diagram Soal ${currentItem.nomor}` })}
                          style={{ maxWidth: "100%", maxHeight: 300, objectFit: "contain", borderRadius: 8, cursor: "zoom-in" }}
                        />
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}

        {/* Question Palette Drawer Modal */}
        {isPaletteOpen && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              zIndex: 9999,
              display: "flex",
              justifyContent: "flex-end",
            }}
            onClick={() => setIsPaletteOpen(false)}
          >
            <div
              style={{
                width: "100%",
                maxWidth: 420,
                backgroundColor: "#ffffff",
                height: "100%",
                padding: 24,
                overflowY: "auto",
                boxShadow: "-4px 0 20px rgba(0,0,0,0.15)",
                display: "flex",
                flexDirection: "column",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: "#18221f", margin: "0 0 2px 0" }}>
                    Daftar Nomor Soal
                  </h3>
                  {studyMode === "drill" && (
                    <div style={{ fontSize: 12, color: "#526350" }}>
                      Benar: <strong style={{ color: "#15803d" }}>{drillCorrectCount}</strong> • Salah:{" "}
                      <strong style={{ color: "#dc2626" }}>{drillWrongCount}</strong> • Belum:{" "}
                      <strong>{total - (drillCorrectCount + drillWrongCount)}</strong>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setIsPaletteOpen(false)}
                  style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#64748b" }}
                >
                  ✕
                </button>
              </div>

              {/* Status Legend */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, fontSize: 11, marginBottom: 18, color: "#526350" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ width: 14, height: 14, backgroundColor: "#18221f", border: "2px solid #c8f064", borderRadius: 4 }} />
                  <span>Aktif</span>
                </div>
                {studyMode === "drill" ? (
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ width: 14, height: 14, backgroundColor: "#10b981", borderRadius: 4 }} />
                      <span>Benar</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ width: 14, height: 14, backgroundColor: "#2d1a1a", border: "1px solid #4a2323", borderRadius: 4 }} />
                      <span style={{ color: "#ff5c5c" }}>Salah</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ width: 14, height: 14, backgroundColor: "#16a34a", borderRadius: 4 }} />
                      <span>Dijawab</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ width: 14, height: 14, backgroundColor: "#fef08a", border: "1px solid #eab308", borderRadius: 4 }} />
                      <span>Ragu-ragu</span>
                    </div>
                  </>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ width: 14, height: 14, backgroundColor: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: 4 }} />
                  <span>Belum</span>
                </div>
              </div>

              {/* Grid 1..N */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(5, 1fr)",
                  gap: 10,
                  flex: 1,
                  alignContent: "start",
                }}
              >
                {items.map((item, idx) => {
                  const isCurrent = idx === currentIndex;
                  const itemAnswered = answers[item.nomor] !== undefined && answers[item.nomor] !== "";
                  const itemDoubt = Boolean(doubtful[item.nomor]);

                  let bg = "#f1f5f9";
                  let color = "#475569";
                  let border = "1.5px solid #cbd5e1";
                  let iconSymbol: React.ReactNode = null;

                  if (isCurrent) {
                    bg = "#18221f";
                    color = "#c8f064";
                    border = "2px solid #c8f064";
                  } else if (studyMode === "drill" && itemAnswered) {
                    const isComplex = item.tipe_soal === "pilihan_ganda_kompleks" || item.tipe_soal === "pernyataan";
                    const isChecked = isComplex ? Boolean(drillChecked[item.nomor]) : true;
                    if (isChecked) {
                      if (isAnswerCorrect(answers[item.nomor], item.kunci_jawaban, item.tipe_soal)) {
                        bg = "#16a34a";
                        color = "#ffffff";
                        border = "1.5px solid #15803d";
                        iconSymbol = "✓";
                      } else {
                        bg = "#2d1a1a";
                        color = "#ff5c5c";
                        border = "1.5px solid #4a2323";
                        iconSymbol = "✗";
                      }
                    } else {
                      bg = "#23342e";
                      color = "#c8f064";
                      border = "1.5px solid #334840";
                      iconSymbol = "…";
                    }
                  } else if (itemDoubt) {
                    bg = "#fef08a";
                    color = "#854d0e";
                    border = "1.5px solid #eab308";
                  } else if (itemAnswered) {
                    bg = "#16a34a";
                    color = "#ffffff";
                    border = "1.5px solid #15803d";
                    iconSymbol = "✓";
                  }

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setCurrentIndex(idx);
                        setIsPaletteOpen(false);
                      }}
                      style={{
                        height: 44,
                        borderRadius: 8,
                        backgroundColor: bg,
                        color: color,
                        border: border,
                        fontWeight: 800,
                        fontSize: 13,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        position: "relative",
                      }}
                    >
                      <span>{item.nomor}</span>
                      {iconSymbol && !isCurrent && (
                        <span style={{ position: "absolute", top: 2, right: 3, fontSize: 9, color: studyMode === "drill" ? "#ffffff" : "#c8f064" }}>
                          {iconSymbol}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Submit Confirmation Modal */}
        {isSubmitModalOpen && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.55)",
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 20,
            }}
          >
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: 16,
                padding: 26,
                maxWidth: 440,
                width: "100%",
                boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
              }}
            >
              <h3 style={{ fontSize: 18, fontWeight: 800, color: "#18221f", margin: "0 0 10px 0" }}>
                {studyMode === "drill" ? "Konfirmasi Selesai Latihan" : "Konfirmasi Selesai Ujian"}
              </h3>
              <p style={{ fontSize: 13.5, color: "#526350", lineHeight: 1.5, margin: "0 0 18px 0" }}>
                {studyMode === "drill"
                  ? "Apakah Anda ingin menyelesaikan sesi latihan mandiri dan melihat ringkasan performa Anda?"
                  : "Apakah Anda yakin ingin menyelesaikan simulasi CBT sekarang? Hasil nilai dan evaluasi resmi akan langsung dihitung."}
              </p>

              {/* Summary pills */}
              <div style={{ backgroundColor: "#f9fbf7", border: "1px solid #e1e7dd", borderRadius: 10, padding: 14, marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                  <span>Total Soal:</span>
                  <strong>{total} butir</strong>
                </div>
                {studyMode === "drill" ? (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                      <span>Jawaban Benar:</span>
                      <strong style={{ color: "#15803d" }}>{drillCorrectCount} butir</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                      <span>Jawaban Salah:</span>
                      <strong style={{ color: "#dc2626" }}>{drillWrongCount} butir</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                      <span>Belum Dijawab:</span>
                      <strong>{total - (drillCorrectCount + drillWrongCount)} butir</strong>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                      <span>Sudah Dijawab:</span>
                      <strong style={{ color: "#15803d" }}>{answeredCount} butir</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                      <span>Belum Dijawab:</span>
                      <strong style={{ color: total - answeredCount > 0 ? "#dc2626" : "#526350" }}>
                        {total - answeredCount} butir
                      </strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                      <span>Masih Ragu-Ragu:</span>
                      <strong style={{ color: doubtfulCount > 0 ? "#ca8a04" : "#526350" }}>{doubtfulCount} butir</strong>
                    </div>
                  </>
                )}
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => setIsSubmitModalOpen(false)}
                  disabled={isSubmitting}
                  style={{
                    flex: 1,
                    padding: "10px 16px",
                    borderRadius: 8,
                    border: "1px solid #dce2d6",
                    backgroundColor: "#ffffff",
                    color: "#18221f",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Lanjut Mengerjakan
                </button>
                <button
                  onClick={() => handleSubmitExam(false)}
                  disabled={isSubmitting}
                  style={{
                    flex: 1,
                    padding: "10px 16px",
                    borderRadius: 8,
                    border: "none",
                    backgroundColor: "#18221f",
                    color: "#c8f064",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: isSubmitting ? "not-allowed" : "pointer",
                  }}
                >
                  {isSubmitting ? "Memproses..." : studyMode === "drill" ? "Lihat Evaluasi" : "Kirim Jawaban"}
                </button>
              </div>
            </div>
          </div>
        )}

        <ImageLightboxModal image={zoomImage} onClose={() => setZoomImage(null)} />
      </div>
    );
  }

  // ==========================================
  // RENDER MODE C: OFFICIAL REVIEW & DIAGNOSTIC
  // ==========================================
  if (mode === "review" && reviewResult) {
    const wrongCount = reviewResult.total - reviewResult.correct;

    const filteredBreakdown = reviewResult.breakdown.filter((item) => {
      if (reviewFilter === "wrong") return !item.is_correct;
      if (reviewFilter === "correct") return item.is_correct;
      return true;
    });

    return (
      <div style={{ padding: "8px 0 40px 0" }}>
        {/* Score Header Card */}
        <div
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #dce2d6",
            borderRadius: 16,
            padding: "26px 28px",
            marginBottom: 24,
            boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: 20 }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, backgroundColor: "#f0f4ea", color: "#4b6623", padding: "4px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
                <CheckCircle2 size={14} />
                <span>Hasil Simulasi Resmi</span>
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: "#18221f", margin: "0 0 4px 0" }}>
                {currentPackage?.subtes_or_mapel} ({currentPackage?.paket})
              </h2>
              <div style={{ fontSize: 13, color: "#6e826b" }}>
                Waktu Pengerjaan: {formatTimer(timeSpentSeconds)} • Total: {reviewResult.total} butir
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              {currentPackage?.id.startsWith("room_") && onOpenRoomModal && (
                <button
                  type="button"
                  onClick={() => onOpenRoomModal(currentPackage.id.replace("room_", ""))}
                  style={{
                    backgroundColor: "#fef3c7",
                    color: "#92400e",
                    border: "1px solid #fde68a",
                    borderRadius: 10,
                    padding: "10px 16px",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Trophy size={15} color="#b45309" />
                  <span>Papan Skor Room</span>
                </button>
              )}

              <button
                onClick={() => handleOpenDiagnosticPanel()}
                style={{
                  backgroundColor: "#18221f",
                  color: "#c8f064",
                  border: "none",
                  borderRadius: 10,
                  padding: "10px 18px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                }}
              >
                <Sparkles size={16} />
                <span>Bedah Semua Salah via Nara AI</span>
              </button>

              <button
                onClick={() => setMode("selector")}
                style={{
                  backgroundColor: "#ffffff",
                  color: "#18221f",
                  border: "1px solid #dce2d6",
                  borderRadius: 10,
                  padding: "10px 16px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <RotateCcw size={15} />
                <span>Pilih Paket Lain</span>
              </button>
            </div>
          </div>

          {/* Metrics Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: 12,
            }}
          >
            <div style={{ backgroundColor: "#f6faee", border: "1px solid #dce2d6", borderRadius: 12, padding: 14, textAlign: "center" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#4b6623", textTransform: "uppercase" }}>Skor Akurasi</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: "#18221f", marginTop: 4 }}>{reviewResult.score_percent}%</div>
            </div>

            <div style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: 14, textAlign: "center" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#166534", textTransform: "uppercase" }}>Estimasi Skor IRT</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: "#15803d", marginTop: 4 }}>{reviewResult.estimated_irt}</div>
            </div>

            <div style={{ backgroundColor: "#f9fbf7", border: "1px solid #e1e7dd", borderRadius: 12, padding: 14, textAlign: "center" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#526350", textTransform: "uppercase" }}>Jawaban Benar</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: "#18221f", marginTop: 4 }}>
                {reviewResult.correct} <span style={{ fontSize: 14, fontWeight: 500, color: "#6e826b" }}>/ {reviewResult.total}</span>
              </div>
            </div>

            <div style={{ backgroundColor: wrongCount > 0 ? "#fef2f2" : "#f9fbf7", border: wrongCount > 0 ? "1px solid #fee2e2" : "1px solid #e1e7dd", borderRadius: 12, padding: 14, textAlign: "center" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: wrongCount > 0 ? "#991b1b" : "#526350", textTransform: "uppercase" }}>Salah / Kosong</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: wrongCount > 0 ? "#dc2626" : "#18221f", marginTop: 4 }}>{wrongCount}</div>
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <button
            onClick={() => setReviewFilter("all")}
            style={{
              padding: "6px 14px",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              border: reviewFilter === "all" ? "1px solid #18221f" : "1px solid #dce2d6",
              backgroundColor: reviewFilter === "all" ? "#18221f" : "#ffffff",
              color: reviewFilter === "all" ? "#ffffff" : "#526350",
            }}
          >
            Semua ({reviewResult.total})
          </button>
          <button
            onClick={() => setReviewFilter("wrong")}
            style={{
              padding: "6px 14px",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              border: reviewFilter === "wrong" ? "1px solid #dc2626" : "1px solid #dce2d6",
              backgroundColor: reviewFilter === "wrong" ? "#dc2626" : "#ffffff",
              color: reviewFilter === "wrong" ? "#ffffff" : "#526350",
            }}
          >
            Salah Saja ({wrongCount})
          </button>
          <button
            onClick={() => setReviewFilter("correct")}
            style={{
              padding: "6px 14px",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              border: reviewFilter === "correct" ? "1px solid #16a34a" : "1px solid #dce2d6",
              backgroundColor: reviewFilter === "correct" ? "#16a34a" : "#ffffff",
              color: reviewFilter === "correct" ? "#ffffff" : "#526350",
            }}
          >
            Benar Saja ({reviewResult.correct})
          </button>
        </div>

        {/* Official Review Table */}
        <div
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #dce2d6",
            borderRadius: 14,
            overflow: "hidden",
            boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
          }}
        >
          <div style={{ width: "100%", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
            <table style={{ width: "100%", minWidth: 620, borderCollapse: "collapse", fontSize: 13, textAlign: "left" }}>
            <thead>
              <tr style={{ backgroundColor: "#f5f7f4", borderBottom: "1px solid #dce2d6", color: "#526350", fontWeight: 700 }}>
                <th style={{ padding: "12px 16px", width: 60 }}>No</th>
                <th style={{ padding: "12px 16px" }}>Ringkasan Soal</th>
                <th style={{ padding: "12px 16px", width: 120 }}>Jawaban Anda</th>
                <th style={{ padding: "12px 16px", width: 120 }}>Kunci Resmi</th>
                <th style={{ padding: "12px 16px", width: 100 }}>Status</th>
                <th style={{ padding: "12px 16px", width: 140, textAlign: "right" }}>Bedah AI</th>
              </tr>
            </thead>
            <tbody>
              {filteredBreakdown.map((item) => {
                const isExpanded = Boolean(expandedItems[item.nomor]);
                return (
                  <React.Fragment key={item.nomor}>
                    <tr
                      style={{
                        borderBottom: "1px solid #eef2eb",
                        backgroundColor: isExpanded ? "#fafcf9" : "transparent",
                      }}
                    >
                      <td style={{ padding: "12px 16px", fontWeight: 800 }}>{item.nomor}</td>
                      <td
                        style={{ padding: "12px 16px", cursor: "pointer", color: "#18221f" }}
                        onClick={() =>
                          setExpandedItems((prev) => ({
                            ...prev,
                            [item.nomor]: !prev[item.nomor],
                          }))
                        }
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 6, maxWidth: 520 }}>
                          <span style={{ fontWeight: 600, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                            <CbtContentRenderer inline content={item.soal} />
                          </span>
                          {isExpanded ? <ChevronUp size={14} color="#839780" /> : <ChevronDown size={14} color="#839780" />}
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span
                          style={{
                            fontWeight: 700,
                            padding: "3px 8px",
                            borderRadius: 6,
                            backgroundColor: item.user_answer ? (item.is_correct ? "#eef6e6" : "#fee2e2") : "#f1f5f9",
                            color: item.user_answer ? (item.is_correct ? "#2e6a18" : "#991b1b") : "#64748b",
                            fontSize: 12,
                            display: "inline-block",
                            maxWidth: 140,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {item.tipe_soal === "pernyataan"
                            ? (item.user_answer ? "Tabel (Klik Detail)" : "Kosong")
                            : (item.user_answer ? item.user_answer.split(/[;,]/).map((s) => s.trim().toUpperCase()).join(", ") : "-")}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span
                          style={{
                            fontWeight: 700,
                            color: "#166534",
                            backgroundColor: "#eef6e6",
                            padding: "3px 8px",
                            borderRadius: 6,
                            fontSize: 12,
                            display: "inline-block",
                            maxWidth: 140,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {item.tipe_soal === "pernyataan"
                            ? "Kunci di Tabel"
                            : (item.kunci_jawaban || "").split(/[;,]/).map((s) => s.trim().toUpperCase()).join(", ")}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        {item.is_correct ? (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#16a34a", fontWeight: 700, fontSize: 12 }}>
                            <CheckCircle2 size={14} /> Benar
                          </span>
                        ) : (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#dc2626", fontWeight: 700, fontSize: 12 }}>
                            <XCircle size={14} /> Salah
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>
                        <button
                          onClick={() => handleOpenDiagnosticPanel([item])}
                          style={{
                            backgroundColor: "#18221f",
                            color: "#c8f064",
                            border: "none",
                            borderRadius: 6,
                            padding: "6px 10px",
                            fontSize: 11.5,
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <Sparkles size={12} />
                          <span>Bedah</span>
                        </button>
                      </td>
                    </tr>

                    {/* Expanded Detail Row */}
                    {isExpanded && (
                      <tr style={{ backgroundColor: "#fafcf9", borderBottom: "1px solid #dce2d6" }}>
                        <td colSpan={6} style={{ padding: "16px 20px" }}>
                          <div style={{ backgroundColor: "#ffffff", border: "1px solid #e1e7dd", borderRadius: 10, padding: 18 }}>
                            {item.bacaan && (
                              <div style={{ marginBottom: 14, padding: "10px 14px", backgroundColor: "#f9fbf7", borderRadius: 8, border: "1px solid #eef2eb", fontSize: 13, lineHeight: 1.6, color: "#475569" }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: "#526350", marginBottom: 4, textTransform: "uppercase" }}>Wacana:</div>
                                <CbtContentRenderer
                                  content={item.bacaan}
                                  onImageClick={(src, alt) => setZoomImage({ src, title: alt || `Diagram Wacana - Soal ${item.nomor}` })}
                                />
                              </div>
                            )}

                            <div style={{ fontSize: 14, fontWeight: 700, color: "#18221f", marginBottom: 12, lineHeight: 1.6 }}>
                              <CbtContentRenderer
                                content={item.soal}
                                onImageClick={(src, alt) => setZoomImage({ src, title: alt || `Diagram Soal ${item.nomor}` })}
                              />
                            </div>

                            {item.soal_img && (
                              <div style={{ marginBottom: 14 }}>
                                <img
                                  src={item.soal_img}
                                  alt="Diagram Soal"
                                  onClick={() => setZoomImage({ src: item.soal_img!, title: `Diagram Soal ${item.nomor}` })}
                                  style={{
                                    maxHeight: 360,
                                    maxWidth: "100%",
                                    width: "auto",
                                    height: "auto",
                                    objectFit: "contain",
                                    borderRadius: 6,
                                    border: "1px solid #e1e7dd",
                                    cursor: "zoom-in",
                                  }}
                                  loading="lazy"
                                />
                              </div>
                            )}

                            {item.tipe_soal === "pernyataan" && item.options && item.options.length > 0 ? (
                              <div style={{ overflowX: "auto", borderRadius: 8, border: "1px solid #dce2d6", marginBottom: 14 }}>
                                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
                                  <thead>
                                    <tr style={{ backgroundColor: "#f4f7f2", borderBottom: "1px solid #dce2d6", color: "#4b5d49" }}>
                                      <th style={{ padding: "8px 12px", width: 44, textAlign: "center", fontWeight: 700 }}>No</th>
                                      <th style={{ padding: "8px 12px", fontWeight: 700 }}>Pernyataan</th>
                                      <th style={{ padding: "8px 12px", width: 110, textAlign: "center", fontWeight: 700 }}>Pilihan Anda</th>
                                      <th style={{ padding: "8px 12px", width: 110, textAlign: "center", fontWeight: 700 }}>Kunci Resmi</th>
                                      <th style={{ padding: "8px 12px", width: 100, textAlign: "center", fontWeight: 700 }}>Status</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {item.options.map((opt, rIdx) => {
                                      const userMap = parseStatementAnswers(item.user_answer);
                                      const keyMap = parseStatementAnswers(item.kunci_jawaban);
                                      const userPick = userMap[opt.id.toLowerCase()];
                                      const keyPick = keyMap[opt.id.toLowerCase()];
                                      const isCorrect = Boolean(userPick && keyPick && normalizeStatementValue(userPick) === normalizeStatementValue(keyPick));

                                      return (
                                        <tr key={opt.id} style={{ backgroundColor: isCorrect ? "#f0fdf4" : userPick ? "#fff1f2" : "#ffffff", borderBottom: "1px solid #e5ebe1" }}>
                                          <td style={{ padding: "10px 12px", textAlign: "center", fontWeight: 800 }}>{rIdx + 1}</td>
                                          <td style={{ padding: "10px 12px" }}>
                                            <CbtContentRenderer
                                              content={opt.text}
                                              onImageClick={(src, alt) => setZoomImage({ src, title: alt || `Diagram Pernyataan ${opt.id.toUpperCase()} - Soal ${item.nomor}` })}
                                            />
                                            {opt.img && (
                                              <div style={{ marginTop: 6 }}>
                                                <img
                                                  src={opt.img}
                                                  alt={`Pernyataan ${opt.id}`}
                                                  onClick={() => setZoomImage({ src: opt.img!, title: `Diagram Pernyataan ${opt.id.toUpperCase()} - Soal ${item.nomor}` })}
                                                  style={{
                                                    maxHeight: 200,
                                                    maxWidth: "100%",
                                                    width: "auto",
                                                    height: "auto",
                                                    objectFit: "contain",
                                                    borderRadius: 6,
                                                    border: "1px solid #e1e7dd",
                                                    cursor: "zoom-in",
                                                  }}
                                                  loading="lazy"
                                                />
                                              </div>
                                            )}
                                          </td>
                                          <td style={{ padding: "10px 12px", textAlign: "center", fontWeight: 700, color: isPositiveStatementValue(userPick) ? "#16a34a" : userPick ? "#dc2626" : "#64748b" }}>
                                            {formatStatementValue(userPick)}
                                          </td>
                                          <td style={{ padding: "10px 12px", textAlign: "center", fontWeight: 700, color: isPositiveStatementValue(keyPick) ? "#16a34a" : "#dc2626" }}>
                                            {formatStatementValue(keyPick)}
                                          </td>
                                          <td style={{ padding: "10px 12px", textAlign: "center" }}>
                                            {isCorrect ? (
                                              <span style={{ color: "#15803d", fontWeight: 700, fontSize: 11.5, backgroundColor: "#dcfce7", padding: "2px 6px", borderRadius: 4 }}>
                                                ✓ Tepat
                                              </span>
                                            ) : userPick && keyPick && normalizeStatementValue(userPick) !== normalizeStatementValue(keyPick) ? (
                                              <span style={{ color: "#be123c", fontWeight: 700, fontSize: 11.5, backgroundColor: "#fee2e2", padding: "2px 6px", borderRadius: 4 }}>
                                                ✕ Salah
                                              </span>
                                            ) : (
                                              <span style={{ color: "#64748b", fontWeight: 600, fontSize: 11 }}>
                                                -
                                              </span>
                                            )}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            ) : item.options && item.options.length > 0 ? (
                              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
                                {item.options.map((opt) => {
                                  const optIdLower = opt.id.toLowerCase();
                                  const userParts = (item.user_answer || "")
                                    .toLowerCase()
                                    .split(/[;,]/)
                                    .map((s) => s.trim())
                                    .filter(Boolean);
                                  const keyParts = (item.kunci_jawaban || "")
                                    .toLowerCase()
                                    .split(/[;,]/)
                                    .map((s) => s.trim())
                                    .filter(Boolean);

                                  const isUserPick = userParts.includes(optIdLower);
                                  const isKey = keyParts.includes(optIdLower);

                                  let bg = "#ffffff";
                                  let border = "1px solid #e2e8f0";
                                  let badgeTag: React.ReactNode = null;

                                  if (isKey && isUserPick) {
                                    bg = "#f0fdf4";
                                    border = "1px solid #86efac";
                                    badgeTag = <span style={{ fontSize: 11, fontWeight: 700, color: "#15803d" }}>✓ KUNCI RESMI (PILIHAN ANDA)</span>;
                                  } else if (isUserPick && !isKey) {
                                    bg = "#fef2f2";
                                    border = "1px solid #fca5a5";
                                    badgeTag = <span style={{ fontSize: 11, fontWeight: 700, color: "#dc2626" }}>✕ PILIHAN ANDA (SALAH)</span>;
                                  } else if (isKey && !isUserPick) {
                                    bg = "#fffbeb";
                                    border = "1px dashed #f59e0b";
                                    badgeTag = <span style={{ fontSize: 11, fontWeight: 700, color: "#92400e" }}>⚠️ HARUSNYA DIPILIH (KUNCI RESMI)</span>;
                                  }

                                  return (
                                    <div
                                      key={opt.id}
                                      style={{
                                        padding: "8px 12px",
                                        borderRadius: 6,
                                        fontSize: 12.5,
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                        backgroundColor: bg,
                                        border,
                                      }}
                                    >
                                      {item.tipe_soal === "pilihan_ganda_kompleks" ? (
                                        <div
                                          style={{
                                            width: 18,
                                            height: 18,
                                            borderRadius: 4,
                                            border: isUserPick ? "2px solid #15803d" : "1.5px solid #cbd5e1",
                                            backgroundColor: isUserPick ? "#15803d" : "#ffffff",
                                            color: "#ffffff",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            flexShrink: 0,
                                          }}
                                        >
                                          {isUserPick && <Check size={12} strokeWidth={3} />}
                                        </div>
                                      ) : null}
                                      <span style={{ fontWeight: 800, width: 20 }}>{opt.id.toUpperCase()}.</span>
                                      <div style={{ flex: 1 }}>
                                        <CbtContentRenderer
                                          content={opt.text}
                                          inline
                                          onImageClick={(src, alt) => setZoomImage({ src, title: alt || `Diagram Pilihan ${opt.id.toUpperCase()} - Soal ${item.nomor}` })}
                                        />
                                        {opt.img && (
                                          <div style={{ marginTop: 6 }}>
                                            <img
                                              src={opt.img}
                                              alt={`Pilihan ${opt.id}`}
                                              onClick={() => setZoomImage({ src: opt.img!, title: `Diagram Pilihan ${opt.id.toUpperCase()} - Soal ${item.nomor}` })}
                                              style={{
                                                maxHeight: 200,
                                                maxWidth: "100%",
                                                width: "auto",
                                                height: "auto",
                                                objectFit: "contain",
                                                borderRadius: 6,
                                                border: "1px solid #e1e7dd",
                                                cursor: "zoom-in",
                                              }}
                                              loading="lazy"
                                            />
                                          </div>
                                        )}
                                      </div>
                                      {badgeTag}
                                    </div>
                                  );
                                })}
                              </div>
                            ) : null}

                            <div style={{ display: "flex", justifyContent: "flex-end" }}>
                              <button
                                onClick={() => handleOpenDiagnosticPanel([item])}
                                style={{
                                  backgroundColor: "#18221f",
                                  color: "#c8f064",
                                  border: "none",
                                  borderRadius: 8,
                                  padding: "8px 14px",
                                  fontSize: 12,
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 6,
                                }}
                              >
                                <Sparkles size={14} />
                                <span>Bahas & Bedah Soal Nomor {item.nomor} bersama Nara AI</span>
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>

        {/* Dedicated AI Diagnostic Autopsy Panel */}
        {isDiagnosticModalOpen && typeof document !== "undefined" && createPortal(
          <div
            className="diagnostic-modal-backdrop"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: "100vw",
              height: "100vh",
              backgroundColor: "rgba(10, 15, 13, 0.78)",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
              zIndex: 99999,
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "center",
              padding: "24px 16px",
              overflowY: "auto",
              boxSizing: "border-box",
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget && !isLoadingDiagnostic) setIsDiagnosticModalOpen(false);
            }}
          >
            <div
              className="nara-autopsy-modal-content"
              style={{
                backgroundColor: "#ffffff",
                borderRadius: 20,
                border: "1px solid #dce2d6",
                padding: "24px 28px",
                maxWidth: 880,
                width: "100%",
                maxHeight: "calc(100vh - 48px)",
                display: "flex",
                flexDirection: "column",
                boxShadow: "0 25px 60px rgba(0,0,0,0.35)",
                position: "relative",
                margin: "auto",
                boxSizing: "border-box",
              }}
            >
              {/* Modal Header */}
              <div style={{ flexShrink: 0, display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, paddingBottom: 14, borderBottom: "1px solid #eef2eb" }}>
                <div>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 6, backgroundColor: "#f0fdf4", color: "#166534", border: "1px solid #86efac", padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, marginBottom: 8 }}>
                    <Sparkles size={12} color="#166534" />
                    <span>Nara Pedagogical Autopsy</span>
                  </div>
                  <h3 style={{ fontSize: 20, fontWeight: 800, color: "#18221f", margin: "0 0 4px 0" }}>
                    Laporan Bedah Diagnostik Kesalahan
                  </h3>
                  <p style={{ fontSize: 12.5, color: "#526350", margin: 0 }}>
                    Paket: {currentPackage?.subtes_or_mapel} ({currentPackage?.paket}) • Skor Akurasi: {reviewResult?.score_percent}%
                  </p>
                </div>
                
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {diagnosticData && !isLoadingDiagnostic && (
                    <>
                      <button
                        type="button"
                        onClick={handleCopyDiagnosticReport}
                        title="Salin seluruh isi laporan bedah diagnostik ke clipboard"
                        style={{
                          backgroundColor: isCopiedDiagnostic ? "#f0fdf4" : "#f8fafc",
                          color: isCopiedDiagnostic ? "#15803d" : "#334155",
                          border: isCopiedDiagnostic ? "1.5px solid #86efac" : "1px solid #cbd5e1",
                          borderRadius: 8,
                          padding: "6px 12px",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          transition: "all 0.15s ease",
                        }}
                      >
                        {isCopiedDiagnostic ? <Check size={13} color="#15803d" /> : <Copy size={13} />}
                        <span>{isCopiedDiagnostic ? "Tersalin!" : "Salin Laporan"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handlePrintDiagnosticReport}
                        title="Cetak atau simpan sebagai dokumen PDF"
                        style={{
                          backgroundColor: "#f8fafc",
                          color: "#334155",
                          border: "1px solid #cbd5e1",
                          borderRadius: 8,
                          padding: "6px 12px",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                        }}
                      >
                        <Printer size={13} />
                        <span>Cetak / PDF</span>
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => !isLoadingDiagnostic && setIsDiagnosticModalOpen(false)}
                    style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", padding: 4 }}
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {isLoadingDiagnostic ? (
                <div style={{ padding: "60px 20px", textAlign: "center", flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <RotateCcw size={32} className="animate-spin" style={{ color: "#15803d", margin: "0 auto 16px auto" }} />
                  <h4 style={{ fontSize: 16, fontWeight: 700, color: "#18221f", margin: "0 0 6px 0" }}>
                    Nara AI Sedang Membedah Kesalahan Anda...
                  </h4>
                  <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
                    Menganalisis butir salah berdasarkan 6 Pola Baku Pusmendik dan membongkar jebakan opsi.
                  </p>
                </div>
              ) : diagnosticError ? (
                <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: 18, color: "#991b1b", margin: "20px 0" }}>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>Gagal Memuat Diagnostik:</div>
                  <div style={{ fontSize: 13 }}>{diagnosticError}</div>
                  <button
                    onClick={() => handleOpenDiagnosticPanel()}
                    style={{ marginTop: 12, backgroundColor: "#991b1b", color: "#ffffff", border: "none", padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                  >
                    Coba Lagi
                  </button>
                </div>
              ) : diagnosticData ? (
                <div style={{ flex: 1, minHeight: 0, overflowY: "auto", paddingRight: 6, display: "flex", flexDirection: "column", gap: 18 }}>
                  {/* Executive Summary */}
                  <div style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 14, padding: "16px 20px" }}>
                    <div style={{ fontSize: 11.5, fontWeight: 800, color: "#15803d", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>
                      Ringkasan Evaluasi Kognitif
                    </div>
                    <div style={{ fontSize: 13.5, color: "#166534", margin: 0, lineHeight: 1.6, fontWeight: 600 }}>
                      <CbtContentRenderer content={diagnosticData.executiveSummary} />
                    </div>
                  </div>

                  {/* Weakness Patterns Bento */}
                  {Array.isArray(diagnosticData.weaknessPatterns) && diagnosticData.weaknessPatterns.length > 0 && (
                    <div>
                      <h4 style={{ fontSize: 14, fontWeight: 800, color: "#18221f", margin: "0 0 10px 0" }}>
                        Pola Soal yang Menjadi Titik Lemah:
                      </h4>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 10 }}>
                        {diagnosticData.weaknessPatterns.map((wp: any, idx: number) => (
                          <div key={idx} style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: 14 }}>
                            <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>
                              {wp.pola}
                            </div>
                            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6, lineHeight: 1.4 }}>
                              <strong>Gejala:</strong> <CbtContentRenderer inline content={wp.gejala} />
                            </div>
                            <div style={{ fontSize: 12, color: "#15803d", backgroundColor: "#dcfce7", padding: "4px 8px", borderRadius: 6, fontWeight: 600 }}>
                              💡 <strong>Tips Cepat:</strong> <CbtContentRenderer inline content={wp.tipsCepat} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Items Autopsy Breakdown */}
                  {Array.isArray(diagnosticData.items) && diagnosticData.items.length > 0 && (
                    <div>
                      <h4 style={{ fontSize: 14, fontWeight: 800, color: "#18221f", margin: "0 0 10px 0" }}>
                        Bedah Rinci Per Butir Soal yang Salah:
                      </h4>
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {diagnosticData.items.map((it: any, idx: number) => (
                          <div key={idx} style={{ backgroundColor: "#ffffff", border: "1px solid #e1e7dd", borderRadius: 14, padding: 18, boxShadow: "0 1px 4px rgba(0,0,0,0.02)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                              <span style={{ fontSize: 13, fontWeight: 800, color: "#18221f" }}>
                                Nomor {it.nomor} • <span style={{ color: "#4b6623" }}>{it.pola}</span>
                              </span>
                              <div style={{ display: "flex", gap: 8, fontSize: 12, fontWeight: 700, alignItems: "center" }}>
                                <span style={{ color: "#dc2626", backgroundColor: "#fee2e2", padding: "2px 8px", borderRadius: 6 }}>
                                  Pilihan Anda: {it.jawabanSiswa}
                                </span>
                                <span style={{ color: "#15803d", backgroundColor: "#dcfce7", padding: "2px 8px", borderRadius: 6, display: "inline-flex", alignItems: "center", gap: 4 }}>
                                  <span>Kunci:</span>
                                  <CbtContentRenderer inline content={it.kunciResmi} />
                                </span>
                              </div>
                            </div>
                            <div style={{ fontSize: 13, color: "#1e293b", marginBottom: 10, fontWeight: 600 }}>
                              <CbtContentRenderer inline content={it.pertanyaanRingkas} />
                            </div>
                            <div style={{ backgroundColor: "#f9fbf7", border: "1px solid #eef2eb", borderRadius: 8, padding: 10, fontSize: 12.5, color: "#334155", marginBottom: 8, lineHeight: 1.5 }}>
                              <strong>Bukti Teks Wacana:</strong> <CbtContentRenderer inline content={it.buktiTeks} />
                            </div>
                            <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: 10, fontSize: 12.5, color: "#991b1b", lineHeight: 1.5 }}>
                              <strong>Bongkar Jebakan:</strong> <CbtContentRenderer inline content={it.analisisJebakan} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Plan */}
                  {Array.isArray(diagnosticData.actionPlan) && diagnosticData.actionPlan.length > 0 && (
                    <div style={{ backgroundColor: "#fafaf9", border: "1px solid #e7e5e4", borderRadius: 14, padding: 16 }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: "#44403c", textTransform: "uppercase", marginBottom: 8 }}>
                        Rekomendasi Tindakan Sesi Berikutnya:
                      </div>
                      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: "#57534e", lineHeight: 1.6 }}>
                        {diagnosticData.actionPlan.map((act: string, idx: number) => (
                          <li key={idx}><strong>{act}</strong></li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : null}

              {/* Modal Footer Actions */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24, paddingTop: 16, borderTop: "1px solid #eef2eb" }}>
                <button
                  type="button"
                  onClick={() => setIsDiagnosticModalOpen(false)}
                  style={{
                    backgroundColor: "#ffffff",
                    color: "#526350",
                    border: "1px solid #dce2d6",
                    borderRadius: 10,
                    padding: "10px 18px",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Tutup Laporan
                </button>
                <button
                  type="button"
                  onClick={handleRetryWrongQuestions}
                  style={{
                    backgroundColor: "#18221f",
                    color: "#c8f064",
                    border: "none",
                    borderRadius: 10,
                    padding: "10px 22px",
                    fontWeight: 800,
                    fontSize: 13.5,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                  }}
                >
                  <RotateCcw size={15} />
                  <span>Latih Ulang Soal yang Salah</span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

        <ImageLightboxModal image={zoomImage} onClose={() => setZoomImage(null)} />
      </div>
    );
  }

  return null;
});
