import React, { useState, useEffect } from "react";
import { X, UserPlus, LogIn, User, Lock, AlertCircle, Smile, Eye, EyeOff, Phone, KeyRound, ShieldCheck, ArrowLeft, RefreshCw } from "lucide-react";

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
  onSendWhatsAppOtp?: (phone: string) => Promise<{ success: boolean; message?: string; debugCode?: string; isNewUser?: boolean; error?: string }>;
  onLoginWithWhatsApp?: (phone: string, password: string, code: string, name?: string) => Promise<boolean>;
  onLoginWithGoogle?: (payload?: any) => Promise<boolean | void> | void;
  onTriggerGoogleOAuth?: () => void;
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
  onLoginWithGoogle,
  onTriggerGoogleOAuth
}: AuthModalProps) {
  const [authMethod, setAuthMethod] = useState<"whatsapp" | "username">("whatsapp");
  const [showPassword, setShowPassword] = useState(false);
  const [showWaPassword, setShowWaPassword] = useState(false);

  // Progressive WhatsApp Auth State
  const [waStep, setWaStep] = useState<"phone" | "otp">("phone");
  const [waPhone, setWaPhone] = useState("");
  const [waPassword, setWaPassword] = useState("");
  const [waCode, setWaCode] = useState("");
  const [waName, setWaName] = useState("");
  const [isNewUser, setIsNewUser] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpNotice, setOtpNotice] = useState("");
  const [resendCountdown, setResendCountdown] = useState(0);

  // 60-second OTP countdown timer
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setInterval(() => {
      setResendCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCountdown]);

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
          setWaStep("otp");
          setIsNewUser(Boolean(res.isNewUser));
          setResendCountdown(60);
          const debugHint = res.debugCode ? ` (Kode Uji: ${res.debugCode})` : "";
          setOtpNotice((res.message || "Kode OTP berhasil dikirim ke WhatsApp Anda") + debugHint);
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
      setError("Kode verifikasi OTP 6-digit wajib diisi");
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

  const handleGoogleClick = () => {
    setError("");
    if (onTriggerGoogleOAuth) {
      onTriggerGoogleOAuth();
    } else if (onLoginWithGoogle) {
      onLoginWithGoogle();
    } else {
      const width = 500;
      const height = 620;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      window.open(
        "/api/auth/google/login",
        "GoogleLogin",
        `width=${width},height=${height},left=${left},top=${top}`
      );
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

        {/* Dynamic Modal Header */}
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
                ? "Masuk dengan Akun"
                : "Daftar Akun Baru"}
            </h2>
            <p style={{ fontSize: 12, color: "#6b7280", margin: "2px 0 0", lineHeight: 1.4 }}>
              {authMethod === "whatsapp"
                ? "Verifikasi cepat via kode 6-digit WhatsApp"
                : mode === "login"
                ? "Akses materi dan riwayat belajar Anda"
                : "Mulai simpan progres dan materi belajar mandiri"}
            </p>
          </div>
        </div>

        {/* Method Selector: WhatsApp vs Username */}
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
          /* ================= Progressive 2-Step WhatsApp Flow ================= */
          waStep === "phone" ? (
            /* --- Step 1: Input WhatsApp Number --- */
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>
                  Nomor WhatsApp
                </label>
                <div className="auth-field-box">
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#4b6623", marginRight: 6, display: "flex", alignItems: "center", gap: 4 }}>
                    <span>🇮🇩</span> +62
                  </span>
                  <input
                    type="tel"
                    required
                    className="auth-input clean-input"
                    placeholder="8123456789 atau 0812..."
                    value={waPhone}
                    onChange={(e) => setWaPhone(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSendOtp();
                      }
                    }}
                    style={{
                      flex: 1,
                      padding: "10px 4px",
                      border: "none",
                      outline: "none",
                      fontSize: 13.5,
                      color: "#18211e",
                      backgroundColor: "transparent"
                    }}
                  />
                </div>
                <p style={{ fontSize: 11.5, color: "#6b7280", margin: "6px 0 0" }}>
                  Kami akan mengirim 6-digit kode verifikasi ke nomor WhatsApp ini.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSendOtp}
                disabled={isSendingOtp || !waPhone.trim()}
                style={{
                  width: "100%",
                  backgroundColor: "#18211e",
                  color: "#c8f064",
                  border: "none",
                  borderRadius: 10,
                  padding: "12px",
                  fontSize: 13.5,
                  fontWeight: 800,
                  cursor: (isSendingOtp || !waPhone.trim()) ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  opacity: (isSendingOtp || !waPhone.trim()) ? 0.6 : 1,
                  transition: "all 0.15s ease",
                  boxShadow: "0 2px 8px rgba(24, 33, 30, 0.12)"
                }}
              >
                <KeyRound size={16} />
                <span>{isSendingOtp ? "Mengirim Kode..." : "Kirim Kode OTP"}</span>
              </button>
            </div>
          ) : (
            /* --- Step 2: Verification Code, Password, & Safe Entry --- */
            <form onSubmit={handleWhatsAppSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Phone Summary & Change Number Link */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backgroundColor: "#f7f9f4",
                  border: "1px solid #dce4d6",
                  borderRadius: 10,
                  padding: "8px 12px"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Phone size={14} color="#4b6623" />
                  <span style={{ fontSize: 12.5, color: "#2d3748" }}>
                    Terkirim ke: <strong>{waPhone}</strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setWaStep("phone");
                    setError("");
                    setOtpNotice("");
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#4b6623",
                    fontSize: 11.5,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                    padding: 0
                  }}
                >
                  <ArrowLeft size={12} />
                  <span>Ubah Nomor</span>
                </button>
              </div>

              {/* OTP 6-Digit Field */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>
                    Kode Verifikasi OTP
                  </label>
                  <span style={{ fontSize: 11, color: "#6b7280" }}>6 digit angka</span>
                </div>
                <div className="auth-field-box">
                  <KeyRound size={16} color="#4b6623" style={{ flexShrink: 0 }} />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    className="auth-input clean-input"
                    placeholder="••••••"
                    value={waCode}
                    onChange={(e) => setWaCode(e.target.value.replace(/\D/g, ""))}
                    style={{
                      flex: 1,
                      padding: "9px 8px",
                      border: "none",
                      outline: "none",
                      fontSize: 15,
                      letterSpacing: "0.2em",
                      fontFamily: "ui-monospace, monospace",
                      fontWeight: 700,
                      color: "#18211e",
                      backgroundColor: "transparent"
                    }}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>
                    Sandi Akun
                  </label>
                  <span style={{ fontSize: 11, color: "#6b7280" }}>Minimal 8 karakter</span>
                </div>
                <div className="auth-field-box">
                  <Lock size={16} color="#4b6623" style={{ flexShrink: 0 }} />
                  <input
                    type={showWaPassword ? "text" : "password"}
                    required
                    className="auth-input clean-input"
                    placeholder="Sandi keamanan akun Anda"
                    value={waPassword}
                    onChange={(e) => setWaPassword(e.target.value)}
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
                    onClick={() => setShowWaPassword(p => !p)}
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
                    title={showWaPassword ? "Sembunyikan password" : "Lihat password"}
                  >
                    {showWaPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Display Name Field (shown for new users) */}
              {isNewUser && (
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 5 }}>
                    Nama Sapaan (Pendaftaran Baru)
                  </label>
                  <div className="auth-field-box">
                    <Smile size={16} color="#4b6623" style={{ flexShrink: 0 }} />
                    <input
                      type="text"
                      className="auth-input clean-input"
                      placeholder="Nama panggilan (contoh: Eka)"
                      value={waName}
                      onChange={(e) => setWaName(e.target.value)}
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

              {/* Resend Code Section with 60s countdown */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 2 }}>
                <span style={{ fontSize: 11.5, color: "#6b7280" }}>Belum terima kode?</span>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={isSendingOtp || resendCountdown > 0}
                  style={{
                    background: "none",
                    border: "none",
                    color: resendCountdown > 0 ? "#9ca3af" : "#4b6623",
                    fontSize: 11.5,
                    fontWeight: 700,
                    cursor: (isSendingOtp || resendCountdown > 0) ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "2px 0"
                  }}
                >
                  <RefreshCw size={12} className={isSendingOtp ? "spin-pulse" : ""} />
                  <span>
                    {isSendingOtp
                      ? "Mengirim..."
                      : resendCountdown > 0
                      ? `Kirim Ulang (${resendCountdown}s)`
                      : "Kirim Ulang Kode"}
                  </span>
                </button>
              </div>

              {/* Main Submit Button */}
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
                  transition: "all 0.15s ease",
                  boxShadow: "0 2px 8px rgba(24, 33, 30, 0.12)"
                }}
              >
                <ShieldCheck size={16} />
                <span>{isLoading ? "Memproses Verifikasi..." : "Verifikasi & Masuk"}</span>
              </button>
            </form>
          )
        ) : (
          /* ================= Classic Username Form ================= */
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
                <div className="auth-field-box">
                  <Smile size={16} color="#4b6623" style={{ flexShrink: 0 }} />
                  <input
                    type="text"
                    className="auth-input clean-input"
                    placeholder="Nama sapaan (contoh: Eka)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
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
              <div className="auth-field-box">
                <User size={16} color="#4b6623" style={{ flexShrink: 0 }} />
                <input
                  type="text"
                  required
                  className="auth-input clean-input"
                  autoComplete="username"
                  placeholder={mode === "login" ? "Masukkan username" : "Username akun Anda"}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
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
              <div className="auth-field-box">
                <Lock size={16} color="#4b6623" style={{ flexShrink: 0 }} />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="auth-input clean-input"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  placeholder={mode === "login" ? "Masukkan password" : "Minimal 8 karakter"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                transition: "all 0.15s ease",
                boxShadow: "0 2px 8px rgba(24, 33, 30, 0.12)"
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

        {/* Google OAuth 2.0 Flow Button */}
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
            className="google-oauth-btn"
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
