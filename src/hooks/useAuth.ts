import { useState, useCallback, useEffect } from "react";
import { UserAccount } from "../types";

const STORAGE_KEY = "tanka_user_account";

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

  const handleRegister = useCallback(async () => {
    if (!authUsername.trim() || !authPassword.trim()) {
      setAuthError("Username dan password wajib diisi");
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

  const handleLogout = useCallback(() => {
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
    refreshProfile
  };
}
