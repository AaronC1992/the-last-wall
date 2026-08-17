import { createTargeting } from './TowerTargeting';
import type { TowerTargetMode, TowerTargetingConfig } from './TowerTargeting';

export interface TowerSpecialBonuses {
  penetration: number;
  projectiles: number;
  clusterShells: boolean;
  doubleBarrel: boolean;
  carpetBombardment: boolean;
  wildfire: boolean;
  teslaShock: boolean;
  teslaChains: number;
  mortarBarrage: number;
  sniperPenetration: number;
}

export const EMPTY_TOWER_SPECIAL_BONUSES: TowerSpecialBonuses = { penetration: 0, projectiles: 0, clusterShells: false, doubleBarrel: false, carpetBombardment: false, wildfire: false, teslaShock: false, teslaChains: 0, mortarBarrage: 0, sniperPenetration: 0 };

export abstract class TowerBase {
  x: number;
  y: number;
  aimX = 0;
  aimY = 0;
  hasAim = false;
  facing = -Math.PI / 2;
  protected towerDamageMultiplier = 1;
  protected towerSpeedMultiplier = 1;
  protected towerRangeMultiplier = 1;
  protected towerSpecialBonuses: TowerSpecialBonuses = EMPTY_TOWER_SPECIAL_BONUSES;
  readonly targeting: TowerTargetingConfig;

  constructor(x: number, y: number, mode: TowerTargetMode, distance: number, radius = 0, coneAngle = 0.7) {
    this.x = x;
    this.y = y;
    this.targeting = createTargeting(mode, distance, radius, coneAngle);
  }

  abstract reset(): void;

  moveTo(x: number, y: number): void {
    if (this.hasAim) {
      const offsetX = this.aimX - this.x;
      const offsetY = this.aimY - this.y;
      this.aimX = x + offsetX;
      this.aimY = y + offsetY;
      if (this.targeting.mode === 'area' || this.targeting.mode === 'zone') {
        this.targeting.targetX = this.aimX;
        this.targeting.targetY = this.aimY;
      }
    }
    this.x = x;
    this.y = y;
  }

  setAim(x: number, y: number): void {
    let deltaX = x - this.x;
    let deltaY = y - this.y;
    let distance = Math.hypot(deltaX, deltaY);
    if (distance < 0.001) {
      deltaX = 0;
      deltaY = -100;
      distance = 100;
    }
    const clamped = Math.min(distance, this.targeting.maxDistance);
    this.aimX = this.x + (deltaX / distance) * clamped;
    this.aimY = this.y + (deltaY / distance) * clamped;
    this.hasAim = true;
    this.facing = Math.atan2(deltaY, deltaX);
    this.targeting.angle = this.facing;
    if (this.targeting.mode === 'line' || this.targeting.mode === 'cone') this.targeting.distance = clamped;
    this.targeting.targetX = this.aimX;
    this.targeting.targetY = this.aimY;
  }

  clearAim(): void {
    this.hasAim = false;
  }

  setTowerBonuses(damageMultiplier: number, speedMultiplier: number, rangeMultiplier = 1): void {
    this.towerDamageMultiplier = damageMultiplier;
    this.towerSpeedMultiplier = speedMultiplier;
    this.towerRangeMultiplier = rangeMultiplier;
  }

  setTowerSpecialBonuses(specialBonuses: TowerSpecialBonuses): void {
    this.towerSpecialBonuses = specialBonuses;
  }

  get range(): number {
    return this.targeting.distance;
  }

  aimPoint(): { x: number; y: number } {
    return { x: this.aimX, y: this.aimY };
  }

  direction(): { x: number; y: number } {
    return { x: Math.cos(this.targeting.angle), y: Math.sin(this.targeting.angle) };
  }

  isInFixedCone(x: number, y: number, range = this.targeting.distance): boolean {
    const deltaX = x - this.x;
    const deltaY = y - this.y;
    const distance = Math.hypot(deltaX, deltaY);
    if (distance > range) return false;
    const difference = Math.atan2(Math.sin(Math.atan2(deltaY, deltaX) - this.targeting.angle), Math.cos(Math.atan2(deltaY, deltaX) - this.targeting.angle));
    return Math.abs(difference) <= this.targeting.coneAngle * 0.5;
  }

  isPointThreatened(x: number, y: number, cellPadding = 0): boolean {
    if (this.targeting.mode === 'line') {
      const along = (x - this.x) * Math.cos(this.targeting.angle) + (y - this.y) * Math.sin(this.targeting.angle);
      const across = Math.abs((x - this.x) * Math.sin(this.targeting.angle) - (y - this.y) * Math.cos(this.targeting.angle));
      return along >= 0 && along <= this.targeting.distance && across <= this.targeting.width + cellPadding;
    }
    if (this.targeting.mode === 'cone') return this.isInFixedCone(x, y);
    const radius = this.targeting.radius + cellPadding;
    return Math.hypot(x - this.targeting.targetX, y - this.targeting.targetY) <= radius;
  }
}
