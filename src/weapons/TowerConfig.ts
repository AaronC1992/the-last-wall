import type { FeatureUnlockId } from '../progression/FeatureUnlocks';

export type TowerKind = 'ballista' | 'cannon' | 'fireTower' | 'lightningTower' | 'mortar' | 'teslaCoil' | 'sniperTower';

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
  { kind: 'cannon', name: 'Cannon', hotkey: '2', cost: 50, limit: 2, color: '#8f9aa4', accent: '#d6e0e8', unlock: 'cannon', glyph: 'C' },
  { kind: 'fireTower', name: 'Fire Tower', hotkey: '3', cost: 95, limit: 4, color: '#c4713c', accent: '#f7b268', unlock: 'fireTower', glyph: 'F' },
  { kind: 'lightningTower', name: 'Laser Tower', hotkey: '4', cost: 110, limit: 2, color: '#6f8fc4', accent: '#b3d4ff', unlock: 'lightningTower', glyph: 'L' },
  { kind: 'mortar', name: 'Mortar', hotkey: '5', cost: 90, limit: 2, color: '#8f6f56', accent: '#e0b28a', unlock: 'mortar', glyph: 'M' },
  { kind: 'teslaCoil', name: 'Tesla Coil', hotkey: '6', cost: 100, limit: 3, color: '#38bdf8', accent: '#bae6fd', unlock: 'teslaCoil', glyph: 'T' },
  { kind: 'sniperTower', name: 'Sniper Tower', hotkey: '7', cost: 125, limit: 2, color: '#7c8c72', accent: '#d5e3c8', unlock: 'sniperTower', glyph: 'S' },
] as const;

export function towerConfig(kind: TowerKind): TowerConfigEntry {
  return TOWER_CONFIG.find((entry) => entry.kind === kind)!;
}
