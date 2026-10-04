import { useState, useCallback } from "react";

export function useAudioSpeech(showNotice: (msg: string) => void) {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const toggleSpeech = useCallback((text?: string) => {
    if (!("speechSynthesis" in window)) {
      showNotice("Browser tidak mendukung fitur audio pembaca teks");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    if (!text) return;

    const cleanText = text.replace(/[*#`_[\]]/g, "").slice(0, 3000);
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "id-ID";
    utterance.rate = 1.05;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  }, [isSpeaking, showNotice]);

  return {
    isSpeaking,
    toggleSpeech
  };
}
