import React, { useState } from "react";
import { Bot, Sparkles, BookOpen, Send } from "lucide-react";
import { MathView } from "../common/MathView";

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
      answer:
        "Irisan dua himpunan $A \\cap B$ adalah anggota yang ada di **kedua himpunan sekaligus**:\n\n$$A \\cap B = \\{x \\mid x \\in A \\land x \\in B\\}$$\n\n**Contoh simpel:**\nKalau $A = \\{2, 4, 6\\}$ dan $B = \\{4, 6, 8\\}$, angka yang kembar di dua himpunan itu cuma $\\{4, 6\\}$. Gampang kan?"
    },
    {
      q: "Jelaskan hukum fotosintesis secara singkat",
      chip: "Fotosintesis Singkat",
      answer:
        "Intinya, tanaman memasak makanannya sendiri memanfaatkan sinar matahari:\n\n$$6CO_2 + 6H_2O \\xrightarrow{\\text{cahaya}} C_6H_{12}O_6 + 6O_2$$\n\nKarbon dioksida dan air diubah jadi **gula (energi tanaman)** plus melepas **oksigen bersih** yang kita hirup setiap hari."
    },
    {
      q: "Kenapa rumus pythagoras a² + b² = c²?",
      chip: "Rumus Pythagoras Berlaku",
      answer:
        "Pada segitiga siku-siku, luas bujur sangkar di sisi miring ($c$) selalu persis sama dengan gabungan luas kedua sisi lainnya:\n\n$$a^2 + b^2 = c^2 \\implies c = \\sqrt{a^2 + b^2}$$\n\nIni bukti kenapa jalan pintas diagonal selalu jadi rute paling efisien saat mengukur jarak lurus."
    }
  ];

  const handleSelectHeroQuestion = (idx: number) => {
    if (idx === activeHeroQ && !isHeroThinking) return;
    setIsHeroThinking(true);
    setActiveHeroQ(idx);
    setTimeout(() => {
      setIsHeroThinking(false);
    }, 450);
  };

  return (
    <div className="hero-simulator-card">
      <div className="simulator-header">
        <div className="simulator-title-left">
          <Bot size={17} color="#4b6623" />
          <span>Coba Tanya Nara Sekarang</span>
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
            <MathView text={heroQuestions[activeHeroQ].answer} />
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
        >
          <span>Tanya Nara</span>
          <Send size={13} />
        </button>
      </div>
    </div>
  );
}

export default SimulatorNaraCard;
