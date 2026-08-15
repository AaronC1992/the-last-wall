import { EnemyManager } from '../enemies/EnemyManager';
import { SpatialGrid } from '../systems/SpatialGrid';

export abstract class TowerBase {
  x: number;
  y: number;
  aimX = 0;
  aimY = 0;
  hasAim = false;
  facing = -Math.PI / 2;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  abstract get range(): number;

  moveTo(x: number, y: number): void {
    if (this.hasAim) {
      const offsetX = this.aimX - this.x;
      const offsetY = this.aimY - this.y;
      this.aimX = x + offsetX;
      this.aimY = y + offsetY;
    }
    this.x = x;
    this.y = y;
  }

  setAim(x: number, y: number): void {
    const deltaX = x - this.x;
    const deltaY = y - this.y;
    const distance = Math.hypot(deltaX, deltaY) || 1;
    const clamped = Math.min(distance, this.range);
    this.aimX = this.x + (deltaX / distance) * clamped;
    this.aimY = this.y + (deltaY / distance) * clamped;
    this.hasAim = true;
    this.facing = Math.atan2(deltaY, deltaX);
  }

  clearAim(): void {
    this.hasAim = false;
  }

  /** Prefers enemies near the player set aim point, falling back to nearest in range. */
  protected acquire(enemies: EnemyManager, grid: SpatialGrid): number {
    const range = this.range;
    if (this.hasAim) {
      const preferred = grid.findClosestInRange(this.aimX, this.aimY, range * 0.5, enemies);
      if (preferred >= 0) {
        const deltaX = enemies.x[preferred] - this.x;
        const deltaY = enemies.y[preferred] - this.y;
        if (deltaX * deltaX + deltaY * deltaY <= range * range) return this.face(enemies, preferred);
      }
    }
    const target = grid.findClosestInRange(this.x, this.y, range, enemies);
    return target < 0 ? target : this.face(enemies, target);
  }

  private face(enemies: EnemyManager, index: number): number {
    this.facing = Math.atan2(enemies.y[index] - this.y, enemies.x[index] - this.x);
    return index;
  }
}
