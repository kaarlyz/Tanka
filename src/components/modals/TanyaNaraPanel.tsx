import React, { useRef } from "react";
import { RotateCw, X, Sparkles, Brain, Camera, Image, FileText, Send } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { ActiveTab, ChatMessage } from "../../types";
import { StagedChatFile } from "../../hooks/useChat";

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
}: TanyaNaraPanelProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

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
            overflow: "hidden"
          }}
        >
          {/* 1. Header (Always pinned to top) */}
          <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", gap: 6 }}>
            <div className="mobile-sheet-pill mobile-only" />
            <div className="ai-heading-box" style={{ padding: "8px 12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div className="ai-orbit-box" style={{ width: 28, height: 28, fontSize: 13 }}>N</div>
                <div>
                  <h2 style={{ fontSize: 13, fontWeight: 800, margin: 0, color: "#17201d", letterSpacing: "-0.01em" }}>Tanya Nara</h2>
                  <p style={{ fontSize: 9.5, color: "#727d78", margin: 0, fontWeight: 500 }}>Tutor Belajar Pribadi</p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span className="online-label-box" style={{ padding: "2px 6px", fontSize: 9.5 }}>
                  <i />
                  Online
                </span>
                {messages.length > 0 && (
                  <button
                    onClick={handleClearChat || (() => setMessages([]))}
                    title="Bersihkan riwayat percakapan sesi ini"
                    style={{
                      background: "none",
                      border: "none",
                      color: "#8a9691",
                      cursor: "pointer",
                      padding: "3px 4px",
                      borderRadius: 4,
                      display: "flex",
                      alignItems: "center"
                    }}
                  >
                    <RotateCw size={12} />
                  </button>
                )}
                {/* Fullscreen Toggle (Mobile) */}
                <button
                  className="mobile-only"
                  onClick={() => {
                    const el = document.querySelector('.ai-panel-box');
                    if (el) el.classList.toggle('fullscreen');
                  }}
                  title="Toggle Fullscreen"
                  style={{
                    background: "none",
                    border: "none",
                    color: "#8a9691",
                    cursor: "pointer",
                    padding: "3px 4px",
                    borderRadius: 4,
                    display: "flex",
                    alignItems: "center"
                  }}
                >
                  <div style={{ width: 12, height: 12, border: "2px solid currentColor", borderRadius: 2 }} />
                </button>
                <button
                  onClick={() => setIsAiPanelOpen(false)}
                  title="Tutup panel Tanya Nara"
                  style={{
                    background: "none",
                    border: "none",
                    color: "#8a9691",
                    cursor: "pointer",
                    padding: "3px 4px",
                    borderRadius: 4,
                    display: "flex",
                    alignItems: "center"
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            <div className="ai-context-indicator" style={{ padding: "4px 8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5, overflow: "hidden" }}>
                <Sparkles size={11} color="#4b6623" />
                <span className="ctx-title" style={{ fontSize: 10.5 }}>{activeDocTitle || "Tutor Bebas (Tanpa Modul)"}</span>
              </div>
              <span style={{ fontSize: 8.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "#56645e" }}>
                {activeTab === "quiz" ? "Kuis" : activeTab === "flashcards" ? "Kartu" : activeTab === "summary" ? "Rangkuman" : activeTab === "home" ? "Umum" : "Materi"}
              </span>
            </div>
          </div>

          {/* 2. Messages Container (Takes remaining height, only scrollable element) */}
          <div
            className="chat-window-box no-scrollbar"
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 8,
              padding: "6px 0",
              margin: "4px 0"
            }}
          >
            <div className="ai-note-box" style={{ padding: "8px 10px", fontSize: 11 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3, fontWeight: 700, color: "#17201d", fontSize: 11 }}>
                <Brain size={12} color="#18221f" />
                <span>Asisten Belajar Tanka</span>
              </div>
              Tanyakan materi apa saja, unggah foto soal latihan, ambil foto kamera, atau lampirkan berkas PDF untuk dibedah Nara langkah demi langkah.
            </div>

            {messages.map((m) => (
              <div
                key={m.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: m.role === "user" ? "flex-end" : "flex-start",
                  gap: 3
                }}
              >
                {/* Render attachment preview if present */}
                {m.attachment && (
                  <div
                    style={{
                      maxWidth: "85%",
                      padding: "4px 8px",
                      borderRadius: 8,
                      backgroundColor: m.role === "user" ? "#22312d" : "#e8eee5",
                      border: "1px solid rgba(0,0,0,0.06)",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 11,
                      color: m.role === "user" ? "#d2e4cb" : "#243321"
                    }}
                  >
                    {m.attachment.type === "image" && m.attachment.url ? (
                      <img
                        src={m.attachment.url}
                        alt="Lampiran"
                        style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 4, border: "1px solid rgba(255,255,255,0.2)" }}
                      />
                    ) : (
                      <FileText size={14} color={m.role === "user" ? "#a8c99e" : "#446128"} />
                    )}
                    <span style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {m.attachment.name}
                    </span>
                  </div>
                )}

                <div
                  style={{
                    maxWidth: "90%",
                    padding: m.role === "user" ? "8px 12px" : "10px 13px",
                    borderRadius: m.role === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                    backgroundColor: m.role === "user" ? "#18221f" : "#ffffff",
                    color: m.role === "user" ? "#eff5ec" : "#17201d",
                    fontSize: 12,
                    lineHeight: 1.5,
                    border: m.role === "user" ? "none" : "1px solid #dde1da",
                    boxShadow: m.role === "user" ? "0 2px 8px rgba(24, 34, 31, 0.12)" : "0 2px 8px rgba(27, 39, 35, 0.02)"
                  }}
                >
                  {m.role === "assistant" ? (
                    <div className="nara-md-response" style={{ fontSize: 12, lineHeight: 1.5 }}>
                      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                        {m.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div>{m.content}</div>
                  )}
                </div>
              </div>
            ))}
            {isChatSending && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10.5, color: "#607069", fontStyle: "italic", padding: "4px 6px" }}>
                <Sparkles size={11} color="#18221f" />
                <span>Nara sedang menyusun penjelasan...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* 3. Footer (Always pinned to bottom) */}
          <div style={{ flexShrink: 0, paddingTop: 6, borderTop: "1px solid #eef1eb", marginTop: "auto" }}>
            {/* Contextual Quick Suggestion Chips */}
            <div className="prompt-chips-box" style={{ marginBottom: 5 }}>
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
                  className="prompt-chip-btn"
                  onClick={() => handleSendMessage(chip)}
                  disabled={isChatSending}
                  style={{ fontSize: 9.5, padding: "2px 7px" }}
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
                  backgroundColor: "#eff5eb",
                  border: "1px solid #c9d8c3",
                  borderRadius: 8,
                  padding: "4px 8px",
                  marginBottom: 6,
                  fontSize: 11,
                  color: "#273b18"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6, overflow: "hidden" }}>
                  {stagedAttachment.type === "image" && stagedAttachment.previewUrl ? (
                    <img
                      src={stagedAttachment.previewUrl}
                      alt="Preview"
                      style={{ width: 22, height: 22, objectFit: "cover", borderRadius: 4, border: "1px solid #b6c9af" }}
                    />
                  ) : (
                    <FileText size={15} color="#446128" />
                  )}
                  <span style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 180 }}>
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
                    padding: "2px",
                    display: "flex",
                    alignItems: "center"
                  }}
                  title="Hapus lampiran"
                >
                  <X size={13} />
                </button>
              </div>
            )}

            {/* Hidden Inputs for Camera, Image Gallery, and Documents */}
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

            <form
              className="chat-form-box"
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              onPaste={handlePaste}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "3px 4px 3px 6px"
              }}
            >
              {/* Option 1: Camera button (Ambil Foto Langsung) */}
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                disabled={isChatSending}
                style={{
                  background: "none",
                  border: "none",
                  color: "#5b6d65",
                  cursor: "pointer",
                  padding: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 6,
                  transition: "background 0.15s, color 0.15s"
                }}
                title="Ambil Foto Soal / Catatan via Kamera"
              >
                <Camera size={15} />
              </button>

              {/* Option 2: Image Gallery button (Foto Galeri) */}
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                disabled={isChatSending}
                style={{
                  background: "none",
                  border: "none",
                  color: stagedAttachment?.type === "image" ? "#446128" : "#5b6d65",
                  cursor: "pointer",
                  padding: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 6,
                  transition: "background 0.15s, color 0.15s"
                }}
                title="Unggah Foto / Gambar dari Galeri"
              >
                <Image size={15} />
              </button>

              {/* Option 3: Document button (PDF / Dokumen) */}
              <button
                type="button"
                onClick={() => docInputRef.current?.click()}
                disabled={isChatSending}
                style={{
                  background: "none",
                  border: "none",
                  color: stagedAttachment?.type === "document" ? "#446128" : "#5b6d65",
                  cursor: "pointer",
                  padding: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 6,
                  transition: "background 0.15s, color 0.15s"
                }}
                title="Unggah Dokumen PDF / DOCX / PPTX / TXT"
              >
                <FileText size={15} />
              </button>

              <input
                type="text"
                placeholder={stagedAttachment ? `Bahas ${stagedAttachment.name}... (atau Enter)` : "Tanya Nara, paste gambar..."}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={isChatSending}
                style={{
                  flex: 1,
                  minWidth: 0,
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  fontSize: 12,
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
                  borderRadius: 6,
                  border: "none",
                  backgroundColor: (!chatInput.trim() && !stagedAttachment) || isChatSending ? "#d0d7cf" : "#18221f",
                  color: "#ffffff",
                  cursor: (!chatInput.trim() && !stagedAttachment) || isChatSending ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transition: "background 0.15s"
                }}
              >
                <Send size={13} />
              </button>
            </form>

            <p style={{ margin: "5px 0 0", fontSize: 9, color: "#8a9691", textAlign: "center" }}>
              Bisa foto kamera, unggah gambar/PDF, atau paste (Ctrl+V) langsung.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}