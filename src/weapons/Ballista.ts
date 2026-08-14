import { TUNING } from '../core/Constants';
import { EnemyManager } from '../enemies/EnemyManager';
import { ProjectileManager } from './ProjectileManager';
import { SpatialGrid } from '../systems/SpatialGrid';
import type { UpgradeKind } from '../systems/UpgradeDefinitions';

export class Ballista {
  readonly x: number;
  readonly y: number;
  private cooldown = 0;
  private damage: number = TUNING.ballistaDamage;
  private cooldownDuration: number = TUNING.ballistaCooldown;
  private range = TUNING.ballistaRange;
  private projectileSpeed = TUNING.projectileSpeed;
  private projectileCount = 1;
  private criticalChance = 0;
  private criticalDamage = 2;
  private penetration = 0;
  private permanentDamageMultiplier = 1;
  private permanentSpeedMultiplier = 1;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  update(deltaTime: number, enemies: EnemyManager, grid: SpatialGrid, projectiles: ProjectileManager): void {
    this.cooldown -= deltaTime;
    if (this.cooldown > 0) return;
    const target = grid.findClosestInRange(this.x, this.y, this.range, enemies);
    if (target < 0) return;
    for (let index = 0; index < this.projectileCount; index++) {
      const spread = (index - (this.projectileCount - 1) / 2) * 13;
      const critical = Math.random() < this.criticalChance;
      projectiles.fire(this.x, this.y, enemies.x[target] + spread, enemies.y[target], critical ? this.damage * this.criticalDamage : this.damage, this.projectileSpeed, this.penetration);
    }
    this.cooldown = this.cooldownDuration;
  }

  applyUpgrade(kind: UpgradeKind): void {
    if (kind === 'damage') this.damage *= 1.25;
    if (kind === 'attackSpeed') this.cooldownDuration *= 0.8;
    if (kind === 'range') this.range *= 1.2;
    if (kind === 'projectiles') this.projectileCount++;
    if (kind === 'criticalChance') this.criticalChance = Math.min(0.9, this.criticalChance + 0.12);
    if (kind === 'criticalDamage') this.criticalDamage += 0.5;
    if (kind === 'penetration') this.penetration++;
    if (kind === 'projectileSpeed') this.projectileSpeed *= 1.35;
    if (kind === 'boltStorm') { this.projectileCount += 8; this.cooldownDuration *= 0.5; this.penetration += 5; }
  }

  reset(): void {
    this.cooldown = 0;
    this.damage = TUNING.ballistaDamage * this.permanentDamageMultiplier;
    this.cooldownDuration = TUNING.ballistaCooldown / this.permanentSpeedMultiplier;
    this.range = TUNING.ballistaRange;
    this.projectileSpeed = TUNING.projectileSpeed;
    this.projectileCount = 1;
    this.criticalChance = 0;
    this.criticalDamage = 2;
    this.penetration = 0;
  }

  setPermanentBonuses(damageMultiplier: number, speedMultiplier: number): void {
    this.permanentDamageMultiplier = damageMultiplier;
    this.permanentSpeedMultiplier = speedMultiplier;
    this.reset();
  }
}
