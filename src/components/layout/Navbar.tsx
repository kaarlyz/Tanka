import React from "react";
import { Clock, Sliders, Menu, MessageSquare, Play, Pause, RotateCcw } from "lucide-react";
import { ActiveTab, DocumentItem } from "../../types";
import { TimerSettingsPopover } from "../common/TimerSettingsPopover";

export interface NavbarProps {
  timerSeconds: number;
  timerDuration: number;
  isTimerRunning: boolean;
  timerMode: "work" | "break";
  onToggleTimer: () => void;
  onResetTimer: () => void;
  onSelectPreset: (seconds: number) => void;
  isTimerSettingsOpen: boolean;
  setIsTimerSettingsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  activeTab: ActiveTab;
  activeDoc: DocumentItem | null | undefined;
  models: string[];
  selectedModel: string;
  setSelectedModel: (m: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  isChatOpen: boolean;
  setIsChatOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onOpenMobileDrawer: () => void;
}

export function Navbar({
  timerSeconds,
  timerDuration,
  isTimerRunning,
  timerMode,
  onToggleTimer,
  onResetTimer,
  onSelectPreset,
  isTimerSettingsOpen,
  setIsTimerSettingsOpen,
  activeDoc,
  models = [],
  selectedModel,
  setSelectedModel,
  isChatOpen,
  setIsChatOpen,
  onOpenMobileDrawer
}: NavbarProps) {
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const workMinutes = Math.round(timerDuration / 60) || 10;
  const onSetWorkMinutes = (minutes: number) => onSelectPreset(minutes * 60);

  return (
    <header
      style={{
        height: 56,
        backgroundColor: "#ffffff",
        borderBottom: "1px solid #dce1da",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 18px",
        position: "sticky",
        top: 0,
        zIndex: 50
      }}
    >
      {/* Left: Mobile Drawer Trigger + App Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          type="button"
          onClick={onOpenMobileDrawer}
          className="mobile-only"
          style={{
            background: "transparent",
            border: "none",
            color: "#18211e",
            cursor: "pointer",
            padding: 4,
            display: "none"
          }}
          aria-label="Buka menu"
        >
          <Menu size={20} />
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 28,
              height: 28,
              backgroundColor: "#18211e",
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#c8f064",
              fontWeight: 800,
              fontSize: 14,
              fontFamily: "'DM Mono', monospace"
            }}
          >
            T
          </div>
          <span style={{ fontSize: 16, fontWeight: 800, color: "#18211e", letterSpacing: "-0.03em" }}>
            tanka<span style={{ color: "#779f2f" }}>.</span>
          </span>
        </div>

        {activeDoc && (
          <div
            className="desktop-only"
            style={{
              marginLeft: 14,
              paddingLeft: 14,
              borderLeft: "1px solid #e2e8f0",
              fontSize: 13,
              fontWeight: 600,
              color: "#6b7280",
              maxWidth: 320,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis"
            }}
          >
            {activeDoc.title}
          </div>
        )}
      </div>

      {/* Center: Focus Timer Widget */}
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            backgroundColor: timerMode === "break" ? "#f0fdf4" : "#f8f9f5",
            border: `1px solid ${timerMode === "break" ? "#bbf7d0" : "#dce1da"}`,
            borderRadius: 999,
            padding: "4px 10px 4px 12px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <Clock size={14} color={timerMode === "break" ? "#16a34a" : "#566b36"} />
            <span
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 13.5,
                fontWeight: 800,
                color: timerMode === "break" ? "#15803d" : "#17201d",
                letterSpacing: "0.02em"
              }}
            >
              {formatTime(timerSeconds)}
            </span>
            <span
              style={{
                fontSize: 9.5,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: timerMode === "break" ? "#16a34a" : "#6f7975",
                marginLeft: 2
              }}
            >
              {timerMode === "break" ? "Rehat" : "Fokus"}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: 4 }}>
            <button
              type="button"
              onClick={onToggleTimer}
              style={{
                backgroundColor: isTimerRunning ? "#fee2e2" : "#c8f064",
                border: "none",
                borderRadius: "50%",
                width: 24,
                height: 24,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
              title={isTimerRunning ? "Jeda timer" : "Mulai timer"}
            >
              {isTimerRunning ? <Pause size={12} color="#991b1b" /> : <Play size={11} fill="#18211e" color="#18211e" />}
            </button>

            <button
              type="button"
              onClick={onResetTimer}
              style={{
                background: "transparent",
                border: "none",
                color: "#9ca3af",
                cursor: "pointer",
                padding: 3,
                display: "flex",
                alignItems: "center"
              }}
              title="Reset waktu"
            >
              <RotateCcw size={12} />
            </button>

            <button
              type="button"
              onClick={() => setIsTimerSettingsOpen((prev) => !prev)}
              style={{
                background: "transparent",
                border: "none",
                color: "#6b7280",
                cursor: "pointer",
                padding: 3,
                display: "flex",
                alignItems: "center"
              }}
              title="Pengaturan durasi timer"
            >
              <Sliders size={13} />
            </button>
          </div>
        </div>

        {/* Timer Settings Popover Dropdown */}
        <TimerSettingsPopover
          isOpen={isTimerSettingsOpen}
          onClose={() => setIsTimerSettingsOpen(false)}
          workMinutes={workMinutes}
          onSetWorkMinutes={onSetWorkMinutes}
          timerMode={timerMode}
        />
      </div>

      {/* Right: Model Selector & AI Tutor Trigger */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {models && models.length > 0 && (
          <select
            className="desktop-only"
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            style={{
              height: 32,
              backgroundColor: "#ffffff",
              border: "1px solid #dce2da",
              borderRadius: 6,
              fontSize: 11,
              color: "#4b5563",
              padding: "0 8px",
              outline: "none"
            }}
          >
            {models.map((m) => (
              <option key={m} value={m}>
                {m.replace("ag/", "")}
              </option>
            ))}
          </select>
        )}

        <button
          type="button"
          onClick={() => setIsChatOpen((prev) => !prev)}
          style={{
            height: 32,
            padding: "0 10px",
            borderRadius: 7,
            backgroundColor: isChatOpen ? "#18211e" : "#f4f6f2",
            color: isChatOpen ? "#c8f064" : "#17201d",
            border: `1px solid ${isChatOpen ? "#18211e" : "#dce1da"}`,
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6
          }}
        >
          <MessageSquare size={13} />
          <span className="desktop-only">Tutor AI</span>
        </button>
      </div>
    </header>
  );
}
