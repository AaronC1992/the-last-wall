import { EnemyManager } from '../enemies/EnemyManager';
import { SpatialGrid } from './SpatialGrid';
import type { GraphicsQuality } from './SaveSystem';

export const AbilityId = {
  Meteor: 0,
  Artillery: 1,
  Dragon: 2,
  DeathBeam: 3,
  Apocalypse: 4,
} as const;

export type AbilityIdValue = (typeof AbilityId)[keyof typeof AbilityId];

const COOLDOWNS = [18, 28, 42, 36, 120] as const;
const EFFECT_CAPACITY = 96;
const STRIKE_CAPACITY = 24;
const PARTICLE_CAPACITY = 300;

export class ChaosSystem {
  private width: number;
  private height: number;
  private readonly cooldowns = new Float32Array(5);
  private cooldownMultiplier = 1;
  private damageMultiplier = 1;
  private readonly abilityDamageMultiplier = new Float32Array([1, 1, 1, 1, 1]);
  private readonly abilityRadiusMultiplier = new Float32Array([1, 1, 1, 1, 1]);
  private readonly abilityCooldownMultiplier = new Float32Array([1, 1, 1, 1, 1]);
  private gameTime = 0;

  // Effects (expanding shockwave rings)
  private readonly effectX = new Float32Array(EFFECT_CAPACITY);
  private readonly effectY = new Float32Array(EFFECT_CAPACITY);
  private readonly effectRadius = new Float32Array(EFFECT_CAPACITY);
  private readonly effectTime = new Float32Array(EFFECT_CAPACITY);
  private readonly effectMaxTime = new Float32Array(EFFECT_CAPACITY);

  // Strikes (Meteor & Artillery)
  private readonly strikeX = new Float32Array(STRIKE_CAPACITY);
  private readonly strikeY = new Float32Array(STRIKE_CAPACITY);
  private readonly strikeStartX = new Float32Array(STRIKE_CAPACITY);
  private readonly strikeStartY = new Float32Array(STRIKE_CAPACITY);
  private readonly strikeTimer = new Float32Array(STRIKE_CAPACITY);
  private readonly strikeMaxTimer = new Float32Array(STRIKE_CAPACITY);
  private readonly strikeRadius = new Float32Array(STRIKE_CAPACITY);
  private readonly strikeDamage = new Float32Array(STRIKE_CAPACITY);
  private readonly strikeActive = new Uint8Array(STRIKE_CAPACITY);
  private readonly strikeKind = new Uint8Array(STRIKE_CAPACITY); // 0: Meteor, 1: Artillery, 2: Apocalypse

  // Particles
  private readonly px = new Float32Array(PARTICLE_CAPACITY);
  private readonly py = new Float32Array(PARTICLE_CAPACITY);
  private readonly pvx = new Float32Array(PARTICLE_CAPACITY);
  private readonly pvy = new Float32Array(PARTICLE_CAPACITY);
  private readonly plife = new Float32Array(PARTICLE_CAPACITY);
  private readonly pmaxLife = new Float32Array(PARTICLE_CAPACITY);
  private readonly psize = new Float32Array(PARTICLE_CAPACITY);
  private readonly ptype = new Uint8Array(PARTICLE_CAPACITY); // 0: Fire, 1: Spark, 2: Smoke, 3: Plasma

  // Special abilities state
  private dragonTime = 0;
  private dragonMaxTime = 3.8;
  private dragonTick = 0;
  private dragonY = 0;
  private dragonFlightY = 0;
  private dragonDamageScale = 1;
  private dragonRadiusScale = 1;

  private deathBeamTime = 0;
  private deathBeamMaxTime = 0.9;
  private deathBeamX = 0;
  private deathBeamTick = 0;
  private deathBeamDamageScale = 1;
  private deathBeamRadiusScale = 1;

  private apocalypseTime = 0;

  private readonly chainX = new Float32Array(42);
  private readonly chainY = new Float32Array(42);
  private chainBudget = 0;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  setWorldBounds(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  activate(id: AbilityIdValue, enemies: EnemyManager, grid: SpatialGrid, onKill: (reward: number) => void, targetX = this.width / 2, targetY = this.height * 0.42): boolean {
    if (this.cooldowns[id] > 0) return false;
    this.cooldowns[id] = COOLDOWNS[id] * this.cooldownMultiplier * this.abilityCooldownMultiplier[id];
    const damageScale = this.abilityDamageMultiplier[id];
    const radiusScale = this.abilityRadiusMultiplier[id];

    if (id === AbilityId.Meteor) {
      this.queueTargetedStrike(enemies, grid, 0.65, 120 * radiusScale, 160 * damageScale, 0, targetX, targetY);
    } else if (id === AbilityId.Artillery) {
      for (let index = 0; index < 6; index++) {
        this.queueTargetedStrike(enemies, grid, 0.2 + index * 0.16, 75 * radiusScale, 65 * damageScale, 1, targetX, targetY);
      }
    } else if (id === AbilityId.Dragon) {
      this.dragonTime = this.dragonMaxTime;
      this.dragonTick = 0;
      this.dragonY = targetY;
      this.dragonDamageScale = damageScale;
      this.dragonRadiusScale = radiusScale;
      this.dragonFlightY = Math.max(70, Math.min(this.height - 120, targetY - 110));
    } else if (id === AbilityId.DeathBeam) {
      this.deathBeamTime = this.deathBeamMaxTime;
      this.deathBeamX = targetX;
      this.deathBeamDamageScale = damageScale;
      this.deathBeamRadiusScale = radiusScale;
      this.deathBeamTick = 0;
      this.damageArea(this.deathBeamX, targetY, 60 * radiusScale, 180 * damageScale, enemies, grid, onKill, false);
      this.addEffect(this.deathBeamX, targetY, 90 * radiusScale, 0.6);
    } else if (id === AbilityId.Apocalypse) {
      this.apocalypseTime = 3.0;
      const centerX = Math.max(120, Math.min(this.width - 120, targetX));
      const centerY = Math.max(120, Math.min(this.height - 120, targetY));
      const spreadX = this.width * 0.12;
      const spreadY = this.height * 0.1;
      this.queueStrike(centerX, centerY - spreadY * 0.4, 0.8, 220 * radiusScale, 300 * damageScale, 2);
      this.queueStrike(centerX - spreadX, centerY - spreadY, 1.2, 150 * radiusScale, 180 * damageScale, 2);
      this.queueStrike(centerX + spreadX, centerY - spreadY, 1.5, 150 * radiusScale, 180 * damageScale, 2);
      this.queueStrike(centerX - spreadX * 0.7, centerY + spreadY * 0.6, 1.9, 160 * radiusScale, 200 * damageScale, 2);
      this.queueStrike(centerX + spreadX * 0.7, centerY + spreadY * 0.6, 2.2, 160 * radiusScale, 200 * damageScale, 2);
    }

    return true;
  }

  update(deltaTime: number, enemies: EnemyManager, grid: SpatialGrid, onKill: (reward: number) => void, quality: GraphicsQuality = 'high', showAbilityEffects = true): void {
    this.gameTime += deltaTime;

    for (let index = 0; index < this.cooldowns.length; index++) {
      this.cooldowns[index] = Math.max(0, this.cooldowns[index] - deltaTime);
    }

    for (let index = 0; index < EFFECT_CAPACITY; index++) {
      if (this.effectTime[index] > 0) this.effectTime[index] -= deltaTime;
    }

    // Update Particles
    for (let index = 0; index < (quality === 'low' ? 0 : PARTICLE_CAPACITY); index++) {
      if (this.plife[index] <= 0) continue;
      this.plife[index] -= deltaTime;
      this.px[index] += this.pvx[index] * deltaTime;
      this.py[index] += this.pvy[index] * deltaTime;
    }

    // Update Strikes
    for (let index = 0; index < STRIKE_CAPACITY; index++) {
      if (this.strikeActive[index] === 0) continue;
      this.strikeTimer[index] -= deltaTime;

      const progress = 1 - Math.max(0, this.strikeTimer[index]) / this.strikeMaxTimer[index];
      const curX = this.strikeStartX[index] + (this.strikeX[index] - this.strikeStartX[index]) * progress;
      const curY = this.strikeStartY[index] + (this.strikeY[index] - this.strikeStartY[index]) * progress;

      // Spawn falling trail particles
      if (showAbilityEffects && quality !== 'low' && Math.random() < 0.6) {
        this.addParticle(curX + (Math.random() - 0.5) * 10, curY + (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 20, -30 - Math.random() * 30, 0.4, 8, 0);
        this.addParticle(curX, curY, (Math.random() - 0.5) * 15, (Math.random() - 0.5) * 15, 0.3, 4, 1);
      }

      if (this.strikeTimer[index] <= 0) {
        const tx = this.strikeX[index];
        const ty = this.strikeY[index];
        const rad = this.strikeRadius[index];

        this.damageArea(tx, ty, rad, this.strikeDamage[index], enemies, grid, onKill, true);
        this.addEffect(tx, ty, rad, 0.6);

        // Impact particle explosion
        for (let p = 0; p < 28; p++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 40 + Math.random() * 180;
          this.addParticle(tx, ty, Math.cos(angle) * speed, Math.sin(angle) * speed, 0.4 + Math.random() * 0.4, 5 + Math.random() * 10, p % 3 === 0 ? 1 : 0);
        }

        this.strikeActive[index] = 0;
      }
    }

    // Update Dragon
    if (this.dragonTime > 0) {
      this.dragonTime -= deltaTime;
      this.dragonTick -= deltaTime;

      const p = 1 - this.dragonTime / this.dragonMaxTime;
      const dx = p * (this.width + 240) - 120;
      const dy = this.dragonFlightY + Math.sin(p * Math.PI * 4) * 25;
      const groundY = this.dragonY;

      // Dragon breath particle stream
      for (let i = 0; showAbilityEffects && quality !== 'low' && i < 3; i++) {
        const angle = 0.6 + (Math.random() - 0.5) * 0.4;
        const speed = 250 + Math.random() * 120;
        this.addParticle(dx + 28, dy + 6, Math.cos(angle) * speed, Math.sin(angle) * speed, 0.35 + Math.random() * 0.25, 8 + Math.random() * 12, 0);
      }

      if (this.dragonTick <= 0) {
        this.damageArea(dx + 70, groundY, 110 * this.dragonRadiusScale, 36 * this.dragonDamageScale, enemies, grid, onKill, false);
        this.dragonTick = 0.08;
      }
    }

    // Update Death Beam
    if (this.deathBeamTime > 0) {
      this.deathBeamTime -= deltaTime;
      this.deathBeamTick -= deltaTime;

      // Plasma sparks along beam
      if (showAbilityEffects && quality !== 'low' && Math.random() < 0.8) {
        const sy = Math.random() * (this.height * 0.85);
        this.addParticle(this.deathBeamX + (Math.random() - 0.5) * 50, sy, (Math.random() - 0.5) * 60, (Math.random() - 0.5) * 60, 0.25, 6, 3);
      }

      if (this.deathBeamTick <= 0) {
        this.damageArea(this.deathBeamX, this.height * 0.42, 65 * this.deathBeamRadiusScale, 30 * this.deathBeamDamageScale, enemies, grid, onKill, false);
        this.deathBeamTick = 0.08;
      }
    }

    // Update Apocalypse
    if (this.apocalypseTime > 0) {
      this.apocalypseTime -= deltaTime;
    }
  }

  render(context: CanvasRenderingContext2D, quality: GraphicsQuality = 'high', showAbilityEffects = true): void {
    const time = this.gameTime;

    // Apocalypse sky tint
    if (this.apocalypseTime > 0) {
      context.save();
      context.fillStyle = `rgba(120, 10, 10, ${Math.min(0.35, this.apocalypseTime * 0.2)})`;
      context.fillRect(0, 0, this.width, this.height);
      context.restore();
    }

    // Death Beam Visual
    if (this.deathBeamTime > 0) {
      const p = 1 - this.deathBeamTime / this.deathBeamMaxTime;
      const alpha = Math.sin(p * Math.PI);
      const bx = this.deathBeamX;

      context.save();
      context.globalCompositeOperation = 'screen';

      // Outer plasma aura
      const beamGrad = context.createLinearGradient(bx - 60, 0, bx + 60, 0);
      beamGrad.addColorStop(0, 'rgba(0, 229, 255, 0)');
      beamGrad.addColorStop(0.3, `rgba(0, 229, 255, ${alpha * 0.6})`);
      beamGrad.addColorStop(0.5, `rgba(255, 255, 255, ${alpha * 0.9})`);
      beamGrad.addColorStop(0.7, `rgba(168, 85, 247, ${alpha * 0.6})`);
      beamGrad.addColorStop(1, 'rgba(168, 85, 247, 0)');

      context.fillStyle = beamGrad;
      context.fillRect(bx - 65, 0, 130, this.height);

      // Core white beam
      context.fillStyle = `rgba(255, 255, 255, ${alpha * 0.95})`;
      context.fillRect(bx - 18, 0, 36, this.height);

      // Electric arcs along the beam
      context.strokeStyle = '#38bdf8';
      context.lineWidth = 2.5;
      context.beginPath();
      for (let y = 0; y < this.height; y += 30) {
        const offset = Math.sin(y * 0.1 + time * 20) * 24;
        if (y === 0) context.moveTo(bx + offset, y);
        else context.lineTo(bx + offset, y);
      }
      context.stroke();

      // Ground splash
      const splashGrad = context.createRadialGradient(bx, this.height * 0.85, 10, bx, this.height * 0.85, 90);
      splashGrad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
      splashGrad.addColorStop(0.5, `rgba(56, 189, 248, ${alpha * 0.7})`);
      splashGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      context.fillStyle = splashGrad;
      context.beginPath();
      context.arc(bx, this.height * 0.85, 90, 0, Math.PI * 2);
      context.fill();

      context.restore();
    }

    // Strike Indicators and Falling Projectiles
    for (let index = 0; index < STRIKE_CAPACITY; index++) {
      if (this.strikeActive[index] === 0) continue;

      const tx = this.strikeX[index];
      const ty = this.strikeY[index];
      const rad = this.strikeRadius[index];
      const progress = 1 - Math.max(0, this.strikeTimer[index]) / this.strikeMaxTimer[index];
      const kind = this.strikeKind[index];

      // Ground Target Reticle
      context.save();
      context.strokeStyle = kind === 1 ? '#f87171' : '#f59e0b';
      context.lineWidth = 2;

      // Outer reticle circle
      context.beginPath();
      context.arc(tx, ty, rad * (1.1 - progress * 0.1), 0, Math.PI * 2);
      context.stroke();

      // Crosshairs
      context.beginPath();
      context.moveTo(tx - rad * 0.4, ty); context.lineTo(tx + rad * 0.4, ty);
      context.moveTo(tx, ty - rad * 0.4); context.lineTo(tx, ty + rad * 0.4);
      context.stroke();

      // Ground Shadow
      context.fillStyle = 'rgba(0, 0, 0, 0.4)';
      context.beginPath();
      context.ellipse(tx, ty, rad * 0.3 * progress, rad * 0.15 * progress, 0, 0, Math.PI * 2);
      context.fill();

      context.restore();

      // Falling Projectile
      const curX = this.strikeStartX[index] + (tx - this.strikeStartX[index]) * progress;
      const curY = this.strikeStartY[index] + (ty - this.strikeStartY[index]) * progress;

      if (kind === 0 || kind === 2) {
        // Meteor Fireball
        context.save();
        context.globalCompositeOperation = 'screen';

        // Fire tail
        const tailGrad = context.createLinearGradient(curX, curY, this.strikeStartX[index], this.strikeStartY[index]);
        tailGrad.addColorStop(0, 'rgba(255, 240, 180, 0.9)');
        tailGrad.addColorStop(0.3, 'rgba(245, 158, 11, 0.7)');
        tailGrad.addColorStop(0.7, 'rgba(220, 38, 38, 0.4)');
        tailGrad.addColorStop(1, 'rgba(100, 0, 0, 0)');

        context.fillStyle = tailGrad;
        context.beginPath();
        context.moveTo(curX - 12, curY);
        context.lineTo(curX + 12, curY);
        context.lineTo(this.strikeStartX[index] + 15, this.strikeStartY[index]);
        context.lineTo(this.strikeStartX[index] - 15, this.strikeStartY[index]);
        context.closePath();
        context.fill();

        // Meteor Head
        const headGrad = context.createRadialGradient(curX, curY, 2, curX, curY, 22);
        headGrad.addColorStop(0, '#ffffff');
        headGrad.addColorStop(0.3, '#fef08a');
        headGrad.addColorStop(0.7, '#f97316');
        headGrad.addColorStop(1, '#b91c1c');

        context.fillStyle = headGrad;
        context.beginPath();
        context.arc(curX, curY, 22, 0, Math.PI * 2);
        context.fill();

        context.restore();
      } else if (kind === 1) {
        // Artillery Shell
        context.save();
        context.fillStyle = '#71717a';
        context.beginPath();
        context.arc(curX, curY, 5, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = '#fbbf24';
        context.fillRect(curX - 2, curY - 12, 4, 10);
        context.restore();
      }
    }

    // Dragon Visuals
    if (this.dragonTime > 0) {
      const p = 1 - this.dragonTime / this.dragonMaxTime;
      const dx = p * (this.width + 240) - 120;
      const dy = this.dragonFlightY + Math.sin(p * Math.PI * 4) * 25;
      const wingAngle = Math.cos(p * Math.PI * 16) * 0.45;

      context.save();

      // Dragon Breath Fire Stream
      context.globalCompositeOperation = 'screen';
      const breathTargetX = dx + 80;
      const breathTargetY = this.dragonY;

      const breathGrad = context.createLinearGradient(dx + 28, dy + 6, breathTargetX, breathTargetY);
      breathGrad.addColorStop(0, 'rgba(255, 255, 220, 0.95)');
      breathGrad.addColorStop(0.3, 'rgba(249, 115, 22, 0.8)');
      breathGrad.addColorStop(0.7, 'rgba(220, 38, 38, 0.5)');
      breathGrad.addColorStop(1, 'rgba(120, 0, 0, 0)');

      context.fillStyle = breathGrad;
      context.beginPath();
      context.moveTo(dx + 20, dy + 2);
      context.lineTo(dx + 34, dy + 10);
      context.lineTo(breathTargetX + 60, breathTargetY + 25);
      context.lineTo(breathTargetX - 40, breathTargetY - 25);
      context.closePath();
      context.fill();

      // Dragon Body Drawing
      context.globalCompositeOperation = 'source-over';
      context.translate(dx, dy);

      // Tail
      context.strokeStyle = '#7f1d1d';
      context.lineWidth = 6;
      context.beginPath();
      context.moveTo(-15, 0);
      context.quadraticCurveTo(-35, Math.sin(p * Math.PI * 8) * 15, -55, 5);
      context.stroke();

      // Dragon Body Torso
      context.fillStyle = '#991b1b';
      context.beginPath();
      context.ellipse(0, 0, 24, 12, 0.1, 0, Math.PI * 2);
      context.fill();

      // Belly Scales
      context.fillStyle = '#f59e0b';
      context.beginPath();
      context.ellipse(2, 4, 16, 6, 0.1, 0, Math.PI * 2);
      context.fill();

      // Neck and Head
      context.fillStyle = '#b91c1c';
      context.beginPath();
      context.moveTo(12, -4);
      context.lineTo(28, -8);
      context.lineTo(34, 2);
      context.lineTo(20, 8);
      context.closePath();
      context.fill();

      // Glowing Eye
      context.fillStyle = '#fef08a';
      context.fillRect(26, -6, 3, 2);

      // Horns
      context.fillStyle = '#f59e0b';
      context.beginPath();
      context.moveTo(22, -8); context.lineTo(16, -18); context.lineTo(25, -10);
      context.fill();

      // Wings
      context.save();
      context.rotate(wingAngle);

      // Left / Top Wing
      context.fillStyle = '#7f1d1d';
      context.beginPath();
      context.moveTo(-4, -6);
      context.lineTo(-12, -38);
      context.lineTo(10, -28);
      context.lineTo(8, -8);
      context.closePath();
      context.fill();

      context.fillStyle = '#dc2626';
      context.beginPath();
      context.moveTo(-3, -8);
      context.lineTo(-10, -34);
      context.lineTo(6, -26);
      context.closePath();
      context.fill();

      context.restore();

      context.restore();
    }

    // Render Particles
    context.save();
    context.globalCompositeOperation = 'screen';
    const particleLimit = !showAbilityEffects || quality === 'low' ? 0 : quality === 'medium' ? Math.floor(PARTICLE_CAPACITY * 0.45) : PARTICLE_CAPACITY;
    for (let index = 0; index < particleLimit; index++) {
      if (this.plife[index] <= 0) continue;
      const alpha = this.plife[index] / this.pmaxLife[index];
      const ptype = this.ptype[index];
      const px = this.px[index];
      const py = this.py[index];
      const sz = this.psize[index];

      if (ptype === 0) { // Fire
        context.fillStyle = `rgba(249, 115, 22, ${alpha * 0.8})`;
        context.beginPath();
        context.arc(px, py, sz * (1 + (1 - alpha)), 0, Math.PI * 2);
        context.fill();
      } else if (ptype === 1) { // Spark
        context.fillStyle = `rgba(254, 240, 138, ${alpha})`;
        context.fillRect(px - sz / 2, py - sz / 2, sz, sz);
      } else if (ptype === 3) { // Plasma
        context.fillStyle = `rgba(56, 189, 248, ${alpha * 0.9})`;
        context.beginPath();
        context.arc(px, py, sz, 0, Math.PI * 2);
        context.fill();
      }
    }
    context.restore();

    // Render Expanding Effects
    const effectLimit = quality === 'low' ? 0 : quality === 'medium' ? Math.floor(EFFECT_CAPACITY * 0.55) : EFFECT_CAPACITY;
    for (let index = 0; index < effectLimit; index++) {
      if (this.effectTime[index] <= 0) continue;
      const progress = 1 - this.effectTime[index] / this.effectMaxTime[index];
      const alpha = 1 - progress;

      context.save();
      context.strokeStyle = `rgba(249, 115, 22, ${alpha * 0.8})`;
      context.lineWidth = 4 * alpha + 1;
      context.beginPath();
      context.arc(this.effectX[index], this.effectY[index], this.effectRadius[index] * progress, 0, Math.PI * 2);
      context.stroke();
      context.restore();
    }
  }

  getCooldown(id: AbilityIdValue): number {
    return this.cooldowns[id];
  }

  getTotalCooldown(id: AbilityIdValue): number {
    return COOLDOWNS[id] * this.cooldownMultiplier * this.abilityCooldownMultiplier[id];
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
    this.plife.fill(0);
    this.dragonTime = 0;
    this.dragonY = 0;
    this.dragonFlightY = 0;
    this.deathBeamTime = 0;
    this.apocalypseTime = 0;
    this.cooldownMultiplier = 1;
    this.damageMultiplier = 1;
    this.abilityDamageMultiplier.fill(1);
    this.abilityRadiusMultiplier.fill(1);
    this.abilityCooldownMultiplier.fill(1);
    this.dragonDamageScale = 1;
    this.dragonRadiusScale = 1;
    this.deathBeamDamageScale = 1;
    this.deathBeamRadiusScale = 1;
  }

  applyCooldownHaste(): void {
    this.cooldownMultiplier *= 0.88;
  }

  setCooldownHaste(haste: number): void {
    this.cooldownMultiplier = Math.max(0.4, 1 - haste);
  }

  setAbilityPower(multiplier: number): void {
    this.damageMultiplier = multiplier;
  }

  private queueTargetedStrike(enemies: EnemyManager, grid: SpatialGrid, delay: number, radius: number, damage: number, kind: number, targetX: number, targetY: number): void {
    if (targetX !== this.width / 2 || targetY !== this.height * 0.42) {
      this.queueStrike(targetX, targetY, delay, radius, damage, kind);
      return;
    }
    const target = grid.findClosestInRange(this.width / 2, this.height * 0.42, 900, enemies);
    if (target >= 0) {
      this.queueStrike(enemies.x[target], enemies.y[target], delay, radius, damage, kind);
      return;
    }
    this.queueStrike(this.width / 2, this.height * 0.42, delay, radius, damage, kind);
  }

  private queueStrike(x: number, y: number, delay: number, radius: number, damage: number, kind = 0, startX = x - 180, startY = y - 420): void {
    for (let index = 0; index < STRIKE_CAPACITY; index++) {
      if (this.strikeActive[index] !== 0) continue;
      this.strikeX[index] = x;
      this.strikeY[index] = y;
      this.strikeStartX[index] = startX;
      this.strikeStartY[index] = startY;
      this.strikeTimer[index] = delay;
      this.strikeMaxTimer[index] = delay;
      this.strikeRadius[index] = radius;
      this.strikeDamage[index] = damage;
      this.strikeKind[index] = kind;
      this.strikeActive[index] = 1;
      return;
    }
  }

  private damageArea(x: number, y: number, radius: number, damage: number, enemies: EnemyManager, grid: SpatialGrid, onKill: (reward: number) => void, chain: boolean): void {
    damage *= this.damageMultiplier;
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

  private addParticle(x: number, y: number, vx: number, vy: number, life: number, size: number, type: number): void {
    for (let index = 0; index < PARTICLE_CAPACITY; index++) {
      if (this.plife[index] > 0) continue;
      this.px[index] = x;
      this.py[index] = y;
      this.pvx[index] = vx;
      this.pvy[index] = vy;
      this.plife[index] = life;
      this.pmaxLife[index] = life;
      this.psize[index] = size;
      this.ptype[index] = type;
      return;
    }
  }
}
