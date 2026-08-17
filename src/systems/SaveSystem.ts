export const SAVE_VERSION = 4;
export const SAVE_KEY = 'the-last-wall-save';
export const SAVE_BACKUP_KEY = 'the-last-wall-save-backup';
export type GraphicsQuality = 'low' | 'medium' | 'high';

export interface SaveData {
  version: number;
  warTokens: number;
  upgrades: Record<string, number>;
  unlocks: Record<string, boolean>;
  statistics: { totalKills: number; totalRuns: number; totalBuildPoints: number; highestKills: number; highestLifetimeCombo: number };
  settings: { damageNumbers: boolean; screenShake: boolean; masterVolume: number; sfxVolume: number; musicVolume: number; graphicsQuality: GraphicsQuality; showDecals: boolean; showTowerEffects: boolean; showAbilityEffects: boolean; animateGateTorches: boolean; detailedEnemies: boolean; showStatusEffects: boolean };
  completedCampaign: string[];
  firstClearRewards: Record<string, boolean>;
}

type RawSave = Partial<SaveData> & {
  version?: unknown;
  statistics?: Partial<SaveData['statistics']> & { totalGold?: number };
  settings?: Partial<SaveData['settings']>;
};

export function migrateSave(raw: unknown): SaveData | null {
  if (!raw || typeof raw !== 'object') return null;
  const parsed = raw as RawSave;
  if (typeof parsed.warTokens !== 'number' || !Number.isFinite(parsed.warTokens)) return null;
  const statistics: Partial<SaveData['statistics']> & { totalGold?: number } = parsed.statistics ?? {};
  const settings: Partial<SaveData['settings']> = parsed.settings ?? {};
  const graphicsQuality: GraphicsQuality = settings.graphicsQuality === 'low' || settings.graphicsQuality === 'high' ? settings.graphicsQuality : 'medium';
  return {
    version: SAVE_VERSION,
    warTokens: Math.max(0, parsed.warTokens),
    upgrades: isNumberRecord(parsed.upgrades) ? parsed.upgrades : {},
    unlocks: isBooleanRecord(parsed.unlocks) ? parsed.unlocks : {},
    statistics: {
      totalKills: finiteNonNegative(statistics.totalKills),
      totalRuns: finiteNonNegative(statistics.totalRuns),
      totalBuildPoints: finiteNonNegative(statistics.totalBuildPoints ?? statistics.totalGold),
      highestKills: finiteNonNegative(statistics.highestKills),
      highestLifetimeCombo: finiteNonNegative(statistics.highestLifetimeCombo),
    },
    settings: {
      damageNumbers: settings.damageNumbers ?? true,
      screenShake: settings.screenShake ?? true,
      masterVolume: clampVolume(settings.masterVolume, 0.5),
      sfxVolume: clampVolume(settings.sfxVolume, 0.6),
      musicVolume: clampVolume(settings.musicVolume, 0.3),
      graphicsQuality,
      showDecals: settings.showDecals ?? true,
      showTowerEffects: settings.showTowerEffects ?? true,
      showAbilityEffects: settings.showAbilityEffects ?? true,
      animateGateTorches: settings.animateGateTorches ?? true,
      detailedEnemies: settings.detailedEnemies ?? true,
      showStatusEffects: settings.showStatusEffects ?? true,
    },
    completedCampaign: Array.isArray(parsed.completedCampaign) ? parsed.completedCampaign.filter((id): id is string => typeof id === 'string') : [],
      firstClearRewards: isBooleanRecord(parsed.firstClearRewards) ? parsed.firstClearRewards : {},
  };
}

export class SaveSystem {
  load(): SaveData {
    const fallback = this.createDefault();
    try {
      const rawSave = localStorage.getItem(SAVE_KEY);
      if (!rawSave) return fallback;
      const raw = JSON.parse(rawSave) as RawSave;
      const migrated = migrateSave(raw);
      if (!migrated) return fallback;
      if (migrated.version !== raw.version) this.save(migrated);
      return migrated;
    } catch {
      return fallback;
    }
  }

  save(data: SaveData): void {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch { /* Saving is optional when browser storage is unavailable. */ }
  }

  reset(): void {
    try {
      const current = localStorage.getItem(SAVE_KEY);
      if (current) localStorage.setItem(SAVE_BACKUP_KEY, current);
      localStorage.removeItem(SAVE_KEY);
    } catch { /* Saving is optional when browser storage is unavailable. */ }
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
      firstClearRewards: {},
    };
  }
}

function isNumberRecord(value: unknown): value is Record<string, number> {
  return !!value && typeof value === 'object' && Object.values(value).every((entry) => typeof entry === 'number' && Number.isFinite(entry));
}

function isBooleanRecord(value: unknown): value is Record<string, boolean> {
  return !!value && typeof value === 'object' && Object.values(value).every((entry) => typeof entry === 'boolean');
}

function finiteNonNegative(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : 0;
}

function clampVolume(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : fallback;
}
