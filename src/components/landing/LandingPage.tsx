import React, { useEffect, useRef } from "react";
import { MotionConfig } from "motion/react";
import "./landing.css";
import "./landing-motion.css";
import "./landing-story.css";
import { UserAccount } from "../../types";
import { useSmoothScroll } from "./motion/useSmoothScroll";
import { ScrollProgress } from "./motion/MotionKit";
import { HeroScene, LearningStory } from "./story/LearningScene";
import { FormulaBreakdown } from "./story/FormulaBreakdown";
import { KnowledgeGraph } from "./story/KnowledgeGraph";
import { BentoDrillPreview } from "./story/BentoDrillPreview";
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
  const contentRef = useRef<HTMLDivElement>(null);

  // Smooth inertial scroll via Lenis
  useSmoothScroll(containerRef, contentRef);

  // IntersectionObserver to reveal sections on scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (!("IntersectionObserver" in window)) {
      container.querySelectorAll(".reveal-scroll").forEach((el) => {
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
        root: container,
        threshold: 0.05,
        rootMargin: "80px 0px 80px 0px"
      }
    );

    const elements = container.querySelectorAll(".reveal-scroll");
    elements.forEach((el) => observer.observe(el));

    // Handle internal anchor clicks with offset
    const handleAnchorClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (href && href.startsWith("#") && href.length > 1) {
        const dest = container.querySelector<HTMLElement>(href);
        if (dest) {
          e.preventDefault();
          dest.scrollIntoView({ behavior: "smooth" });
          window.history.pushState(null, "", href);
        }
      }
    };
    container.addEventListener("click", handleAnchorClick);

    return () => {
      container.removeEventListener("click", handleAnchorClick);
      elements.forEach((el) => observer.unobserve(el));
      observer.disconnect();
    };
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <div className="tanka-landing-container" ref={containerRef}>
        <ScrollProgress container={containerRef} />
        <div className="lm-grain" aria-hidden="true" />
        <div ref={contentRef}>
          <div className="landing-ambient-orb-1" />
          <div className="landing-ambient-orb-2" />
          <LandingNavbar
            onActionLaunch={handleActionLaunch}
            onOpenAuth={onOpenAuth}
            currentUser={currentUser}
          />
          <HeroSection onActionLaunch={handleActionLaunch} />
          <HeroScene />
          <HeroWorkspacePreview onActionLaunch={handleActionLaunch} />
          <MarqueeTicker />
          <LearningStory container={containerRef} />
          <StudioCockpit onActionLaunch={handleActionLaunch} />
          <KnowledgeGraph />
          <BentoDrillPreview />
          <FormulaBreakdown />
          <ComparisonLedger />
          <PersonasSection />
          <StepperSection onActionLaunch={handleActionLaunch} container={containerRef} />
          <CtaBanner onActionLaunch={handleActionLaunch} />
          <LandingFooter onActionLaunch={handleActionLaunch} />
        </div>
      </div>
    </MotionConfig>
  );
}

export default LandingPage;
