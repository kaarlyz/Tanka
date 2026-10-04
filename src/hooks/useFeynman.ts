import { useState, useRef, useEffect, useCallback } from "react";
import { FeynmanResult } from "../types";

export interface UseFeynmanProps {
  activeDocTitle: string;
  selectedModel: string;
  showNotice: (msg: string) => void;
}

export function useFeynman({ activeDocTitle, selectedModel, showNotice }: UseFeynmanProps) {
  const [feynmanTopic, setFeynmanTopic] = useState("");
  const [feynmanExplanation, setFeynmanExplanation] = useState("");
  const [isEvaluatingFeynman, setIsEvaluatingFeynman] = useState(false);
  const [feynmanResult, setFeynmanResult] = useState<FeynmanResult | null>(null);

  const [isRecordingFeynman, setIsRecordingFeynman] = useState(false);
  const [feynmanRecordingSeconds, setFeynmanRecordingSeconds] = useState(0);
  const feynmanRecognitionRef = useRef<any>(null);
  const feynmanMediaStreamRef = useRef<MediaStream | null>(null);

  const handleEvaluateFeynman = useCallback(async () => {
    if (!feynmanExplanation.trim()) {
      showNotice("Tuliskan penjelasan pemahaman Anda terlebih dahulu");
      return;
    }

    setIsEvaluatingFeynman(true);
    try {
      const res = await fetch("/api/ai/feynman-evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: feynmanTopic.trim() || activeDocTitle,
          explanation: feynmanExplanation.trim(),
          model: selectedModel
        })
      });
      const data = await res.json();
      if (data.evaluation) {
        setFeynmanResult(data.evaluation);
        showNotice("Evaluasi Feynman selesai");
      } else {
        showNotice(data.error || "Gagal mengevaluasi pemahaman");
      }
    } catch {
      showNotice("Koneksi ke 9Router gagal");
    } finally {
      setIsEvaluatingFeynman(false);
    }
  }, [feynmanExplanation, feynmanTopic, activeDocTitle, selectedModel, showNotice]);

  const handleToggleFeynmanRecording = useCallback(async () => {
    if (isRecordingFeynman) {
      if (feynmanRecognitionRef.current) {
        try {
          feynmanRecognitionRef.current.stop();
        } catch {}
      }
      if (feynmanMediaStreamRef.current) {
        feynmanMediaStreamRef.current.getTracks().forEach((track) => track.stop());
        feynmanMediaStreamRef.current = null;
      }
      setIsRecordingFeynman(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      feynmanMediaStreamRef.current = stream;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = "id-ID";
        recognition.continuous = true;
        recognition.interimResults = true;

        const baseText = feynmanExplanation.trim();

        recognition.onresult = (event: any) => {
          let currentSessionText = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentSessionText += event.results[i][0].transcript + " ";
          }
          const fullText = (baseText ? baseText + " " : "") + currentSessionText.trim();
          setFeynmanExplanation(fullText);
        };

        recognition.onerror = (event: any) => {
          console.warn("Speech recognition warning:", event.error);
        };

        recognition.start();
        feynmanRecognitionRef.current = recognition;
      } else {
        showNotice("Browser tidak mendukung transkripsi langsung, mikrofon aktif.");
      }

      setIsRecordingFeynman(true);
      setFeynmanRecordingSeconds(0);
    } catch (err: any) {
      console.error("Gagal akses mikrofon:", err);
      showNotice("Izin mikrofon diperlukan untuk merekam penjelasan.");
    }
  }, [isRecordingFeynman, feynmanExplanation, showNotice]);

  useEffect(() => {
    let interval: any = null;
    if (isRecordingFeynman) {
      interval = setInterval(() => {
        setFeynmanRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setFeynmanRecordingSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isRecordingFeynman]);

  return {
    feynmanTopic,
    setFeynmanTopic,
    feynmanExplanation,
    setFeynmanExplanation,
    isEvaluatingFeynman,
    feynmanResult,
    setFeynmanResult,
    isRecordingFeynman,
    feynmanRecordingSeconds,
    handleEvaluateFeynman,
    handleToggleFeynmanRecording
  };
}
