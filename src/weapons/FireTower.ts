import { EnemyManager } from '../enemies/EnemyManager';
import { SpatialGrid } from '../systems/SpatialGrid';
import { TowerBase } from './TowerBase';

export class FireTower extends TowerBase {
  private tickTimer = 0;
  private burnDamage = 9;
  private burnDuration = 2.5;
  private wildfire = false;
  isFiring = false;

  constructor(x: number, y: number) {
    super(x, y, 'cone', 125, 0, 0.6);
  }

  update(deltaTime: number, enemies: EnemyManager, grid: SpatialGrid): void {
    if (!this.hasAim) {
      this.isFiring = false;
      return;
    }
    this.isFiring = true;
    this.tickTimer += deltaTime;
    if (this.tickTimer < 0.12 / this.towerSpeedMultiplier) return;
    this.tickTimer = 0;
    const count = grid.collectInRange(this.x, this.y, this.targeting.maxDistance, enemies, 80);
    for (let index = 0; index < count; index++) {
      const target = grid.resultAt(index);
      if (this.isInFixedCone(enemies.x[target], enemies.y[target], this.targeting.maxDistance)) enemies.applyBurn(target, this.burnDuration, this.burnDamage);
    }
  }

  reset(): void {
    this.tickTimer = 0;
    this.isFiring = false;
    this.burnDamage = 9 * this.towerDamageMultiplier; this.burnDuration = 2.5; this.targeting.maxDistance = 125; this.targeting.distance = 125; this.targeting.coneAngle = 0.6;
    this.wildfire = false;
  }

  spreadFromDeath(x: number, y: number, enemies: EnemyManager, grid: SpatialGrid): void {
    if (!this.wildfire) return;
    const count = grid.collectInRange(x, y, 78, enemies, 6);
    for (let index = 0; index < count; index++) enemies.applyBurn(grid.resultAt(index), this.burnDuration + 1, this.burnDamage);
  }
}
