import { EnemyManager } from '../enemies/EnemyManager';
import { SpatialGrid } from '../systems/SpatialGrid';
import { TowerBase } from './TowerBase';

export class FireTower extends TowerBase {
  private cooldown = 0;
  private burnDamage = 11;
  private burnDuration = 3;
  private wildfire = false;

  constructor(x: number, y: number) {
    super(x, y, 'cone', 290, 0, 0.7);
  }

  update(deltaTime: number, enemies: EnemyManager, grid: SpatialGrid): void {
    this.cooldown -= deltaTime;
    if (this.cooldown > 0) return;
    if (!this.hasAim) return;
    const count = grid.collectInRange(this.x, this.y, this.targeting.distance, enemies, 80);
    for (let index = 0; index < count; index++) {
      const target = grid.resultAt(index);
      if (this.isInFixedCone(enemies.x[target], enemies.y[target])) enemies.applyBurn(target, this.burnDuration, this.burnDamage);
    }
    this.cooldown = 0.65;
  }

  reset(): void {
    this.cooldown = 0;
    this.burnDamage = 11; this.burnDuration = 3; this.targeting.maxDistance = 290; this.targeting.distance = 290; this.targeting.coneAngle = 0.7;
    this.wildfire = false;
  }

  applyUpgrade(id: string): void { if (id === 'fireDamage') this.burnDamage *= 1.3; if (id === 'fireDuration') this.burnDuration += 1; if (id === 'fireRadius') { this.targeting.maxDistance *= 1.2; this.targeting.distance = this.targeting.maxDistance; } if (id === 'fireCone') this.targeting.coneAngle += 0.18; if (id === 'fireSpread') this.wildfire = true; if (id === 'hellfire') { this.burnDamage *= 2; this.targeting.maxDistance *= 1.5; this.targeting.distance = this.targeting.maxDistance; this.targeting.coneAngle += 0.2; this.wildfire = true; } }

  spreadFromDeath(x: number, y: number, enemies: EnemyManager, grid: SpatialGrid): void {
    if (!this.wildfire) return;
    const count = grid.collectInRange(x, y, 78, enemies, 6);
    for (let index = 0; index < count; index++) enemies.applyBurn(grid.resultAt(index), this.burnDuration, this.burnDamage * 0.8);
  }
}
