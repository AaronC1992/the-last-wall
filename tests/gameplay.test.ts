import { describe, expect, it, vi } from 'vitest';
import { CAMPAIGN_MAPS, validateCampaignEncounters } from '../src/map/CampaignMaps';
import { validateMap } from '../src/map/MapValidator';
import { EnemyType } from '../src/enemies/EnemyTypes';
import { ENEMY_BEHAVIOR } from '../src/enemies/EnemyBehavior';
import { META_UPGRADES } from '../src/progression/UpgradeDefinitions';
import { MetaProgression } from '../src/progression/MetaProgression';
import { Ballista } from '../src/weapons/Ballista';
import { Cannon } from '../src/weapons/Cannon';
import { SniperTower } from '../src/weapons/SniperTower';
import { TOWER_CONFIG } from '../src/weapons/TowerConfig';
import { cloneMapEditorSnapshot } from '../src/ui/MapBuilder';
import { migrateSave } from '../src/systems/SaveSystem';
import { WaveDirector } from '../src/systems/WaveDirector';
import { FlowField } from '../src/map/FlowField';
import { TerrainGrid } from '../src/map/TerrainGrid';
import { TerrainCell } from '../src/map/TerrainTypes';

function memoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
    clear: () => values.clear(),
    key: (index) => [...values.keys()][index] ?? null,
    get length() { return values.size; },
  };
}

describe('campaign encounters', () => {
  it('schedules delayed groups and respects burst size', () => {
    const director = new WaveDirector();
    const spawned: number[] = [];
    director.startCampaign({ groups: [{ type: EnemyType.Grunt, count: 20, startDelay: 0, spawnInterval: 1, burstSize: 5 }, { type: EnemyType.Runner, count: 5, startDelay: 10, spawnInterval: 1, burstSize: 5 }] });
    director.update(0.1, 0, (spawn) => spawned.push(spawn.type));
    expect(spawned).toHaveLength(5);
    expect(spawned).not.toContain(EnemyType.Runner);
    expect(director.isWaveCleared(0)).toBe(false);
    director.update(9.8, 0, (spawn) => spawned.push(spawn.type));
    expect(spawned).not.toContain(EnemyType.Runner);
    director.update(0.1, 0, (spawn) => spawned.push(spawn.type));
    expect(spawned).toContain(EnemyType.Runner);
  });

  it('restores the intended total horde scale', () => {
    const total = (level: number) => CAMPAIGN_MAPS[level - 1].encounter?.groups.reduce((sum, group) => sum + group.count, 0) ?? 0;
    expect(total(1)).toBeGreaterThanOrEqual(300);
    expect(total(1)).toBeLessThanOrEqual(400);
    expect(total(20)).toBeGreaterThanOrEqual(10000);
  });

  it('keeps level one as a pure grunt introduction', () => {
    expect(CAMPAIGN_MAPS[0].encounter?.groups.every((group) => group.type === EnemyType.Grunt)).toBe(true);
  });

  it('introduces Armored enemies by level five', () => {
    expect(CAMPAIGN_MAPS[4].encounter?.groups.some((group) => group.type === EnemyType.Armored)).toBe(true);
  });

  it('includes bosses on the first boss level', () => {
    expect(CAMPAIGN_MAPS[8].encounter?.groups.some((group) => group.type === EnemyType.Boss)).toBe(true);
  });

  it('uses every enemy category in the final assault', () => {
    const types = new Set(CAMPAIGN_MAPS[19].encounter?.groups.map((group) => group.type));
    expect([...types]).toEqual(expect.arrayContaining(Object.values(EnemyType)));
  });

  it('keeps Boss counts explicit and sane', () => {
    const bossCount = (level: number) => CAMPAIGN_MAPS[level - 1].encounter?.groups.filter((group) => group.type === EnemyType.Boss).reduce((sum, group) => sum + group.count, 0) ?? 0;
    expect(bossCount(9)).toBe(1);
    expect(bossCount(15)).toBe(2);
    expect(bossCount(20)).toBeGreaterThanOrEqual(1);
    expect(bossCount(20)).toBeLessThanOrEqual(5);
    expect(CAMPAIGN_MAPS.every((map) => bossCount(Number(map.id.slice(-2))) <= 5)).toBe(true);
  });

  it('validates every campaign encounter', () => {
    expect(validateCampaignEncounters()).toEqual([]);
  });

  it('gives Level 5 two spawn routes for the Armored introduction', () => {
    expect(CAMPAIGN_MAPS[4].spawnCells.length).toBeGreaterThanOrEqual(2);
  });

  it('paces Bosses as single arrivals', () => {
    for (const map of CAMPAIGN_MAPS) for (const group of map.encounter?.groups ?? []) if (group.type === EnemyType.Boss && group.count > 0) {
      expect(group.burstSize).toBe(1);
      expect(group.spawnInterval).toBeGreaterThanOrEqual(8);
    }
  });

  it('keeps every campaign spawn connected to its goal', () => {
    expect(CAMPAIGN_MAPS.every((map) => validateMap(map).valid)).toBe(true);
  });
});

describe('progression effects', () => {
  it('starts with one Ballista slot and one affordable Ballista', () => {
    vi.stubGlobal('localStorage', memoryStorage());
    const progression = new MetaProgression();
    expect(progression.bonuses.startingBuildPoints).toBe(60);
    expect(TOWER_CONFIG.find((config) => config.kind === 'ballista')?.limit).toBe(1);
  });

  it('consumes every defined meta upgrade through the bonuses getter', () => {
    vi.stubGlobal('localStorage', memoryStorage());
    const progression = new MetaProgression();
    const consumed = new Set<string>();
    const original = progression.getLevel.bind(progression);
    progression.getLevel = (id) => { consumed.add(id); return original(id); };
    void progression.bonuses;
    expect(META_UPGRADES.every((definition) => consumed.has(definition.id))).toBe(true);
  });

  it('changes Ballista cooldown with Ballista Mastery', () => {
    const ballista = new Ballista(0, 0);
    ballista.setTowerBonuses(1, 1, 1);
    ballista.reset();
    const base = (ballista as unknown as { cooldownDuration: number }).cooldownDuration;
    ballista.setTowerBonuses(1, 1.08, 1);
    ballista.reset();
    expect((ballista as unknown as { cooldownDuration: number }).cooldownDuration).toBeLessThan(base);
  });

  it('applies War Drums speed to Cannon', () => {
    const cannon = new Cannon(0, 0);
    cannon.setTowerBonuses(1, 1, 1);
    cannon.reset();
    const base = (cannon as unknown as { cooldownDuration: number }).cooldownDuration;
    cannon.setTowerBonuses(1, 1.03, 1);
    cannon.reset();
    expect((cannon as unknown as { cooldownDuration: number }).cooldownDuration).toBeLessThan(base);
  });

  it('keeps upgraded Cannon range above its base limit', () => {
    const cannon = new Cannon(0, 0);
    cannon.setTowerBonuses(1, 1, 1.16);
    cannon.reset();
    expect(cannon.targeting.maxDistance).toBeGreaterThan(620);
  });

  it('makes Cannon blast threat stronger than trajectory threat', () => {
    const cannon = new Cannon(0, 0);
    cannon.setAim(0, 300);
    expect(cannon.threatAtPoint(0, 300)).toBeGreaterThan(cannon.threatAtPoint(0, 150));
  });

  it('increases threat strength when Ballista is upgraded', () => {
    const ballista = new Ballista(0, 0);
    ballista.setTowerBonuses(1, 1, 1);
    const base = ballista.getThreatStrength();
    ballista.setTowerBonuses(1.5, 1.5, 1);
    ballista.setTowerSpecialBonuses({ penetration: 2, projectiles: 1, clusterShells: false, doubleBarrel: false, carpetBombardment: false, wildfire: false, teslaShock: false, teslaChains: 0, mortarBarrage: 0, sniperPenetration: 0 });
    expect(ballista.getThreatStrength()).toBeGreaterThan(base);
  });

  it('makes the weighted flow field prefer a safer longer route', () => {
    const width = 9;
    const height = 9;
    const terrain = new Uint8Array(width * height).fill(TerrainCell.Blocked);
    const path = (x: number, y: number) => { terrain[y * width + x] = TerrainCell.Path; };
    for (let y = 1; y <= 7; y++) { path(2, y); path(6, y); }
    for (let x = 2; x <= 6; x++) path(x, 7);
    terrain[7 * width + 4] = TerrainCell.Goal;
    const map = { version: 1 as const, id: 'flow-test', name: 'FLOW TEST', width, height, cellSize: 20, terrain: Array.from(terrain), spawnCells: [{ x: 2, y: 1 }, { x: 6, y: 1 }], goalCell: { x: 4, y: 7 }, enemySettings: { difficulty: 'normal' as const, enemyCount: 1, variety: 'basic' as const }, custom: true };
    const grid = new TerrainGrid(map);
    const threat = { at: (x: number) => x === 2 ? 20 : 0 };
    const normal = new FlowField(grid, map.goalCell);
    const armored = new FlowField(grid, map.goalCell, threat, 1.5);
    expect(normal.costs[grid.index(2, 1)]).toBeLessThan(armored.costs[grid.index(2, 1)]);
    expect(armored.costs[grid.index(6, 1)]).toBeLessThan(armored.costs[grid.index(2, 1)]);
  });

  it('uses the Sniper selected sector for threat coverage', () => {
    const sniper = new SniperTower(0, 0);
    sniper.setAim(0, 500);
    expect(sniper.isPointThreatened(0, 400)).toBe(true);
    expect(sniper.isPointThreatened(400, 0)).toBe(false);
  });
});

describe('save migration and editor snapshots', () => {
  it.each([1, 2, 3])('migrates version %s without losing tokens', (version) => {
    const migrated = migrateSave({ version, warTokens: 12, upgrades: { ballistaMastery: 2 }, statistics: { totalGold: 40 } });
    expect(migrated?.version).toBe(5);
    expect(migrated?.warTokens).toBe(12);
      expect(migrated?.statistics.totalBuildPoints).toBe(40);
      expect(migrated?.campaignRatings).toEqual({});
  });

    it('keeps the best campaign rating across replays', () => {
      vi.stubGlobal('localStorage', memoryStorage());
      const progression = new MetaProgression();
      expect(progression.completeCampaign('campaign-01', 2)).toBe(true);
      expect(progression.completeCampaign('campaign-01', 1)).toBe(false);
      expect(progression.campaignRating('campaign-01')).toBe(2);
      expect(progression.completeCampaign('campaign-01', 3)).toBe(true);
      expect(progression.campaignRating('campaign-01')).toBe(3);
    });

    it('does not reward slower completion with more tokens', () => {
      vi.stubGlobal('localStorage', memoryStorage());
      const progression = new MetaProgression();
      const fast = progression.awardTokens(500, 30, 0, 0, true, 0, 2, 5);
      const slow = progression.awardTokens(500, 300, 0, 0, true, 0, 2, 5);
      expect(slow.total).toBe(fast.total);
    });

  it('clones complete editor state for undo and redo', () => {
    const original = { terrain: [0, 1], spawns: [{ x: 1, y: 1 }], goal: { x: 2, y: 2 } };
    const clone = cloneMapEditorSnapshot(original);
    clone.terrain[0] = 2;
    clone.spawns.length = 0;
    clone.goal.x = 3;
    expect(original).toEqual({ terrain: [0, 1], spawns: [{ x: 1, y: 1 }], goal: { x: 2, y: 2 } });
  });
});

describe('enemy behavior', () => {
  it('gives Armored enemies greater threat weighting than Grunts', () => {
    expect(ENEMY_BEHAVIOR[EnemyType.Armored].threatWeight).toBeGreaterThan(ENEMY_BEHAVIOR[EnemyType.Grunt].threatWeight);
  });
});
