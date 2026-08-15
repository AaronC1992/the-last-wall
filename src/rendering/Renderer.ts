import { EnemyManager } from '../enemies/EnemyManager';
import { ProjectileManager } from '../weapons/ProjectileManager';
import { WeaponManager } from '../weapons/WeaponManager';
import { EnemyType } from '../enemies/EnemyTypes';
import { ENEMY_DATA } from '../enemies/EnemyData';
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
    let lastType = -1;
    for (let index = 0; index < enemies.count; index++) {
      const enemyType = enemies.type[index] as EnemyTypeId;
      if (enemyType !== lastType) {
        context.fillStyle = ENEMY_DATA[enemyType].color;
        lastType = enemyType;
      }
      const radius = enemies.radius[index];
      context.fillRect(enemies.x[index] - radius, enemies.y[index] - radius, radius * 2, radius * 2);
      if (enemies.elite[index] !== 0) {
        context.strokeStyle = '#f2c46d';
        context.strokeRect(enemies.x[index] - radius - 2, enemies.y[index] - radius - 2, radius * 2 + 4, radius * 2 + 4);
      }
      if (enemyType === EnemyType.Boss) {
        context.fillStyle = '#1a1d25';
        context.fillRect(enemies.x[index] - radius, enemies.y[index] - radius - 10, radius * 2, 4);
        context.fillStyle = '#e86278';
        context.fillRect(enemies.x[index] - radius, enemies.y[index] - radius - 10, radius * 2 * (enemies.hp[index] / enemies.maxHp[index]), 4);
        context.fillStyle = ENEMY_DATA[enemyType].color;
      }
    }
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
      this.map.drawTower(context, tower.kind, tower.instance.x, tower.instance.y, false);
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
    this.map.drawTower(context, state.ghost.kind, state.ghost.x, state.ghost.y, true);
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
