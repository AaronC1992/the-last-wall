export interface SpawnZone { x: number; y: number; width: number; height: number; targetX: number; }
export interface RoadPath { startX: number; startY: number; controlX1: number; controlY1: number; controlX2: number; controlY2: number; endX: number; endY: number; width: number; }
export interface TowerPad { x: number; y: number; kind: 'ballista' | 'cannon' | 'fireTower' | 'lightningTower'; }
export interface MapPalette { grass: string; grassLight: string; dryGrass: string; dirt: string; dirtEdge: string; forest: string; forestLight: string; stone: string; stoneLight: string; wall: string; wallDark: string; banner: string; city: string; torch: string; mud: string; water: string; blood: string; }
export interface MapDefinition { id: string; name: string; seed: number; palette: MapPalette; spawnZones: readonly SpawnZone[]; roadPaths: readonly RoadPath[]; towerPads: readonly TowerPad[]; }

export const KING_APPROACH: MapDefinition = {
  id: 'kings-approach',
  name: "KING'S APPROACH",
  seed: 481516,
  palette: {
    grass: '#a0875d', grassLight: '#b89a6b', dryGrass: '#9a7f54', dirt: '#8b7d6b', dirtEdge: '#6b6153', forest: '#263d2d', forestLight: '#36513a', stone: '#7b786c', stoneLight: '#aaa391', wall: '#918b7b', wallDark: '#625f57', banner: '#a8453e', city: '#41504e', torch: '#f0ad58', mud: '#46392c', water: '#355b5b', blood: '#632f2d',
  },
  spawnZones: [
    { x: 600, y: 40, width: 200, height: 100, targetX: 600 },
  ] as readonly SpawnZone[],
  roadPaths: [
    { startX: 600, startY: 30, controlX1: 480, controlY1: 200, controlX2: 720, controlY2: 380, endX: 600, endY: 668, width: 140 },
  ],
  towerPads: [
    { x: 400, y: 646, kind: 'cannon' }, { x: 550, y: 646, kind: 'fireTower' }, { x: 650, y: 646, kind: 'ballista' }, { x: 800, y: 646, kind: 'lightningTower' },
  ],
} as const;
