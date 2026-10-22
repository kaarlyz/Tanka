import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  BookOpen,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Check,
  AlertTriangle,
  Zap,
  Target,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  Layers,
  Search,
  ExternalLink,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { MathView } from "../common/MathView";
import { QuizQuestion } from "../../types";

export interface ExamDrillViewProps {
  docId: string;
  docTitle: string;
  questions: QuizQuestion[];
  onGenerateTopic?: (topic: string) => void;
  onOpenQuiz?: () => void;
}

export const ExamDrillView = React.memo(function ExamDrillView({
  docId,
  docTitle,
  questions,
  onGenerateTopic,
  onOpenQuiz
}: ExamDrillViewProps) {
  const [expandedIds, setExpandedIds] = useState<Record<string | number, boolean>>({});
  const [selectedSubtes, setSelectedSubtes] = useState<string>("all");
  const [activeQuestionId, setActiveQuestionId] = useState<string | number | null>(null);
  const [pendingTopic, setPendingTopic] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"bento" | "list">("bento");
  const itemRefs = useRef<Record<string | number, HTMLDivElement | null>>({});
  const horizontalRailRef = useRef<HTMLDivElement | null>(null);
  const activePillRef = useRef<HTMLButtonElement | null>(null);

  // Default active question to first item on mount
  useEffect(() => {
    if (activeQuestionId === null && questions.length > 0 && questions[0]?.id !== undefined) {
      setActiveQuestionId(questions[0].id);
      setExpandedIds((prev) => ({ ...prev, [questions[0].id!]: true }));
    }
  }, [questions, activeQuestionId]);

  // Auto-expand and scroll if URL hash contains #soal-X or on mount
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash && hash.startsWith("#soal-")) {
        const rawId = hash.replace("#soal-", "");
        const targetQ = questions.find((q) => String(q.id) === rawId);
        if (targetQ && targetQ.id !== undefined) {
          setExpandedIds((prev) => ({ ...prev, [targetQ.id!]: true }));
          setActiveQuestionId(targetQ.id);
          setTimeout(() => {
            const el = itemRefs.current[targetQ.id!];
            if (el) {
              el.scrollIntoView({ behavior: "smooth", block: "center" });
            }
          }, 150);
        }
      }
    };

    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, [questions]);

  // Expand all / Collapse all toggle
  const allExpanded = useMemo(() => {
    return questions.length > 0 && questions.every((q) => q.id !== undefined && expandedIds[q.id]);
  }, [questions, expandedIds]);

  const toggleAll = () => {
    const next: Record<string | number, boolean> = {};
    const targetState = !allExpanded;
    questions.forEach((q) => {
      if (q.id !== undefined) next[q.id] = targetState;
    });
    setExpandedIds(next);
  };

  const toggleItem = (id: string | number) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleGenerate = (topic: string) => {
    if (pendingTopic || !onGenerateTopic) return;
    const clean = topic.replace(/\$[^$]*\$/g, (m) => m.replace(/\$/g, "")).split(":")[0].trim();
    setPendingTopic(clean);
    onGenerateTopic(clean || topic);
    setTimeout(() => setPendingTopic(null), 120000);
  };

  // Subtes list
  const subtesList = useMemo(() => {
    const set = new Set<string>();
    questions.forEach((q) => {
      if (q.subtes) set.add(q.subtes);
    });
    return Array.from(set);
  }, [questions]);

  // Extracted unique concepts
  const keyConcepts = useMemo(() => {
    const items: Array<{ concept: string; questionId?: string | number }> = [];
    const seen = new Set<string>();
    questions.forEach((q) => {
      if (q.formula) {
        const parts = q.formula.split(/[;\n]/).map((p) => p.trim()).filter(Boolean);
        parts.forEach((p) => {
          const lower = p.toLowerCase();
          if (!seen.has(lower)) {
            seen.add(lower);
            items.push({ concept: p, questionId: q.id });
          }
        });
      }
    });
    return items;
  }, [questions]);

  // Extracted pitfalls
  const pitfallsList = useMemo(() => {
    return questions
      .filter((q) => Boolean(q.pitfall && q.pitfall.trim()))
      .map((q) => ({ id: q.id, pitfall: q.pitfall!, subtes: q.subtes }));
  }, [questions]);

  // Filtered questions
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      if (selectedSubtes !== "all" && q.subtes !== selectedSubtes) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const text = `${q.question} ${q.stimulus || ""} ${q.formula || ""} ${q.explanation || ""}`.toLowerCase();
        if (!text.includes(query)) return false;
      }
      return true;
    });
  }, [questions, selectedSubtes, searchQuery]);

  const activeIndex = useMemo(() => {
    const idx = filteredQuestions.findIndex((q) => q.id === activeQuestionId);
    return idx >= 0 ? idx : 0;
  }, [filteredQuestions, activeQuestionId]);

  const currentQ = filteredQuestions[activeIndex] || filteredQuestions[0];

  // Auto-scroll the horizontal rail to active question chip
  useEffect(() => {
    if (activePillRef.current && horizontalRailRef.current) {
      activePillRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center"
      });
    }
  }, [activeQuestionId]);

  // Arrow key navigation (Left/Right) in Bento Mode
  useEffect(() => {
    if (viewMode !== "bento") return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowLeft" && activeIndex > 0) {
        const prevQ = filteredQuestions[activeIndex - 1];
        if (prevQ && prevQ.id !== undefined) {
          setActiveQuestionId(prevQ.id);
          setExpandedIds((prev) => ({ ...prev, [prevQ.id!]: true }));
        }
      } else if (e.key === "ArrowRight" && activeIndex < filteredQuestions.length - 1) {
        const nextQ = filteredQuestions[activeIndex + 1];
        if (nextQ && nextQ.id !== undefined) {
          setActiveQuestionId(nextQ.id);
          setExpandedIds((prev) => ({ ...prev, [nextQ.id!]: true }));
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [viewMode, activeIndex, filteredQuestions]);

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "16px 8px 60px" }}>
      {/* Top Banner: Study Guide & Bedah Kisi-Kisi */}
      <div
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid #dce2da",
          borderRadius: 14,
          padding: "20px 24px",
          marginBottom: 16,
          boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span
                style={{
                  backgroundColor: "#eef8db",
                  color: "#3f6212",
                  fontSize: 11,
                  fontWeight: 800,
                  padding: "3px 9px",
                  borderRadius: 6,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4
                }}
              >
                <Target size={12} strokeWidth={2.5} />
                Study Guide & Bedah Kisi-Kisi
              </span>
              <span
                style={{
                  backgroundColor: "#f4f6f1",
                  color: "#56615d",
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "3px 8px",
                  borderRadius: 6
                }}
              >
                {questions.length} Butir Soal Terurai
              </span>
            </div>
            <h1 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 800, color: "#17201d", lineHeight: 1.3 }}>
              {docTitle}
            </h1>
            <p style={{ margin: 0, fontSize: 13, color: "#56615d", lineHeight: 1.5 }}>
              Dokumen ini telah dibedah menyeluruh melalui verifikasi jawaban multi-vote, ringkasan konsep kunci,
              analisis opsi pengecoh, dan trik cepat per nomor.
            </p>
          </div>

          {onOpenQuiz && (
            <button
              type="button"
              onClick={onOpenQuiz}
              style={{
                backgroundColor: "#18221f",
                color: "#c8f064",
                border: "none",
                borderRadius: 9,
                padding: "10px 18px",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                boxShadow: "0 4px 12px rgba(24,34,31,0.15)"
              }}
            >
              <Zap size={14} />
              <span>Uji Tryout Soal Ini</span>
            </button>
          )}
        </div>

        {/* Quick Question Number Matrix Navigator */}
        <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid #edf0ec" }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: "#6f7975", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>Lompat ke Nomor Soal:</span>
            <button
              type="button"
              onClick={toggleAll}
              style={{
                background: "none",
                border: "none",
                color: "#4b6623",
                fontSize: 11.5,
                fontWeight: 700,
                cursor: "pointer",
                padding: "2px 6px"
              }}
            >
              {allExpanded ? "Tutup Semua Pembahasan" : "Buka Semua Pembahasan"}
            </button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {questions.map((q) => {
              const isSelected = activeQuestionId === q.id;
              const hasPitfall = Boolean(q.pitfall);
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => {
                    if (q.id !== undefined) {
                      setExpandedIds((prev) => ({ ...prev, [q.id!]: true }));
                      setActiveQuestionId(q.id);
                      itemRefs.current[q.id]?.scrollIntoView({ behavior: "smooth", block: "center" });
                    }
                  }}
                  title={`Soal ${q.id}: ${q.subtes || "Umum"} (${q.tingkat || "sedang"})`}
                  style={{
                    minWidth: 32,
                    height: 30,
                    padding: "0 6px",
                    borderRadius: 6,
                    border: isSelected ? "1.5px solid #18221f" : "1px solid #dce2da",
                    backgroundColor: isSelected ? "#18221f" : "#fafbf8",
                    color: isSelected ? "#c8f064" : "#17201d",
                    fontSize: 11.5,
                    fontWeight: isSelected ? 800 : 600,
                    cursor: "pointer",
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.12s ease"
                  }}
                >
                  {q.id}
                  {hasPitfall && !isSelected && (
                    <span
                      style={{
                        position: "absolute",
                        top: 2,
                        right: 2,
                        width: 4,
                        height: 4,
                        borderRadius: "50%",
                        backgroundColor: "#c2410c"
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Section 1: Ringkasan Rumus & Konsep Kunci */}
      {keyConcepts.length > 0 && (
        <div
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #dce2da",
            borderRadius: 12,
            padding: "16px 20px",
            marginBottom: 16
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Sparkles size={16} color="#4b6623" />
            <h2 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#17201d", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Ringkasan Rumus & Konsep Kunci yang Diuji
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
            {keyConcepts.map((item, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: "#fafbf8",
                  border: "1px solid #e2e7df",
                  borderRadius: 8,
                  padding: "10px 12px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: 8
                }}
              >
                <div style={{ fontSize: 12.5, color: "#17201d", lineHeight: 1.45 }}>
                  <MathView text={item.concept} />
                </div>
                {onGenerateTopic && (
                  <button
                    type="button"
                    onClick={() => handleGenerate(item.concept)}
                    disabled={pendingTopic !== null}
                    style={{
                      alignSelf: "flex-start",
                      background: "none",
                      border: "1px dashed #a3b899",
                      borderRadius: 6,
                      color: "#3f6212",
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "3px 8px",
                      cursor: pendingTopic ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 4
                    }}
                  >
                    <BookOpen size={11} />
                    <span>{pendingTopic === item.concept ? "Menyusun materi..." : "Buat Modul dari Topik Ini"}</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section 2: Radar Jebakan Umum & Pola Pengecoh */}
      {pitfallsList.length > 0 && (
        <div
          style={{
            backgroundColor: "#fffdf9",
            border: "1px solid #fed7aa",
            borderRadius: 12,
            padding: "16px 20px",
            marginBottom: 20
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <AlertTriangle size={16} color="#c2410c" />
            <h2 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#9a3412", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Radar Jebakan & Pola Pengecoh Soal ({pitfallsList.length})
            </h2>
          </div>
          <p style={{ margin: "0 0 12px", fontSize: 12, color: "#7c2d12" }}>
            Pengecoh khas pembuat soal ujian yang sering memicu salah hitung atau salah interpretasi konsep:
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {pitfallsList.slice(0, 6).map((item) => (
              <div
                key={item.id}
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #ffedd5",
                  borderRadius: 8,
                  padding: "8px 12px",
                  fontSize: 12.5,
                  color: "#431407",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                  lineHeight: 1.45
                }}
              >
                <span style={{ fontWeight: 800, color: "#c2410c", flexShrink: 0 }}>Soal {item.id}:</span>
                <div style={{ flex: 1 }}>
                  <MathView text={item.pitfall} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter, Search & View Mode Bar */}
      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <button
            type="button"
            onClick={() => setSelectedSubtes("all")}
            style={{
              padding: "5px 11px",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              border: selectedSubtes === "all" ? "1px solid #18221f" : "1px solid #dce2da",
              backgroundColor: selectedSubtes === "all" ? "#18221f" : "#ffffff",
              color: selectedSubtes === "all" ? "#c8f064" : "#45544e"
            }}
          >
            Semua Subtes ({questions.length})
          </button>
          {subtesList.map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setSelectedSubtes(st)}
              style={{
                padding: "5px 11px",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                border: selectedSubtes === st ? "1px solid #18221f" : "1px solid #dce2da",
                backgroundColor: selectedSubtes === st ? "#18221f" : "#ffffff",
                color: selectedSubtes === st ? "#c8f064" : "#45544e",
                textTransform: "capitalize"
              }}
            >
              {st.replace(/_/g, " ")}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flex: "1 1 280px" }}>
          <div style={{ flex: 1, minWidth: 160, position: "relative" }}>
            <input
              type="text"
              placeholder="Cari kata kunci soal, materi, rumus..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                backgroundColor: "#ffffff",
                border: "1px solid #dce2da",
                borderRadius: 6,
                padding: "6px 10px 6px 30px",
                fontSize: 12,
                color: "#17201d",
                outline: "none"
              }}
            />
            <Search size={14} color="#78857f" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
          </div>

          {/* View Mode Switcher */}
          <div style={{ display: "flex", alignItems: "center", backgroundColor: "#f0f3ed", padding: 2, borderRadius: 8, border: "1px solid #dce2da", flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => setViewMode("bento")}
              title="Mode Bento Fokus: Belajar per nomor tanpa lelah scroll vertikal"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "5px 10px",
                borderRadius: 6,
                border: "none",
                fontSize: 11.5,
                fontWeight: 700,
                cursor: "pointer",
                backgroundColor: viewMode === "bento" ? "#ffffff" : "transparent",
                color: viewMode === "bento" ? "#18221f" : "#60706a",
                boxShadow: viewMode === "bento" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                transition: "all 0.15s ease"
              }}
            >
              <LayoutGrid size={13} />
              <span>Bento</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              title="Mode Daftar: Lihat seluruh butir soal bergulir ke bawah"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "5px 10px",
                borderRadius: 6,
                border: "none",
                fontSize: 11.5,
                fontWeight: 700,
                cursor: "pointer",
                backgroundColor: viewMode === "list" ? "#ffffff" : "transparent",
                color: viewMode === "list" ? "#18221f" : "#60706a",
                boxShadow: viewMode === "list" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                transition: "all 0.15s ease"
              }}
            >
              <List size={13} />
              <span>Daftar</span>
            </button>
          </div>
        </div>
      </div>

      {/* VIEW MODE: BENTO GRID FOKUS */}
      {viewMode === "bento" ? (
        filteredQuestions.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#6f7975", backgroundColor: "#ffffff", borderRadius: 12, border: "1px solid #dce2da" }}>
            Tidak ada butir soal yang cocok dengan filter atau pencarian Anda.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Horizontal Question Stepper Rail */}
            <div
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #dce2da",
                borderRadius: 12,
                padding: "8px 12px",
                display: "flex",
                alignItems: "center",
                gap: 8,
                boxShadow: "0 2px 6px rgba(0,0,0,0.02)"
              }}
            >
              <button
                type="button"
                disabled={activeIndex <= 0}
                onClick={() => {
                  if (activeIndex > 0) {
                    const prevQ = filteredQuestions[activeIndex - 1];
                    if (prevQ && prevQ.id !== undefined) {
                      setActiveQuestionId(prevQ.id);
                      setExpandedIds((prev) => ({ ...prev, [prevQ.id!]: true }));
                    }
                  }
                }}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border: "1px solid #dce2da",
                  backgroundColor: activeIndex <= 0 ? "#f4f6f1" : "#fafbf8",
                  color: activeIndex <= 0 ? "#a5b0aa" : "#17201d",
                  cursor: activeIndex <= 0 ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0
                }}
                title="Soal Sebelumnya (Panah Kiri)"
              >
                <ChevronLeft size={16} />
              </button>

              <div
                ref={horizontalRailRef}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  overflowX: "auto",
                  scrollbarWidth: "none",
                  padding: "4px 2px"
                }}
              >
                {filteredQuestions.map((q, idx) => {
                  const isSelected = q.id === currentQ?.id;
                  const hasVisual = q.has_visual || Boolean(q.imageUrl);
                  const hasPitfall = Boolean(q.pitfall);
                  return (
                    <button
                      key={q.id}
                      ref={isSelected ? activePillRef : null}
                      type="button"
                      onClick={() => {
                        if (q.id !== undefined) {
                          setActiveQuestionId(q.id);
                          setExpandedIds((prev) => ({ ...prev, [q.id!]: true }));
                        }
                      }}
                      style={{
                        padding: "5px 11px",
                        borderRadius: 7,
                        border: isSelected ? "1.5px solid #18221f" : "1px solid #dce2da",
                        backgroundColor: isSelected ? "#18221f" : "#fafbf8",
                        color: isSelected ? "#c8f064" : "#17201d",
                        fontSize: 12,
                        fontWeight: isSelected ? 800 : 600,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                        transition: "all 0.15s ease",
                        boxShadow: isSelected ? "0 2px 8px rgba(24,34,31,0.2)" : "none",
                        position: "relative"
                      }}
                    >
                      <span>#{q.id}</span>
                      {hasVisual && (
                        <ImageIcon size={11} color={isSelected ? "#c8f064" : "#b45309"} />
                      )}
                      {hasPitfall && !isSelected && (
                        <span style={{ width: 4, height: 4, borderRadius: "50%", backgroundColor: "#c2410c" }} />
                      )}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                disabled={activeIndex >= filteredQuestions.length - 1}
                onClick={() => {
                  if (activeIndex < filteredQuestions.length - 1) {
                    const nextQ = filteredQuestions[activeIndex + 1];
                    if (nextQ && nextQ.id !== undefined) {
                      setActiveQuestionId(nextQ.id);
                      setExpandedIds((prev) => ({ ...prev, [nextQ.id!]: true }));
                    }
                  }
                }}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border: "1px solid #dce2da",
                  backgroundColor: activeIndex >= filteredQuestions.length - 1 ? "#f4f6f1" : "#fafbf8",
                  color: activeIndex >= filteredQuestions.length - 1 ? "#a5b0aa" : "#17201d",
                  cursor: activeIndex >= filteredQuestions.length - 1 ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0
                }}
                title="Soal Berikutnya (Panah Kanan)"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Bento Grid 2-Column Board */}
            {currentQ && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 420px), 1fr))",
                  gap: 16,
                  alignItems: "stretch"
                }}
              >
                {/* Bento Card Kiri: Stimulus & Lembar Soal */}
                <div
                  style={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #dce2da",
                    borderRadius: 14,
                    overflow: "hidden",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                    display: "flex",
                    flexDirection: "column"
                  }}
                >
                  {/* Header Bar */}
                  <div
                    style={{
                      padding: "12px 18px",
                      backgroundColor: "#fafbf8",
                      borderBottom: "1px solid #edf0ec",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                      flexWrap: "wrap"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span
                        style={{
                          backgroundColor: "#18221f",
                          color: "#c8f064",
                          fontSize: 12.5,
                          fontWeight: 800,
                          padding: "3px 9px",
                          borderRadius: 6
                        }}
                      >
                        Soal #{currentQ.id}
                      </span>
                      {currentQ.subtes && (
                        <span
                          style={{
                            backgroundColor: "#edf4fc",
                            color: "#0369a1",
                            fontSize: 11,
                            fontWeight: 700,
                            padding: "3px 8px",
                            borderRadius: 6
                          }}
                        >
                          {currentQ.subtes.replace(/_/g, " ")}
                        </span>
                      )}
                      {currentQ.tingkat && (
                        <span
                          style={{
                            backgroundColor: currentQ.tingkat === "sulit" ? "#fee2e2" : currentQ.tingkat === "mudah" ? "#dcfce7" : "#fef3c7",
                            color: currentQ.tingkat === "sulit" ? "#991b1b" : currentQ.tingkat === "mudah" ? "#166534" : "#92400e",
                            fontSize: 10.5,
                            fontWeight: 700,
                            padding: "2px 6px",
                            borderRadius: 4,
                            textTransform: "uppercase"
                          }}
                        >
                          {currentQ.tingkat}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: 11.5, color: "#60706a", fontWeight: 700 }}>
                      {activeIndex + 1} / {filteredQuestions.length}
                    </span>
                  </div>

                  {/* Body Soal & Gambar */}
                  <div style={{ padding: "18px 20px", flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
                    {currentQ.stimulus && (
                      <div
                        style={{
                          borderLeft: "3px solid #779f2f",
                          backgroundColor: "#f9faf6",
                          padding: "10px 14px",
                          borderRadius: "0 8px 8px 0",
                          fontSize: 12.5,
                          color: "#45544e",
                          lineHeight: 1.55
                        }}
                      >
                        <MathView text={currentQ.stimulus} />
                      </div>
                    )}

                    {currentQ.imageUrl && (
                      <div style={{ textAlign: "center", borderRadius: 10, overflow: "hidden", border: "1px solid #dce2da", backgroundColor: "#fafbf8", padding: 8 }}>
                        <img
                          src={currentQ.imageUrl}
                          alt={currentQ.imageCaption || `Ilustrasi Soal ${currentQ.id}`}
                          style={{ width: "100%", maxHeight: 380, objectFit: "contain" }}
                        />
                        {currentQ.imageCaption && (
                          <div style={{ fontSize: 11, color: "#6f7975", marginTop: 4, fontStyle: "italic" }}>
                            {currentQ.imageCaption}
                          </div>
                        )}
                      </div>
                    )}

                    {currentQ.has_visual && !currentQ.imageUrl && (
                      <div
                        style={{
                          backgroundColor: "#fffbeb",
                          border: "1px solid #fef3c7",
                          borderRadius: 6,
                          padding: "6px 10px",
                          fontSize: 11.5,
                          color: "#92400e"
                        }}
                      >
                        ⚠️ Soal ini merujuk grafik/gambar pada dokumen asli yang tidak terkonversi digital.
                      </div>
                    )}

                    <div style={{ fontSize: 14.5, fontWeight: 700, color: "#17201d", lineHeight: 1.6 }}>
                      <MathView text={currentQ.question} />
                    </div>
                  </div>
                </div>

                {/* Bento Card Kanan: Lembar Interaksi & Bedah Solusi */}
                <div
                  style={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #dce2da",
                    borderRadius: 14,
                    overflow: "hidden",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                    display: "flex",
                    flexDirection: "column"
                  }}
                >
                  <div
                    style={{
                      padding: "12px 18px",
                      backgroundColor: "#fafbf8",
                      borderBottom: "1px solid #edf0ec",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between"
                    }}
                  >
                    <span style={{ fontSize: 11.5, fontWeight: 800, color: "#18221f", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      Pilihan Jawaban & Kunci
                    </span>
                    {currentQ.questionType === "kategori" && (
                      <span style={{ backgroundColor: "#fef3c7", color: "#92400e", fontSize: 10.5, fontWeight: 700, padding: "2px 6px", borderRadius: 4 }}>
                        Kategori (Benar/Salah)
                      </span>
                    )}
                    {currentQ.questionType === "multiple" && (
                      <span style={{ backgroundColor: "#e0f2fe", color: "#0369a1", fontSize: 10.5, fontWeight: 700, padding: "2px 6px", borderRadius: 4 }}>
                        Pilgan Kompleks
                      </span>
                    )}
                  </div>

                  <div style={{ padding: "18px 20px", flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
                    {/* Opsi / Kategori */}
                    {currentQ.questionType === "kategori" && Array.isArray(currentQ.matrixStatements) && currentQ.matrixStatements.length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 90px", padding: "8px 12px", backgroundColor: "#18221f", color: "#c8f064", borderRadius: 6, fontSize: 11, fontWeight: 800 }}>
                          <span>PERNYATAAN</span>
                          <span style={{ textAlign: "center" }}>KUNCI</span>
                        </div>
                        {currentQ.matrixStatements.map((stmt, sIdx) => (
                          <div key={sIdx} style={{ display: "grid", gridTemplateColumns: "1fr 90px", alignItems: "center", padding: "8px 12px", borderRadius: 6, backgroundColor: "#fafbf8", border: "1px solid #e5e9e2", gap: 8 }}>
                            <div style={{ fontSize: 12.5, color: "#374151", lineHeight: 1.45 }}>
                              <MathView text={stmt.statement} />
                            </div>
                            <div style={{ textAlign: "center" }}>
                              <span style={{ padding: "3px 8px", borderRadius: 4, fontSize: 11, fontWeight: 800, backgroundColor: stmt.correctAnswer === "BENAR" ? "#dcfce7" : "#fee2e2", color: stmt.correctAnswer === "BENAR" ? "#166534" : "#991b1b", border: `1px solid ${stmt.correctAnswer === "BENAR" ? "#86efac" : "#fca5a5"}` }}>
                                {stmt.correctAnswer}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                        {currentQ.options.map((opt, oIdx) => {
                          const correctIndices = currentQ.correctIndices || [currentQ.correctIndex ?? 0];
                          const isCorrect = correctIndices.includes(oIdx);
                          const letter = String.fromCharCode(65 + oIdx);
                          const optText = opt.replace(/^[A-E]\.\s*/i, "");

                          return (
                            <div
                              key={oIdx}
                              style={{
                                display: "flex",
                                alignItems: "flex-start",
                                gap: 10,
                                padding: "8px 12px",
                                borderRadius: 8,
                                backgroundColor: isCorrect ? "#f0fdf4" : "#fafbf8",
                                border: isCorrect ? "1.5px solid #86efac" : "1px solid #e5e9e2"
                              }}
                            >
                              <span
                                style={{
                                  width: 22,
                                  height: 22,
                                  borderRadius: 4,
                                  backgroundColor: isCorrect ? "#166534" : "#e5e9e2",
                                  color: isCorrect ? "#ffffff" : "#45544e",
                                  fontSize: 11,
                                  fontWeight: 800,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                  marginTop: 1
                                }}
                              >
                                {letter}
                              </span>
                              <div style={{ flex: 1, fontSize: 13, color: isCorrect ? "#14532d" : "#374151", fontWeight: isCorrect ? 600 : 400, lineHeight: 1.45 }}>
                                <MathView text={optText} />
                              </div>
                              {isCorrect && (
                                <span style={{ backgroundColor: "#dcfce7", color: "#166534", fontSize: 10.5, fontWeight: 800, padding: "2px 6px", borderRadius: 4, display: "flex", alignItems: "center", gap: 3, flexShrink: 0 }}>
                                  <Check size={11} strokeWidth={3} /> Kunci
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Pembahasan & Solusi */}
                    {currentQ.explanation && (
                      <div style={{ marginTop: 6, padding: "12px 14px", borderRadius: 8, backgroundColor: "#fafbf8", border: "1px solid #e2e8df" }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: "#18221f", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>
                          📝 Langkah Penyelesaian
                        </div>
                        <div style={{ fontSize: 13, color: "#27312e", lineHeight: 1.6, whiteSpace: "pre-line" }}>
                          <MathView text={currentQ.explanation} />
                        </div>
                      </div>
                    )}

                    {/* Konsep Kunci */}
                    {currentQ.formula && (
                      <div style={{ padding: "10px 14px", borderRadius: 8, backgroundColor: "#fbfdf8", border: "1px solid #dce8d5" }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: "#4b6623", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>
                          📌 Konsep Kunci & Rumus
                        </div>
                        <div style={{ fontSize: 12.5, color: "#17201d", lineHeight: 1.5 }}>
                          <MathView text={currentQ.formula} />
                        </div>
                        {onGenerateTopic && (
                          <button
                            type="button"
                            onClick={() => handleGenerate(currentQ.formula!)}
                            disabled={pendingTopic !== null}
                            style={{
                              marginTop: 6,
                              background: "none",
                              border: "none",
                              color: "#3f6212",
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: "pointer",
                              padding: 0,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4
                            }}
                          >
                            <Sparkles size={11} />
                            <span>Buat modul teori dari konsep ini →</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Trik Cepat */}
                    {currentQ.trik_cepat && (
                      <div style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "10px 12px", display: "flex", alignItems: "flex-start", gap: 8 }}>
                        <Zap size={15} color="#16a34a" style={{ flexShrink: 0, marginTop: 2 }} />
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 800, color: "#15803d", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                            Trik Cepat & Shortcut
                          </div>
                          <div style={{ fontSize: 12, color: "#166534", marginTop: 2, lineHeight: 1.45 }}>
                            <MathView text={currentQ.trik_cepat} />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Radar Jebakan */}
                    {currentQ.pitfall && (
                      <div style={{ backgroundColor: "#fffdf9", border: "1px solid #fed7aa", borderRadius: 8, padding: "10px 12px", display: "flex", alignItems: "flex-start", gap: 8 }}>
                        <AlertTriangle size={15} color="#ea580c" style={{ flexShrink: 0, marginTop: 2 }} />
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 800, color: "#c2410c", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                            Jebakan & Kesalahan Umum
                          </div>
                          <div style={{ fontSize: 12, color: "#9a3412", marginTop: 2, lineHeight: 1.45 }}>
                            <MathView text={currentQ.pitfall} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Floating Stepper Bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: "#ffffff",
                border: "1px solid #dce2da",
                borderRadius: 12,
                padding: "12px 18px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                flexWrap: "wrap",
                gap: 10
              }}
            >
              <button
                type="button"
                disabled={activeIndex <= 0}
                onClick={() => {
                  if (activeIndex > 0) {
                    const prevQ = filteredQuestions[activeIndex - 1];
                    if (prevQ && prevQ.id !== undefined) {
                      setActiveQuestionId(prevQ.id);
                      setExpandedIds((prev) => ({ ...prev, [prevQ.id!]: true }));
                    }
                  }
                }}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: "1px solid #dce2da",
                  backgroundColor: activeIndex <= 0 ? "#f4f6f1" : "#fafbf8",
                  color: activeIndex <= 0 ? "#a5b0aa" : "#17201d",
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: activeIndex <= 0 ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                <ChevronLeft size={16} />
                <span>Soal Sebelumnya</span>
              </button>

              <div style={{ textAlign: "center", fontSize: 12, color: "#60706a", fontWeight: 700 }}>
                Soal {activeIndex + 1} dari {filteredQuestions.length} • Tombol <kbd style={{ padding: "2px 5px", background: "#f0f2ed", borderRadius: 4, border: "1px solid #dce2da" }}>←</kbd> <kbd style={{ padding: "2px 5px", background: "#f0f2ed", borderRadius: 4, border: "1px solid #dce2da" }}>→</kbd>
              </div>

              <button
                type="button"
                disabled={activeIndex >= filteredQuestions.length - 1}
                onClick={() => {
                  if (activeIndex < filteredQuestions.length - 1) {
                    const nextQ = filteredQuestions[activeIndex + 1];
                    if (nextQ && nextQ.id !== undefined) {
                      setActiveQuestionId(nextQ.id);
                      setExpandedIds((prev) => ({ ...prev, [nextQ.id!]: true }));
                    }
                  }
                }}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: "none",
                  backgroundColor: activeIndex >= filteredQuestions.length - 1 ? "#dce2da" : "#18221f",
                  color: activeIndex >= filteredQuestions.length - 1 ? "#a5b0aa" : "#c8f064",
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: activeIndex >= filteredQuestions.length - 1 ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                <span>Soal Berikutnya</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )
      ) : (
      /* VIEW MODE: DAFTAR VERTIKAL PENUH */
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {filteredQuestions.map((q) => {
          const isExpanded = q.id !== undefined && Boolean(expandedIds[q.id]);
          const correctIdx = q.correctIndex ?? 0;
          const correctIndices = q.correctIndices || [correctIdx];
          const hasVisual = q.has_visual || Boolean(q.imageUrl);

          return (
            <div
              key={q.id}
              ref={(el) => {
                if (q.id !== undefined) itemRefs.current[q.id] = el;
              }}
              id={`soal-${q.id}`}
              style={{
                backgroundColor: "#ffffff",
                border: activeQuestionId === q.id ? "2px solid #566b36" : "1px solid #dce2da",
                borderRadius: 12,
                overflow: "hidden",
                boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                transition: "border-color 0.2s ease"
              }}
            >
              {/* Card Header Bar */}
              <div
                style={{
                  padding: "12px 18px",
                  backgroundColor: "#fafbf8",
                  borderBottom: "1px solid #edf0ec",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                  flexWrap: "wrap"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 6,
                      backgroundColor: "#18221f",
                      color: "#c8f064",
                      fontSize: 12,
                      fontWeight: 800,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    {q.id}
                  </span>
                  {q.subtes && (
                    <span
                      style={{
                        backgroundColor: "#edf4fc",
                        color: "#0369a1",
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "2px 7px",
                        borderRadius: 4,
                        textTransform: "capitalize"
                      }}
                    >
                      {q.subtes.replace(/_/g, " ")}
                    </span>
                  )}
                  {q.tingkat && (
                    <span
                      style={{
                        backgroundColor: q.tingkat === "sulit" ? "#fee2e2" : q.tingkat === "mudah" ? "#dcfce7" : "#fef3c7",
                        color: q.tingkat === "sulit" ? "#991b1b" : q.tingkat === "mudah" ? "#166534" : "#92400e",
                        fontSize: 10.5,
                        fontWeight: 700,
                        padding: "2px 6px",
                        borderRadius: 4,
                        textTransform: "uppercase"
                      }}
                    >
                      {q.tingkat}
                    </span>
                  )}
                  {q.estimasi_detik && (
                    <span style={{ fontSize: 11, color: "#6f7975", display: "flex", alignItems: "center", gap: 3 }}>
                      <Clock size={11} /> ~{q.estimasi_detik}s
                    </span>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {hasVisual && (
                    <span
                      style={{
                        backgroundColor: "#fef3c7",
                        color: "#92400e",
                        fontSize: 10.5,
                        fontWeight: 700,
                        padding: "2px 6px",
                        borderRadius: 4,
                        display: "flex",
                        alignItems: "center",
                        gap: 3
                      }}
                    >
                      <ImageIcon size={11} /> Visual
                    </span>
                  )}
                  {q.questionType === "kategori" && (
                    <span
                      style={{
                        backgroundColor: "#fef3c7",
                        color: "#92400e",
                        fontSize: 10.5,
                        fontWeight: 700,
                        padding: "2px 6px",
                        borderRadius: 4
                      }}
                    >
                      Kategori (Benar/Salah)
                    </span>
                  )}
                  {q.questionType === "multiple" && (
                    <span
                      style={{
                        backgroundColor: "#e0f2fe",
                        color: "#0369a1",
                        fontSize: 10.5,
                        fontWeight: 700,
                        padding: "2px 6px",
                        borderRadius: 4
                      }}
                    >
                      Pilgan Kompleks
                    </span>
                  )}
                </div>
              </div>

              {/* Card Body */}
              <div style={{ padding: "16px 20px" }}>
                {/* Stimulus Bacaan */}
                {q.stimulus && (
                  <div
                    style={{
                      borderLeft: "3px solid #779f2f",
                      backgroundColor: "#f9faf6",
                      padding: "10px 14px",
                      borderRadius: "0 8px 8px 0",
                      fontSize: 12.5,
                      color: "#45544e",
                      lineHeight: 1.55,
                      marginBottom: 12
                    }}
                  >
                    <MathView text={q.stimulus} />
                  </div>
                )}

                {/* Image */}
                {q.imageUrl && (
                  <div style={{ marginBottom: 14, textAlign: "center" }}>
                    <img
                      src={q.imageUrl}
                      alt={q.imageCaption || `Ilustrasi Soal ${q.id}`}
                      style={{ width: "100%", maxWidth: "100%", maxHeight: 580, borderRadius: 10, border: "1px solid #dce2da", objectFit: "contain", backgroundColor: "#fafbf8", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}
                    />
                    {q.imageCaption && (
                      <div style={{ fontSize: 11, color: "#6f7975", marginTop: 4, fontStyle: "italic" }}>
                        {q.imageCaption}
                      </div>
                    )}
                  </div>
                )}

                {/* Warning if visual not available */}
                {q.has_visual && !q.imageUrl && (
                  <div
                    style={{
                      backgroundColor: "#fffbeb",
                      border: "1px solid #fef3c7",
                      borderRadius: 6,
                      padding: "6px 10px",
                      fontSize: 11.5,
                      color: "#92400e",
                      marginBottom: 10
                    }}
                  >
                    ⚠️ Soal ini merujuk grafik/gambar pada dokumen asli yang tidak terkonversi digital.
                  </div>
                )}

                {/* Pertanyaan */}
                <div style={{ fontSize: 14.5, fontWeight: 700, color: "#17201d", lineHeight: 1.55, marginBottom: 14 }}>
                  <MathView text={q.question} />
                </div>

                {/* Options List / Matrix Statements */}
                {q.questionType === "kategori" && Array.isArray(q.matrixStatements) && q.matrixStatements.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 100px",
                      padding: "8px 12px",
                      backgroundColor: "#18221f",
                      color: "#c8f064",
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 800
                    }}>
                      <span>PERNYATAAN</span>
                      <span style={{ textAlign: "center" }}>KUNCI JAWABAN</span>
                    </div>
                    {q.matrixStatements.map((stmt, sIdx) => (
                      <div
                        key={sIdx}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 100px",
                          alignItems: "center",
                          padding: "8px 12px",
                          borderRadius: 6,
                          backgroundColor: "#fafbf8",
                          border: "1px solid #e5e9e2",
                          gap: 8
                        }}
                      >
                        <div style={{ fontSize: 12.5, color: "#374151", lineHeight: 1.45 }}>
                          <MathView text={stmt.statement} />
                        </div>
                        <div style={{ textAlign: "center" }}>
                          <span style={{
                            padding: "3px 8px",
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 800,
                            backgroundColor: stmt.correctAnswer === "BENAR" ? "#dcfce7" : "#fee2e2",
                            color: stmt.correctAnswer === "BENAR" ? "#166534" : "#991b1b",
                            border: `1px solid ${stmt.correctAnswer === "BENAR" ? "#86efac" : "#fca5a5"}`
                          }}>
                            {stmt.correctAnswer}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 14 }}>
                  {q.options.map((opt, oIdx) => {
                    const isCorrect = correctIndices.includes(oIdx);
                    const letter = String.fromCharCode(65 + oIdx);
                    // Remove leading "A. ", "B. " if already present in text
                    const optText = opt.replace(/^[A-E]\.\s*/i, "");

                    return (
                      <div
                        key={oIdx}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 10,
                          padding: "8px 12px",
                          borderRadius: 8,
                          backgroundColor: isCorrect ? "#f0fdf4" : "#fafbf8",
                          border: isCorrect ? "1.5px solid #86efac" : "1px solid #e5e9e2",
                          transition: "all 0.15s ease"
                        }}
                      >
                        <span
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 4,
                            backgroundColor: isCorrect ? "#166534" : "#e5e9e2",
                            color: isCorrect ? "#ffffff" : "#45544e",
                            fontSize: 11,
                            fontWeight: 800,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            marginTop: 1
                          }}
                        >
                          {letter}
                        </span>
                        <div style={{ flex: 1, fontSize: 13, color: isCorrect ? "#14532d" : "#374151", fontWeight: isCorrect ? 600 : 400, lineHeight: 1.45 }}>
                          <MathView text={optText} />
                        </div>
                        {isCorrect && (
                          <span
                            style={{
                              backgroundColor: "#dcfce7",
                              color: "#166534",
                              fontSize: 11,
                              fontWeight: 800,
                              padding: "2px 6px",
                              borderRadius: 4,
                              display: "flex",
                              alignItems: "center",
                              gap: 3,
                              flexShrink: 0
                            }}
                          >
                            <Check size={11} strokeWidth={3} /> Kunci
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
                )}

                {/* Toggle Show Penjelasan Button */}
                <button
                  type="button"
                  onClick={() => q.id !== undefined && toggleItem(q.id)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "9px 14px",
                    borderRadius: 8,
                    border: "1px solid #dce2da",
                    backgroundColor: isExpanded ? "#f4f6f1" : "#fafbf8",
                    color: "#17201d",
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.15s ease"
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <BookOpen size={14} color="#4b6623" />
                    <span>{isExpanded ? "Tutup Bedah Penjelasan" : "Buka Bedah Penjelasan & Solusi Lengkap"}</span>
                  </span>
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {/* Expanded Explanation Drawer */}
                {isExpanded && (
                  <div
                    style={{
                      marginTop: 12,
                      padding: "16px 18px",
                      borderRadius: 10,
                      backgroundColor: "#fbfcfa",
                      border: "1px solid #e2e8df",
                      display: "flex",
                      flexDirection: "column",
                      gap: 14
                    }}
                  >
                    {/* Konsep Kunci */}
                    {q.formula && (
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 800, color: "#4b6623", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>
                          📌 Konsep Kunci & Rumus
                        </div>
                        <div style={{ fontSize: 13, color: "#17201d", lineHeight: 1.5, backgroundColor: "#ffffff", padding: "8px 12px", borderRadius: 6, border: "1px solid #e5e9e2" }}>
                          <MathView text={q.formula} />
                        </div>
                        {onGenerateTopic && (
                          <button
                            type="button"
                            onClick={() => handleGenerate(q.formula!)}
                            disabled={pendingTopic !== null}
                            style={{
                              marginTop: 6,
                              background: "none",
                              border: "none",
                              color: "#3f6212",
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: "pointer",
                              padding: 0,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4
                            }}
                          >
                            <Sparkles size={11} />
                            <span>Buat modul teori dari konsep ini →</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Langkah Pengerjaan */}
                    {q.explanation && (
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 800, color: "#18221f", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>
                          📝 Langkah Penyelesaian
                        </div>
                        <div
                          style={{
                            fontSize: 13,
                            color: "#27312e",
                            lineHeight: 1.6,
                            backgroundColor: "#ffffff",
                            padding: "10px 14px",
                            borderRadius: 6,
                            border: "1px solid #e5e9e2",
                            whiteSpace: "pre-line"
                          }}
                        >
                          <MathView text={q.explanation} />
                        </div>
                      </div>
                    )}

                    {/* Analisis Tiap Opsi */}
                    {q.analisis_opsi && typeof q.analisis_opsi === "object" && Object.keys(q.analisis_opsi).length > 0 && (
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 800, color: "#18221f", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>
                          🔍 Analisis Opsi Pengecoh
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {Object.entries(q.analisis_opsi).map(([optKey, optDesc]) => (
                            <div
                              key={optKey}
                              style={{
                                backgroundColor: "#ffffff",
                                padding: "6px 10px",
                                borderRadius: 6,
                                border: "1px solid #edf0ec",
                                fontSize: 12,
                                color: "#374151",
                                lineHeight: 1.45,
                                display: "flex",
                                alignItems: "flex-start",
                                gap: 8
                              }}
                            >
                              <strong style={{ color: "#18221f", minWidth: 20 }}>{optKey}:</strong>
                              <div style={{ flex: 1 }}>
                                <MathView text={optDesc} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Trik Cepat */}
                    {q.trik_cepat && (
                      <div
                        style={{
                          backgroundColor: "#f0fdf4",
                          border: "1px solid #bbf7d0",
                          borderRadius: 8,
                          padding: "10px 14px",
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 10
                        }}
                      >
                        <Zap size={16} color="#16a34a" style={{ flexShrink: 0, marginTop: 2 }} />
                        <div>
                          <div style={{ fontSize: 11.5, fontWeight: 800, color: "#15803d", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                            Trik Cepat & Shortcut Waktu
                          </div>
                          <div style={{ fontSize: 12.5, color: "#166534", marginTop: 2, lineHeight: 1.45 }}>
                            <MathView text={q.trik_cepat} />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Jebakan Soal */}
                    {q.pitfall && (
                      <div
                        style={{
                          backgroundColor: "#fffdf9",
                          border: "1px solid #fed7aa",
                          borderRadius: 8,
                          padding: "10px 14px",
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 10
                        }}
                      >
                        <AlertTriangle size={16} color="#ea580c" style={{ flexShrink: 0, marginTop: 2 }} />
                        <div>
                          <div style={{ fontSize: 11.5, fontWeight: 800, color: "#c2410c", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                            Jebakan & Kesalahan Umum
                          </div>
                          <div style={{ fontSize: 12.5, color: "#9a3412", marginTop: 2, lineHeight: 1.45 }}>
                            <MathView text={q.pitfall} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
});

export default ExamDrillView;
