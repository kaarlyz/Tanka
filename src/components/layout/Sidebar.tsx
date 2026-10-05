import React from "react";
import { Plus, Trash2, Upload, Camera, Compass, X } from "lucide-react";
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
  quizQuestions?: QuizQuestion[];
  activeDocMistakes?: MistakeItem[];
  mistakes?: MistakeItem[];
  flashcards?: Flashcard[];
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  cameraInputRef: React.RefObject<HTMLInputElement | null>;
  isUploading?: boolean;
  handleStageFiles: (files: FileList | File[]) => void;
  setIsTopicModalOpen: (val: boolean) => void;
  setIsStagingModalOpen?: (val: boolean) => void;
  handleCreateNewDoc?: () => void;
  setTopicStep?: (step: 1 | 2 | 3) => void;
  currentUser?: UserAccount | null;
  onOpenAuthModal?: () => void;
  onLogout?: () => void;
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
  quizQuestions,
  activeDocMistakes,
  mistakes,
  flashcards,
  fileInputRef,
  cameraInputRef,
  isUploading,
  handleStageFiles,
  setIsTopicModalOpen,
  setIsStagingModalOpen,
  handleCreateNewDoc,
  setTopicStep,
  currentUser,
  onOpenAuthModal,
  onLogout
}: SidebarProps) {
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
          </nav>

          {/* Materi Tersimpan & Actions */}
          <div style={{ display: "flex", flexDirection: "column", flexShrink: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, padding: "0 4px" }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#86938e", fontFamily: "'DM Mono', monospace", letterSpacing: 1.2 }}>
                MATERI TERSIMPAN ({documents.length})
              </span>
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

            {/* Document list */}
            <div className="no-scrollbar" style={{ maxHeight: 200, overflowY: "auto", paddingRight: 2 }}>
              {documents.length === 0 ? (
                <div style={{ padding: "18px 8px", color: "#6e7c77", fontSize: 12.5, textAlign: "center" }}>
                  Belum ada dokumen. Unggah atau buat modul baru.
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

            {/* Quick Action Buttons */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 8, marginBottom: 6 }}>
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
            </div>

            <button
              onClick={() => {
                setIsMobileDrawerOpen(false);
                setIsTopicModalOpen(true);
                if (setTopicStep) setTopicStep(1);
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

        {/* Sidebar Bottom: Streak Widget & Profile Row */}
        <div style={{ flexShrink: 0, marginTop: "auto", paddingTop: 16, paddingBottom: 24 }}>
          <div className="streak-card-box" style={{ margin: "4px 0 10px" }}>
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

          <button
            className="profile-row-box"
            onClick={() => {
              if (currentUser) {
                if (onLogout && confirm(`Keluar dari akun ${currentUser.name || currentUser.username}?`)) {
                  onLogout();
                }
              } else if (onOpenAuthModal) {
                onOpenAuthModal();
              }
            }}
            style={{ cursor: "pointer", width: "100%", textAlign: "left" }}
            title={currentUser ? "Klik untuk keluar akun" : "Klik untuk masuk / daftar akun"}
          >
            <div className="avatar-box">
              {currentUser ? (currentUser.name || currentUser.username).slice(0, 2).toUpperCase() : "TK"}
            </div>
            <span>
              <strong>{currentUser ? (currentUser.name || currentUser.username) : "Tamu Belajar"}</strong>
              <small>{currentUser ? `@${currentUser.username} • Keluar` : "Klik Masuk / Daftar"}</small>
            </span>
            <span className="profile-more-dots">•••</span>
          </button>
        </div>
      </aside>
  );
}
