import { TUNING } from '../core/Constants';
import { EnemyManager } from '../enemies/EnemyManager';
import { SpatialGrid } from '../systems/SpatialGrid';

export class ProjectileManager {
  private readonly capacity = TUNING.maxProjectiles;
  readonly x = new Float32Array(this.capacity);
  readonly y = new Float32Array(this.capacity);
  private readonly velocityX = new Float32Array(this.capacity);
  private readonly velocityY = new Float32Array(this.capacity);
  private readonly damage = new Float32Array(this.capacity);
  private readonly life = new Float32Array(this.capacity);
  count = 0;

  fire(originX: number, originY: number, targetX: number, targetY: number, damage: number, speed: number): void {
    if (this.count >= this.capacity) return;
    const deltaX = targetX - originX;
    const deltaY = targetY - originY;
    const length = Math.hypot(deltaX, deltaY) || 1;
    const index = this.count++;
    this.x[index] = originX;
    this.y[index] = originY;
    this.velocityX[index] = (deltaX / length) * speed;
    this.velocityY[index] = (deltaY / length) * speed;
    this.damage[index] = damage;
    this.life[index] = TUNING.projectileLifetime;
  }

  update(deltaTime: number, enemies: EnemyManager, grid: SpatialGrid, onKill: (reward: number) => void): void {
    let index = 0;
    while (index < this.count) {
      this.x[index] += this.velocityX[index] * deltaTime;
      this.y[index] += this.velocityY[index] * deltaTime;
      this.life[index] -= deltaTime;
      const target = grid.findClosestInRange(this.x[index], this.y[index], 14, enemies);
      if (target >= 0) {
        const reward = enemies.damage(target, this.damage[index]);
        if (reward > 0) onKill(reward);
        this.remove(index);
        continue;
      }
      if (this.life[index] <= 0) {
        this.remove(index);
        continue;
      }
      index++;
    }
  }

  private remove(index: number): void {
    const lastIndex = --this.count;
    if (index === lastIndex) return;
    this.x[index] = this.x[lastIndex];
    this.y[index] = this.y[lastIndex];
    this.velocityX[index] = this.velocityX[lastIndex];
    this.velocityY[index] = this.velocityY[lastIndex];
    this.damage[index] = this.damage[lastIndex];
    this.life[index] = this.life[lastIndex];
  }
}
