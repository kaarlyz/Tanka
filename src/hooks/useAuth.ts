import { useState, useCallback, useEffect } from "react";
import { UserAccount } from "../types";

const STORAGE_KEY = "tanka_user_account";
const SESSION_TOKEN_KEY = "tanka_session_token";

export function useAuth(showNotice: (msg: string) => void) {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("register");
  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  // Profile modal state
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileModalTab, setProfileModalTab] = useState<"profile" | "stats" | "leaderboard" | "room">("profile");

  // Fetch full live profile on startup if user is logged in
  const refreshProfile = useCallback(async (userId?: string) => {
    const targetId = userId || currentUser?.id;
    if (!targetId) return;

    try {
      const res = await fetch(`/api/users/profile?id=${encodeURIComponent(targetId)}`);
      const data = await res.json();
      if (res.ok && data.user) {
        setCurrentUser(data.user);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user));
      }
    } catch (err) {
      console.warn("[useAuth] Failed to refresh user profile:", err);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    if (currentUser?.id) {
      refreshProfile(currentUser.id);
    }
  }, [currentUser?.id, refreshProfile]);

  // Session validation on initialization / mount
  useEffect(() => {
    const token = localStorage.getItem(SESSION_TOKEN_KEY);
    if (!token) return;

    fetch("/api/auth/session", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user) {
          setCurrentUser(data.user);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user));
          if (data.token) localStorage.setItem(SESSION_TOKEN_KEY, data.token);
        } else {
          localStorage.removeItem(SESSION_TOKEN_KEY);
          localStorage.removeItem(STORAGE_KEY);
          setCurrentUser(null);
        }
      })
      .catch((err) => {
        console.warn("[useAuth] Failed to validate session token:", err);
      });
  }, []);

  // Google OAuth message listener
  useEffect(() => {
    const handleAuthMessage = (event: MessageEvent) => {
      if (event.data?.type === "TANKA_GOOGLE_AUTH_SUCCESS" && event.data.token && event.data.user) {
        setCurrentUser(event.data.user);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(event.data.user));
        localStorage.setItem(SESSION_TOKEN_KEY, event.data.token);
        setIsAuthModalOpen(false);
        showNotice(`Selamat datang, ${event.data.user.name || "Pengguna"}!`);
      } else if (event.data?.type === "TANKA_GOOGLE_AUTH_ERROR" && event.data.error) {
        setAuthError(event.data.error);
      }
    };
    window.addEventListener("message", handleAuthMessage);
    return () => window.removeEventListener("message", handleAuthMessage);
  }, [showNotice]);

  const handleRegister = useCallback(async () => {
    if (!authUsername.trim() || !authPassword.trim()) {
      setAuthError("Username dan password wajib diisi");
      return;
    }
    if (authPassword.trim().length < 8) {
      setAuthError("Password minimal 8 karakter demi keamanan akun");
      return;
    }
    setIsAuthLoading(true);
    setAuthError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: authUsername.trim(),
          password: authPassword.trim(),
          name: authName.trim() || authUsername.trim()
        })
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setCurrentUser(data.user);
        if (data.token) localStorage.setItem(SESSION_TOKEN_KEY, data.token);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user));
        setIsAuthModalOpen(false);
        setAuthUsername("");
        setAuthPassword("");
        setAuthName("");
        showNotice(`Selamat datang, ${data.user.name || data.user.username}! Akun berhasil dibuat.`);
      } else {
        setAuthError(data.error || "Gagal membuat akun");
      }
    } catch {
      setAuthError("Koneksi ke server gagal");
    } finally {
      setIsAuthLoading(false);
    }
  }, [authUsername, authPassword, authName, showNotice]);

  const handleLogin = useCallback(async () => {
    if (!authUsername.trim() || !authPassword.trim()) {
      setAuthError("Username dan password wajib diisi");
      return;
    }
    setIsAuthLoading(true);
    setAuthError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: authUsername.trim(),
          password: authPassword.trim()
        })
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setCurrentUser(data.user);
        if (data.token) localStorage.setItem(SESSION_TOKEN_KEY, data.token);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user));
        setIsAuthModalOpen(false);
        setAuthUsername("");
        setAuthPassword("");
        showNotice(`Halo ${data.user.name || data.user.username}, Anda berhasil masuk.`);
      } else {
        setAuthError(data.error || "Username atau password salah");
      }
    } catch {
      setAuthError("Koneksi ke server gagal");
    } finally {
      setIsAuthLoading(false);
    }
  }, [authUsername, authPassword, showNotice]);

  const handleLogout = useCallback(async () => {
    const token = localStorage.getItem(SESSION_TOKEN_KEY);
    if (token) {
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ token })
        });
      } catch (err) {
        console.warn("[useAuth] Failed to call logout endpoint:", err);
      }
    }
    localStorage.removeItem(SESSION_TOKEN_KEY);
    localStorage.removeItem(STORAGE_KEY);
    setCurrentUser(null);
    setIsProfileModalOpen(false);
    showNotice("Anda telah keluar akun.");
  }, [showNotice]);

  const quickRegisterGuest = useCallback(async (displayName: string): Promise<UserAccount | null> => {
    const cleanName = displayName.trim() || "Teman Belajar";
    const guestUser = "guest_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 6);
    const guestPass = "pass_" + Math.random().toString(36).slice(2, 8);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: guestUser,
          password: guestPass,
          name: cleanName
        })
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setCurrentUser(data.user);
        if (data.token) localStorage.setItem(SESSION_TOKEN_KEY, data.token);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user));
        showNotice(`Selamat bergabung, ${data.user.name}!`);
        return data.user;
      }
    } catch (e) {
      console.error("quickRegisterGuest failed:", e);
    }
    return null;
  }, [showNotice]);

  const updateProfile = useCallback(async (fields: Partial<UserAccount>) => {
    if (!currentUser?.id) return false;
    try {
      const res = await fetch("/api/users/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: currentUser.id, ...fields })
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setCurrentUser(data.user);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user));
        showNotice("Profil berhasil diperbarui.");
        return true;
      } else {
        showNotice(data.error || "Gagal memperbarui profil");
        return false;
      }
    } catch {
      showNotice("Koneksi ke server gagal");
      return false;
    }
  }, [currentUser?.id, showNotice]);

  const recordActivity = useCallback(async (activity: {
    activityType: string;
    minutes?: number;
    quizScore?: number;
    correctAnswers?: number;
    docId?: string;
  }) => {
    if (!currentUser?.id) return;
    try {
      const res = await fetch("/api/users/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          ...activity
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        refreshProfile(currentUser.id);
      }
    } catch (err) {
      console.warn("[useAuth] Failed to record activity:", err);
    }
  }, [currentUser?.id, refreshProfile]);

  const sendWhatsAppOtp = useCallback(async (phone: string) => {
    try {
      const res = await fetch("/api/auth/whatsapp/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return {
          success: true,
          message: data.message || "Kode OTP berhasil dikirim",
          phone: data.phone,
          isNewUser: Boolean(data.isNewUser),
          debugCode: data.debugCode
        };
      }
      return { success: false, error: data.error || "Gagal mengirim kode verifikasi WhatsApp" };
    } catch {
      return { success: false, error: "Koneksi ke server gagal" };
    }
  }, []);

  const loginWithWhatsApp = useCallback(async (phone: string, password: string, code: string, name?: string) => {
    setIsAuthLoading(true);
    setAuthError("");
    try {
      const res = await fetch("/api/auth/whatsapp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password, code, name })
      });
      const data = await res.json();
      if (res.ok && data.user) {
        if (data.token) localStorage.setItem(SESSION_TOKEN_KEY, data.token);
        setCurrentUser(data.user);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user));
        setIsAuthModalOpen(false);
        setAuthUsername("");
        setAuthPassword("");
        setAuthName("");
        showNotice(`Halo ${data.user.name || "Sobat Tanka"}, berhasil masuk dengan WhatsApp.`);
        return true;
      } else {
        setAuthError(data.error || "Verifikasi WhatsApp gagal");
        return false;
      }
    } catch {
      setAuthError("Koneksi ke server gagal");
      return false;
    } finally {
      setIsAuthLoading(false);
    }
  }, [showNotice]);

  const triggerGoogleOAuth = useCallback(() => {
    const width = 500;
    const height = 620;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    window.open(
      "/api/auth/google/login",
      "GoogleLogin",
      `width=${width},height=${height},left=${left},top=${top}`
    );
  }, []);

  const loginWithGoogle = useCallback(async (payload?: { email: string; name?: string; googleId?: string; avatarUrl?: string }) => {
    if (!payload) {
      triggerGoogleOAuth();
      return true;
    }
    setIsAuthLoading(true);
    setAuthError("");
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.user) {
        if (data.token) localStorage.setItem(SESSION_TOKEN_KEY, data.token);
        setCurrentUser(data.user);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user));
        setIsAuthModalOpen(false);
        showNotice(`Selamat datang, ${data.user.name || "Akun Google"}! Berhasil masuk.`);
        return true;
      } else {
        setAuthError(data.error || "Gagal masuk dengan Google");
        return false;
      }
    } catch {
      setAuthError("Koneksi ke server gagal");
      return false;
    } finally {
      setIsAuthLoading(false);
    }
  }, [showNotice, triggerGoogleOAuth]);

  return {
    currentUser,
    isAuthModalOpen,
    setIsAuthModalOpen,
    authMode,
    setAuthMode,
    authUsername,
    setAuthUsername,
    authPassword,
    setAuthPassword,
    authName,
    setAuthName,
    isAuthLoading,
    authError,
    setAuthError,
    handleRegister,
    handleLogin,
    handleLogout,
    isProfileModalOpen,
    setIsProfileModalOpen,
    profileModalTab,
    setProfileModalTab,
    updateProfile,
    quickRegisterGuest,
    recordActivity,
    refreshProfile,
    sendWhatsAppOtp,
    loginWithWhatsApp,
    loginWithGoogle,
    triggerGoogleOAuth
  };
}
