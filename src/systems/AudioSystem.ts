export interface AudioSettings {
  masterVolume: number;
  sfxVolume: number;
}

export class AudioSystem {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private settings: AudioSettings = { masterVolume: 0.5, sfxVolume: 0.6 };

  setSettings(settings: AudioSettings): void {
    this.settings = settings;
    if (this.master) this.master.gain.value = settings.masterVolume;
  }

  resume(): void {
    if (!this.context) {
      this.context = new AudioContext();
      this.master = this.context.createGain();
      this.master.gain.value = this.settings.masterVolume;
      this.master.connect(this.context.destination);
    }
    void this.context.resume();
  }

  playAbility(): void {
    this.playTone(180, 0.14, 'sawtooth');
  }

  playPurchase(): void {
    this.playTone(640, 0.08, 'square');
  }

  playWallHit(): void {
    this.playTone(90, 0.1, 'triangle');
  }

  private playTone(frequency: number, duration: number, type: OscillatorType): void {
    if (!this.context || !this.master || this.settings.masterVolume === 0 || this.settings.sfxVolume === 0) return;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(this.settings.sfxVolume * 0.08, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + duration);
    oscillator.connect(gain);
    gain.connect(this.master);
    oscillator.start();
    oscillator.stop(this.context.currentTime + duration);
  }
}
