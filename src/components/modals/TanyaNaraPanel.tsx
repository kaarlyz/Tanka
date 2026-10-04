import React from "react";
import { RotateCw, X, Sparkles, Brain } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { ActiveTab, ChatMessage } from "../../types";

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
}: TanyaNaraPanelProps) {
  return (
    <aside className={`ai-panel-box ${(activeTab !== "home" && isAiPanelOpen) ? "open" : ""}`} style={{ display: (activeTab !== "home" && isAiPanelOpen) ? "flex" : "none", flexShrink: 0 }}>
      <div className="ai-panel-inner">
        <div>
          <div className="ai-heading-box">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div className="ai-orbit-box">N</div>
              <div>
                <h2 style={{ fontSize: 13.5, fontWeight: 800, margin: 0, color: "#17201d", letterSpacing: "-0.01em" }}>Tanya Nara</h2>
                <p style={{ fontSize: 10, color: "#727d78", margin: 0, fontWeight: 500 }}>Tutor Belajar Pribadi</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span className="online-label-box">
                <i />
                Online
              </span>
              {messages.length > 0 && (
                <button
                  onClick={() => setMessages([])}
                  title="Bersihkan riwayat percakapan"
                  style={{
                    background: "none",
                    border: "none",
                    color: "#8a9691",
                    cursor: "pointer",
                    padding: "3px 4px",
                    borderRadius: 4,
                    display: "flex",
                    alignItems: "center",
                    transition: "0.15s ease"
                  }}
                >
                  <RotateCw size={12} />
                </button>
              )}
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
                <X size={15} />
              </button>
            </div>
          </div>

          <div className="ai-context-indicator">
            <div style={{ display: "flex", alignItems: "center", gap: 5, overflow: "hidden" }}>
              <Sparkles size={11} color="#4b6623" />
              <span className="ctx-title">{activeDocTitle || "Modul Belajar"}</span>
            </div>
            <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "#56645e" }}>
              {activeTab === "quiz" ? "Kuis" : activeTab === "flashcards" ? "Kartu" : activeTab === "summary" ? "Rangkuman" : "Materi"}
            </span>
          </div>

          <div className="chat-window-box no-scrollbar" style={{ minHeight: 220, maxHeight: "calc(100vh - 380px)" }}>
            <div className="ai-note-box">
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4, fontWeight: 700, color: "#17201d", fontSize: 11.5 }}>
                <Brain size={13} color="#18221f" />
                <span>Asisten Belajar Tanka</span>
              </div>
              Tanyakan bagian yang belum jelas, minta contoh angka kecil, atau kirimkan jawaban latihan manualmu untuk dikoreksi bertahap.
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
                <div
                  style={{
                    maxWidth: "90%",
                    padding: m.role === "user" ? "9px 13px" : "11px 14px",
                    borderRadius: m.role === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                    backgroundColor: m.role === "user" ? "#18221f" : "#ffffff",
                    color: m.role === "user" ? "#eff5ec" : "#17201d",
                    fontSize: 12.5,
                    lineHeight: 1.55,
                    border: m.role === "user" ? "none" : "1px solid #dde1da",
                    boxShadow: m.role === "user" ? "0 2px 8px rgba(24, 34, 31, 0.12)" : "0 2px 8px rgba(27, 39, 35, 0.02)"
                  }}
                >
                  {m.role === "assistant" ? (
                    <div className="nara-md-response" style={{ fontSize: 12.5, lineHeight: 1.55 }}>
                      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                        {m.content}
                      </ReactMarkdown>
                    </div>
                  ) : m.content}
                </div>
              </div>
            ))}
            {isChatSending && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#607069", fontStyle: "italic", padding: "4px 8px" }}>
                <Sparkles size={12} color="#18221f" />
                <span>Nara sedang menyusun penjelasan...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        </div>

        <div>
          <div className="prompt-chips-box">
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
              >
                {chip}
              </button>
            ))}
          </div>

          <form
            className="chat-form-box"
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
          >
            <input
              type="text"
              placeholder="Tanya Nara atau ketik jawaban latihan..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              disabled={isChatSending}
            />
            <button type="submit" disabled={isChatSending || !chatInput.trim()} title="Kirim pertanyaan">
              ↑
            </button>
          </form>
          <p style={{ margin: "7px 0 0", fontSize: 9.5, color: "#8a9691", textAlign: "center" }}>
            AI tersinkronisasi otomatis dengan modul & soal aktif.
          </p>
        </div>
      </div>
    </aside>
  );
}
