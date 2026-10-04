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
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [feynmanRecordingSeconds, setFeynmanRecordingSeconds] = useState(0);
  const feynmanRecognitionRef = useRef<any>(null);
  const feynmanMediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

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
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (isRecordingFeynman) {
      if (feynmanRecognitionRef.current) {
        try {
          feynmanRecognitionRef.current.stop();
        } catch {}
      }

      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        const recorder = mediaRecorderRef.current;
        recorder.onstop = async () => {
          if (audioChunksRef.current.length > 0) {
            const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/webm" });
            // If browser has no live SpeechRecognition or transcript is empty, send to backend STT
            if (!SpeechRecognition || !feynmanExplanation.trim()) {
              setIsTranscribing(true);
              try {
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = async () => {
                  try {
                    const base64Data = (reader.result as string).split(",")[1];
                    const res = await fetch("/api/ai/transcribe-audio", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ audioBase64: base64Data, language: "id" })
                    });
                    const data = await res.json();
                    if (data.success && data.text) {
                      setFeynmanExplanation((prev) => (prev ? prev.trim() + " " : "") + data.text.trim());
                      showNotice("Transkripsi suara berhasil!");
                    } else {
                      showNotice("Tidak ada suara terdeteksi dalam rekaman.");
                    }
                  } catch {
                    showNotice("Gagal memproses transkripsi audio");
                  } finally {
                    setIsTranscribing(false);
                  }
                };
              } catch {
                setIsTranscribing(false);
              }
            }
          }
        };
        try {
          recorder.stop();
        } catch {}
      }

      if (feynmanMediaStreamRef.current) {
        feynmanMediaStreamRef.current.getTracks().forEach((track) => track.stop());
        feynmanMediaStreamRef.current = null;
      }
      setIsRecordingFeynman(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      feynmanMediaStreamRef.current = stream;
      audioChunksRef.current = [];

      // Setup MediaRecorder for robust universal browser recording (Firefox, Safari, Chromium)
      if (typeof MediaRecorder !== "undefined") {
        const mimeType = MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : MediaRecorder.isTypeSupported("audio/ogg")
          ? "audio/ogg"
          : "";
        const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
        };
        recorder.start(250);
        mediaRecorderRef.current = recorder;
      }

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
    isTranscribing,
    feynmanRecordingSeconds,
    handleEvaluateFeynman,
    handleToggleFeynmanRecording
  };
}
