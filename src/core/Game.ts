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
  private readonly onUpgradeChoices: (choices: readonly UpgradeDefinition[] | null) => void;
  private wallHp: number = TUNING.wallMaxHp;
  private gold = 0;
  private kills = 0;
  private elapsed = 0;
  private spawnTimer = 0;
  private gameOver = false;
  private fps = 60;
  private invincible = false;
  private gameSpeed = 1;
  private damageShopLevel = 0;
  private speedShopLevel = 0;
  private wallMaxHp: number = TUNING.wallMaxHp;
  private wallArmor = 0;
  private rewardMultiplier = 1;
  private earnedTokens = 0;
  private progressionOpen = false;
  private started = false;

  constructor(canvas: HTMLCanvasElement, hud: HUD, progression: MetaProgression, onUpgradeChoices: (choices: readonly UpgradeDefinition[] | null) => void) {
    this.canvas = canvas;
    this.hud = hud;
    this.onUpgradeChoices = onUpgradeChoices;
    this.progression = progression;
    this.renderer = new Renderer(canvas.getContext('2d')!);
    this.weapons = new WeaponManager(TUNING.logicalHeight - TUNING.wallHeight, TUNING.logicalWidth);
    this.chaos = new ChaosSystem(TUNING.logicalWidth, TUNING.logicalHeight - TUNING.wallHeight);
    this.applyPermanentBonuses();
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  update(deltaTime: number, fps: number): void {
    this.fps = fps;
    if (this.started && !this.gameOver && !this.progressionOpen && !this.upgrades.takePendingChoices()) {
      const simulationDelta = deltaTime * this.gameSpeed;
      this.elapsed += simulationDelta;
      this.spawnTimer -= simulationDelta;
      const spawnInterval = Math.max(0.08, 0.85 - this.elapsed * 0.008);
      while (this.spawnTimer <= 0) {
        const nextEnemy = this.waveDirector.chooseEnemy(this.elapsed);
        this.enemies.spawn(18 + Math.random() * (TUNING.logicalWidth - 36), 1 + this.elapsed * 0.004, 1 + this.elapsed * 0.002, nextEnemy.type, nextEnemy.elite);
        this.spawnTimer += spawnInterval;
      }
      this.enemies.update(simulationDelta, TUNING.logicalWidth, TUNING.logicalHeight - TUNING.wallHeight, (damage) => this.damageWall(damage), (reward) => this.registerKill(reward));
      this.grid.rebuild(this.enemies);
      this.weapons.update(simulationDelta, this.enemies, this.grid, this.projectiles, (reward) => this.registerKill(reward));
      this.projectiles.update(simulationDelta, this.enemies, this.grid, (reward) => this.registerKill(reward));
      this.chaos.update(simulationDelta, this.enemies, this.grid, (reward) => this.registerKill(reward));
      this.enemies.compact();
    }
    this.render();
  }

  restart(): void {
    this.started = true;
    this.enemies.clear();
    this.projectiles.count = 0;
    this.applyPermanentBonuses();
    this.wallHp = this.wallMaxHp;
    this.gold = this.progression.bonuses.startingGold;
    this.kills = 0;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.gameOver = false;
    this.damageShopLevel = 0;
    this.speedShopLevel = 0;
    this.weapons.reset();
    this.upgrades.reset();
    this.waveDirector.reset();
    this.chaos.reset();
    this.earnedTokens = 0;
    this.onUpgradeChoices(null);
  }

  start(): void {
    this.restart();
  }

  chooseUpgrade(index: number): void {
    const choice = this.upgrades.choose(index);
    if (!choice) return;
    this.weapons.applyUpgrade(choice.id);
    this.onUpgradeChoices(null);
  }

  setProgressionOpen(isOpen: boolean): void {
    this.progressionOpen = isOpen;
  }

  activateAbility(id: AbilityIdValue): void {
    if (this.gameOver || this.progressionOpen || this.upgrades.takePendingChoices()) return;
    this.chaos.activate(id, this.enemies, this.grid, (reward) => this.registerKill(reward));
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
    this.wallHp = TUNING.wallMaxHp;
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
    this.gold += Math.max(1, Math.ceil(reward * this.rewardMultiplier));
    if (this.upgrades.registerKill(this.kills)) this.onUpgradeChoices(this.upgrades.takePendingChoices());
  }

  private render(): void {
    this.renderer.render(TUNING.logicalWidth, TUNING.logicalHeight, this.enemies, this.projectiles, this.weapons, this.chaos, this.wallHp);
    this.hud.update({ wallHp: this.wallHp, maxWallHp: this.wallMaxHp, gold: this.gold, kills: this.kills, enemyCount: this.enemies.count, fps: this.fps, level: this.upgrades.currentLevel, warTokens: this.progression.warTokens, earnedTokens: this.earnedTokens, gameOver: this.gameOver });
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
    this.earnedTokens = this.progression.awardTokens(baseTokens, this.kills, this.gold);
  }

  private applyPermanentBonuses(): void {
    const bonuses = this.progression.bonuses;
    this.wallMaxHp = bonuses.wallMaxHp;
    this.wallArmor = bonuses.wallArmor;
    this.rewardMultiplier = bonuses.rewardMultiplier;
    this.weapons.setPermanentBonuses(bonuses.damageMultiplier, bonuses.ballistaSpeedMultiplier);
    this.wallHp = this.wallMaxHp;
  }
}
