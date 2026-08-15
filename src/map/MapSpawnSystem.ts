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

  nextSpawn(): { x: number; y: number; targetX: number } {
    if (this.burstRemaining <= 0) this.burstRemaining = 8 + Math.floor(this.random.next() * 10);
    this.burstRemaining--;
    const source = this.definition.spawnCells[Math.floor(this.random.next() * this.definition.spawnCells.length)];
    const point = this.grid.cellToWorld(source.x, source.y);
    return { x: point.x + this.random.range(-8, 8), y: point.y + this.random.range(-8, 8), targetX: point.x };
  }

  reset(): void { this.burstRemaining = 0; }
}
