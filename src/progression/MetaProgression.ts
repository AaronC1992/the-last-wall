import { SaveSystem } from '../systems/SaveSystem';
import { META_UPGRADES } from './UpgradeDefinitions';
import type { MetaUpgradeDefinition, MetaUpgradeId } from './UpgradeDefinitions';
import type { SaveData } from '../systems/SaveSystem';
import { FEATURE_UNLOCKS } from './FeatureUnlocks';
import type { FeatureUnlockDefinition, FeatureUnlockId } from './FeatureUnlocks';
import type { UpgradeRarity } from '../systems/UpgradeDefinitions';

export interface PermanentBonuses {
  damageMultiplier: number;
  wallMaxHp: number;
  wallArmor: number;
  startingGold: number;
  rewardMultiplier: number;
  tokenMultiplier: number;
  ballistaSpeedMultiplier: number;
}

export class MetaProgression {
  private readonly saveSystem = new SaveSystem();
  private readonly data = this.saveSystem.load();

  get warTokens(): number {
    return this.data.warTokens;
  }

  get upgrades(): readonly MetaUpgradeDefinition[] {
    return META_UPGRADES;
  }

  get features(): readonly FeatureUnlockDefinition[] {
    return FEATURE_UNLOCKS;
  }

  isUnlocked(id: FeatureUnlockId): boolean {
    return this.data.unlocks[id] === true;
  }

  isRarityUnlocked(rarity: UpgradeRarity): boolean {
    if (rarity === 'Common' || rarity === 'Uncommon') return true;
    if (rarity === 'Rare') return this.isUnlocked('rareUpgrades');
    if (rarity === 'Epic') return this.isUnlocked('epicUpgrades');
    return this.isUnlocked('legendaryUpgrades');
  }

  purchaseUnlock(id: FeatureUnlockId): boolean {
    const definition = FEATURE_UNLOCKS.find((feature) => feature.id === id)!;
    if (this.isUnlocked(id) || this.data.warTokens < definition.cost) return false;
    this.data.warTokens -= definition.cost;
    this.data.unlocks[id] = true;
    this.persist();
    return true;
  }

  getLevel(id: MetaUpgradeId): number {
    return this.data.upgrades[id] ?? 0;
  }

  getCost(id: MetaUpgradeId): number {
    const definition = META_UPGRADES.find((upgrade) => upgrade.id === id)!;
    return definition.baseCost + this.getLevel(id) * definition.baseCost;
  }

  purchase(id: MetaUpgradeId): boolean {
    const definition = META_UPGRADES.find((upgrade) => upgrade.id === id)!;
    const level = this.getLevel(id);
    const cost = this.getCost(id);
    if (level >= definition.maxLevel || this.data.warTokens < cost) return false;
    this.data.warTokens -= cost;
    this.data.upgrades[id] = level + 1;
    this.persist();
    return true;
  }

  awardTokens(amount: number, kills: number, gold: number, highestCombo: number): number {
    const total = Math.max(1, Math.floor(amount * this.bonuses.tokenMultiplier));
    this.data.warTokens += total;
    this.data.statistics.totalKills += kills;
    this.data.statistics.totalRuns++;
    this.data.statistics.totalGold += gold;
    this.data.statistics.highestKills = Math.max(this.data.statistics.highestKills, kills);
    this.data.statistics.highestLifetimeCombo = Math.max(this.data.statistics.highestLifetimeCombo, highestCombo);
    this.persist();
    return total;
  }

  get bonuses(): PermanentBonuses {
    return {
      damageMultiplier: 1 + this.getLevel('globalDamage') * 0.1,
      wallMaxHp: 100 + this.getLevel('wallIntegrity') * 20,
      wallArmor: this.getLevel('wallArmor'),
      startingGold: this.getLevel('startingGold') * 10,
      rewardMultiplier: 1 + this.getLevel('bounty') * 0.1,
      tokenMultiplier: 1 + this.getLevel('tokenBonus') * 0.15,
      ballistaSpeedMultiplier: 1 + this.getLevel('ballistaMastery') * 0.08,
    };
  }

  get settings(): SaveData['settings'] {
    return this.data.settings;
  }

  get statistics(): SaveData['statistics'] {
    return this.data.statistics;
  }

  updateSettings(settings: Partial<SaveData['settings']>): void {
    Object.assign(this.data.settings, settings);
    this.persist();
  }

  private persist(): void {
    this.saveSystem.save(this.data);
  }
}
