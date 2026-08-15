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
    this.renderTowers(context, state);
    this.renderGhost(context, state);

    context.restore();
  }

  addDeathDecal(x: number, y: number): void {
    this.decals.add(x, y, 'blood', 0.7 + ((x + y) % 7) / 14);
  }

  clearDecals(): void {
    this.decals.clear();
  }

  private renderEnemies(context: CanvasRenderingContext2D, enemies: EnemyManager): void {
    const time = performance.now() * 0.008;
    for (let index = 0; index < enemies.count; index++) {
      if (enemies.active[index] === 0) continue;
      const x = enemies.x[index];
      const y = enemies.y[index];
      const radius = enemies.radius[index];
      const enemyType = enemies.type[index] as EnemyTypeId;
      const isElite = enemies.elite[index] !== 0;

      context.save();
      context.translate(x, y);

      switch (enemyType) {
        case EnemyType.Grunt:
          this.drawPixelGrunt(context, radius, time, index, isElite);
          break;
        case EnemyType.Runner:
          this.drawPixelRunner(context, radius, time, index, isElite);
          break;
        case EnemyType.Brute:
          this.drawPixelBrute(context, radius, time, index, isElite);
          break;
        case EnemyType.Armored:
          this.drawPixelArmored(context, radius, time, index, isElite);
          break;
        case EnemyType.Exploder:
          this.drawPixelExploder(context, radius, time, index, isElite);
          break;
        case EnemyType.Boss:
          this.drawPixelBoss(context, radius, time, index, isElite, enemies.hp[index], enemies.maxHp[index]);
          break;
      }

      context.restore();
    }
  }

  private drawPixelGrunt(context: CanvasRenderingContext2D, r: number, time: number, index: number, isElite: boolean): void {
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

  private drawPixelRunner(context: CanvasRenderingContext2D, r: number, time: number, index: number, isElite: boolean): void {
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

  private drawPixelBrute(context: CanvasRenderingContext2D, r: number, time: number, index: number, isElite: boolean): void {
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

  private drawPixelArmored(context: CanvasRenderingContext2D, r: number, time: number, index: number, isElite: boolean): void {
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

  private drawPixelExploder(context: CanvasRenderingContext2D, r: number, time: number, index: number, isElite: boolean): void {
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

  private drawPixelBoss(context: CanvasRenderingContext2D, r: number, time: number, index: number, isElite: boolean, hp: number, maxHp: number): void {
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
    context.fillStyle = '#ffe39a';
    context.beginPath();
    for (let index = 0; index < projectiles.count; index++) {
      context.moveTo(projectiles.x[index] + 3, projectiles.y[index]);
      context.arc(projectiles.x[index], projectiles.y[index], 3, 0, Math.PI * 2);
    }
    context.fill();
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
