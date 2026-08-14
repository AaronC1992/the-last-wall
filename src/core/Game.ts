import { TUNING } from './Constants';
import { EnemyManager } from '../enemies/EnemyManager';
import { ProjectileManager } from '../weapons/ProjectileManager';
import { WeaponManager } from '../weapons/WeaponManager';
import { Renderer } from '../rendering/Renderer';
import { HUD } from '../ui/HUD';
import { SpatialGrid } from '../systems/SpatialGrid';
import { UpgradeSystem } from '../systems/UpgradeSystem';
import type { UpgradeDefinition } from '../systems/UpgradeDefinitions';
import { WaveDirector } from '../systems/WaveDirector';
import { EnemyType } from '../enemies/EnemyTypes';
import { MetaProgression } from '../progression/MetaProgression';
import { ChaosSystem } from '../systems/ChaosSystem';
import type { AbilityIdValue } from '../systems/ChaosSystem';
import type { FeatureUnlockId } from '../progression/FeatureUnlocks';
import { FeedbackSystem } from '../systems/FeedbackSystem';
import { EVOLUTION_DEFINITIONS } from '../systems/UpgradeDefinitions';
import { MapSpawnSystem } from '../map/MapSpawnSystem';

export class Game {
  private readonly canvas: HTMLCanvasElement;
  private readonly hud: HUD;
  private readonly enemies = new EnemyManager();
  private readonly projectiles = new ProjectileManager();
  private readonly grid = new SpatialGrid(TUNING.logicalWidth, TUNING.logicalHeight, TUNING.spatialCellSize, TUNING.maxEnemies);
  private readonly renderer: Renderer;
  private readonly weapons: WeaponManager;
  private readonly upgrades = new UpgradeSystem();
  private readonly waveDirector = new WaveDirector();
  private readonly progression: MetaProgression;
  private readonly chaos: ChaosSystem;
  private readonly feedback = new FeedbackSystem();
  private readonly mapSpawns = new MapSpawnSystem();
  private readonly onUpgradeChoices: (choices: readonly UpgradeDefinition[] | null) => void;
  private wallHp: number = TUNING.wallMaxHp;
  private gold = 0;
  private kills = 0;
  private elapsed = 0;
  private gameOver = false;
  private fps = 60;
  private invincible = false;
  private gameSpeed = 1;
  private damageShopLevel = 0;
  private speedShopLevel = 0;
  private wallMaxHp: number = TUNING.wallMaxHp;
  private wallArmor = 0;
  private rewardMultiplier = 1;
  private runWallBonus = 0;
  private earnedTokens = 0;
  private highestCombo = 0;
  private progressionOpen = false;
  private started = false;
  private mapIntroTimer = 0;

  constructor(canvas: HTMLCanvasElement, hud: HUD, progression: MetaProgression, onUpgradeChoices: (choices: readonly UpgradeDefinition[] | null) => void) {
    this.canvas = canvas;
    this.hud = hud;
    this.onUpgradeChoices = onUpgradeChoices;
    this.progression = progression;
    this.renderer = new Renderer(canvas.getContext('2d')!);
    this.weapons = new WeaponManager(TUNING.logicalHeight - TUNING.wallHeight, TUNING.logicalWidth);
    this.upgrades.setTargetAvailability((target) => this.weapons.isTargetBuilt(target));
    this.upgrades.setRarityAvailability((rarity) => this.progression.isRarityUnlocked(rarity));
    this.chaos = new ChaosSystem(TUNING.logicalWidth, TUNING.logicalHeight - TUNING.wallHeight);
    this.applyPermanentBonuses();
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  updateSimulation(deltaTime: number): void {
    if (this.started && !this.gameOver && !this.progressionOpen && !this.upgrades.takePendingChoices()) {
      const simulationDelta = deltaTime * this.gameSpeed;
      this.mapIntroTimer = Math.max(0, this.mapIntroTimer - simulationDelta);
      this.elapsed += simulationDelta;
      this.waveDirector.update(simulationDelta, this.enemies.count, (type, elite) => {
        const spawn = this.mapSpawns.nextSpawn();
        this.enemies.spawnAt(spawn.x, spawn.y, 1 + this.waveDirector.currentWave * 0.012, 1 + this.waveDirector.currentWave * 0.018, type, elite, spawn.targetX);
      });
      this.enemies.update(simulationDelta, TUNING.logicalWidth, TUNING.logicalHeight - TUNING.wallHeight, (damage) => this.damageWall(damage), (reward, index, burning) => {
        this.registerKill(reward);
        if (burning) this.weapons.handleBurnDeath(index, this.enemies, this.grid);
      });
      this.grid.rebuild(this.enemies);
      this.weapons.update(simulationDelta, this.enemies, this.grid, this.projectiles, (reward) => this.registerKill(reward));
      this.projectiles.update(simulationDelta, this.enemies, this.grid, (reward) => this.registerKill(reward), (x, y, damage) => this.feedback.registerDamage(x, y, damage, this.progression.settings.damageNumbers));
      this.chaos.update(simulationDelta, this.enemies, this.grid, (reward) => this.registerKill(reward));
      this.enemies.compact();
      this.feedback.update(simulationDelta);
    }
  }

  render(fps: number): void {
    this.fps = fps;
    this.renderer.render(TUNING.logicalWidth, TUNING.logicalHeight, this.enemies, this.projectiles, this.weapons, this.chaos, this.feedback, this.wallHp, this.wallMaxHp, this.progression.settings.damageNumbers, this.progression.settings.screenShake);
    this.hud.update({ wallHp: this.wallHp, maxWallHp: this.wallMaxHp, gold: this.gold, kills: this.kills, enemyCount: this.enemies.count, fps: this.fps, level: this.upgrades.currentLevel, wave: this.waveDirector.currentWave, waveBudget: this.waveDirector.currentBudget, announcement: this.waveDirector.announcement, mapIntro: this.mapIntroTimer > 0, warTokens: this.progression.warTokens, earnedTokens: this.earnedTokens, gameOver: this.gameOver });
  }

  restart(): void {
    this.started = true;
    this.enemies.clear();
    this.projectiles.count = 0;
    this.projectiles.droppedProjectiles = 0;
    this.applyPermanentBonuses();
    this.wallHp = this.wallMaxHp;
    this.gold = this.progression.bonuses.startingGold;
    this.kills = 0;
    this.elapsed = 0;
    this.gameOver = false;
    this.damageShopLevel = 0;
    this.speedShopLevel = 0;
    this.weapons.reset();
    this.upgrades.reset();
    this.waveDirector.reset();
    this.mapSpawns.reset();
    this.chaos.reset();
    this.feedback.reset();
    this.renderer.clearDecals();
    this.runWallBonus = 0;
    this.earnedTokens = 0;
    this.mapIntroTimer = 2;
    this.highestCombo = 0;
    this.onUpgradeChoices(null);
  }

  start(): void {
    this.restart();
  }

  chooseUpgrade(index: number): void {
    const choice = this.upgrades.choose(index);
    if (!choice) return;
    if (choice.target === 'general') this.applyGeneralUpgrade(choice.id);
    else this.weapons.applyUpgrade(choice.id);
    this.onUpgradeChoices(null);
    this.offerEligibleEvolution();
  }

  setProgressionOpen(isOpen: boolean): void {
    this.progressionOpen = isOpen;
  }

  activateAbility(id: AbilityIdValue): void {
    if (this.gameOver || this.progressionOpen || this.upgrades.takePendingChoices()) return;
    if (!this.isAbilityUnlocked(id)) return;
    if (this.chaos.activate(id, this.enemies, this.grid, (reward) => this.registerKill(reward))) this.feedback.triggerShake(id === 4 ? 14 : 7);
  }

  isAbilityUnlocked(id: AbilityIdValue): boolean {
    const unlocks: readonly FeatureUnlockId[] = ['meteor', 'artillery', 'dragon', 'deathBeam', 'apocalypse'];
    return this.progression.isUnlocked(unlocks[id]);
  }

  buildWeapon(id: 'cannon' | 'fireTower' | 'lightningTower'): void {
    const cost = id === 'cannon' ? 150 : id === 'fireTower' ? 240 : 360;
    if (!this.progression.isUnlocked(id) || this.gold < cost || !this.weapons.build(id)) return;
    this.gold -= cost;
  }

  repairWall(): void {
    const cost = 40;
    if (this.gold < cost || this.wallHp >= this.wallMaxHp) return;
    this.gold -= cost;
    this.wallHp = Math.min(this.wallMaxHp, this.wallHp + 25);
  }

  getAbilityCooldown(id: AbilityIdValue): number {
    return this.chaos.getCooldown(id);
  }

  buyDamageUpgrade(): void {
    const cost = this.damageUpgradeCost;
    if (this.gold < cost) return;
    this.gold -= cost;
    this.damageShopLevel++;
    this.weapons.applyUpgrade('damage');
  }

  buySpeedUpgrade(): void {
    const cost = this.speedUpgradeCost;
    if (this.gold < cost) return;
    this.gold -= cost;
    this.speedShopLevel++;
    this.weapons.applyUpgrade('attackSpeed');
  }

  get shopState() {
    return { gold: this.gold, damageCost: this.damageUpgradeCost, speedCost: this.speedUpgradeCost };
  }

  get economyState() {
    return {
      gold: this.gold,
      wallFull: this.wallHp >= this.wallMaxHp,
      cannonUnlocked: this.progression.isUnlocked('cannon'), cannonBuilt: this.weapons.isBuilt('cannon'),
      fireUnlocked: this.progression.isUnlocked('fireTower'), fireBuilt: this.weapons.isBuilt('fireTower'),
      lightningUnlocked: this.progression.isUnlocked('lightningTower'), lightningBuilt: this.weapons.isBuilt('lightningTower'),
    };
  }

  spawnHorde(count: number): void {
    const wallY = TUNING.logicalHeight - TUNING.wallHeight - TUNING.enemyRadius * 2;
    for (let index = 0; index < count; index++) {
      if (!this.enemies.spawnAt(TUNING.enemyRadius + Math.random() * (TUNING.logicalWidth - TUNING.enemyRadius * 2), Math.random() * wallY)) break;
    }
  }

  spawnBoss(): void {
    this.enemies.spawnAt(TUNING.logicalWidth / 2, TUNING.logicalHeight * 0.3, 1, 1, EnemyType.Boss);
  }

  spawnElite(): void {
    this.enemies.spawnAt(TUNING.logicalWidth * 0.5, TUNING.logicalHeight * 0.22, 1, 1, EnemyType.Brute, true);
  }

  forceEndRun(): void {
    this.wallHp = 0;
    this.endRun();
  }

  killAll(): void {
    this.enemies.clear();
    this.projectiles.count = 0;
  }

  addGold(): void {
    this.gold += 10000;
  }

  healWall(): void {
    this.wallHp = this.wallMaxHp;
    this.gameOver = false;
  }

  toggleInvincibility(): void {
    this.invincible = !this.invincible;
  }

  increaseGameSpeed(): void {
    this.gameSpeed = this.gameSpeed >= 4 ? 1 : this.gameSpeed + 1;
  }

  get debugState() {
    return {
      fps: this.fps,
      enemies: this.enemies.count,
      projectiles: this.projectiles.count,
      droppedProjectiles: this.projectiles.droppedProjectiles,
      gridCells: this.grid.cellCount,
      totalSpawned: this.enemies.totalSpawned,
      activeEffects: this.chaos.activeEffects,
      invincible: this.invincible,
      gameSpeed: this.gameSpeed,
    };
  }

  private damageWall(damage: number): void {
    if (this.invincible) return;
    this.wallHp = Math.max(0, this.wallHp - Math.max(1, damage - this.wallArmor));
    if (this.wallHp === 0) this.endRun();
  }

  private registerKill(reward: number): void {
    this.kills++;
    this.renderer.addDeathDecal(this.enemies.lastDeathX, this.enemies.lastDeathY);
    this.feedback.registerKill(this.kills);
    this.highestCombo = Math.max(this.highestCombo, this.feedback.currentCombo);
    this.gold += Math.max(1, Math.ceil(reward * this.rewardMultiplier * this.feedback.goldMultiplier));
    if (this.upgrades.registerKill(this.kills)) this.onUpgradeChoices(this.upgrades.takePendingChoices());
  }

  private resize(): void {
    const bounds = this.canvas.parentElement!.getBoundingClientRect();
    const scale = Math.min(bounds.width / TUNING.logicalWidth, bounds.height / TUNING.logicalHeight);
    const displayWidth = Math.floor(TUNING.logicalWidth * scale);
    const displayHeight = Math.floor(TUNING.logicalHeight * scale);
    const pixelRatio = window.devicePixelRatio || 1;
    this.canvas.width = TUNING.logicalWidth * pixelRatio;
    this.canvas.height = TUNING.logicalHeight * pixelRatio;
    this.canvas.style.width = `${displayWidth}px`;
    this.canvas.style.height = `${displayHeight}px`;
    const context = this.canvas.getContext('2d')!;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  }

  private get damageUpgradeCost(): number {
    return 15 + this.damageShopLevel * 10;
  }

  private get speedUpgradeCost(): number {
    return 20 + this.speedShopLevel * 15;
  }

  private endRun(): void {
    if (this.gameOver) return;
    this.gameOver = true;
    const baseTokens = Math.floor(this.kills / 20 + this.elapsed / 90);
    this.earnedTokens = this.progression.awardTokens(baseTokens, this.kills, this.gold, this.highestCombo);
  }

  private applyPermanentBonuses(): void {
    const bonuses = this.progression.bonuses;
    this.wallMaxHp = bonuses.wallMaxHp;
    this.wallArmor = bonuses.wallArmor;
    this.rewardMultiplier = bonuses.rewardMultiplier;
    this.weapons.setPermanentBonuses(bonuses.damageMultiplier, bonuses.ballistaSpeedMultiplier);
    this.wallHp = this.wallMaxHp;
  }

  private applyGeneralUpgrade(id: string): void {
    if (id === 'repair') {
      this.wallHp = Math.min(this.wallMaxHp, this.wallHp + 20);
      return;
    }
    if (id === 'wallMax') {
      this.runWallBonus += 20;
      this.wallMaxHp += 20;
      this.wallHp += 20;
      return;
    }
    if (id === 'goldBonus') {
      this.rewardMultiplier *= 1.15;
      return;
    }
    if (id === 'abilityHaste') this.chaos.applyCooldownHaste();
  }

  private offerEligibleEvolution(): void {
    if (!this.progression.isUnlocked('evolutions')) return;
    let evolution: keyof typeof EVOLUTION_DEFINITIONS | null = null;
    if (!this.upgrades.hasEvolution('boltStorm') && this.upgrades.getLevel('projectiles') >= 3 && this.upgrades.getLevel('penetration') >= 3 && this.upgrades.getLevel('attackSpeed') >= 3) evolution = 'boltStorm';
    else if (this.weapons.isBuilt('cannon') && !this.upgrades.hasEvolution('carpetBombardment') && this.upgrades.getLevel('cannonDamage') >= 3 && this.upgrades.getLevel('cannonRadius') >= 3 && this.upgrades.getLevel('clusterShells') >= 1) evolution = 'carpetBombardment';
    else if (this.weapons.isBuilt('fireTower') && !this.upgrades.hasEvolution('hellfire') && this.upgrades.getLevel('fireDamage') >= 3 && this.upgrades.getLevel('fireRadius') >= 3 && this.upgrades.getLevel('fireSpread') >= 1) evolution = 'hellfire';
    else if (this.weapons.isBuilt('lightningTower') && !this.upgrades.hasEvolution('thunderstorm') && this.upgrades.getLevel('lightningDamage') >= 3 && this.upgrades.getLevel('lightningChains') >= 3 && this.upgrades.getLevel('lightningRange') >= 3) evolution = 'thunderstorm';
    if (evolution && this.upgrades.offerEvolution(EVOLUTION_DEFINITIONS[evolution])) this.onUpgradeChoices(this.upgrades.takePendingChoices());
  }
}
