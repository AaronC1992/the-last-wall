import { EnemyManager } from '../enemies/EnemyManager';
import { SpatialGrid } from '../systems/SpatialGrid';
import type { UpgradeKind } from '../systems/UpgradeDefinitions';
import { Ballista } from './Ballista';
import { Cannon } from './Cannon';
import { FireTower } from './FireTower';
import { LightningTower } from './LightningTower';
import { Mortar } from './Mortar';
import { ProjectileManager } from './ProjectileManager';
import { TowerBase } from './TowerBase';
import { towerConfig } from './TowerConfig';
import type { TowerKind } from './TowerConfig';
import type { TerrainGrid } from '../map/TerrainGrid';

export interface PlacedTower {
  id: number;
  kind: TowerKind;
  instance: TowerBase;
}

export interface TowerLayoutEntry {
  kind: TowerKind;
  x: number;
  y: number;
  aimed: boolean;
  targetX: number;
  targetY: number;
}

export const TOWER_FOOTPRINT = 20;

export class WeaponManager {
  private readonly placed: PlacedTower[] = [];
  private readonly appliedUpgrades: UpgradeKind[] = [];
  private readonly limitBonus: Record<TowerKind, number> = { ballista: 0, cannon: 0, fireTower: 0, lightningTower: 0, mortar: 0 };
  private readonly buildTop: number;
  private readonly buildBottom: number;
  private readonly buildRight: number;
  private readonly gateGuardCenterX: number;
  private readonly gateGuardRadius = 72;
  private readonly terrain: TerrainGrid;
  private nextId = 1;
  private permanentDamageMultiplier = 1;
  private permanentSpeedMultiplier = 1;

  constructor(wallY: number, width: number, terrain: TerrainGrid) {
    this.buildTop = TOWER_FOOTPRINT;
    this.buildBottom = wallY - 8;
    this.buildRight = width;
    this.gateGuardCenterX = width / 2;
    this.terrain = terrain;
  }

  get towers(): readonly PlacedTower[] {
    return this.placed;
  }

  allAimed(): boolean {
    return this.placed.every((tower) => tower.instance.hasAim);
  }

  exportLayout(): TowerLayoutEntry[] {
    return this.placed.map((tower) => ({ kind: tower.kind, x: tower.instance.x, y: tower.instance.y, aimed: tower.instance.hasAim, targetX: tower.instance.aimX, targetY: tower.instance.aimY }));
  }

  importLayout(layout: readonly TowerLayoutEntry[]): void {
    for (const entry of layout) {
      const tower = this.place(entry.kind, entry.x, entry.y);
      if (tower && entry.aimed) tower.instance.setAim(entry.targetX, entry.targetY);
    }
  }

  update(deltaTime: number, enemies: EnemyManager, grid: SpatialGrid, projectiles: ProjectileManager, onKill: (reward: number) => void): void {
    for (let index = 0; index < this.placed.length; index++) {
      const tower = this.placed[index].instance;
      if (tower instanceof Ballista) tower.update(deltaTime, enemies, grid, projectiles);
      else if (tower instanceof Cannon) tower.update(deltaTime, enemies, grid, onKill, projectiles);
      else if (tower instanceof FireTower) tower.update(deltaTime, enemies, grid);
      else if (tower instanceof LightningTower) tower.update(deltaTime, enemies, grid, onKill);
      else if (tower instanceof Mortar) tower.update(deltaTime, enemies, grid, projectiles);
    }
  }

  canPlaceAt(kind: TowerKind, x: number, y: number): boolean {
    return this.countOf(kind) < this.limitOf(kind) && this.isFreeSpot(x, y, -1);
  }

  place(kind: TowerKind, x: number, y: number): PlacedTower | null {
    if (!this.canPlaceAt(kind, x, y)) return null;
    const instance = this.createInstance(kind, x, y);
    for (const upgrade of this.appliedUpgrades) this.applyToInstance(kind, instance, upgrade);
    const tower: PlacedTower = { id: this.nextId++, kind, instance };
    this.placed.push(tower);
    return tower;
  }

  remove(id: number): TowerKind | null {
    const index = this.placed.findIndex((tower) => tower.id === id);
    if (index < 0) return null;
    const [removed] = this.placed.splice(index, 1);
    return removed.kind;
  }

  removeAll(): readonly TowerKind[] {
    const kinds = this.placed.map((tower) => tower.kind);
    this.placed.length = 0;
    return kinds;
  }

  findAt(x: number, y: number): PlacedTower | null {
    let closest: PlacedTower | null = null;
    let closestDistance = TOWER_FOOTPRINT * TOWER_FOOTPRINT;
    for (const tower of this.placed) {
      const deltaX = tower.instance.x - x;
      const deltaY = tower.instance.y - y;
      const distance = deltaX * deltaX + deltaY * deltaY;
      if (distance <= closestDistance) {
        closestDistance = distance;
        closest = tower;
      }
    }
    return closest;
  }

  byId(id: number): PlacedTower | null {
    return this.placed.find((tower) => tower.id === id) ?? null;
  }

  moveTower(id: number, x: number, y: number): boolean {
    const tower = this.byId(id);
    if (!tower || !this.isFreeSpot(x, y, id)) return false;
    tower.instance.moveTo(x, y);
    return true;
  }

  aimTower(id: number, x: number, y: number): void {
    this.byId(id)?.instance.setAim(x, y);
  }

  countOf(kind: TowerKind): number {
    let count = 0;
    for (const tower of this.placed) if (tower.kind === kind) count++;
    return count;
  }

  totalCost(): number {
    let total = 0;
    for (const tower of this.placed) total += towerConfig(tower.kind).cost;
    return total;
  }

  limitOf(kind: TowerKind): number {
    return towerConfig(kind).limit + this.limitBonus[kind];
  }

  setLimitBonus(kind: TowerKind, bonus: number): void {
    this.limitBonus[kind] = bonus;
  }

  applyUpgrade(kind: UpgradeKind): void {
    this.appliedUpgrades.push(kind);
    for (const tower of this.placed) this.applyToInstance(tower.kind, tower.instance, kind);
  }

  reset(): void {
    this.placed.length = 0;
    this.appliedUpgrades.length = 0;
    this.nextId = 1;
  }

  isBuilt(id: TowerKind): boolean {
    return this.countOf(id) > 0;
  }

  isTargetBuilt(target: 'ballista' | 'cannon' | 'fire' | 'lightning' | 'mortar' | 'general'): boolean {
    if (target === 'general') return true;
    if (target === 'ballista') return this.countOf('ballista') > 0;
    if (target === 'cannon') return this.countOf('cannon') > 0;
    if (target === 'fire') return this.countOf('fireTower') > 0;
    if (target === 'mortar') return this.countOf('mortar') > 0;
    return this.countOf('lightningTower') > 0;
  }

  handleBurnDeath(index: number, enemies: EnemyManager, grid: SpatialGrid): void {
    for (const tower of this.placed) {
      if (tower.instance instanceof FireTower) tower.instance.spreadFromDeath(enemies.x[index], enemies.y[index], enemies, grid);
    }
  }

  setPermanentBonuses(damageMultiplier: number, speedMultiplier: number): void {
    this.permanentDamageMultiplier = damageMultiplier;
    this.permanentSpeedMultiplier = speedMultiplier;
    for (const tower of this.placed) {
      if (tower.instance instanceof Ballista) tower.instance.setPermanentBonuses(damageMultiplier, speedMultiplier);
    }
  }

  clampToBuildZone(x: number, y: number): { x: number; y: number } {
    return {
      x: Math.min(this.buildRight - TOWER_FOOTPRINT, Math.max(TOWER_FOOTPRINT, x)),
      y: Math.min(this.buildBottom, Math.max(this.buildTop, y)),
    };
  }

  isInBuildZone(x: number, y: number): boolean {
    return x >= TOWER_FOOTPRINT && x <= this.buildRight - TOWER_FOOTPRINT && y >= this.buildTop && y <= this.buildBottom;
  }

  private isFreeSpot(x: number, y: number, ignoreId: number): boolean {
    if (!this.isInBuildZone(x, y)) return false;
    if (!this.terrain.isBuildableFootprint(x, y, TOWER_FOOTPRINT)) return false;
    if (Math.abs(x - this.gateGuardCenterX) < this.gateGuardRadius && y > this.buildBottom - 80) return false;
    const minimum = TOWER_FOOTPRINT * 1.6;
    for (const tower of this.placed) {
      if (tower.id === ignoreId) continue;
      if (Math.hypot(tower.instance.x - x, tower.instance.y - y) < minimum) return false;
    }
    return true;
  }

  private createInstance(kind: TowerKind, x: number, y: number): TowerBase {
    if (kind === 'cannon') return new Cannon(x, y);
    if (kind === 'fireTower') return new FireTower(x, y);
    if (kind === 'lightningTower') return new LightningTower(x, y);
    if (kind === 'mortar') return new Mortar(x, y);
    const ballista = new Ballista(x, y);
    ballista.setPermanentBonuses(this.permanentDamageMultiplier, this.permanentSpeedMultiplier);
    return ballista;
  }

  private applyToInstance(kind: TowerKind, instance: TowerBase, upgrade: UpgradeKind): void {
    if (upgrade.startsWith('cannon') || upgrade === 'carpetBombardment') {
      if (kind === 'cannon') (instance as Cannon).applyUpgrade(upgrade);
      return;
    }
    if (upgrade.startsWith('fire') || upgrade === 'hellfire') {
      if (kind === 'fireTower') (instance as FireTower).applyUpgrade(upgrade);
      return;
    }
    if (upgrade.startsWith('lightning') || upgrade === 'thunderstorm') {
      if (kind === 'lightningTower') (instance as LightningTower).applyUpgrade(upgrade);
      return;
    }
    if (upgrade.startsWith('mortar') || upgrade === 'doubleShot') {
      if (kind === 'mortar') (instance as Mortar).applyUpgrade(upgrade);
      return;
    }
    if (kind === 'ballista') (instance as Ballista).applyUpgrade(upgrade);
  }
}
