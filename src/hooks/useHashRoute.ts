import { useState, useEffect, useCallback } from "react";
import { ActiveTab } from "../types";

const VALID_TABS: ActiveTab[] = ["home", "material", "quiz", "mistakes", "feynman", "flashcards", "summary", "chat"];

export function useHashRoute(defaultTab: ActiveTab = "home") {
  const getTabFromHash = useCallback((): ActiveTab => {
    const raw = window.location.hash.replace(/^#\/?/, "").split("?")[0].trim().toLowerCase();
    if (VALID_TABS.includes(raw as ActiveTab)) {
      return raw as ActiveTab;
    }
    return defaultTab;
  }, [defaultTab]);

  const [activeTab, setActiveTabState] = useState<ActiveTab>(getTabFromHash);

  const navigateTab = useCallback((tab: ActiveTab) => {
    if (window.location.hash !== `#/${tab}`) {
      window.location.hash = `#/${tab}`;
    }
    setActiveTabState(tab);
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      const current = getTabFromHash();
      setActiveTabState(current);
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [getTabFromHash]);

  return { activeTab, setActiveTab: navigateTab };
}
