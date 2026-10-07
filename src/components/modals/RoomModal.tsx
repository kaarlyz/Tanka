import React, { useState, useEffect } from "react";
import { 
  X, Swords, Users, Copy, Check, Play, Trophy, 
  Sparkles, Award, ArrowRight, Share2, RefreshCw, CheckCircle2, AlertCircle
} from "lucide-react";
import { UserAccount, StudyRoom, RoomParticipant } from "../../types";

export interface RoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount | null;
  activeDocId: string | null;
  activeDocTitle: string | null;
  documents: Array<{ id: string; title: string }>;
  showNotice: (msg: string) => void;
  onOpenAuthModal: () => void;
}

export function RoomModal({
  isOpen,
  onClose,
  currentUser,
  activeDocId,
  activeDocTitle,
  documents,
  showNotice,
  onOpenAuthModal
}: RoomModalProps) {
  const [viewState, setViewState] = useState<"hub" | "lobby" | "playing" | "result">("hub");
  const [hubTab, setHubTab] = useState<"create" | "join">("create");
  
  // Create room inputs
  const [selectedDocId, setSelectedDocId] = useState<string>(activeDocId || "");
  const [roomTitle, setRoomTitle] = useState<string>("");
  const [isCreating, setIsCreating] = useState(false);

  // Join room input
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  // Current room data
  const [currentRoom, setCurrentRoom] = useState<StudyRoom | null>(null);
  const [participants, setParticipants] = useState<RoomParticipant[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  
  // Quiz play state
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [qIndex: number]: number }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Copied feedback
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (activeDocId) {
      setSelectedDocId(activeDocId);
    }
  }, [activeDocId]);

  useEffect(() => {
    if (activeDocTitle && !roomTitle) {
      setRoomTitle(`Kompetisi Kuis: ${activeDocTitle}`);
    }
  }, [activeDocTitle]);

  // Polling room status when in lobby
  useEffect(() => {
    if (!isOpen || !currentRoom?.id || viewState === "result") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/rooms/${currentRoom.id}`);
        const data = await res.json();
        if (res.ok && data.room) {
          setCurrentRoom(data.room);
          setParticipants(data.participants || []);
          if (data.room.status === "active" && viewState === "lobby" && data.questions?.length > 0) {
            setQuestions(data.questions);
            setViewState("playing");
          } else if (data.room.status === "finished" && viewState === "playing") {
            setViewState("result");
          }
        }
      } catch (e) {
        console.warn("Poll room error:", e);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [isOpen, currentRoom?.id, viewState]);

  if (!isOpen) return null;

  if (!currentUser) {
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
          style={{
            backgroundColor: "#161b19",
            color: "#e6ece9",
            borderRadius: 20,
            maxWidth: 420,
            width: "100%",
            padding: 24,
            textAlign: "center",
            boxShadow: "0 25px 60px rgba(0,0,0,0.55)",
            border: "1.5px solid #2a3430"
          }}
        >
          <div
            style={{
              width: 50,
              height: 50,
              borderRadius: "50%",
              backgroundColor: "rgba(200, 240, 100, 0.15)",
              color: "#c8f064",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 14px"
            }}
          >
            <Swords size={26} />
          </div>
          <h3 style={{ margin: "0 0 6px", fontSize: 17, fontWeight: 700 }}>Masuk Akun Diperlukan</h3>
          <p style={{ margin: "0 0 20px", fontSize: 13, color: "#8a9691" }}>
            Kamu harus masuk atau membuat akun terlebih dahulu untuk membuat atau bergabung ke room kompetisi kuis.
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: "10px 0",
                borderRadius: 8,
                backgroundColor: "#202824",
                border: "1px solid #303c36",
                color: "#a1ada8",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              Batal
            </button>
            <button
              onClick={() => {
                onClose();
                onOpenAuthModal();
              }}
              style={{
                flex: 1,
                padding: "10px 0",
                borderRadius: 8,
                backgroundColor: "#c8f064",
                border: "none",
                color: "#161b19",
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              Masuk / Daftar
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docId: selectedDocId || "global",
          title: roomTitle.trim() || "Kompetisi Kuis",
          userId: currentUser.id,
          userName: currentUser.name || currentUser.username,
          schoolClass: currentUser.school_class || "Kelas XII",
          avatarColor: currentUser.avatar_color || "#10b981",
          quizCount: 5
        })
      });
      const data = await res.json();
      if (res.ok && data.room) {
        setCurrentRoom(data.room);
        setParticipants(data.participants || []);
        setViewState("lobby");
        showNotice(`Room ${data.room.id} berhasil dibuat! Bagikan kode ke temanmu.`);
      } else {
        showNotice(data.error || "Gagal membuat room");
      }
    } catch {
      showNotice("Gagal terhubung ke server");
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = joinCodeInput.trim().toUpperCase();
    if (!code) return;

    setIsJoining(true);
    try {
      const res = await fetch(`/api/rooms/${code}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          userName: currentUser.name || currentUser.username,
          schoolClass: currentUser.school_class || "Kelas XII",
          avatarColor: currentUser.avatar_color || "#6366f1"
        })
      });
      const data = await res.json();
      if (res.ok && data.room) {
        setCurrentRoom(data.room);
        setParticipants(data.participants || []);
        setViewState("lobby");
        showNotice(`Berhasil bergabung ke room ${data.room.id}!`);
      } else {
        showNotice(data.error || "Room tidak ditemukan");
      }
    } catch {
      showNotice("Koneksi gagal");
    } finally {
      setIsJoining(false);
    }
  };

  const myParticipant = participants.find(p => p.user_id === currentUser.id);
  const isHost = currentRoom?.hostUserId === currentUser.id;

  const handleToggleReady = async () => {
    if (!currentRoom || !myParticipant) return;
    const newReady = myParticipant.is_ready ? 0 : 1;
    try {
      const res = await fetch(`/api/rooms/${currentRoom.id}/ready`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          isReady: newReady === 1
        })
      });
      const data = await res.json();
      if (res.ok && data.participants) {
        setParticipants(data.participants);
        showNotice(newReady ? "Status: Kamu SIAP bertanding! ✓" : "Status: Menunggu bersiap...");
      }
    } catch {
      showNotice("Gagal memperbarui status");
    }
  };

  const handleStartMatch = async () => {
    if (!currentRoom) return;
    try {
      const res = await fetch(`/api/rooms/${currentRoom.id}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id })
      });
      const data = await res.json();
      if (res.ok && data.room) {
        setCurrentRoom(data.room);
        setQuestions(data.questions || []);
        setCurrentQIndex(0);
        setSelectedAnswers({});
        setViewState("playing");
        showNotice("Kompetisi kuis dimulai! Selamat berjuang!");
      } else {
        showNotice(data.error || "Gagal memulai");
      }
    } catch {
      showNotice("Koneksi gagal");
    }
  };

  const handleSubmitQuizAnswers = async () => {
    if (!currentRoom) return;
    setIsSubmitting(true);
    let correctCount = 0;
    questions.forEach((q, idx) => {
      const userChoice = selectedAnswers[idx];
      const correctIdx = ["A", "B", "C", "D", "E"].indexOf(q.answer);
      if (userChoice !== undefined && (userChoice === correctIdx || q.options[userChoice]?.includes(q.answer))) {
        correctCount++;
      }
    });

    const calculatedScore = Math.round((correctCount / (questions.length || 1)) * 100);

    try {
      const res = await fetch(`/api/rooms/${currentRoom.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          score: calculatedScore,
          correctAnswers: correctCount,
          totalAnswered: questions.length
        })
      });
      const data = await res.json();
      if (res.ok && data.leaderboard) {
        setParticipants(data.leaderboard);
        setViewState("result");
        showNotice(`Jawaban terkirim! Skor kamu: ${calculatedScore}`);
      }
    } catch {
      showNotice("Gagal mengirim jawaban");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyRoomCode = () => {
    if (!currentRoom) return;
    navigator.clipboard.writeText(currentRoom.id);
    setIsCopied(true);
    showNotice(`Kode room ${currentRoom.id} disalin! Kirim ke temanmu.`);
    setTimeout(() => setIsCopied(false), 2000);
  };

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
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 22px",
            borderBottom: "1px solid #252e2a"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: "rgba(200, 240, 100, 0.15)",
                color: "#c8f064",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <Swords size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#f0f5f2" }}>
                {viewState === "hub" && "Arena Room Kompetisi Kuis"}
                {viewState === "lobby" && `Lobby Room: ${currentRoom?.id}`}
                {viewState === "playing" && `Bertanding: Soal ${currentQIndex + 1}/${questions.length}`}
                {viewState === "result" && "Papan Skor & Leaderboard Room"}
              </h3>
              <span style={{ fontSize: 11, color: "#8a9691" }}>
                {viewState === "hub" && "Tantang teman sekelas dan uji penguasaan materi"}
                {viewState === "lobby" && currentRoom?.title}
                {viewState === "playing" && "Jawab dengan cepat & teliti!"}
                {viewState === "result" && "Hasil pertandingan kuis bareng"}
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
              borderRadius: 8
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* BODY CONTENT */}
        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
          {/* VIEW: HUB (CREATE OR JOIN) */}
          {viewState === "hub" && (
            <div>
              <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                <button
                  onClick={() => setHubTab("create")}
                  style={{
                    flex: 1,
                    padding: "10px 0",
                    borderRadius: 10,
                    backgroundColor: hubTab === "create" ? "#222f27" : "#1a211e",
                    border: hubTab === "create" ? "1.5px solid #c8f064" : "1px solid #2a3430",
                    color: hubTab === "create" ? "#c8f064" : "#8a9691",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: "pointer"
                  }}
                >
                  Buat Room Baru
                </button>
                <button
                  onClick={() => setHubTab("join")}
                  style={{
                    flex: 1,
                    padding: "10px 0",
                    borderRadius: 10,
                    backgroundColor: hubTab === "join" ? "#222f27" : "#1a211e",
                    border: hubTab === "join" ? "1.5px solid #c8f064" : "1px solid #2a3430",
                    color: hubTab === "join" ? "#c8f064" : "#8a9691",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: "pointer"
                  }}
                >
                  Gabung Room Teman
                </button>
              </div>

              {hubTab === "create" ? (
                <form onSubmit={handleCreateRoom} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#8a9691", marginBottom: 6 }}>
                      PILIH MATERI KUIS
                    </label>
                    <select
                      value={selectedDocId}
                      onChange={e => setSelectedDocId(e.target.value)}
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
                    >
                      <option value="">Pilih dari modul tersimpan...</option>
                      {documents.map(d => (
                        <option key={d.id} value={d.id}>
                          {d.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#8a9691", marginBottom: 6 }}>
                      JUDUL EVENT ROOM
                    </label>
                    <input
                      type="text"
                      value={roomTitle}
                      onChange={e => setRoomTitle(e.target.value)}
                      placeholder="Contoh: Kuis Bareng Kimmy & Eka"
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

                  <div style={{ marginTop: 8 }}>
                    <button
                      type="submit"
                      disabled={isCreating}
                      style={{
                        width: "100%",
                        padding: "12px 0",
                        borderRadius: 10,
                        backgroundColor: "#c8f064",
                        color: "#161b19",
                        border: "none",
                        fontWeight: 700,
                        fontSize: 14,
                        cursor: isCreating ? "not-allowed" : "pointer"
                      }}
                    >
                      {isCreating ? "Membuat Room..." : "Buat Room & Dapatkan Kode"}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleJoinRoom} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#8a9691", marginBottom: 6 }}>
                      MASUKKAN KODE ROOM
                    </label>
                    <input
                      type="text"
                      value={joinCodeInput}
                      onChange={e => setJoinCodeInput(e.target.value.toUpperCase())}
                      placeholder="Contoh: TNK-K9X2"
                      style={{
                        width: "100%",
                        padding: "12px 14px",
                        borderRadius: 8,
                        backgroundColor: "#1e2622",
                        border: "1px solid #33403a",
                        color: "#c8f064",
                        fontSize: 16,
                        fontWeight: 700,
                        letterSpacing: 2,
                        textAlign: "center",
                        boxSizing: "border-box"
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isJoining || !joinCodeInput.trim()}
                    style={{
                      width: "100%",
                      padding: "12px 0",
                      borderRadius: 10,
                      backgroundColor: "#c8f064",
                      color: "#161b19",
                      border: "none",
                      fontWeight: 700,
                      fontSize: 14,
                      cursor: isJoining ? "not-allowed" : "pointer"
                    }}
                  >
                    {isJoining ? "Bergabung..." : "Gabung ke Room"}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* VIEW: LOBBY */}
          {viewState === "lobby" && currentRoom && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {/* Invite Code Box */}
              <div
                style={{
                  backgroundColor: "#1e2823",
                  border: "1.5px dashed #3a4c42",
                  borderRadius: 14,
                  padding: "14px 18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between"
                }}
              >
                <div>
                  <span style={{ fontSize: 11, color: "#8a9691", fontWeight: 600 }}>KODE ROOM UNDANGAN:</span>
                  <div style={{ fontSize: 24, fontWeight: 800, color: "#c8f064", letterSpacing: 3, fontFamily: "'DM Mono', monospace" }}>
                    {currentRoom.id}
                  </div>
                </div>
                <button
                  onClick={copyRoomCode}
                  style={{
                    backgroundColor: isCopied ? "#22c55e" : "#2a3932",
                    color: isCopied ? "#ffffff" : "#c8f064",
                    border: "none",
                    borderRadius: 8,
                    padding: "8px 14px",
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6
                  }}
                >
                  {isCopied ? <Check size={14} /> : <Copy size={14} />}
                  {isCopied ? "Tersalin!" : "Salin Kode"}
                </button>
              </div>

              {/* Participants List */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#8a9691" }}>
                    PESERTA YANG BERGABUNG ({participants.length})
                  </span>
                  <span style={{ fontSize: 11, color: "#71807a" }}>
                    Status otomatis diperbarui
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {participants.map((p) => {
                    const isMe = p.user_id === currentUser.id;
                    const isRoomHost = p.user_id === currentRoom.hostUserId;
                    return (
                      <div
                        key={p.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "10px 14px",
                          borderRadius: 10,
                          backgroundColor: "#1b2320",
                          border: isMe ? "1.5px solid #c8f064" : "1px solid #2b3832"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: "50%",
                              backgroundColor: p.avatar_color || "#10b981",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 700,
                              fontSize: 12,
                              color: "#ffffff"
                            }}
                          >
                            {(p.user_name || "TK").slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#ffffff" }}>
                              {p.user_name} {isMe && "(Kamu)"} {isRoomHost && "👑"}
                            </div>
                            <div style={{ fontSize: 10, color: "#8a9691" }}>
                              {p.school_class || "Kelas XII"}
                            </div>
                          </div>
                        </div>

                        <div>
                          {p.is_ready ? (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                backgroundColor: "rgba(34, 197, 94, 0.15)",
                                color: "#4ade80",
                                border: "1px solid rgba(34, 197, 94, 0.3)",
                                borderRadius: 6,
                                padding: "3px 8px",
                                fontSize: 11,
                                fontWeight: 700
                              }}
                            >
                              <CheckCircle2 size={12} /> SIAP
                            </span>
                          ) : (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                backgroundColor: "rgba(234, 179, 8, 0.12)",
                                color: "#facc15",
                                border: "1px solid rgba(234, 179, 8, 0.25)",
                                borderRadius: 6,
                                padding: "3px 8px",
                                fontSize: 11,
                                fontWeight: 600
                              }}
                            >
                              Belum Siap
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Ready / Start Actions */}
              <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                {myParticipant && (
                  <button
                    onClick={handleToggleReady}
                    style={{
                      flex: 1,
                      padding: "12px 0",
                      borderRadius: 10,
                      backgroundColor: myParticipant.is_ready ? "#26352c" : "#22c55e",
                      color: myParticipant.is_ready ? "#c8f064" : "#ffffff",
                      border: myParticipant.is_ready ? "1.5px solid #c8f064" : "none",
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6
                    }}
                  >
                    <CheckCircle2 size={16} />
                    {myParticipant.is_ready ? "Status: Kamu Siap ✓ (Batalkan)" : "Saya Siap Bertanding! ✓"}
                  </button>
                )}

                {isHost && (
                  <button
                    onClick={handleStartMatch}
                    style={{
                      flex: 1,
                      padding: "12px 0",
                      borderRadius: 10,
                      backgroundColor: "#c8f064",
                      color: "#161b19",
                      border: "none",
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6
                    }}
                  >
                    <Play size={16} /> Mulai Kompetisi!
                  </button>
                )}
              </div>
            </div>
          )}

          {/* VIEW: PLAYING (QUIZ ARENA) */}
          {viewState === "playing" && questions.length > 0 && (
            <div>
              {/* Question Progress */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#c8f064", fontFamily: "'DM Mono', monospace" }}>
                  SOAL {currentQIndex + 1} DARI {questions.length}
                </span>
                <span style={{ fontSize: 11, color: "#8a9691" }}>
                  Terjawab: {Object.keys(selectedAnswers).length}/{questions.length}
                </span>
              </div>

              {/* Question Card */}
              <div
                style={{
                  backgroundColor: "#1b2320",
                  border: "1px solid #2b3832",
                  borderRadius: 12,
                  padding: 18,
                  marginBottom: 16
                }}
              >
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#f0f5f2", lineHeight: 1.6 }}>
                  {questions[currentQIndex]?.question}
                </p>
              </div>

              {/* Options */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                {questions[currentQIndex]?.options?.map((opt: string, optIdx: number) => {
                  const isSelected = selectedAnswers[currentQIndex] === optIdx;
                  return (
                    <button
                      key={optIdx}
                      onClick={() => {
                        setSelectedAnswers(prev => ({ ...prev, [currentQIndex]: optIdx }));
                      }}
                      style={{
                        padding: "12px 16px",
                        borderRadius: 10,
                        backgroundColor: isSelected ? "#263a2c" : "#1e2622",
                        border: isSelected ? "1.5px solid #c8f064" : "1px solid #2e3a34",
                        color: isSelected ? "#c8f064" : "#d1dcd7",
                        textAlign: "left",
                        fontSize: 13,
                        fontWeight: isSelected ? 700 : 500,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 10
                      }}
                    >
                      <span
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: "50%",
                          backgroundColor: isSelected ? "#c8f064" : "#2a3630",
                          color: isSelected ? "#161b19" : "#a1ada8",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 11,
                          fontWeight: 700
                        }}
                      >
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>

              {/* Navigation */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <button
                  disabled={currentQIndex === 0}
                  onClick={() => setCurrentQIndex(prev => prev - 1)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 8,
                    backgroundColor: "#1e2622",
                    border: "1px solid #2e3a34",
                    color: currentQIndex === 0 ? "#52615b" : "#a1ada8",
                    cursor: currentQIndex === 0 ? "not-allowed" : "pointer",
                    fontSize: 12,
                    fontWeight: 600
                  }}
                >
                  ← Soal Sebelumnya
                </button>

                {currentQIndex < questions.length - 1 ? (
                  <button
                    onClick={() => setCurrentQIndex(prev => prev + 1)}
                    style={{
                      padding: "8px 20px",
                      borderRadius: 8,
                      backgroundColor: "#c8f064",
                      color: "#161b19",
                      border: "none",
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: 700
                    }}
                  >
                    Soal Berikutnya →
                  </button>
                ) : (
                  <button
                    disabled={isSubmitting}
                    onClick={handleSubmitQuizAnswers}
                    style={{
                      padding: "8px 20px",
                      borderRadius: 8,
                      backgroundColor: "#22c55e",
                      color: "#ffffff",
                      border: "none",
                      cursor: isSubmitting ? "not-allowed" : "pointer",
                      fontSize: 12,
                      fontWeight: 700
                    }}
                  >
                    {isSubmitting ? "Mengirim Skor..." : "Kirim Jawaban & Lihat Hasil 🏆"}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* VIEW: RESULT LEADERBOARD */}
          {viewState === "result" && (
            <div>
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <div
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: "50%",
                    backgroundColor: "rgba(200, 240, 100, 0.15)",
                    color: "#c8f064",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 10px"
                  }}
                >
                  <Trophy size={26} />
                </div>
                <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#ffffff" }}>
                  Hasil Peringkat Kompetisi Room
                </h4>
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "#8a9691" }}>
                  Skor dihitung dari jumlah jawaban benar dan kecepatan eksekusi
                </p>
              </div>

              {/* Leaderboard rows */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                {participants.map((p, idx) => {
                  const isMe = p.user_id === currentUser.id;
                  const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`;
                  return (
                    <div
                      key={p.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 16px",
                        borderRadius: 12,
                        backgroundColor: isMe ? "#243328" : "#1b2320",
                        border: isMe ? "1.5px solid #c8f064" : "1px solid #2b3832"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ fontSize: 16, fontWeight: 800, width: 26, textAlign: "center" }}>
                          {medal}
                        </span>
                        <div
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: "50%",
                            backgroundColor: p.avatar_color || "#10b981",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 700,
                            fontSize: 12,
                            color: "#ffffff"
                          }}
                        >
                          {(p.user_name || "TK").slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: isMe ? "#c8f064" : "#ffffff" }}>
                            {p.user_name} {isMe && "(Kamu)"}
                          </div>
                          <div style={{ fontSize: 11, color: "#8a9691" }}>
                            {p.correct_answers} dari {p.total_answered || questions.length} benar
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <strong style={{ fontSize: 16, color: "#c8f064", fontFamily: "'DM Mono', monospace" }}>
                          {p.score} Pts
                        </strong>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => setViewState("hub")}
                  style={{
                    flex: 1,
                    padding: "10px 0",
                    borderRadius: 8,
                    backgroundColor: "#1e2622",
                    border: "1px solid #2e3a34",
                    color: "#a1ada8",
                    fontWeight: 600,
                    fontSize: 12,
                    cursor: "pointer"
                  }}
                >
                  Kembali ke Hub Room
                </button>
                <button
                  onClick={onClose}
                  style={{
                    flex: 1,
                    padding: "10px 0",
                    borderRadius: 8,
                    backgroundColor: "#c8f064",
                    border: "none",
                    color: "#161b19",
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: "pointer"
                  }}
                >
                  Tutup Arena
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
