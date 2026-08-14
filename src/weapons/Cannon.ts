import { EnemyManager } from '../enemies/EnemyManager';
import { SpatialGrid } from '../systems/SpatialGrid';

export class Cannon {
  readonly x: number;
  readonly y: number;
  private cooldown = 1.8;
  private cooldownDuration = 1.8;
  private damage = 32;
  private radius = 70;
  private clusterShells = false;
  private doubleBarrel = false;
  private carpetBombardment = false;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  update(deltaTime: number, enemies: EnemyManager, grid: SpatialGrid, onKill: (reward: number) => void): void {
    this.cooldown -= deltaTime;
    if (this.cooldown > 0) return;
    const target = grid.findClosestInRange(this.x, this.y, 620, enemies);
    if (target < 0) return;
    this.impact(enemies.x[target], enemies.y[target], this.damage, this.radius, enemies, grid, onKill);
    if (this.clusterShells || this.carpetBombardment) {
      this.impact(enemies.x[target] + 42, enemies.y[target] - 28, this.damage * 0.6, this.radius * 0.62, enemies, grid, onKill);
      this.impact(enemies.x[target] - 38, enemies.y[target] + 26, this.damage * 0.6, this.radius * 0.62, enemies, grid, onKill);
    }
    if (this.doubleBarrel) this.impact(enemies.x[target] + 26, enemies.y[target] + 18, this.damage, this.radius, enemies, grid, onKill);
    if (this.carpetBombardment) this.impact(enemies.x[target] - 70, enemies.y[target] - 45, this.damage * 0.7, this.radius * 0.8, enemies, grid, onKill);
    this.cooldown = this.cooldownDuration;
  }

  reset(): void {
    this.cooldown = 1.8;
    this.cooldownDuration = 1.8;
    this.damage = 32;
    this.radius = 70;
    this.clusterShells = false;
    this.doubleBarrel = false;
    this.carpetBombardment = false;
  }

  applyUpgrade(id: string): void {
    if (id === 'cannonDamage') this.damage *= 1.25;
    else if (id === 'cannonRadius') this.radius *= 1.25;
    else if (id === 'cannonSpeed') this.cooldownDuration *= 0.8;
    else if (id === 'clusterShells') this.clusterShells = true;
    else if (id === 'doubleBarrel') this.doubleBarrel = true;
    else if (id === 'carpetBombardment') this.carpetBombardment = true;
  }

  private impact(x: number, y: number, damage: number, radius: number, enemies: EnemyManager, grid: SpatialGrid, onKill: (reward: number) => void): void {
    const count = grid.collectInRange(x, y, radius, enemies, 96);
    for (let index = 0; index < count; index++) {
      const reward = enemies.damage(grid.resultAt(index), damage);
      if (reward > 0) onKill(reward);
    }
  }
}
