export const EnemyType = {
  Grunt: 0,
  Runner: 1,
  Brute: 2,
  Armored: 3,
  Exploder: 4,
  Boss: 5,
} as const;

export type EnemyTypeId = (typeof EnemyType)[keyof typeof EnemyType];
