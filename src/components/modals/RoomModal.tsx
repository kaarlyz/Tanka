import React, { useState, useEffect, useRef } from "react";
import { 
  X, Swords, Users, Copy, Check, Play, Trophy, 
  Sparkles, Award, ArrowRight, Share2, RefreshCw, CheckCircle2, AlertCircle, Link2
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
  onStartRoomExam?: (room: StudyRoom, questions: any[]) => void;
  initialRoomId?: string | null;
  initialViewState?: "hub" | "lobby" | "playing" | "result";
  onQuickRegisterGuest?: (displayName: string) => Promise<UserAccount | null>;
}

export function RoomModal({
  isOpen,
  onClose,
  currentUser,
  activeDocId,
  activeDocTitle,
  documents,
  showNotice,
  onOpenAuthModal,
  onStartRoomExam,
  initialRoomId,
  initialViewState,
  onQuickRegisterGuest
}: RoomModalProps) {
  const [viewState, setViewState] = useState<"hub" | "lobby" | "playing" | "result">(initialViewState || "hub");
  const [hubTab, setHubTab] = useState<"create" | "join">("create");
  
  // Create room inputs
  const [selectedDocId, setSelectedDocId] = useState<string>(activeDocId || "");
  const [roomTitle, setRoomTitle] = useState<string>("");
  const [quizCount, setQuizCount] = useState<number>(5);
  const [quizType, setQuizType] = useState<string>("conceptual");
  const [maxParticipants, setMaxParticipants] = useState<number>(0);
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

  // Guest quick join & Share feedback
  const [guestName, setGuestName] = useState("");
  const [isGuestJoining, setIsGuestJoining] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isCopiedLink, setIsCopiedLink] = useState(false);

  // Synchronized Match Start Countdown
  const [startCountdown, setStartCountdown] = useState<number | null>(null);
  const [isStartingMatch, setIsStartingMatch] = useState<boolean>(false);
  const isCountdownRunningRef = useRef(false);

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

  // Trigger smooth 3-second animated countdown for both Host & Guest
  const triggerMatchCountdown = (room: StudyRoom, quizQuestions: any[]) => {
    if (isCountdownRunningRef.current) return;
    isCountdownRunningRef.current = true;
    setStartCountdown(3);
    let count = 3;
    const timer = setInterval(() => {
      count--;
      if (count > 0) {
        setStartCountdown(count);
      } else {
        clearInterval(timer);
        setStartCountdown(null);
        setIsStartingMatch(false);
        isCountdownRunningRef.current = false;
        if (onStartRoomExam && quizQuestions.length > 0) {
          onStartRoomExam(room, quizQuestions);
          onClose();
        } else {
          setQuestions(quizQuestions);
          setCurrentQIndex(0);
          setSelectedAnswers({});
          setViewState("playing");
        }
      }
    }, 1000);
  };

  // Synchronize initial room ID and view state (with auto-join for logged in users)
  useEffect(() => {
    if (initialViewState) {
      setViewState(initialViewState);
    }
    if (initialRoomId) {
      if (initialViewState === "result") {
        // Just fetch room & participants for viewing result/leaderboard
        fetch(`/api/rooms/${initialRoomId}`)
          .then(res => res.json())
          .then(data => {
            if (data.room) {
              setCurrentRoom(data.room);
              setParticipants(data.participants || []);
              if (data.questions) setQuestions(data.questions);
              setViewState("result");
            }
          })
          .catch(console.error);
      } else if (currentUser) {
        fetch(`/api/rooms/${initialRoomId}/join`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: currentUser.id,
            userName: currentUser.name || currentUser.username,
            schoolClass: currentUser.school_class || "Kelas XII",
            avatarColor: currentUser.avatar_color || "#6366f1"
          })
        })
          .then(res => res.json())
          .then(data => {
            if (data.room) {
              setCurrentRoom(data.room);
              setParticipants(data.participants || []);
              if (data.questions) setQuestions(data.questions);
              setViewState("lobby");
              showNotice(`Berhasil masuk ke Room ${initialRoomId}!`);
            }
          })
          .catch(console.error);
      } else {
        fetch(`/api/rooms/${initialRoomId}`)
          .then(res => res.json())
          .then(data => {
            if (data.room) {
              setCurrentRoom(data.room);
              setParticipants(data.participants || []);
              if (data.questions) setQuestions(data.questions);
            }
          })
          .catch(console.error);
      }
    }
  }, [initialRoomId, initialViewState, currentUser, showNotice]);

  // Polling room status when in lobby or viewing result
  useEffect(() => {
    if (!isOpen || !currentRoom?.id) return;

    const pollIntervalMs = viewState === "lobby" ? 1000 : 1500;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/rooms/${currentRoom.id}`);
        const data = await res.json();
        if (res.ok && data.room) {
          setCurrentRoom(data.room);
          setParticipants(data.participants || []);
          if (
            data.room.status === "active" && 
            viewState === "lobby" && 
            data.questions?.length > 0 && 
            !isCountdownRunningRef.current
          ) {
            triggerMatchCountdown(data.room, data.questions);
          } else if (data.room.status === "finished" && viewState === "playing") {
            setViewState("result");
          }
        }
      } catch (e) {
        console.warn("Poll room error:", e);
      }
    }, pollIntervalMs);

    return () => clearInterval(interval);
  }, [isOpen, currentRoom?.id, viewState, onStartRoomExam, onClose]);

  const copyRoomCode = () => {
    if (!currentRoom) return;
    navigator.clipboard.writeText(currentRoom.id);
    setIsCopied(true);
    showNotice(`Kode room ${currentRoom.id} disalin! Kirim ke temanmu.`);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const copyRoomLink = () => {
    if (!currentRoom) return;
    const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/?room=${currentRoom.id}` : `/?room=${currentRoom.id}`;
    const shareText = `Yuk tanding kuis bareng di Tanka! Klik link ini untuk langsung masuk:\n${shareUrl}\n(Kode Room: ${currentRoom.id})`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      setIsCopiedLink(true);
      showNotice(`Tautan undangan Room ${currentRoom.id} disalin! Kirim ke WhatsApp/Telegram teman.`);
      setTimeout(() => setIsCopiedLink(false), 2500);
    }
  };

  const shareRoomNative = async () => {
    if (!currentRoom) return;
    const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/?room=${currentRoom.id}` : `/?room=${currentRoom.id}`;
    const shareText = `Yuk tanding kuis bareng di Tanka! Klik tautan ini untuk langsung masuk:`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Tanka Study Room: ${currentRoom.title || currentRoom.id}`,
          text: shareText,
          url: shareUrl
        });
        showNotice("Tautan berhasil dibagikan!");
      } catch (err: any) {
        if (err.name !== "AbortError") {
          copyRoomLink();
        }
      }
    } else {
      copyRoomLink();
    }
  };

  const handleGuestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = guestName.trim() || "Teman Belajar";
    setIsGuestJoining(true);
    try {
      if (onQuickRegisterGuest) {
        const newUser = await onQuickRegisterGuest(cleanName);
        if (newUser && initialRoomId) {
          const res = await fetch(`/api/rooms/${initialRoomId}/join`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: newUser.id,
              userName: newUser.name || newUser.username,
              schoolClass: newUser.school_class || "Kelas XII",
              avatarColor: newUser.avatar_color || "#10b981"
            })
          });
          const data = await res.json();
          if (res.ok && data.room) {
            setCurrentRoom(data.room);
            setParticipants(data.participants || []);
            if (data.questions) setQuestions(data.questions);
            setViewState("lobby");
            showNotice(`Selamat bergabung ke Room ${initialRoomId}!`);
          }
        }
      }
    } catch (err) {
      console.error("Guest submit failed:", err);
      showNotice("Gagal bergabung sebagai tamu");
    } finally {
      setIsGuestJoining(false);
    }
  };

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
            maxWidth: 440,
            width: "100%",
            padding: 24,
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
          <h3 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 800, textAlign: "center" }}>
            {initialRoomId ? `Undangan Room: ${initialRoomId}` : "Masuk Arena Multiplayer"}
          </h3>
          <p style={{ margin: "0 0 18px", fontSize: 13, color: "#8a9691", textAlign: "center", lineHeight: 1.5 }}>
            {initialRoomId 
              ? "Temanmu mengundangmu ikut kuis bersama! Cukup masukkan nama panggilanmu untuk langsung bertanding:"
              : "Masukkan nama panggilanmu untuk langsung bertanding kuis bersama teman tanpa ribet:"}
          </p>

          <form onSubmit={handleGuestSubmit} style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
            <input
              type="text"
              placeholder="Ketik nama panggilanmu (contoh: Nadine / Glen)..."
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              autoFocus
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 10,
                backgroundColor: "#202824",
                border: "1.5px solid #303c36",
                color: "#ffffff",
                fontSize: 14,
                outline: "none",
                boxSizing: "border-box"
              }}
            />
            <button
              type="submit"
              disabled={isGuestJoining}
              style={{
                width: "100%",
                padding: "12px 0",
                borderRadius: 10,
                backgroundColor: "#c8f064",
                color: "#161b19",
                border: "none",
                fontWeight: 800,
                fontSize: 14,
                cursor: isGuestJoining ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8
              }}
            >
              <span>{isGuestJoining ? "Menyiapkan Arena..." : "Langsung Masuk & Bertanding 🚀"}</span>
            </button>
          </form>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 14, borderTop: "1px solid #252e2a" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                color: "#8a9691",
                fontSize: 12,
                cursor: "pointer"
              }}
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAuthModal();
              }}
              style={{
                background: "none",
                border: "none",
                color: "#c8f064",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                textDecoration: "underline"
              }}
            >
              Sudah punya akun? Masuk
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
          quizCount,
          quizType,
          maxParticipants
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

  const myParticipant = participants.find(p => p.user_id === currentUser?.id);
  const hostId = currentRoom?.hostUserId || (currentRoom as any)?.host_user_id;
  const isHost = !!(hostId && currentUser?.id && hostId === currentUser.id);

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
    if (!currentRoom || isStartingMatch || isCountdownRunningRef.current) return;
    setIsStartingMatch(true);
    try {
      const res = await fetch(`/api/rooms/${currentRoom.id}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser?.id })
      });
      const data = await res.json();
      if (res.ok && data.room) {
        setCurrentRoom(data.room);
        const qList = data.questions?.length > 0 ? data.questions : questions;
        setQuestions(qList);
        showNotice("Kompetisi kuis dimulai! Selamat berjuang!");
        triggerMatchCountdown(data.room, qList);
      } else {
        setIsStartingMatch(false);
        showNotice(data.error || "Gagal memulai");
      }
    } catch {
      setIsStartingMatch(false);
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
          overflow: "hidden",
          position: "relative"
        }}
      >
        {/* Full-Card Synchronized Match Countdown Overlay */}
        {startCountdown !== null && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "rgba(15, 20, 18, 0.95)",
              backdropFilter: "blur(12px)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 100,
              padding: 24,
              textAlign: "center"
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 10 }}>⚔️</div>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: "#ffffff", margin: "0 0 6px", letterSpacing: "0.02em" }}>
              PERTANDINGAN DIMULAI!
            </h3>
            <p style={{ fontSize: 13, color: "#a1ada8", margin: "0 0 24px", maxWidth: 360, lineHeight: 1.4 }}>
              Paket {questions.length || currentRoom?.quizCount || 5} butir soal telah disinkronkan. Mengalihkan ke arena tryout dalam...
            </p>
            <div
              style={{
                width: 96,
                height: 96,
                borderRadius: "50%",
                backgroundColor: "rgba(200, 240, 100, 0.12)",
                border: "3px solid #c8f064",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 48,
                fontWeight: 900,
                color: "#c8f064",
                boxShadow: "0 0 35px rgba(200, 240, 100, 0.4)",
                fontFamily: "'DM Mono', monospace"
              }}
            >
              {startCountdown}
            </div>
          </div>
        )}
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
                      onChange={e => {
                        const newDocId = e.target.value;
                        setSelectedDocId(newDocId);
                        const found = documents.find(d => d.id === newDocId);
                        if (found && (!roomTitle || roomTitle.startsWith("Kompetisi:"))) {
                          setRoomTitle(`Kompetisi: ${found.title}`);
                        }
                      }}
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
                    <p style={{ margin: "5px 0 0", fontSize: 11, color: "#6f7975" }}>
                      Butir soal room akan diambil & di-generate secara eksklusif dari materi yang dipilih.
                    </p>
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

                  {/* Settings Grid: Tipe Soal & Jumlah Soal */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#8a9691", marginBottom: 6 }}>
                        TIPE / KUALITAS SOAL
                      </label>
                      <select
                        value={quizType}
                        onChange={e => setQuizType(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          borderRadius: 8,
                          backgroundColor: "#1e2622",
                          border: "1px solid #33403a",
                          color: "#ffffff",
                          fontSize: 12.5,
                          boxSizing: "border-box"
                        }}
                      >
                        <option value="conceptual">Standar Ujian (Konseptual)</option>
                        <option value="hots">HOTS (Analisis & Kasus Kritis)</option>
                        <option value="beginner">Pemula & Fondasi Bertahap</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#8a9691", marginBottom: 6 }}>
                        JUMLAH SOAL
                      </label>
                      <select
                        value={quizCount}
                        onChange={e => setQuizCount(Number(e.target.value))}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          borderRadius: 8,
                          backgroundColor: "#1e2622",
                          border: "1px solid #33403a",
                          color: "#ffffff",
                          fontSize: 12.5,
                          boxSizing: "border-box"
                        }}
                      >
                        <option value={5}>5 Soal (Duel Cepat)</option>
                        <option value={10}>10 Soal (Standar Ujian)</option>
                        <option value={15}>15 Soal (Kompetisi Seru)</option>
                        <option value={20}>20 Soal (Tryout Penuh)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#8a9691", marginBottom: 6 }}>
                      BATAS KAPASITAS PESERTA
                    </label>
                    <select
                      value={maxParticipants}
                      onChange={e => setMaxParticipants(Number(e.target.value))}
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
                      <option value={0}>Bebas (Tanpa Batas Maksimal)</option>
                      <option value={5}>Maksimal 5 Peserta (Grup Kecil)</option>
                      <option value={10}>Maksimal 10 Peserta</option>
                      <option value={20}>Maksimal 20 Peserta</option>
                      <option value={36}>Maksimal 36 Peserta (1 Kelas)</option>
                      <option value={50}>Maksimal 50 Peserta</option>
                    </select>
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
              {/* Room Code & Direct Invite Link Box */}
              <div
                style={{
                  backgroundColor: "#1e2823",
                  border: "1.5px dashed #3a4c42",
                  borderRadius: 14,
                  padding: "16px 18px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                  <div>
                    <span style={{ fontSize: 11, color: "#8a9691", fontWeight: 700, letterSpacing: "0.05em" }}>
                      KODE ROOM UNDANGAN:
                    </span>
                    <div style={{ fontSize: 24, fontWeight: 800, color: "#c8f064", letterSpacing: 3, fontFamily: "'DM Mono', monospace" }}>
                      {currentRoom.id}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={copyRoomCode}
                    style={{
                      backgroundColor: isCopied ? "#22c55e" : "#2a3932",
                      color: isCopied ? "#ffffff" : "#c8f064",
                      border: "none",
                      borderRadius: 8,
                      padding: "8px 12px",
                      fontWeight: 700,
                      fontSize: 12,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6
                    }}
                  >
                    {isCopied ? <Check size={14} /> : <Copy size={14} />}
                    {isCopied ? "Kode Tersalin!" : "Salin Kode"}
                  </button>
                </div>

                {/* Direct Link Preview */}
                <div style={{
                  padding: "10px 12px",
                  backgroundColor: "#161b19",
                  borderRadius: 8,
                  border: "1px dashed #2a3932",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                  flexWrap: "wrap"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, overflow: "hidden", textOverflow: "ellipsis" }}>
                    <Link2 size={14} color="#8a9691" style={{ flexShrink: 0 }} />
                    <span style={{
                      fontSize: 12,
                      color: "#cbd5e1",
                      fontFamily: "'DM Mono', monospace",
                      wordBreak: "break-all"
                    }}>
                      {typeof window !== "undefined" ? `${window.location.origin}/?room=${currentRoom.id}` : `/?room=${currentRoom.id}`}
                    </span>
                  </div>
                </div>

                {/* Share Action Buttons */}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={copyRoomLink}
                    style={{
                      flex: 1,
                      backgroundColor: isCopiedLink ? "#22c55e" : "#c8f064",
                      color: isCopiedLink ? "#ffffff" : "#161b19",
                      border: "none",
                      borderRadius: 8,
                      padding: "10px 14px",
                      fontWeight: 700,
                      fontSize: 12.5,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
                    }}
                  >
                    {isCopiedLink ? <Check size={15} /> : <Copy size={15} />}
                    <span>{isCopiedLink ? "Tautan Tersalin! ✓" : "Salin Tautan Undangan"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={shareRoomNative}
                    style={{
                      backgroundColor: "#2a3932",
                      color: "#ffffff",
                      border: "1px solid #3d5248",
                      borderRadius: 8,
                      padding: "10px 14px",
                      fontWeight: 700,
                      fontSize: 12.5,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6
                    }}
                  >
                    <Share2 size={15} color="#c8f064" />
                    <span>Bagikan (WA / Telegram)</span>
                  </button>
                </div>
              </div>

              {/* Identity indicator in Lobby */}
              <div
                style={{
                  backgroundColor: "#161e1a",
                  border: "1px solid #2a3932",
                  borderRadius: 10,
                  padding: "9px 14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: 12,
                  flexWrap: "wrap",
                  gap: 8
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: "#8a9691" }}>Kamu bertanding sebagai:</span>
                  <span style={{ fontWeight: 700, color: "#ffffff" }}>
                    {currentUser.name || currentUser.username}
                  </span>
                  {currentUser.id === currentRoom.hostUserId ? (
                    <span style={{ color: "#c8f064", fontSize: 11, fontWeight: 700 }}>(Host 👑)</span>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAuthModal();
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#a3e635",
                    fontSize: 11.5,
                    fontWeight: 600,
                    cursor: "pointer",
                    textDecoration: "underline"
                  }}
                  title="Ganti akun jika ingin bertanding dengan identitas teman lain"
                >
                  Ganti Akun / Keluar
                </button>
              </div>

              {currentUser.id === currentRoom.hostUserId && (
                <div style={{
                  padding: "8px 12px",
                  backgroundColor: "rgba(234, 179, 8, 0.1)",
                  border: "1px solid rgba(234, 179, 8, 0.25)",
                  borderRadius: 8,
                  fontSize: 11.5,
                  color: "#fde047",
                  lineHeight: 1.4
                }}>
                  💡 <strong>Info Uji Coba:</strong> Perangkat ini terdeteksi sebagai <strong>Host Room</strong>. Jika sedang mencoba tanding antar 2 HP sendiri, klik <strong>Ganti Akun</strong> untuk buat nama tamu berbeda agar menjadi 2 pemain terpisah.
                </div>
              )}

              {/* Participants List */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#8a9691" }}>
                    PESERTA YANG BERGABUNG ({participants.length}{currentRoom.maxParticipants ? `/${currentRoom.maxParticipants}` : ""})
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
                    disabled={isStartingMatch || startCountdown !== null}
                    style={{
                      flex: 1,
                      padding: "12px 0",
                      borderRadius: 10,
                      backgroundColor: isStartingMatch ? "#2a3932" : "#c8f064",
                      color: isStartingMatch ? "#8a9691" : "#161b19",
                      border: "none",
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: (isStartingMatch || startCountdown !== null) ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6
                    }}
                  >
                    <Play size={16} /> {isStartingMatch ? "Mempersiapkan Arena..." : "Mulai Kompetisi!"}
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
          {viewState === "result" && (() => {
            const finishedCount = participants.filter(p => (p.total_answered || 0) > 0).length;
            const totalCount = participants.length;
            const isRoomFinished = currentRoom?.status === "finished" || (totalCount > 0 && finishedCount === totalCount);
            const myParticipant = participants.find(p => p.user_id === currentUser?.id);
            const sortedParticipants = [...participants].sort((a, b) => {
              const aDone = (a.total_answered || 0) > 0 ? 1 : 0;
              const bDone = (b.total_answered || 0) > 0 ? 1 : 0;
              if (aDone !== bDone) return bDone - aDone;
              if (b.score !== a.score) return b.score - a.score;
              return (b.correct_answers || 0) - (a.correct_answers || 0);
            });

            return (
              <div>
                {/* Live Waiting Alert Banner or Completion Banner */}
                {!isRoomFinished ? (
                  <div
                    style={{
                      backgroundColor: "rgba(234, 179, 8, 0.1)",
                      border: "1.5px solid rgba(234, 179, 8, 0.35)",
                      borderRadius: 14,
                      padding: "16px 18px",
                      marginBottom: 18,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      flexWrap: "wrap"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: "50%",
                          backgroundColor: "rgba(234, 179, 8, 0.2)",
                          color: "#facc15",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 18
                        }}
                      >
                        ⏳
                      </div>
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 800, color: "#fef08a" }}>
                          Menunggu Kawan Main Selesai ({finishedCount}/{totalCount} Selesai)
                        </div>
                        <div style={{ fontSize: 11.5, color: "#d1d5db", marginTop: 2, lineHeight: 1.4 }}>
                          {myParticipant?.total_answered
                            ? "Jawabanmu sudah tersimpan! Halaman ini otomatis memantau skor kawan mainmu secara live..."
                            : "Ujian kuis sedang berlangsung. Kumpulkan jawabanmu untuk masuk ke papan skor!"}
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        backgroundColor: "rgba(0,0,0,0.35)",
                        padding: "5px 12px",
                        borderRadius: 20,
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#facc15"
                      }}
                    >
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          backgroundColor: "#22c55e",
                          display: "inline-block",
                          boxShadow: "0 0 8px #22c55e"
                        }}
                      />
                      Live Updating
                    </div>
                  </div>
                ) : (
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
                    <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#ffffff" }}>
                      Hasil Resmi Peringkat Kompetisi Room
                    </h4>
                    <p style={{ margin: "4px 0 0", fontSize: 12, color: "#a1ada8" }}>
                      Seluruh peserta telah mengumpulkan lembar jawaban. Peringkat terkunci!
                    </p>
                  </div>
                )}

                {/* Leaderboard rows */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                  {sortedParticipants.map((p, idx) => {
                    const isMe = p.user_id === currentUser?.id;
                    const hasAnswered = (p.total_answered || 0) > 0;
                    const medal = hasAnswered
                      ? (idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`)
                      : "⏳";
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
                              width: 36,
                              height: 36,
                              borderRadius: "50%",
                              backgroundColor: p.avatar_color || "#10b981",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 700,
                              fontSize: 13,
                              color: "#ffffff"
                            }}
                          >
                            {(p.user_name || "TK").slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontSize: 13.5, fontWeight: 700, color: isMe ? "#c8f064" : "#ffffff", display: "flex", alignItems: "center", gap: 6 }}>
                              <span>{p.user_name}</span>
                              {isMe && <span style={{ fontSize: 11, color: "#c8f064", fontWeight: 600 }}>(Kamu)</span>}
                              {p.user_id === currentRoom?.hostUserId && <span style={{ fontSize: 11, color: "#fbbf24" }}>👑</span>}
                            </div>
                            <div style={{ fontSize: 11.5, marginTop: 2 }}>
                              {hasAnswered ? (
                                <span style={{ color: "#8a9691" }}>
                                  {p.correct_answers} dari {p.total_answered || questions.length || currentRoom?.quizCount || 5} benar
                                </span>
                              ) : (
                                <span style={{ color: "#fbbf24", fontStyle: "italic" }}>
                                  Sedang mengerjakan tryout... ✍️
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div style={{ textAlign: "right" }}>
                          {hasAnswered ? (
                            <>
                              <strong style={{ fontSize: 16, color: "#c8f064", fontFamily: "'DM Mono', monospace", display: "block" }}>
                                {p.score} Pts
                              </strong>
                              <span style={{ fontSize: 10.5, color: "#4ade80", fontWeight: 700 }}>
                                ✓ Selesai
                              </span>
                            </>
                          ) : (
                            <div style={{
                              backgroundColor: "rgba(234, 179, 8, 0.12)",
                              color: "#facc15",
                              border: "1px solid rgba(234, 179, 8, 0.25)",
                              borderRadius: 6,
                              padding: "3px 8px",
                              fontSize: 11,
                              fontWeight: 600
                            }}>
                              Belum Kumpul
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Footer Action Buttons */}
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => {
                      if (currentRoom) {
                        fetch(`/api/rooms/${currentRoom.id}`)
                          .then(res => res.json())
                          .then(data => {
                            if (data.room) setCurrentRoom(data.room);
                            if (data.participants) setParticipants(data.participants);
                            showNotice("Status room diperbarui! ✓");
                          })
                          .catch(() => showNotice("Gagal memperbarui status"));
                      }
                    }}
                    style={{
                      flex: 1,
                      padding: "10px 0",
                      borderRadius: 8,
                      backgroundColor: "#1e2622",
                      border: "1px solid #2e3a34",
                      color: "#c8f064",
                      fontWeight: 600,
                      fontSize: 12,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6
                    }}
                  >
                    <RefreshCw size={13} />
                    <span>Segarkan Skor</span>
                  </button>
                  <button
                    type="button"
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
                    Daftar Room
                  </button>
                  <button
                    type="button"
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
            );
          })()}
        </div>
      </div>
    </div>
  );
}
