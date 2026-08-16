export const SAVE_VERSION = 3;
export const SAVE_KEY = 'the-last-wall-save';
export type GraphicsQuality = 'low' | 'medium' | 'high';

export interface SaveData {
  version: number;
  warTokens: number;
  upgrades: Record<string, number>;
  unlocks: Record<string, boolean>;
  statistics: { totalKills: number; totalRuns: number; totalBuildPoints: number; highestKills: number; highestLifetimeCombo: number };
  settings: { damageNumbers: boolean; screenShake: boolean; masterVolume: number; sfxVolume: number; musicVolume: number; graphicsQuality: GraphicsQuality; showDecals: boolean; showTowerEffects: boolean; showAbilityEffects: boolean; animateGateTorches: boolean; detailedEnemies: boolean; showStatusEffects: boolean };
  completedCampaign: string[];
}

export class SaveSystem {
  load(): SaveData {
    const fallback = this.createDefault();
    try {
      const rawSave = localStorage.getItem(SAVE_KEY);
      if (!rawSave) return fallback;
      const parsed = JSON.parse(rawSave) as Partial<SaveData> & { statistics?: Partial<SaveData['statistics']> & { totalGold?: number } };
      if ((parsed.version !== 1 && parsed.version !== SAVE_VERSION) || typeof parsed.warTokens !== 'number' || !parsed.upgrades) return fallback;
      return {
        version: SAVE_VERSION,
        warTokens: Math.max(0, parsed.warTokens),
        upgrades: parsed.upgrades,
        unlocks: parsed.unlocks ?? {},
        statistics: { totalKills: parsed.statistics?.totalKills ?? 0, totalRuns: parsed.statistics?.totalRuns ?? 0, totalBuildPoints: parsed.statistics?.totalBuildPoints ?? parsed.statistics?.totalGold ?? 0, highestKills: parsed.statistics?.highestKills ?? 0, highestLifetimeCombo: parsed.statistics?.highestLifetimeCombo ?? 0 },
        settings: { damageNumbers: parsed.settings?.damageNumbers ?? true, screenShake: parsed.settings?.screenShake ?? true, masterVolume: parsed.settings?.masterVolume ?? 0.5, sfxVolume: parsed.settings?.sfxVolume ?? 0.6, musicVolume: parsed.settings?.musicVolume ?? 0.3, graphicsQuality: parsed.settings?.graphicsQuality === 'low' || parsed.settings?.graphicsQuality === 'high' ? parsed.settings.graphicsQuality : 'medium', showDecals: parsed.settings?.showDecals ?? true, showTowerEffects: parsed.settings?.showTowerEffects ?? true, showAbilityEffects: parsed.settings?.showAbilityEffects ?? true, animateGateTorches: parsed.settings?.animateGateTorches ?? true, detailedEnemies: parsed.settings?.detailedEnemies ?? true, showStatusEffects: parsed.settings?.showStatusEffects ?? true },
        completedCampaign: Array.isArray(parsed.completedCampaign) ? parsed.completedCampaign.filter((id): id is string => typeof id === 'string') : [],
      };
    } catch {
      return fallback;
    }
  }

  save(data: SaveData): void {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch {
      // Saving is optional when browser storage is unavailable.
    }
  }

  reset(): void {
    try { localStorage.removeItem(SAVE_KEY); } catch { /* Saving is optional when browser storage is unavailable. */ }
  }

  private createDefault(): SaveData {
    return {
      version: SAVE_VERSION,
      warTokens: 0,
      upgrades: {},
      unlocks: {},
      statistics: { totalKills: 0, totalRuns: 0, totalBuildPoints: 0, highestKills: 0, highestLifetimeCombo: 0 },
      settings: { damageNumbers: true, screenShake: true, masterVolume: 0.5, sfxVolume: 0.6, musicVolume: 0.3, graphicsQuality: 'medium', showDecals: true, showTowerEffects: true, showAbilityEffects: true, animateGateTorches: true, detailedEnemies: true, showStatusEffects: true },
      completedCampaign: [],
    };
  }
}
