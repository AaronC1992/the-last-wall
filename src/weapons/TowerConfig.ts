import type { FeatureUnlockId } from '../progression/FeatureUnlocks';

export type TowerKind = 'ballista' | 'cannon' | 'fireTower' | 'lightningTower';

export interface TowerConfigEntry {
  kind: TowerKind;
  name: string;
  hotkey: string;
  cost: number;
  limit: number;
  color: string;
  accent: string;
  unlock: FeatureUnlockId | null;
  glyph: string;
}

export const TOWER_CONFIG: readonly TowerConfigEntry[] = [
  { kind: 'ballista', name: 'Ballista', hotkey: '1', cost: 50, limit: 10, color: '#c9b184', accent: '#f2e0b4', unlock: null, glyph: 'B' },
  { kind: 'cannon', name: 'Cannon', hotkey: '2', cost: 150, limit: 2, color: '#8f9aa4', accent: '#d6e0e8', unlock: 'cannon', glyph: 'C' },
  { kind: 'fireTower', name: 'Fire Tower', hotkey: '3', cost: 240, limit: 4, color: '#c4713c', accent: '#f7b268', unlock: 'fireTower', glyph: 'F' },
  { kind: 'lightningTower', name: 'Lightning Tower', hotkey: '4', cost: 360, limit: 2, color: '#6f8fc4', accent: '#b3d4ff', unlock: 'lightningTower', glyph: 'L' },
] as const;

export function towerConfig(kind: TowerKind): TowerConfigEntry {
  return TOWER_CONFIG.find((entry) => entry.kind === kind)!;
}
