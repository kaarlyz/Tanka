import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, Trash2, X } from "lucide-react";
import { ChatMessage } from "../../types";
import { MathView } from "../common/MathView";

export interface AiChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeDocTitle?: string;
  messages?: ChatMessage[];
  onSendMessage: (msg: string) => Promise<void> | void;
  onClearChat: () => Promise<void> | void;
  isChatSending: boolean;
}

export function AiChatDrawer({
  isOpen,
  onClose,
  activeDocTitle,
  messages = [],
  onSendMessage,
  onClearChat,
  isChatSending
}: AiChatDrawerProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSend = () => {
    if (!input.trim() || isChatSending) return;
    onSendMessage(input.trim());
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(15, 23, 42, 0.45)",
          backdropFilter: "blur(4px)",
          zIndex: 99990
        }}
        onClick={onClose}
      />

      <div
        className="modal-scale-in"
        style={{
          position: "fixed",
          top: 0,
          bottom: 0,
          right: 0,
          width: "90%",
          maxWidth: 420,
          backgroundColor: "#ffffff",
          zIndex: 99991,
          boxShadow: "-10px 0 30px rgba(0,0,0,0.15)",
          display: "flex",
          flexDirection: "column"
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 18px",
            borderBottom: "1px solid #dce1da",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#fbfcf9"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                backgroundColor: "#18211e",
                color: "#c8f064",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <MessageSquare size={15} />
            </div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: "#18211e" }}>
                Tutor AI (Nara)
              </div>
              <div style={{ fontSize: 11, color: "#6b7280", maxWidth: 220, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {activeDocTitle ? `Modul: ${activeDocTitle}` : "Tanya seputar materi"}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {messages.length > 0 && (
              <button
                type="button"
                onClick={onClearChat}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#9ca3af",
                  cursor: "pointer",
                  padding: 4
                }}
                title="Bersihkan riwayat percakapan"
              >
                <Trash2 size={15} />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              style={{
                background: "transparent",
                border: "none",
                color: "#6b7280",
                cursor: "pointer",
                padding: 4
              }}
              title="Tutup chat"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Messages Body */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px 18px",
            display: "flex",
            flexDirection: "column",
            gap: 12
          }}
        >
          {messages.length === 0 ? (
            <div style={{ margin: "auto 0", textAlign: "center", padding: "20px 10px" }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  backgroundColor: "#edf4e3",
                  color: "#566b36",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 12px"
                }}
              >
                <MessageSquare size={22} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#18211e", marginBottom: 4 }}>
                Ruang Diskusi & Tanya Jawab
              </div>
              <p style={{ fontSize: 12, color: "#6f7975", lineHeight: 1.5, margin: 0 }}>
                Tanyakan rumus yang membingungkan, minta contoh soal lain, atau diskusikan konsep materi ini bersama tutor AI.
              </p>
            </div>
          ) : (
            messages.map((m, idx) => {
              const isUser = m.role === "user";
              return (
                <div
                  key={idx}
                  style={{
                    alignSelf: isUser ? "flex-end" : "flex-start",
                    maxWidth: "85%",
                    backgroundColor: isUser ? "#18211e" : "#f4f6f2",
                    color: isUser ? "#ffffff" : "#18211e",
                    padding: "9px 13px",
                    borderRadius: 12,
                    fontSize: 13,
                    lineHeight: 1.55,
                    borderBottomRightRadius: isUser ? 2 : 12,
                    borderBottomLeftRadius: !isUser ? 2 : 12
                  }}
                >
                  <MathView text={m.content} />
                </div>
              );
            })
          )}

          {isChatSending && (
            <div
              style={{
                alignSelf: "flex-start",
                backgroundColor: "#f4f6f2",
                color: "#566b36",
                padding: "8px 12px",
                borderRadius: 12,
                fontSize: 12,
                fontWeight: 600
              }}
            >
              Tutor sedang menyusun jawaban...
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Footer */}
        <div
          style={{
            padding: "12px 16px",
            borderTop: "1px solid #dce1da",
            backgroundColor: "#ffffff",
            display: "flex",
            alignItems: "center",
            gap: 8
          }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tanyakan sesuatu tentang materi ini..."
            disabled={isChatSending}
            style={{
              flex: 1,
              backgroundColor: "#f8f9f5",
              border: "1px solid #dce1da",
              borderRadius: 8,
              padding: "9px 12px",
              fontSize: 13,
              color: "#18211e",
              outline: "none"
            }}
          />

          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || isChatSending}
            style={{
              backgroundColor: "#18211e",
              color: "#c8f064",
              border: "none",
              borderRadius: 8,
              width: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: !input.trim() || isChatSending ? "not-allowed" : "pointer"
            }}
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </>
  );
}
