import React, { useState } from "react";
import { Bot, Sparkles, BookOpen, Send } from "lucide-react";

export interface SimulatorNaraCardProps {
  onActionLaunch: () => void;
}

export function SimulatorNaraCard({ onActionLaunch }: SimulatorNaraCardProps) {
  const [activeHeroQ, setActiveHeroQ] = useState(0);
  const [isHeroThinking, setIsHeroThinking] = useState(false);
  const [heroPromptInput, setHeroPromptInput] = useState("");

  const heroQuestions = [
    {
      q: "Bagaimana cara mencari irisan himpunan A ∩ B?",
      chip: "Irisan Himpunan A ∩ B",
      formula: "A ∩ B = { x | x ∈ A ∧ x ∈ B }",
      example: "Contoh: A = {2, 4, 6} dan B = {4, 6, 8} ⟹ Irisan = {4, 6}",
      note: "Anggota yang ada di kedua himpunan sekaligus. Beres dalam 3 detik."
    },
    {
      q: "Jelaskan reaksi fotosintesis secara singkat",
      chip: "Fotosintesis Singkat",
      formula: "6CO₂ + 6H₂O + Energi Surya ⟶ C₆H₁₂O₆ + 6O₂",
      example: "Karbon dioksida + air disintesis daun menjadi glukosa padat energi.",
      note: "Melepas oksigen murni (O₂) ke atmosfer sebagai produk sampingan."
    },
    {
      q: "Kenapa rumus pythagoras a² + b² = c²?",
      chip: "Teorema Pythagoras",
      formula: "a² + b² = c²  ⟹  c = √(a² + b²)",
      example: "Luas bujur sangkar sisi miring = total luas kedua sisi tegak.",
      note: "Dasar perhitungan jarak lurus diagonal terpendek dalam ruang Euclid."
    }
  ];

  const handleSelectHeroQuestion = (idx: number) => {
    if (idx === activeHeroQ && !isHeroThinking) return;
    setIsHeroThinking(true);
    setActiveHeroQ(idx);
    setTimeout(() => {
      setIsHeroThinking(false);
    }, 350);
  };

  return (
    <div className="hero-simulator-card">
      <div className="simulator-header">
        <div className="simulator-title-left">
          <Bot size={17} color="#4b6623" />
          <span>Coba Tanya Nara Sekarang</span>
        </div>
        <div className="simulator-status-badge">
          <span className="status-dot-pulse" />
          <span>RESPONS: SUB-0.2ms</span>
        </div>
      </div>

      <div className="simulator-chip-selector">
        <span
          style={{
            fontSize: 11,
            fontFamily: "'DM Mono', monospace",
            color: "#60706a",
            marginRight: 4,
            textTransform: "uppercase"
          }}
        >
          PILIH CONTOH:
        </span>
        {heroQuestions.map((item, idx) => (
          <button
            key={idx}
            className={`sim-chip ${activeHeroQ === idx ? "active" : ""}`}
            onClick={() => handleSelectHeroQuestion(idx)}
            type="button"
          >
            <Sparkles size={12} />
            <span>{item.chip}</span>
          </button>
        ))}
      </div>

      <div className="simulator-chat-body">
        <div className="sim-bubble-user">
          <span>{heroQuestions[activeHeroQ].q}</span>
        </div>

        {isHeroThinking ? (
          <div className="sim-bubble-ai sim-typing-indicator">
            <span className="sim-dot" />
            <span className="sim-dot" />
            <span className="sim-dot" />
            <span style={{ fontSize: 12.5, color: "#60706a", marginLeft: 8 }}>
              Nara sedang menerangkan konsep...
            </span>
          </div>
        ) : (
          <div className="sim-bubble-ai">
            <div className="sim-formula-box font-mono">
              <span className="formula-accent">↳</span>
              <code>{heroQuestions[activeHeroQ].formula}</code>
            </div>
            <p className="sim-body-text">{heroQuestions[activeHeroQ].example}</p>
            <div className="sim-footer-note">
              <span>{heroQuestions[activeHeroQ].note}</span>
            </div>
          </div>
        )}
      </div>

      {/* Clean Single Input Bar */}
      <div className="simulator-input-seamless">
        <div className="sim-input-shell">
          <BookOpen size={16} color="#798782" />
          <input
            type="text"
            placeholder="Ketik topik atau rumus yang bikin kamu bingung..."
            value={heroPromptInput}
            onChange={(e) => setHeroPromptInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onActionLaunch();
            }}
            className="clean-input sim-input-field"
            style={{
              border: "none",
              background: "transparent",
              outline: "none",
              boxShadow: "none"
            }}
          />
        </div>
        <button
          className="sim-input-submit-btn sim-btn-send"
          onClick={onActionLaunch}
          type="button"
        >
          <span>Tanya Nara</span>
          <Send size={13} />
        </button>
      </div>
    </div>
  );
}

export default SimulatorNaraCard;