import { EnemyManager } from '../enemies/EnemyManager';
import { SpatialGrid } from '../systems/SpatialGrid';

export class LightningTower {
  readonly x: number;
  readonly y: number;
  private cooldown = 0;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  update(deltaTime: number, enemies: EnemyManager, grid: SpatialGrid, onKill: (reward: number) => void): void {
    this.cooldown -= deltaTime;
    if (this.cooldown > 0) return;
    const target = grid.findClosestInRange(this.x, this.y, 510, enemies);
    if (target < 0) return;
    const count = grid.collectInRange(enemies.x[target], enemies.y[target], 110, enemies, 5);
    for (let index = 0; index < count; index++) {
      const reward = enemies.damage(grid.resultAt(index), 18);
      if (reward > 0) onKill(reward);
    }
    this.cooldown = 0.52;
  }
}
