import { EnemyManager } from '../enemies/EnemyManager';
import { SpatialGrid } from '../systems/SpatialGrid';
import { TowerBase } from './TowerBase';

export interface LaserTargetPoint {
  x: number;
  y: number;
}

export class LightningTower extends TowerBase {
  private tickTimer = 0;
  private damage = 42;
  private beamWidth = 0.09;
  private rangeValue = 560;

  isFiring = false;
  primaryTarget: LaserTargetPoint | null = null;
  chainedTargets: LaserTargetPoint[] = [];

  constructor(x: number, y: number) {
    super(x, y, 'line', 560, 0, 0.09);
  }

  update(deltaTime: number, enemies: EnemyManager, grid: SpatialGrid, onKill: (reward: number) => void): void {
    if (!this.hasAim) {
      this.isFiring = false;
      this.primaryTarget = null;
      this.chainedTargets.length = 0;
      return;
    }

    const count = grid.collectInRange(this.x, this.y, this.rangeValue, enemies, 80);
    let target = -1;
    let highestProgress = Number.NEGATIVE_INFINITY;
    for (let index = 0; index < count; index++) {
      const candidate = grid.resultAt(index);
      if (this.isInFixedCone(enemies.x[candidate], enemies.y[candidate], this.rangeValue) && enemies.y[candidate] > highestProgress) { highestProgress = enemies.y[candidate]; target = candidate; }
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

    this.tickTimer += deltaTime;
    if (this.tickTimer >= 0.06 / this.towerSpeedMultiplier) {
      this.tickTimer = 0;
      const reward = enemies.damage(target, (this.damage / 0.6) * 0.06);
      if (reward > 0) onKill(reward);
    }
  }

  reset(): void {
    this.tickTimer = 0;
    this.isFiring = false;
    this.primaryTarget = null;
    this.chainedTargets.length = 0;
    this.damage = 42 * this.towerDamageMultiplier; this.beamWidth = 0.09; this.rangeValue = 560 * this.towerRangeMultiplier; this.targeting.maxDistance = this.rangeValue; this.targeting.distance = this.rangeValue; this.targeting.coneAngle = this.beamWidth;
  }

}
