import React from "react";
import { MessageSquare, Sparkles, Trash2, Send, BookOpen } from "lucide-react";
import { DocumentItem, ChatMessage } from "../../types";
import { MathView } from "../common/MathView";

export interface ChatTabProps {
  activeDocTitle: string;
  selectedModel: string;
  messages: ChatMessage[];
  chatInput: string;
  setChatInput: (val: string) => void;
  handleSendMessage: (textToSend?: string) => Promise<void> | void;
  isChatSending: boolean;
}

export function ChatTab({
  activeDocTitle,
  selectedModel,
  messages,
  chatInput,
  setChatInput,
  handleSendMessage,
  isChatSending,
}: ChatTabProps) {
  return (
              <div style={{ maxWidth: 840, margin: "0 auto", display: "flex", flexDirection: "column", height: "calc(100vh - 160px)", minHeight: 400 }}>
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
                    <span>Materi: <strong style={{ color: "#17201d" }}>{activeDocTitle || "Belum dipilih"}</strong></span>
                  </div>
                  <div className="desktop-only" style={{ fontSize: 11, color: "#8a9691", fontFamily: "'DM Mono', monospace" }}>
                    Engine: {selectedModel}
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
                        color: "#4b6623"
                      }}
                    >
                      Tutor sedang menganalisis materi dan menyusun jawaban...
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

                {/* Input Bar */}
                <div style={{ display: "flex", gap: 8 }}>
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
                    placeholder="Tanyakan konsep..."
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
                    disabled={isChatSending || !chatInput.trim()}
                    style={{
                      backgroundColor: "#18221f",
                      color: "#c8f064",
                      border: "none",
                      borderRadius: 8,
                      padding: "0 16px",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: isChatSending || !chatInput.trim() ? "not-allowed" : "pointer",
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
