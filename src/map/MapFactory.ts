import { TerrainCell } from './TerrainTypes';
import type { MapDefinition, MapEnemySettings, MapPoint } from './TerrainTypes';
import { DEFAULT_MAP_CELL_SIZE, DEFAULT_MAP_HEIGHT, DEFAULT_MAP_WIDTH } from './TerrainTypes';

const WIDTH = DEFAULT_MAP_WIDTH;
const HEIGHT = DEFAULT_MAP_HEIGHT;
const SOURCE_WIDTH = 80;
const SOURCE_HEIGHT = 48;

export function createMapDefinition(id: string, name: string, routes: readonly (readonly MapPoint[])[], spawns: readonly MapPoint[], goal: MapPoint, settings: MapEnemySettings, seed: number): MapDefinition {
  const terrain = new Uint8Array(WIDTH * HEIGHT);
  terrain.fill(TerrainCell.Buildable);
  for (let x = 0; x < WIDTH; x++) {
    terrain[x] = TerrainCell.Blocked;
    terrain[(HEIGHT - 1) * WIDTH + x] = TerrainCell.Blocked;
  }
  for (const route of routes) carveRoute(terrain, route.map(scalePoint), 1);
  const scaledSpawns = spawns.map(scalePoint);
  const scaledGoal = scalePoint(goal);
  for (const spawn of scaledSpawns) carveCell(terrain, spawn, 1, TerrainCell.Spawn);
  carveCell(terrain, scaledGoal, 1, TerrainCell.Goal);
  return { version: 1, id, name, width: WIDTH, height: HEIGHT, cellSize: DEFAULT_MAP_CELL_SIZE, terrain: Array.from(terrain), spawnCells: scaledSpawns, goalCell: scaledGoal, seed, enemySettings: settings, custom: false };
}

function scalePoint(point: MapPoint): MapPoint {
  return { x: Math.round(point.x * (WIDTH - 1) / (SOURCE_WIDTH - 1)), y: Math.round(point.y * (HEIGHT - 1) / (SOURCE_HEIGHT - 1)) };
}

function carveRoute(terrain: Uint8Array, route: readonly MapPoint[], radius: number): void {
  for (let index = 0; index < route.length - 1; index++) {
    const start = route[index];
    const end = route[index + 1];
    const distance = Math.max(Math.abs(end.x - start.x), Math.abs(end.y - start.y)) * 4;
    for (let step = 0; step <= distance; step++) {
      const amount = distance === 0 ? 0 : step / distance;
      carveCell(terrain, { x: Math.round(start.x + (end.x - start.x) * amount), y: Math.round(start.y + (end.y - start.y) * amount) }, radius, TerrainCell.Path);
    }
  }
}

function carveCell(terrain: Uint8Array, center: MapPoint, radius: number, cell: TerrainCell): void {
  for (let y = center.y - radius; y <= center.y + radius; y++) for (let x = center.x - radius; x <= center.x + radius; x++) {
    if (x >= 1 && x < WIDTH - 1 && y >= 1 && y < HEIGHT - 1) terrain[y * WIDTH + x] = cell;
  }
}
