import React, { useEffect, useRef } from "react";
import "./landing.css";
import { UserAccount } from "../../types";
import { LandingNavbar } from "./LandingNavbar";
import { HeroSection } from "./HeroSection";
import { HeroWorkspacePreview } from "./HeroWorkspacePreview";
import { MarqueeTicker } from "./MarqueeTicker";
import { StudioCockpit } from "./StudioCockpit";
import { ComparisonLedger } from "./ComparisonLedger";
import { PersonasSection } from "./PersonasSection";
import { StepperSection } from "./StepperSection";
import { CtaBanner } from "./CtaBanner";
import { LandingFooter } from "./LandingFooter";

export interface LandingPageProps {
  onLaunchApp: () => void;
  onOpenAuth: (mode?: "login" | "register") => void;
  currentUser?: UserAccount | null;
}

export function LandingPage({
  onLaunchApp,
  onOpenAuth,
  currentUser
}: LandingPageProps) {
  const handleActionLaunch = () => {
    if (currentUser) {
      onLaunchApp();
    } else {
      onOpenAuth("register");
    }
  };

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!("IntersectionObserver" in window)) {
      document.querySelectorAll(".reveal-scroll").forEach((el) => {
        el.classList.add("is-revealed");
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
          }
        });
      },
      {
        root: containerRef.current,
        threshold: 0.01,
        rootMargin: "120px 0px 40px 0px"
      }
    );

    const elements = document.querySelectorAll(".reveal-scroll");
    elements.forEach((el) => observer.observe(el));

    const handleAnchorClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a[href^="#"]');
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (href && href.startsWith("#") && href.length > 1) {
        const dest = document.querySelector(href);
        if (dest) {
          e.preventDefault();
          dest.scrollIntoView({ behavior: "smooth" });
          window.history.pushState(null, "", href);
        }
      }
    };

    const container = containerRef.current;
    container?.addEventListener("click", handleAnchorClick);

    if (window.location.hash) {
      setTimeout(() => {
        const target = document.querySelector(window.location.hash);
        if (target) {
          target.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    }

    return () => {
      container?.removeEventListener("click", handleAnchorClick);
      elements.forEach((el) => observer.unobserve(el));
      observer.disconnect();
    };
  }, []);

  return (
    <div className="tanka-landing-container" ref={containerRef}>
      <LandingNavbar
        onActionLaunch={handleActionLaunch}
        onOpenAuth={onOpenAuth}
        currentUser={currentUser}
      />
      <HeroSection onActionLaunch={handleActionLaunch} />
      <HeroWorkspacePreview onActionLaunch={handleActionLaunch} />
      <MarqueeTicker />
      <StudioCockpit onActionLaunch={handleActionLaunch} />
      <ComparisonLedger />
      <PersonasSection />
      <StepperSection onActionLaunch={handleActionLaunch} />
      <CtaBanner onActionLaunch={handleActionLaunch} />
      <LandingFooter onActionLaunch={handleActionLaunch} />
    </div>
  );
}

export default LandingPage;
