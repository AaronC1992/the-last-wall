import { EVOLUTION_IDS, RARITY_WEIGHTS, UPGRADE_DEFINITIONS } from './UpgradeDefinitions';
import type { UpgradeDefinition } from './UpgradeDefinitions';

export class UpgradeSystem {
  private targetAvailable: (target: UpgradeDefinition['target']) => boolean = () => true;
  private rarityAvailable: (rarity: UpgradeDefinition['rarity']) => boolean = () => true;
  private level = 0;
  private nextLevelKills = 10;
  private pendingChoices: UpgradeDefinition[] | null = null;
  private readonly levels: Record<string, number> = {};
  private readonly evolutions: Record<string, boolean> = {};

  registerKill(totalKills: number): boolean {
    if (this.pendingChoices || totalKills < this.nextLevelKills) return false;
    this.level++;
    this.nextLevelKills += 10 + this.level * 5;
    this.pendingChoices = this.createChoices();
    return true;
  }

  takePendingChoices(): readonly UpgradeDefinition[] | null {
    return this.pendingChoices;
  }

  choose(index: number): UpgradeDefinition | null {
    if (!this.pendingChoices || index < 0 || index >= this.pendingChoices.length) return null;
    const choice = this.pendingChoices[index];
    this.pendingChoices = null;
    this.levels[choice.id] = (this.levels[choice.id] ?? 0) + 1;
    if (EVOLUTION_IDS.has(choice.id)) this.evolutions[choice.id] = true;
    return choice;
  }

  reset(): void {
    this.level = 0;
    this.nextLevelKills = 10;
    this.pendingChoices = null;
    for (const key in this.levels) delete this.levels[key];
    for (const key in this.evolutions) delete this.evolutions[key];
  }

  get currentLevel(): number {
    return this.level;
  }

  setTargetAvailability(targetAvailable: (target: UpgradeDefinition['target']) => boolean): void {
    this.targetAvailable = targetAvailable;
  }

  setRarityAvailability(rarityAvailable: (rarity: UpgradeDefinition['rarity']) => boolean): void {
    this.rarityAvailable = rarityAvailable;
  }

  getLevel(id: string): number { return this.levels[id] ?? 0; }
  hasEvolution(id: string): boolean { return this.evolutions[id] === true; }
  offerEvolution(evolution: UpgradeDefinition): boolean {
    if (this.pendingChoices || this.hasEvolution(evolution.id)) return false;
    this.pendingChoices = [evolution];
    return true;
  }

  private createChoices(): UpgradeDefinition[] {
    const pool: UpgradeDefinition[] = [];
    for (let index = 0; index < UPGRADE_DEFINITIONS.length; index++) {
      const upgrade = UPGRADE_DEFINITIONS[index];
      if (this.targetAvailable(upgrade.target) && this.rarityAvailable(upgrade.rarity) && (!EVOLUTION_IDS.has(upgrade.id) || !this.hasEvolution(upgrade.id))) pool.push(upgrade);
    }
    const choices: UpgradeDefinition[] = [];
    while (choices.length < 3 && pool.length > 0) {
      let totalWeight = 0;
      for (let index = 0; index < pool.length; index++) totalWeight += this.weightFor(pool[index]);
      let roll = Math.random() * totalWeight;
      let selectedIndex = pool.length - 1;
      for (let index = 0; index < pool.length; index++) {
        roll -= this.weightFor(pool[index]);
        if (roll <= 0) {
          selectedIndex = index;
          break;
        }
      }
      choices.push(pool[selectedIndex]);
      pool.splice(selectedIndex, 1);
    }
    return choices;
  }

  private weightFor(upgrade: UpgradeDefinition): number {
    return RARITY_WEIGHTS[upgrade.rarity];
  }
}
