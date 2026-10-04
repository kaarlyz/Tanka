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
    showNotice("Anda telah keluar akun.");
  }, [showNotice]);

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
    handleLogout
  };
}
