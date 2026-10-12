import React, { useRef, useState, useCallback, useMemo, useEffect } from "react";
import { RotateCw, X, Sparkles, Brain, Camera, Image, FileText, Send, Copy, Check, Plus, ArrowUp } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { ActiveTab, ChatMessage } from "../../types";
import { StagedChatFile } from "../../hooks/useChat";
import { sanitizeMathMarkdown } from "../common/DiagramRenderer";

const STATIC_REMARK_PLUGINS = [remarkGfm, remarkMath];
const STATIC_REHYPE_PLUGINS = [rehypeKatex];

interface ChatMessageItemProps {
  m: ChatMessage;
  copiedMsgId: string | null;
  onCopy: (id: string, text: string) => void;
}

export const ChatMessageItem = React.memo(
  function ChatMessageItem({ m, copiedMsgId, onCopy }: ChatMessageItemProps) {
    const isUser = m.role === "user";
    const sanitizedContent = useMemo(() => {
      return isUser ? m.content : sanitizeMathMarkdown(m.content);
    }, [m.content, isUser]);

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: isUser ? "flex-end" : "flex-start",
          gap: 3,
          padding: "0 2px"
        }}
      >
        {/* Attachment preview if present */}
        {m.attachment && (
          <div
            style={{
              maxWidth: "85%",
              padding: "5px 10px",
              borderRadius: 8,
              backgroundColor: isUser ? "#202e28" : "#edf2ea",
              border: "1px solid rgba(0,0,0,0.06)",
              display: "flex",
              alignItems: "center",
              gap: 7,
              fontSize: 11,
              color: isUser ? "#d5e6cf" : "#223320"
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
                  borderRadius: 5,
                  border: "1px solid rgba(255,255,255,0.2)"
                }}
              />
            ) : (
              <FileText size={14} color={isUser ? "#a8c99e" : "#446128"} />
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
            maxWidth: isUser ? "85%" : "94%",
            padding: isUser ? "9px 13px" : "11px 14px",
            borderRadius: isUser ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
            backgroundColor: isUser ? "#1c2b25" : "#ffffff",
            color: isUser ? "#f5f8f3" : "#17201d",
            fontSize: 13,
            lineHeight: 1.58,
            border: isUser ? "none" : "1px solid #dce2d8",
            boxShadow: isUser
              ? "0 1px 4px rgba(28, 43, 37, 0.15)"
              : "0 1px 4px rgba(27, 39, 35, 0.04)"
          }}
        >
          {isUser ? (
            <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{m.content}</div>
          ) : (
            <>
              <div className="nara-md-response" style={{ fontSize: 13, lineHeight: 1.58 }}>
                <ReactMarkdown remarkPlugins={STATIC_REMARK_PLUGINS} rehypePlugins={STATIC_REHYPE_PLUGINS}>
                  {sanitizedContent}
                </ReactMarkdown>
              </div>

              {/* Copy to Clipboard Button - Only for Assistant */}
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6, paddingTop: 4, borderTop: "1px solid #edf1ea" }}>
                <button
                  type="button"
                  onClick={() => onCopy(m.id, m.content)}
                  title="Salin jawaban"
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#74827b",
                    fontSize: 11,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "3px 6px",
                    borderRadius: 5,
                    transition: "color 0.15s ease"
                  }}
                >
                  {copiedMsgId === m.id ? (
                    <>
                      <Check size={12} color="#436125" />
                      <span style={{ color: "#436125", fontWeight: 600 }}>Disalin</span>
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      <span>Salin</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  },
  (prev, next) => {
    return (
      prev.m.id === next.m.id &&
      prev.m.content === next.m.content &&
      prev.m.role === next.m.role &&
      prev.m.attachment === next.m.attachment &&
      (prev.copiedMsgId === prev.m.id) === (next.copiedMsgId === next.m.id)
    );
  }
);

interface ChatInputBarProps {
  activeTab: ActiveTab;
  isChatSending: boolean;
  hasMessages: boolean;
  stagedAttachment?: StagedChatFile | null;
  handleSendMessage: (textToSend?: string) => Promise<void> | void;
  handleAttachFile?: (file: File) => Promise<void>;
  handleClearAttachment?: () => void;
}

export function ChatInputBar({
  activeTab,
  isChatSending,
  hasMessages,
  stagedAttachment,
  handleSendMessage,
  handleAttachFile,
  handleClearAttachment
}: ChatInputBarProps) {
  const [inputVal, setInputVal] = useState("");
  const [isAttachMenuOpen, setIsAttachMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isAttachMenuOpen) return;
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsAttachMenuOpen(false);
      }
    };
    const timer = setTimeout(() => {
      document.addEventListener("click", onPointerDown);
      document.addEventListener("touchstart", onPointerDown);
    }, 50);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("click", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, [isAttachMenuOpen]);

  const handlePaste = (e: React.ClipboardEvent) => {
    if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length > 0) {
      const file = e.clipboardData.files[0];
      if (handleAttachFile) {
        handleAttachFile(file);
        e.preventDefault();
      }
    }
  };

  const onSubmit = () => {
    if (isChatSending) return;
    if (inputVal.trim() || stagedAttachment) {
      const text = inputVal;
      setInputVal("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
      handleSendMessage(text);
    }
  };

  return (
    <div
      style={{
        flexShrink: 0,
        position: "relative",
        padding: "8px 12px max(10px, env(safe-area-inset-bottom))",
        borderTop: "1px solid #e5ebe2",
        backgroundColor: "#ffffff"
      }}
    >
      {/* Contextual Quick Suggestion Chips - ONLY shown when conversation is active to prevent duplicate cards with empty state */}
      {hasMessages && (
        <div
          className="prompt-chips-box no-scrollbar"
          style={{
            display: "flex",
            gap: 6,
            overflowX: "auto",
            WebkitOverflowScrolling: "touch",
            paddingBottom: 7,
            marginBottom: 4
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
                fontSize: 11,
                padding: "4px 11px",
                backgroundColor: "#f4f6f1",
                border: "1px solid #dce2d8",
                borderRadius: 999,
                color: "#3a4c43",
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
      )}

      {/* Staged File Preview Chip */}
      {stagedAttachment && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#f0f4ee",
            border: "1px solid #cdd8cb",
            borderRadius: 8,
            padding: "5px 9px",
            marginBottom: 6,
            fontSize: 11,
            color: "#273b18"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 7, overflow: "hidden" }}>
            {stagedAttachment.type === "image" && stagedAttachment.previewUrl ? (
              <img
                src={stagedAttachment.previewUrl}
                alt="Preview"
                style={{
                  width: 24,
                  height: 24,
                  objectFit: "cover",
                  borderRadius: 4,
                  border: "1px solid #b6c9af"
                }}
              />
            ) : (
              <FileText size={15} color="#446128" />
            )}
            <span
              style={{
                fontWeight: 600,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: 200
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
              padding: 3,
              display: "flex",
              alignItems: "center"
            }}
            title="Hapus lampiran"
          >
            <X size={13} />
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
          onSubmit();
        }}
        onPaste={handlePaste}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          backgroundColor: "#f4f6f2",
          border: "1px solid #dce2d8",
          borderRadius: 24,
          padding: "4px 6px 4px 6px"
        }}
      >
        {/* Unified Attachment Toggle Button with Context Popover */}
        <div ref={menuRef} style={{ position: "relative", display: "flex", alignItems: "center" }}>
          {isAttachMenuOpen && (
            <div
              style={{
                position: "absolute",
                bottom: "calc(100% + 6px)",
                left: 0,
                backgroundColor: "#ffffff",
                border: "1px solid #dce2d8",
                borderRadius: 12,
                padding: "4px",
                boxShadow: "0 8px 24px rgba(18, 30, 24, 0.12)",
                display: "flex",
                flexDirection: "column",
                gap: 1,
                minWidth: 155,
                zIndex: 60,
                animation: "fadeIn 0.12s ease-out"
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setIsAttachMenuOpen(false);
                  cameraInputRef.current?.click();
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "7px 10px",
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: "#22342b",
                  backgroundColor: "transparent",
                  border: "none",
                  borderRadius: 7,
                  cursor: "pointer",
                  textAlign: "left"
                }}
              >
                <Camera size={14} color="#456128" />
                <span>Ambil Foto</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAttachMenuOpen(false);
                  galleryInputRef.current?.click();
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "7px 10px",
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: "#22342b",
                  backgroundColor: "transparent",
                  border: "none",
                  borderRadius: 7,
                  cursor: "pointer",
                  textAlign: "left"
                }}
              >
                <Image size={14} color="#456128" />
                <span>Pilih Gambar</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAttachMenuOpen(false);
                  docInputRef.current?.click();
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "7px 10px",
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: "#22342b",
                  backgroundColor: "transparent",
                  border: "none",
                  borderRadius: 7,
                  cursor: "pointer",
                  textAlign: "left"
                }}
              >
                <FileText size={14} color="#456128" />
                <span>Dokumen / PDF</span>
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsAttachMenuOpen((prev) => !prev);
            }}
            disabled={isChatSending}
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              border: stagedAttachment ? "1px solid #b6c9af" : "1px solid transparent",
              backgroundColor: isAttachMenuOpen || stagedAttachment ? "#e4ede0" : "#e8eee4",
              color: isAttachMenuOpen || stagedAttachment ? "#273f15" : "#4e6057",
              cursor: "pointer",
              padding: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              transition: "all 0.15s ease"
            }}
            title="Lampirkan foto atau dokumen"
          >
            <Plus size={18} />
          </button>
        </div>

        <textarea
          ref={textareaRef}
          rows={1}
          placeholder={
            stagedAttachment
              ? `Bahas ${stagedAttachment.name}...`
              : "Tanya Nara atau ketik soal..."
          }
          value={inputVal}
          onChange={(e) => {
            setInputVal(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = Math.min(e.target.scrollHeight, 84) + "px";
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSubmit();
            }
          }}
          disabled={isChatSending}
          style={{
            flex: 1,
            minWidth: 0,
            border: "none",
            outline: "none",
            background: "transparent",
            fontSize: 13,
            lineHeight: 1.45,
            padding: "6px 5px",
            color: "#18221f",
            resize: "none",
            overflowY: inputVal.length > 80 ? "auto" : "hidden",
            maxHeight: 84,
            fontFamily: "inherit",
            boxSizing: "border-box"
          }}
        />

        <button
          type="submit"
          disabled={isChatSending || (!inputVal.trim() && !stagedAttachment)}
          title={isChatSending ? "Nara sedang menjawab..." : "Kirim pesan"}
          style={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            border: "none",
            backgroundColor:
              (!inputVal.trim() && !stagedAttachment) || isChatSending
                ? "#d2dad0"
                : "#18221f",
            color: "#ffffff",
            cursor:
              (!inputVal.trim() && !stagedAttachment) || isChatSending
                ? "not-allowed"
                : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            transition: "background 0.15s, transform 0.1s"
          }}
        >
          {isChatSending ? (
            <RotateCw size={14} className="animate-spin" />
          ) : (
            <ArrowUp size={17} />
          )}
        </button>
      </form>
    </div>
  );
}

export interface TanyaNaraPanelProps {
  activeTab: ActiveTab;
  isAiPanelOpen: boolean;
  setIsAiPanelOpen: (val: boolean) => void;
  activeDocTitle: string;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  isChatSending: boolean;
  chatEndRef: React.RefObject<HTMLDivElement | null>;
  chatInput?: string;
  setChatInput?: (val: string) => void;
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
  handleSendMessage,
  stagedAttachment,
  handleAttachFile,
  handleClearAttachment,
  handleClearChat,
  isFreeMode,
  setIsFreeMode,
  effectiveDocId,
}: TanyaNaraPanelProps) {
  const chatWindowRef = useRef<HTMLDivElement>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  const handleCopy = useCallback((id: string, text: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      setCopiedMsgId(id);
      setTimeout(() => setCopiedMsgId(null), 1800);
    }
  }, []);

  useEffect(() => {
    const el = chatWindowRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 160;
    const lastMsg = messages[messages.length - 1];
    const isUserMsg = lastMsg?.role === "user";

    if (isNearBottom || isUserMsg || isChatSending) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [messages, isChatSending]);

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
          minHeight: 0,
          position: "relative",
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
                      fontSize: 9.5,
                      fontWeight: 700,
                      color: "#54655e",
                      backgroundColor: "#f1f4ee",
                      border: "1px solid #dfe5db",
                      padding: "2px 8px",
                      borderRadius: 9999
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
                          padding: "2px 8px",
                          borderRadius: 9999,
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
                            borderRadius: 9999,
                            padding: "2px 7px",
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
                          padding: "2px 8px",
                          borderRadius: 9999,
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
                            borderRadius: 9999,
                            padding: "2px 7px",
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
            ref={chatWindowRef}
            className="chat-window-box no-scrollbar"
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              overscrollBehavior: "contain",
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
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  padding: "24px 14px",
                  gap: 10
                }}
              >
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    backgroundColor: "#eef2e9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#304037"
                  }}
                >
                  <Brain size={20} />
                </div>
                <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: "#17201d" }}>
                  Mulai Diskusi Bareng Nara
                </h3>
                <p style={{ fontSize: 11.5, color: "#6c7a73", margin: 0, lineHeight: 1.5, maxWidth: 280 }}>
                  Tanyakan rumus, konsep sulit, atau lampirkan foto soal latihan untuk dibahas langkah demi langkah.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 7, width: "100%", maxWidth: 290, marginTop: 10 }}>
                  {[
                    { text: "💡 Ringkas poin penting topik ini", desc: "Intisari konsep & peta rumus" },
                    { text: "📐 Beri contoh soal & pembahasan", desc: "Latihan bertahap & cara cepat" },
                    { text: "❓ Uji pemahamanku dengan kuis kilat", desc: "Cek ingatan dalam 3 pertanyaan" }
                  ].map((preset) => (
                    <button
                      key={preset.text}
                      type="button"
                      onClick={() => handleSendMessage(preset.text)}
                      disabled={isChatSending}
                      style={{
                        padding: "10px 14px",
                        backgroundColor: "#ffffff",
                        border: "1px solid #dce2d8",
                        borderRadius: 12,
                        textAlign: "left",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                        boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                        transition: "all 0.15s ease"
                      }}
                    >
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#1f2e26" }}>{preset.text}</span>
                      <span style={{ fontSize: 10.5, color: "#74827b" }}>{preset.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m) => (
                <ChatMessageItem
                  key={m.id}
                  m={m}
                  copiedMsgId={copiedMsgId}
                  onCopy={handleCopy}
                />
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
          <ChatInputBar
            activeTab={activeTab}
            isChatSending={isChatSending}
            hasMessages={messages.length > 0}
            stagedAttachment={stagedAttachment}
            handleSendMessage={handleSendMessage}
            handleAttachFile={handleAttachFile}
            handleClearAttachment={handleClearAttachment}
          />
        </div>
      </aside>
    </>
  );
}
