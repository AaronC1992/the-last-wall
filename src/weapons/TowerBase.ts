import { createTargeting } from './TowerTargeting';
import type { TowerTargetMode, TowerTargetingConfig } from './TowerTargeting';

export abstract class TowerBase {
  x: number;
  y: number;
  aimX = 0;
  aimY = 0;
  hasAim = false;
  facing = -Math.PI / 2;
  protected towerDamageMultiplier = 1;
  protected towerSpeedMultiplier = 1;
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

  setTowerBonuses(damageMultiplier: number, speedMultiplier: number): void {
    this.towerDamageMultiplier = damageMultiplier;
    this.towerSpeedMultiplier = speedMultiplier;
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
}
