import { EnemyManager } from '../enemies/EnemyManager';
import { SpatialGrid } from '../systems/SpatialGrid';
import { TowerBase } from './TowerBase';
import type { LaserTargetPoint } from './LightningTower';

export class TeslaCoil extends TowerBase {
  private tickTimer = 0;
  private damage = 26;
  private chains = 3;
  private chainRange = 82;

  isFiring = false;
  primaryTarget: LaserTargetPoint | null = null;
  chainedTargets: LaserTargetPoint[] = [];

  constructor(x: number, y: number) {
    super(x, y, 'zone', 240, 72);
  }

  update(deltaTime: number, enemies: EnemyManager, grid: SpatialGrid, onKill: (reward: number) => void): void {
    if (!this.hasAim) {
      this.isFiring = false;
      this.primaryTarget = null;
      this.chainedTargets.length = 0;
      return;
    }

    const count = grid.collectInRange(this.targeting.targetX, this.targeting.targetY, this.targeting.radius, enemies, 40);
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
    const chainCount = grid.collectInRange(enemies.x[target], enemies.y[target], this.chainRange, enemies, this.chains + 1);
    for (let index = 0; index < chainCount; index++) {
      const chainedTarget = grid.resultAt(index);
      if (chainedTarget !== target) this.chainedTargets.push({ x: enemies.x[chainedTarget], y: enemies.y[chainedTarget] });
    }

    this.tickTimer += deltaTime;
    if (this.tickTimer < 0.12 / this.towerSpeedMultiplier) return;
    this.tickTimer = 0;
    const tickDamage = (this.damage / 0.6) * 0.12;
    for (let index = 0; index < chainCount; index++) {
      const reward = enemies.damage(grid.resultAt(index), tickDamage);
      if (reward > 0) onKill(reward);
    }
  }

  reset(): void {
    this.tickTimer = 0;
    this.isFiring = false;
    this.primaryTarget = null;
    this.chainedTargets.length = 0;
    this.damage = 26 * this.towerDamageMultiplier;
    this.chains = 3;
    this.chainRange = 82;
    this.targeting.maxDistance = 240;
    this.targeting.distance = 240;
    this.targeting.radius = 72;
  }

  applyUpgrade(id: string): void {
    if (id === 'teslaDamage') this.damage *= 1.3;
    if (id === 'teslaChains') this.chains += 2;
    if (id === 'teslaReach') { this.targeting.maxDistance *= 1.2; this.targeting.distance = this.targeting.maxDistance; this.targeting.radius *= 1.15; this.chainRange *= 1.2; }
  }
}