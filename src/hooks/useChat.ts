import { useState, useRef, useCallback, useEffect } from "react";
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
  const [isFreeMode, setIsFreeMode] = useState<boolean>(!activeDocId);
  const effectiveDocId = isFreeMode ? null : activeDocId;
  const currentSessionId = effectiveDocId || "global";

  // Otomatis sinkronkan mode ketika dokumen aktif berubah
  useEffect(() => {
    if (activeDocId) {
      setIsFreeMode(false);
    } else {
      setIsFreeMode(true);
    }
  }, [activeDocId]);

  // Inisialisasi state awal langsung dari localStorage sesi aktif agar tidak ada jeda kosong
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const cached = localStorage.getItem(`tanka_chat_${currentSessionId}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  const [chatInput, setChatInput] = useState("");
  const [isChatSending, setIsChatSending] = useState(false);
  const [stagedAttachment, setStagedAttachment] = useState<StagedChatFile | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Isolasi sesi percakapan: Setiap kali berpindah dokumen, muat riwayat sesi terkait
  useEffect(() => {
    const sessionId = currentSessionId;
    const storageKey = `tanka_chat_${sessionId}`;

    // 1. Baca cache lokal seketika
    try {
      const cached = localStorage.getItem(storageKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          setMessages(parsed);
        } else {
          setMessages([]);
        }
      } else {
        setMessages([]);
      }
    } catch {
      setMessages([]);
    }

    setStagedAttachment(null);
    setChatInput("");

    // 2. Sinkronkan dengan database SQLite backend
    let isCancelled = false;
    fetch(`/api/documents/${sessionId}/chat`)
      .then((res) => res.json())
      .then((data) => {
        if (isCancelled) return;
        if (data && Array.isArray(data.messages)) {
          const mapped: ChatMessage[] = data.messages.map((m: any) => ({
            id: m.id,
            role: m.role as "user" | "assistant",
            content: m.content,
            timestamp: m.created_at
          }));
          setMessages(mapped);
          try {
            localStorage.setItem(storageKey, JSON.stringify(mapped));
          } catch {}
        }
      })
      .catch(() => {
        // Abaikan jika offline / request gagal, tetap pakai state localStorage
      });

    return () => {
      isCancelled = true;
    };
  }, [currentSessionId]);

  const handleClearChat = useCallback(async () => {
    const sessionId = currentSessionId;
    setMessages([]);
    try {
      localStorage.removeItem(`tanka_chat_${sessionId}`);
      await fetch(`/api/documents/${sessionId}/chat`, { method: "DELETE" });
    } catch {}
  }, [currentSessionId]);

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
      if (isImage) {
        // Kompresi gambar kamera ponsel secara otomatis agar tidak timeout di koneksi internet / cloudflare
        const reader = new FileReader();
        reader.onload = (e) => {
          const rawUrl = e.target?.result as string;
          const img = new Image();
          img.onload = () => {
            const maxDim = 1600;
            let w = img.width;
            let h = img.height;
            if (w > maxDim || h > maxDim) {
              if (w > h) {
                h = Math.round((h * maxDim) / w);
                w = maxDim;
              } else {
                w = Math.round((w * maxDim) / h);
                h = maxDim;
              }
            }
            const canvas = document.createElement("canvas");
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(img, 0, 0, w, h);
              const compressedUrl = canvas.toDataURL("image/jpeg", 0.82);
              const base64 = compressedUrl.split(",")[1];
              setStagedAttachment({
                file,
                name: file.name,
                type: "image",
                previewUrl: compressedUrl,
                base64
              });
              return;
            }
            // Fallback jika canvas gagal
            setStagedAttachment({
              file,
              name: file.name,
              type: "image",
              previewUrl: rawUrl,
              base64: rawUrl.split(",")[1]
            });
          };
          img.src = rawUrl;
        };
        reader.readAsDataURL(file);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        const base64 = result.split(",")[1];
        setStagedAttachment({
          file,
          name: file.name,
          type: "document",
          previewUrl: undefined,
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
      timestamp: Date.now(),
      attachment: attachmentMeta
    };

    const nextUserMessages = [...messages, userMsg];
    setMessages(nextUserMessages);
    try {
      localStorage.setItem(`tanka_chat_${currentSessionId}`, JSON.stringify(nextUserMessages));
    } catch {}

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
          docId: effectiveDocId || null,
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
        const assistantMsg: ChatMessage = {
          id: "reply_" + Date.now(),
          role: "assistant",
          content: data.reply,
          timestamp: Date.now()
        };
        setMessages((prev) => {
          const finalMessages = [...prev, assistantMsg];
          try {
            localStorage.setItem(`tanka_chat_${currentSessionId}`, JSON.stringify(finalMessages));
          } catch {}
          return finalMessages;
        });
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
  }, [currentSessionId, effectiveDocId, chatInput, stagedAttachment, isChatSending, selectedModel, messages, showNotice]);

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
    handleSendMessage,
    handleClearChat,
    isFreeMode,
    setIsFreeMode,
    effectiveDocId
  };
}