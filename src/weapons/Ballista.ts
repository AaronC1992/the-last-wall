import { TUNING } from '../core/Constants';
import { EnemyManager } from '../enemies/EnemyManager';
import { ProjectileManager } from './ProjectileManager';
import { SpatialGrid } from '../systems/SpatialGrid';
import type { UpgradeKind } from '../systems/UpgradeDefinitions';
import { TowerBase } from './TowerBase';

export class Ballista extends TowerBase {
  private cooldown = 0;
  private damage: number = TUNING.ballistaDamage;
  private cooldownDuration: number = TUNING.ballistaCooldown;
  private rangeValue = TUNING.ballistaRange;
  private projectileSpeed = TUNING.projectileSpeed;
  private projectileCount = 1;
  private criticalChance = 0;
  private criticalDamage = 2;
  private penetration = 0;
  private permanentDamageMultiplier = 1;
  private permanentSpeedMultiplier = 1;

  constructor(x: number, y: number) {
    super(x, y, 'line', TUNING.ballistaRange);
  }

  get range(): number {
    return this.rangeValue;
  }

  update(deltaTime: number, _enemies: EnemyManager, _grid: SpatialGrid, projectiles: ProjectileManager): void {
    this.cooldown -= deltaTime;
    if (this.cooldown > 0) return;
    if (!this.hasAim) return;
    for (let index = 0; index < this.projectileCount; index++) {
      const spread = (index - (this.projectileCount - 1) / 2) * 0.035;
      const critical = Math.random() < this.criticalChance;
      projectiles.fireDirection(this.x, this.y, Math.cos(this.targeting.angle + spread), Math.sin(this.targeting.angle + spread), critical ? this.damage * this.criticalDamage : this.damage, this.projectileSpeed, this.penetration, this.targeting.distance);
    }
    this.cooldown = this.cooldownDuration;
  }

  applyUpgrade(kind: UpgradeKind): void {
    if (kind === 'damage') this.damage *= 1.25;
    if (kind === 'attackSpeed') this.cooldownDuration *= 0.8;
    if (kind === 'range') { this.rangeValue *= 1.2; this.targeting.maxDistance = this.rangeValue; this.targeting.distance = this.rangeValue; }
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
    this.rangeValue = TUNING.ballistaRange;
    this.targeting.maxDistance = this.rangeValue;
    this.targeting.distance = this.rangeValue;
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
