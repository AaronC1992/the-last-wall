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
  private cannonBuilt = false;
  private fireBuilt = false;
  private lightningBuilt = false;

  constructor(wallY: number, width: number) {
    this.ballista = new Ballista(width / 2, wallY - 45);
    this.cannon = new Cannon(width * 0.24, wallY - 35);
    this.fireTower = new FireTower(width * 0.76, wallY - 35);
    this.lightningTower = new LightningTower(width * 0.62, wallY - 35);
  }

  update(deltaTime: number, enemies: EnemyManager, grid: SpatialGrid, projectiles: ProjectileManager, onKill: (reward: number) => void): void {
    this.ballista.update(deltaTime, enemies, grid, projectiles);
    if (this.cannonBuilt) this.cannon.update(deltaTime, enemies, grid, onKill);
    if (this.fireBuilt) this.fireTower.update(deltaTime, enemies, grid);
    if (this.lightningBuilt) this.lightningTower.update(deltaTime, enemies, grid, onKill);
  }

  applyUpgrade(kind: UpgradeKind): void {
    if (kind.startsWith('cannon')) this.cannon.applyUpgrade(kind);
    else if (kind.startsWith('fire') || kind === 'hellfire') this.fireTower.applyUpgrade(kind);
    else if (kind.startsWith('lightning') || kind === 'thunderstorm') this.lightningTower.applyUpgrade(kind);
    else this.ballista.applyUpgrade(kind);
  }

  reset(): void {
    this.ballista.reset();
    this.cannon.reset();
    this.fireTower.reset();
    this.lightningTower.reset();
    this.cannonBuilt = false;
    this.fireBuilt = false;
    this.lightningBuilt = false;
  }

  build(id: 'cannon' | 'fireTower' | 'lightningTower'): boolean {
    if (id === 'cannon' && !this.cannonBuilt) { this.cannonBuilt = true; return true; }
    if (id === 'fireTower' && !this.fireBuilt) { this.fireBuilt = true; return true; }
    if (id === 'lightningTower' && !this.lightningBuilt) { this.lightningBuilt = true; return true; }
    return false;
  }

  isBuilt(id: 'cannon' | 'fireTower' | 'lightningTower'): boolean {
    if (id === 'cannon') return this.cannonBuilt;
    if (id === 'fireTower') return this.fireBuilt;
    return this.lightningBuilt;
  }

  isTargetBuilt(target: 'ballista' | 'cannon' | 'fire' | 'lightning' | 'general'): boolean {
    if (target === 'ballista' || target === 'general') return true;
    if (target === 'cannon') return this.cannonBuilt;
    if (target === 'fire') return this.fireBuilt;
    return this.lightningBuilt;
  }

  setPermanentBonuses(damageMultiplier: number, speedMultiplier: number): void {
    this.ballista.setPermanentBonuses(damageMultiplier, speedMultiplier);
  }
}
