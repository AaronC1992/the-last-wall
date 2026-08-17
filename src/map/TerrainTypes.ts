export enum TerrainCell {
  Buildable = 0,
  Path = 1,
  Blocked = 2,
  Spawn = 3,
  Goal = 4,
}

import type { EnemyTypeId } from '../enemies/EnemyTypes';

export interface CampaignEnemyGroup {
  type: EnemyTypeId;
  count: number;
  eliteChance?: number;
  startDelay?: number;
  spawnInterval?: number;
  burstSize?: number;
  spawnPreference?: number | string | 'random' | 'all';
  announcement?: string;
  hpMultiplier?: number;
  speedMultiplier?: number;
}

export interface CampaignEncounter {
  groups: readonly CampaignEnemyGroup[];
  hpMultiplier?: number;
  speedMultiplier?: number;
}

export interface MapPoint {
  x: number;
  y: number;
}

export interface MapEnemySettings {
  difficulty: 'easy' | 'normal' | 'hard' | 'insane';
  enemyCount: number;
  variety: 'basic' | 'mixed' | 'elite';
  spawnBurst?: number;
  spawnInterval?: number;
}

export interface MapDefinition {
  version: 1;
  id: string;
  name: string;
  width: number;
  height: number;
  cellSize: number;
  terrain: readonly number[];
  spawnCells: readonly MapPoint[];
  spawnLabels?: Record<string, number>;
  goalCell: MapPoint;
  seed: number;
  enemySettings: MapEnemySettings;
  encounter?: CampaignEncounter;
  baseBuildPointBonus?: number;
  firstClearReward?: number;
  baseTokenReward?: number;
  custom: boolean;
  createdDate?: string;
  modifiedDate?: string;
}

export const DEFAULT_MAP_WIDTH = 240;
export const DEFAULT_MAP_HEIGHT = 144;
export const MAX_CUSTOM_MAP_CELLS = 240 * 144;
export const DEFAULT_MAP_CELL_SIZE = 20;

export function isWalkable(cell: TerrainCell): boolean {
  return cell === TerrainCell.Path || cell === TerrainCell.Spawn || cell === TerrainCell.Goal;
}
