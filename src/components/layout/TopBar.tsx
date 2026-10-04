import React from "react";
import {
  Menu,
  Clock,
  Play,
  Pause,
  RotateCw,
  Sliders,
  X,
  Plus,
  Minus,
  Calculator,
  Brain,
  Cpu,
  User,
  LogOut,
  UserPlus
} from "lucide-react";
import { ActiveTab, FormulaItem, UserAccount } from "../../types";

export interface TopBarProps {
  setIsMobileDrawerOpen: (val: boolean) => void;
  activeTab: ActiveTab;
  activeDocTitle: string;
  activeDocContent: string;
  timerMode: "focus" | "break";
  timerSeconds: number;
  setTimerSeconds: React.Dispatch<React.SetStateAction<number>>;
  timerDurationMinutes: number;
  setTimerDurationMinutes: (min: number) => void;
  isTimerRunning: boolean;
  setIsTimerRunning: (r: boolean) => void;
  applyTimerDuration: (mins: number, autoStart?: boolean) => void;
  isTimerSettingsOpen: boolean;
  setIsTimerSettingsOpen: (val: boolean) => void;
  customMinutesInput: string;
  setCustomMinutesInput: (val: string) => void;
  playAlarmSound: () => void;
  fetchOrExtractFormulas: () => void;
  activeDocFormulas: FormulaItem[];
  setIsFormulaDrawerOpen: (val: boolean) => void;
  isAiPanelOpen: boolean;
  setIsAiPanelOpen: (val: boolean) => void;
  models: Array<string | any>;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  currentUser?: UserAccount | null;
  onOpenAuthModal?: () => void;
  onLogout?: () => void;
}

export function TopBar({
  setIsMobileDrawerOpen,
  activeTab,
  activeDocTitle,
  activeDocContent,
  timerMode,
  timerSeconds,
  setTimerSeconds,
  timerDurationMinutes,
  setTimerDurationMinutes,
  isTimerRunning,
  setIsTimerRunning,
  applyTimerDuration,
  isTimerSettingsOpen,
  setIsTimerSettingsOpen,
  customMinutesInput,
  setCustomMinutesInput,
  playAlarmSound,
  fetchOrExtractFormulas,
  activeDocFormulas,
  setIsFormulaDrawerOpen,
  isAiPanelOpen,
  setIsAiPanelOpen,
  models,
  selectedModel,
  setSelectedModel,
  currentUser,
  onOpenAuthModal,
  onLogout
}: TopBarProps) {
  const timerMins = Math.floor(timerSeconds / 60);
  const timerSecs = timerSeconds % 60;
  const timerDisplay = `${timerMins.toString().padStart(2, "0")}:${timerSecs.toString().padStart(2, "0")}`;

  return (
    <header
      className="topbar-bar"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: 56,
        padding: "0 14px",
        backgroundColor: "#ffffff",
        borderBottom: "1px solid #dce4d6",
        gap: 8,
        flexShrink: 0,
        zIndex: 100,
        width: "100%",
        boxSizing: "border-box"
      }}
    >
      {/* Sisi Kiri: Menu Drawer & Greeting / Modul Title */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flexShrink: 1 }}>
        <button
          onClick={() => setIsMobileDrawerOpen(true)}
          className="mobile-only"
          style={{
            background: "none",
            border: "none",
            color: "#18221f",
            cursor: "pointer",
            padding: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0
          }}
          aria-label="Buka Menu Samping"
        >
          <Menu size={22} />
        </button>

        <div style={{ minWidth: 0, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: "#4b6623",
                letterSpacing: "0.06em",
                textTransform: "uppercase"
              }}
            >
              {currentUser ? `Hai, ${currentUser.name || currentUser.username}` : (activeTab === "home" ? "TANKA STUDY" : "MODUL")}
            </span>
            {currentUser && (
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  backgroundColor: "#65a30d"
                }}
              />
            )}
          </div>

          <h1
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: "#18211e",
              margin: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: 150,
              lineHeight: 1.2
            }}
          >
            {activeTab === "home" ? "Beranda Belajar" : (activeDocTitle || "Pilih Materi")}
          </h1>
        </div>
      </div>

      {/* Sisi Kanan: Timer Pomodoro Aesthetic & Akun */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
        {/* Timer Pill */}
        <div style={{ position: "relative" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              backgroundColor: timerMode === "focus" ? "#f4f8ed" : "#fef3c7",
              border: `1.5px solid ${timerMode === "focus" ? "#c8e6a0" : "#fde68a"}`,
              borderRadius: 999,
              padding: "4px 8px",
              fontFamily: "'DM Mono', monospace",
              flexShrink: 0,
              boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
            }}
          >
            <button
              onClick={() => setIsTimerSettingsOpen(!isTimerSettingsOpen)}
              style={{ background: "none", border: "none", padding: 0, display: "flex", alignItems: "center", cursor: "pointer" }}
              title="Setel durasi waktu"
            >
              <Clock size={12} color={timerMode === "focus" ? "#3b531a" : "#b45309"} />
            </button>

            <span
              onClick={() => setIsTimerSettingsOpen(!isTimerSettingsOpen)}
              style={{
                fontSize: 12.5,
                fontWeight: 800,
                color: timerMode === "focus" ? "#283912" : "#92400e",
                cursor: "pointer",
                userSelect: "none"
              }}
              title="Setel durasi waktu"
            >
              {timerDisplay}
            </span>

            <button
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              style={{
                background: timerMode === "focus" ? "#e2f2cd" : "#fde68a",
                border: "none",
                borderRadius: "50%",
                width: 18,
                height: 18,
                color: timerMode === "focus" ? "#283912" : "#78350f",
                cursor: "pointer",
                padding: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
              title={isTimerRunning ? "Jeda" : "Mulai"}
            >
              {isTimerRunning ? <Pause size={9} /> : <Play size={9} style={{ marginLeft: 1 }} />}
            </button>

            <button
              onClick={() => setIsTimerSettingsOpen(!isTimerSettingsOpen)}
              style={{
                background: "none",
                border: "none",
                color: isTimerSettingsOpen ? "#166534" : "#78827e",
                cursor: "pointer",
                padding: 0,
                display: "flex"
              }}
              title="Pilihan durasi"
            >
              <Sliders size={10} />
            </button>
          </div>

          {/* Timer Settings Popover */}
          {isTimerSettingsOpen && (
            <div
              className="modal-scale-in"
              style={{
                position: "absolute",
                top: 38,
                right: 0,
                backgroundColor: "#ffffff",
                borderRadius: 14,
                border: "1px solid #dce4d6",
                padding: 14,
                boxShadow: "0 14px 34px rgba(24, 34, 31, 0.18)",
                zIndex: 9999,
                width: 260
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Clock size={13} color="#566b36" />
                  <span style={{ fontSize: 12.5, fontWeight: 800, color: "#18211e" }}>Setel Waktu Belajar</span>
                </div>
                <button
                  onClick={() => setIsTimerSettingsOpen(false)}
                  style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", padding: 2 }}
                >
                  <X size={13} />
                </button>
              </div>

              {/* Preset Chips */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 5, marginBottom: 12 }}>
                {[
                  { label: "5m", mins: 5 },
                  { label: "10m", mins: 10 },
                  { label: "15m", mins: 15 },
                  { label: "25m", mins: 25 },
                  { label: "45m", mins: 45 },
                  { label: "60m", mins: 60 }
                ].map((p) => {
                  const isSelected = timerDurationMinutes === p.mins;
                  return (
                    <button
                      key={p.mins}
                      onClick={() => applyTimerDuration(p.mins, false)}
                      style={{
                        padding: "6px 2px",
                        borderRadius: 8,
                        border: isSelected ? "1.5px solid #4b6623" : "1px solid #dce1da",
                        backgroundColor: isSelected ? "#f4f8ed" : "#ffffff",
                        color: isSelected ? "#4b6623" : "#17201d",
                        fontWeight: isSelected ? 800 : 600,
                        fontSize: 11.5,
                        cursor: "pointer",
                        textAlign: "center"
                      }}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>

              {/* Custom input */}
              <div style={{ display: "flex", gap: 5 }}>
                <input
                  type="number"
                  min="1"
                  max="180"
                  placeholder="Kustom (m)"
                  value={customMinutesInput}
                  onChange={(e) => setCustomMinutesInput(e.target.value)}
                  style={{
                    flex: 1,
                    padding: "5px 8px",
                    border: "1px solid #dce1da",
                    borderRadius: 8,
                    fontSize: 11.5,
                    outline: "none"
                  }}
                />
                <button
                  onClick={() => {
                    const mins = parseInt(customMinutesInput);
                    if (mins && mins > 0) applyTimerDuration(mins, false);
                  }}
                  style={{
                    backgroundColor: "#18211e",
                    color: "#c8f064",
                    border: "none",
                    borderRadius: 8,
                    padding: "5px 10px",
                    fontSize: 11.5,
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  Set
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Account Button */}
        {currentUser ? (
          <button
            onClick={onLogout}
            style={{
              backgroundColor: "#f3f5ef",
              border: "1px solid #dce4d6",
              color: "#18211e",
              borderRadius: 8,
              padding: "5px 8px",
              fontSize: 11.5,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4
            }}
            title="Klik untuk Keluar Akun"
          >
            <User size={12} color="#4b6623" />
            <span className="desktop-only">{currentUser.name || currentUser.username}</span>
            <LogOut size={11} color="#9ca3af" />
          </button>
        ) : (
          <button
            onClick={onOpenAuthModal}
            style={{
              backgroundColor: "#18211e",
              border: "none",
              color: "#c8f064",
              borderRadius: 8,
              padding: "5px 9px",
              fontSize: 11.5,
              fontWeight: 800,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4
            }}
          >
            <UserPlus size={12} />
            <span>Akun</span>
          </button>
        )}

        {/* Desktop Extras */}
        <button
          onClick={fetchOrExtractFormulas}
          className="desktop-only"
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #dce1da",
            color: "#17201d",
            borderRadius: 8,
            padding: "6px 12px",
            fontSize: 12.5,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 5
          }}
        >
          <Calculator size={13} color="#4b6623" />
          <span>Rumus</span>
        </button>

        <button
          onClick={() => setIsAiPanelOpen(!isAiPanelOpen)}
          className="desktop-only"
          style={{
            backgroundColor: isAiPanelOpen ? "#18221f" : "#ffffff",
            border: `1px solid ${isAiPanelOpen ? "#18221f" : "#dce1da"}`,
            color: isAiPanelOpen ? "#c8f064" : "#17201d",
            borderRadius: 8,
            padding: "6px 12px",
            fontSize: 12.5,
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6
          }}
        >
          <Brain size={14} color={isAiPanelOpen ? "#c8f064" : "#4b6623"} />
          <span>Tanya Nara</span>
        </button>

        <div className="desktop-only" style={{ display: "flex", alignItems: "center", gap: 6, backgroundColor: "#ffffff", border: "1px solid #dce1da", borderRadius: 8, padding: "5px 8px" }}>
          <Cpu size={12} color="#4b6623" />
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            style={{ backgroundColor: "transparent", color: "#17201d", border: "none", fontSize: 11, outline: "none", cursor: "pointer", maxWidth: 120 }}
          >
            {models.map((m) => {
              const id = typeof m === "string" ? m : (m?.id || "");
              return (
                <option key={id} value={id}>
                  {id.replace("ag/", "")}
                </option>
              );
            })}
          </select>
        </div>
      </div>
    </header>
  );
}
