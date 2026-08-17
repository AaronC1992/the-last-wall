import { EnemyManager } from '../enemies/EnemyManager';
import { SpatialGrid } from '../systems/SpatialGrid';
import { TowerBase } from './TowerBase';
import { ProjectileManager } from './ProjectileManager';

export class Cannon extends TowerBase {
  private cooldown = 1.8;
  private cooldownDuration = 1.8;
  private damage = 32;
  private radius = 70;
  private clusterShells = false;
  private doubleBarrel = false;
  private carpetBombardment = false;

  constructor(x: number, y: number) {
    super(x, y, 'line', 620);
  }

  get range(): number {
    return this.targeting.maxDistance;
  }

  isPointThreatened(x: number, y: number, cellPadding = 0): boolean {
    return super.isPointThreatened(x, y, cellPadding) || Math.hypot(x - this.aimX, y - this.aimY) <= this.radius + cellPadding;
  }

  threatAtPoint(x: number, y: number, cellPadding = 0): number {
    const blastRadius = this.radius + cellPadding;
    if (Math.hypot(x - this.aimX, y - this.aimY) <= blastRadius) return this.getThreatStrength() * 2.2;
    return super.threatAtPoint(x, y, cellPadding);
  }

  getThreatStrength(): number {
    const specialMultiplier = 1 + (this.towerSpecialBonuses.clusterShells ? 0.45 : 0) + (this.towerSpecialBonuses.doubleBarrel ? 0.8 : 0) + (this.towerSpecialBonuses.carpetBombardment ? 1.1 : 0);
    return super.getThreatStrength() * specialMultiplier;
  }

  update(deltaTime: number, _enemies: EnemyManager, _grid: SpatialGrid, _onKill: (reward: number) => void, projectiles: ProjectileManager): void {
    this.cooldown -= deltaTime;
    if (this.cooldown > 0) return;
    if (!this.hasAim) return;
    const direction = this.direction();
    projectiles.fireShell(this.x, this.y, direction.x, direction.y, this.damage, 340, this.targeting.distance, this.radius);
    if (this.clusterShells) projectiles.fireShell(this.x, this.y, direction.x, direction.y, this.damage * 0.6, 340, Math.max(30, this.targeting.distance - 42), this.radius * 0.62);
    if (this.carpetBombardment) {
      projectiles.fireShell(this.x, this.y, direction.x, direction.y, this.damage * 0.65, 340, Math.max(30, this.targeting.distance - 84), this.radius * 0.7);
      projectiles.fireShell(this.x, this.y, direction.x, direction.y, this.damage * 0.65, 340, Math.min(this.targeting.maxDistance, this.targeting.distance + 52), this.radius * 0.7);
    }
    if (this.doubleBarrel) projectiles.fireShell(this.x, this.y, direction.x, direction.y, this.damage, 340, Math.min(this.targeting.maxDistance, this.targeting.distance + 26), this.radius);
    this.cooldown = this.cooldownDuration;
  }

  reset(): void {
    this.cooldown = 1.8;
    this.cooldownDuration = 1.8 / this.towerSpeedMultiplier;
    this.damage = 32 * this.towerDamageMultiplier;
    this.radius = 70;
    this.clusterShells = this.towerSpecialBonuses.clusterShells;
    this.doubleBarrel = this.towerSpecialBonuses.doubleBarrel;
    this.carpetBombardment = this.towerSpecialBonuses.carpetBombardment;
    this.targeting.maxDistance = 620 * this.towerRangeMultiplier;
    this.targeting.distance = this.targeting.maxDistance;
  }

}
