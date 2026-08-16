import { AudioSystem } from '../systems/AudioSystem';
import { MetaProgression } from '../progression/MetaProgression';
import { CAMPAIGN_MAPS } from '../map/CampaignMaps';
import type { MapDefinition } from '../map/TerrainTypes';
import { CustomMapStorage } from '../map/CustomMapStorage';

export class MenuViews {
  private readonly progression: MetaProgression;
  private readonly audio: AudioSystem;
  private readonly main = document.querySelector<HTMLElement>('#main-menu')!;
  private readonly settings = document.querySelector<HTMLElement>('#settings-menu')!;
  private readonly statistics = document.querySelector<HTMLElement>('#statistics-menu')!;
  private readonly armory = document.querySelector<HTMLElement>('#armory-menu')!;
  private readonly master = document.querySelector<HTMLInputElement>('#setting-master')!;
  private readonly sfx = document.querySelector<HTMLInputElement>('#setting-sfx')!;
  private readonly sfxCheat = document.querySelector<HTMLButtonElement>('#sfx-cheat')!;
  private readonly shake = document.querySelector<HTMLInputElement>('#setting-shake')!;
  private readonly damageNumbers = document.querySelector<HTMLInputElement>('#setting-damage-numbers')!;
  private readonly campaign = document.querySelector<HTMLElement>('#campaign-menu')!;
  private readonly customMaps = document.querySelector<HTMLElement>('#custom-maps-menu')!;
  private readonly storage = new CustomMapStorage();

  constructor(progression: MetaProgression, audio: AudioSystem, onPlay: () => void, onUpgrades: () => void, onMapBuilder: () => void, onPlayMap: (map: MapDefinition) => void, onEditMap: (map: MapDefinition) => void, onReset: () => void) {
    this.progression = progression;
    this.audio = audio;
    document.querySelector<HTMLButtonElement>('#menu-play')!.addEventListener('click', () => {
      this.audio.resume();
      onPlay();
      this.main.hidden = true;
    });
    document.querySelector<HTMLButtonElement>('#menu-map-builder')!.addEventListener('click', () => { this.main.hidden = true; onMapBuilder(); });
    document.querySelector<HTMLButtonElement>('#menu-custom-maps')!.addEventListener('click', () => this.showCustomMaps(onPlayMap, onEditMap));
    document.querySelector<HTMLButtonElement>('#menu-upgrades')!.addEventListener('click', () => {
      this.main.hidden = true;
      onUpgrades();
    });
    document.querySelector<HTMLButtonElement>('#menu-settings')!.addEventListener('click', () => this.showSettings());
    document.querySelector<HTMLButtonElement>('#menu-statistics')?.addEventListener('click', () => this.showStatistics());
    document.querySelector<HTMLButtonElement>('#menu-armory')?.addEventListener('click', () => this.showArmory());
    document.querySelector<HTMLButtonElement>('#settings-close')!.addEventListener('click', () => this.closeToMain(this.settings));
    document.querySelector<HTMLButtonElement>('#statistics-close')!.addEventListener('click', () => this.closeToMain(this.statistics));
    document.querySelector<HTMLButtonElement>('#armory-close')!.addEventListener('click', () => this.closeToMain(this.armory));
    document.querySelector<HTMLButtonElement>('#campaign-close')!.addEventListener('click', () => this.closeToMain(this.campaign));
    document.querySelector<HTMLButtonElement>('#custom-maps-close')!.addEventListener('click', () => this.closeToMain(this.customMaps));
    this.master.addEventListener('input', () => this.saveSettings());
    this.sfx.addEventListener('input', () => this.saveSettings());
    this.sfxCheat.addEventListener('click', () => this.activateSfxCheat());
    this.shake.addEventListener('change', () => this.saveSettings());
    this.damageNumbers.addEventListener('change', () => this.saveSettings());
    document.querySelector<HTMLButtonElement>('#settings-reset')!.addEventListener('click', () => {
      if (window.confirm('Reset all progress and start over? This cannot be undone.')) onReset();
    });
  }

  showCampaign(onSelect: (map: MapDefinition) => void): void {
    this.main.hidden = true;
    const levels = document.querySelector<HTMLElement>('#campaign-levels')!;
    levels.innerHTML = CAMPAIGN_MAPS.map((map, index) => `<button type="button" data-campaign="${map.id}" ${this.progression.isCampaignUnlocked(index) ? '' : 'disabled'}>${index + 1}. ${map.name}</button>`).join('');
    CAMPAIGN_MAPS.forEach((map) => levels.querySelector<HTMLButtonElement>(`[data-campaign="${map.id}"]`)!.addEventListener('click', () => onSelect(map)));
    this.campaign.hidden = false;
  }

  private showCustomMaps(onPlayMap: (map: MapDefinition) => void, onEditMap: (map: MapDefinition) => void): void {
    this.main.hidden = true;
    const list = document.querySelector<HTMLElement>('#custom-map-list')!;
    const maps = this.storage.list();
    list.innerHTML = maps.length === 0 ? '<span>No custom maps saved.</span>' : maps.map((map) => `<div><span>${map.name} ${map.width} x ${map.height} ${map.enemySettings.difficulty} ${map.modifiedDate ? new Date(map.modifiedDate).toLocaleDateString() : ''}</span><button type="button" data-play="${map.id}">Play</button><button type="button" data-edit="${map.id}">Edit</button><button type="button" data-delete="${map.id}">Delete</button><button type="button" data-export="${map.id}">Export</button></div>`).join('');
    for (const map of maps) {
      list.querySelector<HTMLButtonElement>(`[data-play="${map.id}"]`)!.addEventListener('click', () => onPlayMap(map));
      list.querySelector<HTMLButtonElement>(`[data-edit="${map.id}"]`)!.addEventListener('click', () => onEditMap(map));
      list.querySelector<HTMLButtonElement>(`[data-delete="${map.id}"]`)!.addEventListener('click', () => { this.storage.delete(map.id); this.showCustomMaps(onPlayMap, onEditMap); });
      list.querySelector<HTMLButtonElement>(`[data-export="${map.id}"]`)!.addEventListener('click', () => this.storage.export(map));
    }
    document.querySelector<HTMLButtonElement>('#custom-map-import')!.onclick = () => document.querySelector<HTMLInputElement>('#custom-map-file')!.click();
    document.querySelector<HTMLInputElement>('#custom-map-file')!.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const imported = await this.storage.import(file);
      if (imported) { this.storage.save(imported); this.showCustomMaps(onPlayMap, onEditMap); }
    };
    this.customMaps.hidden = false;
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
    document.querySelector<HTMLElement>('#stats-gold')!.textContent = stats.totalBuildPoints.toLocaleString();
    document.querySelector<HTMLElement>('#stats-best-kills')!.textContent = stats.highestKills.toLocaleString();
    this.main.hidden = true;
    this.statistics.hidden = false;
  }

  private showArmory(): void {
    document.querySelector<HTMLElement>('#armory-cannon')!.textContent = this.progression.isUnlocked('cannon') ? 'Available' : 'Locked, 15 Tokens';
    document.querySelector<HTMLElement>('#armory-fire')!.textContent = this.progression.isUnlocked('fireTower') ? 'Available' : 'Locked, 30 Tokens';
    document.querySelector<HTMLElement>('#armory-lightning')!.textContent = this.progression.isUnlocked('lightningTower') ? 'Available' : 'Locked, 55 Tokens';
    document.querySelector<HTMLElement>('#armory-mortar')!.textContent = this.progression.isUnlocked('mortar') ? 'Available' : 'Locked, 45 Tokens';
    this.main.hidden = true;
    this.armory.hidden = false;
  }

  private saveSettings(): void {
    const masterVolume = Number(this.master.value);
    const sfxVolume = Number(this.sfx.value);
    this.progression.updateSettings({ masterVolume, sfxVolume, screenShake: this.shake.checked, damageNumbers: this.damageNumbers.checked });
    this.audio.setSettings({ masterVolume, sfxVolume });
  }

  private activateSfxCheat(): void {
    this.progression.grantWarTokens(1000);
    window.alert('Cheat activated: +1,000 War Tokens');
  }

  private closeToMain(panel: HTMLElement): void {
    panel.hidden = true;
    this.main.hidden = false;
  }
}
