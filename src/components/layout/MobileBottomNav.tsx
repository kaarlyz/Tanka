import React from "react";
import { Home, BookOpen, Target, AlertTriangle, Brain } from "lucide-react";
import { ActiveTab, MistakeItem } from "../../types";

export interface MobileBottomNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isAiPanelOpen: boolean;
  setIsAiPanelOpen: (val: boolean) => void;
  setIsMobileDrawerOpen: (val: boolean) => void;
  mistakes: MistakeItem[];
}

export function MobileBottomNav({
  activeTab,
  setActiveTab,
  isAiPanelOpen,
  setIsAiPanelOpen,
  setIsMobileDrawerOpen,
  mistakes,
}: MobileBottomNavProps) {
  return (
      <nav className="mobile-only mobile-bottom-nav" aria-label="Navigasi Bawah Ponsel">
        <button
          className={`mobile-bottom-btn ${activeTab === "home" && !isAiPanelOpen ? "active" : ""}`}
          onClick={() => {
            setActiveTab("home");
            setIsAiPanelOpen(false);
            setIsMobileDrawerOpen(false);
          }}
        >
          <Home size={18} />
          <span>Beranda</span>
          {activeTab === "home" && !isAiPanelOpen && <span className="mobile-bottom-btn-indicator" />}
        </button>

        <button
          className={`mobile-bottom-btn ${activeTab === "material" && !isAiPanelOpen ? "active" : ""}`}
          onClick={() => {
            setActiveTab("material");
            setIsAiPanelOpen(false);
            setIsMobileDrawerOpen(false);
          }}
        >
          <BookOpen size={18} />
          <span>Materi</span>
          {activeTab === "material" && !isAiPanelOpen && <span className="mobile-bottom-btn-indicator" />}
        </button>

        <button
          className={`mobile-bottom-btn ${activeTab === "quiz" && !isAiPanelOpen ? "active" : ""}`}
          onClick={() => {
            setActiveTab("quiz");
            setIsAiPanelOpen(false);
            setIsMobileDrawerOpen(false);
          }}
        >
          <Target size={18} />
          <span>Latihan</span>
          {activeTab === "quiz" && !isAiPanelOpen && <span className="mobile-bottom-btn-indicator" />}
        </button>

        <button
          className={`mobile-bottom-btn ${activeTab === "mistakes" && !isAiPanelOpen ? "active" : ""}`}
          onClick={() => {
            setActiveTab("mistakes");
            setIsAiPanelOpen(false);
            setIsMobileDrawerOpen(false);
          }}
          style={{ position: "relative" }}
        >
          <AlertTriangle size={18} />
          <span>Bank Salah</span>
          {mistakes.length > 0 && (
            <span
              style={{
                position: "absolute",
                top: 4,
                right: "22%",
                backgroundColor: "#ef4444",
                color: "#ffffff",
                fontSize: 9,
                fontWeight: 800,
                width: 14,
                height: 14,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                lineHeight: 1
              }}
            >
              {mistakes.length > 9 ? "9+" : mistakes.length}
            </span>
          )}
          {activeTab === "mistakes" && !isAiPanelOpen && <span className="mobile-bottom-btn-indicator" />}
        </button>

      </nav>
  );
}
