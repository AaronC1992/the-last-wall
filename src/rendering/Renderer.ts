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
}

export class Renderer {
  private readonly context: CanvasRenderingContext2D;
  private readonly map = new MapRenderer();
  private readonly decals = new DecalSystem();

  constructor(context: CanvasRenderingContext2D) {
    this.context = context;
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
      if (state.buildPhase || highlighted) {
        context.save();
        context.globalAlpha = highlighted ? 0.5 : 0.22;
        context.strokeStyle = config.accent;
        context.lineWidth = highlighted ? 2 : 1;
        context.beginPath();
        context.arc(tower.instance.x, tower.instance.y, tower.instance.range, 0, Math.PI * 2);
        context.stroke();
        context.restore();
      }
      if (tower.instance.hasAim && (state.buildPhase || highlighted)) {
        context.save();
        context.globalAlpha = 0.7;
        context.strokeStyle = config.accent;
        context.lineWidth = 1.5;
        context.beginPath();
        context.moveTo(tower.instance.x, tower.instance.y);
        context.lineTo(tower.instance.aimX, tower.instance.aimY);
        context.stroke();
        context.beginPath();
        context.arc(tower.instance.aimX, tower.instance.aimY, 5, 0, Math.PI * 2);
        context.stroke();
        context.restore();
      }
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
    context.arc(state.ghost.x, state.ghost.y, this.rangeOf(state.ghost.kind), 0, Math.PI * 2);
    context.stroke();
    context.beginPath();
    context.arc(state.ghost.x, state.ghost.y, 20, 0, Math.PI * 2);
    context.fill();
    context.restore();
    this.map.drawTower(context, state.ghost.kind, state.ghost.x, state.ghost.y, true);
  }

  private rangeOf(kind: TowerKind): number {
    if (kind === 'cannon') return 620;
    if (kind === 'fireTower') return 290;
    if (kind === 'lightningTower') return 510;
    return 500;
  }
}
