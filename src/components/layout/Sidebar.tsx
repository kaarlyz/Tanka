import React, { useState, useRef, useEffect } from "react";
import { ChevronLeft, User, Target, Trophy, Swords, LogOut } from "lucide-react";
import { ActiveTab, DocumentItem, QuizQuestion, MistakeItem, Flashcard, UserAccount } from "../../types";

export interface SidebarProps {
  isMobileDrawerOpen: boolean;
  setIsMobileDrawerOpen: (val: boolean) => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  setIsAiPanelOpen?: (val: boolean) => void;
  documents?: DocumentItem[];
  activeDocId?: string | null;
  loadDocument?: (id: string) => void;
  handleDeleteDocument?: (id: string, e: React.MouseEvent) => void;
  handleDeleteAllDocuments?: () => void;
  docSearchQuery?: string;
  setDocSearchQuery?: (val: string) => void;
  quizQuestions?: QuizQuestion[];
  activeDocMistakes?: MistakeItem[];
  mistakes?: MistakeItem[];
  flashcards?: Flashcard[];
  fileInputRef?: React.RefObject<HTMLInputElement | null>;
  cameraInputRef?: React.RefObject<HTMLInputElement | null>;
  isUploading?: boolean;
  handleStageFiles?: (files: FileList | File[]) => void;
  setIsTopicModalOpen?: (val: boolean) => void;
  setIsYouTubeModalOpen?: (val: boolean) => void;
  setIsStagingModalOpen?: (val: boolean) => void;
  handleCreateNewDoc?: () => void;
  setTopicStep?: (step: 1 | 2 | 3) => void;
  currentUser?: UserAccount | null;
  onOpenAuthModal?: (mode?: "login" | "register") => void;
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

  // Mobile Swipe-to-Dismiss Gesture
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const [dragOffset, setDragOffset] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const handleTouchStart = (e: React.TouchEvent<HTMLElement>) => {
    if (!isMobileDrawerOpen) return;
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLElement>) => {
    if (touchStartXRef.current === null || !isMobileDrawerOpen) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = currentX - touchStartXRef.current;
    const deltaY = currentY - (touchStartYRef.current || 0);

    // If scrolling vertically, ignore horizontal swipe unless horizontal is strong
    if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaX) < 18) {
      return;
    }

    // Only allow dragging to the left (closing direction)
    if (deltaX < 0) {
      setDragOffset(deltaX);
    } else {
      setDragOffset(0);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLElement>) => {
    if (touchStartXRef.current === null || !isMobileDrawerOpen) return;
    const endX = e.changedTouches[0].clientX;
    const deltaX = endX - touchStartXRef.current;
    touchStartXRef.current = null;
    touchStartYRef.current = null;
    setIsDragging(false);

    // If swiped left by 45px or more, dismiss
    if (deltaX < -45) {
      setIsMobileDrawerOpen(false);
    }
    setDragOffset(0);
  };

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
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          "--drawer-translate": `${dragOffset}px`,
          transition: isDragging ? "none" : undefined
        } as React.CSSProperties}
      >
        <div className="sidebar-scroll-viewport">
          {/* Brand Row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexShrink: 0 }}>
            <div
              className="brand-box"
              style={{ padding: 0, cursor: "pointer" }}
              onClick={() => {
                setActiveTab("landing");
                setIsMobileDrawerOpen(false);
              }}
              title="Ke Halaman Depan (Landing Page)"
            >
              <div className="brand-symbol-box">t</div>
              <span>tanka.</span>
            </div>
            <button
              onClick={() => {
                setActiveTab("landing");
                setIsMobileDrawerOpen(false);
              }}
              className="landing-shortcut-btn"
              style={{
                fontSize: 10,
                fontFamily: "'DM Mono', monospace",
                fontWeight: 600,
                color: "#95a39d",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: 4,
                padding: "3px 7px",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 4
              }}
              title="Buka Landing Page"
            >
              <span>web</span>
              <span style={{ color: "#c8f064" }}>↗</span>
            </button>
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
                <div className="side-mark-box" style={{ color: "#c8f064", backgroundColor: "rgba(200, 240, 100, 0.15)" }}>
                  <Swords size={12} color="#c8f064" />
                </div>
                <span style={{ flex: 1, color: "#d6f58d", fontWeight: 700 }}>Room Kompetisi</span>
                <span style={{ fontSize: 9, backgroundColor: "#2b3c2a", color: "#c8f064", padding: "2px 6px", borderRadius: 999, fontWeight: 700 }}>
                  EVENT
                </span>
              </button>
            )}
          </nav>
        </div>

        {/* Sidebar Bottom: Dynamic Streak Widget & Profile Row with Action Popover */}
        <div ref={profileMenuRef} className="sidebar-bottom-pinned">
          {/* Real Dynamic Weekly Target & Streak Widget */}
          <div 
            className="streak-card-box" 
            style={{ margin: "0 0 6px", cursor: "pointer", transition: "transform 0.15s ease" }}
            onClick={() => {
              if (onOpenProfileModal) {
                onOpenProfileModal("stats");
              } else if (onOpenAuthModal && !currentUser) {
                onOpenAuthModal("register");
              }
            }}
            title="Klik untuk melihat statistik & target mingguan"
          >
            <div className="streak-top-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: 10.5 }}>
                <Target size={12} color="#c8f064" style={{ flexShrink: 0 }} /> Target mingguan
              </span>
              <strong style={{ fontFamily: "'DM Mono', monospace", color: "#c8f064", flexShrink: 0, fontSize: 10.5 }}>
                {currentUser?.active_days_this_week?.length || 0}/{currentUser?.target_weekly_days || 5} hari
              </strong>
            </div>
            <div className="streak-days" style={{ margin: "6px 0 5px" }}>
              {["S", "S", "R", "K", "J", "S", "M"].map((day, idx) => {
                const isDone = (currentUser?.active_days_this_week || []).includes(idx);
                return (
                  <span className={isDone ? "filled" : ""} key={`${day}-${idx}`} style={{ width: 22, height: 22, fontSize: 8.5, borderRadius: 4, transition: "all 0.2s ease" }}>
                    {isDone ? "✓" : day}
                  </span>
                );
              })}
            </div>
            <p style={{ margin: 0, fontSize: 10, color: "#8a9691", lineHeight: 1.3 }}>
              {currentUser 
                ? (currentUser.active_days_this_week?.length || 0) >= (currentUser.target_weekly_days || 5)
                  ? "Target mingguan tercapai."
                  : `${(currentUser.target_weekly_days || 5) - (currentUser.active_days_this_week?.length || 0)} hari belajar lagi untuk target.`
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
                onOpenAuthModal("login");
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

        {/* Floating Back Tab docked on the RIGHT BORDER of the mobile drawer */}
        {isMobileDrawerOpen && (
          <button
            className="mobile-only mobile-drawer-edge-tab"
            onClick={() => setIsMobileDrawerOpen(false)}
            style={{
              position: "absolute",
              right: -34,
              top: "42%",
              transform: "translateY(-50%)",
              width: 34,
              height: 64,
              backgroundColor: "#18221f",
              border: "1.5px solid #364942",
              borderLeft: "none",
              borderRadius: "0 18px 18px 0",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: "6px 2px 20px rgba(0, 0, 0, 0.45)",
              zIndex: 3005,
              padding: 0,
              touchAction: "none"
            }}
            title="Tutup menu samping"
            aria-label="Kembali"
          >
            <ChevronLeft size={22} color="#c8f064" strokeWidth={2.5} />
            <div style={{ width: 10, height: 2, backgroundColor: "rgba(200, 240, 100, 0.4)", borderRadius: 99, marginTop: 2 }} />
          </button>
        )}
      </aside>
  );
}
