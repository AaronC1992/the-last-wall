import { TUNING } from '../core/Constants';
import { EnemyManager } from '../enemies/EnemyManager';
import { ProjectileManager } from '../weapons/ProjectileManager';
import { WeaponManager } from '../weapons/WeaponManager';
import { EnemyType } from '../enemies/EnemyTypes';
import { ENEMY_DATA } from '../enemies/EnemyData';
import type { EnemyTypeId } from '../enemies/EnemyTypes';
import { ChaosSystem } from '../systems/ChaosSystem';
import { FeedbackSystem } from '../systems/FeedbackSystem';

export class Renderer {
  private readonly context: CanvasRenderingContext2D;

  constructor(context: CanvasRenderingContext2D) {
    this.context = context;
  }

  render(width: number, height: number, enemies: EnemyManager, projectiles: ProjectileManager, weapons: WeaponManager, chaos: ChaosSystem, feedback: FeedbackSystem, wallHp: number, wallMaxHp: number, damageNumbers: boolean, screenShake: boolean): void {
    const context = this.context;
    context.clearRect(0, 0, width, height);
    context.save();
    if (screenShake && feedback.shakeAmount > 0) context.translate((Math.random() - 0.5) * feedback.shakeAmount, (Math.random() - 0.5) * feedback.shakeAmount);
    context.fillStyle = '#121a20';
    context.fillRect(0, 0, width, height);
    context.strokeStyle = 'rgba(255,255,255,0.045)';
    context.lineWidth = 1;
    for (let x = 0; x < width; x += 50) { context.beginPath(); context.moveTo(x, 0); context.lineTo(x, height); context.stroke(); }
    for (let y = 0; y < height; y += 50) { context.beginPath(); context.moveTo(0, y); context.lineTo(width, y); context.stroke(); }

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

    const wallY = height - TUNING.wallHeight;
    context.fillStyle = '#586f78';
    context.fillRect(0, wallY, width, TUNING.wallHeight);
    context.fillStyle = '#7b98a3';
    for (let x = 0; x < width; x += 48) context.fillRect(x + 4, wallY + 8, 34, 10);
    context.fillStyle = '#9c7654';
    context.fillRect(weapons.ballista.x - 14, weapons.ballista.y - 14, 28, 28);
    context.fillStyle = '#d8b479';
    context.fillRect(weapons.ballista.x - 3, weapons.ballista.y - 42, 6, 34);
    if (weapons.isBuilt('cannon')) { context.fillStyle = '#8a97a5'; context.fillRect(weapons.cannon.x - 13, weapons.cannon.y - 13, 26, 26); }
    if (weapons.isBuilt('fireTower')) { context.fillStyle = '#e16b45'; context.fillRect(weapons.fireTower.x - 11, weapons.fireTower.y - 11, 22, 22); }
    if (weapons.isBuilt('lightningTower')) { context.fillStyle = '#79b8e8'; context.fillRect(weapons.lightningTower.x - 10, weapons.lightningTower.y - 10, 20, 20); }

    const healthWidth = Math.max(0, (wallHp / wallMaxHp) * 180);
    context.fillStyle = '#181f22';
    context.fillRect(20, wallY - 22, 180, 10);
    context.fillStyle = wallHp > 35 ? '#6fcf97' : '#ef6b5e';
    context.fillRect(20, wallY - 22, healthWidth, 10);
    context.restore();
  }
}
