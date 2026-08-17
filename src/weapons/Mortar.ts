import { EnemyManager } from '../enemies/EnemyManager';
import { SpatialGrid } from '../systems/SpatialGrid';
import { ProjectileManager } from './ProjectileManager';
import { TowerBase } from './TowerBase';

export class Mortar extends TowerBase {
  private cooldown = 0;
  private cooldownDuration = 2.6;
  private damage = 42;
  private blastRadius = 82;
  private flightTime = 0.72;
  private barrageCount = 1;

  constructor(x: number, y: number) {
    super(x, y, 'area', 460, 82);
  }

  update(deltaTime: number, _enemies: EnemyManager, _grid: SpatialGrid, projectiles: ProjectileManager): void {
    this.cooldown -= deltaTime;
    if (this.cooldown > 0 || !this.hasAim) return;
    const scatter = this.targeting.radius * 0.18;
    for (let index = 0; index < this.barrageCount; index++) projectiles.fireMortar(this.x, this.y, this.targeting.targetX + (Math.random() - 0.5) * scatter, this.targeting.targetY + (Math.random() - 0.5) * scatter, this.damage * (index === 0 ? 1 : 0.7), this.flightTime, this.blastRadius);
    this.cooldown = this.cooldownDuration;
  }

  reset(): void {
    this.cooldown = 0;
    this.cooldownDuration = 2.6 / this.towerSpeedMultiplier;
    this.damage = 42 * this.towerDamageMultiplier;
    this.blastRadius = 82;
    this.flightTime = 0.72;
    this.barrageCount = 1 + this.towerSpecialBonuses.mortarBarrage;
    this.targeting.maxDistance = 460 * this.towerRangeMultiplier;
    this.targeting.distance = this.targeting.maxDistance;
    this.targeting.radius = 82;
  }

}
