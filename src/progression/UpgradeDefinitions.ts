export type MetaUpgradeId = 'globalDamage' | 'globalDamageII' | 'wallIntegrity' | 'wallIntegrityII' | 'wallArmor' | 'wallArmorII' | 'startingGold' | 'startingGoldII' | 'bounty' | 'tokenBonus' | 'tokenBonusII' | 'ballistaMastery' | 'bonusResources' | 'abilityHaste' | 'ballistaSlots' | 'ballistaSlotsII' | 'cannonSlots' | 'cannonSlotsII' | 'fireSlots' | 'fireSlotsII' | 'lightningSlots' | 'lightningSlotsII' | 'mortarSlots' | 'mortarSlotsII';

export interface MetaUpgradeDefinition {
  id: MetaUpgradeId;
  category: 'Damage' | 'Defense' | 'Economy' | 'Weapons';
  title: string;
  description: string;
  maxLevel: number;
  baseCost: number;
}

export const META_UPGRADES: readonly MetaUpgradeDefinition[] = [
  { id: 'globalDamage', category: 'Damage', title: 'Siege Doctrine', description: 'All Ballista damage gains 10 percent each level.', maxLevel: 10, baseCost: 1 },
  { id: 'globalDamageII', category: 'Damage', title: 'Grand Battery', description: 'All Ballista damage gains 15 percent each level.', maxLevel: 10, baseCost: 4 },
  { id: 'wallIntegrity', category: 'Defense', title: 'Reinforced Wall', description: 'Wall maximum health gains 20 each level.', maxLevel: 10, baseCost: 1 },
  { id: 'wallIntegrityII', category: 'Defense', title: 'Citadel Core', description: 'Wall maximum health gains 35 each level.', maxLevel: 8, baseCost: 4 },
  { id: 'wallArmor', category: 'Defense', title: 'Stone Plating', description: 'Wall damage taken is reduced by 1 each level.', maxLevel: 8, baseCost: 2 },
  { id: 'wallArmorII', category: 'Defense', title: 'Bastion Runes', description: 'Wall damage taken is reduced by 1 more each level.', maxLevel: 6, baseCost: 5 },
  { id: 'startingGold', category: 'Economy', title: 'Build Reserve', description: 'Each level grants 100 Build Points at the start of a run.', maxLevel: 8, baseCost: 1 },
  { id: 'startingGoldII', category: 'Economy', title: 'Quartermaster Corps', description: 'Each level grants 150 Build Points at the start of a run.', maxLevel: 8, baseCost: 4 },
  { id: 'bounty', category: 'Economy', title: 'Bounty Orders', description: 'Enemy rewards gain 10 percent each level.', maxLevel: 8, baseCost: 2 },
  { id: 'tokenBonus', category: 'Economy', title: 'Victory Ledger', description: 'War Token rewards gain 15 percent each level.', maxLevel: 6, baseCost: 3 },
  { id: 'tokenBonusII', category: 'Economy', title: 'Imperial Treasury', description: 'War Token rewards gain 20 percent each level.', maxLevel: 6, baseCost: 6 },
  { id: 'ballistaMastery', category: 'Weapons', title: 'Ballista Mastery', description: 'Ballista attack speed gains 8 percent each level.', maxLevel: 8, baseCost: 2 },
  { id: 'bonusResources', category: 'Economy', title: 'Bonus Resources', description: 'Gain 3 more War Tokens at the end of a battle.', maxLevel: 3, baseCost: 2 },
  { id: 'abilityHaste', category: 'Weapons', title: 'Battle Canticles', description: 'Abilities recover 6 percent faster each level.', maxLevel: 8, baseCost: 3 },
  { id: 'ballistaSlots', category: 'Weapons', title: 'Ballista Yard', description: 'One more Ballista can be placed each level.', maxLevel: 10, baseCost: 2 },
  { id: 'ballistaSlotsII', category: 'Weapons', title: 'Grand Ballista Yard', description: 'One more Ballista can be placed each level.', maxLevel: 10, baseCost: 5 },
  { id: 'cannonSlots', category: 'Weapons', title: 'Cannon Foundry', description: 'One more Cannon can be placed each level.', maxLevel: 2, baseCost: 5 },
  { id: 'cannonSlotsII', category: 'Weapons', title: 'Heavy Foundry', description: 'One more Cannon can be placed each level.', maxLevel: 2, baseCost: 8 },
  { id: 'fireSlots', category: 'Weapons', title: 'Pyre Works', description: 'One more Fire Tower can be placed each level.', maxLevel: 4, baseCost: 4 },
  { id: 'fireSlotsII', category: 'Weapons', title: 'Inferno Works', description: 'One more Fire Tower can be placed each level.', maxLevel: 4, baseCost: 7 },
  { id: 'lightningSlots', category: 'Weapons', title: 'Storm Spire', description: 'One more Lightning Tower can be placed each level.', maxLevel: 2, baseCost: 6 },
  { id: 'lightningSlotsII', category: 'Weapons', title: 'Tempest Crown', description: 'One more Lightning Tower can be placed each level.', maxLevel: 2, baseCost: 9 },
  { id: 'mortarSlots', category: 'Weapons', title: 'Mortar Yard', description: 'One more Mortar can be placed each level.', maxLevel: 2, baseCost: 5 },
  { id: 'mortarSlotsII', category: 'Weapons', title: 'Siege Arsenal', description: 'One more Mortar can be placed each level.', maxLevel: 2, baseCost: 8 },
] as const;
