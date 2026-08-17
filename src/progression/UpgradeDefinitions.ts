export type MetaUpgradeId = 'globalDamage' | 'globalDamageII' | 'wallIntegrity' | 'wallIntegrityII' | 'wallArmor' | 'wallArmorII' | 'startingGold' | 'startingGoldII' | 'bounty' | 'tokenBonus' | 'tokenBonusII' | 'ballistaMastery' | 'bonusResources' | 'abilityHaste' | 'ballistaSlots' | 'ballistaSlotsII' | 'cannonSlots' | 'cannonSlotsII' | 'fireSlots' | 'fireSlotsII' | 'lightningSlots' | 'lightningSlotsII' | 'mortarSlots' | 'mortarSlotsII' | 'teslaSlots' | 'teslaSlotsII' | 'sniperSlots' | 'sniperSlotsII' | 'abilityPower' | 'repairMastery' | 'fieldMedics' | 'enemySuppression' | 'veteranReserve' | 'warDrums' | 'commandSlots' | 'ballistaDamage' | 'ballistaSpeed' | 'ballistaDiscount' | 'cannonDamage' | 'cannonSpeed' | 'cannonDiscount' | 'fireDamage' | 'fireSpeed' | 'fireDiscount' | 'lightningDamage' | 'lightningSpeed' | 'lightningDiscount' | 'mortarDamage' | 'mortarSpeed' | 'mortarDiscount' | 'teslaDamage' | 'teslaSpeed' | 'teslaDiscount' | 'sniperDamage' | 'sniperSpeed' | 'sniperDiscount';

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
  { id: 'startingGold', category: 'Economy', title: 'Build Reserve', description: 'Each level grants 10 Build Points at the start of a run.', maxLevel: 8, baseCost: 1 },
  { id: 'startingGoldII', category: 'Economy', title: 'Quartermaster Corps', description: 'Each level grants 15 Build Points at the start of a run.', maxLevel: 8, baseCost: 4 },
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
  { id: 'teslaSlots', category: 'Weapons', title: 'Coil Workshop', description: 'One more Tesla Coil can be placed each level.', maxLevel: 3, baseCost: 6 },
  { id: 'teslaSlotsII', category: 'Weapons', title: 'Arc Reactor', description: 'One more Tesla Coil can be placed each level.', maxLevel: 2, baseCost: 9 },
  { id: 'sniperSlots', category: 'Weapons', title: 'Marksman Post', description: 'One more Sniper Tower can be placed each level.', maxLevel: 2, baseCost: 7 },
  { id: 'sniperSlotsII', category: 'Weapons', title: 'Watchtower Network', description: 'One more Sniper Tower can be placed each level.', maxLevel: 2, baseCost: 10 },
  { id: 'abilityPower', category: 'Damage', title: 'Cataclysm School', description: 'Super power damage gains 12 percent each level.', maxLevel: 8, baseCost: 5 },
  { id: 'repairMastery', category: 'Defense', title: 'Field Engineers', description: 'Wall repairs restore 10 more health each level.', maxLevel: 6, baseCost: 3 },
  { id: 'fieldMedics', category: 'Defense', title: 'Field Medics', description: 'Wall repairs cost 5 fewer Build Points each level.', maxLevel: 6, baseCost: 4 },
  { id: 'enemySuppression', category: 'Defense', title: 'Suppression Doctrine', description: 'Enemies move 3 percent slower each level.', maxLevel: 8, baseCost: 5 },
  { id: 'veteranReserve', category: 'Economy', title: 'Veteran Reserve', description: 'Start each run with 25 additional Build Points per level.', maxLevel: 8, baseCost: 4 },
  { id: 'warDrums', category: 'Weapons', title: 'War Drums', description: 'Tower attack speed gains 3 percent each level.', maxLevel: 8, baseCost: 5 },
  { id: 'commandSlots', category: 'Weapons', title: 'Command Bunkers', description: 'One additional tower of every type can be placed each level.', maxLevel: 4, baseCost: 9 },
  { id: 'ballistaDamage', category: 'Damage', title: 'Ballista Warheads', description: 'Ballista damage gains 8 percent each level.', maxLevel: 8, baseCost: 3 },
  { id: 'ballistaSpeed', category: 'Weapons', title: 'Ballista Drills', description: 'Ballista attack speed gains 5 percent each level.', maxLevel: 8, baseCost: 3 },
  { id: 'ballistaDiscount', category: 'Economy', title: 'Timber Contracts', description: 'Ballista Build Point cost falls 4 percent each level.', maxLevel: 6, baseCost: 4 },
  { id: 'cannonDamage', category: 'Damage', title: 'Siege Charges', description: 'Cannon damage gains 10 percent each level.', maxLevel: 8, baseCost: 4 },
  { id: 'cannonSpeed', category: 'Weapons', title: 'Rapid Breeches', description: 'Cannon attack speed gains 5 percent each level.', maxLevel: 8, baseCost: 4 },
  { id: 'cannonDiscount', category: 'Economy', title: 'Foundry Recycling', description: 'Cannon Build Point cost falls 5 percent each level.', maxLevel: 6, baseCost: 5 },
  { id: 'fireDamage', category: 'Damage', title: 'White Hot Fuel', description: 'Fire Tower burn damage gains 10 percent each level.', maxLevel: 8, baseCost: 4 },
  { id: 'fireSpeed', category: 'Weapons', title: 'Pressure Valves', description: 'Fire Tower attack speed gains 5 percent each level.', maxLevel: 8, baseCost: 4 },
  { id: 'fireDiscount', category: 'Economy', title: 'Fuel Reclamation', description: 'Fire Tower Build Point cost falls 5 percent each level.', maxLevel: 6, baseCost: 5 },
  { id: 'lightningDamage', category: 'Damage', title: 'Laser Capacitors', description: 'Laser Tower damage gains 10 percent each level.', maxLevel: 8, baseCost: 5 },
  { id: 'lightningSpeed', category: 'Weapons', title: 'Optical Overclock', description: 'Laser Tower attack speed gains 5 percent each level.', maxLevel: 8, baseCost: 5 },
  { id: 'lightningDiscount', category: 'Economy', title: 'Prism Fabrication', description: 'Laser Tower Build Point cost falls 5 percent each level.', maxLevel: 6, baseCost: 6 },
  { id: 'mortarDamage', category: 'Damage', title: 'Bunker Busters', description: 'Mortar damage gains 10 percent each level.', maxLevel: 8, baseCost: 5 },
  { id: 'mortarSpeed', category: 'Weapons', title: 'Autoloaders', description: 'Mortar attack speed gains 5 percent each level.', maxLevel: 8, baseCost: 5 },
  { id: 'mortarDiscount', category: 'Economy', title: 'Shell Salvage', description: 'Mortar Build Point cost falls 5 percent each level.', maxLevel: 6, baseCost: 6 },
  { id: 'teslaDamage', category: 'Damage', title: 'Induction Cells', description: 'Tesla Coil damage gains 10 percent each level.', maxLevel: 8, baseCost: 6 },
  { id: 'teslaSpeed', category: 'Weapons', title: 'Rapid Discharge', description: 'Tesla Coil attack speed gains 5 percent each level.', maxLevel: 8, baseCost: 6 },
  { id: 'teslaDiscount', category: 'Economy', title: 'Copper Recovery', description: 'Tesla Coil Build Point cost falls 5 percent each level.', maxLevel: 6, baseCost: 7 },
  { id: 'sniperDamage', category: 'Damage', title: 'Precision Rounds', description: 'Sniper Tower damage gains 10 percent each level.', maxLevel: 8, baseCost: 7 },
  { id: 'sniperSpeed', category: 'Weapons', title: 'Veteran Spotters', description: 'Sniper Tower reload speed gains 5 percent each level.', maxLevel: 8, baseCost: 7 },
  { id: 'sniperDiscount', category: 'Economy', title: 'Rifle Contracts', description: 'Sniper Tower Build Point cost falls 5 percent each level.', maxLevel: 6, baseCost: 8 },
] as const;
