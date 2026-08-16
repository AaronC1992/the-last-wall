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
  private readonly graphicsMenu = document.querySelector<HTMLElement>('#graphics-menu')!;
  private readonly controlsMenu = document.querySelector<HTMLElement>('#controls-menu')!;
  private readonly tutorialMenu = document.querySelector<HTMLElement>('#tutorial-menu')!;
  private readonly statistics = document.querySelector<HTMLElement>('#statistics-menu')!;
  private readonly armory = document.querySelector<HTMLElement>('#armory-menu')!;
  private readonly master = document.querySelector<HTMLInputElement>('#setting-master')!;
  private readonly sfx = document.querySelector<HTMLInputElement>('#setting-sfx')!;
  private readonly sfxCheat = document.querySelector<HTMLButtonElement>('#sfx-cheat')!;
  private readonly shake = document.querySelector<HTMLInputElement>('#setting-shake')!;
  private readonly damageNumbers = document.querySelector<HTMLInputElement>('#setting-damage-numbers')!;
  private readonly graphics = document.querySelector<HTMLSelectElement>('#setting-graphics')!;
  private readonly graphicsShake = document.querySelector<HTMLInputElement>('#setting-shake-graphics')!;
  private readonly graphicsDamageNumbers = document.querySelector<HTMLInputElement>('#setting-damage-numbers-graphics')!;
  private readonly decals = document.querySelector<HTMLInputElement>('#setting-decals')!;
  private readonly towerEffects = document.querySelector<HTMLInputElement>('#setting-tower-effects')!;
  private readonly abilityEffects = document.querySelector<HTMLInputElement>('#setting-ability-effects')!;
  private readonly gateTorches = document.querySelector<HTMLInputElement>('#setting-gate-torches')!;
  private readonly enemyDetail = document.querySelector<HTMLInputElement>('#setting-enemy-detail')!;
  private readonly campaign = document.querySelector<HTMLElement>('#campaign-menu')!;
  private readonly customMaps = document.querySelector<HTMLElement>('#custom-maps-menu')!;
  private settingsReturn: 'main' | 'build' = 'main';
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
    document.querySelector<HTMLButtonElement>('#menu-tutorial')!.addEventListener('click', () => this.showTutorial());
    document.querySelector<HTMLButtonElement>('#open-graphics')!.addEventListener('click', () => this.showGraphics());
    document.querySelector<HTMLButtonElement>('#open-controls')!.addEventListener('click', () => this.showControls());
    document.querySelector<HTMLButtonElement>('#graphics-close')!.addEventListener('click', () => { this.graphicsMenu.hidden = true; this.settings.hidden = false; });
    document.querySelector<HTMLButtonElement>('#controls-close')!.addEventListener('click', () => { this.controlsMenu.hidden = true; this.settings.hidden = false; });
    document.querySelector<HTMLButtonElement>('#tutorial-close')!.addEventListener('click', () => this.closeToMain(this.tutorialMenu));
    document.querySelector<HTMLButtonElement>('#menu-statistics')?.addEventListener('click', () => this.showStatistics());
    document.querySelector<HTMLButtonElement>('#menu-armory')?.addEventListener('click', () => this.showArmory());
    document.querySelector<HTMLButtonElement>('#settings-close')!.addEventListener('click', () => this.closeSettings());
    document.querySelector<HTMLButtonElement>('#build-settings-button')!.addEventListener('click', () => this.showInGameSettings());
    document.querySelector<HTMLButtonElement>('#statistics-close')!.addEventListener('click', () => this.closeToMain(this.statistics));
    document.querySelector<HTMLButtonElement>('#armory-close')!.addEventListener('click', () => this.closeToMain(this.armory));
    document.querySelector<HTMLButtonElement>('#campaign-close')!.addEventListener('click', () => this.closeToMain(this.campaign));
    document.querySelector<HTMLButtonElement>('#custom-maps-close')!.addEventListener('click', () => this.closeToMain(this.customMaps));
    this.master.addEventListener('input', () => this.saveSettings());
    this.sfx.addEventListener('input', () => this.saveSettings());
    this.sfxCheat.addEventListener('click', () => this.activateSfxCheat());
    this.shake.addEventListener('change', () => this.saveSettings());
    this.damageNumbers.addEventListener('change', () => this.saveSettings());
    this.graphics.addEventListener('change', () => this.saveGraphicsSettings());
    for (const input of [this.graphicsShake, this.graphicsDamageNumbers, this.decals, this.towerEffects, this.abilityEffects, this.gateTorches, this.enemyDetail]) input.addEventListener('change', () => this.saveGraphicsSettings());
    document.querySelector<HTMLButtonElement>('#graphics-low')!.addEventListener('click', () => this.setGraphicsPreset('low'));
    document.querySelector<HTMLButtonElement>('#graphics-high')!.addEventListener('click', () => this.setGraphicsPreset('high'));
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
    this.settingsReturn = 'main';
    this.master.value = settings.masterVolume.toString();
    this.sfx.value = settings.sfxVolume.toString();
    this.shake.checked = settings.screenShake;
    this.damageNumbers.checked = settings.damageNumbers;
    this.settings.hidden = false;
  }

  private showGraphics(): void {
    const settings = this.progression.settings;
    this.main.hidden = true;
    this.settings.hidden = true;
    this.graphics.value = settings.graphicsQuality;
    this.graphicsShake.checked = settings.screenShake;
    this.graphicsDamageNumbers.checked = settings.damageNumbers;
    this.decals.checked = settings.showDecals;
    this.towerEffects.checked = settings.showTowerEffects;
    this.abilityEffects.checked = settings.showAbilityEffects;
    this.gateTorches.checked = settings.animateGateTorches;
    this.enemyDetail.checked = settings.detailedEnemies;
    this.graphicsMenu.hidden = false;
  }

  private showTutorial(): void {
    this.main.hidden = true;
    this.tutorialMenu.hidden = false;
  }

  private showControls(): void {
    this.main.hidden = true;
    this.settings.hidden = true;
    this.controlsMenu.hidden = false;
  }

  showInGameSettings(): void {
    const settings = this.progression.settings;
    this.settingsReturn = 'build';
    this.master.value = settings.masterVolume.toString();
    this.sfx.value = settings.sfxVolume.toString();
    this.shake.checked = settings.screenShake;
    this.damageNumbers.checked = settings.damageNumbers;
    this.graphics.value = settings.graphicsQuality;
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

  private saveGraphicsSettings(): void {
    this.graphicsShake.checked = this.graphicsShake.checked;
    this.shake.checked = this.graphicsShake.checked;
    this.damageNumbers.checked = this.graphicsDamageNumbers.checked;
    this.progression.updateSettings({ graphicsQuality: this.graphics.value as 'low' | 'medium' | 'high', screenShake: this.graphicsShake.checked, damageNumbers: this.graphicsDamageNumbers.checked, showDecals: this.decals.checked, showTowerEffects: this.towerEffects.checked, showAbilityEffects: this.abilityEffects.checked, animateGateTorches: this.gateTorches.checked, detailedEnemies: this.enemyDetail.checked });
  }

  private setGraphicsPreset(preset: 'low' | 'high'): void {
    this.graphics.value = preset;
    const enabled = preset === 'high';
    this.graphicsShake.checked = enabled;
    this.graphicsDamageNumbers.checked = enabled;
    this.decals.checked = enabled;
    this.towerEffects.checked = enabled;
    this.abilityEffects.checked = enabled;
    this.gateTorches.checked = enabled;
    this.enemyDetail.checked = enabled;
    this.saveGraphicsSettings();
  }

  private activateSfxCheat(): void {
    this.progression.grantWarTokens(1000);
    window.alert('Cheat activated: +1,000 War Tokens');
  }

  private closeToMain(panel: HTMLElement): void {
    panel.hidden = true;
    this.main.hidden = false;
  }

  private closeSettings(): void {
    this.settings.hidden = true;
    if (this.settingsReturn === 'main') this.main.hidden = false;
  }
}
