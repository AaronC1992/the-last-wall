export enum TerrainCell {
  Buildable = 0,
  Path = 1,
  Blocked = 2,
  Spawn = 3,
  Goal = 4,
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
  goalCell: MapPoint;
  seed: number;
  enemySettings: MapEnemySettings;
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
