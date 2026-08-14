import { EnemyManager } from '../enemies/EnemyManager';

export class SpatialGrid {
  private readonly cellSize: number;
  private readonly columns: number;
  private readonly rows: number;
  private readonly heads: Int32Array;
  private readonly next: Int32Array;
  private readonly results: Int32Array;

  constructor(width: number, height: number, cellSize: number, capacity: number) {
    this.cellSize = cellSize;
    this.columns = Math.ceil(width / cellSize);
    this.rows = Math.ceil(height / cellSize);
    this.heads = new Int32Array(this.columns * this.rows);
    this.next = new Int32Array(capacity);
    this.results = new Int32Array(capacity);
    this.clear();
  }

  rebuild(enemies: EnemyManager): void {
    this.clear();
    for (let index = 0; index < enemies.count; index++) {
      if (enemies.active[index] === 0) continue;
      const cell = this.cellIndex(enemies.x[index], enemies.y[index]);
      this.next[index] = this.heads[cell];
      this.heads[cell] = index;
    }
  }

  findClosestInRange(originX: number, originY: number, range: number, enemies: EnemyManager): number {
    const rangeSquared = range * range;
    let closestIndex = -1;
    let closestSquared = rangeSquared;
    const minColumn = Math.max(0, Math.floor((originX - range) / this.cellSize));
    const maxColumn = Math.min(this.columns - 1, Math.floor((originX + range) / this.cellSize));
    const minRow = Math.max(0, Math.floor((originY - range) / this.cellSize));
    const maxRow = Math.min(this.rows - 1, Math.floor((originY + range) / this.cellSize));
    for (let row = minRow; row <= maxRow; row++) {
      for (let column = minColumn; column <= maxColumn; column++) {
        let index = this.heads[row * this.columns + column];
        while (index >= 0) {
          if (enemies.active[index] !== 0) {
            const deltaX = enemies.x[index] - originX;
            const deltaY = enemies.y[index] - originY;
            const distanceSquared = deltaX * deltaX + deltaY * deltaY;
            if (distanceSquared < closestSquared) {
              closestSquared = distanceSquared;
              closestIndex = index;
            }
          }
          index = this.next[index];
        }
      }
    }
    return closestIndex;
  }

  collectInRange(originX: number, originY: number, range: number, enemies: EnemyManager, limit: number): number {
    const rangeSquared = range * range;
    const minColumn = Math.max(0, Math.floor((originX - range) / this.cellSize));
    const maxColumn = Math.min(this.columns - 1, Math.floor((originX + range) / this.cellSize));
    const minRow = Math.max(0, Math.floor((originY - range) / this.cellSize));
    const maxRow = Math.min(this.rows - 1, Math.floor((originY + range) / this.cellSize));
    let resultCount = 0;
    for (let row = minRow; row <= maxRow && resultCount < limit; row++) {
      for (let column = minColumn; column <= maxColumn && resultCount < limit; column++) {
        let index = this.heads[row * this.columns + column];
        while (index >= 0 && resultCount < limit) {
          if (enemies.active[index] !== 0) {
            const deltaX = enemies.x[index] - originX;
            const deltaY = enemies.y[index] - originY;
            if (deltaX * deltaX + deltaY * deltaY <= rangeSquared) this.results[resultCount++] = index;
          }
          index = this.next[index];
        }
      }
    }
    return resultCount;
  }

  resultAt(index: number): number {
    return this.results[index];
  }

  private clear(): void {
    this.heads.fill(-1);
  }

  private cellIndex(x: number, y: number): number {
    const column = Math.max(0, Math.min(this.columns - 1, Math.floor(x / this.cellSize)));
    const row = Math.max(0, Math.min(this.rows - 1, Math.floor(y / this.cellSize)));
    return row * this.columns + column;
  }

  get cellCount(): number {
    return this.heads.length;
  }
}
