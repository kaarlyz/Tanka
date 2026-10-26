import { useState, useEffect, useCallback } from "react";
import { ActiveTab } from "../types";

const VALID_TABS: ActiveTab[] = ["landing", "home", "cbt", "material", "quiz", "mistakes", "feynman", "flashcards", "summary"];

export function useAppRoute(defaultTab: ActiveTab = "landing") {
  const getTabFromLocation = useCallback((): ActiveTab => {
    // 1. Cek clean pathname (/quiz, /material, /home, /landing, /cbt)
    const path = window.location.pathname.replace(/^\//, "").split("/")[0].split("?")[0].trim().toLowerCase();
    if (VALID_TABS.includes(path as ActiveTab)) {
      return path as ActiveTab;
    }
    // 2. Fallback cek hash (#/quiz, #/landing) jika ada link lama
    const hash = window.location.hash.replace(/^#\/?/, "").split("?")[0].trim().toLowerCase();
    if (VALID_TABS.includes(hash as ActiveTab)) {
      return hash as ActiveTab;
    }

    // 3. Fallback restore tab terakhir yang disimpan di localStorage
    try {
      const savedTab = localStorage.getItem("tanka_last_active_tab");
      if (savedTab && VALID_TABS.includes(savedTab as ActiveTab)) {
        return savedTab as ActiveTab;
      }
    } catch {}

    // 4. Jika ada sesi CBT aktif, fallback ke /cbt
    try {
      const activeCbt = localStorage.getItem("tanka_cbt_active_package");
      if (activeCbt) {
        return "cbt";
      }
    } catch {}

    return defaultTab;
  }, [defaultTab]);

  const [activeTab, setActiveTabState] = useState<ActiveTab>(getTabFromLocation);

  const navigateTab = useCallback((tab: ActiveTab) => {
    const targetPath = tab === "home" ? "/home" : tab === "landing" ? "/landing" : `/${tab}`;
    if (window.location.pathname !== targetPath) {
      window.history.pushState({ tab }, "", targetPath);
    }
    try {
      localStorage.setItem("tanka_last_active_tab", tab);
    } catch {}
    setActiveTabState(tab);
  }, []);

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if ((e.state as any)?.tanka_modal) return;
      const current = getTabFromLocation();
      setActiveTabState(current);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [getTabFromLocation]);

  return { activeTab, setActiveTab: navigateTab };
}
