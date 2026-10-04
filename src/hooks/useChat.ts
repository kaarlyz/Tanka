import { useState, useRef, useCallback } from "react";
import { ChatMessage } from "../types";

export interface UseChatProps {
  activeDocId: string | null;
  selectedModel: string;
  showNotice: (msg: string) => void;
}

export function useChat({ activeDocId, selectedModel, showNotice }: UseChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatSending, setIsChatSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = useCallback(async (customPrompt?: string) => {
    const text = customPrompt || chatInput;
    if (!text.trim() || !activeDocId || isChatSending) return;

    const userMsg: ChatMessage = {
      id: "msg_" + Date.now(),
      role: "user",
      content: text.trim()
    };
    setMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setChatInput("");
    setIsChatSending(true);
    setTimeout(() => {
      if (chatEndRef.current) {
        chatEndRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }, 50);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docId: activeDocId,
          message: text.trim(),
          model: selectedModel
        })
      });
      const data = await res.json();
      if (data.reply) {
        setMessages((prev) => [
          ...prev,
          {
            id: "reply_" + Date.now(),
            role: "assistant",
            content: data.reply
          }
        ]);
        setTimeout(() => {
          if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
          }
        }, 100);
      } else {
        showNotice(data.error || "Gagal menghubungi Tutor AI");
      }
    } catch {
      showNotice("Koneksi ke server AI gagal");
    } finally {
      setIsChatSending(false);
    }
  }, [activeDocId, chatInput, isChatSending, selectedModel, showNotice]);

  return {
    messages,
    setMessages,
    chatInput,
    setChatInput,
    isChatSending,
    chatEndRef,
    handleSendMessage
  };
}
