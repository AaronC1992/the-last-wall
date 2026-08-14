export interface SpawnZone { x: number; width: number; targetX: number; }

export const KING_APPROACH = {
  id: 'kings-approach',
  name: "KING'S APPROACH",
  seed: 481516,
  palette: {
    grass: '#536847', grassLight: '#637a50', dryGrass: '#7d8051', dirt: '#806344', dirtEdge: '#5b4934', forest: '#263d2d', stone: '#7b786c', wall: '#918b7b', wallDark: '#625f57', banner: '#a8453e', city: '#41504e', torch: '#f0ad58', mud: '#46392c',
  },
  spawnZones: [
    { x: 85, width: 135, targetX: 205 }, { x: 285, width: 150, targetX: 390 }, { x: 510, width: 180, targetX: 600 }, { x: 765, width: 150, targetX: 790 }, { x: 1000, width: 135, targetX: 1000 },
  ] as readonly SpawnZone[],
  towerPads: { cannon: { x: 288, y: 657 }, ballista: { x: 600, y: 645 }, lightning: { x: 745, y: 657 }, fireTower: { x: 920, y: 657 } },
} as const;
