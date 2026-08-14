import { EnemyManager } from '../enemies/EnemyManager';
import { SpatialGrid } from '../systems/SpatialGrid';

export class FireTower {
  readonly x: number;
  readonly y: number;
  private cooldown = 0;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  update(deltaTime: number, enemies: EnemyManager, grid: SpatialGrid): void {
    this.cooldown -= deltaTime;
    if (this.cooldown > 0) return;
    const target = grid.findClosestInRange(this.x, this.y, 290, enemies);
    if (target < 0) return;
    const count = grid.collectInRange(enemies.x[target], enemies.y[target], 58, enemies, 40);
    for (let index = 0; index < count; index++) enemies.applyBurn(grid.resultAt(index), 3, 11);
    this.cooldown = 0.65;
  }
}
