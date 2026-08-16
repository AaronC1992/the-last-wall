import { TUNING } from '../core/Constants';
import { EnemyManager } from '../enemies/EnemyManager';
import { SpatialGrid } from '../systems/SpatialGrid';
import type { TerrainGrid } from '../map/TerrainGrid';

export class ProjectileManager {
  private readonly capacity = TUNING.maxProjectiles;
  readonly x = new Float32Array(this.capacity);
  readonly y = new Float32Array(this.capacity);
  readonly originX = new Float32Array(this.capacity);
  readonly originY = new Float32Array(this.capacity);
  readonly targetX = new Float32Array(this.capacity);
  readonly targetY = new Float32Array(this.capacity);
  readonly life = new Float32Array(this.capacity);
  readonly flight = new Float32Array(this.capacity);
  readonly impactRadius = new Float32Array(this.capacity);
  readonly mode = new Uint8Array(this.capacity);
  private readonly velocityX = new Float32Array(this.capacity);
  private readonly velocityY = new Float32Array(this.capacity);
  private readonly damage = new Float32Array(this.capacity);
  private readonly penetration = new Uint8Array(this.capacity);
  private readonly traveled = new Float32Array(this.capacity);
  private readonly maxDistance = new Float32Array(this.capacity);
  count = 0;
  droppedProjectiles = 0;

  fire(originX: number, originY: number, targetX: number, targetY: number, damage: number, speed: number, penetration = 0): void {
    this.fireDirection(originX, originY, targetX - originX, targetY - originY, damage, speed, penetration, Math.hypot(targetX - originX, targetY - originY));
  }

  fireDirection(originX: number, originY: number, directionX: number, directionY: number, damage: number, speed: number, penetration = 0, maxDistance = 900): void {
    if (this.count >= this.capacity) { this.droppedProjectiles++; return; }
    const length = Math.hypot(directionX, directionY) || 1;
    const index = this.count++;
    this.originX[index] = originX;
    this.originY[index] = originY;
    this.x[index] = originX;
    this.y[index] = originY;
    this.velocityX[index] = (directionX / length) * speed;
    this.velocityY[index] = (directionY / length) * speed;
    this.damage[index] = damage;
    this.life[index] = TUNING.projectileLifetime;
    this.penetration[index] = penetration;
    this.mode[index] = 0;
    this.traveled[index] = 0;
    this.maxDistance[index] = maxDistance;
  }

  fireShell(originX: number, originY: number, directionX: number, directionY: number, damage: number, speed: number, maxDistance: number, radius: number): void {
    this.fireDirection(originX, originY, directionX, directionY, damage, speed, 0, maxDistance);
    const index = this.count - 1;
    if (index >= 0) { this.mode[index] = 1; this.impactRadius[index] = radius; }
  }

  fireMortar(originX: number, originY: number, targetX: number, targetY: number, damage: number, flightTime: number, radius: number): void {
    if (this.count >= this.capacity) { this.droppedProjectiles++; return; }
    const index = this.count++;
    this.originX[index] = originX;
    this.originY[index] = originY;
    this.x[index] = originX;
    this.y[index] = originY;
    this.targetX[index] = targetX;
    this.targetY[index] = targetY;
    this.damage[index] = damage;
    this.impactRadius[index] = radius;
    this.flight[index] = flightTime;
    this.life[index] = flightTime;
    this.mode[index] = 2;
  }

  update(deltaTime: number, enemies: EnemyManager, grid: SpatialGrid, onKill: (reward: number) => void, onDamage: (x: number, y: number, damage: number) => void, onExplosion: (x: number, y: number, damage: number, radius: number) => void = () => undefined, terrain?: TerrainGrid): void {
    let index = 0;
    while (index < this.count) {
      if (this.mode[index] === 2) {
        this.life[index] -= deltaTime;
        const totalFlight = Math.max(0.001, this.flight[index]);
        const progress = Math.min(1, Math.max(0, 1 - this.life[index] / totalFlight));
        const previousX = this.x[index];
        const previousY = this.y[index];
        this.x[index] = this.originX[index] + (this.targetX[index] - this.originX[index]) * progress;
        this.y[index] = this.originY[index] + (this.targetY[index] - this.originY[index]) * progress;
        if (terrain?.segmentHitsBuildable(previousX, previousY, this.x[index], this.y[index])) { this.remove(index); continue; }
        if (this.life[index] <= 0) { onExplosion(this.targetX[index], this.targetY[index], this.damage[index], this.impactRadius[index]); this.remove(index); continue; }
        index++;
        continue;
      }
      const previousX = this.x[index];
      const previousY = this.y[index];
      const nextX = previousX + this.velocityX[index] * deltaTime;
      const nextY = previousY + this.velocityY[index] * deltaTime;
      if (terrain?.segmentHitsBuildable(previousX, previousY, nextX, nextY)) { this.remove(index); continue; }
      this.x[index] = nextX;
      this.y[index] = nextY;
      this.traveled[index] += Math.hypot(this.velocityX[index], this.velocityY[index]) * deltaTime;
      this.life[index] -= deltaTime;
      if (this.mode[index] === 1 && this.traveled[index] >= this.maxDistance[index]) { onExplosion(this.x[index], this.y[index], this.damage[index], this.impactRadius[index]); this.remove(index); continue; }
      const target = this.mode[index] === 0 ? grid.findClosestInRange(this.x[index], this.y[index], 14, enemies) : -1;
      if (target >= 0) {
        const reward = enemies.damage(target, this.damage[index]);
        if (enemies.lastDamageDealt > 0) onDamage(enemies.x[target], enemies.y[target], enemies.lastDamageDealt);
        if (reward > 0) onKill(reward);
        if (this.mode[index] === 1) { onExplosion(this.x[index], this.y[index], this.damage[index], this.impactRadius[index]); this.remove(index); continue; }
        if (this.penetration[index] > 0) {
          this.penetration[index]--;
          this.x[index] += this.velocityX[index] * 0.025;
          this.y[index] += this.velocityY[index] * 0.025;
        } else {
          this.remove(index);
          continue;
        }
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
    this.originX[index] = this.originX[lastIndex];
    this.originY[index] = this.originY[lastIndex];
    this.velocityX[index] = this.velocityX[lastIndex];
    this.velocityY[index] = this.velocityY[lastIndex];
    this.damage[index] = this.damage[lastIndex];
    this.life[index] = this.life[lastIndex];
    this.penetration[index] = this.penetration[lastIndex];
    this.mode[index] = this.mode[lastIndex];
    this.traveled[index] = this.traveled[lastIndex];
    this.maxDistance[index] = this.maxDistance[lastIndex];
    this.impactRadius[index] = this.impactRadius[lastIndex];
    this.targetX[index] = this.targetX[lastIndex];
    this.targetY[index] = this.targetY[lastIndex];
    this.flight[index] = this.flight[lastIndex];
  }
}
