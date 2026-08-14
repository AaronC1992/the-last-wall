export type UpgradeKind = 'damage' | 'attackSpeed' | 'range' | 'projectiles' | 'criticalChance' | 'projectileSpeed';
export type UpgradeRarity = 'Common' | 'Uncommon' | 'Rare';

export interface UpgradeDefinition {
  id: UpgradeKind;
  title: string;
  description: string;
  rarity: UpgradeRarity;
}

export const UPGRADE_DEFINITIONS: readonly UpgradeDefinition[] = [
  { id: 'damage', title: 'Hardened Bolts', description: 'Ballista damage increases by 25 percent.', rarity: 'Common' },
  { id: 'attackSpeed', title: 'Winch Crew', description: 'Ballista attack speed increases by 20 percent.', rarity: 'Common' },
  { id: 'range', title: 'High Ground', description: 'Ballista range increases by 20 percent.', rarity: 'Common' },
  { id: 'projectileSpeed', title: 'Steel Flight', description: 'Projectile speed increases by 35 percent.', rarity: 'Uncommon' },
  { id: 'criticalChance', title: 'Deadeye Order', description: 'Critical chance increases by 12 percent.', rarity: 'Uncommon' },
  { id: 'projectiles', title: 'Volley Doctrine', description: 'Ballista fires one additional bolt.', rarity: 'Rare' },
] as const;
