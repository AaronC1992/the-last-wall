import { META_UPGRADES } from './UpgradeDefinitions';
import type { MetaUpgradeId } from './UpgradeDefinitions';
import { FEATURE_UNLOCKS } from './FeatureUnlocks';
import type { FeatureUnlockId } from './FeatureUnlocks';

export type SkillBranch = 'core' | 'offense' | 'defense' | 'economy' | 'arcane' | 'abilities' | 'command' | 'ballista' | 'cannon' | 'fire' | 'lightning' | 'mortar';

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
  command: '#54c7b5',
  ballista: '#d6b56a',
  cannon: '#9aa8b5',
  fire: '#f0783c',
  lightning: '#64b5f6',
  mortar: '#b68a6a',
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

  { id: 'abilityPower', branch: 'command', angle: 12, ring: 1.4, parent: 'core' },
  { id: 'repairMastery', branch: 'command', angle: 36, ring: 2.4, parent: 'abilityPower' },
  { id: 'fieldMedics', branch: 'command', angle: 58, ring: 3.4, parent: 'repairMastery' },
  { id: 'enemySuppression', branch: 'command', angle: -12, ring: 2.5, parent: 'abilityPower' },
  { id: 'veteranReserve', branch: 'command', angle: -34, ring: 3.4, parent: 'enemySuppression' },
  { id: 'warDrums', branch: 'command', angle: 82, ring: 4.2, parent: 'fieldMedics' },
  { id: 'commandSlots', branch: 'command', angle: 104, ring: 5.2, parent: 'warDrums' },

  { id: 'ballistaDamage', branch: 'ballista', angle: -96, ring: 1.6, parent: 'ballistaMastery' },
  { id: 'ballistaSpeed', branch: 'ballista', angle: -78, ring: 2.8, parent: 'ballistaDamage' },
  { id: 'ballistaDiscount', branch: 'ballista', angle: -60, ring: 4.0, parent: 'ballistaSpeed' },
  { id: 'cannonDamage', branch: 'cannon', angle: 182, ring: 3.4, parent: 'cannon' },
  { id: 'cannonSpeed', branch: 'cannon', angle: 196, ring: 4.5, parent: 'cannonDamage' },
  { id: 'cannonDiscount', branch: 'cannon', angle: 210, ring: 5.5, parent: 'cannonSpeed' },
  { id: 'fireDamage', branch: 'fire', angle: 28, ring: 3.4, parent: 'fireTower' },
  { id: 'fireSpeed', branch: 'fire', angle: 16, ring: 4.5, parent: 'fireDamage' },
  { id: 'fireDiscount', branch: 'fire', angle: 4, ring: 5.5, parent: 'fireSpeed' },
  { id: 'lightningDamage', branch: 'lightning', angle: 68, ring: 3.5, parent: 'lightningTower' },
  { id: 'lightningSpeed', branch: 'lightning', angle: 78, ring: 4.6, parent: 'lightningDamage' },
  { id: 'lightningDiscount', branch: 'lightning', angle: 88, ring: 5.6, parent: 'lightningSpeed' },
  { id: 'mortarDamage', branch: 'mortar', angle: 102, ring: 4.3, parent: 'mortar' },
  { id: 'mortarSpeed', branch: 'mortar', angle: 112, ring: 5.3, parent: 'mortarDamage' },
  { id: 'mortarDiscount', branch: 'mortar', angle: 122, ring: 6.2, parent: 'mortarSpeed' },
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
