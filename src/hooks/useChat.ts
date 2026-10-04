import { useState, useRef, useCallback } from "react";
import { ChatMessage, ChatAttachment } from "../types";

export interface StagedChatFile {
  file: File;
  name: string;
  type: "image" | "document";
  previewUrl?: string;
  base64: string;
}

export interface UseChatProps {
  activeDocId: string | null;
  selectedModel: string;
  showNotice: (msg: string) => void;
}

export function useChat({ activeDocId, selectedModel, showNotice }: UseChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatSending, setIsChatSending] = useState(false);
  const [stagedAttachment, setStagedAttachment] = useState<StagedChatFile | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const handleAttachFile = useCallback(async (file: File) => {
    if (!file) return;
    const isImage = file.type.startsWith("image/") || /\.(png|jpe?g|webp|bmp)$/i.test(file.name);
    const isDoc = file.type === "application/pdf" || /\.(pdf|docx?|pptx?|txt)$/i.test(file.name);

    if (!isImage && !isDoc) {
      showNotice("Format berkas tidak didukung. Unggah Gambar (PNG/JPG) atau Dokumen (PDF/DOCX/TXT).");
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      showNotice("Ukuran berkas melebihi batas 25MB.");
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        const base64 = result.split(",")[1];
        setStagedAttachment({
          file,
          name: file.name,
          type: isImage ? "image" : "document",
          previewUrl: isImage ? result : undefined,
          base64
        });
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      showNotice("Gagal membaca berkas: " + err.message);
    }
  }, [showNotice]);

  const handleClearAttachment = useCallback(() => {
    setStagedAttachment(null);
  }, []);

  const handleSendMessage = useCallback(async (customPrompt?: string) => {
    const rawText = customPrompt || chatInput;
    if ((!rawText.trim() && !stagedAttachment) || isChatSending) return;

    let text = rawText.trim();
    if (!text && stagedAttachment) {
      text = stagedAttachment.type === "image"
        ? "Tolong jelaskan dan bedah soal/materi pada gambar ini."
        : `Tolong jelaskan dan rangkum poin penting dari dokumen ${stagedAttachment.name}.`;
    }

    const currentAttachment = stagedAttachment;
    setStagedAttachment(null);
    if (!customPrompt) setChatInput("");

    const attachmentMeta: ChatAttachment | undefined = currentAttachment
      ? {
          name: currentAttachment.name,
          type: currentAttachment.type,
          url: currentAttachment.previewUrl,
          size: currentAttachment.file.size
        }
      : undefined;

    const userMsg: ChatMessage = {
      id: "msg_" + Date.now(),
      role: "user",
      content: text,
      attachment: attachmentMeta
    };

    setMessages((prev) => [...prev, userMsg]);
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
          docId: activeDocId || null,
          message: text,
          attachment: currentAttachment ? {
            fileName: currentAttachment.name,
            fileData: currentAttachment.base64,
            fileType: currentAttachment.type
          } : null,
          model: selectedModel,
          history: messages.slice(-6).map(m => ({ role: m.role, content: m.content }))
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
  }, [activeDocId, chatInput, stagedAttachment, isChatSending, selectedModel, messages, showNotice]);

  return {
    messages,
    setMessages,
    chatInput,
    setChatInput,
    isChatSending,
    chatEndRef,
    stagedAttachment,
    setStagedAttachment,
    handleAttachFile,
    handleClearAttachment,
    handleSendMessage
  };
}
