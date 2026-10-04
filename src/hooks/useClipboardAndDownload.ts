import { useState, useCallback } from "react";

export function useClipboardAndDownload(showNotice: (msg: string) => void) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fallbackCopy = useCallback((text: string, onSuccess: () => void) => {
    let successful = false;
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.width = "2em";
      textArea.style.height = "2em";
      textArea.style.padding = "0";
      textArea.style.border = "none";
      textArea.style.outline = "none";
      textArea.style.boxShadow = "none";
      textArea.style.background = "transparent";
      textArea.style.opacity = "0.01";
      document.body.appendChild(textArea);

      textArea.focus();
      textArea.select();
      textArea.setSelectionRange(0, textArea.value.length);

      successful = document.execCommand("copy");
      document.body.removeChild(textArea);
    } catch {
      successful = false;
    }

    if (successful) {
      onSuccess();
    } else {
      try {
        const ok = window.prompt("Salin teks di bawah ini (tekan Salin / Ctrl+C):", text);
        if (ok !== null) {
          onSuccess();
        } else {
          showNotice("Gagal menyalin teks ke clipboard");
        }
      } catch {
        showNotice("Gagal menyalin teks ke clipboard");
      }
    }
  }, [showNotice]);

  const copyToClipboard = useCallback((text?: string, label = "Teks", key = "default") => {
    if (!text || !text.trim()) {
      showNotice(`Tidak ada teks ${label.toLowerCase()} yang dapat disalin`);
      return;
    }

    const onCopiedSuccess = () => {
      setCopiedId(key);
      setTimeout(() => setCopiedId(null), 2000);
      showNotice(`${label} berhasil disalin ke clipboard`);
    };

    const isSecure = typeof window !== "undefined" && window.isSecureContext === true;
    if (isSecure && typeof navigator !== "undefined" && navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      navigator.clipboard.writeText(text).then(() => {
        onCopiedSuccess();
      }).catch(() => {
        fallbackCopy(text, onCopiedSuccess);
      });
      return;
    }

    fallbackCopy(text, onCopiedSuccess);
  }, [fallbackCopy, showNotice]);

  const downloadAsMarkdown = useCallback((filename = "dokumen.md", content = "") => {
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showNotice(`Mengunduh ${filename}...`);
  }, [showNotice]);

  return {
    copiedId,
    copyToClipboard,
    downloadAsMarkdown
  };
}
