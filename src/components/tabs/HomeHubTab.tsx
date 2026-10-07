import React from "react";
import { Upload, Plus, Search, Sparkles, BookOpen, Layers, Target, AlertTriangle, ChevronRight, ArrowRight, Trash2, Video, X, Camera, Compass, Flame } from "lucide-react";
import { YouTubeIcon } from "../common/YouTubeIcon";
import { ActiveTab, DocumentItem, QuizQuestion, Flashcard, MistakeItem, UserAccount } from "../../types";
import { MathView, getSubjectBadge } from "../common/MathView";

export interface HomeHubTabProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  documents: DocumentItem[];
  activeDocId: string | null;
  activeDocTitle: string;
  activeDocContent: string;
  loadDocument: (id: string) => void;
  handleDeleteDocument: (id: string, e?: React.MouseEvent) => void;
  handleDeleteAllDocuments?: () => void;
  homeSearchQuery: string;
  setHomeSearchQuery: (val: string) => void;
  homeSubjectFilter: string;
  setHomeSubjectFilter: (val: string) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  cameraInputRef?: React.RefObject<HTMLInputElement | null>;
  currentUser?: UserAccount | null;
  setIsTopicModalOpen: (val: boolean) => void;
  setIsYouTubeModalOpen?: (val: boolean) => void;
  setIsStagingModalOpen: (val: boolean) => void;
  handleStageFiles?: (files: FileList | File[] | File) => void;
  quizQuestions: QuizQuestion[];
  flashcards: Flashcard[];
  mistakes: MistakeItem[];
  handleGenerateQuiz: (params?: any) => void;
  handleStartNewTopic?: () => void;
  setTopicInput?: (val: string) => void;
  handleStartTopicClarify?: (topicText?: string) => void;
}

export function HomeHubTab({
  activeTab,
  setActiveTab,
  documents,
  activeDocId,
  activeDocTitle,
  activeDocContent,
  loadDocument,
  handleDeleteDocument,
  handleDeleteAllDocuments,
  homeSearchQuery,
  setHomeSearchQuery,
  homeSubjectFilter,
  setHomeSubjectFilter,
  fileInputRef,
  cameraInputRef,
  currentUser,
  setIsTopicModalOpen,
  setIsYouTubeModalOpen,
  setIsStagingModalOpen,
  handleStageFiles,
  quizQuestions,
  flashcards,
  mistakes,
  handleGenerateQuiz,
  setTopicInput,
  handleStartTopicClarify,
}: HomeHubTabProps) {
  const activeDoc = documents.find((d) => d.id === activeDocId) || null;

  return (
              <div className="tab-pane-animate" style={{ maxWidth: 1160, margin: "0 auto", paddingBottom: 48 }}>
                {/* 1. TOP ACTION & SEARCH CARD */}
                <div
                  className="home-search-panel"
                  style={{
                    backgroundColor: "#ffffff",
                    borderRadius: 12,
                    padding: "16px 20px",
                    border: "1px solid #dce1da",
                    boxShadow: "0 2px 12px rgba(27, 39, 35, 0.03)",
                    marginBottom: 16
                  }}
                >
                  <div className="desktop-only" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 12 }}>
                    <div>
                      <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: "#17201d", letterSpacing: "-0.02em" }}>
                        Materi & Modul
                      </h1>
                      <div style={{ fontSize: 12.5, color: "#6f7975", marginTop: 2 }}>
                        Eksplorasi konsep terstruktur, kuis adaptif, dan active recall.
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => {
                          if (fileInputRef.current) {
                            fileInputRef.current.click();
                          } else {
                            setIsStagingModalOpen(true);
                          }
                        }}
                        style={{
                          backgroundColor: "#f4f6f1",
                          border: "1px solid #dce1da",
                          color: "#28342f",
                          borderRadius: 8,
                          padding: "8px 14px",
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 6
                        }}
                      >
                        <Upload size={14} />
                        <span>Unggah File</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (setIsYouTubeModalOpen) setIsYouTubeModalOpen(true);
                        }}
                        style={{
                          backgroundColor: "#f4f6f1",
                          border: "1px solid #dce1da",
                          color: "#28342f",
                          borderRadius: 8,
                          padding: "8px 14px",
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 6
                        }}
                      >
                        <YouTubeIcon size={15} color="#556930" />
                        <span>Video YouTube</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsTopicModalOpen(true)}
                        style={{
                          backgroundColor: "#18221f",
                          border: "none",
                          color: "#c8f064",
                          borderRadius: 8,
                          padding: "8px 16px",
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 6
                        }}
                      >
                        <Plus size={14} />
                        <span>Buat Modul Baru</span>
                      </button>
                    </div>
                  </div>

                  {/* Clean Search Input */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (homeSearchQuery.trim()) {
                        if (setTopicInput) setTopicInput(homeSearchQuery.trim());
                        setIsTopicModalOpen(true);
                        if (handleStartTopicClarify) handleStartTopicClarify(homeSearchQuery.trim());
                      }
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      backgroundColor: "#f8f9f5",
                      borderRadius: 8,
                      border: "1px solid #dce1da",
                      padding: "4px 6px 4px 14px",
                      gap: 10
                    }}
                  >
                    <Search size={18} color="#8a9691" style={{ flexShrink: 0 }} />
                    <input
                      type="text"
                      value={homeSearchQuery}
                      onChange={(e) => setHomeSearchQuery(e.target.value)}
                      placeholder="Cari materi atau topik baru..."
                      style={{
                        flex: 1,
                        minWidth: 0,
                        border: "none",
                        outline: "none",
                        fontSize: 14,
                        color: "#17201d",
                        padding: "8px 0",
                        backgroundColor: "transparent"
                      }}
                    />
                    <button
                      type="submit"
                      disabled={!homeSearchQuery.trim()}
                      style={{
                        backgroundColor: homeSearchQuery.trim() ? "#18221f" : "#e5e7eb",
                        color: homeSearchQuery.trim() ? "#c8f064" : "#9ca3af",
                        border: "none",
                        borderRadius: 6,
                        padding: "8px 14px",
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: homeSearchQuery.trim() ? "pointer" : "default",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        flexShrink: 0
                      }}
                    >
                      <span className="desktop-only">Cari / Buat</span>
                      <ArrowRight size={14} />
                    </button>
                  </form>

                  {/* Mobile Quick Action Strip (Compact Tool Bar) */}
                  <div className="mobile-only home-mobile-action-strip">
                    <button
                      type="button"
                      onClick={() => setIsTopicModalOpen(true)}
                      className="home-action-btn primary"
                    >
                      <Compass size={15} color="#c8f064" />
                      <span>Buat Topik AI</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (fileInputRef.current) {
                          fileInputRef.current.click();
                        } else {
                          setIsStagingModalOpen(true);
                        }
                      }}
                      className="home-action-btn"
                    >
                      <Upload size={14} />
                      <span>Unggah</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (cameraInputRef && cameraInputRef.current) {
                          cameraInputRef.current.click();
                        } else if (fileInputRef.current) {
                          fileInputRef.current.click();
                        } else {
                          setIsStagingModalOpen(true);
                        }
                      }}
                      className="home-action-btn"
                    >
                      <Camera size={14} />
                      <span>Foto</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (setIsYouTubeModalOpen) setIsYouTubeModalOpen(true);
                      }}
                      className="home-action-btn"
                    >
                      <YouTubeIcon size={14} color="#556930" />
                      <span>YouTube</span>
                    </button>
                  </div>
                </div>

                {/* 2. THREE BENTO STATUS COUNTERS */}
                <div
                  className="bento-grid home-stats-carousel"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: 14,
                    marginBottom: 20
                  }}
                >
                  <div
                    className="home-stat-card"
                    style={{
                      backgroundColor: "#ffffff",
                      borderRadius: 12,
                      padding: "16px 20px",
                      border: "1px solid #dce1da",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      boxShadow: "0 2px 8px rgba(27, 39, 35, 0.02)"
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 11.5, color: "#6f7975", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                        Modul Tersimpan
                      </div>
                      <div style={{ fontSize: 26, fontWeight: 800, color: "#17201d", fontFamily: "'DM Mono', monospace", marginTop: 4 }}>
                        {documents.length}
                      </div>
                      <div style={{ fontSize: 12, color: "#8a9691", marginTop: 2 }}>
                        Koleksi materi aktif
                      </div>
                    </div>
                    <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: "#f2f8e8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <BookOpen size={18} color="#4b6623" />
                    </div>
                  </div>

                  <div
                    className="home-stat-card"
                    style={{
                      backgroundColor: "#ffffff",
                      borderRadius: 12,
                      padding: "16px 20px",
                      border: "1px solid #dce1da",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      boxShadow: "0 2px 8px rgba(27, 39, 35, 0.02)"
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 11.5, color: "#6f7975", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                        Total Flashcard
                      </div>
                      <div style={{ fontSize: 26, fontWeight: 800, color: "#17201d", fontFamily: "'DM Mono', monospace", marginTop: 4 }}>
                        {documents.reduce((acc, d) => acc + (d.flashcard_count || 0), 0) || flashcards.length}
                      </div>
                      <div style={{ fontSize: 12, color: "#8a9691", marginTop: 2 }}>
                        Fakta siap recall
                      </div>
                    </div>
                    <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: "#e6f0eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Layers size={18} color="#284439" />
                    </div>
                  </div>

                  <div
                    className="home-stat-card"
                    onClick={() => setActiveTab("mistakes")}
                    style={{
                      backgroundColor: mistakes.length > 0 ? "#faece8" : "#ffffff",
                      borderRadius: 14,
                      padding: "18px 22px",
                      border: mistakes.length > 0 ? "1px solid #f2d5ce" : "1px solid #dce2da",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      cursor: "pointer",
                      boxShadow: "0 12px 35px rgba(29, 40, 35, 0.04)",
                      transition: "all 0.15s ease"
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 11, color: mistakes.length > 0 ? "#a2574a" : "#7b914e", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "'DM Mono', monospace" }}>
                        Bank Kesalahan
                      </div>
                      <div style={{ fontSize: 26, fontWeight: 800, color: mistakes.length > 0 ? "#a2574a" : "#18211e", fontFamily: "'DM Mono', monospace", marginTop: 4 }}>
                        {mistakes.length}
                      </div>
                      <div style={{ fontSize: 12, color: mistakes.length > 0 ? "#a2574a" : "#89938f", marginTop: 2 }}>
                        {mistakes.length > 0 ? "Klik untuk drill kesalahan" : "Belum ada catatan salah"}
                      </div>
                    </div>
                    <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: mistakes.length > 0 ? "#faece8" : "#edf4e3", display: "flex", alignItems: "center", justifyContent: "center", border: mistakes.length > 0 ? "1px solid #f2d5ce" : "1px solid #d7e5c5" }}>
                      <AlertTriangle size={18} color={mistakes.length > 0 ? "#a2574a" : "#566b36"} />
                    </div>
                  </div>
                </div>

                {/* 3. LANJUTKAN SESI TERAKHIR (WIDE STRIP) */}
                {(activeDoc || (documents && documents[0])) && (() => {
                  const targetDoc = activeDoc || documents[0];
                  const badge = getSubjectBadge(targetDoc.title);
                  return (
                    <div
                      className="home-last-session-card"
                      style={{
                        backgroundColor: "#ffffff",
                        border: "1px solid #dce1da",
                        borderRadius: 12,
                        padding: "16px 22px",
                        marginBottom: 20,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: 14,
                        boxShadow: "0 2px 10px rgba(27, 39, 35, 0.02)"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12, flex: "1 1 360px", minWidth: 240 }}>
                        <span
                          style={{
                            backgroundColor: badge.bg,
                            color: badge.color,
                            border: `1px solid ${badge.border}`,
                            padding: "3px 9px",
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 700,
                            flexShrink: 0
                          }}
                        >
                          {badge.label}
                        </span>
                        <div style={{ overflow: "hidden" }}>
                          <div style={{ fontSize: 10.5, color: "#8a9691", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                            Lanjutkan Sesi Terakhir
                          </div>
                          <div style={{ fontSize: 15, fontWeight: 800, color: "#17201d", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: 1 }}>
                            {targetDoc.title}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", width: "100%", marginTop: 4 }} className="home-last-session-actions">
                        <button
                          onClick={() => {
                            loadDocument(targetDoc.id);
                            setActiveTab("material");
                          }}
                          className="last-session-main-btn"
                          style={{
                            flex: "1 1 auto",
                            minWidth: 95,
                            backgroundColor: "#18221f",
                            color: "#c8f064",
                            border: "none",
                            borderRadius: 7,
                            padding: "8px 12px",
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 6
                          }}
                        >
                          <BookOpen size={13} />
                          <span>Baca Materi</span>
                        </button>

                        <button
                          onClick={() => {
                            loadDocument(targetDoc.id);
                            setActiveTab("quiz");
                          }}
                          style={{
                            flex: "1 1 auto",
                            minWidth: 95,
                            backgroundColor: "#f8f9f5",
                            color: "#17201d",
                            border: "1px solid #dce1da",
                            borderRadius: 7,
                            padding: "8px 12px",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 5
                          }}
                        >
                          <Target size={13} color="#72a728" />
                          <span>Latihan Soal</span>
                        </button>

                        <button
                          onClick={() => {
                            loadDocument(targetDoc.id);
                            setActiveTab("flashcards");
                          }}
                          style={{
                            flex: "1 1 auto",
                            minWidth: 95,
                            backgroundColor: "#f8f9f5",
                            color: "#17201d",
                            border: "1px solid #dce1da",
                            borderRadius: 7,
                            padding: "8px 12px",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 5
                          }}
                        >
                          <Layers size={13} color="#3b82f6" />
                          <span>Flashcards</span>
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* 4. RAK DOKUMEN DENGAN FILTER MAPEL UNIVERSAL */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <BookOpen size={16} color="#4b6623" />
                      <h2 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: "#17201d", letterSpacing: "-0.01em" }}>
                        Koleksi Modul Belajar
                      </h2>
                      <span style={{ fontSize: 12, color: "#6f7975", fontFamily: "'DM Mono', monospace" }}>
                        ({documents.length})
                      </span>
                      {documents.length > 0 && handleDeleteAllDocuments && (
                        <button
                          type="button"
                          onClick={handleDeleteAllDocuments}
                          title="Hapus Semua Modul Materi"
                          style={{
                            backgroundColor: "rgba(239, 68, 68, 0.08)",
                            color: "#dc2626",
                            border: "1px solid rgba(239, 68, 68, 0.25)",
                            borderRadius: 6,
                            padding: "3px 8px",
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            marginLeft: 4
                          }}
                        >
                          <Trash2 size={12} /> Hapus Semua
                        </button>
                      )}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }} className="home-search-filter-wrap">
                      {/* Search Bar Modul di Home */}
                      <div style={{ position: "relative", minWidth: 180 }} className="home-search-subbar">
                        <Search size={12} color="#8a9691" style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)" }} />
                        <input
                          type="text"
                          value={homeSearchQuery}
                          onChange={(e) => setHomeSearchQuery(e.target.value)}
                          placeholder="Cari materi..."
                          style={{
                            width: "100%",
                            backgroundColor: "#ffffff",
                            border: "1px solid #dce1da",
                            borderRadius: 7,
                            padding: "5px 24px 5px 27px",
                            fontSize: 11.5,
                            color: "#17201d",
                            outline: "none",
                            boxSizing: "border-box"
                          }}
                        />
                        {homeSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setHomeSearchQuery("")}
                            style={{
                              position: "absolute",
                              right: 6,
                              top: "50%",
                              transform: "translateY(-50%)",
                              background: "none",
                              border: "none",
                              color: "#8a9691",
                              cursor: "pointer",
                              padding: 2,
                              display: "flex"
                            }}
                          >
                            <X size={11} />
                          </button>
                        )}
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }} className="home-filter-scroll">
                        {["Semua", "Sosiologi", "Ekonomi", "Matematika", "Sains", "Bahasa"].map((cat) => (
                          <button
                            key={cat}
                            onClick={() => setHomeSubjectFilter(cat)}
                            style={{
                              backgroundColor: homeSubjectFilter === cat ? "#18221f" : "#ffffff",
                              color: homeSubjectFilter === cat ? "#c8f064" : "#6f7975",
                              border: homeSubjectFilter === cat ? "1px solid #18221f" : "1px solid #dce1da",
                              padding: "5px 12px",
                              borderRadius: 7,
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: "pointer",
                              transition: "all 0.15s ease"
                            }}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 2-Column Responsive Grid of Documents */}
                  {(() => {
                    const filteredDocs = documents.filter((doc) => {
                      if (homeSearchQuery && homeSearchQuery.trim()) {
                        const q = homeSearchQuery.toLowerCase().trim();
                        if (!doc.title.toLowerCase().includes(q)) return false;
                      }
                      if (homeSubjectFilter === "Semua") return true;
                      if (homeSubjectFilter === "Bahasa") return doc.title.toLowerCase().includes("indo") || doc.title.toLowerCase().includes("inggris") || doc.title.toLowerCase().includes("english");
                      return doc.title.toLowerCase().includes(homeSubjectFilter.toLowerCase());
                    });

                    if (filteredDocs.length === 0) {
                      return (
                        <div
                          style={{
                            backgroundColor: "#ffffff",
                            border: "1px dashed #dce1da",
                            borderRadius: 12,
                            padding: "36px 20px",
                            textAlign: "center"
                          }}
                        >
                          <BookOpen size={24} color="#8a9691" style={{ margin: "0 auto 8px" }} />
                          <div style={{ fontSize: 14, fontWeight: 700, color: "#17201d" }}>
                            {homeSearchQuery ? `Tidak ada modul yang cocok dengan "${homeSearchQuery}"` : "Belum ada modul untuk kategori ini"}
                          </div>
                          <div style={{ fontSize: 12, color: "#8a9691", marginTop: 4 }}>
                            {homeSearchQuery ? "Coba kata kunci lain atau bersihkan pencarian." : "Gunakan kotak pencarian di atas untuk membuat modul topik baru atau unggah berkas."}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        className="home-docs-grid"
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
                          gap: 14
                        }}
                      >
                        {filteredDocs.map((doc) => {
                          const badge = getSubjectBadge(doc.title);
                          const isCurrent = doc.id === activeDocId;
                          return (
                            <div
                              key={doc.id}
                              style={{
                                backgroundColor: "#ffffff",
                                border: isCurrent ? "1.5px solid #72a728" : "1px solid #dce1da",
                                borderRadius: 12,
                                padding: "16px 18px",
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "space-between",
                                boxShadow: "0 2px 10px rgba(27, 39, 35, 0.02)",
                                transition: "all 0.15s ease"
                              }}
                            >
                              <div>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                                  <span
                                    style={{
                                      backgroundColor: badge.bg,
                                      color: badge.color,
                                      border: `1px solid ${badge.border}`,
                                      padding: "2px 8px",
                                      borderRadius: 6,
                                      fontSize: 10.5,
                                      fontWeight: 700
                                    }}
                                  >
                                    {badge.label}
                                  </span>
                                  <button
                                    onClick={(e) => handleDeleteDocument(doc.id, e)}
                                    title="Hapus modul"
                                    style={{ background: "none", border: "none", color: "#aeb9b4", cursor: "pointer", padding: 3 }}
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>

                                <h4
                                  onClick={() => {
                                    loadDocument(doc.id);
                                    setActiveTab("material");
                                  }}
                                  style={{
                                    fontSize: 14.5,
                                    fontWeight: 700,
                                    margin: "0 0 8px 0",
                                    color: "#17201d",
                                    lineHeight: 1.4,
                                    cursor: "pointer"
                                  }}
                                >
                                  {doc.title}
                                </h4>

                                <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 11.5, color: "#8a9691", marginBottom: 14 }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                    <Layers size={12} color="#6f7975" />
                                    <span>{doc.flashcard_count || 0} Flashcard</span>
                                  </div>
                                  <span>•</span>
                                  <span>{new Date(doc.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</span>
                                </div>
                              </div>

                              <div
                                className="home-doc-card-actions"
                                style={{ display: "flex", alignItems: "center", gap: 6, borderTop: "1px solid #f0f2ee", paddingTop: 10 }}
                              >
                                <button
                                  onClick={() => {
                                    loadDocument(doc.id);
                                    setActiveTab("material");
                                  }}
                                  style={{
                                    flex: 1,
                                    backgroundColor: "#18221f",
                                    color: "#c8f064",
                                    border: "none",
                                    borderRadius: 6,
                                    padding: "7px 10px",
                                    fontSize: 12,
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 5
                                  }}
                                >
                                  <BookOpen size={13} />
                                  <span>Buka Modul</span>
                                </button>

                                <button
                                  onClick={() => {
                                    loadDocument(doc.id);
                                    setActiveTab("quiz");
                                  }}
                                  title="Latihan Soal"
                                  style={{
                                    backgroundColor: "#f8f9f5",
                                    color: "#17201d",
                                    border: "1px solid #dce1da",
                                    borderRadius: 6,
                                    padding: "7px 11px",
                                    fontSize: 12,
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 4
                                  }}
                                >
                                  <Target size={13} color="#72a728" />
                                  <span>Kuis</span>
                                </button>

                                <button
                                  onClick={() => {
                                    loadDocument(doc.id);
                                    setActiveTab("flashcards");
                                  }}
                                  title="Flashcards"
                                  style={{
                                    backgroundColor: "#f8f9f5",
                                    color: "#17201d",
                                    border: "1px solid #dce1da",
                                    borderRadius: 6,
                                    padding: "7px 11px",
                                    fontSize: 12,
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 4
                                  }}
                                >
                                  <Layers size={13} color="#3b82f6" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </div>
  );
}
