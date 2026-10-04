import { useState, useEffect, useCallback } from "react";
import { ActiveTab } from "../types";

const VALID_TABS: ActiveTab[] = ["home", "material", "quiz", "mistakes", "feynman", "flashcards", "summary", "chat"];

export function useAppRoute(defaultTab: ActiveTab = "home") {
  const getTabFromLocation = useCallback((): ActiveTab => {
    // 1. Cek clean pathname (/quiz, /material)
    const path = window.location.pathname.replace(/^\//, "").split("/")[0].split("?")[0].trim().toLowerCase();
    if (VALID_TABS.includes(path as ActiveTab)) {
      return path as ActiveTab;
    }
    // 2. Fallback cek hash (#/quiz) jika ada link lama
    const hash = window.location.hash.replace(/^#\/?/, "").split("?")[0].trim().toLowerCase();
    if (VALID_TABS.includes(hash as ActiveTab)) {
      return hash as ActiveTab;
    }
    return defaultTab;
  }, [defaultTab]);

  const [activeTab, setActiveTabState] = useState<ActiveTab>(getTabFromLocation);

  const navigateTab = useCallback((tab: ActiveTab) => {
    const targetPath = tab === "home" ? "/" : `/${tab}`;
    if (window.location.pathname !== targetPath) {
      window.history.pushState({ tab }, "", targetPath);
    }
    setActiveTabState(tab);
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const current = getTabFromLocation();
      setActiveTabState(current);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [getTabFromLocation]);

  return { activeTab, setActiveTab: navigateTab };
}
