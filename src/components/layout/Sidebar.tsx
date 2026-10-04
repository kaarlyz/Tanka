import React from "react";
import {
  BookOpen,
  HelpCircle,
  Mic,
  Layers,
  FileText,
  AlertOctagon,
  Hash,
  Plus,
  UploadCloud,
  Trash2,
  Search
} from "lucide-react";
import { ActiveTab, DocumentItem } from "../../types";
import { getSubjectBadge } from "../common/MathView";

export interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  documents: DocumentItem[];
  activeDocId: string | null;
  setActiveDocId: (id: string) => void;
  onDeleteDocument: (id: string) => void;
  onTriggerFileUpload: () => void;
  onTriggerRawText: () => void;
  mistakeCount: number;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export function Sidebar({
  activeTab,
  setActiveTab,
  documents,
  activeDocId,
  setActiveDocId,
  onDeleteDocument,
  onTriggerFileUpload,
  onTriggerRawText,
  mistakeCount,
  searchQuery,
  setSearchQuery
}: SidebarProps) {
  const filteredDocs = documents.filter((d) =>
    (d.title || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const mainNavItems: Array<{ id: ActiveTab; label: string; icon: React.ReactNode; badge?: number }> = [
    { id: "material", label: "Catatan Belajar", icon: <BookOpen size={16} /> },
    { id: "quiz", label: "Latihan Soal (Kuis)", icon: <HelpCircle size={16} /> },
    { id: "feynman", label: "Uji Feynman (Audio)", icon: <Mic size={16} /> },
    { id: "flashcards", label: "Kartu Hafalan (Anki)", icon: <Layers size={16} /> },
    { id: "summary", label: "Rangkuman AI", icon: <FileText size={16} /> },
    { id: "mistakes", label: "Bank Kesalahan", icon: <AlertOctagon size={16} />, badge: mistakeCount },
    { id: "cheatsheet", label: "Rumus Kunci", icon: <Hash size={16} /> }
  ];

  return (
    <aside
      className="desktop-only"
      style={{
        width: 260,
        backgroundColor: "#fbfcf9",
        borderRight: "1px solid #dde1da",
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 56px)",
        position: "sticky",
        top: 56,
        overflow: "hidden"
      }}
    >
      {/* Action Buttons: Buat Materi & Unggah Berkas */}
      <div style={{ padding: "14px 14px 10px", display: "flex", flexDirection: "column", gap: 6 }}>
        <button
          type="button"
          onClick={onTriggerFileUpload}
          style={{
            width: "100%",
            height: 38,
            borderRadius: 8,
            backgroundColor: "#566b36",
            color: "#ffffff",
            border: "none",
            fontSize: 12.5,
            fontWeight: 800,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 7,
            boxShadow: "0 2px 8px rgba(86, 107, 54, 0.2)"
          }}
        >
          <UploadCloud size={16} />
          <span>Unggah Berkas / Foto</span>
        </button>

        <button
          type="button"
          onClick={onTriggerRawText}
          style={{
            width: "100%",
            height: 32,
            borderRadius: 8,
            backgroundColor: "#ffffff",
            color: "#374151",
            border: "1px solid #dce2da",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6
          }}
        >
          <Plus size={14} />
          <span>Tulis Catatan Manual</span>
        </button>
      </div>

      {/* Main Tab Navigations */}
      <div style={{ padding: "0 10px 10px", borderBottom: "1px solid #edf0eb" }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: "#8b948e", textTransform: "uppercase", letterSpacing: "0.08em", padding: "6px 8px" }}>
          Mode Belajar
        </div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {mainNavItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 10px",
                  borderRadius: 7,
                  border: "none",
                  backgroundColor: isActive ? "#edf4e3" : "transparent",
                  color: isActive ? "#3f6212" : "#374151",
                  fontSize: 12.5,
                  fontWeight: isActive ? 800 : 500,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background-color 0.15s ease"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <span style={{ color: isActive ? "#566b36" : "#6b7280" }}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      color: "#991b1b",
                      backgroundColor: "#fee2e2",
                      border: "1px solid #fecaca",
                      borderRadius: 999,
                      padding: "1px 6px"
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Search Input for Materials */}
      <div style={{ padding: "10px 14px 6px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            backgroundColor: "#f4f6f2",
            border: "1px solid #dce2da",
            borderRadius: 7,
            padding: "5px 8px"
          }}
        >
          <Search size={13} color="#9ca3af" />
          <input
            type="text"
            placeholder="Cari materi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: "transparent",
              border: "none",
              outline: "none",
              fontSize: 12,
              color: "#18211e",
              width: "100%"
            }}
          />
        </div>
      </div>

      {/* Material List */}
      <div style={{ flex: 1, overflowY: "auto", padding: "6px 10px 14px" }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: "#8b948e", textTransform: "uppercase", letterSpacing: "0.08em", padding: "4px 8px 6px" }}>
          Materi Tersimpan ({filteredDocs.length})
        </div>

        {filteredDocs.length === 0 ? (
          <div style={{ padding: "16px 8px", fontSize: 12, color: "#9ca3af", textAlign: "center" }}>
            Tidak ada materi
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {filteredDocs.map((doc) => {
              const isActive = activeDocId === doc.id;
              const badge = getSubjectBadge(doc.title);
              return (
                <div
                  key={doc.id}
                  onClick={() => setActiveDocId(doc.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 10px",
                    borderRadius: 7,
                    backgroundColor: isActive ? "#ffffff" : "transparent",
                    border: `1px solid ${isActive ? "#dce1da" : "transparent"}`,
                    cursor: "pointer",
                    boxShadow: isActive ? "0 2px 6px rgba(0,0,0,0.04)" : "none"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        backgroundColor: badge.color,
                        flexShrink: 0
                      }}
                    />
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: isActive ? 700 : 500,
                        color: isActive ? "#18211e" : "#4b5563",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis"
                      }}
                      title={doc.title}
                    >
                      {doc.title}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteDocument(doc.id);
                    }}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#9ca3af",
                      cursor: "pointer",
                      padding: 2,
                      display: "flex",
                      alignItems: "center"
                    }}
                    title="Hapus materi"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
