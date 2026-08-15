import { createMapDefinition } from './MapFactory';
import type { MapDefinition, MapPoint } from './TerrainTypes';

const normal = (enemyCount: number) => ({ difficulty: 'normal' as const, enemyCount, variety: 'mixed' as const });
const route = (...points: MapPoint[]) => points;

export const CAMPAIGN_MAPS: readonly MapDefinition[] = [
  createMapDefinition('campaign-01', 'THE FIRST APPROACH', [route({ x: 20, y: 1 }, { x: 13, y: 4 }, { x: 27, y: 7 }, { x: 12, y: 11 }, { x: 29, y: 15 }, { x: 16, y: 19 }, { x: 24, y: 22 }, { x: 20, y: 23 })], [{ x: 20, y: 1 }], { x: 20, y: 23 }, normal(1000), 101),
  createMapDefinition('campaign-02', 'THE BEND', [route({ x: 8, y: 1 }, { x: 8, y: 5 }, { x: 28, y: 5 }, { x: 34, y: 9 }, { x: 30, y: 13 }, { x: 12, y: 13 }, { x: 6, y: 17 }, { x: 10, y: 21 }, { x: 20, y: 23 })], [{ x: 8, y: 1 }], { x: 20, y: 23 }, normal(2000), 102),
  createMapDefinition('campaign-03', 'THE FORK', [route({ x: 20, y: 1 }, { x: 20, y: 7 }, { x: 11, y: 14 }, { x: 20, y: 23 }), route({ x: 20, y: 7 }, { x: 29, y: 14 }, { x: 20, y: 23 })], [{ x: 20, y: 1 }], { x: 20, y: 23 }, normal(3000), 103),
  createMapDefinition('campaign-04', 'THE CROSSROADS', [route({ x: 8, y: 1 }, { x: 8, y: 8 }, { x: 30, y: 16 }, { x: 20, y: 23 }), route({ x: 32, y: 1 }, { x: 32, y: 8 }, { x: 10, y: 16 }, { x: 20, y: 23 })], [{ x: 8, y: 1 }, { x: 32, y: 1 }], { x: 20, y: 23 }, normal(4000), 104),
  createMapDefinition('campaign-05', 'THE BOTTLENECK', [route({ x: 6, y: 1 }, { x: 34, y: 7 }, { x: 20, y: 12 }, { x: 20, y: 17 }, { x: 20, y: 23 })], [{ x: 6, y: 1 }], { x: 20, y: 23 }, normal(5000), 105),
  createMapDefinition('campaign-06', 'TWIN RAVINES', [route({ x: 9, y: 1 }, { x: 9, y: 18 }, { x: 20, y: 23 }), route({ x: 31, y: 1 }, { x: 31, y: 18 }, { x: 20, y: 23 })], [{ x: 9, y: 1 }, { x: 31, y: 1 }], { x: 20, y: 23 }, normal(6000), 106),
  createMapDefinition('campaign-07', 'THE SERPENT', [route({ x: 20, y: 1 }, { x: 34, y: 5 }, { x: 7, y: 10 }, { x: 34, y: 15 }, { x: 7, y: 20 }, { x: 20, y: 23 })], [{ x: 20, y: 1 }], { x: 20, y: 23 }, normal(7000), 107),
  createMapDefinition('campaign-08', 'THREE WAYS', [route({ x: 20, y: 1 }, { x: 8, y: 12 }, { x: 20, y: 23 }), route({ x: 20, y: 1 }, { x: 20, y: 12 }, { x: 20, y: 23 }), route({ x: 20, y: 1 }, { x: 32, y: 12 }, { x: 20, y: 23 })], [{ x: 20, y: 1 }], { x: 20, y: 23 }, normal(8000), 108),
  createMapDefinition('campaign-09', 'THE FLOOD', [route({ x: 6, y: 1 }, { x: 8, y: 12 }, { x: 20, y: 18 }, { x: 20, y: 23 }), route({ x: 20, y: 1 }, { x: 20, y: 12 }, { x: 20, y: 23 }), route({ x: 34, y: 1 }, { x: 32, y: 12 }, { x: 20, y: 18 }, { x: 20, y: 23 })], [{ x: 6, y: 1 }, { x: 20, y: 1 }, { x: 34, y: 1 }], { x: 20, y: 23 }, normal(9000), 109),
  createMapDefinition('campaign-10', 'THE LAST VALLEY', [route({ x: 6, y: 1 }, { x: 6, y: 8 }, { x: 14, y: 12 }, { x: 20, y: 18 }, { x: 20, y: 23 }), route({ x: 20, y: 1 }, { x: 20, y: 10 }, { x: 20, y: 18 }, { x: 20, y: 23 }), route({ x: 34, y: 1 }, { x: 34, y: 8 }, { x: 26, y: 12 }, { x: 20, y: 18 }, { x: 20, y: 23 })], [{ x: 6, y: 1 }, { x: 20, y: 1 }, { x: 34, y: 1 }], { x: 20, y: 23 }, normal(10000), 110),
];

export const DEFAULT_CAMPAIGN_MAP = CAMPAIGN_MAPS[0];
