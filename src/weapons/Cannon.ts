import { EnemyManager } from '../enemies/EnemyManager';
import { SpatialGrid } from '../systems/SpatialGrid';

export class Cannon {
  readonly x: number;
  readonly y: number;
  private cooldown = 1.8;
  private damage = 32;
  private radius = 70;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  update(deltaTime: number, enemies: EnemyManager, grid: SpatialGrid, onKill: (reward: number) => void): void {
    this.cooldown -= deltaTime;
    if (this.cooldown > 0) return;
    const target = grid.findClosestInRange(this.x, this.y, 620, enemies);
    if (target < 0) return;
    const count = grid.collectInRange(enemies.x[target], enemies.y[target], this.radius, enemies, 96);
    for (let index = 0; index < count; index++) {
      const reward = enemies.damage(grid.resultAt(index), this.damage);
      if (reward > 0) onKill(reward);
    }
    this.cooldown = 1.8;
  }

  reset(): void {
    this.cooldown = 1.8;
    this.damage = 32;
    this.radius = 70;
  }

  applyUpgrade(id: string): void { if (id === 'cannonDamage') this.damage *= 1.25; if (id === 'cannonRadius') this.radius *= 1.25; if (id === 'cannonSpeed') this.cooldown *= 0.8; if (id === 'clusterShells') this.damage *= 1.35; if (id === 'doubleBarrel') this.damage *= 1.8; }
}
