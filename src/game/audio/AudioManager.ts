export class AudioManager {
  private context?: AudioContext;
  private enabled: boolean;
  private unlocked = false;

  constructor(enabled: boolean) {
    this.enabled = enabled;
    window.addEventListener("pointerdown", this.unlock, { once: true });
    window.addEventListener("keydown", this.unlock, { once: true });
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  dispose(): void {
    window.removeEventListener("pointerdown", this.unlock);
    window.removeEventListener("keydown", this.unlock);
    this.context?.close().catch(() => undefined);
  }

  private unlock = (event?: Event): void => {
    if (event && !event.isTrusted) return;
    if (!this.enabled || this.unlocked) return;
    try {
      this.context ??= new AudioContext();
      this.context.resume().catch(() => undefined);
      this.unlocked = true;
    } catch {
      this.enabled = false;
    }
  };

  play(type: "hit" | "cast" | "dash" | "death" | "victory" | "tower"): void {
    if (!this.enabled || !this.unlocked) return;
    try {
      this.context ??= new AudioContext();
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      const now = this.context.currentTime;
      const table = {
        hit: [210, 0.07, "triangle"],
        cast: [520, 0.12, "sine"],
        dash: [380, 0.1, "sawtooth"],
        death: [110, 0.22, "square"],
        victory: [680, 0.28, "sine"],
        tower: [300, 0.12, "triangle"]
      } as const;
      const [frequency, duration, wave] = table[type];
      oscillator.type = wave;
      oscillator.frequency.setValueAtTime(frequency, now);
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(40, frequency * 0.55), now + duration);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.055, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      oscillator.connect(gain).connect(this.context.destination);
      oscillator.start(now);
      oscillator.stop(now + duration);
    } catch {
      this.enabled = false;
    }
  }
}
