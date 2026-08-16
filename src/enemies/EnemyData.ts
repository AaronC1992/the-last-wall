import { EnemyType } from './EnemyTypes';
import type { EnemyTypeId } from './EnemyTypes';

export interface EnemyDefinition {
  hp: number;
  speed: number;
  armor: number;
  radius: number;
  reward: number;
  wallDamage: number;
  color: string;
}

export const ENEMY_DATA: Record<EnemyTypeId, EnemyDefinition> = {
  [EnemyType.Grunt]: { hp: 10, speed: 28, armor: 0, radius: 6, reward: 1, wallDamage: 4, color: '#d84b48' },
  [EnemyType.Runner]: { hp: 7, speed: 54, armor: 0, radius: 5, reward: 2, wallDamage: 3, color: '#ee9a4d' },
  [EnemyType.Brute]: { hp: 52, speed: 15, armor: 1, radius: 12, reward: 8, wallDamage: 11, color: '#a6465d' },
  [EnemyType.Armored]: { hp: 30, speed: 23, armor: 3, radius: 8, reward: 6, wallDamage: 7, color: '#8a97a5' },
  [EnemyType.Exploder]: { hp: 16, speed: 39, armor: 0, radius: 7, reward: 5, wallDamage: 18, color: '#e5c553' },
  [EnemyType.Boss]: { hp: 500, speed: 11, armor: 4, radius: 22, reward: 100, wallDamage: 30, color: '#8753b4' },
};
