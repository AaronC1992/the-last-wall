export type FeatureUnlockId = 'cannon' | 'fireTower' | 'lightningTower' | 'mortar' | 'teslaCoil' | 'sniperTower' | 'meteor' | 'artillery' | 'dragon' | 'deathBeam' | 'apocalypse' | 'rareUpgrades' | 'epicUpgrades' | 'legendaryUpgrades' | 'evolutions';

export interface FeatureUnlockDefinition {
  id: FeatureUnlockId;
  category: 'Weapons' | 'Abilities' | 'Systems';
  title: string;
  description: string;
  cost: number;
}

export const FEATURE_UNLOCKS: readonly FeatureUnlockDefinition[] = [
  { id: 'cannon', category: 'Weapons', title: 'Cannon Plans', description: 'Allows Cannons to be built with Build Points during runs.', cost: 15 },
  { id: 'fireTower', category: 'Weapons', title: 'Fire Tower Plans', description: 'Allows Fire Towers to be built with Build Points during runs.', cost: 30 },
  { id: 'lightningTower', category: 'Weapons', title: 'Laser Tower Plans', description: 'Allows Laser Towers to be built with Build Points during runs.', cost: 55 },
  { id: 'mortar', category: 'Weapons', title: 'Mortar Plans', description: 'Allows Mortars to be built with Build Points during runs.', cost: 45 },
  { id: 'teslaCoil', category: 'Weapons', title: 'Tesla Coil Plans', description: 'Allows Tesla Coils to chain lightning across nearby enemies.', cost: 65 },
  { id: 'sniperTower', category: 'Weapons', title: 'Sniper Tower Plans', description: 'Allows Sniper Towers to eliminate priority targets at long range.', cost: 80 },
  { id: 'meteor', category: 'Abilities', title: 'Meteor', description: 'Unlocks the Meteor ability.', cost: 20 },
  { id: 'artillery', category: 'Abilities', title: 'Artillery', description: 'Unlocks the Artillery ability.', cost: 40 },
  { id: 'dragon', category: 'Abilities', title: 'Dragon Strike', description: 'Unlocks the Dragon ability.', cost: 75 },
  { id: 'deathBeam', category: 'Abilities', title: 'Death Beam', description: 'Unlocks the Death Beam ability.', cost: 120 },
  { id: 'apocalypse', category: 'Abilities', title: 'Apocalypse', description: 'Unlocks Apocalypse.', cost: 250 },
  { id: 'rareUpgrades', category: 'Systems', title: 'Rare Doctrine', description: 'Adds Rare upgrades to level up choices.', cost: 25 },
  { id: 'epicUpgrades', category: 'Systems', title: 'Epic Doctrine', description: 'Adds Epic upgrades to level up choices.', cost: 75 },
  { id: 'legendaryUpgrades', category: 'Systems', title: 'Legendary Doctrine', description: 'Adds Legendary upgrades to level up choices.', cost: 160 },
  { id: 'evolutions', category: 'Systems', title: 'Evolution Forge', description: 'Allows weapon evolutions during runs.', cost: 100 },
] as const;
