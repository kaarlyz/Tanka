export function playTimerAlarmSound(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const chords = [
      [523.25, 659.25], // C5 + E5
      [587.33, 698.46], // D5 + F5
      [659.25, 783.99], // E5 + G5
      [783.99, 1046.50] // G5 + C6
    ];

    chords.forEach((chord, i) => {
      const startTime = ctx.currentTime + i * 0.22;
      chord.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.exponentialRampToValueAtTime(0.2, startTime + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.55);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.6);
      });
    });

    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([250, 100, 250, 100, 400]);
    }
  } catch (err) {
    console.warn("Audio alarm playback error:", err);
  }
}

export function vibrateDevice(pattern: number[] = [200, 100, 200]): void {
  try {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  } catch {}
}
