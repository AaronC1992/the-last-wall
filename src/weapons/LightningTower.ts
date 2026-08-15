import { EnemyManager } from '../enemies/EnemyManager';
import { SpatialGrid } from '../systems/SpatialGrid';
import { TowerBase } from './TowerBase';

export class LightningTower extends TowerBase {
  private cooldown = 0;
  private damage = 18;
  private chains = 5;
  private chainRange = 110;
  private staticLock = false;

  constructor(x: number, y: number) {
    super(x, y, 'zone', 510, 110);
  }

  update(deltaTime: number, enemies: EnemyManager, grid: SpatialGrid, onKill: (reward: number) => void): void {
    this.cooldown -= deltaTime;
    if (this.cooldown > 0) return;
    if (!this.hasAim) return;
    const count = grid.collectInRange(this.targeting.targetX, this.targeting.targetY, this.targeting.radius, enemies, 80);
    let target = -1;
    let closestDistance = Number.POSITIVE_INFINITY;
    for (let index = 0; index < count; index++) {
      const candidate = grid.resultAt(index);
      const distance = Math.hypot(enemies.x[candidate] - this.targeting.targetX, enemies.y[candidate] - this.targeting.targetY);
      if (distance < closestDistance) { closestDistance = distance; target = candidate; }
    }
    if (target < 0) return;
    const chainCount = grid.collectInRange(enemies.x[target], enemies.y[target], this.chainRange, enemies, this.chains);
    for (let index = 0; index < chainCount; index++) {
      const reward = enemies.damage(grid.resultAt(index), this.damage);
      if (reward > 0) onKill(reward);
      else if (this.staticLock && Math.random() < 0.3) enemies.stun(grid.resultAt(index), 0.55);
    }
    this.cooldown = 0.52;
  }

  reset(): void {
    this.cooldown = 0;
    this.damage = 18; this.chains = 5; this.chainRange = 110; this.targeting.maxDistance = 510; this.targeting.distance = 510; this.targeting.radius = 110;
    this.staticLock = false;
  }

  applyUpgrade(id: string): void { if (id === 'lightningDamage') this.damage *= 1.3; if (id === 'lightningChains') this.chains += 2; if (id === 'lightningRange') { this.chainRange *= 1.25; this.targeting.maxDistance *= 1.2; this.targeting.distance = this.targeting.maxDistance; this.targeting.radius *= 1.15; } if (id === 'lightningStun') this.staticLock = true; if (id === 'thunderstorm') { this.chains += 10; this.damage *= 2; this.targeting.radius *= 1.25; } }
}
