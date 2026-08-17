import { createMapDefinition } from './MapFactory';
import { EnemyType } from '../enemies/EnemyTypes';
import type { EnemyTypeId } from '../enemies/EnemyTypes';
import type { CampaignEncounter, MapDefinition, MapEnemySettings, MapPoint } from './TerrainTypes';

const route = (...points: MapPoint[]) => points;

const settings = (difficulty: MapEnemySettings['difficulty'], enemyCount: number, variety: MapEnemySettings['variety'] = 'mixed'): MapEnemySettings => ({ difficulty, enemyCount: Math.max(400, Math.round(enemyCount / 25)), variety, spawnBurst: difficulty === 'easy' ? 110 : difficulty === 'normal' ? 220 : 320, spawnInterval: difficulty === 'easy' ? 0.12 : difficulty === 'normal' ? 0.075 : difficulty === 'hard' ? 0.05 : 0.035 });
const goal = { x: 40, y: 46 };
const spawnLabels = (count: number): Record<string, number> => count === 1 ? { center: 0 } : count === 2 ? { west: 0, east: 1 } : count === 3 ? { west: 0, center: 1, east: 2 } : count === 4 ? { west: 0, westCenter: 1, eastCenter: 2, east: 3 } : { west: 0, westCenter: 1, center: 2, eastCenter: 3, east: 4 };

const campaignEncounter = (level: number): CampaignEncounter => {
  const totals = [350, 500, 700, 900, 1200, 1500, 1800, 2200, 2500, 3000, 3500, 4000, 4500, 5000, 5500, 6000, 6500, 7000, 8000, 10000];
  const total = totals[level - 1];
  const pacing = (type: EnemyTypeId): { spawnInterval: number; burstSize: number } => type === EnemyType.Grunt ? { spawnInterval: level === 1 ? 0.24 : 0.22, burstSize: 10 } : type === EnemyType.Runner ? { spawnInterval: 0.16, burstSize: 14 } : type === EnemyType.Brute ? { spawnInterval: 0.4, burstSize: 5 } : type === EnemyType.Armored ? { spawnInterval: 0.32, burstSize: 6 } : type === EnemyType.Exploder ? { spawnInterval: 0.3, burstSize: 5 } : { spawnInterval: 12, burstSize: 1 };
  const group = (type: EnemyTypeId, share: number, startDelay: number, announcement = '', eliteChance = 0, spawnPreference?: number | string): CampaignEncounter['groups'][number] => ({ type, count: Math.max(0, Math.round(total * share)), startDelay, ...pacing(type), announcement, eliteChance, spawnPreference });
  const bossGroup = (count: number, startDelay: number, announcement = 'BOSS APPROACHING', spawnPreference?: number | string): CampaignEncounter['groups'][number] => ({ type: EnemyType.Boss, count, startDelay, spawnInterval: 12, burstSize: 1, announcement, eliteChance: 0, spawnPreference });
  if (level === 1) return { groups: [group(EnemyType.Grunt, 1, 0, 'OPENING ASSAULT')], hpMultiplier: 1, speedMultiplier: 1 };
  if (level === 2) return { groups: [group(EnemyType.Grunt, 0.6, 0, 'OPENING ASSAULT'), group(EnemyType.Runner, 0.4, 18, 'RUNNERS INCOMING')], hpMultiplier: 1.02, speedMultiplier: 1.01 };
  if (level === 3) return { groups: [group(EnemyType.Grunt, 0.55, 0), group(EnemyType.Runner, 0.25, 16, 'RUNNERS INCOMING'), group(EnemyType.Grunt, 0.2, 34, 'SHORT PRESSURE WINDOW')], hpMultiplier: 1.04, speedMultiplier: 1.02 };
  if (level === 4) return { groups: [group(EnemyType.Grunt, 0.5, 0), group(EnemyType.Runner, 0.2, 18, 'RUNNERS INCOMING'), group(EnemyType.Brute, 0.3, 38, 'BRUTES INCOMING')], hpMultiplier: 1.07, speedMultiplier: 1.03 };
  if (level === 5) return { groups: [group(EnemyType.Grunt, 0.35, 0), group(EnemyType.Grunt, 0.2, 8, 'OPENING PRESSURE', 0, 1), group(EnemyType.Runner, 0.15, 16), group(EnemyType.Brute, 0.15, 34), group(EnemyType.Armored, 0.15, 52, 'ARMORED COLUMN', 0, 1)], hpMultiplier: 1.1, speedMultiplier: 1.04 };
  if (level === 6) return { groups: [group(EnemyType.Grunt, 0.35, 0), group(EnemyType.Runner, 0.15, 14), group(EnemyType.Armored, 0.3, 34, 'ARMORED FLANK', 0, 0), group(EnemyType.Brute, 0.2, 48, 'HEAVY PUSH', 0, 1)], hpMultiplier: 1.13, speedMultiplier: 1.05 };
  if (level === 7) return { groups: [group(EnemyType.Grunt, 0.35, 0), group(EnemyType.Runner, 0.15, 14), group(EnemyType.Armored, 0.15, 30), group(EnemyType.Brute, 0.15, 42), group(EnemyType.Exploder, 0.2, 56, 'EXPLODERS INCOMING')], hpMultiplier: 1.16, speedMultiplier: 1.06 };
  if (level === 8) return { groups: [group(EnemyType.Grunt, 0.3, 0, 'OPENING ASSAULT', 0.04), group(EnemyType.Runner, 0.2, 16, 'RUNNER ATTACK', 0.08), group(EnemyType.Brute, 0.15, 32, 'HEAVY PUSH', 0.06), group(EnemyType.Armored, 0.2, 46, 'ARMORED COLUMN', 0.08), group(EnemyType.Exploder, 0.15, 62, 'EXPLODERS INCOMING', 0.08)], hpMultiplier: 1.2, speedMultiplier: 1.07 };
  if (level === 9) return { groups: [group(EnemyType.Grunt, 0.35, 0), group(EnemyType.Runner, 0.2, 18, 'RUNNER PRESSURE'), group(EnemyType.Armored, 0.15, 36, 'ARMORED PUSH'), group(EnemyType.Brute, 0.1, 36), group(EnemyType.Exploder, 0.15, 52, 'EXPLODERS INCOMING'), bossGroup(1, 70)], hpMultiplier: 1.23, speedMultiplier: 1.08 };
  if (level === 10) return { groups: [group(EnemyType.Grunt, 0.28, 0), group(EnemyType.Runner, 0.16, 16), group(EnemyType.Armored, 0.25, 32, 'ARMORED ASSAULT', 0.04), group(EnemyType.Brute, 0.12, 42, 'HEAVY PUSH', 0.06), group(EnemyType.Exploder, 0.14, 54, 'EXPLODER RUSH', 0.08), bossGroup(1, 74)], hpMultiplier: 1.27, speedMultiplier: 1.09 };
  if (level <= 14) return { groups: [group(EnemyType.Grunt, 0.25, 0, 'OPENING ASSAULT', 0.08), group(EnemyType.Runner, 0.2, 14, 'RUNNER ATTACK', 0.15), group(EnemyType.Armored, 0.2, 30, 'ARMORED COLUMN', 0.15), group(EnemyType.Brute, 0.15, 42, 'HEAVY PUSH', 0.15), group(EnemyType.Exploder, 0.2, 56, 'EXPLODER RUSH', 0.14)], hpMultiplier: 1.3 + (level - 11) * 0.03, speedMultiplier: 1.1 + (level - 11) * 0.012 };
  if (level === 15) return { groups: [group(EnemyType.Grunt, 0.2, 0, 'OPENING ASSAULT', 0.2), group(EnemyType.Runner, 0.15, 14, 'ELITE RUNNERS', 0.3), group(EnemyType.Armored, 0.2, 28, 'ARMORED SIEGE', 0.3, 0), group(EnemyType.Brute, 0.15, 42, 'ELITE HEAVIES', 0.3, 1), group(EnemyType.Exploder, 0.15, 56, 'EXPLODER RUSH', 0.25), bossGroup(2, 72)], hpMultiplier: 1.42, speedMultiplier: 1.14 };
  if (level >= 16 && level <= 19) return { groups: [group(EnemyType.Armored, 0.22, 0, 'ARMORED FLANK', 0.25, 'west'), group(EnemyType.Brute, 0.16, 8, 'HEAVY PUSH', 0.25, 'west'), group(EnemyType.Grunt, 0.2, 18, 'CENTER ASSAULT', 0.2, 'center'), group(EnemyType.Runner, 0.2, 32, 'RUNNER FLANK', 0.3, 'east'), group(EnemyType.Exploder, 0.17, 46, 'EXPLODERS INCOMING', 0.3, 'east'), ...(level >= 18 ? [bossGroup(2, 66, 'BOSS APPROACHING', 'west')] : [])], hpMultiplier: 1.5 + (level - 16) * 0.06, speedMultiplier: 1.16 + (level - 16) * 0.02 };
  return { groups: [group(EnemyType.Grunt, 0.15, 0, 'OPENING HORDE', 0.3, 'center'), group(EnemyType.Runner, 0.12, 16, 'RUNNER ATTACK', 0.4, 'east'), group(EnemyType.Brute, 0.16, 30, 'HEAVY PUSH', 0.4, 'west'), group(EnemyType.Armored, 0.18, 44, 'ARMORED FLANK', 0.4, 'west'), group(EnemyType.Exploder, 0.14, 58, 'EXPLODER ASSAULT', 0.4, 'east'), group(EnemyType.Grunt, 0.1, 72, 'MASS REINFORCEMENTS', 0.35, 'center'), group(EnemyType.Armored, 0.1, 84, 'FINAL ARMORED PUSH', 0.45, 'west'), bossGroup(4, 98, 'BOSS APPROACHING', 'west'), group(EnemyType.Grunt, 0.1, 114, 'FINAL PUSH', 0.4, 'center')], hpMultiplier: 1.65, speedMultiplier: 1.22 };
};

const CAMPAIGN_MAPS_BASE: readonly MapDefinition[] = [
  createMapDefinition('campaign-01', 'THE LONG APPROACH', [route({ x: 40, y: 1 }, { x: 20, y: 8 }, { x: 58, y: 17 }, { x: 28, y: 27 }, { x: 52, y: 37 }, goal)], [{ x: 40, y: 1 }], goal, settings('easy', 10000, 'basic'), 201),

  createMapDefinition('campaign-02', 'THE WIDE BEND', [route({ x: 14, y: 1 }, { x: 14, y: 12 }, { x: 66, y: 22 }, { x: 22, y: 32 }, goal)], [{ x: 14, y: 1 }], goal, settings('normal', 20000, 'basic'), 202),
  createMapDefinition('campaign-03', 'THE WATCHTOWER ROAD', [route({ x: 66, y: 1 }, { x: 66, y: 13 }, { x: 26, y: 22 }, { x: 55, y: 32 }, goal)], [{ x: 66, y: 1 }], goal, settings('normal', 30000), 203, 2),
  createMapDefinition('campaign-04', 'THE SERPENT ROAD', [route({ x: 40, y: 1 }, { x: 66, y: 8 }, { x: 14, y: 17 }, { x: 66, y: 27 }, { x: 16, y: 37 }, goal)], [{ x: 40, y: 1 }], goal, settings('normal', 40000), 204),
  createMapDefinition('campaign-05', 'THE GATEWAY', [route({ x: 12, y: 1 }, { x: 12, y: 12 }, { x: 28, y: 25 }, { x: 40, y: 38 }, goal), route({ x: 68, y: 1 }, { x: 68, y: 12 }, { x: 52, y: 25 }, { x: 40, y: 38 }, goal)], [{ x: 12, y: 1 }, { x: 68, y: 1 }], goal, settings('normal', 50000), 205),
  createMapDefinition('campaign-06', 'THE FORKED ROAD', [route({ x: 20, y: 1 }, { x: 20, y: 16 }, { x: 40, y: 27 }, goal), route({ x: 60, y: 1 }, { x: 60, y: 16 }, { x: 40, y: 27 }, goal)], [{ x: 20, y: 1 }, { x: 60, y: 1 }], goal, settings('normal', 60000), 206),
  createMapDefinition('campaign-07', 'THE THREE BRIDGES', [route({ x: 8, y: 1 }, { x: 8, y: 14 }, { x: 40, y: 27 }, goal), route({ x: 40, y: 1 }, { x: 40, y: 14 }, { x: 40, y: 27 }, goal), route({ x: 72, y: 1 }, { x: 72, y: 14 }, { x: 40, y: 27 }, goal)], [{ x: 8, y: 1 }, { x: 40, y: 1 }, { x: 72, y: 1 }], goal, settings('normal', 70000), 207),
  createMapDefinition('campaign-08', 'THE OUTER RING', [route({ x: 12, y: 1 }, { x: 12, y: 18 }, { x: 68, y: 30 }, goal), route({ x: 68, y: 1 }, { x: 68, y: 18 }, { x: 12, y: 30 }, goal)], [{ x: 12, y: 1 }, { x: 68, y: 1 }], goal, settings('normal', 80000), 208, 2),
  createMapDefinition('campaign-09', 'THE CROSSING', [route({ x: 10, y: 1 }, { x: 10, y: 12 }, { x: 58, y: 25 }, goal), route({ x: 70, y: 1 }, { x: 70, y: 12 }, { x: 22, y: 25 }, goal)], [{ x: 10, y: 1 }, { x: 70, y: 1 }], goal, settings('normal', 90000), 209),
  createMapDefinition('campaign-10', 'THE FOUR WINDS', [route({ x: 10, y: 1 }, { x: 10, y: 17 }, { x: 40, y: 29 }, goal), route({ x: 70, y: 1 }, { x: 70, y: 17 }, { x: 40, y: 29 }, goal), route({ x: 28, y: 1 }, { x: 28, y: 11 }, { x: 40, y: 29 }, goal), route({ x: 52, y: 1 }, { x: 52, y: 11 }, { x: 40, y: 29 }, goal)], [{ x: 10, y: 1 }, { x: 28, y: 1 }, { x: 52, y: 1 }, { x: 70, y: 1 }], goal, settings('hard', 100000), 210),
  createMapDefinition('campaign-11', 'THE BRAIDED VALLEY', [route({ x: 8, y: 1 }, { x: 8, y: 18 }, { x: 28, y: 31 }, goal), route({ x: 40, y: 1 }, { x: 40, y: 18 }, { x: 52, y: 31 }, goal), route({ x: 72, y: 1 }, { x: 72, y: 18 }, { x: 52, y: 31 }, goal)], [{ x: 8, y: 1 }, { x: 40, y: 1 }, { x: 72, y: 1 }], goal, settings('hard', 110000), 211),
  createMapDefinition('campaign-12', 'THE SPLIT CANYON', [route({ x: 10, y: 1 }, { x: 10, y: 15 }, { x: 32, y: 25 }, { x: 40, y: 36 }, goal), route({ x: 70, y: 1 }, { x: 70, y: 15 }, { x: 48, y: 25 }, { x: 40, y: 36 }, goal)], [{ x: 10, y: 1 }, { x: 70, y: 1 }], goal, settings('hard', 120000), 212, 2),
  createMapDefinition('campaign-13', 'THE FIVE LANTERNS', [route({ x: 8, y: 1 }, { x: 8, y: 14 }, { x: 30, y: 26 }, goal), route({ x: 26, y: 1 }, { x: 26, y: 14 }, { x: 36, y: 26 }, goal), route({ x: 54, y: 1 }, { x: 54, y: 14 }, { x: 44, y: 26 }, goal), route({ x: 72, y: 1 }, { x: 72, y: 14 }, { x: 50, y: 26 }, goal)], [{ x: 8, y: 1 }, { x: 26, y: 1 }, { x: 54, y: 1 }, { x: 72, y: 1 }], goal, settings('hard', 130000), 213),
  createMapDefinition('campaign-14', 'THE DEEP MAZE', [route({ x: 8, y: 1 }, { x: 8, y: 10 }, { x: 68, y: 20 }, { x: 12, y: 31 }, goal), route({ x: 72, y: 1 }, { x: 72, y: 10 }, { x: 12, y: 20 }, { x: 68, y: 31 }, goal), route({ x: 40, y: 1 }, { x: 40, y: 12 }, { x: 40, y: 31 }, goal)], [{ x: 8, y: 1 }, { x: 40, y: 1 }, { x: 72, y: 1 }], goal, settings('hard', 140000), 214),
  createMapDefinition('campaign-15', 'THE SIEGEWORKS', [route({ x: 8, y: 1 }, { x: 8, y: 20 }, { x: 30, y: 34 }, goal), route({ x: 26, y: 1 }, { x: 26, y: 18 }, { x: 38, y: 34 }, goal), route({ x: 54, y: 1 }, { x: 54, y: 18 }, { x: 42, y: 34 }, goal), route({ x: 72, y: 1 }, { x: 72, y: 20 }, { x: 50, y: 34 }, goal)], [{ x: 8, y: 1 }, { x: 26, y: 1 }, { x: 54, y: 1 }, { x: 72, y: 1 }], goal, settings('hard', 150000, 'elite'), 215),
  createMapDefinition('campaign-16', 'THE STORM FRONT', [route({ x: 8, y: 1 }, { x: 8, y: 12 }, { x: 64, y: 23 }, { x: 18, y: 35 }, goal), route({ x: 72, y: 1 }, { x: 72, y: 12 }, { x: 16, y: 23 }, { x: 62, y: 35 }, goal), route({ x: 28, y: 1 }, { x: 28, y: 16 }, { x: 40, y: 30 }, goal), route({ x: 52, y: 1 }, { x: 52, y: 16 }, { x: 40, y: 30 }, goal)], [{ x: 8, y: 1 }, { x: 28, y: 1 }, { x: 52, y: 1 }, { x: 72, y: 1 }], goal, settings('insane', 160000, 'elite'), 216, 2),
  createMapDefinition('campaign-17', 'THE FIVE FANGS', [route({ x: 6, y: 1 }, { x: 6, y: 15 }, { x: 28, y: 28 }, goal), route({ x: 22, y: 1 }, { x: 22, y: 13 }, { x: 36, y: 28 }, goal), route({ x: 40, y: 1 }, { x: 40, y: 13 }, { x: 40, y: 28 }, goal), route({ x: 58, y: 1 }, { x: 58, y: 13 }, { x: 44, y: 28 }, goal), route({ x: 74, y: 1 }, { x: 74, y: 15 }, { x: 52, y: 28 }, goal)], [{ x: 6, y: 1 }, { x: 22, y: 1 }, { x: 40, y: 1 }, { x: 58, y: 1 }, { x: 74, y: 1 }], goal, settings('insane', 170000, 'elite'), 217),
  createMapDefinition('campaign-18', 'THE MIRROR PASS', [route({ x: 8, y: 1 }, { x: 8, y: 18 }, { x: 66, y: 30 }, goal), route({ x: 72, y: 1 }, { x: 72, y: 18 }, { x: 14, y: 30 }, goal), route({ x: 26, y: 1 }, { x: 26, y: 10 }, { x: 54, y: 22 }, { x: 40, y: 36 }, goal), route({ x: 54, y: 1 }, { x: 54, y: 10 }, { x: 26, y: 22 }, { x: 40, y: 36 }, goal)], [{ x: 8, y: 1 }, { x: 26, y: 1 }, { x: 54, y: 1 }, { x: 72, y: 1 }], goal, settings('insane', 180000, 'elite'), 218),
  createMapDefinition('campaign-19', 'THE LAST LABYRINTH', [route({ x: 6, y: 1 }, { x: 6, y: 12 }, { x: 70, y: 23 }, { x: 16, y: 35 }, goal), route({ x: 22, y: 1 }, { x: 22, y: 16 }, { x: 58, y: 27 }, goal), route({ x: 58, y: 1 }, { x: 58, y: 16 }, { x: 22, y: 27 }, goal), route({ x: 74, y: 1 }, { x: 74, y: 12 }, { x: 10, y: 23 }, { x: 64, y: 35 }, goal)], [{ x: 6, y: 1 }, { x: 22, y: 1 }, { x: 58, y: 1 }, { x: 74, y: 1 }], goal, settings('insane', 190000, 'elite'), 219),
  createMapDefinition('campaign-20', 'THE TWENTYFOLD WALL', [route({ x: 6, y: 1 }, { x: 6, y: 14 }, { x: 28, y: 25 }, { x: 12, y: 36 }, goal), route({ x: 22, y: 1 }, { x: 22, y: 12 }, { x: 42, y: 24 }, { x: 30, y: 36 }, goal), route({ x: 40, y: 1 }, { x: 40, y: 12 }, { x: 40, y: 24 }, { x: 40, y: 36 }, goal), route({ x: 58, y: 1 }, { x: 58, y: 12 }, { x: 38, y: 24 }, { x: 50, y: 36 }, goal), route({ x: 74, y: 1 }, { x: 74, y: 14 }, { x: 52, y: 25 }, { x: 68, y: 36 }, goal)], [{ x: 6, y: 1 }, { x: 22, y: 1 }, { x: 40, y: 1 }, { x: 58, y: 1 }, { x: 74, y: 1 }], goal, settings('insane', 200000, 'elite'), 220),
];

export const CAMPAIGN_MAPS: readonly MapDefinition[] = CAMPAIGN_MAPS_BASE.map((map, index) => ({
  ...map,
  spawnLabels: spawnLabels(map.spawnCells.length),
  encounter: campaignEncounter(index + 1),
  baseBuildPointBonus: index * 10,
  firstClearReward: 3 + index * 2,
  baseTokenReward: 2 + Math.floor(index / 2),
}));

export function validateCampaignEncounters(maps: readonly MapDefinition[] = CAMPAIGN_MAPS): string[] {
  const errors: string[] = [];
  for (const map of maps) {
    const groups = map.encounter?.groups ?? [];
    if (groups.length === 0) errors.push(`${map.id}: encounter is empty`);
    let bossCount = 0;
    for (const group of groups) {
      if (!Number.isFinite(group.count) || group.count < 0) errors.push(`${map.id}: invalid count`);
      if ((group.burstSize ?? 1) < 1 || (group.spawnInterval ?? 0) <= 0 || (group.startDelay ?? 0) < 0) errors.push(`${map.id}: invalid pacing`);
      if ((group.eliteChance ?? 0) < 0 || (group.eliteChance ?? 0) > 1) errors.push(`${map.id}: invalid elite chance`);
      if (group.type === EnemyType.Boss) bossCount += group.count;
    }
    if (bossCount > 5) errors.push(`${map.id}: boss count exceeds five`);
  }
  return errors;
}

export const DEFAULT_CAMPAIGN_MAP = CAMPAIGN_MAPS[0];
