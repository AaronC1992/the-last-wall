import { EnemyManager } from '../enemies/EnemyManager';
import { SpatialGrid } from './SpatialGrid';

export const AbilityId = {
  Meteor: 0,
  Artillery: 1,
  Dragon: 2,
  DeathBeam: 3,
  Apocalypse: 4,
} as const;

export type AbilityIdValue = (typeof AbilityId)[keyof typeof AbilityId];

const COOLDOWNS = [12, 18, 28, 22, 75] as const;
const EFFECT_CAPACITY = 96;
const STRIKE_CAPACITY = 18;

export class ChaosSystem {
  private readonly width: number;
  private readonly height: number;
  private readonly cooldowns = new Float32Array(5);
  private readonly effectX = new Float32Array(EFFECT_CAPACITY);
  private readonly effectY = new Float32Array(EFFECT_CAPACITY);
  private readonly effectRadius = new Float32Array(EFFECT_CAPACITY);
  private readonly effectTime = new Float32Array(EFFECT_CAPACITY);
  private readonly effectMaxTime = new Float32Array(EFFECT_CAPACITY);
  private readonly strikeX = new Float32Array(STRIKE_CAPACITY);
  private readonly strikeY = new Float32Array(STRIKE_CAPACITY);
  private readonly strikeTimer = new Float32Array(STRIKE_CAPACITY);
  private readonly strikeRadius = new Float32Array(STRIKE_CAPACITY);
  private readonly strikeDamage = new Float32Array(STRIKE_CAPACITY);
  private readonly strikeActive = new Uint8Array(STRIKE_CAPACITY);
  private readonly chainX = new Float32Array(42);
  private readonly chainY = new Float32Array(42);
  private dragonTime = 0;
  private dragonTick = 0;
  private chainBudget = 0;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  activate(id: AbilityIdValue, enemies: EnemyManager, grid: SpatialGrid, onKill: (reward: number) => void): boolean {
    if (this.cooldowns[id] > 0) return false;
    this.cooldowns[id] = COOLDOWNS[id];
    if (id === AbilityId.Meteor) this.queueTargetedStrike(enemies, grid, 0.55, 100, 110);
    if (id === AbilityId.Artillery) {
      for (let index = 0; index < 6; index++) this.queueTargetedStrike(enemies, grid, 0.18 + index * 0.18, 68, 58);
    }
    if (id === AbilityId.Dragon) {
      this.dragonTime = 3.6;
      this.dragonTick = 0;
    }
    if (id === AbilityId.DeathBeam) {
      this.damageArea(this.width / 2, this.height * 0.42, 640, 66, enemies, grid, onKill, false);
      this.addEffect(this.width / 2, this.height * 0.42, 650, 0.45);
    }
    if (id === AbilityId.Apocalypse) {
      this.queueStrike(this.width / 2, this.height * 0.42, 0.9, 760, 220);
      this.queueStrike(this.width * 0.24, this.height * 0.34, 0.45, 220, 100);
      this.queueStrike(this.width * 0.76, this.height * 0.34, 0.6, 220, 100);
    }
    return true;
  }

  update(deltaTime: number, enemies: EnemyManager, grid: SpatialGrid, onKill: (reward: number) => void): void {
    for (let index = 0; index < this.cooldowns.length; index++) this.cooldowns[index] = Math.max(0, this.cooldowns[index] - deltaTime);
    for (let index = 0; index < EFFECT_CAPACITY; index++) if (this.effectTime[index] > 0) this.effectTime[index] -= deltaTime;
    for (let index = 0; index < STRIKE_CAPACITY; index++) {
      if (this.strikeActive[index] === 0) continue;
      this.strikeTimer[index] -= deltaTime;
      if (this.strikeTimer[index] > 0) continue;
      this.damageArea(this.strikeX[index], this.strikeY[index], this.strikeRadius[index], this.strikeDamage[index], enemies, grid, onKill, true);
      this.addEffect(this.strikeX[index], this.strikeY[index], this.strikeRadius[index], 0.55);
      this.strikeActive[index] = 0;
    }
    if (this.dragonTime > 0) {
      this.dragonTime -= deltaTime;
      this.dragonTick -= deltaTime;
      if (this.dragonTick <= 0) {
        const progress = 1 - this.dragonTime / 3.6;
        this.damageArea(progress * (this.width + 180) - 90, this.height * 0.42, 125, 48, enemies, grid, onKill, false);
        this.dragonTick = 0.18;
      }
    }
  }

  render(context: CanvasRenderingContext2D): void {
    for (let index = 0; index < STRIKE_CAPACITY; index++) {
      if (this.strikeActive[index] === 0) continue;
      context.strokeStyle = '#f2c46d';
      context.lineWidth = 2;
      context.beginPath();
      context.arc(this.strikeX[index], this.strikeY[index], this.strikeRadius[index] * 0.35, 0, Math.PI * 2);
      context.stroke();
    }
    for (let index = 0; index < EFFECT_CAPACITY; index++) {
      if (this.effectTime[index] <= 0) continue;
      const progress = 1 - this.effectTime[index] / this.effectMaxTime[index];
      context.strokeStyle = `rgba(245, 164, 73, ${1 - progress})`;
      context.lineWidth = 5 * (1 - progress) + 1;
      context.beginPath();
      context.arc(this.effectX[index], this.effectY[index], this.effectRadius[index] * progress, 0, Math.PI * 2);
      context.stroke();
    }
    if (this.dragonTime > 0) {
      const progress = 1 - this.dragonTime / 3.6;
      const dragonX = progress * (this.width + 180) - 90;
      context.fillStyle = '#d65b3f';
      context.fillRect(dragonX - 28, this.height * 0.32 - 14, 56, 28);
      context.fillStyle = 'rgba(240, 127, 54, .48)';
      context.fillRect(dragonX + 25, this.height * 0.32 - 5, 125, 10);
    }
  }

  getCooldown(id: AbilityIdValue): number {
    return this.cooldowns[id];
  }

  get activeEffects(): number {
    let count = 0;
    for (let index = 0; index < EFFECT_CAPACITY; index++) if (this.effectTime[index] > 0) count++;
    return count;
  }

  reset(): void {
    this.cooldowns.fill(0);
    this.effectTime.fill(0);
    this.strikeActive.fill(0);
    this.dragonTime = 0;
  }

  private queueTargetedStrike(enemies: EnemyManager, grid: SpatialGrid, delay: number, radius: number, damage: number): void {
    const target = grid.findClosestInRange(this.width / 2, this.height * 0.42, 900, enemies);
    if (target >= 0) {
      this.queueStrike(enemies.x[target], enemies.y[target], delay, radius, damage);
      return;
    }
    this.queueStrike(this.width / 2, this.height * 0.42, delay, radius, damage);
  }

  private queueStrike(x: number, y: number, delay: number, radius: number, damage: number): void {
    for (let index = 0; index < STRIKE_CAPACITY; index++) {
      if (this.strikeActive[index] !== 0) continue;
      this.strikeX[index] = x;
      this.strikeY[index] = y;
      this.strikeTimer[index] = delay;
      this.strikeRadius[index] = radius;
      this.strikeDamage[index] = damage;
      this.strikeActive[index] = 1;
      return;
    }
  }

  private damageArea(x: number, y: number, radius: number, damage: number, enemies: EnemyManager, grid: SpatialGrid, onKill: (reward: number) => void, chain: boolean): void {
    const count = grid.collectInRange(x, y, radius, enemies, 320);
    this.chainBudget = chain ? 42 : 0;
    let queuedChains = 0;
    for (let index = 0; index < count; index++) {
      const target = grid.resultAt(index);
      const reward = enemies.damage(target, damage);
      if (reward <= 0) continue;
      onKill(reward);
      if (this.chainBudget > 0) {
        this.chainBudget--;
        this.chainX[queuedChains] = enemies.x[target];
        this.chainY[queuedChains] = enemies.y[target];
        queuedChains++;
        this.addEffect(enemies.x[target], enemies.y[target], 42, 0.3);
      }
    }
    for (let chainIndex = 0; chainIndex < queuedChains; chainIndex++) {
      const nearby = grid.collectInRange(this.chainX[chainIndex], this.chainY[chainIndex], 42, enemies, 64);
      for (let targetIndex = 0; targetIndex < nearby; targetIndex++) {
        const target = grid.resultAt(targetIndex);
        const reward = enemies.damage(target, damage * 0.42);
        if (reward > 0) onKill(reward);
      }
    }
  }

  private addEffect(x: number, y: number, radius: number, duration: number): void {
    for (let index = 0; index < EFFECT_CAPACITY; index++) {
      if (this.effectTime[index] > 0) continue;
      this.effectX[index] = x;
      this.effectY[index] = y;
      this.effectRadius[index] = radius;
      this.effectTime[index] = duration;
      this.effectMaxTime[index] = duration;
      return;
    }
  }
}
