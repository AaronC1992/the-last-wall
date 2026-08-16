import { EnemyManager } from '../enemies/EnemyManager';
import { ProjectileManager } from '../weapons/ProjectileManager';
import { WeaponManager } from '../weapons/WeaponManager';
import { EnemyType } from '../enemies/EnemyTypes';
import type { EnemyTypeId } from '../enemies/EnemyTypes';
import { ChaosSystem } from '../systems/ChaosSystem';
import { FeedbackSystem } from '../systems/FeedbackSystem';
import { MapRenderer } from '../map/MapRenderer';
import { DecalSystem } from '../map/DecalSystem';
import { Camera } from '../core/Camera';
import { towerConfig } from '../weapons/TowerConfig';
import type { TowerKind } from '../weapons/TowerConfig';
import type { MapDefinition } from '../map/TerrainTypes';
import type { ThreatMap } from '../systems/ThreatMap';

export interface GhostTower {
  kind: TowerKind;
  x: number;
  y: number;
  valid: boolean;
}

export interface RenderState {
  width: number;
  height: number;
  enemies: EnemyManager;
  projectiles: ProjectileManager;
  weapons: WeaponManager;
  chaos: ChaosSystem;
  feedback: FeedbackSystem;
  wallHp: number;
  wallMaxHp: number;
  damageNumbers: boolean;
  screenShake: boolean;
  camera: Camera;
  buildPhase: boolean;
  selectedTowerId: number;
  hoveredTowerId: number;
  ghost: GhostTower | null;
  threatMap: ThreatMap;
  showThreatMap: boolean;
}

export class Renderer {
  private readonly context: CanvasRenderingContext2D;
  private readonly map: MapRenderer;
  private readonly decals = new DecalSystem();

  constructor(context: CanvasRenderingContext2D, map: MapDefinition) {
    this.context = context;
    this.map = new MapRenderer(map);
  }

  render(state: RenderState): void {
    const context = this.context;
    context.clearRect(0, 0, state.width, state.height);
    context.fillStyle = '#05080a';
    context.fillRect(0, 0, state.width, state.height);
    context.save();
    if (state.screenShake && state.feedback.shakeAmount > 0) {
      context.translate((Math.random() - 0.5) * state.feedback.shakeAmount, (Math.random() - 0.5) * state.feedback.shakeAmount);
    }
    state.camera.apply(context);

    this.map.renderBackground(context);
    if (state.showThreatMap) state.threatMap.render(context);
    this.decals.render(context);
    this.renderEnemies(context, state.enemies);
    this.renderProjectiles(context, state.projectiles);
    state.chaos.render(context);
    state.feedback.render(context, state.damageNumbers);
    this.map.renderDefenseLine(context, state.wallHp, state.wallMaxHp);
    this.renderFireStreams(context, state);
    this.renderLasers(context, state);
    this.renderTowers(context, state);
    this.renderGhost(context, state);

    context.restore();
  }

  addDeathDecal(x: number, y: number): void {
    this.decals.add(x, y, 'blood', 0.7 + ((x + y) % 7) / 14);
  }

  addExplosionDecal(x: number, y: number, radius: number): void {
    this.decals.add(x, y, 'scorch', radius / 40);
  }

  clearDecals(): void {
    this.decals.clear();
  }

  private renderEnemies(context: CanvasRenderingContext2D, enemies: EnemyManager): void {
    for (let index = 0; index < enemies.count; index++) {
      if (enemies.active[index] === 0) continue;
      const x = enemies.x[index];
      const y = enemies.y[index];
      const radius = enemies.radius[index];
      const enemyType = enemies.type[index] as EnemyTypeId;
      const isElite = enemies.elite[index] !== 0;
      const isBurning = enemies.burnTime[index] > 0;
      const baseColor = enemyType === EnemyType.Grunt ? '#d84b48' : enemyType === EnemyType.Runner ? '#ee9a4d' : enemyType === EnemyType.Brute ? '#a6465d' : enemyType === EnemyType.Armored ? '#8a97a5' : enemyType === EnemyType.Exploder ? '#e5c553' : '#8753b4';
      const color = isBurning ? '#ffffff' : baseColor;
      context.fillStyle = color;
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fill();

      if (isBurning) {
        this.renderBurningEffect(context, x, y, radius, index);
      }

      context.fillStyle = 'rgba(255, 255, 255, 0.28)';
      context.beginPath();
      context.arc(x - radius * 0.3, y - radius * 0.3, Math.max(1, radius * 0.28), 0, Math.PI * 2);
      context.fill();

      if (enemyType === EnemyType.Armored) {
        context.strokeStyle = '#d7e1eb';
        context.lineWidth = 2;
        context.stroke();
      } else if (enemyType === EnemyType.Exploder) {
        context.strokeStyle = '#fff1a8';
        context.lineWidth = 2;
        context.setLineDash([2, 2]);
        context.stroke();
        context.setLineDash([]);
      } else if (enemyType === EnemyType.Boss) {
        context.strokeStyle = '#f2c46d';
        context.lineWidth = 3;
        context.stroke();
        const healthRatio = Math.max(0, enemies.hp[index] / enemies.maxHp[index]);
        context.fillStyle = '#1a1d25';
        context.fillRect(x - radius, y - radius - 8, radius * 2, 4);
        context.fillStyle = '#e86278';
        context.fillRect(x - radius, y - radius - 8, radius * 2 * healthRatio, 4);
      }

      if (isElite) {
        context.strokeStyle = '#f2c46d';
        context.lineWidth = 2;
        context.strokeRect(x - radius - 3, y - radius - 3, radius * 2 + 6, radius * 2 + 6);
      }
    }
  }

  drawPixelGrunt(context: CanvasRenderingContext2D, r: number, time: number, index: number, isElite: boolean): void {
    const bob = Math.sin(time * 10 + index) * 1.5;

    context.fillStyle = 'rgba(0, 0, 0, 0.35)';
    context.beginPath();
    context.ellipse(0, r * 0.8, r * 0.9, r * 0.4, 0, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = isElite ? '#e2a63b' : '#9b2d2a';
    context.fillRect(-r + 1, -r * 0.3 + bob, r * 2 - 2, r * 1.2);

    context.fillStyle = isElite ? '#f5d77f' : '#d84b48';
    context.fillRect(-r + 2, -r * 0.3 + bob, r * 2 - 4, r * 0.8);
    context.fillStyle = '#3a201f';
    context.fillRect(-r + 2, r * 0.2 + bob, r * 2 - 4, 2);

    context.fillStyle = isElite ? '#f2c46d' : '#b03330';
    context.fillRect(-r * 0.6, -r + bob, r * 1.2, r * 0.8);

    context.fillStyle = '#425238';
    context.fillRect(-r * 0.9, -r * 0.7 + bob, Math.max(2, r * 0.4), 3);
    context.fillRect(r * 0.5, -r * 0.7 + bob, Math.max(2, r * 0.4), 3);

    context.fillStyle = '#1c261b';
    context.fillRect(-r * 0.4, -r * 0.6 + bob, r * 0.8, 3);
    context.fillStyle = '#ff3333';
    context.fillRect(-r * 0.3, -r * 0.5 + bob, 2, 2);
    context.fillRect(r * 0.1, -r * 0.5 + bob, 2, 2);

    context.fillStyle = '#a1a8a3';
    context.fillRect(r * 0.5, -r * 0.4 + bob, 2, r * 0.9);

    if (isElite) this.drawEliteAura(context, r, time);
  }

  drawPixelRunner(context: CanvasRenderingContext2D, r: number, time: number, index: number, isElite: boolean): void {
    const stride = Math.sin(time * 18 + index) * 2;

    context.fillStyle = 'rgba(0, 0, 0, 0.3)';
    context.beginPath();
    context.ellipse(0, r * 0.8, r * 0.8, r * 0.35, 0, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = isElite ? '#f39c12' : '#d35400';
    context.fillRect(-r * 0.7, -r * 0.5 + stride, r * 1.4, r * 1.1);

    context.fillStyle = isElite ? '#f1c40f' : '#ee9a4d';
    context.fillRect(-r * 0.5, -r * 0.4 + stride, r, r * 0.8);

    context.fillStyle = '#78281f';
    context.fillRect(-r * 0.6, -r * 0.9 + stride, 2, 4);
    context.fillRect(r * 0.4, -r * 0.9 + stride, 2, 4);

    context.fillStyle = '#ffea00';
    context.fillRect(-r * 0.3, -r * 0.2 + stride, 2, 2);
    context.fillRect(r * 0.1, -r * 0.2 + stride, 2, 2);

    context.fillStyle = '#e74c3c';
    context.fillRect(-r * 0.8, r * 0.4 + stride, 3, 3);
    context.fillRect(r * 0.5, r * 0.4 - stride, 3, 3);

    if (isElite) this.drawEliteAura(context, r, time);
  }

  drawPixelBrute(context: CanvasRenderingContext2D, r: number, time: number, index: number, isElite: boolean): void {
    const stomp = Math.sin(time * 6 + index) * 1.2;

    context.fillStyle = 'rgba(0, 0, 0, 0.45)';
    context.beginPath();
    context.ellipse(0, r * 0.85, r * 1.1, r * 0.5, 0, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = isElite ? '#d4ac0d' : '#6b202e';
    context.fillRect(-r, -r * 0.4 + stomp, r * 2, r * 1.2);

    context.fillStyle = '#3a2d32';
    context.fillRect(-r - 3, -r * 0.5 + stomp, 6, 8);
    context.fillRect(r - 3, -r * 0.5 + stomp, 6, 8);
    context.fillStyle = '#8f8188';
    context.fillRect(-r - 2, -r * 0.7 + stomp, 2, 4);
    context.fillRect(r, -r * 0.7 + stomp, 2, 4);

    context.fillStyle = isElite ? '#f1c40f' : '#a6465d';
    context.fillRect(-r + 3, -r * 0.3 + stomp, r * 2 - 6, r * 0.9);
    context.fillStyle = '#20181b';
    context.fillRect(-r + 2, r * 0.2 + stomp, r * 2 - 4, 3);

    context.fillStyle = '#2e2528';
    context.fillRect(-r * 0.5, -r * 0.9 + stomp, r, r * 0.6);
    context.fillStyle = '#8f8188';
    context.fillRect(-r * 0.8, -r + stomp, 3, 6);
    context.fillRect(r * 0.8 - 3, -r + stomp, 3, 6);

    context.fillStyle = '#ff2a5f';
    context.fillRect(-r * 0.3, -r * 0.7 + stomp, 3, 2);
    context.fillRect(r * 0.1, -r * 0.7 + stomp, 3, 2);

    context.fillStyle = '#1c1518';
    context.fillRect(r + 2, -r * 0.8 + stomp, 5, r * 1.4);
    context.fillStyle = '#8f8188';
    context.fillRect(r + 1, -r * 0.8 + stomp, 7, 3);

    if (isElite) this.drawEliteAura(context, r, time);
  }

  drawPixelArmored(context: CanvasRenderingContext2D, r: number, time: number, index: number, isElite: boolean): void {
    const march = Math.sin(time * 8 + index) * 1;

    context.fillStyle = 'rgba(0, 0, 0, 0.4)';
    context.beginPath();
    context.ellipse(0, r * 0.8, r, r * 0.45, 0, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = isElite ? '#b8860b' : '#525d66';
    context.fillRect(-r * 0.8, -r * 0.4 + march, r * 1.6, r * 1.1);

    context.fillStyle = isElite ? '#f1c40f' : '#8a97a5';
    context.fillRect(-r * 0.7, -r * 0.4 + march, r * 1.4, r * 0.8);
    context.fillStyle = isElite ? '#fef9e7' : '#c5d0dc';
    context.fillRect(-r * 0.7, -r * 0.4 + march, 2, r * 0.8);

    context.fillStyle = isElite ? '#7d6608' : '#333b42';
    context.fillRect(-r - 2, -r * 0.3 + march, 6, r * 1.1);
    context.fillStyle = isElite ? '#f39c12' : '#a0acb8';
    context.fillRect(-r - 1, -r * 0.3 + march, 4, 2);
    context.fillRect(-r - 1, r * 0.6 + march, 4, 2);

    context.fillStyle = isElite ? '#7d6608' : '#3d4650';
    context.fillRect(-r * 0.5, -r * 0.9 + march, r, r * 0.6);
    context.fillStyle = isElite ? '#f1c40f' : '#a0acb8';
    context.fillRect(-r * 0.5, -r * 0.9 + march, r, 2);

    context.fillStyle = '#101418';
    context.fillRect(-r * 0.3, -r * 0.6 + march, r * 0.6, 2);
    context.fillRect(-1, -r * 0.7 + march, 2, 4);

    context.fillStyle = '#66c2ff';
    context.fillRect(-r * 0.2, -r * 0.6 + march, 2, 1);
    context.fillRect(r * 0.1, -r * 0.6 + march, 2, 1);

    if (isElite) this.drawEliteAura(context, r, time);
  }

  drawPixelExploder(context: CanvasRenderingContext2D, r: number, time: number, index: number, isElite: boolean): void {
    const pulse = 1 + Math.sin(time * 16 + index) * 0.12;
    const pr = r * pulse;

    context.fillStyle = 'rgba(0, 0, 0, 0.35)';
    context.beginPath();
    context.ellipse(0, r * 0.8, pr * 0.8, r * 0.4, 0, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = '#332a1e';
    context.fillRect(-pr * 0.8, -pr * 0.6, pr * 1.6, pr * 1.3);

    context.fillStyle = isElite ? '#f39c12' : '#d35400';
    context.fillRect(-pr * 0.6, -pr * 0.4, pr * 1.2, pr);

    context.fillStyle = isElite ? '#f1c40f' : '#e5c553';
    context.fillRect(-pr * 0.4, -pr * 0.3, pr * 0.8, pr * 0.8);

    context.fillStyle = '#ffffff';
    context.fillRect(-pr * 0.2, -pr * 0.1, pr * 0.4, pr * 0.4);

    context.fillStyle = '#1c1712';
    context.fillRect(-1, -pr * 0.9, 2, 4);

    const sparkT = time * 20 + index;
    const sparkX = Math.sin(sparkT) * 3;
    const sparkY = -pr * 0.9 - 3 + Math.cos(sparkT) * 2;
    context.fillStyle = '#ffffff';
    context.fillRect(Math.round(sparkX - 1), Math.round(sparkY - 1), 3, 3);
    context.fillStyle = '#ff5722';
    context.fillRect(Math.round(sparkX - 2), Math.round(sparkY - 2), 5, 1);

    if (isElite) this.drawEliteAura(context, r, time);
  }

  drawPixelBoss(context: CanvasRenderingContext2D, r: number, time: number, index: number, isElite: boolean, hp: number, maxHp: number): void {
    const march = Math.sin(time * 5 + index) * 1.5;

    const auraGlow = context.createRadialGradient(0, 0, r * 0.3, 0, 0, r * 1.5);
    auraGlow.addColorStop(0, 'rgba(135, 83, 180, 0.4)');
    auraGlow.addColorStop(0.7, 'rgba(75, 30, 110, 0.15)');
    auraGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    context.fillStyle = auraGlow;
    context.beginPath();
    context.arc(0, 0, r * 1.5, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = 'rgba(0, 0, 0, 0.5)';
    context.beginPath();
    context.ellipse(0, r * 0.85, r * 1.2, r * 0.5, 0, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = '#4a1525';
    context.fillRect(-r * 1.1, -r * 0.2 + march, r * 2.2, r * 1.1);

    context.fillStyle = '#2b1d3d';
    context.fillRect(-r * 0.9, -r * 0.5 + march, r * 1.8, r * 1.3);

    context.fillStyle = '#6a3a93';
    context.fillRect(-r * 0.8, -r * 0.4 + march, r * 1.6, r * 1.1);

    context.fillStyle = '#d4b66e';
    context.fillRect(-r * 0.8, -r * 0.4 + march, r * 1.6, 3);
    context.fillRect(-r * 0.8, r * 0.2 + march, r * 1.6, 2);
    context.fillRect(-2, -r * 0.4 + march, 4, r * 0.8);

    context.fillStyle = '#2b1d3d';
    context.fillRect(-r * 1.2, -r * 0.6 + march, r * 0.5, r * 0.6);
    context.fillRect(r * 0.7, -r * 0.6 + march, r * 0.5, r * 0.6);
    context.fillStyle = '#d4b66e';
    context.fillRect(-r * 1.1, -r * 0.8 + march, 3, r * 0.3);
    context.fillRect(r * 1.0 - 1, -r * 0.8 + march, 3, r * 0.3);

    context.fillStyle = '#1e142b';
    context.fillRect(-r * 0.5, -r + march, r, r * 0.6);
    context.fillStyle = '#d4b66e';
    context.fillRect(-r * 0.5, -r * 1.2 + march, 3, r * 0.3);
    context.fillRect(-1, -r * 1.3 + march, 3, r * 0.4);
    context.fillRect(r * 0.5 - 2, -r * 1.2 + march, 3, r * 0.3);

    context.fillStyle = '#ff2a5f';
    context.fillRect(-r * 0.3, -r * 0.8 + march, 4, 3);
    context.fillRect(r * 0.1, -r * 0.8 + march, 4, 3);

    const barW = r * 2.4;
    const barH = 6;
    const barX = -barW / 2;
    const barY = -r * 1.5;

    context.fillStyle = '#0f0c14';
    context.fillRect(barX - 2, barY - 2, barW + 4, barH + 4);
    context.strokeStyle = '#d4b66e';
    context.lineWidth = 1;
    context.strokeRect(barX - 1, barY - 1, barW + 2, barH + 2);

    const ratio = Math.max(0, Math.min(1, hp / maxHp));
    context.fillStyle = '#2a1218';
    context.fillRect(barX, barY, barW, barH);
    context.fillStyle = '#e86278';
    context.fillRect(barX, barY, barW * ratio, barH);
    context.fillStyle = '#ff9ebb';
    context.fillRect(barX, barY, barW * ratio, 2);

    if (isElite) this.drawEliteAura(context, r, time);
  }

  private drawEliteAura(context: CanvasRenderingContext2D, r: number, time: number): void {
    context.strokeStyle = '#f2c46d';
    context.lineWidth = 2;
    context.strokeRect(-r - 3, -r - 3, r * 2 + 6, r * 2 + 6);

    const sparkPulse = Math.sin(time * 12) * 1.5;
    context.fillStyle = '#ffffff';
    context.fillRect(-r - 4 + sparkPulse, -r - 4, 3, 3);
    context.fillRect(r + 1 - sparkPulse, -r - 4, 3, 3);
    context.fillRect(-r - 4, r + 1 - sparkPulse, 3, 3);
    context.fillRect(r + 1, r + 1 + sparkPulse, 3, 3);
  }

  private renderProjectiles(context: CanvasRenderingContext2D, projectiles: ProjectileManager): void {
    for (let index = 0; index < projectiles.count; index++) {
      const mode = projectiles.mode[index];
      const px = projectiles.x[index];
      const py = projectiles.y[index];

      if (mode === 2) {
        const totalFlight = Math.max(0.001, projectiles.flight[index]);
        const progress = Math.min(1, Math.max(0, 1 - projectiles.life[index] / totalFlight));
        const arcHeight = Math.sin(progress * Math.PI) * 75;
        const renderY = py - arcHeight;
        const impactRadius = projectiles.impactRadius[index];

        context.save();
        context.strokeStyle = 'rgba(235, 130, 60, 0.45)';
        context.lineWidth = 1.5;
        context.setLineDash([3, 3]);
        context.beginPath();
        context.arc(projectiles.targetX[index], projectiles.targetY[index], impactRadius, 0, Math.PI * 2);
        context.stroke();
        context.restore();

        context.fillStyle = 'rgba(0, 0, 0, 0.35)';
        context.beginPath();
        context.ellipse(px, py, 5, 2.5, 0, 0, Math.PI * 2);
        context.fill();

        context.fillStyle = '#ff8f3d';
        context.beginPath();
        context.arc(px, renderY, 6, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = '#fff4a3';
        context.beginPath();
        context.arc(px, renderY, 3, 0, Math.PI * 2);
        context.fill();
      } else {
        context.fillStyle = '#ffe39a';
        context.beginPath();
        context.arc(px, py, 3, 0, Math.PI * 2);
        context.fill();
      }
    }
  }

  private renderTowers(context: CanvasRenderingContext2D, state: RenderState): void {
    for (const tower of state.weapons.towers) {
      const highlighted = tower.id === state.selectedTowerId || tower.id === state.hoveredTowerId;
      const config = towerConfig(tower.kind);
      if (tower.instance.hasAim && (state.buildPhase || highlighted)) this.renderTargetGeometry(context, tower.kind, tower.instance, config.accent);
      this.map.drawTower(context, tower.kind, tower.instance.x, tower.instance.y, false, tower.instance.targeting.angle);
      if (tower.id === state.selectedTowerId) {
        context.strokeStyle = '#f2e0b4';
        context.lineWidth = 2;
        context.beginPath();
        context.arc(tower.instance.x, tower.instance.y, 26, 0, Math.PI * 2);
        context.stroke();
      }
    }
  }

  private renderBurningEffect(context: CanvasRenderingContext2D, x: number, y: number, radius: number, index: number): void {
    const time = Date.now() * 0.01 + index;
    const pulse = Math.sin(time * 6) * 0.2;
    const auraRadius = radius * (1.7 + pulse);

    context.save();
    context.globalCompositeOperation = 'screen';

    // Blinding white-hot core right over enemy body
    context.fillStyle = '#ffffff';
    context.beginPath();
    context.arc(x, y, radius * 1.1, 0, Math.PI * 2);
    context.fill();

    // Intense incandescent heat aura (White -> Gold -> Fire Orange -> Flame Red)
    const fireGlow = context.createRadialGradient(x, y, radius * 0.2, x, y, auraRadius);
    fireGlow.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
    fireGlow.addColorStop(0.3, 'rgba(255, 245, 160, 0.9)');
    fireGlow.addColorStop(0.6, 'rgba(255, 120, 20, 0.75)');
    fireGlow.addColorStop(0.85, 'rgba(220, 30, 0, 0.4)');
    fireGlow.addColorStop(1, 'rgba(120, 0, 0, 0)');

    context.fillStyle = fireGlow;
    context.beginPath();
    context.arc(x, y, auraRadius, 0, Math.PI * 2);
    context.fill();

    // Rising white-hot and golden sparks/flames
    for (let spark = 0; spark < 4; spark++) {
      const sparkAngle = time * 2.5 + spark * 1.57;
      const sparkDist = radius * (0.3 + ((time + spark * 0.7) % 1) * 0.8);
      const sparkX = x + Math.cos(sparkAngle) * sparkDist;
      const sparkY = y - ((time * 16 + spark * 7) % 12) + Math.sin(sparkAngle) * 2;
      const sparkSize = 1.5 + (spark % 2) * 1.5;

      context.fillStyle = spark % 2 === 0 ? '#ffffff' : '#fef08a';
      context.fillRect(sparkX - sparkSize / 2, sparkY - sparkSize / 2, sparkSize, sparkSize);
    }

    context.restore();
  }

  private renderFireStreams(context: CanvasRenderingContext2D, state: RenderState): void {
    if (state.buildPhase) return;
    const time = Date.now() * 0.006;
    for (const tower of state.weapons.towers) {
      if (tower.kind !== 'fireTower') continue;
      const fireInstance = tower.instance as unknown as { isFiring?: boolean; targeting: { angle: number; distance: number; coneAngle: number } };
      if (!fireInstance.isFiring) continue;

      const originX = tower.instance.x;
      const originY = tower.instance.y;
      const targetAngle = fireInstance.targeting.angle;
      const maxRange = fireInstance.targeting.distance;
      const coneAngle = fireInstance.targeting.coneAngle;

      context.save();
      context.globalCompositeOperation = 'screen';

      const coneGradient = context.createRadialGradient(originX, originY, 10, originX, originY, maxRange);
      coneGradient.addColorStop(0, 'rgba(255, 240, 180, 0.85)');
      coneGradient.addColorStop(0.25, 'rgba(255, 140, 30, 0.65)');
      coneGradient.addColorStop(0.6, 'rgba(220, 50, 10, 0.4)');
      coneGradient.addColorStop(1, 'rgba(140, 10, 0, 0)');

      context.fillStyle = coneGradient;
      context.beginPath();
      context.moveTo(originX, originY);
      context.arc(originX, originY, maxRange, targetAngle - coneAngle / 2, targetAngle + coneAngle / 2);
      context.closePath();
      context.fill();

      for (let stream = 0; stream < 16; stream++) {
        const angleOffset = (Math.sin(time * 4 + stream) * 0.8) * (coneAngle / 2);
        const streamAngle = targetAngle + angleOffset;
        const speed = 140 + (stream % 5) * 35;
        const progress = ((time * speed + stream * 30) % maxRange) / maxRange;
        const dist = progress * maxRange;
        const particleX = originX + Math.cos(streamAngle) * dist;
        const particleY = originY + Math.sin(streamAngle) * dist;
        const pSize = 3 + progress * 9 + Math.sin(time * 8 + stream) * 2;

        const pGrad = context.createRadialGradient(particleX, particleY, 0, particleX, particleY, pSize);
        pGrad.addColorStop(0, 'rgba(255, 255, 220, 0.95)');
        pGrad.addColorStop(0.3, 'rgba(255, 150, 20, 0.8)');
        pGrad.addColorStop(0.7, 'rgba(210, 40, 10, 0.4)');
        pGrad.addColorStop(1, 'rgba(100, 0, 0, 0)');

        context.fillStyle = pGrad;
        context.beginPath();
        context.arc(particleX, particleY, pSize, 0, Math.PI * 2);
        context.fill();
      }

      context.restore();
    }
  }

  private renderLasers(context: CanvasRenderingContext2D, state: RenderState): void {
    if (state.buildPhase) return;
    const time = Date.now() * 0.012;
    for (const tower of state.weapons.towers) {
      if (tower.kind !== 'lightningTower') continue;
      const laserInstance = tower.instance as unknown as { isFiring?: boolean; primaryTarget?: { x: number; y: number } | null; chainedTargets?: Array<{ x: number; y: number }> };
      if (!laserInstance.isFiring || !laserInstance.primaryTarget) continue;

      const originX = tower.instance.x;
      const originY = tower.instance.y;
      const primary = laserInstance.primaryTarget;

      context.save();
      context.globalCompositeOperation = 'screen';

      this.drawLaserBeam(context, originX, originY, primary.x, primary.y, '#9bc4ff', '#3b82f6', 6, time);

      if (laserInstance.chainedTargets && laserInstance.chainedTargets.length > 0) {
        for (const chainTarget of laserInstance.chainedTargets) {
          this.drawLaserBeam(context, primary.x, primary.y, chainTarget.x, chainTarget.y, '#cce0ff', '#60a5fa', 3.5, time + chainTarget.x * 0.01);
        }
      }

      context.restore();
    }
  }

  private drawLaserBeam(context: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, coreColor: string, outerColor: string, baseWidth: number, time: number): void {
    const dist = Math.hypot(x2 - x1, y2 - y1);
    if (dist < 1) return;

    context.shadowColor = outerColor;
    context.shadowBlur = 12;

    context.strokeStyle = outerColor;
    context.lineWidth = baseWidth + Math.sin(time * 8) * 1.5;
    context.beginPath();
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.stroke();

    context.strokeStyle = coreColor;
    context.lineWidth = Math.max(1, baseWidth * 0.4);
    context.beginPath();
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.stroke();

    context.fillStyle = '#ffffff';
    context.beginPath();
    context.arc(x2, y2, baseWidth * 0.8 + Math.sin(time * 12) * 1, 0, Math.PI * 2);
    context.fill();
  }

  private renderGhost(context: CanvasRenderingContext2D, state: RenderState): void {
    if (!state.ghost) return;
    const config = towerConfig(state.ghost.kind);
    context.save();
    context.globalAlpha = 0.35;
    context.strokeStyle = state.ghost.valid ? config.accent : '#e06458';
    context.fillStyle = state.ghost.valid ? config.color : '#e06458';
    context.lineWidth = 2;
    context.beginPath();
    context.arc(state.ghost.x, state.ghost.y, 20, 0, Math.PI * 2);
    context.fill();
    context.restore();
    this.map.drawTower(context, state.ghost.kind, state.ghost.x, state.ghost.y, true, -Math.PI / 2);
  }

  private renderTargetGeometry(context: CanvasRenderingContext2D, kind: TowerKind, tower: { x: number; y: number; targeting: { mode: string; angle: number; distance: number; targetX: number; targetY: number; radius: number; coneAngle: number } }, color: string): void {
    const target = tower.targeting;
    context.save();
    context.globalAlpha = 0.28;
    context.strokeStyle = color;
    context.fillStyle = color;
    context.lineWidth = kind === 'ballista' ? 7 : 3;
    const endX = tower.x + Math.cos(target.angle) * target.distance;
    const endY = tower.y + Math.sin(target.angle) * target.distance;
    if (target.mode === 'line') {
      context.beginPath(); context.moveTo(tower.x, tower.y); context.lineTo(endX, endY); context.stroke();
      if (kind === 'cannon') { context.beginPath(); context.arc(endX, endY, 10, 0, Math.PI * 2); context.stroke(); }
    } else if (target.mode === 'cone') {
      context.beginPath(); context.moveTo(tower.x, tower.y); context.arc(tower.x, tower.y, target.distance, target.angle - target.coneAngle / 2, target.angle + target.coneAngle / 2); context.closePath(); context.fill();
    } else {
      context.beginPath(); context.moveTo(tower.x, tower.y); context.lineTo(target.targetX, target.targetY); context.stroke();
      context.beginPath(); context.arc(target.targetX, target.targetY, target.radius, 0, Math.PI * 2); context.stroke();
    }
    context.globalAlpha = 0.8;
    context.beginPath(); context.arc(target.mode === 'line' ? endX : target.targetX, target.mode === 'line' ? endY : target.targetY, 5, 0, Math.PI * 2); context.stroke();
    context.restore();
  }
}
