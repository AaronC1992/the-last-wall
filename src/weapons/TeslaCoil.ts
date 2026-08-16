import { EnemyManager } from '../enemies/EnemyManager';
import { SpatialGrid } from '../systems/SpatialGrid';
import { TowerBase } from './TowerBase';
import type { LaserTargetPoint } from './LightningTower';

export class TeslaCoil extends TowerBase {
  private pulseTimer = 0;
  private arcFlashTimer = 0;
  private damage = 26;
  private chains = 3;
  private chainRange = 82;
  private shock = false;

  isFiring = false;
  primaryTarget: LaserTargetPoint | null = null;
  chainedTargets: LaserTargetPoint[] = [];

  constructor(x: number, y: number) {
    super(x, y, 'zone', 0, 130);
    this.hasAim = true;
    this.targeting.targetX = x;
    this.targeting.targetY = y;
  }

  update(deltaTime: number, enemies: EnemyManager, grid: SpatialGrid, onKill: (reward: number) => void): void {
    this.arcFlashTimer = Math.max(0, this.arcFlashTimer - deltaTime);
    const count = grid.collectInRange(this.x, this.y, this.targeting.radius, enemies, 40);
    let target = -1;
    let closestDistance = Number.POSITIVE_INFINITY;
    for (let index = 0; index < count; index++) {
      const candidate = grid.resultAt(index);
      const distance = Math.hypot(enemies.x[candidate] - this.x, enemies.y[candidate] - this.y);
      if (distance < closestDistance) { closestDistance = distance; target = candidate; }
    }

    if (target < 0) {
      this.isFiring = false;
      this.primaryTarget = null;
      this.chainedTargets.length = 0;
      return;
    }

    this.primaryTarget = { x: enemies.x[target], y: enemies.y[target] };
    this.chainedTargets.length = 0;
    const chainCount = grid.collectInRange(enemies.x[target], enemies.y[target], this.chainRange, enemies, this.chains + 1);
    for (let index = 0; index < chainCount; index++) {
      const chainedTarget = grid.resultAt(index);
      if (chainedTarget !== target) this.chainedTargets.push({ x: enemies.x[chainedTarget], y: enemies.y[chainedTarget] });
    }

    this.isFiring = this.arcFlashTimer > 0;
    this.pulseTimer -= deltaTime;
    if (this.pulseTimer > 0) return;
    this.arcFlashTimer = 0.1;
    this.isFiring = true;
    const pulseLength = 0.18 + Math.random() * 0.18;
    this.pulseTimer = (0.16 + Math.random() * 0.24) / this.towerSpeedMultiplier;
    const pulseDamage = (this.damage / 0.6) * pulseLength;
    for (let index = 0; index < chainCount; index++) {
      const enemyIndex = grid.resultAt(index);
      enemies.electrify(enemyIndex, 0.16);
      const reward = enemies.damage(enemyIndex, pulseDamage);
      if (reward > 0) onKill(reward);
      else if (this.shock && Math.random() < 0.18) enemies.stun(enemyIndex, 0.3);
    }
  }

  reset(): void {
    this.pulseTimer = 0.1 + Math.random() * 0.25;
    this.arcFlashTimer = 0;
    this.isFiring = false;
    this.primaryTarget = null;
    this.chainedTargets.length = 0;
    this.damage = 26 * this.towerDamageMultiplier;
    this.chains = 3;
    this.chainRange = 82;
    this.shock = false;
    this.targeting.maxDistance = 0;
    this.targeting.distance = 0;
    this.targeting.radius = 130;
    this.targeting.targetX = this.x;
    this.targeting.targetY = this.y;
    this.hasAim = true;
  }

  applyUpgrade(id: string): void {
    if (id === 'teslaDamage') this.damage *= 1.3;
    if (id === 'teslaChains') this.chains += 2;
    if (id === 'teslaReach') { this.targeting.radius *= 1.2; this.chainRange *= 1.2; }
    if (id === 'teslaShock') this.shock = true;
    if (id === 'plasmaStorm') { this.chains += 8; this.chainRange *= 1.4; this.damage *= 1.6; this.shock = true; }
  }

  setAim(_x: number, _y: number): void {
  }
}