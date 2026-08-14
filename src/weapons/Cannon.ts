import { EnemyManager } from '../enemies/EnemyManager';
import { SpatialGrid } from '../systems/SpatialGrid';

export class Cannon {
  readonly x: number;
  readonly y: number;
  private cooldown = 1.8;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  update(deltaTime: number, enemies: EnemyManager, grid: SpatialGrid, onKill: (reward: number) => void): void {
    this.cooldown -= deltaTime;
    if (this.cooldown > 0) return;
    const target = grid.findClosestInRange(this.x, this.y, 620, enemies);
    if (target < 0) return;
    const count = grid.collectInRange(enemies.x[target], enemies.y[target], 70, enemies, 96);
    for (let index = 0; index < count; index++) {
      const reward = enemies.damage(grid.resultAt(index), 32);
      if (reward > 0) onKill(reward);
    }
    this.cooldown = 1.8;
  }
}
