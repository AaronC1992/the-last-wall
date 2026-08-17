import { SeededRandom } from './SeededRandom';
import type { MapDefinition } from './TerrainTypes';
import { TerrainGrid } from './TerrainGrid';

export class MapSpawnSystem {
  private readonly random: SeededRandom;
  private readonly grid: TerrainGrid;
  private burstRemaining = 0;

  constructor(private readonly definition: MapDefinition) {
    this.random = new SeededRandom(definition.seed + 19);
    this.grid = new TerrainGrid(definition);
  }

  nextSpawn(spawnPreference: number | 'random' | 'all' = 'random'): { x: number; y: number; targetX: number } {
    if (this.burstRemaining <= 0) this.burstRemaining = 8 + Math.floor(this.random.next() * 10);
    this.burstRemaining--;
    const spawnIndex = typeof spawnPreference === 'number' && this.definition.spawnCells.length > 0
      ? Math.max(0, Math.min(this.definition.spawnCells.length - 1, spawnPreference))
      : Math.floor(this.random.next() * this.definition.spawnCells.length);
    const source = this.definition.spawnCells[spawnIndex];
    const point = this.grid.cellToWorld(source.x, source.y);
    return { x: point.x + this.random.range(-8, 8), y: point.y + this.random.range(-8, 8), targetX: point.x };
  }

  reset(): void { this.burstRemaining = 0; }
}
