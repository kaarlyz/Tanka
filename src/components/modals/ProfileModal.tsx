import React, { useState, useEffect } from "react";
import { 
  X, User, Target, Trophy, Swords, Check, Flame, 
  Clock, Award, BookOpen, Shield, Sparkles, LogOut, ChevronRight
} from "lucide-react";
import { UserAccount } from "../../types";

export interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount | null;
  activeTab: "profile" | "stats" | "leaderboard" | "room";
  setActiveTab: (tab: "profile" | "stats" | "leaderboard" | "room") => void;
  onUpdateProfile: (fields: Partial<UserAccount>) => Promise<boolean>;
  onLogout: () => void;
  onOpenRoomModal?: () => void;
}

const AVATAR_COLORS = [
  "#10b981", // Emerald
  "#6366f1", // Indigo
  "#f43f5e", // Rose
  "#f59e0b", // Amber
  "#06b6d4", // Cyan
  "#84cc16", // Lime
  "#a855f7", // Purple
  "#3b82f6"  // Blue
];

const DAYS_NAMES = ["S", "S", "R", "K", "J", "S", "M"];
const DAYS_FULL = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

export function ProfileModal({
  isOpen,
  onClose,
  currentUser,
  activeTab,
  setActiveTab,
  onUpdateProfile,
  onLogout,
  onOpenRoomModal
}: ProfileModalProps) {
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [schoolClass, setSchoolClass] = useState("");
  const [avatarColor, setAvatarColor] = useState("#10b981");
  const [targetWeeklyDays, setTargetWeeklyDays] = useState(5);
  const [isSaving, setIsSaving] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || "");
      setBio(currentUser.bio || "");
      setSchoolClass(currentUser.school_class || "Kelas XII");
      setAvatarColor(currentUser.avatar_color || "#10b981");
      setTargetWeeklyDays(currentUser.target_weekly_days || 5);
    }
  }, [currentUser]);

  useEffect(() => {
    if (isOpen && activeTab === "leaderboard") {
      setIsLoadingLeaderboard(true);
      fetch("/api/users/leaderboard")
        .then(res => res.json())
        .then(data => {
          if (data.success && data.leaderboard) {
            setLeaderboard(data.leaderboard);
          }
        })
        .catch(err => console.warn("Failed fetch leaderboard:", err))
        .finally(() => setIsLoadingLeaderboard(false));
    }
  }, [isOpen, activeTab]);

  if (!isOpen || !currentUser) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await onUpdateProfile({
      name: name.trim(),
      bio: bio.trim(),
      school_class: schoolClass.trim(),
      avatar_color: avatarColor,
      target_weekly_days: targetWeeklyDays
    });
    setIsSaving(false);
  };

  const activeDays = currentUser.active_days_this_week || [];
  const currentStreak = currentUser.streak_count || 1;
  const currentTarget = currentUser.target_weekly_days || targetWeeklyDays;
  const completedDaysCount = activeDays.length;
  const xp = currentUser.xp || 100;
  const level = Math.floor(xp / 100);
  const xpInCurrentLevel = xp % 100;
  const totalQuizzes = currentUser.quizzes_completed || 0;
  const correctQuizzes = currentUser.quiz_correct_count || 0;
  const accuracy = totalQuizzes > 0 ? Math.round((correctQuizzes / (totalQuizzes * 5)) * 100) : 95;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(10, 14, 13, 0.75)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10001,
        padding: 16
      }}
    >
      <div
        className="modal-scale-in"
        style={{
          backgroundColor: "#161b19",
          color: "#e6ece9",
          borderRadius: 20,
          maxWidth: 580,
          width: "100%",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 60px rgba(0, 0, 0, 0.55)",
          border: "1.5px solid #2a3430",
          overflow: "hidden"
        }}
      >
        {/* Top Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "18px 24px 14px",
            borderBottom: "1px solid #252e2a"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                backgroundColor: avatarColor,
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: 14,
                boxShadow: `0 0 16px ${avatarColor}44`
              }}
            >
              {(name || currentUser.username).slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#f0f5f2" }}>
                {name || currentUser.username}
              </h3>
              <span style={{ fontSize: 11, color: "#8a9691", fontFamily: "'DM Mono', monospace" }}>
                @{currentUser.username} • {schoolClass || "Siswa SMA"}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#8a9691",
              cursor: "pointer",
              padding: 6,
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid #252e2a",
            padding: "0 16px",
            gap: 6,
            backgroundColor: "#131715"
          }}
        >
          <button
            onClick={() => setActiveTab("profile")}
            style={{
              padding: "10px 14px",
              background: "transparent",
              border: "none",
              borderBottom: activeTab === "profile" ? "2px solid #c8f064" : "2px solid transparent",
              color: activeTab === "profile" ? "#c8f064" : "#8a9691",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            <User size={14} /> Profil & Info
          </button>
          <button
            onClick={() => setActiveTab("stats")}
            style={{
              padding: "10px 14px",
              background: "transparent",
              border: "none",
              borderBottom: activeTab === "stats" ? "2px solid #c8f064" : "2px solid transparent",
              color: activeTab === "stats" ? "#c8f064" : "#8a9691",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            <Target size={14} /> Target & Statistik
          </button>
          <button
            onClick={() => setActiveTab("leaderboard")}
            style={{
              padding: "10px 14px",
              background: "transparent",
              border: "none",
              borderBottom: activeTab === "leaderboard" ? "2px solid #c8f064" : "2px solid transparent",
              color: activeTab === "leaderboard" ? "#c8f064" : "#8a9691",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            <Trophy size={14} /> Leaderboard
          </button>
          <button
            onClick={() => {
              if (onOpenRoomModal) {
                onClose();
                onOpenRoomModal();
              } else {
                setActiveTab("room");
              }
            }}
            style={{
              padding: "10px 14px",
              background: "transparent",
              border: "none",
              borderBottom: activeTab === "room" ? "2px solid #c8f064" : "2px solid transparent",
              color: activeTab === "room" ? "#c8f064" : "#8a9691",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            <Swords size={14} /> Room Kompetisi
          </button>
        </div>

        {/* Modal Body Scrollable */}
        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
          {/* TAB 1: PROFIL & INFO */}
          {activeTab === "profile" && (
            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#8a9691", marginBottom: 6 }}>
                  PILIH WARNA AVATAR
                </label>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  {AVATAR_COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setAvatarColor(c)}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        backgroundColor: c,
                        border: avatarColor === c ? "2px solid #ffffff" : "2px solid transparent",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.15s ease"
                      }}
                    >
                      {avatarColor === c && <Check size={14} color="#ffffff" />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#8a9691", marginBottom: 6 }}>
                  NAMA LENGKAP
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Nama Lengkap"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 8,
                    backgroundColor: "#1e2622",
                    border: "1px solid #33403a",
                    color: "#ffffff",
                    fontSize: 13,
                    boxSizing: "border-box"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#8a9691", marginBottom: 6 }}>
                  KELAS / SEKOLAH
                </label>
                <input
                  type="text"
                  value={schoolClass}
                  onChange={e => setSchoolClass(e.target.value)}
                  placeholder="Contoh: Kelas XII-6 SMA"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 8,
                    backgroundColor: "#1e2622",
                    border: "1px solid #33403a",
                    color: "#ffffff",
                    fontSize: 13,
                    boxSizing: "border-box"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#8a9691", marginBottom: 6 }}>
                  BIO / MOTTO BELAJAR
                </label>
                <textarea
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  rows={3}
                  placeholder="Tuliskan target UTBK atau motto belajarmu di sini..."
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 8,
                    backgroundColor: "#1e2622",
                    border: "1px solid #33403a",
                    color: "#ffffff",
                    fontSize: 13,
                    resize: "none",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Yakin ingin keluar dari akun?")) {
                      onLogout();
                    }
                  }}
                  style={{
                    backgroundColor: "transparent",
                    color: "#f87171",
                    border: "1px solid rgba(248, 113, 113, 0.3)",
                    borderRadius: 8,
                    padding: "8px 14px",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6
                  }}
                >
                  <LogOut size={14} /> Keluar Akun
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  style={{
                    backgroundColor: "#c8f064",
                    color: "#161b19",
                    border: "none",
                    borderRadius: 8,
                    padding: "10px 20px",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: isSaving ? "not-allowed" : "pointer"
                  }}
                >
                  {isSaving ? "Menyimpan..." : "Simpan Profil"}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: TARGET & STATISTIK */}
          {activeTab === "stats" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {/* Streak & Level Highlights */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div
                  style={{
                    backgroundColor: "#1b2320",
                    border: "1px solid #2b3832",
                    borderRadius: 12,
                    padding: 14,
                    display: "flex",
                    alignItems: "center",
                    gap: 12
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      backgroundColor: "rgba(249, 115, 22, 0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fb923c"
                    }}
                  >
                    <Flame size={22} />
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: "#8a9691", fontWeight: 600 }}>STREAK BELAJAR</span>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#ffffff" }}>
                      {currentStreak} Hari Berturut
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: "#1b2320",
                    border: "1px solid #2b3832",
                    borderRadius: 12,
                    padding: 14,
                    display: "flex",
                    alignItems: "center",
                    gap: 12
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      backgroundColor: "rgba(200, 240, 100, 0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#c8f064"
                    }}
                  >
                    <Sparkles size={22} />
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: "#8a9691", fontWeight: 600 }}>LEVEL & PENGALAMAN</span>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#ffffff" }}>
                      Lv. {level} ({xp} XP)
                    </div>
                  </div>
                </div>
              </div>

              {/* Weekly Tracker & Target Config */}
              <div
                style={{
                  backgroundColor: "#1b2320",
                  border: "1px solid #2b3832",
                  borderRadius: 14,
                  padding: "16px 18px"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#f0f5f2" }}>Target Mingguan</span>
                    <p style={{ margin: 0, fontSize: 11, color: "#8a9691" }}>
                      {completedDaysCount >= currentTarget 
                        ? "🎉 Hebat! Kamu sudah mencapai target minggu ini." 
                        : `${currentTarget - completedDaysCount} hari belajar lagi untuk mencapai target.`}
                    </p>
                  </div>
                  <strong style={{ fontSize: 16, fontFamily: "'DM Mono', monospace", color: "#c8f064" }}>
                    {completedDaysCount}/{currentTarget} hari
                  </strong>
                </div>

                {/* 7 Days Visual Circles */}
                <div style={{ display: "flex", justifyContent: "space-between", gap: 6, margin: "14px 0" }}>
                  {DAYS_NAMES.map((day, idx) => {
                    const isDone = activeDays.includes(idx);
                    return (
                      <div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                        <div
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: "50%",
                            backgroundColor: isDone ? "#c8f064" : "#242e2a",
                            color: isDone ? "#161b19" : "#8a9691",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 700,
                            fontSize: 12,
                            boxShadow: isDone ? "0 0 12px rgba(200, 240, 100, 0.35)" : "none"
                          }}
                        >
                          {isDone ? "✓" : day}
                        </div>
                        <span style={{ fontSize: 9, color: "#71807a", fontFamily: "'DM Mono', monospace" }}>
                          {DAYS_FULL[idx].slice(0, 3)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Adjust Target Days */}
                <div style={{ borderTop: "1px solid #28332e", paddingTop: 12, marginTop: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#8a9691", display: "block", marginBottom: 8 }}>
                    UBAH TARGET BELAJAR:
                  </span>
                  <div style={{ display: "flex", gap: 8 }}>
                    {[3, 4, 5, 6, 7].map(num => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => {
                          setTargetWeeklyDays(num);
                          onUpdateProfile({ target_weekly_days: num });
                        }}
                        style={{
                          flex: 1,
                          padding: "6px 0",
                          borderRadius: 8,
                          backgroundColor: currentTarget === num ? "#2b3c2c" : "#202925",
                          border: currentTarget === num ? "1.5px solid #c8f064" : "1px solid #2e3a34",
                          color: currentTarget === num ? "#c8f064" : "#a1ada8",
                          fontWeight: 700,
                          fontSize: 12,
                          cursor: "pointer"
                        }}
                      >
                        {num} Hari
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Additional Stats */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div style={{ backgroundColor: "#19201d", border: "1px solid #26312c", borderRadius: 10, padding: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#8a9691", fontSize: 11, marginBottom: 4 }}>
                    <BookOpen size={13} /> TOTAL KUIS SELESAI
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#ffffff" }}>
                    {totalQuizzes} Paket Kuis
                  </div>
                </div>

                <div style={{ backgroundColor: "#19201d", border: "1px solid #26312c", borderRadius: 10, padding: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#8a9691", fontSize: 11, marginBottom: 4 }}>
                    <Award size={13} /> AKURASI JAWABAN
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#c8f064" }}>
                    {accuracy}% Tepat
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LEADERBOARD KELAS */}
          {activeTab === "leaderboard" && (
            <div>
              <div style={{ marginBottom: 14 }}>
                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#f0f5f2" }}>
                  Papan Peringkat Belajar Siswa
                </h4>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: "#8a9691" }}>
                  Dihitung berdasarkan total XP, konsistensi streak hari, dan skor kuis.
                </p>
              </div>

              {isLoadingLeaderboard ? (
                <div style={{ padding: "30px 0", textAlign: "center", color: "#8a9691", fontSize: 13 }}>
                  Memuat peringkat siswa...
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {leaderboard.map((item, idx) => {
                    const isSelf = item.id === currentUser.id;
                    const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`;
                    return (
                      <div
                        key={item.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "10px 14px",
                          borderRadius: 10,
                          backgroundColor: isSelf ? "#222f25" : "#1b2320",
                          border: isSelf ? "1.5px solid #c8f064" : "1px solid #2b3832"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <span style={{ fontSize: 14, fontWeight: 800, width: 24, textAlign: "center", color: idx < 3 ? "#ffffff" : "#71807a" }}>
                            {medal}
                          </span>
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: "50%",
                              backgroundColor: item.avatar_color || "#10b981",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 700,
                              fontSize: 12,
                              color: "#ffffff"
                            }}
                          >
                            {(item.name || item.username).slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: isSelf ? "#c8f064" : "#ffffff" }}>
                              {item.name || item.username} {isSelf && "(Kamu)"}
                            </div>
                            <div style={{ fontSize: 10, color: "#8a9691" }}>
                              @{item.username} • {item.school_class || "Kelas XII"}
                            </div>
                          </div>
                        </div>

                        <div style={{ textAlign: "right" }}>
                          <strong style={{ fontSize: 13, color: "#c8f064", fontFamily: "'DM Mono', monospace" }}>
                            {item.xp} XP
                          </strong>
                          <div style={{ fontSize: 10, color: "#8a9691" }}>
                            🔥 {item.streak_count} hari • {item.accuracy || 90}% benar
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: ROOM KOMPETISI SHORTCUT */}
          {activeTab === "room" && (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  backgroundColor: "rgba(200, 240, 100, 0.15)",
                  color: "#c8f064",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 14px"
                }}
              >
                <Swords size={28} />
              </div>
              <h4 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700, color: "#f0f5f2" }}>
                Multiplayer Room & Event Kuis
              </h4>
              <p style={{ margin: "0 0 20px", fontSize: 12, color: "#8a9691", maxWidth: 380, marginInline: "auto" }}>
                Buat room dari materi pembelajaran, bagikan kode ke teman sekelas, dan bersaing menjawab kuis secara real-time dengan status siap & live leaderboard!
              </p>
              <button
                onClick={() => {
                  onClose();
                  if (onOpenRoomModal) onOpenRoomModal();
                }}
                style={{
                  backgroundColor: "#c8f064",
                  color: "#161b19",
                  border: "none",
                  borderRadius: 10,
                  padding: "12px 24px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8
                }}
              >
                Buka Arena Room Kompetisi <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
