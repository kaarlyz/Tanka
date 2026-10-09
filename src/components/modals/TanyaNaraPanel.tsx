import React, { useRef } from "react";
import { RotateCw, X, Sparkles, Brain, Camera, Image, FileText, Send, Copy, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { ActiveTab, ChatMessage } from "../../types";
import { StagedChatFile } from "../../hooks/useChat";
import { sanitizeMathMarkdown } from "../common/DiagramRenderer";

export interface TanyaNaraPanelProps {
  activeTab: ActiveTab;
  isAiPanelOpen: boolean;
  setIsAiPanelOpen: (val: boolean) => void;
  activeDocTitle: string;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  isChatSending: boolean;
  chatEndRef: React.RefObject<HTMLDivElement | null>;
  chatInput: string;
  setChatInput: (val: string) => void;
  handleSendMessage: (textToSend?: string) => Promise<void> | void;
  stagedAttachment?: StagedChatFile | null;
  handleAttachFile?: (file: File) => Promise<void>;
  handleClearAttachment?: () => void;
  handleClearChat?: () => Promise<void> | void;
  isFreeMode?: boolean;
  setIsFreeMode?: (val: boolean) => void;
  effectiveDocId?: string | null;
}

export function TanyaNaraPanel({
  activeTab,
  isAiPanelOpen,
  setIsAiPanelOpen,
  activeDocTitle,
  messages,
  setMessages,
  isChatSending,
  chatEndRef,
  chatInput,
  setChatInput,
  handleSendMessage,
  stagedAttachment,
  handleAttachFile,
  handleClearAttachment,
  handleClearChat,
  isFreeMode,
  setIsFreeMode,
  effectiveDocId,
}: TanyaNaraPanelProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const [copiedMsgId, setCopiedMsgId] = React.useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      setCopiedMsgId(id);
      setTimeout(() => setCopiedMsgId(null), 1800);
    }
  };

  React.useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [messages, isChatSending]);

  const handlePaste = (e: React.ClipboardEvent) => {
    if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length > 0) {
      const file = e.clipboardData.files[0];
      if (handleAttachFile) {
        handleAttachFile(file);
        e.preventDefault();
      }
    }
  };

  const activeTabLabel =
    activeTab === "quiz"
      ? "Kuis"
      : activeTab === "flashcards"
      ? "Kartu"
      : activeTab === "summary"
      ? "Rangkuman"
      : activeTab === "feynman"
      ? "Feynman"
      : activeTab === "home"
      ? "Umum"
      : "Materi";

  return (
    <>
      {isAiPanelOpen && (
        <div
          className="ai-panel-backdrop open"
          onClick={() => setIsAiPanelOpen(false)}
        />
      )}
      <aside
        className={`ai-panel-box ${isAiPanelOpen ? "open" : ""}`}
        style={{
          display: isAiPanelOpen ? "flex" : "none",
          width: 380,
          minWidth: 320,
          maxWidth: 420,
          flexShrink: 0,
          height: "100%",
          maxHeight: "100%",
          boxSizing: "border-box",
          overflow: "hidden"
        }}
      >
        <div
          className="ai-panel-inner"
          style={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
            maxHeight: "100%",
            width: "100%",
            minHeight: 0,
            overflow: "hidden",
            backgroundColor: "#fbfcf9"
          }}
        >
          {/* 1. Header (Flush, Clean, Minimal) */}
          <div
            style={{
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "max(12px, env(safe-area-inset-top)) 14px 10px 14px",
              backgroundColor: "#ffffff",
              borderBottom: "1px solid #e8ede5",
              gap: 10
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
              {/* Avatar with subtle online indicator */}
              <div style={{ position: "relative", flexShrink: 0 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    backgroundColor: "#18221f",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: 13,
                    fontFamily: "monospace"
                  }}
                >
                  N
                </div>
                <span
                  style={{
                    position: "absolute",
                    bottom: -1,
                    right: -1,
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    backgroundColor: "#10b981",
                    border: "2px solid #ffffff"
                  }}
                />
              </div>

              {/* Title & Context */}
              <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <h2
                    style={{
                      fontSize: 13.5,
                      fontWeight: 700,
                      margin: 0,
                      color: "#17201d",
                      letterSpacing: "-0.01em"
                    }}
                  >
                    Tanya Nara
                  </h2>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 600,
                      color: "#54655e",
                      backgroundColor: "#f1f4ee",
                      border: "1px solid #dfe5db",
                      padding: "1px 6px",
                      borderRadius: 4
                    }}
                  >
                    {activeTabLabel}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2, flexWrap: "nowrap" }}>
                  {effectiveDocId && activeDocTitle ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 4, minWidth: 0 }}>
                      <span
                        style={{
                          fontSize: 9.5,
                          fontWeight: 700,
                          color: "#166534",
                          backgroundColor: "#f0fdf4",
                          border: "1px solid #bbf7d0",
                          padding: "1px 6px",
                          borderRadius: 4,
                          maxWidth: 140,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap"
                        }}
                        title={`Terkait modul aktif: ${activeDocTitle}`}
                      >
                        📄 {activeDocTitle}
                      </span>
                      {setIsFreeMode && (
                        <button
                          type="button"
                          onClick={() => setIsFreeMode(true)}
                          style={{
                            fontSize: 9,
                            fontWeight: 600,
                            color: "#475569",
                            backgroundColor: "#f1f5f9",
                            border: "1px solid #cbd5e1",
                            borderRadius: 4,
                            padding: "1px 5px",
                            cursor: "pointer",
                            whiteSpace: "nowrap"
                          }}
                          title="Klik untuk beralih ke Mode Bebas (tanpa terikat modul ini)"
                        >
                          ✕ Bebas
                        </button>
                      )}
                    </div>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", gap: 4, minWidth: 0 }}>
                      <span
                        style={{
                          fontSize: 9.5,
                          fontWeight: 700,
                          color: "#0369a1",
                          backgroundColor: "#f0f9ff",
                          border: "1px solid #bae6fd",
                          padding: "1px 6px",
                          borderRadius: 4,
                          whiteSpace: "nowrap"
                        }}
                        title="Tanya topik apa saja secara bebas tanpa terikat modul spesifik"
                      >
                        🌐 Mode Bebas (Semua Mapel)
                      </span>
                      {activeDocTitle && setIsFreeMode && (
                        <button
                          type="button"
                          onClick={() => setIsFreeMode(false)}
                          style={{
                            fontSize: 9,
                            fontWeight: 600,
                            color: "#166534",
                            backgroundColor: "#f0fdf4",
                            border: "1px solid #bbf7d0",
                            borderRadius: 4,
                            padding: "1px 5px",
                            cursor: "pointer",
                            whiteSpace: "nowrap"
                          }}
                          title={`Kaitkan obrolan dengan modul "${activeDocTitle}"`}
                        >
                          + Kaitkan
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Header Action Buttons */}
            <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearChat || (() => setMessages([]))}
                  title="Bersihkan riwayat percakapan sesi ini"
                  style={{
                    background: "none",
                    border: "none",
                    color: "#728078",
                    cursor: "pointer",
                    padding: "6px",
                    borderRadius: 6,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "background 0.15s, color 0.15s"
                  }}
                >
                  <RotateCw size={14} />
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsAiPanelOpen(false)}
                title="Tutup panel"
                style={{
                  background: "none",
                  border: "none",
                  color: "#728078",
                  cursor: "pointer",
                  padding: "6px",
                  borderRadius: 6,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "background 0.15s, color 0.15s"
                }}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* 2. Messages Container (Full bleed scrollable area) */}
          <div
            className="chat-window-box no-scrollbar"
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 10,
              padding: "12px 14px",
              boxSizing: "border-box"
            }}
          >
            {messages.length === 0 ? (
              <div
                style={{
                  margin: "auto 0",
                  padding: "18px 12px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  gap: 8
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: "#eef2e9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#37473f"
                  }}
                >
                  <Brain size={18} />
                </div>
                <h3 style={{ fontSize: 13, fontWeight: 700, margin: 0, color: "#17201d" }}>
                  Mulai Diskusi Bareng Nara
                </h3>
                <p style={{ fontSize: 11, color: "#6c7a73", margin: 0, lineHeight: 1.5, maxWidth: 260 }}>
                  Tanyakan rumus, konsep sulit, atau unggah foto soal latihan untuk dibedah langkah demi langkah.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 5, width: "100%", maxWidth: 270, marginTop: 6 }}>
                  {[
                    "💡 Ringkas poin penting topik ini",
                    "📐 Beri contoh soal & pembahasan taktis",
                    "❓ Uji pemahamanku dengan kuis kilat"
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleSendMessage(preset)}
                      disabled={isChatSending}
                      style={{
                        padding: "7px 10px",
                        fontSize: 11,
                        color: "#35443d",
                        backgroundColor: "#ffffff",
                        border: "1px solid #dde3da",
                        borderRadius: 8,
                        textAlign: "left",
                        cursor: "pointer",
                        transition: "background 0.15s, border-color 0.15s"
                      }}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: m.role === "user" ? "flex-end" : "flex-start",
                    gap: 3
                  }}
                >
                  {/* Attachment preview if present */}
                  {m.attachment && (
                    <div
                      style={{
                        maxWidth: "85%",
                        padding: "4px 8px",
                        borderRadius: 6,
                        backgroundColor: m.role === "user" ? "#22312d" : "#e8eee5",
                        border: "1px solid rgba(0,0,0,0.06)",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 10.5,
                        color: m.role === "user" ? "#d2e4cb" : "#243321"
                      }}
                    >
                      {m.attachment.type === "image" && m.attachment.url ? (
                        <img
                          src={m.attachment.url}
                          alt="Lampiran"
                          style={{
                            width: 32,
                            height: 32,
                            objectFit: "cover",
                            borderRadius: 4,
                            border: "1px solid rgba(255,255,255,0.2)"
                          }}
                        />
                      ) : (
                        <FileText size={13} color={m.role === "user" ? "#a8c99e" : "#446128"} />
                      )}
                      <span
                        style={{
                          fontWeight: 600,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap"
                        }}
                      >
                        {m.attachment.name}
                      </span>
                    </div>
                  )}

                  {/* Speech Bubble */}
                  <div
                    style={{
                      maxWidth: m.role === "user" ? "85%" : "92%",
                      padding: m.role === "user" ? "8px 12px" : "10px 13px",
                      borderRadius: m.role === "user" ? "12px 12px 3px 12px" : "12px 12px 12px 3px",
                      backgroundColor: m.role === "user" ? "#18221f" : "#ffffff",
                      color: m.role === "user" ? "#f4f7f2" : "#17201d",
                      fontSize: 12.5,
                      lineHeight: 1.55,
                      border: m.role === "user" ? "none" : "1px solid #dde1da",
                      boxShadow:
                        m.role === "user"
                          ? "0 1px 3px rgba(24, 34, 31, 0.12)"
                          : "0 1px 3px rgba(27, 39, 35, 0.03)"
                    }}
                  >
                    {m.role === "assistant" ? (
                      <div className="nara-md-response" style={{ fontSize: 12.5, lineHeight: 1.55 }}>
                        <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                          {sanitizeMathMarkdown(m.content)}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <div style={{ whiteSpace: "pre-wrap" }}>{m.content}</div>
                    )}

                    {/* Copy to Clipboard Button */}
                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
                      <button
                        type="button"
                        onClick={() => handleCopy(m.id, m.content)}
                        title="Salin pesan"
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: m.role === "user" ? "rgba(244, 247, 242, 0.6)" : "#8a9691",
                          fontSize: 9.5,
                          display: "flex",
                          alignItems: "center",
                          gap: 3,
                          padding: "2px 4px",
                          borderRadius: 4,
                          transition: "color 0.15s ease"
                        }}
                      >
                        {copiedMsgId === m.id ? (
                          <>
                            <Check size={11} color={m.role === "user" ? "#a8c99e" : "#4b6623"} />
                            <span style={{ color: m.role === "user" ? "#a8c99e" : "#4b6623", fontWeight: 600 }}>
                              Disalin
                            </span>
                          </>
                        ) : (
                          <>
                            <Copy size={11} />
                            <span>Salin</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}

            {isChatSending && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 11,
                  color: "#5b6d65",
                  fontStyle: "italic",
                  padding: "4px 8px"
                }}
              >
                <Sparkles size={12} color="#18221f" />
                <span>Nara sedang menyusun penjelasan...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* 3. Footer (Input & Attachment Bar) */}
          <div
            style={{
              flexShrink: 0,
              padding: "8px 12px max(8px, env(safe-area-inset-bottom))",
              borderTop: "1px solid #e8ede5",
              backgroundColor: "#ffffff"
            }}
          >
            {/* Contextual Quick Suggestion Chips */}
            <div
              className="prompt-chips-box no-scrollbar"
              style={{
                display: "flex",
                gap: 5,
                overflowX: "auto",
                paddingBottom: 6,
                marginBottom: 2
              }}
            >
              {(activeTab === "quiz"
                ? ["Bahas soal ini", "Kenapa jawaban itu benar?", "Rumus terkait"]
                : activeTab === "flashcards"
                ? ["Jelaskan kartu ini", "Beri analogi", "Contoh penerapan"]
                : activeTab === "feynman"
                ? ["Koreksi penjelasanku", "Bantu susun analogi", "Apa yang kurang?"]
                : ["Jelaskan lebih sederhana", "Beri contoh soal lain", "Trik cepat rumus"]
              ).map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handleSendMessage(chip)}
                  disabled={isChatSending}
                  style={{
                    fontSize: 10,
                    padding: "3px 9px",
                    backgroundColor: "#f4f6f2",
                    border: "1px solid #dde3da",
                    borderRadius: 999,
                    color: "#46554e",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                    transition: "background 0.15s, border-color 0.15s"
                  }}
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Staged File Preview Chip */}
            {stagedAttachment && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backgroundColor: "#f0f4ee",
                  border: "1px solid #cdd8cb",
                  borderRadius: 6,
                  padding: "4px 8px",
                  marginBottom: 6,
                  fontSize: 10.5,
                  color: "#273b18"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6, overflow: "hidden" }}>
                  {stagedAttachment.type === "image" && stagedAttachment.previewUrl ? (
                    <img
                      src={stagedAttachment.previewUrl}
                      alt="Preview"
                      style={{
                        width: 22,
                        height: 22,
                        objectFit: "cover",
                        borderRadius: 4,
                        border: "1px solid #b6c9af"
                      }}
                    />
                  ) : (
                    <FileText size={14} color="#446128" />
                  )}
                  <span
                    style={{
                      fontWeight: 600,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      maxWidth: 190
                    }}
                  >
                    {stagedAttachment.name}
                  </span>
                  <span style={{ fontSize: 9.5, color: "#6e806a" }}>
                    ({Math.round(stagedAttachment.file.size / 1024)} KB)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleClearAttachment}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#6e806a",
                    padding: 2,
                    display: "flex",
                    alignItems: "center"
                  }}
                  title="Hapus lampiran"
                >
                  <X size={12} />
                </button>
              </div>
            )}

            {/* Hidden File Inputs */}
            <input
              type="file"
              ref={cameraInputRef}
              style={{ display: "none" }}
              accept="image/*"
              capture="environment"
              onChange={(e) => {
                if (e.target.files && e.target.files[0] && handleAttachFile) {
                  handleAttachFile(e.target.files[0]);
                  e.target.value = "";
                }
              }}
            />
            <input
              type="file"
              ref={galleryInputRef}
              style={{ display: "none" }}
              accept="image/png,image/jpeg,image/webp,image/bmp"
              onChange={(e) => {
                if (e.target.files && e.target.files[0] && handleAttachFile) {
                  handleAttachFile(e.target.files[0]);
                  e.target.value = "";
                }
              }}
            />
            <input
              type="file"
              ref={docInputRef}
              style={{ display: "none" }}
              accept=".pdf,.docx,.pptx,.txt,.md"
              onChange={(e) => {
                if (e.target.files && e.target.files[0] && handleAttachFile) {
                  handleAttachFile(e.target.files[0]);
                  e.target.value = "";
                }
              }}
            />

            {/* Form Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              onPaste={handlePaste}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                backgroundColor: "#f4f6f2",
                border: "1px solid #dce2d8",
                borderRadius: 16,
                padding: "3px 4px 3px 8px"
              }}
            >
              {/* Option 1: Camera */}
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                disabled={isChatSending}
                style={{
                  background: "none",
                  border: "none",
                  color: "#62736b",
                  cursor: "pointer",
                  padding: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 4,
                  transition: "color 0.15s"
                }}
                title="Ambil foto via kamera"
              >
                <Camera size={15} />
              </button>

              {/* Option 2: Gallery */}
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                disabled={isChatSending}
                style={{
                  background: "none",
                  border: "none",
                  color: stagedAttachment?.type === "image" ? "#3b5821" : "#62736b",
                  cursor: "pointer",
                  padding: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 4,
                  transition: "color 0.15s"
                }}
                title="Unggah gambar dari galeri"
              >
                <Image size={15} />
              </button>

              {/* Option 3: Document */}
              <button
                type="button"
                onClick={() => docInputRef.current?.click()}
                disabled={isChatSending}
                style={{
                  background: "none",
                  border: "none",
                  color: stagedAttachment?.type === "document" ? "#3b5821" : "#62736b",
                  cursor: "pointer",
                  padding: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 4,
                  transition: "color 0.15s"
                }}
                title="Unggah PDF / Dokumen"
              >
                <FileText size={15} />
              </button>

              <input
                type="text"
                placeholder={
                  stagedAttachment
                    ? `Bahas ${stagedAttachment.name}... (Enter)`
                    : "Tanya Nara, paste gambar..."
                }
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={isChatSending}
                style={{
                  flex: 1,
                  minWidth: 0,
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  fontSize: 13,
                  padding: "4px 2px",
                  color: "#18221f"
                }}
              />

              <button
                type="submit"
                disabled={isChatSending || (!chatInput.trim() && !stagedAttachment)}
                title="Kirim pesan"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  border: "none",
                  backgroundColor:
                    (!chatInput.trim() && !stagedAttachment) || isChatSending
                      ? "#d2dad0"
                      : "#18221f",
                  color: "#ffffff",
                  cursor:
                    (!chatInput.trim() && !stagedAttachment) || isChatSending
                      ? "not-allowed"
                      : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transition: "background 0.15s"
                }}
              >
                <Send size={12} />
              </button>
            </form>
          </div>
        </div>
      </aside>
    </>
  );
}
