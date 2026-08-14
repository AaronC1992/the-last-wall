import { TUNING } from '../core/Constants';
import { ENEMY_DATA } from './EnemyData';
import { EnemyType } from './EnemyTypes';
import type { EnemyTypeId } from './EnemyTypes';

export class EnemyManager {
  readonly capacity = TUNING.maxEnemies;
  readonly x = new Float32Array(this.capacity);
  readonly y = new Float32Array(this.capacity);
  readonly hp = new Float32Array(this.capacity);
  readonly speed = new Float32Array(this.capacity);
  readonly drift = new Float32Array(this.capacity);
  readonly maxHp = new Float32Array(this.capacity);
  readonly armor = new Float32Array(this.capacity);
  readonly radius = new Float32Array(this.capacity);
  readonly reward = new Uint16Array(this.capacity);
  readonly wallDamage = new Float32Array(this.capacity);
  readonly burnTime = new Float32Array(this.capacity);
  readonly burnDps = new Float32Array(this.capacity);
  readonly stunTime = new Float32Array(this.capacity);
  readonly type = new Uint8Array(this.capacity);
  readonly elite = new Uint8Array(this.capacity);
  readonly active = new Uint8Array(this.capacity);
  count = 0;
  totalSpawned = 0;
  lastDamageDealt = 0;

  spawn(x: number, speedMultiplier = 1, hpMultiplier = 1, type: EnemyTypeId = EnemyType.Grunt, isElite = false): boolean {
    if (this.count >= this.capacity) return false;
    const index = this.count++;
    this.x[index] = x;
    this.y[index] = -TUNING.enemyRadius * 2;
    this.configure(index, x, speedMultiplier, hpMultiplier, type, isElite);
    return true;
  }

  spawnAt(x: number, y: number, speedMultiplier = 1, hpMultiplier = 1, type: EnemyTypeId = EnemyType.Grunt, isElite = false): boolean {
    if (this.count >= this.capacity) return false;
    const index = this.count++;
    this.y[index] = y;
    this.configure(index, x, speedMultiplier, hpMultiplier, type, isElite);
    return true;
  }

  update(deltaTime: number, width: number, wallY: number, onWallHit: (damage: number) => void, onDeath: (reward: number, index: number, burning: boolean) => void = () => undefined): void {
    for (let index = 0; index < this.count; index++) {
      if (this.active[index] === 0) continue;
      if (this.burnTime[index] > 0) {
        this.burnTime[index] -= deltaTime;
        const reward = this.damage(index, this.burnDps[index] * deltaTime);
        if (reward > 0) {
          onDeath(reward, index, true);
          continue;
        }
      }
      this.stunTime[index] = Math.max(0, this.stunTime[index] - deltaTime);
      if (this.stunTime[index] > 0) continue;
      this.y[index] += this.speed[index] * deltaTime;
      this.x[index] += this.drift[index] * deltaTime;
      if (this.x[index] < TUNING.enemyRadius || this.x[index] > width - TUNING.enemyRadius) this.drift[index] *= -1;
      if (this.y[index] >= wallY - this.radius[index]) {
        onWallHit(this.wallDamage[index]);
        this.active[index] = 0;
      }
    }
  }

  damage(index: number, damage: number): number {
    if (index < 0 || index >= this.count || this.active[index] === 0) { this.lastDamageDealt = 0; return 0; }
    this.lastDamageDealt = Math.max(1, damage - this.armor[index]);
    this.hp[index] -= this.lastDamageDealt;
    if (this.hp[index] > 0) return 0;
    this.active[index] = 0;
    return this.reward[index];
  }

  applyBurn(index: number, duration: number, damagePerSecond: number): void {
    if (index < 0 || index >= this.count || this.active[index] === 0) return;
    this.burnTime[index] = Math.max(this.burnTime[index], duration);
    this.burnDps[index] = Math.max(this.burnDps[index], damagePerSecond);
  }

  stun(index: number, duration: number): void {
    if (index < 0 || index >= this.count || this.active[index] === 0) return;
    this.stunTime[index] = Math.max(this.stunTime[index], duration);
  }

  compact(): void {
    let writeIndex = 0;
    for (let readIndex = 0; readIndex < this.count; readIndex++) {
      if (this.active[readIndex] === 0) continue;
      if (writeIndex !== readIndex) {
        this.x[writeIndex] = this.x[readIndex];
        this.y[writeIndex] = this.y[readIndex];
        this.hp[writeIndex] = this.hp[readIndex];
        this.speed[writeIndex] = this.speed[readIndex];
        this.drift[writeIndex] = this.drift[readIndex];
        this.maxHp[writeIndex] = this.maxHp[readIndex];
        this.armor[writeIndex] = this.armor[readIndex];
        this.radius[writeIndex] = this.radius[readIndex];
        this.reward[writeIndex] = this.reward[readIndex];
        this.wallDamage[writeIndex] = this.wallDamage[readIndex];
        this.burnTime[writeIndex] = this.burnTime[readIndex];
        this.burnDps[writeIndex] = this.burnDps[readIndex];
        this.stunTime[writeIndex] = this.stunTime[readIndex];
        this.type[writeIndex] = this.type[readIndex];
        this.elite[writeIndex] = this.elite[readIndex];
        this.active[writeIndex] = 1;
      }
      writeIndex++;
    }
    this.count = writeIndex;
  }

  clear(): void {
    this.count = 0;
  }

  private configure(index: number, x: number, speedMultiplier: number, hpMultiplier: number, type: EnemyTypeId, isElite: boolean): void {
    const definition = ENEMY_DATA[type];
    const eliteMultiplier = isElite ? 2.5 : 1;
    this.maxHp[index] = definition.hp * hpMultiplier * eliteMultiplier;
    this.hp[index] = this.maxHp[index];
    this.speed[index] = definition.speed * speedMultiplier * (isElite ? 1.12 : 1);
    this.drift[index] = (Math.random() - 0.5) * 18;
    this.x[index] = x;
    this.armor[index] = definition.armor + (isElite ? 2 : 0);
    this.radius[index] = definition.radius * (isElite ? 1.25 : 1);
    this.reward[index] = definition.reward * (isElite ? 3 : 1);
    this.wallDamage[index] = definition.wallDamage * (isElite ? 1.5 : 1);
    this.burnTime[index] = 0;
    this.burnDps[index] = 0;
    this.stunTime[index] = 0;
    this.type[index] = type;
    this.elite[index] = isElite ? 1 : 0;
    this.active[index] = 1;
    this.totalSpawned++;
  }
}
