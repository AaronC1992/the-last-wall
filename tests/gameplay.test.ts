import { describe, expect, it, vi } from 'vitest';
import { CAMPAIGN_MAPS } from '../src/map/CampaignMaps';
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
    expect(migrated?.version).toBe(4);
    expect(migrated?.warTokens).toBe(12);
    expect(migrated?.statistics.totalBuildPoints).toBe(40);
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
