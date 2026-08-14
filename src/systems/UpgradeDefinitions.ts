export type UpgradeKind = string;
export type UpgradeRarity = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';

export interface UpgradeDefinition {
  id: UpgradeKind;
  title: string;
  description: string;
  rarity: UpgradeRarity;
  target: 'ballista' | 'cannon' | 'fire' | 'lightning' | 'general';
}

export const RARITY_WEIGHTS: Record<UpgradeRarity, number> = { Common: 55, Uncommon: 25, Rare: 12, Epic: 6, Legendary: 2 };

export const UPGRADE_DEFINITIONS: readonly UpgradeDefinition[] = [
  { id: 'damage', title: 'Hardened Bolts', description: 'Ballista damage increases by 25 percent.', rarity: 'Common', target: 'ballista' }, { id: 'attackSpeed', title: 'Winch Crew', description: 'Ballista attack speed increases by 20 percent.', rarity: 'Common', target: 'ballista' }, { id: 'range', title: 'High Ground', description: 'Ballista range increases by 20 percent.', rarity: 'Common', target: 'ballista' }, { id: 'projectileSpeed', title: 'Steel Flight', description: 'Projectile speed increases by 35 percent.', rarity: 'Uncommon', target: 'ballista' }, { id: 'criticalChance', title: 'Deadeye Order', description: 'Critical chance increases by 12 percent.', rarity: 'Uncommon', target: 'ballista' }, { id: 'projectiles', title: 'Volley Doctrine', description: 'Ballista fires one additional bolt.', rarity: 'Rare', target: 'ballista' },
  { id: 'cannonDamage', title: 'Heavy Shells', description: 'Cannon damage increases.', rarity: 'Common', target: 'cannon' }, { id: 'cannonRadius', title: 'Wide Blast', description: 'Cannon blast radius increases.', rarity: 'Uncommon', target: 'cannon' }, { id: 'cannonSpeed', title: 'Rapid Loading', description: 'Cannon fires faster.', rarity: 'Common', target: 'cannon' }, { id: 'clusterShells', title: 'Cluster Shells', description: 'Cannon gains a second blast.', rarity: 'Rare', target: 'cannon' }, { id: 'doubleBarrel', title: 'Double Barrel', description: 'Cannon becomes relentless.', rarity: 'Epic', target: 'cannon' },
  { id: 'fireDamage', title: 'Hotter Flames', description: 'Burn damage increases.', rarity: 'Common', target: 'fire' }, { id: 'fireDuration', title: 'Slow Burn', description: 'Burn lasts longer.', rarity: 'Common', target: 'fire' }, { id: 'fireRadius', title: 'Firestorm Radius', description: 'Fire reaches farther.', rarity: 'Uncommon', target: 'fire' }, { id: 'fireSpread', title: 'Wildfire', description: 'Fire spreads on death.', rarity: 'Rare', target: 'fire' }, { id: 'hellfire', title: 'Hellfire', description: 'Burning enemies erupt.', rarity: 'Legendary', target: 'fire' },
  { id: 'lightningDamage', title: 'Charged Coils', description: 'Lightning damage increases.', rarity: 'Common', target: 'lightning' }, { id: 'lightningChains', title: 'Forked Arc', description: 'Lightning chains to more foes.', rarity: 'Uncommon', target: 'lightning' }, { id: 'lightningRange', title: 'Long Arc', description: 'Lightning chain range increases.', rarity: 'Common', target: 'lightning' }, { id: 'lightningStun', title: 'Static Lock', description: 'Lightning stuns targets.', rarity: 'Rare', target: 'lightning' }, { id: 'thunderstorm', title: 'Thunderstorm', description: 'Lightning erupts across the horde.', rarity: 'Legendary', target: 'lightning' },
  { id: 'repair', title: 'Field Repair', description: 'Repair the wall by 20 HP.', rarity: 'Common', target: 'general' }, { id: 'wallMax', title: 'Emergency Masonry', description: 'Wall maximum HP increases.', rarity: 'Uncommon', target: 'general' }, { id: 'goldBonus', title: 'Bounty Surge', description: 'Gold rewards increase.', rarity: 'Uncommon', target: 'general' }, { id: 'abilityHaste', title: 'Sky Command', description: 'Ability cooldowns shorten.', rarity: 'Rare', target: 'general' }, { id: 'boltStorm', title: 'Bolt Storm', description: 'Ballista fires a devastating volley.', rarity: 'Legendary', target: 'ballista' },
] as const;
