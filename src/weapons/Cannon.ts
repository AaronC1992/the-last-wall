import { EnemyManager } from '../enemies/EnemyManager';
import { SpatialGrid } from '../systems/SpatialGrid';
import { TowerBase } from './TowerBase';
import { ProjectileManager } from './ProjectileManager';

interface CannonBlastPoint {
  distance: number;
  radius: number;
  damageMultiplier: number;
}

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
    const direction = this.direction();
    for (const blast of this.getBlastPoints()) {
      const pointX = this.x + direction.x * blast.distance;
      const pointY = this.y + direction.y * blast.distance;
      if (Math.hypot(x - pointX, y - pointY) <= blast.radius + cellPadding) return this.getThreatStrength() * (1 + blast.damageMultiplier);
    }
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
    for (const blast of this.getBlastPoints()) projectiles.fireShell(this.x, this.y, direction.x, direction.y, this.damage * blast.damageMultiplier, 340, blast.distance, blast.radius);
    this.cooldown = this.cooldownDuration;
  }

  getBlastPoints(): readonly CannonBlastPoint[] {
    const points: CannonBlastPoint[] = [{ distance: this.targeting.distance, radius: this.radius, damageMultiplier: 1 }];
    if (this.clusterShells) points.push({ distance: Math.max(30, this.targeting.distance - 42), radius: this.radius * 0.62, damageMultiplier: 0.6 });
    if (this.carpetBombardment) {
      points.push({ distance: Math.max(30, this.targeting.distance - 84), radius: this.radius * 0.7, damageMultiplier: 0.65 });
      points.push({ distance: Math.min(this.targeting.maxDistance, this.targeting.distance + 52), radius: this.radius * 0.7, damageMultiplier: 0.65 });
    }
    if (this.doubleBarrel) points.push({ distance: Math.min(this.targeting.maxDistance, this.targeting.distance + 26), radius: this.radius, damageMultiplier: 1 });
    return points;
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
