import { EnemyManager } from '../enemies/EnemyManager';
import { SpatialGrid } from '../systems/SpatialGrid';
import { TowerBase } from './TowerBase';
import { ProjectileManager } from './ProjectileManager';

export class Cannon extends TowerBase {
  private cooldown = 1.8;
  private cooldownDuration = 1.8;
  private damage = 32;
  private radius = 70;
  private clusterShells = false;
  private doubleBarrel = false;
  private carpetBombardment = false;

  constructor(x: number, y: number) {
    super(x, y, 'line', 620);
  }

  get range(): number {
    return 620;
  }

  update(deltaTime: number, _enemies: EnemyManager, _grid: SpatialGrid, _onKill: (reward: number) => void, projectiles: ProjectileManager): void {
    this.cooldown -= deltaTime;
    if (this.cooldown > 0) return;
    if (!this.hasAim) return;
    const direction = this.direction();
    projectiles.fireShell(this.x, this.y, direction.x, direction.y, this.damage, 340, this.targeting.distance, this.radius);
    if (this.clusterShells || this.carpetBombardment) projectiles.fireShell(this.x, this.y, direction.x, direction.y, this.damage * 0.6, 340, Math.max(30, this.targeting.distance - 42), this.radius * 0.62);
    if (this.doubleBarrel) projectiles.fireShell(this.x, this.y, direction.x, direction.y, this.damage, 340, Math.min(620, this.targeting.distance + 26), this.radius);
    this.cooldown = this.cooldownDuration;
  }

  reset(): void {
    this.cooldown = 1.8;
    this.cooldownDuration = 1.8;
    this.damage = 32;
    this.radius = 70;
    this.clusterShells = false;
    this.doubleBarrel = false;
    this.carpetBombardment = false;
    this.targeting.maxDistance = 620;
    this.targeting.distance = 620;
  }

  applyUpgrade(id: string): void {
    if (id === 'cannonDamage') this.damage *= 1.25;
    else if (id === 'cannonRadius') this.radius *= 1.25;
    else if (id === 'cannonRange') { this.targeting.maxDistance *= 1.2; this.targeting.distance = this.targeting.maxDistance; }
    else if (id === 'cannonSpeed') this.cooldownDuration *= 0.8;
    else if (id === 'clusterShells') this.clusterShells = true;
    else if (id === 'doubleBarrel') this.doubleBarrel = true;
    else if (id === 'carpetBombardment') this.carpetBombardment = true;
  }

}
