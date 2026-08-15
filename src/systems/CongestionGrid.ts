import { TerrainGrid } from '../map/TerrainGrid';
import { EnemyManager } from '../enemies/EnemyManager';

export class CongestionGrid {
  readonly values: Float32Array;

  constructor(private readonly terrain: TerrainGrid) {
    this.values = new Float32Array(terrain.width * terrain.height);
  }

  rebuild(enemies: EnemyManager): void {
    this.values.fill(0);
    for (let index = 0; index < enemies.count; index++) {
      if (enemies.active[index] === 0) continue;
      const cell = this.terrain.worldToCell(enemies.x[index], enemies.y[index]);
      if (this.terrain.inBounds(cell.x, cell.y)) this.values[this.terrain.index(cell.x, cell.y)] += 1;
    }
  }

  at(x: number, y: number): number {
    return this.terrain.inBounds(x, y) ? this.values[this.terrain.index(x, y)] : 1000;
  }
}
