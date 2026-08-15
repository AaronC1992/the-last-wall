export type MetaUpgradeId = 'globalDamage' | 'wallIntegrity' | 'wallArmor' | 'startingGold' | 'bounty' | 'tokenBonus' | 'ballistaMastery' | 'bonusResources' | 'ballistaSlots' | 'cannonSlots' | 'fireSlots' | 'lightningSlots' | 'mortarSlots';

export interface MetaUpgradeDefinition {
  id: MetaUpgradeId;
  category: 'Damage' | 'Defense' | 'Economy' | 'Weapons';
  title: string;
  description: string;
  maxLevel: number;
  baseCost: number;
}

export const META_UPGRADES: readonly MetaUpgradeDefinition[] = [
  { id: 'globalDamage', category: 'Damage', title: 'Siege Doctrine', description: 'All Ballista damage gains 10 percent each level.', maxLevel: 10, baseCost: 4 },
  { id: 'wallIntegrity', category: 'Defense', title: 'Reinforced Wall', description: 'Wall maximum health gains 20 each level.', maxLevel: 10, baseCost: 4 },
  { id: 'wallArmor', category: 'Defense', title: 'Stone Plating', description: 'Wall damage taken is reduced by 1 each level.', maxLevel: 8, baseCost: 5 },
  { id: 'startingGold', category: 'Economy', title: 'War Chest', description: 'Each run begins with 10 more Gold.', maxLevel: 8, baseCost: 3 },
  { id: 'bounty', category: 'Economy', title: 'Bounty Orders', description: 'Enemy rewards gain 10 percent each level.', maxLevel: 8, baseCost: 4 },
  { id: 'tokenBonus', category: 'Economy', title: 'Victory Ledger', description: 'War Token rewards gain 15 percent each level.', maxLevel: 6, baseCost: 6 },
  { id: 'ballistaMastery', category: 'Weapons', title: 'Ballista Mastery', description: 'Ballista attack speed gains 8 percent each level.', maxLevel: 8, baseCost: 5 },
  { id: 'bonusResources', category: 'Economy', title: 'Bonus Resources', description: 'Gain 3 more War Tokens at the end of a battle.', maxLevel: 3, baseCost: 3 },
  { id: 'ballistaSlots', category: 'Weapons', title: 'Ballista Yard', description: 'One more Ballista can be placed each level.', maxLevel: 10, baseCost: 4 },
  { id: 'cannonSlots', category: 'Weapons', title: 'Cannon Foundry', description: 'One more Cannon can be placed each level.', maxLevel: 2, baseCost: 12 },
  { id: 'fireSlots', category: 'Weapons', title: 'Pyre Works', description: 'One more Fire Tower can be placed each level.', maxLevel: 4, baseCost: 9 },
  { id: 'lightningSlots', category: 'Weapons', title: 'Storm Spire', description: 'One more Lightning Tower can be placed each level.', maxLevel: 2, baseCost: 16 },
  { id: 'mortarSlots', category: 'Weapons', title: 'Mortar Yard', description: 'One more Mortar can be placed each level.', maxLevel: 2, baseCost: 14 },
] as const;
