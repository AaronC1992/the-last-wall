import { EnemyManager } from '../enemies/EnemyManager';
import { ProjectileManager } from '../weapons/ProjectileManager';
import { WeaponManager } from '../weapons/WeaponManager';
import { EnemyType } from '../enemies/EnemyTypes';
import { ENEMY_DATA } from '../enemies/EnemyData';
import type { EnemyTypeId } from '../enemies/EnemyTypes';
import { ChaosSystem } from '../systems/ChaosSystem';
import { FeedbackSystem } from '../systems/FeedbackSystem';
import { MapRenderer } from '../map/MapRenderer';

export class Renderer {
  private readonly context: CanvasRenderingContext2D;
  private readonly map = new MapRenderer();

  constructor(context: CanvasRenderingContext2D) {
    this.context = context;
  }

  render(width: number, height: number, enemies: EnemyManager, projectiles: ProjectileManager, weapons: WeaponManager, chaos: ChaosSystem, feedback: FeedbackSystem, wallHp: number, wallMaxHp: number, damageNumbers: boolean, screenShake: boolean): void {
    const context = this.context;
    context.clearRect(0, 0, width, height);
    context.save();
    if (screenShake && feedback.shakeAmount > 0) context.translate((Math.random() - 0.5) * feedback.shakeAmount, (Math.random() - 0.5) * feedback.shakeAmount);
    this.map.renderBackground(context);

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

    context.fillStyle = '#ffe39a';
    context.beginPath();
    for (let index = 0; index < projectiles.count; index++) {
      context.moveTo(projectiles.x[index] + 3, projectiles.y[index]);
      context.arc(projectiles.x[index], projectiles.y[index], 3, 0, Math.PI * 2);
    }
    context.fill();
    chaos.render(context);
    feedback.render(context, damageNumbers);

    this.map.renderDefenseLine(context, weapons, wallHp, wallMaxHp);
    context.restore();
  }
}
