import { useState, useEffect } from "react";
import { playTimerAlarmSound, vibrateDevice } from "../utils/sound";

export function useStudyTimer(showNotice: (msg: string) => void) {
  const [timerSeconds, setTimerSeconds] = useState(600);
  const [timerDuration, setTimerDuration] = useState(600);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerMode, setTimerMode] = useState<"work" | "break">("work");
  const [isAlarmActive, setIsAlarmActive] = useState(false);
  const [isTimerSettingsOpen, setIsTimerSettingsOpen] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (isTimerRunning && timerSeconds === 0) {
      setIsTimerRunning(false);
      setIsAlarmActive(true);
      playTimerAlarmSound();
      vibrateDevice([300, 150, 300, 150, 600]);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timerSeconds]);

  const handleToggleTimer = () => setIsTimerRunning((prev) => !prev);

  const handleResetTimer = () => {
    setIsTimerRunning(false);
    setTimerSeconds(timerDuration);
    setIsAlarmActive(false);
  };

  const handleSelectPreset = (seconds: number) => {
    setTimerDuration(seconds);
    setTimerSeconds(seconds);
    setIsTimerRunning(false);
    setIsTimerSettingsOpen(false);
  };

  const handleStartBreak = () => {
    setTimerMode("break");
    setTimerDuration(600);
    setTimerSeconds(600);
    setIsAlarmActive(false);
    setIsTimerRunning(true);
    showNotice("Sesi istirahat 10 menit dimulai. Rilekskan mata!");
  };

  const handleStartFocus = () => {
    setTimerMode("work");
    setTimerDuration(600);
    setTimerSeconds(600);
    setIsAlarmActive(false);
    setIsTimerRunning(true);
    showNotice("Sesi fokus baru dimulai! Semangat!");
  };

  return {
    timerSeconds,
    timerDuration,
    isTimerRunning,
    timerMode,
    isAlarmActive,
    isTimerSettingsOpen,
    setIsTimerSettingsOpen,
    setIsAlarmActive,
    handleToggleTimer,
    handleResetTimer,
    handleSelectPreset,
    handleStartBreak,
    handleStartFocus
  };
}
