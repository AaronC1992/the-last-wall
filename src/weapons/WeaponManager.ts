import { EnemyManager } from '../enemies/EnemyManager';
import { SpatialGrid } from '../systems/SpatialGrid';
import type { UpgradeKind } from '../systems/UpgradeDefinitions';
import { Ballista } from './Ballista';
import { Cannon } from './Cannon';
import { FireTower } from './FireTower';
import { LightningTower } from './LightningTower';
import { ProjectileManager } from './ProjectileManager';

export class WeaponManager {
  readonly ballista: Ballista;
  readonly cannon: Cannon;
  readonly fireTower: FireTower;
  readonly lightningTower: LightningTower;

  constructor(wallY: number, width: number) {
    this.ballista = new Ballista(width / 2, wallY - 45);
    this.cannon = new Cannon(width * 0.24, wallY - 35);
    this.fireTower = new FireTower(width * 0.76, wallY - 35);
    this.lightningTower = new LightningTower(width * 0.62, wallY - 35);
  }

  update(deltaTime: number, enemies: EnemyManager, grid: SpatialGrid, projectiles: ProjectileManager, onKill: (reward: number) => void): void {
    this.ballista.update(deltaTime, enemies, grid, projectiles);
    this.cannon.update(deltaTime, enemies, grid, onKill);
    this.fireTower.update(deltaTime, enemies, grid);
    this.lightningTower.update(deltaTime, enemies, grid, onKill);
  }

  applyUpgrade(kind: UpgradeKind): void {
    this.ballista.applyUpgrade(kind);
  }

  reset(): void {
    this.ballista.reset();
  }

  setPermanentBonuses(damageMultiplier: number, speedMultiplier: number): void {
    this.ballista.setPermanentBonuses(damageMultiplier, speedMultiplier);
  }
}
