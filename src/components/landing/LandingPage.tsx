import React, { useRef } from "react";
import { MotionConfig } from "motion/react";
import "./landing.css";
import "./landing-motion.css";
import { UserAccount } from "../../types";
import { useSmoothScroll } from "./motion/useSmoothScroll";
import { ScrollProgress, TimeShrink } from "./motion/MotionKit";
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

  // Smooth inertial scroll via Lenis + anchor clicks
  useSmoothScroll(containerRef, contentRef);

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
          <HeroWorkspacePreview onActionLaunch={handleActionLaunch} />
          <MarqueeTicker />
          <TimeShrink container={containerRef} />
          <StudioCockpit onActionLaunch={handleActionLaunch} />
          <ComparisonLedger />
          <PersonasSection />
          <StepperSection onActionLaunch={handleActionLaunch} />
          <CtaBanner onActionLaunch={handleActionLaunch} />
          <LandingFooter onActionLaunch={handleActionLaunch} />
        </div>
      </div>
    </MotionConfig>
  );
}

export default LandingPage;
