import { SaveSystem } from '../systems/SaveSystem';
import { META_UPGRADES } from './UpgradeDefinitions';
import type { MetaUpgradeDefinition, MetaUpgradeId } from './UpgradeDefinitions';
import type { SaveData } from '../systems/SaveSystem';
import { FEATURE_UNLOCKS } from './FeatureUnlocks';
import type { FeatureUnlockDefinition, FeatureUnlockId } from './FeatureUnlocks';
import { SKILL_NODES } from './SkillTreeLayout';
import type { UpgradeRarity } from '../systems/UpgradeDefinitions';

export interface PermanentBonuses {
  damageMultiplier: number;
  wallMaxHp: number;
  wallArmor: number;
  startingBuildPoints: number;
  tokenMultiplier: number;
  ballistaSpeedMultiplier: number;
  flatTokenBonus: number;
  abilityHaste: number;
  towerSlots: { ballista: number; cannon: number; fireTower: number; lightningTower: number; mortar: number };
}

export interface TokenBreakdown {
  kills: number;
  base: number;
  percentBonus: number;
  percentLabel: string;
  flatBonus: number;
  total: number;
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

  awardTokens(kills: number, elapsed: number, buildPoints: number, highestCombo: number, awardCurrency = true): TokenBreakdown {
    const bonuses = this.bonuses;
    const base = Math.max(1, Math.floor(kills / 20 + elapsed / 90));
    const percentBonus = awardCurrency ? Math.floor(base * (bonuses.tokenMultiplier - 1)) : 0;
    const flatBonus = awardCurrency ? bonuses.flatTokenBonus : 0;
    const total = awardCurrency ? base + percentBonus + flatBonus : 0;
    this.data.warTokens += total;
    this.data.statistics.totalKills += kills;
    this.data.statistics.totalRuns++;
    this.data.statistics.totalBuildPoints += buildPoints;
    this.data.statistics.highestKills = Math.max(this.data.statistics.highestKills, kills);
    this.data.statistics.highestLifetimeCombo = Math.max(this.data.statistics.highestLifetimeCombo, highestCombo);
    this.persist();
    return { kills, base, percentBonus, percentLabel: `${((bonuses.tokenMultiplier - 1) * 100).toFixed(1)}%`, flatBonus, total };
  }

  get bonuses(): PermanentBonuses {
    return {
      damageMultiplier: 1 + this.getLevel('globalDamage') * 0.1 + this.getLevel('globalDamageII') * 0.15,
      wallMaxHp: 100 + this.getLevel('wallIntegrity') * 20 + this.getLevel('wallIntegrityII') * 35,
      wallArmor: this.getLevel('wallArmor') + this.getLevel('wallArmorII'),
      startingBuildPoints: 400 + this.getLevel('startingGold') * 10 + this.getLevel('startingGoldII') * 15,
      tokenMultiplier: 1 + this.getLevel('tokenBonus') * 0.15 + this.getLevel('tokenBonusII') * 0.2,
      ballistaSpeedMultiplier: 1 + this.getLevel('ballistaMastery') * 0.08,
      flatTokenBonus: this.getLevel('bonusResources') * 3,
      abilityHaste: this.getLevel('abilityHaste') * 0.06,
      towerSlots: {
        ballista: this.getLevel('ballistaSlots') + this.getLevel('ballistaSlotsII'),
        cannon: this.getLevel('cannonSlots') + this.getLevel('cannonSlotsII'),
        fireTower: this.getLevel('fireSlots') + this.getLevel('fireSlotsII'),
        lightningTower: this.getLevel('lightningSlots') + this.getLevel('lightningSlotsII'),
        mortar: this.getLevel('mortarSlots') + this.getLevel('mortarSlotsII'),
      },
    };
  }

  get settings(): SaveData['settings'] {
    return this.data.settings;
  }

  nodeLevel(id: string): number {
    const node = SKILL_NODES.find((entry) => entry.id === id)!;
    if (node.kind === 'core') return 1;
    if (node.kind === 'unlock') return this.isUnlocked(id as FeatureUnlockId) ? 1 : 0;
    return this.getLevel(id as MetaUpgradeId);
  }

  nodeCost(id: string): number {
    const node = SKILL_NODES.find((entry) => entry.id === id)!;
    if (node.kind === 'unlock') return FEATURE_UNLOCKS.find((entry) => entry.id === id)!.cost;
    return this.getCost(id as MetaUpgradeId);
  }

  isNodeUnlocked(id: string): boolean {
    const node = SKILL_NODES.find((entry) => entry.id === id)!;
    if (!node.parent) return true;
    return this.nodeLevel(node.parent) > 0;
  }

  purchaseNode(id: string): boolean {
    if (!this.isNodeUnlocked(id)) return false;
    const node = SKILL_NODES.find((entry) => entry.id === id)!;
    if (node.kind === 'core') return false;
    return node.kind === 'unlock' ? this.purchaseUnlock(id as FeatureUnlockId) : this.purchase(id as MetaUpgradeId);
  }

  get statistics(): SaveData['statistics'] {
    return this.data.statistics;
  }

  isCampaignUnlocked(index: number): boolean {
    if (index === 0) return true;
    return this.data.completedCampaign.includes(`campaign-${String(index).padStart(2, '0')}`);
  }

  completeCampaign(id: string): void {
    if (!this.data.completedCampaign.includes(id)) {
      this.data.completedCampaign.push(id);
      this.persist();
    }
  }

  updateSettings(settings: Partial<SaveData['settings']>): void {
    Object.assign(this.data.settings, settings);
    this.persist();
  }

  grantWarTokens(amount: number): void {
    if (amount <= 0) return;
    this.data.warTokens += amount;
    this.persist();
  }

  reset(): void {
    this.saveSystem.reset();
  }

  private persist(): void {
    this.saveSystem.save(this.data);
  }
}
