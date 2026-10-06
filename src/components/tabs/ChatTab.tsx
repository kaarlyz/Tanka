import React, { useRef } from "react";
import { MessageSquare, Sparkles, Trash2, Send, BookOpen, Camera, Image, FileText, X } from "lucide-react";
import { DocumentItem, ChatMessage } from "../../types";
import { StagedChatFile } from "../../hooks/useChat";
import { MathView } from "../common/MathView";

export interface ChatTabProps {
  activeDocTitle: string;
  selectedModel: string;
  messages: ChatMessage[];
  chatInput: string;
  setChatInput: (val: string) => void;
  handleSendMessage: (textToSend?: string) => Promise<void> | void;
  isChatSending: boolean;
  stagedAttachment?: StagedChatFile | null;
  handleAttachFile?: (file: File) => Promise<void>;
  handleClearAttachment?: () => void;
  handleClearChat?: () => Promise<void> | void;
}

export function ChatTab({
  activeDocTitle,
  selectedModel,
  messages,
  chatInput,
  setChatInput,
  handleSendMessage,
  isChatSending,
  stagedAttachment,
  handleAttachFile,
  handleClearAttachment,
  handleClearChat,
}: ChatTabProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

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
    <div style={{ maxWidth: 840, margin: "0 auto", display: "flex", flexDirection: "column", height: "calc(100% - 160px)", minHeight: 400 }}>
      {/* Active grounding info banner */}
      <div
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid #dde1da",
          borderRadius: 10,
          padding: "10px 14px",
          marginBottom: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 10px 35px rgba(27, 39, 35, 0.04)"
        }}
      >
        <div style={{ fontSize: 12, color: "#6f7975", display: "flex", alignItems: "center", gap: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          <BookOpen size={13} color="#4b6623" />
          <span>Materi: <strong style={{ color: "#17201d" }}>{activeDocTitle || "Tutor Belajar Umum"}</strong></span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {messages.length > 0 && handleClearChat && (
            <button
              type="button"
              onClick={handleClearChat}
              title="Bersihkan riwayat percakapan sesi ini"
              style={{
                background: "rgba(220, 38, 38, 0.08)",
                border: "1px solid rgba(220, 38, 38, 0.2)",
                color: "#dc2626",
                cursor: "pointer",
                padding: "4px 8px",
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 5
              }}
            >
              <Trash2 size={12} />
              <span>Bersihkan Chat</span>
            </button>
          )}
          <div className="desktop-only" style={{ fontSize: 11, color: "#8a9691", fontFamily: "'DM Mono', monospace" }}>
            Engine: {selectedModel}
          </div>
        </div>
      </div>

      {/* Chat Messages Log */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12, paddingRight: 4, marginBottom: 12 }}>
        {messages.map((m) => {
          const isUser = m.role === "user";
          return (
            <div
              key={m.id}
              style={{
                alignSelf: isUser ? "flex-end" : "flex-start",
                maxWidth: "85%",
                backgroundColor: isUser ? "#18221f" : "#ffffff",
                color: isUser ? "#eff5ec" : "#17201d",
                border: isUser ? "none" : "1px solid #dde1da",
                borderRadius: 12,
                padding: "10px 14px",
                fontSize: 13,
                lineHeight: "1.5",
                whiteSpace: "pre-wrap",
                boxShadow: isUser ? "none" : "0 4px 15px rgba(27, 39, 35, 0.03)"
              }}
            >
              {/* Attachment Display */}
              {m.attachment && (
                <div style={{ marginBottom: 6 }}>
                  {m.attachment.type === "image" && m.attachment.url ? (
                    <img
                      src={m.attachment.url}
                      alt={m.attachment.name}
                      style={{
                        maxWidth: "100%",
                        maxHeight: 200,
                        borderRadius: 8,
                        display: "block",
                        objectFit: "contain",
                        border: "1px solid rgba(255,255,255,0.2)",
                        marginBottom: 4
                      }}
                    />
                  ) : (
                    <div style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "4px 8px",
                      borderRadius: 6,
                      backgroundColor: isUser ? "rgba(255,255,255,0.15)" : "#eef2ea",
                      fontSize: 11,
                      fontWeight: 600,
                      marginBottom: 4
                    }}>
                      <FileText size={13} />
                      <span>{m.attachment.name}</span>
                    </div>
                  )}
                </div>
              )}
              <MathView text={m.content} />
            </div>
          );
        })}
        {isChatSending && (
          <div
            style={{
              alignSelf: "flex-start",
              backgroundColor: "#ffffff",
              border: "1px solid #dde1da",
              borderRadius: 12,
              padding: "10px 14px",
              fontSize: 12,
              color: "#4b6623",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            <Sparkles size={14} className="animate-spin" />
            <span>Tutor sedang menganalisis materi dan menyusun jawaban...</span>
          </div>
        )}
      </div>

      {/* Quick Prompt Pills */}
      <div className="no-scrollbar" style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 8, WebkitOverflowScrolling: "touch" }}>
        {[
          "Jelaskan bagian tersulit materi ini",
          "Buat 3 soal jebakan analisis beserta jawabannya",
          "Sederhanakan definisi di atas dengan analogi nyata"
        ].map((pill, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(pill)}
            style={{
              whiteSpace: "nowrap",
              backgroundColor: "#ffffff",
              border: "1px solid #dce1da",
              color: "#45544e",
              borderRadius: 999,
              padding: "4px 10px",
              fontSize: 11,
              cursor: "pointer",
              flexShrink: 0
            }}
          >
            {pill}
          </button>
        ))}
      </div>

      {/* Staged Attachment Pill */}
      {stagedAttachment && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#f0f4ec",
            border: "1px solid #c9d8c3",
            borderRadius: 8,
            padding: "6px 10px",
            marginBottom: 6,
            fontSize: 12,
            color: "#273b18"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, overflow: "hidden" }}>
            {stagedAttachment.type === "image" && stagedAttachment.previewUrl ? (
              <img
                src={stagedAttachment.previewUrl}
                alt="Preview"
                style={{ width: 24, height: 24, objectFit: "cover", borderRadius: 4, border: "1px solid #b6c9af" }}
              />
            ) : (
              <FileText size={16} color="#446128" />
            )}
            <span style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 260 }}>
              {stagedAttachment.name}
            </span>
            <span style={{ fontSize: 10, color: "#6e806a" }}>
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
            <X size={14} />
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

      {/* Input Bar */}
      <div style={{ display: "flex", gap: 6 }} onPaste={handlePaste}>
        {/* Option 1: Kamera */}
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          disabled={isChatSending}
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #dce1da",
            color: "#45544e",
            borderRadius: 8,
            padding: "0 10px",
            fontSize: 13,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
          title="Ambil Foto Soal / Catatan via Kamera"
        >
          <Camera size={16} />
        </button>

        {/* Option 2: Galeri Foto */}
        <button
          type="button"
          onClick={() => galleryInputRef.current?.click()}
          disabled={isChatSending}
          style={{
            backgroundColor: stagedAttachment?.type === "image" ? "#e2ebd9" : "#ffffff",
            border: `1px solid ${stagedAttachment?.type === "image" ? "#779f2f" : "#dce1da"}`,
            color: stagedAttachment?.type === "image" ? "#3a561c" : "#45544e",
            borderRadius: 8,
            padding: "0 10px",
            fontSize: 13,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
          title="Unggah Foto / Gambar dari Galeri"
        >
          <Image size={16} />
        </button>

        {/* Option 3: Dokumen */}
        <button
          type="button"
          onClick={() => docInputRef.current?.click()}
          disabled={isChatSending}
          style={{
            backgroundColor: stagedAttachment?.type === "document" ? "#e2ebd9" : "#ffffff",
            border: `1px solid ${stagedAttachment?.type === "document" ? "#779f2f" : "#dce1da"}`,
            color: stagedAttachment?.type === "document" ? "#3a561c" : "#45544e",
            borderRadius: 8,
            padding: "0 10px",
            fontSize: 13,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
          title="Unggah Dokumen PDF / DOCX / PPTX / TXT"
        >
          <FileText size={16} />
        </button>

        <input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          placeholder={stagedAttachment ? `Bahas ${stagedAttachment.name}... (atau langsung Enter)` : "Tanyakan konsep, paste foto soal, atau lampirkan berkas..."}
          style={{
            flex: 1,
            backgroundColor: "#ffffff",
            border: "1px solid #dce1da",
            borderRadius: 8,
            padding: "10px 14px",
            fontSize: 14,
            color: "#17201d",
            outline: "none"
          }}
        />
        <button
          onClick={() => handleSendMessage()}
          disabled={isChatSending || (!chatInput.trim() && !stagedAttachment)}
          style={{
            backgroundColor: "#18221f",
            color: "#c8f064",
            border: "none",
            borderRadius: 8,
            padding: "0 16px",
            fontSize: 13,
            fontWeight: 700,
            cursor: isChatSending || (!chatInput.trim() && !stagedAttachment) ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: 4
          }}
        >
          <Send size={14} />
          <span className="desktop-only">Kirim</span>
        </button>
      </div>
    </div>
  );
}
