import { EnemyManager } from '../enemies/EnemyManager';
import { SpatialGrid } from '../systems/SpatialGrid';

export class FireTower {
  readonly x: number;
  readonly y: number;
  private cooldown = 0;
  private radius = 58;
  private burnDamage = 11;
  private burnDuration = 3;
  private wildfire = false;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  update(deltaTime: number, enemies: EnemyManager, grid: SpatialGrid): void {
    this.cooldown -= deltaTime;
    if (this.cooldown > 0) return;
    const target = grid.findClosestInRange(this.x, this.y, 290, enemies);
    if (target < 0) return;
    const count = grid.collectInRange(enemies.x[target], enemies.y[target], this.radius, enemies, 40);
    for (let index = 0; index < count; index++) enemies.applyBurn(grid.resultAt(index), this.burnDuration, this.burnDamage);
    this.cooldown = 0.65;
  }

  reset(): void {
    this.cooldown = 0;
    this.radius = 58; this.burnDamage = 11; this.burnDuration = 3;
    this.wildfire = false;
  }

  applyUpgrade(id: string): void { if (id === 'fireDamage') this.burnDamage *= 1.3; if (id === 'fireDuration') this.burnDuration += 1; if (id === 'fireRadius') this.radius *= 1.25; if (id === 'fireSpread') this.wildfire = true; if (id === 'hellfire') { this.burnDamage *= 2; this.radius *= 1.5; this.wildfire = true; } }

  spreadFromDeath(x: number, y: number, enemies: EnemyManager, grid: SpatialGrid): void {
    if (!this.wildfire) return;
    const count = grid.collectInRange(x, y, 78, enemies, 6);
    for (let index = 0; index < count; index++) enemies.applyBurn(grid.resultAt(index), this.burnDuration, this.burnDamage * 0.8);
  }
}
