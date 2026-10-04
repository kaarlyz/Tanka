import React from "react";
import { X, UserPlus, LogIn, User, Lock, AlertCircle } from "lucide-react";

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "login" | "register";
  setMode: (mode: "login" | "register") => void;
  username: string;
  setUsername: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  name: string;
  setName: (val: string) => void;
  isLoading: boolean;
  error: string;
  setError: (val: string) => void;
  onLogin: () => void;
  onRegister: () => void;
}

export function AuthModal({
  isOpen,
  onClose,
  mode,
  setMode,
  username,
  setUsername,
  password,
  setPassword,
  name,
  setName,
  isLoading,
  error,
  setError,
  onLogin,
  onRegister
}: AuthModalProps) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(24, 33, 30, 0.65)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10001,
        padding: 16
      }}
    >
      <div
        className="modal-scale-in"
        style={{
          backgroundColor: "#ffffff",
          borderRadius: 20,
          maxWidth: 400,
          width: "100%",
          padding: "24px 20px",
          boxShadow: "0 24px 60px rgba(0, 0, 0, 0.25)",
          border: "1.5px solid #dce4d6",
          position: "relative"
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            background: "transparent",
            border: "none",
            color: "#6b7280",
            cursor: "pointer",
            padding: 4
          }}
        >
          <X size={20} />
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: "#f4f8ed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#4b6623",
              border: "1px solid #c8e6a0"
            }}
          >
            {mode === "login" ? <LogIn size={20} /> : <UserPlus size={20} />}
          </div>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#18211e", margin: 0 }}>
              {mode === "login" ? "Masuk ke Akun" : "Buat Akun Baru"}
            </h2>
            <p style={{ fontSize: 12, color: "#6b7280", margin: "2px 0 0" }}>
              {mode === "login" ? "Akses materi dan riwayat belajar Anda" : "Mulai belajar cerdas dengan akun pribadi"}
            </p>
          </div>
        </div>

        {/* Tab Mode Switcher */}
        <div
          style={{
            display: "flex",
            backgroundColor: "#f3f5ef",
            borderRadius: 10,
            padding: 3,
            marginBottom: 16
          }}
        >
          <button
            onClick={() => {
              setMode("register");
              setError("");
            }}
            style={{
              flex: 1,
              padding: "7px",
              borderRadius: 8,
              border: "none",
              fontSize: 12.5,
              fontWeight: 700,
              cursor: "pointer",
              backgroundColor: mode === "register" ? "#ffffff" : "transparent",
              color: mode === "register" ? "#18211e" : "#6b7280",
              boxShadow: mode === "register" ? "0 2px 6px rgba(0,0,0,0.06)" : "none"
            }}
          >
            Daftar Baru
          </button>
          <button
            onClick={() => {
              setMode("login");
              setError("");
            }}
            style={{
              flex: 1,
              padding: "7px",
              borderRadius: 8,
              border: "none",
              fontSize: 12.5,
              fontWeight: 700,
              cursor: "pointer",
              backgroundColor: mode === "login" ? "#ffffff" : "transparent",
              color: mode === "login" ? "#18211e" : "#6b7280",
              boxShadow: mode === "login" ? "0 2px 6px rgba(0,0,0,0.06)" : "none"
            }}
          >
            Sudah Punya Akun
          </button>
        </div>

        {error && (
          <div
            style={{
              backgroundColor: "#fee2e2",
              border: "1px solid #fecaca",
              color: "#991b1b",
              borderRadius: 8,
              padding: "8px 12px",
              fontSize: 12,
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 14
            }}
          >
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (mode === "login") onLogin();
            else onRegister();
          }}
          style={{ display: "flex", flexDirection: "column", gap: 12 }}
        >
          {mode === "register" && (
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>
                Nama Panggilan (Opsional)
              </label>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  border: "1.5px solid #d1d5db",
                  borderRadius: 10,
                  padding: "0 10px",
                  backgroundColor: "#ffffff"
                }}
              >
                <User size={16} color="#9ca3af" />
                <input
                  type="text"
                  placeholder="Contoh: Eka"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 8px",
                    border: "none",
                    outline: "none",
                    fontSize: 13,
                    color: "#18211e"
                  }}
                />
              </div>
            </div>
          )}

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>
              Username
            </label>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                border: "1.5px solid #d1d5db",
                borderRadius: 10,
                padding: "0 10px",
                backgroundColor: "#ffffff"
              }}
            >
              <User size={16} color="#9ca3af" />
              <input
                type="text"
                required
                placeholder="Username (huruf/angka)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 8px",
                  border: "none",
                  outline: "none",
                  fontSize: 13,
                  color: "#18211e"
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>
              Password
            </label>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                border: "1.5px solid #d1d5db",
                borderRadius: 10,
                padding: "0 10px",
                backgroundColor: "#ffffff"
              }}
            >
              <Lock size={16} color="#9ca3af" />
              <input
                type="password"
                required
                placeholder="Minimal 4 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 8px",
                  border: "none",
                  outline: "none",
                  fontSize: 13,
                  color: "#18211e"
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              marginTop: 6,
              backgroundColor: "#18211e",
              color: "#c8f064",
              border: "none",
              borderRadius: 10,
              padding: "11px",
              fontSize: 13.5,
              fontWeight: 800,
              cursor: isLoading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              opacity: isLoading ? 0.7 : 1,
              transition: "transform 0.1s active"
            }}
          >
            {isLoading ? (
              <span>Memproses...</span>
            ) : mode === "login" ? (
              <>
                <LogIn size={16} />
                <span>Masuk</span>
              </>
            ) : (
              <>
                <UserPlus size={16} />
                <span>Buat Akun Sekarang</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
