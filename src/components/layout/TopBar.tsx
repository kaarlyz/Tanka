import React from "react";
import { Menu, Play, Pause, RotateCcw, RotateCw, Clock, Sliders, Calculator, Brain, Cpu, Volume2, Check, Bell } from "lucide-react";
import { ActiveTab, FormulaItem } from "../../types";

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
  models: string[];
  selectedModel: string;
  setSelectedModel: (model: string) => void;
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
}: TopBarProps) {
  const timerMins = Math.floor(timerSeconds / 60);
  const timerSecs = timerSeconds % 60;
  const timerDisplay = `${timerMins.toString().padStart(2, "0")}:${timerSecs.toString().padStart(2, "0")}`;
  return (
        <header className="topbar-bar">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={() => setIsMobileDrawerOpen(true)}
              className="mobile-only"
              style={{ background: "none", border: "none", color: "#17201d", cursor: "pointer", padding: 4 }}
            >
              <Menu size={22} />
            </button>
            <div style={{ minWidth: 0 }}>
              <span className="topbar-eyebrow">{activeTab === "home" ? "TANKA STUDY" : "MODUL AKTIF"}</span>
              <h1 className="topbar-title" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {activeTab === "home" ? "Beranda Belajar" : (activeDocTitle || "Modul Belajar")}
              </h1>
            </div>
          </div>

          {/* Center: Timer & Settings */}
          <div style={{ position: "relative" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                backgroundColor: timerMode === "focus" ? "#f0f6eb" : "#fbf4e8",
                border: `1px solid ${timerMode === "focus" ? "#d2e3c3" : "#ecd8b5"}`,
                borderRadius: 999,
                padding: "5px 12px",
                fontFamily: "'DM Mono', monospace",
                flexShrink: 0
              }}
            >
              <button
                onClick={() => setIsTimerSettingsOpen(!isTimerSettingsOpen)}
                style={{ background: "none", border: "none", padding: 0, display: "flex", alignItems: "center", cursor: "pointer" }}
                title="Klik untuk setel durasi waktu belajar"
              >
                <Clock size={13} color={timerMode === "focus" ? "#4b6623" : "#b45309"} />
              </button>

              <span
                onClick={() => setIsTimerSettingsOpen(!isTimerSettingsOpen)}
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: timerMode === "focus" ? "#4b6623" : "#b45309",
                  cursor: "pointer",
                  userSelect: "none"
                }}
                title="Klik untuk setel durasi waktu belajar"
              >
                {timerDisplay}
              </span>

              <button
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                style={{ background: "none", border: "none", color: timerMode === "focus" ? "#4b6623" : "#b45309", cursor: "pointer", padding: "2px 4px", display: "flex" }}
                title={isTimerRunning ? "Jeda" : "Mulai"}
              >
                {isTimerRunning ? <Pause size={12} /> : <Play size={12} />}
              </button>

              <button
                onClick={() => {
                  setIsTimerRunning(false);
                  setTimerSeconds(timerDurationMinutes * 60);
                }}
                className="desktop-only"
                style={{ background: "none", border: "none", color: "#88918d", cursor: "pointer", padding: "2px 4px", display: "flex" }}
                title="Reset timer ke durasi awal"
              >
                <RotateCw size={11} />
              </button>

              <button
                onClick={() => setIsTimerSettingsOpen(!isTimerSettingsOpen)}
                style={{
                  background: "none",
                  border: "none",
                  color: isTimerSettingsOpen ? "#166534" : "#88918d",
                  cursor: "pointer",
                  padding: "2px 3px",
                  display: "flex"
                }}
                title="Setel durasi waktu (5m, 10m, 25m, kustom)"
              >
                <Sliders size={11} />
              </button>
            </div>

            {/* Timer Settings Popover */}
            {isTimerSettingsOpen && (
              <div
                className="modal-scale-in"
                style={{
                  position: "absolute",
                  top: 38,
                  left: "50%",
                  transform: "translateX(-50%)",
                  backgroundColor: "#ffffff",
                  border: "1px solid #dce2da",
                  borderRadius: 14,
                  padding: "16px",
                  boxShadow: "0 14px 34px rgba(24, 34, 31, 0.14)",
                  zIndex: 9999,
                  width: 300
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Clock size={14} color="#566b36" />
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#18211e" }}>Setel Waktu Belajar</span>
                  </div>
                  <button
                    onClick={() => setIsTimerSettingsOpen(false)}
                    style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", padding: 2 }}
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* Preset Chips */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginBottom: 14 }}>
                  {[
                    { label: "5 Menit", mins: 5, desc: "Kilat" },
                    { label: "10 Menit", mins: 10, desc: "Fokus 10/10" },
                    { label: "15 Menit", mins: 15, desc: "Sedang" },
                    { label: "25 Menit", mins: 25, desc: "Pomodoro" },
                    { label: "45 Menit", mins: 45, desc: "Simulasi" },
                    { label: "60 Menit", mins: 60, desc: "1 Jam" }
                  ].map((p) => {
                    const isSelected = timerDurationMinutes === p.mins;
                    return (
                      <button
                        key={p.mins}
                        onClick={() => applyTimerDuration(p.mins, false)}
                        style={{
                          padding: "7px 4px",
                          borderRadius: 8,
                          border: `1.5px solid ${isSelected ? "#566b36" : "#e5e7eb"}`,
                          backgroundColor: isSelected ? "#f0fdf4" : "#f9fafb",
                          color: isSelected ? "#166534" : "#374151",
                          cursor: "pointer",
                          textAlign: "center"
                        }}
                      >
                        <div style={{ fontSize: 11.5, fontWeight: 800 }}>{p.label}</div>
                        <div style={{ fontSize: 9.5, color: isSelected ? "#15803d" : "#9ca3af", marginTop: 1 }}>{p.desc}</div>
                      </button>
                    );
                  })}
                </div>

                {/* Custom minute input */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#5a6862", marginBottom: 6 }}>Kustom Durasi (Menit):</div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <button
                      onClick={() => {
                        const val = Math.max(1, (parseInt(customMinutesInput) || 10) - 1);
                        setCustomMinutesInput(val.toString());
                      }}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 6,
                        border: "1px solid #d1d5db",
                        backgroundColor: "#f3f4f6",
                        cursor: "pointer",
                        fontWeight: 800,
                        fontSize: 14,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      max="180"
                      value={customMinutesInput}
                      onChange={(e) => setCustomMinutesInput(e.target.value)}
                      style={{
                        flex: 1,
                        height: 32,
                        borderRadius: 6,
                        border: "1px solid #d1d5db",
                        textAlign: "center",
                        fontSize: 13,
                        fontWeight: 700,
                        fontFamily: "'DM Mono', monospace"
                      }}
                    />
                    <button
                      onClick={() => {
                        const val = Math.min(180, (parseInt(customMinutesInput) || 10) + 1);
                        setCustomMinutesInput(val.toString());
                      }}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 6,
                        border: "1px solid #d1d5db",
                        backgroundColor: "#f3f4f6",
                        cursor: "pointer",
                        fontWeight: 800,
                        fontSize: 14,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      +
                    </button>
                    <button
                      onClick={() => {
                        const mins = parseInt(customMinutesInput) || 10;
                        applyTimerDuration(mins, false);
                      }}
                      style={{
                        height: 32,
                        padding: "0 12px",
                        borderRadius: 6,
                        border: "none",
                        backgroundColor: "#566b36",
                        color: "#ffffff",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer"
                      }}
                    >
                      Terapkan
                    </button>
                  </div>
                </div>

                {/* Test Alarm Sound */}
                <div style={{ borderTop: "1px solid #f1f4ee", paddingTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <button
                    onClick={playAlarmSound}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#4b6623",
                      fontSize: 11.5,
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 5
                    }}
                  >
                    <Bell size={13} />
                    <span>Uji Suara Alarm 🔔</span>
                  </button>
                  <span style={{ fontSize: 10.5, color: "#9ca3af" }}>Web Audio API</span>
                </div>
              </div>
            )}
          </div>

          {/* Right: Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="session-status-badge desktop-only">
              <i />
              Sesi tersimpan
            </div>

            <button
              onClick={fetchOrExtractFormulas}
              className="desktop-only"
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #dce1da",
                color: "#17201d",
                borderRadius: 8,
                padding: "7px 13px",
                fontSize: 12.5,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 5
              }}
            >
              <Calculator size={13} color="#4b6623" />
              <span>Lembar Rumus</span>
            </button>

            {/* Tanya Nara AI Drawer Toggle (Desktop only in topbar; mobile uses sticky bottom nav) */}
            <button
              onClick={() => setIsAiPanelOpen(!isAiPanelOpen)}
              className="desktop-only"
              style={{
                backgroundColor: isAiPanelOpen ? "#18221f" : "#ffffff",
                border: `1px solid ${isAiPanelOpen ? "#18221f" : "#dce1da"}`,
                color: isAiPanelOpen ? "#c8f064" : "#17201d",
                borderRadius: 8,
                padding: "7px 14px",
                fontSize: 12.5,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                transition: "all 0.15s ease"
              }}
              title={isAiPanelOpen ? "Tutup panel AI Tutor Nara" : "Buka panel AI Tutor Nara"}
            >
              <Brain size={14} color={isAiPanelOpen ? "#c8f064" : "#4b6623"} />
              <span>Tanya Nara</span>
              {isAiPanelOpen && <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#c8f064" }} />}
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
