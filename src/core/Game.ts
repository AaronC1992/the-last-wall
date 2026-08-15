import { TUNING } from './Constants';
import { Camera } from './Camera';
import { BattlefieldInput } from './BattlefieldInput';
import type { BattlefieldActions } from './BattlefieldInput';
import { EnemyManager } from '../enemies/EnemyManager';
import { ProjectileManager } from '../weapons/ProjectileManager';
import { WeaponManager } from '../weapons/WeaponManager';
import { Renderer } from '../rendering/Renderer';
import type { GhostTower } from '../rendering/Renderer';
import { HUD } from '../ui/HUD';
import type { TowerReadout } from '../ui/HUD';
import { SpatialGrid } from '../systems/SpatialGrid';
import { WaveDirector } from '../systems/WaveDirector';
import { EnemyType } from '../enemies/EnemyTypes';
import { MetaProgression } from '../progression/MetaProgression';
import type { TokenBreakdown } from '../progression/MetaProgression';
import { ChaosSystem } from '../systems/ChaosSystem';
import type { AbilityIdValue } from '../systems/ChaosSystem';
import type { FeatureUnlockId } from '../progression/FeatureUnlocks';
import { FeedbackSystem } from '../systems/FeedbackSystem';
import { MapSpawnSystem } from '../map/MapSpawnSystem';
import { TOWER_CONFIG, towerConfig } from '../weapons/TowerConfig';
import type { TowerKind } from '../weapons/TowerConfig';
import type { BuildSlotState } from '../ui/BuildBar';

export type GamePhase = 'idle' | 'build' | 'battle';

export class Game implements BattlefieldActions {
  private readonly canvas: HTMLCanvasElement;
  private readonly hud: HUD;
  private readonly enemies = new EnemyManager();
  private readonly projectiles = new ProjectileManager();
  private readonly grid = new SpatialGrid(TUNING.logicalWidth, TUNING.logicalHeight, TUNING.spatialCellSize, TUNING.maxEnemies);
  private readonly renderer: Renderer;
  private readonly weapons: WeaponManager;
  private readonly waveDirector = new WaveDirector();
  private readonly progression: MetaProgression;
  private readonly chaos: ChaosSystem;
  private readonly feedback = new FeedbackSystem();
  private readonly mapSpawns = new MapSpawnSystem();
  private readonly camera = new Camera(TUNING.logicalWidth, TUNING.logicalHeight, TUNING.logicalWidth, TUNING.logicalHeight);
  private readonly onRunEnd: (breakdown: TokenBreakdown, survived: boolean) => void;
  private wallHp: number = TUNING.wallMaxHp;
  private gold = 0;
  private kills = 0;
  private elapsed = 0;
  private phase: GamePhase = 'idle';
  private gameOver = false;
  private fps = 60;
  private invincible = false;
  private gameSpeed = 1;
  private wallMaxHp: number = TUNING.wallMaxHp;
  private wallArmor = 0;
  private rewardMultiplier = 1;
  private highestCombo = 0;
  private menuOpen = false;
  private mapIntroTimer = 0;
  private armed: TowerKind | null = null;
  private selectedId = 0;
  private hoveredId = 0;
  private pointerX = 0;
  private pointerY = 0;
  private pointerOverCanvas = false;

  constructor(
    canvas: HTMLCanvasElement,
    hud: HUD,
    progression: MetaProgression,
    onRunEnd: (breakdown: TokenBreakdown, survived: boolean) => void,
  ) {
    this.canvas = canvas;
    this.hud = hud;
    this.onRunEnd = onRunEnd;
    this.progression = progression;
    this.renderer = new Renderer(canvas.getContext('2d')!);
    this.weapons = new WeaponManager(TUNING.logicalHeight - TUNING.wallHeight, TUNING.logicalWidth);
    this.chaos = new ChaosSystem(TUNING.logicalWidth, TUNING.logicalHeight - TUNING.wallHeight);
    this.applyPermanentBonuses();
    this.resize();
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('keydown', (event) => this.onKeyDown(event));
    new BattlefieldInput(canvas, this.camera, TUNING.logicalWidth, TUNING.logicalHeight, this);
  }

  updateSimulation(deltaTime: number): void {
    if (this.phase !== 'battle' || this.gameOver || this.menuOpen) return;
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
    if (this.waveDirector.isWaveCleared(this.enemies.count)) this.enterBuildPhase();
  }

  render(fps: number): void {
    this.fps = fps;
    this.renderer.render({
      width: TUNING.logicalWidth,
      height: TUNING.logicalHeight,
      enemies: this.enemies,
      projectiles: this.projectiles,
      weapons: this.weapons,
      chaos: this.chaos,
      feedback: this.feedback,
      wallHp: this.wallHp,
      wallMaxHp: this.wallMaxHp,
      damageNumbers: this.progression.settings.damageNumbers,
      screenShake: this.progression.settings.screenShake,
      camera: this.camera,
      buildPhase: this.phase === 'build',
      selectedTowerId: this.selectedId,
      hoveredTowerId: this.hoveredId,
      ghost: this.ghostTower(),
    });
    this.hud.update({
      wallHp: this.wallHp,
      maxWallHp: this.wallMaxHp,
      gold: this.gold,
      kills: this.kills,
      enemyCount: this.enemies.count,
      fps: this.fps,
      level: 0,
      wave: this.waveDirector.currentWave,
      announcement: this.waveDirector.announcement,
      mapIntro: this.mapIntroTimer > 0,
      warTokens: this.progression.warTokens,
      buildPhase: this.phase === 'build',
      towers: this.towerReadouts(),
    });
  }

  restart(): void {
    this.enemies.clear();
    this.projectiles.count = 0;
    this.projectiles.droppedProjectiles = 0;
    this.weapons.reset();
    this.applyPermanentBonuses();
    this.wallHp = this.wallMaxHp;
    this.gold = this.progression.bonuses.startingGold;
    this.kills = 0;
    this.elapsed = 0;
    this.gameOver = false;
    this.waveDirector.reset();
    this.mapSpawns.reset();
    this.chaos.reset();
    this.feedback.reset();
    this.renderer.clearDecals();
    this.camera.reset();
    this.selectedId = 0;
    this.hoveredId = 0;
    this.mapIntroTimer = 2;
    this.highestCombo = 0;
    this.phase = 'build';
  }

  start(): void {
    this.restart();
  }

  startBattle(): void {
    if (this.phase !== 'build' || this.gameOver) return;
    this.phase = 'battle';
    this.selectedId = 0;
    this.waveDirector.startWave();
  }

  get currentPhase(): GamePhase {
    return this.phase;
  }

  buildSlotStates(): readonly BuildSlotState[] {
    return TOWER_CONFIG.map((config) => ({
      kind: config.kind,
      unlocked: config.unlock === null || this.progression.isUnlocked(config.unlock),
      count: this.weapons.countOf(config.kind),
      limit: this.weapons.limitOf(config.kind),
      cost: config.cost,
      affordable: this.gold >= config.cost,
    }));
  }

  setArmedKind(kind: TowerKind | null): void {
    this.armed = kind;
    if (kind) this.selectedId = 0;
  }



  setProgressionOpen(isOpen: boolean): void {
    this.menuOpen = isOpen;
  }

  activateAbility(id: AbilityIdValue): void {
    if (this.phase !== 'battle' || this.gameOver || this.menuOpen) return;
    if (!this.isAbilityUnlocked(id)) return;
    if (this.chaos.activate(id, this.enemies, this.grid, (reward) => this.registerKill(reward))) this.feedback.triggerShake(id === 4 ? 14 : 7);
  }

  isAbilityUnlocked(id: AbilityIdValue): boolean {
    const unlocks: readonly FeatureUnlockId[] = ['meteor', 'artillery', 'dragon', 'deathBeam', 'apocalypse'];
    return this.progression.isUnlocked(unlocks[id]);
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

  get economyState() {
    return { gold: this.gold, wallFull: this.wallHp >= this.wallMaxHp };
  }

  // BattlefieldActions

  isInteractive(): boolean {
    return this.phase !== 'idle' && !this.gameOver && !this.menuOpen;
  }

  armedKind(): TowerKind | null {
    return this.phase === 'build' ? this.armed : null;
  }

  placeTower(x: number, y: number): void {
    if (this.phase !== 'build' || !this.armed) return;
    const config = towerConfig(this.armed);
    if (this.gold < config.cost) return;
    const spot = this.weapons.clampToBuildZone(x, y);
    if (!this.weapons.place(this.armed, spot.x, spot.y)) return;
    this.gold -= config.cost;
  }

  towerIdAt(x: number, y: number): number {
    return this.weapons.findAt(x, y)?.id ?? 0;
  }

  selectTower(id: number): void {
    this.selectedId = id;
    if (id > 0) this.armed = null;
  }

  selectedTowerId(): number {
    return this.selectedId;
  }

  moveTower(id: number, x: number, y: number): void {
    if (this.phase !== 'build') return;
    const spot = this.weapons.clampToBuildZone(x, y);
    this.weapons.moveTower(id, spot.x, spot.y);
    this.selectedId = id;
  }

  aimTower(id: number, x: number, y: number): void {
    this.weapons.aimTower(id, x, y);
  }

  removeTower(id: number): void {
    if (this.phase !== 'build') return;
    const kind = this.weapons.remove(id);
    if (!kind) return;
    this.gold += Math.floor(towerConfig(kind).cost * 0.75);
    if (this.selectedId === id) this.selectedId = 0;
  }

  removeAllTowers(): void {
    if (this.phase !== 'build') return;
    for (const kind of this.weapons.removeAll()) this.gold += Math.floor(towerConfig(kind).cost * 0.75);
    this.selectedId = 0;
  }

  setPointer(x: number, y: number, overCanvas: boolean): void {
    this.pointerX = x;
    this.pointerY = y;
    this.pointerOverCanvas = overCanvas;
  }

  setHoveredTower(id: number): void {
    this.hoveredId = id;
  }

  // Debug helpers

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

  private onKeyDown(event: KeyboardEvent): void {
    if (event.target instanceof HTMLInputElement) return;
    if (event.code === 'Space' && this.phase === 'build') {
      event.preventDefault();
      this.startBattle();
    }
  }

  private ghostTower(): GhostTower | null {
    if (this.phase !== 'build' || !this.armed || !this.pointerOverCanvas) return null;
    const spot = this.weapons.clampToBuildZone(this.pointerX, this.pointerY);
    return {
      kind: this.armed,
      x: spot.x,
      y: spot.y,
      valid: this.weapons.canPlaceAt(this.armed, spot.x, spot.y) && this.gold >= towerConfig(this.armed).cost,
    };
  }

  private towerReadouts(): readonly TowerReadout[] {
    return TOWER_CONFIG.map((config) => ({
      kind: config.kind,
      count: this.weapons.countOf(config.kind),
      limit: this.weapons.limitOf(config.kind),
      unlocked: config.unlock === null || this.progression.isUnlocked(config.unlock),
    }));
  }

  private enterBuildPhase(): void {
    this.phase = 'build';
    this.armed = null;
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

  private endRun(): void {
    if (this.gameOver) return;
    this.gameOver = true;
    this.phase = 'idle';
    const breakdown = this.progression.awardTokens(this.kills, this.elapsed, this.gold, this.highestCombo);
    this.onRunEnd(breakdown, this.wallHp > 0);
  }

  private applyPermanentBonuses(): void {
    const bonuses = this.progression.bonuses;
    this.wallMaxHp = bonuses.wallMaxHp;
    this.wallArmor = bonuses.wallArmor;
    this.rewardMultiplier = bonuses.rewardMultiplier;
    this.weapons.setPermanentBonuses(bonuses.damageMultiplier, bonuses.ballistaSpeedMultiplier);
    for (const config of TOWER_CONFIG) this.weapons.setLimitBonus(config.kind, bonuses.towerSlots[config.kind]);
    this.wallHp = this.wallMaxHp;
  }

}
