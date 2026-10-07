import React from "react";
import {
  Video,
  X,
  Loader2,
  Check,
  AlertCircle,
  ExternalLink,
  Sparkles,
  Play
} from "lucide-react";
import { YouTubeIcon } from "../common/YouTubeIcon";

export interface YouTubeModalProps {
  isYouTubeModalOpen: boolean;
  setIsYouTubeModalOpen: (open: boolean) => void;
  ytUrl: string;
  setYtUrl: (url: string) => void;
  ytGoal: "theory" | "exam";
  setYtGoal: (goal: "theory" | "exam") => void;
  ytInstruction: string;
  setYtInstruction: (inst: string) => void;
  isCheckingUrl: boolean;
  isGeneratingYt: boolean;
  ytInfo: {
    videoId: string;
    title: string;
    author: string;
    thumbnail: string;
    language: string;
    snippetCount: number;
    textPreview: string;
  } | null;
  ytError: string;
  setYtError: (err: string) => void;
  handleCheckUrl: (customUrl?: string) => Promise<void>;
  handleGenerateDocument: () => Promise<void>;
  handleReset: () => void;
}

export function YouTubeModal({
  isYouTubeModalOpen,
  setIsYouTubeModalOpen,
  ytUrl,
  setYtUrl,
  ytGoal,
  setYtGoal,
  ytInstruction,
  setYtInstruction,
  isCheckingUrl,
  isGeneratingYt,
  ytInfo,
  ytError,
  setYtError,
  handleCheckUrl,
  handleGenerateDocument,
  handleReset
}: YouTubeModalProps) {
  if (!isYouTubeModalOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        backgroundColor: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16
      }}
      onClick={() => {
        if (!isGeneratingYt) handleReset();
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 580,
          maxHeight: "88vh",
          backgroundColor: "#ffffff",
          border: "1px solid #dde1da",
          borderRadius: 12,
          boxShadow: "0 24px 64px rgba(27, 39, 35, 0.2)",
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
                backgroundColor: "#22312b",
                border: "1px solid #32433b",
                borderRadius: 8,
                padding: "6px 8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <YouTubeIcon size={17} color="#c8f064" />
            </div>
            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: "0.95rem",
                  fontWeight: 650,
                  color: "#19231f",
                  fontFamily: "Plus Jakarta Sans, sans-serif"
                }}
              >
                Pelajari Video YouTube
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: "0.74rem",
                  color: "#6b7770"
                }}
              >
                Tarik transkrip video, ekstrak konsep inti, dan susun modul belajar interaktif
              </p>
            </div>
          </div>

          <button
            onClick={handleReset}
            disabled={isGeneratingYt}
            style={{
              border: "none",
              backgroundColor: "transparent",
              color: "#6b7770",
              cursor: isGeneratingYt ? "not-allowed" : "pointer",
              padding: 6,
              borderRadius: 6,
              display: "flex",
              alignItems: "center"
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div
          style={{
            padding: 20,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 16
          }}
        >
          {/* Error Banner */}
          {ytError && (
            <div
              style={{
                padding: "10px 14px",
                backgroundColor: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: 8,
                color: "#991b1b",
                fontSize: "0.8rem",
                display: "flex",
                alignItems: "flex-start",
                gap: 8
              }}
            >
              <AlertCircle size={16} style={{ marginTop: 2, flexShrink: 0 }} />
              <div>
                <p style={{ margin: 0, fontWeight: 600 }}>Kendala Video</p>
                <p style={{ margin: "2px 0 0 0", color: "#b91c1c" }}>{ytError}</p>
              </div>
            </div>
          )}

          {/* URL Input */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.78rem",
                fontWeight: 600,
                color: "#28342f",
                marginBottom: 6
              }}
            >
              Tautan / URL Video YouTube
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                placeholder="https://www.youtube.com/watch?v=... atau https://youtu.be/..."
                value={ytUrl}
                disabled={isCheckingUrl || isGeneratingYt}
                onChange={(e) => {
                  setYtUrl(e.target.value);
                  if (ytError) setYtError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && ytUrl.trim() && !isCheckingUrl && !isGeneratingYt) {
                    handleCheckUrl();
                  }
                }}
                style={{
                  flex: 1,
                  padding: "9px 12px",
                  borderRadius: 8,
                  border: "1px solid #dde1da",
                  fontSize: "0.82rem",
                  backgroundColor: "#ffffff",
                  color: "#19231f",
                  outline: "none"
                }}
              />
              <button
                type="button"
                onClick={() => handleCheckUrl()}
                disabled={isCheckingUrl || isGeneratingYt || !ytUrl.trim()}
                style={{
                  padding: "9px 14px",
                  borderRadius: 8,
                  border: "1px solid #c2e28f",
                  backgroundColor: "#eef8db",
                  color: "#3f561d",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  cursor: isCheckingUrl || isGeneratingYt || !ytUrl.trim() ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  whiteSpace: "nowrap"
                }}
              >
                {isCheckingUrl ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Cek...</span>
                  </>
                ) : (
                  <span>Periksa</span>
                )}
              </button>
            </div>
            <p style={{ margin: "5px 0 0 0", fontSize: "0.7rem", color: "#6b7770" }}>
              Mendukung video materi sekolah, bimbel, Ruangguru, Zenius, atau channel edukasi luar negeri yang memiliki subtitle/transkrip.
            </p>
          </div>

          {/* Video Preview Card if Checked */}
          {ytInfo && (
            <div
              style={{
                backgroundColor: "#fbfcf9",
                border: "1px solid #e2e6de",
                borderRadius: 10,
                padding: 12,
                display: "flex",
                flexDirection: "column",
                gap: 10
              }}
            >
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                {ytInfo.thumbnail ? (
                  <img
                    src={ytInfo.thumbnail}
                    alt={ytInfo.title}
                    style={{
                      width: 110,
                      height: 64,
                      objectFit: "cover",
                      borderRadius: 6,
                      border: "1px solid #dde1da",
                      flexShrink: 0
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 110,
                      height: 64,
                      backgroundColor: "#19231f",
                      border: "1px solid #2d3d36",
                      borderRadius: 6,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0
                    }}
                  >
                    <Play size={20} color="#c8f064" fill="#c8f064" />
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <span
                      style={{
                        backgroundColor: "#eef8db",
                        color: "#3f561d",
                        fontSize: "0.68rem",
                        fontWeight: 600,
                        padding: "2px 6px",
                        borderRadius: 4,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4
                      }}
                    >
                      <Check size={11} /> Transkrip Tersedia
                    </span>
                    <span
                      style={{
                        fontSize: "0.68rem",
                        color: "#6b7770"
                      }}
                    >
                      {ytInfo.snippetCount} bagian ({ytInfo.language})
                    </span>
                  </div>
                  <h4
                    style={{
                      margin: "0 0 3px 0",
                      fontSize: "0.84rem",
                      fontWeight: 650,
                      color: "#19231f",
                      lineHeight: 1.3,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden"
                    }}
                  >
                    {ytInfo.title}
                  </h4>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.72rem",
                      color: "#6b7770",
                      display: "flex",
                      alignItems: "center",
                      gap: 4
                    }}
                  >
                    Kreator: <strong>{ytInfo.author}</strong>
                    <a
                      href={`https://www.youtube.com/watch?v=${ytInfo.videoId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: "#3f561d",
                        display: "inline-flex",
                        alignItems: "center",
                        marginLeft: 4
                      }}
                    >
                      <ExternalLink size={10} />
                    </a>
                  </p>
                </div>
              </div>

              {/* Snippet Preview */}
              {ytInfo.textPreview && (
                <div
                  style={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #eef0ea",
                    borderRadius: 6,
                    padding: "8px 10px",
                    fontSize: "0.71rem",
                    color: "#526058",
                    fontStyle: "italic",
                    lineHeight: 1.4,
                    maxHeight: 60,
                    overflow: "hidden",
                    textOverflow: "ellipsis"
                  }}
                >
                  "{ytInfo.textPreview}"
                </div>
              )}
            </div>
          )}

          {/* Mode Belajar / Target Goal */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.78rem",
                fontWeight: 600,
                color: "#28342f",
                marginBottom: 6
              }}
            >
              Fokus Modul Belajar
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <button
                type="button"
                disabled={isGeneratingYt}
                onClick={() => setYtGoal("theory")}
                style={{
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: ytGoal === "theory" ? "1.5px solid #4b6623" : "1px solid #dde1da",
                  backgroundColor: ytGoal === "theory" ? "#f4fbe6" : "#ffffff",
                  textAlign: "left",
                  cursor: isGeneratingYt ? "not-allowed" : "pointer"
                }}
              >
                <div
                  style={{
                    fontSize: "0.79rem",
                    fontWeight: 650,
                    color: ytGoal === "theory" ? "#2e4213" : "#28342f",
                    marginBottom: 2
                  }}
                >
                  Pondasi & Teori Konsep
                </div>
                <div style={{ fontSize: "0.68rem", color: "#6b7770" }}>
                  Bongkar esensi dasar, penurunan rumus, & analogi intuitif.
                </div>
              </button>

              <button
                type="button"
                disabled={isGeneratingYt}
                onClick={() => setYtGoal("exam")}
                style={{
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: ytGoal === "exam" ? "1.5px solid #4b6623" : "1px solid #dde1da",
                  backgroundColor: ytGoal === "exam" ? "#f4fbe6" : "#ffffff",
                  textAlign: "left",
                  cursor: isGeneratingYt ? "not-allowed" : "pointer"
                }}
              >
                <div
                  style={{
                    fontSize: "0.79rem",
                    fontWeight: 650,
                    color: ytGoal === "exam" ? "#2e4213" : "#28342f",
                    marginBottom: 2
                  }}
                >
                  Bedah Soal & TKA
                </div>
                <div style={{ fontSize: "0.68rem", color: "#6b7770" }}>
                  Fokus trik cepat, bedah contoh soal, & eliminasi jebakan.
                </div>
              </button>
            </div>
          </div>

          {/* Custom Instruction (Optional) */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.78rem",
                fontWeight: 600,
                color: "#28342f",
                marginBottom: 6
              }}
            >
              Catatan atau Fokus Khusus (Opsional)
            </label>
            <input
              type="text"
              placeholder="Contoh: Fokus pada menit ke-5 tentang matriks rotasi..."
              value={ytInstruction}
              disabled={isGeneratingYt}
              onChange={(e) => setYtInstruction(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid #dde1da",
                fontSize: "0.78rem",
                backgroundColor: "#ffffff",
                color: "#19231f",
                outline: "none"
              }}
            />
          </div>

          {/* Generating Indicator Progress */}
          {isGeneratingYt && (
            <div
              style={{
                padding: "14px 16px",
                backgroundColor: "#f8fbf3",
                border: "1px solid #d4ebaa",
                borderRadius: 10,
                display: "flex",
                flexDirection: "column",
                gap: 8
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Loader2 size={18} color="#4b6623" className="animate-spin" />
                <span style={{ fontSize: "0.82rem", fontWeight: 650, color: "#2e4213" }}>
                  Menyusun Modul Pembelajaran Nara...
                </span>
              </div>
              <p style={{ margin: 0, fontSize: "0.72rem", color: "#587131", lineHeight: 1.4 }}>
                Sistem sedang mengekstrak transkrip lisan video, memvalidasi konsep kanonikal (Pass 1), dan merangkum modul komprehensif dua arah (Pass 2). Mohon tunggu sebentar.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: "14px 20px",
            borderTop: "1px solid #dde1da",
            backgroundColor: "#f8f9f5",
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: 10
          }}
        >
          <button
            type="button"
            onClick={handleReset}
            disabled={isGeneratingYt}
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              border: "1px solid #dde1da",
              backgroundColor: "#ffffff",
              color: "#4d5b54",
              fontSize: "0.8rem",
              fontWeight: 600,
              cursor: isGeneratingYt ? "not-allowed" : "pointer"
            }}
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleGenerateDocument}
            disabled={!ytUrl.trim() || isCheckingUrl || isGeneratingYt}
            style={{
              padding: "8px 18px",
              borderRadius: 8,
              border: "none",
              backgroundColor: !ytUrl.trim() || isCheckingUrl || isGeneratingYt ? "#d5dbd3" : "#19231f",
              color: !ytUrl.trim() || isCheckingUrl || isGeneratingYt ? "#89938f" : "#c8f064",
              fontSize: "0.8rem",
              fontWeight: 700,
              cursor: !ytUrl.trim() || isCheckingUrl || isGeneratingYt ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              boxShadow: !ytUrl.trim() || isCheckingUrl || isGeneratingYt ? "none" : "0 2px 8px rgba(0,0,0,0.15)"
            }}
          >
            {isGeneratingYt ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Memproses Video...</span>
              </>
            ) : (
              <>
                <Sparkles size={14} color="#c8f064" />
                <span>Susun Modul Belajar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
