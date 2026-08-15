import { EnemyType } from './EnemyTypes';
import type { EnemyTypeId } from './EnemyTypes';

export interface EnemyBehaviorDefinition {
  distanceWeight: number;
  congestionWeight: number;
  threatWeight: number;
  steeringResponsiveness: number;
  wallAvoidance: number;
  routeCommitment: number;
  smartRouting: boolean;
  prefersShortRoutes: boolean;
}

const STANDARD: EnemyBehaviorDefinition = { distanceWeight: 1, congestionWeight: 0.15, threatWeight: 0.05, steeringResponsiveness: 7, wallAvoidance: 0.8, routeCommitment: 0.75, smartRouting: false, prefersShortRoutes: false };

export const ENEMY_BEHAVIOR: Record<EnemyTypeId, EnemyBehaviorDefinition> = {
  [EnemyType.Grunt]: STANDARD,
  [EnemyType.Runner]: { ...STANDARD, distanceWeight: 1.5, congestionWeight: 0.03, threatWeight: 0, steeringResponsiveness: 11, prefersShortRoutes: true },
  [EnemyType.Brute]: { ...STANDARD, congestionWeight: 0.2, steeringResponsiveness: 4.5 },
  [EnemyType.Armored]: { ...STANDARD, distanceWeight: 0.9, congestionWeight: 0.25, threatWeight: 1.2, steeringResponsiveness: 5.5, routeCommitment: 0.95, smartRouting: true },
  [EnemyType.Exploder]: { ...STANDARD, distanceWeight: 1.8, congestionWeight: 0.02, threatWeight: 0, steeringResponsiveness: 10, prefersShortRoutes: true },
  [EnemyType.Boss]: { ...STANDARD, distanceWeight: 0.8, congestionWeight: 0.3, threatWeight: 1.5, steeringResponsiveness: 3.5, wallAvoidance: 1.1, routeCommitment: 1.1, smartRouting: true },
};
