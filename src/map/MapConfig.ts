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
    grass: '#536847', grassLight: '#637a50', dryGrass: '#7d8051', dirt: '#806344', dirtEdge: '#5b4934', forest: '#263d2d', forestLight: '#36513a', stone: '#7b786c', stoneLight: '#aaa391', wall: '#918b7b', wallDark: '#625f57', banner: '#a8453e', city: '#41504e', torch: '#f0ad58', mud: '#46392c', water: '#355b5b', blood: '#632f2d',
  },
  spawnZones: [
    { x: 92, y: 46, width: 145, height: 78, targetX: 205 }, { x: 292, y: 32, width: 150, height: 82, targetX: 390 }, { x: 515, y: 25, width: 170, height: 88, targetX: 600 }, { x: 760, y: 32, width: 150, height: 82, targetX: 790 }, { x: 1005, y: 46, width: 145, height: 78, targetX: 1000 },
  ] as readonly SpawnZone[],
  roadPaths: [
    { startX: 600, startY: 34, controlX1: 574, controlY1: 190, controlX2: 626, controlY2: 430, endX: 600, endY: 668, width: 118 },
    { startX: 145, startY: 88, controlX1: 230, controlY1: 180, controlX2: 350, controlY2: 435, endX: 390, endY: 668, width: 62 },
    { startX: 330, startY: 70, controlX1: 365, controlY1: 190, controlX2: 450, controlY2: 440, endX: 490, endY: 668, width: 54 },
    { startX: 875, startY: 70, controlX1: 830, controlY1: 190, controlX2: 755, controlY2: 440, endX: 720, endY: 668, width: 54 },
    { startX: 1055, startY: 88, controlX1: 960, controlY1: 180, controlX2: 850, controlY2: 435, endX: 810, endY: 668, width: 62 },
  ],
  towerPads: [
    { x: 300, y: 646, kind: 'cannon' }, { x: 505, y: 638, kind: 'fireTower' }, { x: 650, y: 638, kind: 'ballista' }, { x: 780, y: 646, kind: 'lightningTower' },
  ],
} as const;
