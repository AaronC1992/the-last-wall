import { META_UPGRADES } from './UpgradeDefinitions';
import type { MetaUpgradeId } from './UpgradeDefinitions';
import { FEATURE_UNLOCKS } from './FeatureUnlocks';
import type { FeatureUnlockId } from './FeatureUnlocks';

export type SkillBranch = 'core' | 'offense' | 'defense' | 'economy' | 'arcane' | 'abilities' | 'command' | 'ballista' | 'cannon' | 'fire' | 'lightning' | 'mortar' | 'tesla' | 'sniper';

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
  tesla: '#38bdf8',
  sniper: '#b7c5ad',
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
  { id: 'globalDamage', branch: 'offense', angle: -112, ring: 1, parent: 'core' },
  { id: 'ballistaMastery', branch: 'offense', angle: -142, ring: 2, parent: 'globalDamage' },
  { id: 'ballistaSlots', branch: 'offense', angle: -82, ring: 2, parent: 'globalDamage' },
  { id: 'globalDamageII', branch: 'offense', angle: -112, ring: 2.2, parent: 'globalDamage' },
  { id: 'ballistaSlotsII', branch: 'offense', angle: -62, ring: 3.2, parent: 'ballistaSlots' },

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
  { id: 'teslaCoil', branch: 'arcane', angle: 72, ring: 4.5, parent: 'lightningTower' },
  { id: 'teslaSlots', branch: 'tesla', angle: 76, ring: 5.4, parent: 'teslaCoil' },
  { id: 'teslaSlotsII', branch: 'tesla', angle: 82, ring: 6.4, parent: 'teslaSlots' },
  { id: 'sniperTower', branch: 'sniper', angle: -112, ring: 4.4, parent: 'ballistaMastery' },
  { id: 'sniperSlots', branch: 'sniper', angle: -124, ring: 5.4, parent: 'sniperTower' },
  { id: 'sniperSlotsII', branch: 'sniper', angle: -132, ring: 6.4, parent: 'sniperSlots' },

  { id: 'meteor', branch: 'abilities', angle: 104, ring: 1.2, parent: 'core' },
  { id: 'artillery', branch: 'abilities', angle: 88, ring: 2.4, parent: 'meteor' },
  { id: 'dragon', branch: 'abilities', angle: 118, ring: 2.6, parent: 'meteor' },
  { id: 'deathBeam', branch: 'abilities', angle: 100, ring: 3.8, parent: 'artillery' },
  { id: 'apocalypse', branch: 'abilities', angle: 126, ring: 4.2, parent: 'dragon' },

  { id: 'abilityPower', branch: 'command', angle: 12, ring: 1.4, parent: 'core' },
  { id: 'abilityHaste', branch: 'command', angle: -8, ring: 2.4, parent: 'abilityPower' },
  { id: 'repairMastery', branch: 'command', angle: 36, ring: 2.4, parent: 'abilityPower' },
  { id: 'fieldMedics', branch: 'command', angle: 58, ring: 3.4, parent: 'repairMastery' },
  { id: 'enemySuppression', branch: 'command', angle: -12, ring: 2.5, parent: 'abilityPower' },
  { id: 'veteranReserve', branch: 'command', angle: -34, ring: 3.4, parent: 'enemySuppression' },
  { id: 'warDrums', branch: 'command', angle: 82, ring: 4.2, parent: 'fieldMedics' },
  { id: 'commandSlots', branch: 'command', angle: 104, ring: 5.2, parent: 'warDrums' },

  { id: 'ballistaDamage', branch: 'ballista', angle: -96, ring: 1.6, parent: 'ballistaMastery' },
  { id: 'ballistaSpeed', branch: 'ballista', angle: -78, ring: 2.8, parent: 'ballistaDamage' },
  { id: 'ballistaRange', branch: 'ballista', angle: -68, ring: 4.0, parent: 'ballistaSpeed' },
  { id: 'ballistaPenetration', branch: 'ballista', angle: -56, ring: 5.0, parent: 'ballistaRange' },
  { id: 'ballistaMultishot', branch: 'ballista', angle: -44, ring: 6.0, parent: 'ballistaPenetration' },
  { id: 'ballistaDiscount', branch: 'ballista', angle: -32, ring: 7.0, parent: 'ballistaMultishot' },
  { id: 'cannonDamage', branch: 'cannon', angle: 182, ring: 3.4, parent: 'cannon' },
  { id: 'cannonSpeed', branch: 'cannon', angle: 196, ring: 4.5, parent: 'cannonDamage' },
  { id: 'cannonRange', branch: 'cannon', angle: 208, ring: 5.5, parent: 'cannonSpeed' },
  { id: 'cannonCluster', branch: 'cannon', angle: 216, ring: 6.5, parent: 'cannonRange' },
  { id: 'cannonDoubleBarrel', branch: 'cannon', angle: 224, ring: 7.5, parent: 'cannonCluster' },
  { id: 'cannonCarpetBombardment', branch: 'cannon', angle: 232, ring: 8.5, parent: 'cannonDoubleBarrel' },
  { id: 'cannonDiscount', branch: 'cannon', angle: 242, ring: 9.5, parent: 'cannonCarpetBombardment' },
  { id: 'fireDamage', branch: 'fire', angle: 28, ring: 3.4, parent: 'fireTower' },
  { id: 'fireSpeed', branch: 'fire', angle: 16, ring: 4.5, parent: 'fireDamage' },
  { id: 'fireRange', branch: 'fire', angle: 8, ring: 5.5, parent: 'fireSpeed' },
  { id: 'fireWildfire', branch: 'fire', angle: -2, ring: 6.5, parent: 'fireRange' },
  { id: 'fireDiscount', branch: 'fire', angle: -10, ring: 7.5, parent: 'fireWildfire' },
  { id: 'lightningDamage', branch: 'lightning', angle: 68, ring: 3.5, parent: 'lightningTower' },
  { id: 'lightningSpeed', branch: 'lightning', angle: 78, ring: 4.6, parent: 'lightningDamage' },
  { id: 'lightningRange', branch: 'lightning', angle: 88, ring: 5.6, parent: 'lightningSpeed' },
  { id: 'lightningDiscount', branch: 'lightning', angle: 98, ring: 6.6, parent: 'lightningRange' },
  { id: 'mortarDamage', branch: 'mortar', angle: 102, ring: 4.3, parent: 'mortar' },
  { id: 'mortarSpeed', branch: 'mortar', angle: 112, ring: 5.3, parent: 'mortarDamage' },
  { id: 'mortarRange', branch: 'mortar', angle: 122, ring: 6.2, parent: 'mortarSpeed' },
  { id: 'mortarDoubleSalvo', branch: 'mortar', angle: 130, ring: 7.2, parent: 'mortarRange' },
  { id: 'mortarDiscount', branch: 'mortar', angle: 138, ring: 8.2, parent: 'mortarDoubleSalvo' },
  { id: 'teslaDamage', branch: 'tesla', angle: 68, ring: 5.2, parent: 'teslaCoil' },
  { id: 'teslaSpeed', branch: 'tesla', angle: 58, ring: 6.2, parent: 'teslaDamage' },
  { id: 'teslaRange', branch: 'tesla', angle: 48, ring: 7.2, parent: 'teslaSpeed' },
  { id: 'teslaShock', branch: 'tesla', angle: 42, ring: 8.2, parent: 'teslaRange' },
  { id: 'teslaChainSplit', branch: 'tesla', angle: 34, ring: 9.2, parent: 'teslaShock' },
  { id: 'teslaDiscount', branch: 'tesla', angle: 26, ring: 10.2, parent: 'teslaChainSplit' },
  { id: 'sniperDamage', branch: 'sniper', angle: -110, ring: 5.2, parent: 'sniperTower' },
  { id: 'sniperSpeed', branch: 'sniper', angle: -100, ring: 6.2, parent: 'sniperDamage' },
  { id: 'sniperRange', branch: 'sniper', angle: -90, ring: 7.2, parent: 'sniperSpeed' },
  { id: 'sniperPiercing', branch: 'sniper', angle: -84, ring: 8.2, parent: 'sniperRange' },
  { id: 'sniperDiscount', branch: 'sniper', angle: -76, ring: 9.2, parent: 'sniperPiercing' },
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

export type BranchTab = { branch: SkillBranch; label: string };

export const BRANCH_ORDER: readonly BranchTab[] = [
  { branch: 'offense',   label: 'Offense'   },
  { branch: 'defense',   label: 'Defense'   },
  { branch: 'economy',   label: 'Economy'   },
  { branch: 'arcane',    label: 'Arcane'    },
  { branch: 'abilities', label: 'Abilities' },
  { branch: 'command',   label: 'Command'   },
];
