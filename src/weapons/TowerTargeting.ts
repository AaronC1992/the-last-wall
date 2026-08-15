export type TowerTargetMode = 'line' | 'area' | 'cone' | 'zone';

export interface TowerTargetingConfig {
  mode: TowerTargetMode;
  angle: number;
  distance: number;
  maxDistance: number;
  targetX: number;
  targetY: number;
  radius: number;
  width: number;
  coneAngle: number;
}

export function createTargeting(mode: TowerTargetMode, distance: number, radius = 0, coneAngle = 0.7): TowerTargetingConfig {
  return { mode, angle: -Math.PI / 2, distance, maxDistance: distance, targetX: 0, targetY: 0, radius, width: 8, coneAngle };
}
