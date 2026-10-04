import { useState, useRef, useEffect } from "react";
import { Brain, Mic, Sparkles, CheckCircle2, AlertTriangle, Lightbulb, MessageSquare } from "lucide-react";
import { FeynmanEvaluation } from "../../types";
import { MathView } from "../common/MathView";
import { AIProcessLoader } from "../common/AIProcessLoader";

interface FeynmanTabProps {
  activeDocId: string | null;
  activeDocTitle: string;
  onEvaluate: (topic: string, explanation: string) => Promise<void>;
  isEvaluating: boolean;
  evaluationResult: FeynmanEvaluation | null;
  showNotice: (msg: string) => void;
}

export function FeynmanTab({
  activeDocTitle,
  onEvaluate,
  isEvaluating,
  evaluationResult,
  showNotice
}: FeynmanTabProps) {
  const [topic, setTopic] = useState("");
  const [explanation, setExplanation] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);

  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
    };
  }, []);

  const handleToggleRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
      if (timerRef.current) clearInterval(timerRef.current);
      setIsRecording(false);
      showNotice("Rekaman suara selesai");
    } else {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        showNotice("Browser Anda tidak mendukung Web Speech Recognition");
        return;
      }

      try {
        const recognition = new SpeechRecognition();
        recognition.lang = "id-ID";
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event: any) => {
          let fullTranscript = "";
          for (let i = 0; i < event.results.length; i++) {
            fullTranscript += event.results[i][0].transcript + " ";
          }
          setExplanation(fullTranscript.trim());
        };

        recognition.onerror = (e: any) => {
          console.warn("Speech recognition error:", e);
          setIsRecording(false);
          if (timerRef.current) clearInterval(timerRef.current);
        };

        recognition.start();
        recognitionRef.current = recognition;
        setIsRecording(true);
        setRecordSeconds(0);
        timerRef.current = setInterval(() => {
          setRecordSeconds((s) => s + 1);
        }, 1000);
      } catch (err: any) {
        showNotice("Gagal memulai rekam suara: " + err.message);
      }
    }
  };

  return (
    <div className="tab-pane-animate" style={{ maxWidth: 960, margin: "0 auto", paddingBottom: 48 }}>
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Brain size={20} color="#4b6623" />
          <h2 style={{ fontSize: 19, fontWeight: 800, color: "#17201d", margin: 0 }}>
            Mode Feynman: Uji Pemahaman Sendiri
          </h2>
        </div>
        <p style={{ fontSize: 12.5, color: "#6f7975", marginTop: 4 }}>
          Jelaskan kembali suatu konsep dengan kata-kata sendiri. AI akan menguji akurasi, mendeteksi miskonsepsi, dan memberi analogi pengunci memori.
        </p>
      </div>

      <div
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid #dde1da",
          borderRadius: 12,
          padding: "24px 26px",
          marginBottom: 18,
          boxShadow: "0 10px 35px rgba(27, 39, 35, 0.04)"
        }}
      >
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#45544e", marginBottom: 6 }}>
            Konsep atau Istilah yang Ingin Dijelaskan
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={`Contoh: Konsep pada ${activeDocTitle || "Materi Ini"}...`}
            style={{
              width: "100%",
              backgroundColor: "#fafbf8",
              border: "1px solid #dce1da",
              borderRadius: 8,
              padding: "10px 14px",
              fontSize: 14,
              color: "#17201d",
              outline: "none"
            }}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#45544e" }}>
              Penjelasan Anda (Gunakan bahasa sendiri atau rekam suara)
            </label>
            <button
              type="button"
              onClick={handleToggleRecording}
              style={{
                backgroundColor: isRecording ? "#fee2e2" : "#f1f5eb",
                border: `1px solid ${isRecording ? "#fca5a5" : "#cddfc0"}`,
                color: isRecording ? "#b91c1c" : "#3b581e",
                borderRadius: 6,
                padding: "4px 10px",
                fontSize: 11.5,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 5
              }}
            >
              {isRecording ? (
                <>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#ef4444" }} />
                  <span>Merekam ({Math.floor(recordSeconds / 60)}:{String(recordSeconds % 60).padStart(2, "0")}) · Selesai</span>
                </>
              ) : (
                <>
                  <Mic size={13} color="#4b6623" />
                  <span>Rekam Suara</span>
                </>
              )}
            </button>
          </div>
          <textarea
            rows={5}
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            placeholder={isRecording ? "Mendengarkan ucapan Anda... Teruslah berbicara..." : "Tuliskan pemahaman Anda di sini atau gunakan 'Rekam Suara'..."}
            style={{
              width: "100%",
              backgroundColor: isRecording ? "#fafdf5" : "#fafbf8",
              border: `1px solid ${isRecording ? "#779f2f" : "#dce1da"}`,
              borderRadius: 8,
              padding: "12px 14px",
              fontSize: 14,
              lineHeight: "1.6",
              color: "#17201d",
              outline: "none",
              resize: "vertical"
            }}
          />
        </div>

        <button
          type="button"
          onClick={() => onEvaluate(topic, explanation)}
          disabled={isEvaluating || !explanation.trim()}
          style={{
            backgroundColor: "#18221f",
            color: "#c8f064",
            border: "none",
            borderRadius: 8,
            padding: "10px 18px",
            fontSize: 13,
            fontWeight: 700,
            cursor: isEvaluating || !explanation.trim() ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6
          }}
        >
          <Sparkles size={15} />
          <span>{isEvaluating ? "Mengevaluasi Penjelasan..." : "Uji & Nilai Pemahaman Saya"}</span>
        </button>
      </div>

      {/* Loading State with AIProcessLoader */}
      {isEvaluating && (
        <AIProcessLoader
          title="Mengevaluasi Penjelasan Feynman"
          subtitle="AI sedang membedah ketepatan sains dan mendeteksi celah pemahaman Anda"
          badge="Feynman Rubric"
          steps={[
            { label: "Analisis Semantik", detail: "Mencocokkan istilah dan argumen dengan materi baku" },
            { label: "Deteksi Miskonsepsi", detail: "Mencari celah pemikiran atau definisi yang terbalik" },
            { label: "Formulasi Analogi", detail: "Merancang analogi intuitif untuk memperkuat retensi" }
          ]}
        />
      )}

      {/* Evaluation Results Card */}
      {evaluationResult && !isEvaluating && (
        <div
          className="modal-scale-in"
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #dde1da",
            borderRadius: 14,
            padding: "24px 26px",
            boxShadow: "0 10px 35px rgba(27, 39, 35, 0.04)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, borderBottom: "1px solid #edf0eb", paddingBottom: 14 }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#566b36", textTransform: "uppercase" }}>Hasil Evaluasi</span>
              <h3 style={{ margin: "4px 0 0", fontSize: 17, fontWeight: 800, color: "#17201d" }}>
                {evaluationResult.verdict}
              </h3>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: 11, color: "#6b7280" }}>Skor Akurasi:</span>
              <div style={{ fontSize: 24, fontWeight: 900, color: evaluationResult.score >= 80 ? "#15803d" : evaluationResult.score >= 60 ? "#b45309" : "#b91c1c" }}>
                {evaluationResult.score} <span style={{ fontSize: 13, fontWeight: 500, color: "#9ca3af" }}>/ 100</span>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Accurate Points */}
            {evaluationResult.accuratePoints?.length > 0 && (
              <div style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "12px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, color: "#166534", fontWeight: 700, fontSize: 13 }}>
                  <CheckCircle2 size={16} />
                  <span>Poin yang Dipahami dengan Tepat:</span>
                </div>
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: 12.5, color: "#166534", lineHeight: 1.5 }}>
                  {evaluationResult.accuratePoints.map((pt, i) => (
                    <li key={i}><MathView text={pt} /></li>
                  ))}
                </ul>
              </div>
            )}

            {/* Missed or Flawed Points */}
            {evaluationResult.missedOrFlawedPoints?.length > 0 && (
              <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "12px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, color: "#991b1b", fontWeight: 700, fontSize: 13 }}>
                  <AlertTriangle size={16} />
                  <span>Titik yang Perlu Diperbaiki / Terlewat:</span>
                </div>
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: 12.5, color: "#991b1b", lineHeight: 1.5 }}>
                  {evaluationResult.missedOrFlawedPoints.map((pt, i) => (
                    <li key={i}><MathView text={pt} /></li>
                  ))}
                </ul>
              </div>
            )}

            {/* Perfect Analogy */}
            {evaluationResult.perfectAnalogy && (
              <div style={{ backgroundColor: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: "12px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, color: "#92400e", fontWeight: 700, fontSize: 13 }}>
                  <Lightbulb size={16} />
                  <span>Analogi Pengunci Memori:</span>
                </div>
                <p style={{ margin: 0, fontSize: 12.5, color: "#78350f", lineHeight: 1.5 }}>
                  <MathView text={evaluationResult.perfectAnalogy} />
                </p>
              </div>
            )}

            {/* Feedback */}
            {evaluationResult.feedback && (
              <div style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, color: "#334155", fontWeight: 700, fontSize: 13 }}>
                  <MessageSquare size={16} />
                  <span>Ulasan Tutor:</span>
                </div>
                <p style={{ margin: 0, fontSize: 12.5, color: "#475569", lineHeight: 1.5 }}>
                  <MathView text={evaluationResult.feedback} />
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
