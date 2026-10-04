import { useState } from "react";
import { Hash, Sparkles, Copy, Check } from "lucide-react";
import { CheatsheetItem } from "../../types";
import { MathView } from "../common/MathView";
import { AIProcessLoader } from "../common/AIProcessLoader";

interface CheatsheetTabProps {
  cheatsheet: CheatsheetItem[];
  onGenerateCheatsheet: () => void;
  isGeneratingCheatsheet: boolean;
  showNotice: (msg: string) => void;
}

export function CheatsheetTab({
  cheatsheet,
  onGenerateCheatsheet,
  isGeneratingCheatsheet,
  showNotice
}: CheatsheetTabProps) {
  const [copiedFormula, setCopiedFormula] = useState<string | null>(null);

  const handleCopy = (formula: string) => {
    navigator.clipboard.writeText(formula);
    setCopiedFormula(formula);
    showNotice("Rumus disalin ke clipboard");
    setTimeout(() => setCopiedFormula(null), 2000);
  };

  return (
    <div className="tab-pane-animate" style={{ maxWidth: 960, margin: "0 auto", paddingBottom: 48 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 8 }}>
        <div>
          <h2 style={{ fontSize: 19, fontWeight: 800, color: "#17201d", margin: 0 }}>
            Rumus Kunci & Glosarium Inti
          </h2>
          <p style={{ fontSize: 12, color: "#6f7975", marginTop: 4 }}>
            Kumpulan formula matematika/sains dan definisi kunci yang diekstraksi dari materi aktif.
          </p>
        </div>

        <button
          type="button"
          onClick={onGenerateCheatsheet}
          disabled={isGeneratingCheatsheet}
          style={{
            backgroundColor: "#18221f",
            color: "#c8f064",
            border: "none",
            borderRadius: 8,
            padding: "8px 14px",
            fontSize: 12,
            fontWeight: 700,
            cursor: isGeneratingCheatsheet ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6
          }}
        >
          <Sparkles size={14} />
          <span>{isGeneratingCheatsheet ? "Mengekstrak..." : "Ekstrak Rumus"}</span>
        </button>
      </div>

      {isGeneratingCheatsheet ? (
        <AIProcessLoader
          title="Mengekstrak Rumus Kunci & Kaidah"
          subtitle="AI memindai dokumen untuk memisahkan formula KaTeX dan glosarium penting"
          badge="Formula Extraction"
          steps={[
            { label: "Deteksi Blok KaTeX & Variabel", detail: "Mengidentifikasi relasi matematika dan simbol" },
            { label: "Klasifikasi Kategori Rumus", detail: "Memilah rumus dasar, turunan, dan rumus cepat" },
            { label: "Validasi Sintaks Notasi", detail: "Memastikan format KaTeX siap disalin" }
          ]}
        />
      ) : cheatsheet.length === 0 ? (
        <div
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #dde1da",
            borderRadius: 12,
            padding: "36px 20px",
            textAlign: "center"
          }}
        >
          <Hash size={32} color="#727d78" style={{ margin: "0 auto 10px" }} />
          <div style={{ fontSize: 16, fontWeight: 700, color: "#17201d" }}>
            Belum Ada Lembar Rumus
          </div>
          <p style={{ fontSize: 13, color: "#6f7975", maxWidth: 440, margin: "6px auto 16px" }}>
            Klik tombol di bawah agar AI mengekstrak semua formula dan variabel kunci ke kartu contekan cepat.
          </p>
          <button
            type="button"
            onClick={onGenerateCheatsheet}
            style={{
              backgroundColor: "#18221f",
              color: "#c8f064",
              border: "none",
              borderRadius: 8,
              padding: "10px 20px",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            Ekstrak Rumus Sekarang
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
          {cheatsheet.map((item, idx) => (
            <div
              key={idx}
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #dde1da",
                borderRadius: 12,
                padding: "16px 18px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between"
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#18211e" }}>
                    {item.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(item.formula)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: copiedFormula === item.formula ? "#10b981" : "#6f7975",
                      cursor: "pointer",
                      padding: 2
                    }}
                    title="Salin rumus"
                  >
                    {copiedFormula === item.formula ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>

                <div
                  style={{
                    backgroundColor: "#f8f9f5",
                    border: "1px solid #e5e9e0",
                    borderRadius: 8,
                    padding: "10px 12px",
                    margin: "8px 0 12px",
                    textAlign: "center"
                  }}
                >
                  <MathView text={`$$${item.formula}$$`} />
                </div>

                <p style={{ fontSize: 12, color: "#45544e", margin: 0, lineHeight: 1.5 }}>
                  <MathView text={item.meaning} />
                </p>
              </div>

              {item.category && (
                <div style={{ marginTop: 12, paddingTop: 8, borderTop: "1px solid #f1f4ee" }}>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: "#566b36", textTransform: "uppercase" }}>
                    {item.category}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
