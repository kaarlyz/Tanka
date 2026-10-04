import React from "react";
import { UploadCloud, Plus, Trash2, Search, X } from "lucide-react";
import { DocumentItem } from "../../types";
import { getSubjectBadge } from "../common/MathView";

export interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  documents: DocumentItem[];
  activeDocId: string | null;
  setActiveDocId: (id: string) => void;
  onDeleteDocument: (id: string) => void;
  onTriggerFileUpload: () => void;
  onTriggerRawText: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export function MobileDrawer({
  isOpen,
  onClose,
  documents,
  activeDocId,
  setActiveDocId,
  onDeleteDocument,
  onTriggerFileUpload,
  onTriggerRawText,
  searchQuery,
  setSearchQuery
}: MobileDrawerProps) {
  if (!isOpen) return null;

  const filteredDocs = documents.filter((d) =>
    (d.title || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(15, 23, 42, 0.45)",
          backdropFilter: "blur(4px)",
          zIndex: 99995
        }}
        onClick={onClose}
      />
      <div
        className="modal-scale-in"
        style={{
          position: "fixed",
          top: 0,
          bottom: 0,
          left: 0,
          width: "82%",
          maxWidth: 320,
          backgroundColor: "#ffffff",
          zIndex: 99996,
          boxShadow: "10px 0 30px rgba(0,0,0,0.15)",
          display: "flex",
          flexDirection: "column",
          padding: "16px 14px 20px"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
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
            <span style={{ fontSize: 16, fontWeight: 800, color: "#18211e" }}>
              tanka<span style={{ color: "#779f2f" }}>.</span>
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{ background: "transparent", border: "none", color: "#6b7280", cursor: "pointer", padding: 4 }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
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
              gap: 7
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
              height: 34,
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

        {/* Search */}
        <div style={{ marginBottom: 12 }}>
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

        {/* Document List */}
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 3 }}>
          <div style={{ fontSize: 10.5, fontWeight: 800, color: "#8b948e", textTransform: "uppercase", letterSpacing: "0.08em", padding: "4px 4px 6px" }}>
            Materi Tersimpan ({filteredDocs.length})
          </div>

          {filteredDocs.map((doc) => {
            const isActive = activeDocId === doc.id;
            const badge = getSubjectBadge(doc.title);
            return (
              <div
                key={doc.id}
                onClick={() => {
                  setActiveDocId(doc.id);
                  onClose();
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "9px 10px",
                  borderRadius: 7,
                  backgroundColor: isActive ? "#f0f4eb" : "transparent",
                  border: `1px solid ${isActive ? "#cdddc0" : "transparent"}`,
                  cursor: "pointer"
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
                      fontSize: 12.5,
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? "#18211e" : "#4b5563",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis"
                    }}
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
                    padding: 2
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
