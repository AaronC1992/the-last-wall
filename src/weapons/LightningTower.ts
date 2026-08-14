import { EnemyManager } from '../enemies/EnemyManager';
import { SpatialGrid } from '../systems/SpatialGrid';

export class LightningTower {
  readonly x: number;
  readonly y: number;
  private cooldown = 0;
  private damage = 18;
  private chains = 5;
  private chainRange = 110;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  update(deltaTime: number, enemies: EnemyManager, grid: SpatialGrid, onKill: (reward: number) => void): void {
    this.cooldown -= deltaTime;
    if (this.cooldown > 0) return;
    const target = grid.findClosestInRange(this.x, this.y, 510, enemies);
    if (target < 0) return;
    const count = grid.collectInRange(enemies.x[target], enemies.y[target], this.chainRange, enemies, this.chains);
    for (let index = 0; index < count; index++) {
      const reward = enemies.damage(grid.resultAt(index), this.damage);
      if (reward > 0) onKill(reward);
    }
    this.cooldown = 0.52;
  }

  reset(): void {
    this.cooldown = 0;
    this.damage = 18; this.chains = 5; this.chainRange = 110;
  }

  applyUpgrade(id: string): void { if (id === 'lightningDamage') this.damage *= 1.3; if (id === 'lightningChains') this.chains += 2; if (id === 'lightningRange') this.chainRange *= 1.25; if (id === 'lightningStun') this.damage *= 1.15; if (id === 'thunderstorm') { this.chains += 10; this.damage *= 2; } }
}
