import React, { useState } from "react";
import { X, UserPlus, LogIn, User, Lock, AlertCircle, Smile, Eye, EyeOff, Phone, KeyRound, ShieldCheck } from "lucide-react";

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
  onSendWhatsAppOtp?: (phone: string) => Promise<{ success: boolean; message?: string; debugCode?: string; error?: string }>;
  onLoginWithWhatsApp?: (phone: string, password: string, code: string, name?: string) => Promise<boolean>;
  onLoginWithGoogle?: (payload: { email: string; name?: string; googleId?: string; avatarUrl?: string }) => Promise<boolean>;
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
  onRegister,
  onSendWhatsAppOtp,
  onLoginWithWhatsApp,
  onLoginWithGoogle
}: AuthModalProps) {
  const [authMethod, setAuthMethod] = useState<"whatsapp" | "username">("whatsapp");
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // WhatsApp Tab state
  const [waPhone, setWaPhone] = useState("");
  const [waPassword, setWaPassword] = useState("");
  const [waCode, setWaCode] = useState("");
  const [waName, setWaName] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpNotice, setOtpNotice] = useState("");

  if (!isOpen) return null;

  const handleSendOtp = async () => {
    if (!waPhone.trim()) {
      setError("Nomor WhatsApp wajib diisi terlebih dahulu");
      return;
    }
    setError("");
    setOtpNotice("");
    setIsSendingOtp(true);
    try {
      if (onSendWhatsAppOtp) {
        const res = await onSendWhatsAppOtp(waPhone.trim());
        if (res.success) {
          setIsOtpSent(true);
          const debugHint = res.debugCode ? ` (Kode: ${res.debugCode})` : "";
          setOtpNotice((res.message || "Kode OTP terkirim ke WhatsApp Anda") + debugHint);
        } else {
          setError(res.error || "Gagal mengirim kode OTP");
        }
      }
    } catch {
      setError("Koneksi ke server gagal saat mengirim OTP");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleWhatsAppSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waPhone.trim()) {
      setError("Nomor WhatsApp wajib diisi");
      return;
    }
    if (!waCode.trim()) {
      setError("Kode verifikasi OTP wajib diisi");
      return;
    }
    if (!waPassword.trim()) {
      setError("Sandi akun wajib diisi");
      return;
    }
    setError("");
    if (onLoginWithWhatsApp) {
      await onLoginWithWhatsApp(waPhone.trim(), waPassword.trim(), waCode.trim(), waName.trim() || undefined);
    }
  };

  const handleGoogleClick = async () => {
    if (!onLoginWithGoogle) return;
    setError("");
    try {
      const email = window.prompt("Masukkan Email Google Anda (contoh: user@gmail.com):");
      if (!email || !email.includes("@")) {
        if (email !== null) setError("Format email Google tidak valid");
        return;
      }
      const displayName = email.split("@")[0];
      const googleId = "gid_" + Math.random().toString(36).slice(2, 10);
      await onLoginWithGoogle({
        email: email.trim(),
        name: displayName,
        googleId
      });
    } catch {
      setError("Gagal memproses autentikasi Google");
    }
  };

  return (
    <div
      className="modal-backdrop"
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
          maxWidth: 420,
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
            marginBottom: 16,
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
              backgroundColor: authMethod === "whatsapp" ? "#eef8db" : "#f4f8ed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#3a5618",
              border: "1.5px solid #c8e6a0",
              flexShrink: 0
            }}
          >
            {authMethod === "whatsapp" ? (
              <Phone size={22} color="#3a5618" />
            ) : mode === "login" ? (
              <LogIn size={22} color="#4b6623" />
            ) : (
              <UserPlus size={22} color="#4b6623" />
            )}
          </div>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#18211e", margin: 0, letterSpacing: "-0.02em" }}>
              {authMethod === "whatsapp"
                ? "Masuk dengan WhatsApp"
                : mode === "login"
                ? "Masuk ke Akun"
                : "Buat Akun Baru"}
            </h2>
            <p style={{ fontSize: 12, color: "#6b7280", margin: "2px 0 0", lineHeight: 1.4 }}>
              {authMethod === "whatsapp"
                ? "Akses aman lewat nomor HP & kode OTP WhatsApp"
                : mode === "login"
                ? "Akses materi dan riwayat belajar Anda"
                : "Mulai simpan progres dan materi belajar mandiri"}
            </p>
          </div>
        </div>

        {/* Segmented Method Selector: WhatsApp vs Username */}
        <div
          style={{
            display: "flex",
            gap: 6,
            backgroundColor: "#f1f5ee",
            padding: 4,
            borderRadius: 10,
            marginBottom: 16
          }}
        >
          <button
            type="button"
            onClick={() => {
              setAuthMethod("whatsapp");
              setError("");
              setOtpNotice("");
            }}
            style={{
              flex: 1,
              padding: "8px 10px",
              borderRadius: 8,
              border: "none",
              fontSize: 12.5,
              fontWeight: 750,
              cursor: "pointer",
              backgroundColor: authMethod === "whatsapp" ? "#ffffff" : "transparent",
              color: authMethod === "whatsapp" ? "#1e2922" : "#5a6b61",
              boxShadow: authMethod === "whatsapp" ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              transition: "all 0.15s ease"
            }}
          >
            <Phone size={14} color={authMethod === "whatsapp" ? "#4b6623" : "#718579"} />
            <span>Nomor WhatsApp</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMethod("username");
              setError("");
              setOtpNotice("");
            }}
            style={{
              flex: 1,
              padding: "8px 10px",
              borderRadius: 8,
              border: "none",
              fontSize: 12.5,
              fontWeight: 750,
              cursor: "pointer",
              backgroundColor: authMethod === "username" ? "#ffffff" : "transparent",
              color: authMethod === "username" ? "#1e2922" : "#5a6b61",
              boxShadow: authMethod === "username" ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              transition: "all 0.15s ease"
            }}
          >
            <User size={14} color={authMethod === "username" ? "#4b6623" : "#718579"} />
            <span>Username Akun</span>
          </button>
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

        {otpNotice && (
          <div
            style={{
              backgroundColor: "#ecfdf5",
              border: "1px solid #a7f3d0",
              color: "#065f46",
              borderRadius: 8,
              padding: "9px 12px",
              fontSize: 12,
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 14
            }}
          >
            <ShieldCheck size={16} color="#059669" style={{ flexShrink: 0 }} />
            <span>{otpNotice}</span>
          </div>
        )}

        {authMethod === "whatsapp" ? (
          /* ================= WhatsApp Form ================= */
          <form onSubmit={handleWhatsAppSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 5 }}>
                Nomor WhatsApp
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    border: focusedField === "waPhone" ? "1.5px solid #4b6623" : "1.5px solid #d1d5db",
                    boxShadow: focusedField === "waPhone" ? "0 0 0 3px rgba(75, 102, 35, 0.12)" : "none",
                    borderRadius: 10,
                    padding: "0 10px",
                    backgroundColor: "#ffffff",
                    transition: "all 0.15s ease"
                  }}
                >
                  <Phone size={16} color={focusedField === "waPhone" ? "#4b6623" : "#9ca3af"} style={{ flexShrink: 0 }} />
                  <input
                    type="tel"
                    required
                    placeholder="Contoh: 08123456789"
                    value={waPhone}
                    onChange={(e) => setWaPhone(e.target.value)}
                    onFocus={() => setFocusedField("waPhone")}
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
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={isSendingOtp || !waPhone.trim()}
                  style={{
                    backgroundColor: isOtpSent ? "#eef8db" : "#f3f4f6",
                    border: isOtpSent ? "1px solid #c2e28f" : "1px solid #d1d5db",
                    color: isOtpSent ? "#273f15" : "#374151",
                    borderRadius: 10,
                    padding: "0 12px",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: (isSendingOtp || !waPhone.trim()) ? "not-allowed" : "pointer",
                    whiteSpace: "nowrap",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    transition: "all 0.15s ease"
                  }}
                >
                  <KeyRound size={13} />
                  <span>{isSendingOtp ? "Mengirim..." : isOtpSent ? "Kirim Ulang" : "Kirim OTP"}</span>
                </button>
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>
                  Kode Verifikasi OTP
                </label>
                <span style={{ fontSize: 11, color: "#6b7280" }}>6 digit angka</span>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  border: focusedField === "waCode" ? "1.5px solid #4b6623" : "1.5px solid #d1d5db",
                  boxShadow: focusedField === "waCode" ? "0 0 0 3px rgba(75, 102, 35, 0.12)" : "none",
                  borderRadius: 10,
                  padding: "0 10px",
                  backgroundColor: "#ffffff",
                  transition: "all 0.15s ease"
                }}
              >
                <KeyRound size={16} color={focusedField === "waCode" ? "#4b6623" : "#9ca3af"} style={{ flexShrink: 0 }} />
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="Masukkan 6 digit kode OTP"
                  value={waCode}
                  onChange={(e) => setWaCode(e.target.value.replace(/\D/g, ""))}
                  onFocus={() => setFocusedField("waCode")}
                  onBlur={() => setFocusedField(null)}
                  style={{
                    flex: 1,
                    padding: "9px 8px",
                    border: "none",
                    outline: "none",
                    fontSize: 14,
                    letterSpacing: "0.15em",
                    fontFamily: "monospace",
                    fontWeight: 700,
                    color: "#18211e",
                    backgroundColor: "transparent"
                  }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>
                  Sandi Akun
                </label>
                <span style={{ fontSize: 11, color: "#6b7280" }}>Minimal 8 karakter</span>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  border: focusedField === "waPassword" ? "1.5px solid #4b6623" : "1.5px solid #d1d5db",
                  boxShadow: focusedField === "waPassword" ? "0 0 0 3px rgba(75, 102, 35, 0.12)" : "none",
                  borderRadius: 10,
                  padding: "0 10px",
                  backgroundColor: "#ffffff",
                  transition: "all 0.15s ease"
                }}
              >
                <Lock size={16} color={focusedField === "waPassword" ? "#4b6623" : "#9ca3af"} style={{ flexShrink: 0 }} />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Sandi untuk keamanan akun Anda"
                  value={waPassword}
                  onChange={(e) => setWaPassword(e.target.value)}
                  onFocus={() => setFocusedField("waPassword")}
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

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 5 }}>
                Nama Sapaan (Opsional)
              </label>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  border: focusedField === "waName" ? "1.5px solid #4b6623" : "1.5px solid #d1d5db",
                  boxShadow: focusedField === "waName" ? "0 0 0 3px rgba(75, 102, 35, 0.12)" : "none",
                  borderRadius: 10,
                  padding: "0 10px",
                  backgroundColor: "#ffffff",
                  transition: "all 0.15s ease"
                }}
              >
                <Smile size={16} color={focusedField === "waName" ? "#4b6623" : "#9ca3af"} style={{ flexShrink: 0 }} />
                <input
                  type="text"
                  placeholder="Nama sapaan (contoh: Eka)"
                  value={waName}
                  onChange={(e) => setWaName(e.target.value)}
                  onFocus={() => setFocusedField("waName")}
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
                transition: "all 0.15s ease"
              }}
            >
              <ShieldCheck size={16} />
              <span>{isLoading ? "Memproses Verifikasi..." : "Verifikasi & Masuk"}</span>
            </button>
          </form>
        ) : (
          /* ================= Username Form ================= */
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

            {/* Switch login / register for username */}
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
        )}

        {/* Quick Google Login Divider & Button */}
        <div style={{ marginTop: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "14px 0 12px" }}>
            <div style={{ flex: 1, height: 1, backgroundColor: "#e5e7eb" }} />
            <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>atau</span>
            <div style={{ flex: 1, height: 1, backgroundColor: "#e5e7eb" }} />
          </div>

          <button
            type="button"
            onClick={handleGoogleClick}
            disabled={isLoading}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              backgroundColor: "#ffffff",
              border: "1.5px solid #d1d5db",
              borderRadius: 10,
              padding: "10px",
              fontSize: 13,
              fontWeight: 700,
              color: "#1f2937",
              cursor: isLoading ? "not-allowed" : "pointer",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              transition: "all 0.15s ease"
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Lanjutkan dengan Google</span>
          </button>
        </div>
      </div>
    </div>
  );
}
