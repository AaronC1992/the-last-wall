import { EnemyManager } from '../enemies/EnemyManager';
import { SpatialGrid } from '../systems/SpatialGrid';
import type { UpgradeKind } from '../systems/UpgradeDefinitions';
import { Ballista } from './Ballista';
import { Cannon } from './Cannon';
import { FireTower } from './FireTower';
import { LightningTower } from './LightningTower';
import { ProjectileManager } from './ProjectileManager';
import { KING_APPROACH } from '../map/MapConfig';

export class WeaponManager {
  readonly ballista: Ballista;
  readonly cannon: Cannon;
  readonly fireTower: FireTower;
  readonly lightningTower: LightningTower;
  private cannonBuilt = false;
  private fireBuilt = false;
  private lightningBuilt = false;

  constructor(_wallY: number, _width: number) {
    const pads = KING_APPROACH.towerPads;
    const pad = (kind: typeof pads[number]['kind']) => pads.find((towerPad) => towerPad.kind === kind)!;
    this.ballista = new Ballista(pad('ballista').x, pad('ballista').y);
    this.cannon = new Cannon(pad('cannon').x, pad('cannon').y);
    this.fireTower = new FireTower(pad('fireTower').x, pad('fireTower').y);
    this.lightningTower = new LightningTower(pad('lightningTower').x, pad('lightningTower').y);
  }

  update(deltaTime: number, enemies: EnemyManager, grid: SpatialGrid, projectiles: ProjectileManager, onKill: (reward: number) => void): void {
    this.ballista.update(deltaTime, enemies, grid, projectiles);
    if (this.cannonBuilt) this.cannon.update(deltaTime, enemies, grid, onKill);
    if (this.fireBuilt) this.fireTower.update(deltaTime, enemies, grid);
    if (this.lightningBuilt) this.lightningTower.update(deltaTime, enemies, grid, onKill);
  }

  applyUpgrade(kind: UpgradeKind): void {
    if (kind.startsWith('cannon') || kind === 'carpetBombardment') this.cannon.applyUpgrade(kind);
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

  handleBurnDeath(index: number, enemies: EnemyManager, grid: SpatialGrid): void {
    if (!this.fireBuilt) return;
    this.fireTower.spreadFromDeath(enemies.x[index], enemies.y[index], enemies, grid);
  }

  setPermanentBonuses(damageMultiplier: number, speedMultiplier: number): void {
    this.ballista.setPermanentBonuses(damageMultiplier, speedMultiplier);
  }
}
