import { EnemyManager } from '../enemies/EnemyManager';
import { EnemyType } from '../enemies/EnemyTypes';
import { SpatialGrid } from '../systems/SpatialGrid';
import { ProjectileManager } from './ProjectileManager';
import { TowerBase } from './TowerBase';

export class SniperTower extends TowerBase {
  private cooldown = 0;
  private damage = 180;
  private cooldownDuration = 1.8;
  private projectileSpeed = 720;
  private rangeValue = 820;
  private penetration = 1;

  constructor(x: number, y: number) {
    super(x, y, 'line', 820);
  }

  update(deltaTime: number, enemies: EnemyManager, grid: SpatialGrid, projectiles: ProjectileManager): void {
    this.cooldown -= deltaTime;
    if (this.cooldown > 0 || !this.hasAim) return;

    const target = this.findPriorityTarget(enemies, grid);
    if (target < 0) return;
    const directionX = enemies.x[target] - this.x;
    const directionY = enemies.y[target] - this.y;
    projectiles.fireDirection(this.x, this.y, directionX, directionY, this.damage, this.projectileSpeed, this.penetration, this.rangeValue);
    this.cooldown = this.cooldownDuration / this.towerSpeedMultiplier;
  }

  reset(): void {
    this.cooldown = 0;
    this.damage = 180 * this.towerDamageMultiplier;
    this.cooldownDuration = 1.8;
    this.projectileSpeed = 720;
    this.rangeValue = 820;
    this.penetration = 1;
    this.targeting.maxDistance = this.rangeValue;
    this.targeting.distance = this.rangeValue;
  }

  applyUpgrade(id: string): void {
    if (id === 'sniperDamage') this.damage *= 1.35;
    if (id === 'sniperSpeed') this.cooldownDuration *= 0.8;
    if (id === 'sniperRange') { this.rangeValue *= 1.2; this.targeting.maxDistance = this.rangeValue; this.targeting.distance = this.rangeValue; }
    if (id === 'sniperPiercing') this.penetration++;
  }

  private findPriorityTarget(enemies: EnemyManager, grid: SpatialGrid): number {
    const count = grid.collectInRange(this.x, this.y, this.rangeValue, enemies, 100);
    let bestTarget = -1;
    let bestPriority = Number.NEGATIVE_INFINITY;
    for (let index = 0; index < count; index++) {
      const candidate = grid.resultAt(index);
      if (!this.isInFixedCone(enemies.x[candidate], enemies.y[candidate], this.rangeValue)) continue;
      const priority = (enemies.type[candidate] === EnemyType.Boss ? 2_000_000 : 0) + (enemies.elite[candidate] > 0 ? 1_000_000 : 0) + enemies.y[candidate];
      if (priority > bestPriority) { bestPriority = priority; bestTarget = candidate; }
    }
    return bestTarget;
  }
}