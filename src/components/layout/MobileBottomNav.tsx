import React from "react";
import { BookOpen, HelpCircle, Mic, Layers, FileText, MessageSquare } from "lucide-react";
import { ActiveTab } from "../../types";

interface MobileBottomNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isAiPanelOpen: boolean;
  setIsAiPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export function MobileBottomNav({
  activeTab,
  setActiveTab,
  isAiPanelOpen,
  setIsAiPanelOpen
}: MobileBottomNavProps) {
  const items: Array<{ id: ActiveTab | "chat"; label: string; icon: React.ReactNode }> = [
    { id: "material", label: "Materi", icon: <BookOpen size={18} /> },
    { id: "quiz", label: "Kuis", icon: <HelpCircle size={18} /> },
    { id: "feynman", label: "Feynman", icon: <Mic size={18} /> },
    { id: "flashcards", label: "Kartu", icon: <Layers size={18} /> },
    { id: "summary", label: "Ringkas", icon: <FileText size={18} /> },
    { id: "chat", label: "Tutor", icon: <MessageSquare size={18} /> }
  ];

  return (
    <nav
      className="mobile-only"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: 58,
        backgroundColor: "#ffffff",
        borderTop: "1px solid #dde1da",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        zIndex: 1000,
        boxShadow: "0 -4px 16px rgba(0,0,0,0.04)"
      }}
    >
      {items.map((it) => {
        const isActive = it.id === "chat" ? isAiPanelOpen : activeTab === it.id && !isAiPanelOpen;
        return (
          <button
            key={it.id}
            type="button"
            onClick={() => {
              if (it.id === "chat") {
                setIsAiPanelOpen((prev) => !prev);
              } else {
                setIsAiPanelOpen(false);
                setActiveTab(it.id);
              }
            }}
            style={{
              flex: 1,
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              background: "transparent",
              border: "none",
              color: isActive ? "#566b36" : "#6f7975",
              cursor: "pointer",
              padding: 0
            }}
          >
            <span>{it.icon}</span>
            <span style={{ fontSize: 10, fontWeight: isActive ? 800 : 500 }}>
              {it.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
