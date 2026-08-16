import { META_UPGRADES } from './UpgradeDefinitions';
import type { MetaUpgradeId } from './UpgradeDefinitions';
import { FEATURE_UNLOCKS } from './FeatureUnlocks';
import type { FeatureUnlockId } from './FeatureUnlocks';

export type SkillBranch = 'core' | 'offense' | 'defense' | 'economy' | 'arcane' | 'abilities';

export interface SkillNode {
  id: string;
  kind: 'core' | 'upgrade' | 'unlock';
  branch: SkillBranch;
  title: string;
  description: string;
  maxLevel: number;
  x: number;
  y: number;
  parent: string | null;
}

export const BRANCH_COLORS: Record<SkillBranch, string> = {
  core: '#e8eef4',
  offense: '#4fa3f0',
  defense: '#e0803c',
  economy: '#d8c14a',
  arcane: '#d45fa8',
  abilities: '#9b7fe0',
};

interface Placement {
  id: MetaUpgradeId | FeatureUnlockId;
  branch: SkillBranch;
  angle: number;
  ring: number;
  parent: string | null;
}

const RING = 96;

const PLACEMENTS: readonly Placement[] = [
  { id: 'globalDamage', branch: 'offense', angle: -108, ring: 1, parent: 'core' },
  { id: 'ballistaMastery', branch: 'offense', angle: -134, ring: 2, parent: 'globalDamage' },
  { id: 'ballistaSlots', branch: 'offense', angle: -86, ring: 2, parent: 'globalDamage' },
  { id: 'globalDamageII', branch: 'offense', angle: -108, ring: 2.2, parent: 'globalDamage' },
  { id: 'ballistaSlotsII', branch: 'offense', angle: -72, ring: 3.2, parent: 'ballistaSlots' },
  { id: 'abilityHaste', branch: 'offense', angle: -158, ring: 3.2, parent: 'ballistaMastery' },
  { id: 'rareUpgrades', branch: 'offense', angle: -150, ring: 3, parent: 'ballistaMastery' },
  { id: 'epicUpgrades', branch: 'offense', angle: -122, ring: 3.4, parent: 'ballistaMastery' },
  { id: 'legendaryUpgrades', branch: 'offense', angle: -136, ring: 4.4, parent: 'epicUpgrades' },

  { id: 'wallIntegrity', branch: 'defense', angle: 168, ring: 1, parent: 'core' },
  { id: 'wallArmor', branch: 'defense', angle: 148, ring: 2, parent: 'wallIntegrity' },
  { id: 'wallIntegrityII', branch: 'defense', angle: 176, ring: 2.2, parent: 'wallIntegrity' },
  { id: 'wallArmorII', branch: 'defense', angle: 142, ring: 3.2, parent: 'wallArmor' },
  { id: 'cannon', branch: 'defense', angle: -170, ring: 2.2, parent: 'wallIntegrity' },
  { id: 'cannonSlots', branch: 'defense', angle: 175, ring: 3.4, parent: 'cannon' },
  { id: 'cannonSlotsII', branch: 'defense', angle: 168, ring: 4.6, parent: 'cannonSlots' },

  { id: 'startingGold', branch: 'economy', angle: -34, ring: 1, parent: 'core' },
  { id: 'bounty', branch: 'economy', angle: -12, ring: 2, parent: 'startingGold' },
  { id: 'tokenBonus', branch: 'economy', angle: -52, ring: 2.2, parent: 'startingGold' },
  { id: 'startingGoldII', branch: 'economy', angle: -22, ring: 3.2, parent: 'startingGold' },
  { id: 'tokenBonusII', branch: 'economy', angle: -54, ring: 3.4, parent: 'tokenBonus' },
  { id: 'bonusResources', branch: 'economy', angle: -30, ring: 3.4, parent: 'bounty' },

  { id: 'fireTower', branch: 'arcane', angle: 42, ring: 1.2, parent: 'core' },
  { id: 'fireSlots', branch: 'arcane', angle: 22, ring: 2.4, parent: 'fireTower' },
  { id: 'fireSlotsII', branch: 'arcane', angle: 12, ring: 3.6, parent: 'fireSlots' },
  { id: 'lightningTower', branch: 'arcane', angle: 62, ring: 2.4, parent: 'fireTower' },
  { id: 'lightningSlots', branch: 'arcane', angle: 76, ring: 3.6, parent: 'lightningTower' },
  { id: 'lightningSlotsII', branch: 'arcane', angle: 88, ring: 4.8, parent: 'lightningSlots' },
  { id: 'mortar', branch: 'arcane', angle: 92, ring: 3.2, parent: 'fireTower' },
  { id: 'mortarSlots', branch: 'arcane', angle: 108, ring: 4.2, parent: 'mortar' },
  { id: 'mortarSlotsII', branch: 'arcane', angle: 116, ring: 5.2, parent: 'mortarSlots' },
  { id: 'evolutions', branch: 'arcane', angle: 40, ring: 3.8, parent: 'fireSlots' },

  { id: 'meteor', branch: 'abilities', angle: 104, ring: 1.2, parent: 'core' },
  { id: 'artillery', branch: 'abilities', angle: 88, ring: 2.4, parent: 'meteor' },
  { id: 'dragon', branch: 'abilities', angle: 118, ring: 2.6, parent: 'meteor' },
  { id: 'deathBeam', branch: 'abilities', angle: 100, ring: 3.8, parent: 'artillery' },
  { id: 'apocalypse', branch: 'abilities', angle: 126, ring: 4.2, parent: 'dragon' },
];

function buildNodes(): SkillNode[] {
  const nodes: SkillNode[] = [
    { id: 'core', kind: 'core', branch: 'core', title: 'War Council', description: 'The heart of the campaign. Every doctrine grows from here.', maxLevel: 0, x: 0, y: 0, parent: null },
  ];
  for (const placement of PLACEMENTS) {
    const upgrade = META_UPGRADES.find((entry) => entry.id === placement.id);
    const unlock = FEATURE_UNLOCKS.find((entry) => entry.id === placement.id);
    const radians = (placement.angle * Math.PI) / 180;
    nodes.push({
      id: placement.id,
      kind: upgrade ? 'upgrade' : 'unlock',
      branch: placement.branch,
      title: upgrade?.title ?? unlock!.title,
      description: upgrade?.description ?? unlock!.description,
      maxLevel: upgrade?.maxLevel ?? 1,
      x: Math.cos(radians) * placement.ring * RING,
      y: Math.sin(radians) * placement.ring * RING,
      parent: placement.parent,
    });
  }
  return nodes;
}

export const SKILL_NODES: readonly SkillNode[] = buildNodes();
