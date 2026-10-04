import { useState, useEffect } from "react";

export function useStudyTimer(showNotice: (msg: string) => void) {
  const [timerDurationMinutes, setTimerDurationMinutes] = useState(10); // default 10 minutes
  const [timerSeconds, setTimerSeconds] = useState(600); // 10 minutes default
  const [timerMode, setTimerMode] = useState<"focus" | "break">("focus");
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [isTimerSettingsOpen, setIsTimerSettingsOpen] = useState(false);
  const [isAlarmActive, setIsAlarmActive] = useState(false);
  const [customMinutesInput, setCustomMinutesInput] = useState("10");

  function playAlarmSound() {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // Play 3 successive ascending bell melodies (Ding-Dong-Chime)
      const playChime = (startOffset: number) => {
        const notes = [
          { freq: 523.25, time: 0 },    // C5
          { freq: 659.25, time: 0.16 }, // E5
          { freq: 783.99, time: 0.32 }, // G5
          { freq: 1046.5, time: 0.48 }  // C6
        ];

        notes.forEach(({ freq, time }) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, ctx.currentTime + startOffset + time);

          gain.gain.setValueAtTime(0, ctx.currentTime + startOffset + time);
          gain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + startOffset + time + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startOffset + time + 0.55);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(ctx.currentTime + startOffset + time);
          osc.stop(ctx.currentTime + startOffset + time + 0.58);
        });
      };

      // Play round 1, round 2, round 3 with 0.85s gap
      playChime(0);
      playChime(0.85);
      playChime(1.7);

      // Mobile phone vibration
      if ("vibrate" in navigator) {
        navigator.vibrate([350, 150, 350, 150, 600]);
      }
    } catch (e) {
      console.warn("[tanka] Web Audio alarm error:", e);
    }
  }

  // Timer interval effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0 && isTimerRunning) {
      // Timer cycle completed -> Trigger Alarm
      setIsTimerRunning(false);
      setIsAlarmActive(true);
      playAlarmSound();

      if (timerMode === "focus") {
        setCompletedSessions((prev) => prev + 1);
        showNotice(`Sesi fokus ${timerDurationMinutes} menit selesai! Saatnya istirahat.`);
      } else {
        showNotice("Waktu istirahat selesai! Siap mulai sesi fokus baru?");
      }
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timerSeconds, timerMode, timerDurationMinutes, showNotice]);

  // Set timer duration in minutes
  function applyTimerDuration(mins: number, autoStart = false) {
    const validMins = Math.max(1, Math.min(180, mins));
    setTimerDurationMinutes(validMins);
    setTimerSeconds(validMins * 60);
    setCustomMinutesInput(validMins.toString());
    setIsTimerSettingsOpen(false);
    if (autoStart) {
      setIsTimerRunning(true);
    } else {
      setIsTimerRunning(false);
    }
    showNotice(`Waktu belajar diatur ke ${validMins} menit`);
  }

  return {
    timerDurationMinutes,
    setTimerDurationMinutes,
    timerSeconds,
    setTimerSeconds,
    timerMode,
    setTimerMode,
    isTimerRunning,
    setIsTimerRunning,
    completedSessions,
    setCompletedSessions,
    isTimerSettingsOpen,
    setIsTimerSettingsOpen,
    isAlarmActive,
    setIsAlarmActive,
    customMinutesInput,
    setCustomMinutesInput,
    playAlarmSound,
    applyTimerDuration
  };
}
