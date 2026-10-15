import React, { useEffect, useRef } from "react";
import "./landing.css";
import { UserAccount } from "../../types";
import { LandingNavbar } from "./LandingNavbar";
import { HeroSection } from "./HeroSection";
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
        threshold: 0.08,
        rootMargin: "0px 0px -40px 0px"
      }
    );

    const elements = document.querySelectorAll(".reveal-scroll");
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
      observer.disconnect();
    };
  }, []);

  return (
    <div className="tanka-landing-container" ref={containerRef}>
      <div className="landing-ambient-orb-1" />
      <div className="landing-ambient-orb-2" />
      <LandingNavbar
        onActionLaunch={handleActionLaunch}
        onOpenAuth={onOpenAuth}
        currentUser={currentUser}
      />
      <HeroSection onActionLaunch={handleActionLaunch} />
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
