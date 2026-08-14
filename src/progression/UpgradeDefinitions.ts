export type MetaUpgradeId = 'globalDamage' | 'wallIntegrity' | 'wallArmor' | 'startingGold' | 'bounty' | 'tokenBonus' | 'ballistaMastery';

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
] as const;
