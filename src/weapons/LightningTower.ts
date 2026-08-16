import { EnemyManager } from '../enemies/EnemyManager';
import { SpatialGrid } from '../systems/SpatialGrid';
import { TowerBase } from './TowerBase';

export interface LaserTargetPoint {
  x: number;
  y: number;
}

export class LightningTower extends TowerBase {
  private tickTimer = 0;
  private damage = 18;
  private chains = 5;
  private chainRange = 110;
  private staticLock = false;

  isFiring = false;
  primaryTarget: LaserTargetPoint | null = null;
  chainedTargets: LaserTargetPoint[] = [];

  constructor(x: number, y: number) {
    super(x, y, 'zone', 510, 110);
  }

  update(deltaTime: number, enemies: EnemyManager, grid: SpatialGrid, onKill: (reward: number) => void): void {
    if (!this.hasAim) {
      this.isFiring = false;
      this.primaryTarget = null;
      this.chainedTargets.length = 0;
      return;
    }

    const count = grid.collectInRange(this.targeting.targetX, this.targeting.targetY, this.targeting.radius, enemies, 80);
    let target = -1;
    let closestDistance = Number.POSITIVE_INFINITY;
    for (let index = 0; index < count; index++) {
      const candidate = grid.resultAt(index);
      const distance = Math.hypot(enemies.x[candidate] - this.targeting.targetX, enemies.y[candidate] - this.targeting.targetY);
      if (distance < closestDistance) { closestDistance = distance; target = candidate; }
    }

    if (target < 0) {
      this.isFiring = false;
      this.primaryTarget = null;
      this.chainedTargets.length = 0;
      return;
    }

    this.isFiring = true;
    this.primaryTarget = { x: enemies.x[target], y: enemies.y[target] };
    this.chainedTargets.length = 0;

    const chainCount = grid.collectInRange(enemies.x[target], enemies.y[target], this.chainRange, enemies, this.chains);
    for (let index = 0; index < chainCount; index++) {
      const chainedEnemyIndex = grid.resultAt(index);
      if (chainedEnemyIndex !== target) {
        this.chainedTargets.push({ x: enemies.x[chainedEnemyIndex], y: enemies.y[chainedEnemyIndex] });
      }
    }

    this.tickTimer += deltaTime;
    if (this.tickTimer >= 0.08) {
      this.tickTimer = 0;
      const tickDmg = (this.damage / 0.52) * 0.08;
      for (let index = 0; index < chainCount; index++) {
        const chainedEnemyIndex = grid.resultAt(index);
        const reward = enemies.damage(chainedEnemyIndex, tickDmg);
        if (reward > 0) onKill(reward);
        else if (this.staticLock && Math.random() < 0.1) enemies.stun(chainedEnemyIndex, 0.4);
      }
    }
  }

  reset(): void {
    this.tickTimer = 0;
    this.isFiring = false;
    this.primaryTarget = null;
    this.chainedTargets.length = 0;
    this.damage = 18; this.chains = 5; this.chainRange = 110; this.targeting.maxDistance = 510; this.targeting.distance = 510; this.targeting.radius = 110;
    this.staticLock = false;
  }

  applyUpgrade(id: string): void { if (id === 'lightningDamage') this.damage *= 1.3; if (id === 'lightningChains') this.chains += 2; if (id === 'lightningRange') { this.chainRange *= 1.25; this.targeting.maxDistance *= 1.2; this.targeting.distance = this.targeting.maxDistance; this.targeting.radius *= 1.15; } if (id === 'lightningStun') this.staticLock = true; if (id === 'thunderstorm') { this.chains += 10; this.damage *= 2; this.targeting.radius *= 1.25; } }
}
