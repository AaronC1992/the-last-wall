export const GAME_TEXT = {
  title: 'THE LAST WALL',
  phase: 'Phase 7 Final Defense',
  restart: 'Restart Run',
  gameOver: 'The Wall Has Fallen',
} as const;

export const TUNING = {
  logicalWidth: 1200,
  logicalHeight: 760,
  wallHeight: 58,
  wallMaxHp: 100,
  enemyBaseHp: 10,
  enemyBaseSpeed: 28,
  enemyRadius: 7,
  enemyWallDamage: 4,
  ballistaDamage: 5,
  ballistaCooldown: 0.36,
  ballistaRange: 500,
  projectileSpeed: 660,
  projectileLifetime: 1.5,
  maxEnemies: 12000,
  maxProjectiles: 2048,
  spatialCellSize: 64,
  fixedStep: 1 / 60,
  maxFrameTime: 0.1,
} as const;
