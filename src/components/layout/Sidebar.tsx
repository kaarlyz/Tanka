import React, { useState, useRef, useEffect } from "react";
import { Plus, Trash2, Upload, Camera, Compass, X, Video, Search, User, Target, Trophy, Swords, LogOut, Flame, Sparkles } from "lucide-react";
import { YouTubeIcon } from "../common/YouTubeIcon";
import { ActiveTab, DocumentItem, QuizQuestion, MistakeItem, Flashcard, UserAccount } from "../../types";

export interface SidebarProps {
  isMobileDrawerOpen: boolean;
  setIsMobileDrawerOpen: (val: boolean) => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  setIsAiPanelOpen: (val: boolean) => void;
  documents: DocumentItem[];
  activeDocId: string | null;
  loadDocument: (id: string) => void;
  handleDeleteDocument: (id: string, e?: React.MouseEvent) => void;
  handleDeleteAllDocuments?: () => void;
  docSearchQuery?: string;
  setDocSearchQuery?: (val: string) => void;
  quizQuestions?: QuizQuestion[];
  activeDocMistakes?: MistakeItem[];
  mistakes?: MistakeItem[];
  flashcards?: Flashcard[];
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  cameraInputRef: React.RefObject<HTMLInputElement | null>;
  isUploading?: boolean;
  handleStageFiles: (files: FileList | File[]) => void;
  setIsTopicModalOpen: (val: boolean) => void;
  setIsYouTubeModalOpen?: (val: boolean) => void;
  setIsStagingModalOpen?: (val: boolean) => void;
  handleCreateNewDoc?: () => void;
  setTopicStep?: (step: 1 | 2 | 3) => void;
  currentUser?: UserAccount | null;
  onOpenAuthModal?: () => void;
  onLogout?: () => void;
  onOpenProfileModal?: (tab?: "profile" | "stats" | "leaderboard" | "room") => void;
  onOpenRoomModal?: () => void;
}

export function Sidebar({
  isMobileDrawerOpen,
  setIsMobileDrawerOpen,
  activeTab,
  setActiveTab,
  setIsAiPanelOpen,
  documents,
  activeDocId,
  loadDocument,
  handleDeleteDocument,
  handleDeleteAllDocuments,
  docSearchQuery,
  setDocSearchQuery,
  quizQuestions,
  activeDocMistakes,
  mistakes,
  flashcards,
  fileInputRef,
  cameraInputRef,
  isUploading,
  handleStageFiles,
  setIsTopicModalOpen,
  setIsYouTubeModalOpen,
  setIsStagingModalOpen,
  handleCreateNewDoc,
  setTopicStep,
  currentUser,
  onOpenAuthModal,
  onLogout,
  onOpenProfileModal,
  onOpenRoomModal
}: SidebarProps) {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }
    if (isProfileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isProfileMenuOpen]);
  return (
      <aside
        className={`figma-sidebar ${isMobileDrawerOpen ? "sidebar-drawer open" : "desktop-only"}`}
        style={{
          height: "100%",
          maxHeight: "100%",
          overflowY: "scroll",
          overflowX: "hidden",
          WebkitOverflowScrolling: "touch",
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box"
        }}
      >
        {/* Brand Row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexShrink: 0 }}>
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
              { id: "home", label: "Beranda Hub", mark: "H" },
              { id: "material", label: "Materi Saya", mark: "M" },
              { id: "quiz", label: "Latihan Kuis", mark: "L", count: (quizQuestions || []).length },
              { id: "mistakes", label: "Bank Soal Salah", mark: "B", count: activeDocId ? (activeDocMistakes || []).length : (mistakes || []).length, highlight: (activeDocId ? (activeDocMistakes || []).length : (mistakes || []).length) > 0 },
              { id: "flashcards", label: "Flashcards", mark: "K", count: (flashcards || []).length },
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

            {onOpenRoomModal && (
              <button
                className="figma-nav-link"
                style={{
                  marginTop: 4,
                  backgroundColor: "rgba(200, 240, 100, 0.05)",
                  borderColor: "rgba(200, 240, 100, 0.2)"
                }}
                onClick={() => {
                  onOpenRoomModal();
                  setIsMobileDrawerOpen(false);
                }}
              >
                <div className="side-mark-box" style={{ color: "#c8f064", backgroundColor: "rgba(200, 240, 100, 0.15)" }}>⚔️</div>
                <span style={{ flex: 1, color: "#d6f58d", fontWeight: 700 }}>Room Kompetisi</span>
                <span style={{ fontSize: 9, backgroundColor: "#2b3c2a", color: "#c8f064", padding: "2px 6px", borderRadius: 999, fontWeight: 700 }}>
                  EVENT
                </span>
              </button>
            )}
          </nav>

          {/* Materi Tersimpan & Actions */}
          <div style={{ display: "flex", flexDirection: "column", flexShrink: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, padding: "0 4px" }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#86938e", fontFamily: "'DM Mono', monospace", letterSpacing: 1.2 }}>
                MATERI TERSIMPAN ({documents.length})
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                {documents.length > 0 && handleDeleteAllDocuments && (
                  <button
                    onClick={handleDeleteAllDocuments}
                    title="Hapus Semua Modul Materi"
                    style={{
                      backgroundColor: "rgba(239, 68, 68, 0.12)",
                      color: "#f87171",
                      border: "1px solid rgba(239, 68, 68, 0.25)",
                      borderRadius: 6,
                      padding: "2px 6px",
                      fontSize: 10,
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 2
                    }}
                  >
                    <Trash2 size={10} /> Hapus Semua
                  </button>
                )}
                <button
                  onClick={() => {
                    setIsMobileDrawerOpen(false);
                    if (handleCreateNewDoc) handleCreateNewDoc();
                  }}
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
            </div>

            {/* Kotak Pencarian Modul */}
            {documents.length > 0 && (
              <div style={{ position: "relative", marginBottom: 8 }}>
                <Search size={11} color="#7a8a84" style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)" }} />
                <input
                  type="text"
                  value={docSearchQuery || ""}
                  onChange={(e) => setDocSearchQuery && setDocSearchQuery(e.target.value)}
                  placeholder="Cari modul..."
                  style={{
                    width: "100%",
                    backgroundColor: "#18221f",
                    border: "1px solid #2e3a35",
                    borderRadius: 6,
                    padding: "5px 24px 5px 25px",
                    fontSize: 11,
                    color: "#eff5ec",
                    outline: "none",
                    boxSizing: "border-box"
                  }}
                />
                {docSearchQuery && (
                  <button
                    onClick={() => setDocSearchQuery && setDocSearchQuery("")}
                    style={{
                      position: "absolute",
                      right: 6,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      color: "#7a8a84",
                      cursor: "pointer",
                      padding: 2,
                      display: "flex"
                    }}
                  >
                    <X size={11} />
                  </button>
                )}
              </div>
            )}

            {/* Document list */}
            {(() => {
              const filteredDocs = documents.filter((doc) => {
                if (!docSearchQuery) return true;
                return doc.title.toLowerCase().includes(docSearchQuery.toLowerCase());
              });

              return (
                <div className="no-scrollbar" style={{ maxHeight: 200, overflowY: "auto", paddingRight: 2 }}>
                  {documents.length === 0 ? (
                    <div style={{ padding: "18px 8px", color: "#6e7c77", fontSize: 12.5, textAlign: "center" }}>
                      Belum ada dokumen. Unggah atau buat modul baru.
                    </div>
                  ) : filteredDocs.length === 0 ? (
                    <div style={{ padding: "14px 8px", color: "#6e7c77", fontSize: 11.5, textAlign: "center" }}>
                      Tidak ada modul "{docSearchQuery}".
                    </div>
                  ) : (
                    filteredDocs.map((doc) => {
                      const isSelected = doc.id === activeDocId;
                      return (
                        <div
                          key={doc.id}
                          onClick={() => {
                            loadDocument(doc.id);
                            setIsMobileDrawerOpen(false);
                          }}
                          style={{
                            padding: "9px 12px",
                            borderRadius: 8,
                            marginBottom: 5,
                            backgroundColor: isSelected ? "#25322e" : "transparent",
                            border: isSelected ? "1px solid #34413c" : "1px solid transparent",
                            cursor: "pointer",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            transition: "all 0.15s ease"
                          }}
                        >
                          <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, marginRight: 8 }}>
                            <div style={{ fontSize: 13, fontWeight: isSelected ? 700 : 500, color: isSelected ? "#f5f8f3" : "#aeb9b4" }}>
                              {doc.title}
                            </div>
                            <div style={{ fontSize: 11, color: "#7a8a84", fontFamily: "'DM Mono', monospace", marginTop: 1 }}>
                              {doc.flashcard_count || 0} kartu
                            </div>
                          </div>
                          <button
                            onClick={(e) => handleDeleteDocument(doc.id, e)}
                            style={{ background: "none", border: "none", color: "#7a8a84", cursor: "pointer", padding: 4 }}
                            title="Hapus dokumen"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              );
            })()}

            {/* Quick Action Buttons */}
            {/* Action Grid: Upload, Camera, Topic AI, YouTube */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 8 }}>
              <button
                onClick={() => {
                  setIsMobileDrawerOpen(false);
                  fileInputRef.current?.click();
                }}
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
                onClick={() => {
                  setIsMobileDrawerOpen(false);
                  cameraInputRef.current?.click();
                }}
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
              <button
                onClick={() => {
                  setIsMobileDrawerOpen(false);
                  setIsTopicModalOpen(true);
                  if (setTopicStep) setTopicStep(1);
                }}
                style={{
                  backgroundColor: "#212d29",
                  border: "1px solid #34413c",
                  color: "#c8f064",
                  borderRadius: 8,
                  padding: "7px 6px",
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4
                }}
              >
                <Compass size={12} />
                <span>Topik AI</span>
              </button>
              <button
                onClick={() => {
                  setIsMobileDrawerOpen(false);
                  if (setIsYouTubeModalOpen) setIsYouTubeModalOpen(true);
                }}
                style={{
                  backgroundColor: "#212d29",
                  border: "1px solid #33403b",
                  color: "#e6ece8",
                  borderRadius: 8,
                  padding: "7px 6px",
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4
                }}
              >
                <YouTubeIcon size={12} color="#c8f064" />
                <span>YouTube</span>
              </button>
            </div>

            <input
              type="file"
              ref={cameraInputRef}
              accept="image/*"
              capture="environment"
              style={{ display: "none" }}
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleStageFiles(e.target.files);
                  e.target.value = "";
                }
              }}
            />
            <input
              type="file"
              ref={fileInputRef}
              multiple
              accept=".pdf,.docx,.pptx,.xlsx,.xls,.doc,.ppt,.txt,.md,.csv,.tsv,.rtf,.png,.jpg,.jpeg,.webp,.bmp,.heic,.heif,.avif"
              style={{ display: "none" }}
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleStageFiles(e.target.files);
                  e.target.value = "";
                }
              }}
            />
          </div>

        {/* Sidebar Bottom: Dynamic Streak Widget & Profile Row with Action Popover */}
        <div ref={profileMenuRef} style={{ flexShrink: 0, marginTop: "auto", paddingTop: 16, paddingBottom: 24, position: "relative" }}>
          {/* Real Dynamic Weekly Target & Streak Widget */}
          <div 
            className="streak-card-box" 
            style={{ margin: "4px 0 10px", cursor: "pointer", transition: "transform 0.15s ease" }}
            onClick={() => {
              if (onOpenProfileModal) {
                onOpenProfileModal("stats");
              } else if (onOpenAuthModal && !currentUser) {
                onOpenAuthModal();
              }
            }}
            title="Klik untuk melihat statistik & target mingguan"
          >
            <div className="streak-top-row">
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Target size={12} color="#c8f064" /> Target mingguan
              </span>
              <strong style={{ fontFamily: "'DM Mono', monospace", color: "#c8f064" }}>
                {currentUser?.active_days_this_week?.length || 0}/{currentUser?.target_weekly_days || 5} hari
              </strong>
            </div>
            <div className="streak-days">
              {["S", "S", "R", "K", "J", "S", "M"].map((day, idx) => {
                const isDone = (currentUser?.active_days_this_week || []).includes(idx);
                return (
                  <span className={isDone ? "filled" : ""} key={`${day}-${idx}`} style={{ transition: "all 0.2s ease" }}>
                    {isDone ? "✓" : day}
                  </span>
                );
              })}
            </div>
            <p style={{ margin: 0, fontSize: 11, color: "#8a9691" }}>
              {currentUser 
                ? (currentUser.active_days_this_week?.length || 0) >= (currentUser.target_weekly_days || 5)
                  ? "🎉 Hebat! Target mingguan tercapai."
                  : `${(currentUser.target_weekly_days || 5) - (currentUser.active_days_this_week?.length || 0)} hari belajar lagi untuk capai target.`
                : "Masuk akun untuk melacak konsistensi belajarmu."}
            </p>
          </div>

          {/* Floating Popover Menu when dots or profile clicked */}
          {isProfileMenuOpen && currentUser && (
            <div
              className="modal-scale-in"
              style={{
                position: "absolute",
                bottom: 80,
                left: 0,
                right: 0,
                backgroundColor: "#19211d",
                border: "1.5px solid #2b3933",
                borderRadius: 14,
                boxShadow: "0 16px 40px rgba(0, 0, 0, 0.65)",
                padding: 6,
                zIndex: 100,
                display: "flex",
                flexDirection: "column",
                gap: 2
              }}
            >
              <button
                onClick={() => {
                  setIsProfileMenuOpen(false);
                  if (onOpenProfileModal) onOpenProfileModal("profile");
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 12px",
                  borderRadius: 8,
                  backgroundColor: "transparent",
                  border: "none",
                  color: "#d1dcd7",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  textAlign: "left",
                  width: "100%"
                }}
              >
                <User size={14} color="#c8f064" /> Lihat & Edit Profil
              </button>

              <button
                onClick={() => {
                  setIsProfileMenuOpen(false);
                  if (onOpenProfileModal) onOpenProfileModal("stats");
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 12px",
                  borderRadius: 8,
                  backgroundColor: "transparent",
                  border: "none",
                  color: "#d1dcd7",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  textAlign: "left",
                  width: "100%"
                }}
              >
                <Target size={14} color="#38bdf8" /> Target & Statistik Belajar
              </button>

              <button
                onClick={() => {
                  setIsProfileMenuOpen(false);
                  if (onOpenProfileModal) onOpenProfileModal("leaderboard");
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 12px",
                  borderRadius: 8,
                  backgroundColor: "transparent",
                  border: "none",
                  color: "#d1dcd7",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  textAlign: "left",
                  width: "100%"
                }}
              >
                <Trophy size={14} color="#facc15" /> Leaderboard Kelas
              </button>

              {onOpenRoomModal && (
                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    onOpenRoomModal();
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 12px",
                    borderRadius: 8,
                    backgroundColor: "transparent",
                    border: "none",
                    color: "#d1dcd7",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    textAlign: "left",
                    width: "100%"
                  }}
                >
                  <Swords size={14} color="#a855f7" /> Room Kompetisi Kuis
                </button>
              )}

              <div style={{ height: 1, backgroundColor: "#26322c", margin: "4px 0" }} />

              <button
                onClick={() => {
                  setIsProfileMenuOpen(false);
                  if (onLogout && confirm(`Keluar dari akun ${currentUser.name || currentUser.username}?`)) {
                    onLogout();
                  }
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 12px",
                  borderRadius: 8,
                  backgroundColor: "transparent",
                  border: "none",
                  color: "#f87171",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  textAlign: "left",
                  width: "100%"
                }}
              >
                <LogOut size={14} /> Keluar Akun
              </button>
            </div>
          )}

          {/* Profile Card Button */}
          <button
            className="profile-row-box"
            onClick={() => {
              if (currentUser) {
                setIsProfileMenuOpen(prev => !prev);
              } else if (onOpenAuthModal) {
                onOpenAuthModal();
              }
            }}
            style={{ cursor: "pointer", width: "100%", textAlign: "left" }}
            title={currentUser ? "Klik untuk menu opsi & profil" : "Klik untuk masuk / daftar akun"}
          >
            <div 
              className="avatar-box"
              style={{
                backgroundColor: currentUser?.avatar_color || "#25322e",
                color: "#ffffff",
                fontWeight: 700
              }}
            >
              {currentUser ? (currentUser.name || currentUser.username).slice(0, 2).toUpperCase() : "TK"}
            </div>
            <span>
              <strong>{currentUser ? (currentUser.name || currentUser.username) : "Tamu Belajar"}</strong>
              <small>{currentUser ? `@${currentUser.username} • ${currentUser.school_class || "Kelas XII"}` : "Klik Masuk / Daftar"}</small>
            </span>
            <span 
              className="profile-more-dots"
              onClick={(e) => {
                if (currentUser) {
                  e.stopPropagation();
                  setIsProfileMenuOpen(prev => !prev);
                }
              }}
            >
              •••
            </span>
          </button>
        </div>
      </aside>
  );
}
