import { AudioSystem } from '../systems/AudioSystem';
import { MetaProgression } from '../progression/MetaProgression';

export class MenuViews {
  private readonly progression: MetaProgression;
  private readonly audio: AudioSystem;
  private readonly main = document.querySelector<HTMLElement>('#main-menu')!;
  private readonly settings = document.querySelector<HTMLElement>('#settings-menu')!;
  private readonly statistics = document.querySelector<HTMLElement>('#statistics-menu')!;
  private readonly armory = document.querySelector<HTMLElement>('#armory-menu')!;
  private readonly master = document.querySelector<HTMLInputElement>('#setting-master')!;
  private readonly sfx = document.querySelector<HTMLInputElement>('#setting-sfx')!;
  private readonly shake = document.querySelector<HTMLInputElement>('#setting-shake')!;
  private readonly damageNumbers = document.querySelector<HTMLInputElement>('#setting-damage-numbers')!;

  constructor(progression: MetaProgression, audio: AudioSystem, onPlay: () => void, onUpgrades: () => void) {
    this.progression = progression;
    this.audio = audio;
    document.querySelector<HTMLButtonElement>('#menu-play')!.addEventListener('click', () => {
      this.audio.resume();
      onPlay();
      this.main.hidden = true;
    });
    document.querySelector<HTMLButtonElement>('#menu-upgrades')!.addEventListener('click', () => {
      this.main.hidden = true;
      onUpgrades();
    });
    document.querySelector<HTMLButtonElement>('#menu-settings')!.addEventListener('click', () => this.showSettings());
    document.querySelector<HTMLButtonElement>('#menu-statistics')!.addEventListener('click', () => this.showStatistics());
    document.querySelector<HTMLButtonElement>('#menu-armory')!.addEventListener('click', () => this.showArmory());
    document.querySelector<HTMLButtonElement>('#settings-close')!.addEventListener('click', () => this.closeToMain(this.settings));
    document.querySelector<HTMLButtonElement>('#statistics-close')!.addEventListener('click', () => this.closeToMain(this.statistics));
    document.querySelector<HTMLButtonElement>('#armory-close')!.addEventListener('click', () => this.closeToMain(this.armory));
    this.master.addEventListener('input', () => this.saveSettings());
    this.sfx.addEventListener('input', () => this.saveSettings());
    this.shake.addEventListener('change', () => this.saveSettings());
    this.damageNumbers.addEventListener('change', () => this.saveSettings());
  }

  private showSettings(): void {
    const settings = this.progression.settings;
    this.main.hidden = true;
    this.master.value = settings.masterVolume.toString();
    this.sfx.value = settings.sfxVolume.toString();
    this.shake.checked = settings.screenShake;
    this.damageNumbers.checked = settings.damageNumbers;
    this.settings.hidden = false;
  }

  private showStatistics(): void {
    const stats = this.progression.statistics;
    document.querySelector<HTMLElement>('#stats-runs')!.textContent = stats.totalRuns.toLocaleString();
    document.querySelector<HTMLElement>('#stats-kills')!.textContent = stats.totalKills.toLocaleString();
    document.querySelector<HTMLElement>('#stats-gold')!.textContent = stats.totalGold.toLocaleString();
    document.querySelector<HTMLElement>('#stats-best-kills')!.textContent = stats.highestKills.toLocaleString();
    this.main.hidden = true;
    this.statistics.hidden = false;
  }

  private showArmory(): void {
    this.main.hidden = true;
    this.armory.hidden = false;
  }

  private saveSettings(): void {
    const masterVolume = Number(this.master.value);
    const sfxVolume = Number(this.sfx.value);
    this.progression.updateSettings({ masterVolume, sfxVolume, screenShake: this.shake.checked, damageNumbers: this.damageNumbers.checked });
    this.audio.setSettings({ masterVolume, sfxVolume });
  }

  private closeToMain(panel: HTMLElement): void {
    panel.hidden = true;
    this.main.hidden = false;
  }
}
