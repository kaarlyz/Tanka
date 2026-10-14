import React, { useState } from "react";
import { X, UserPlus, LogIn, User, Lock, AlertCircle, Smile, Eye, EyeOff } from "lucide-react";

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
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

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
      onClick={onClose}
    >
      <div
        className="modal-scale-in"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "#ffffff",
          borderRadius: 20,
          maxWidth: 400,
          width: "100%",
          padding: "26px 22px",
          boxShadow: "0 24px 60px rgba(0, 0, 0, 0.25)",
          border: "1.5px solid #dce4d6",
          position: "relative"
        }}
      >
        <button
          type="button"
          onClick={onClose}
          className="auth-modal-close"
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            width: 32,
            height: 32,
            borderRadius: 8,
            backgroundColor: "transparent",
            border: "none",
            color: "#6b7280",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.15s ease"
          }}
          aria-label="Tutup"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div
          className="clean-header"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 20,
            paddingRight: 32,
            border: "none",
            boxShadow: "none",
            outline: "none",
            background: "transparent"
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: "#f4f8ed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#4b6623",
              border: "1.5px solid #c8e6a0",
              flexShrink: 0
            }}
          >
            {mode === "login" ? <LogIn size={22} /> : <UserPlus size={22} />}
          </div>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#18211e", margin: 0, letterSpacing: "-0.02em" }}>
              {mode === "login" ? "Masuk ke Akun" : "Buat Akun Baru"}
            </h2>
            <p style={{ fontSize: 12, color: "#6b7280", margin: "2px 0 0", lineHeight: 1.4 }}>
              {mode === "login" ? "Akses materi dan riwayat belajar Anda" : "Mulai simpan progres dan materi belajar mandiri"}
            </p>
          </div>
        </div>

        {error && (
          <div
            style={{
              backgroundColor: "#fee2e2",
              border: "1px solid #fecaca",
              color: "#991b1b",
              borderRadius: 8,
              padding: "9px 12px",
              fontSize: 12,
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 14
            }}
          >
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (mode === "login") onLogin();
            else onRegister();
          }}
          style={{ display: "flex", flexDirection: "column", gap: 13 }}
        >
          {mode === "register" && (
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 5 }}>
                Nama Panggilan
              </label>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  border: focusedField === "name" ? "1.5px solid #4b6623" : "1.5px solid #d1d5db",
                  boxShadow: focusedField === "name" ? "0 0 0 3px rgba(75, 102, 35, 0.12)" : "none",
                  borderRadius: 10,
                  padding: "0 10px",
                  backgroundColor: "#ffffff",
                  transition: "border-color 0.15s ease, box-shadow 0.15s ease"
                }}
              >
                <Smile size={16} color={focusedField === "name" ? "#4b6623" : "#9ca3af"} style={{ flexShrink: 0 }} />
                <input
                  type="text"
                  className="clean-input"
                  placeholder="Nama sapaan (contoh: Eka)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onFocus={() => setFocusedField("name")}
                  onBlur={() => setFocusedField(null)}
                  style={{
                    flex: 1,
                    padding: "9px 8px",
                    border: "none",
                    outline: "none",
                    fontSize: 13,
                    color: "#18211e",
                    backgroundColor: "transparent"
                  }}
                />
              </div>
            </div>
          )}

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>
                Username
              </label>
              {mode === "register" && (
                <span style={{ fontSize: 11, color: "#6b7280" }}>ID masuk tanpa spasi</span>
              )}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                border: focusedField === "username" ? "1.5px solid #4b6623" : "1.5px solid #d1d5db",
                boxShadow: focusedField === "username" ? "0 0 0 3px rgba(75, 102, 35, 0.12)" : "none",
                borderRadius: 10,
                padding: "0 10px",
                backgroundColor: "#ffffff",
                transition: "border-color 0.15s ease, box-shadow 0.15s ease"
              }}
            >
              <User size={16} color={focusedField === "username" ? "#4b6623" : "#9ca3af"} style={{ flexShrink: 0 }} />
              <input
                type="text"
                required
                className="clean-input"
                autoComplete="username"
                placeholder={mode === "login" ? "Masukkan username" : "Username akun Anda"}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onFocus={() => setFocusedField("username")}
                onBlur={() => setFocusedField(null)}
                style={{
                  flex: 1,
                  padding: "9px 8px",
                  border: "none",
                  outline: "none",
                  fontSize: 13,
                  color: "#18211e",
                  backgroundColor: "transparent"
                }}
              />
            </div>
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>
                Password
              </label>
              {mode === "register" && (
                <span style={{ fontSize: 11, color: "#6b7280" }}>Minimal 8 karakter</span>
              )}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                border: focusedField === "password" ? "1.5px solid #4b6623" : "1.5px solid #d1d5db",
                boxShadow: focusedField === "password" ? "0 0 0 3px rgba(75, 102, 35, 0.12)" : "none",
                borderRadius: 10,
                padding: "0 10px",
                backgroundColor: "#ffffff",
                transition: "border-color 0.15s ease, box-shadow 0.15s ease"
              }}
            >
              <Lock size={16} color={focusedField === "password" ? "#4b6623" : "#9ca3af"} style={{ flexShrink: 0 }} />
              <input
                type={showPassword ? "text" : "password"}
                required
                className="clean-input"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                placeholder={mode === "login" ? "Masukkan password" : "Minimal 8 karakter"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField(null)}
                style={{
                  flex: 1,
                  padding: "9px 8px",
                  border: "none",
                  outline: "none",
                  fontSize: 13,
                  color: "#18211e",
                  backgroundColor: "transparent"
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                style={{
                  background: "none",
                  border: "none",
                  padding: "4px",
                  cursor: "pointer",
                  color: "#9ca3af",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
                title={showPassword ? "Sembunyikan password" : "Lihat password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              marginTop: 4,
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
              transition: "all 0.15s ease"
            }}
          >
            {isLoading ? (
              <span>Memproses...</span>
            ) : mode === "login" ? (
              <>
                <LogIn size={16} />
                <span>Masuk Sekarang</span>
              </>
            ) : (
              <>
                <UserPlus size={16} />
                <span>Buat Akun Sekarang</span>
              </>
            )}
          </button>

          {/* Footer switcher link */}
          <div style={{ textAlign: "center", marginTop: 4, fontSize: 12, color: "#6b7280" }}>
            {mode === "login" ? (
              <span>
                Belum punya akun?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("register");
                    setError("");
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#4b6623",
                    fontWeight: 800,
                    cursor: "pointer",
                    padding: 0,
                    textDecoration: "underline"
                  }}
                >
                  Daftar gratis
                </button>
              </span>
            ) : (
              <span>
                Sudah punya akun?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setError("");
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#4b6623",
                    fontWeight: 800,
                    cursor: "pointer",
                    padding: 0,
                    textDecoration: "underline"
                  }}
                >
                  Masuk di sini
                </button>
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
