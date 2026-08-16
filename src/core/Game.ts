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
import { TOWER_CONFIG } from '../weapons/TowerConfig';
import type { TowerKind } from '../weapons/TowerConfig';
import type { BuildSlotState } from '../ui/BuildBar';
import type { TowerLayoutEntry } from '../weapons/WeaponManager';
import { DEFAULT_CAMPAIGN_MAP } from '../map/CampaignMaps';
import type { MapDefinition } from '../map/TerrainTypes';
import { TerrainGrid } from '../map/TerrainGrid';
import { FlowField } from '../map/FlowField';
import { CongestionGrid } from '../systems/CongestionGrid';
import { ThreatMap } from '../systems/ThreatMap';

export type GamePhase = 'idle' | 'build' | 'battle';

export class Game implements BattlefieldActions {
  private readonly canvas: HTMLCanvasElement;
  private readonly hud: HUD;
  private readonly enemies = new EnemyManager();
  private readonly projectiles = new ProjectileManager();
  private readonly grid = new SpatialGrid(TUNING.logicalWidth, TUNING.logicalHeight, TUNING.spatialCellSize, TUNING.maxEnemies);
  private renderer: Renderer;
  private weapons: WeaponManager;
  private readonly waveDirector = new WaveDirector();
  private readonly progression: MetaProgression;
  private readonly chaos: ChaosSystem;
  private readonly feedback = new FeedbackSystem();
  private map: MapDefinition;
  private terrain: TerrainGrid;
  private flowField: FlowField;
  private mapSpawns: MapSpawnSystem;
  private congestion: CongestionGrid;
  private threatMap: ThreatMap;
  private readonly camera = new Camera(TUNING.logicalWidth, TUNING.logicalHeight, TUNING.logicalWidth, TUNING.logicalHeight);
  private readonly onRunEnd: (breakdown: TokenBreakdown, survived: boolean) => void;
  private wallHp: number = TUNING.wallMaxHp;
  private buildPoints = 0;
  private kills = 0;
  private elapsed = 0;
  private phase: GamePhase = 'idle';
  private gameOver = false;
  private fps = 60;
  private invincible = false;
  private gameSpeed = 1;
  private wallMaxHp: number = TUNING.wallMaxHp;
  private wallArmor = 0;
  private highestCombo = 0;
  private menuOpen = false;
  private mapIntroTimer = 0;
  private armed: TowerKind | null = null;
  private selectedId = 0;
  private hoveredId = 0;
  private pointerX = 0;
  private pointerY = 0;
  private pointerOverCanvas = false;
  private showThreatMap = false;
  private pendingAbility: AbilityIdValue | null = null;

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
    this.map = DEFAULT_CAMPAIGN_MAP;
    this.terrain = new TerrainGrid(this.map);
    this.flowField = new FlowField(this.terrain, this.map.goalCell);
    this.congestion = new CongestionGrid(this.terrain);
    this.threatMap = new ThreatMap(this.terrain);
    this.mapSpawns = new MapSpawnSystem(this.map);
    this.renderer = new Renderer(canvas.getContext('2d')!, this.map);
    this.weapons = new WeaponManager(TUNING.logicalHeight - TUNING.wallHeight, TUNING.logicalWidth, this.terrain);
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
      const bonuses = this.progression.bonuses;
      this.enemies.spawnAt(spawn.x, spawn.y, (1 + this.waveDirector.currentWave * 0.012) * bonuses.enemySpeedMultiplier, 1 + this.waveDirector.currentWave * 0.018, type, elite, spawn.targetX);
    });
    this.grid.rebuild(this.enemies);
    this.congestion.rebuild(this.enemies);
    this.enemies.update(simulationDelta, TUNING.logicalWidth, TUNING.logicalHeight - TUNING.wallHeight, (damage) => this.damageWall(damage), (_reward, index, burning) => {
      this.registerKill();
      if (burning) this.weapons.handleBurnDeath(index, this.enemies, this.grid);
    }, this.flowField, this.terrain, this.congestion, this.threatMap, this.grid);
    this.grid.rebuild(this.enemies);
    this.weapons.update(simulationDelta, this.enemies, this.grid, this.projectiles, () => this.registerKill());
    this.projectiles.update(simulationDelta, this.enemies, this.grid, () => this.registerKill(), (x, y, damage) => this.feedback.registerDamage(x, y, damage, this.progression.settings.damageNumbers), (x, y, damage, radius) => {
      this.damageArea(x, y, damage, radius);
      this.renderer.addExplosionDecal(x, y, radius);
    }, this.terrain);
    this.chaos.update(simulationDelta, this.enemies, this.grid, () => this.registerKill());
    this.enemies.compact();
    this.feedback.update(simulationDelta);
    if (this.waveDirector.isWaveCleared(this.enemies.count)) this.endRun();
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
      graphicsQuality: this.progression.settings.graphicsQuality,
      camera: this.camera,
      buildPhase: this.phase === 'build',
      selectedTowerId: this.selectedId,
      hoveredTowerId: this.hoveredId,
      ghost: this.ghostTower(),
      abilityTarget: this.pendingAbility === null ? null : { x: this.pointerOverCanvas ? this.pointerX : TUNING.logicalWidth / 2, y: this.pointerOverCanvas ? this.pointerY : (TUNING.logicalHeight - TUNING.wallHeight) * 0.42 },
      threatMap: this.threatMap,
      showThreatMap: this.showThreatMap,
    });
    this.hud.update({
      wallHp: this.wallHp,
      maxWallHp: this.wallMaxHp,
      buildPoints: this.buildPoints,
      kills: this.kills,
      enemyCount: this.enemies.count,
      fps: this.fps,
      announcement: this.waveDirector.announcement,
      mapIntro: this.mapIntroTimer > 0,
      warTokens: this.progression.warTokens,
      buildPhase: this.phase === 'build',
      towers: this.towerReadouts(),
    });
  }

  restart(): void {
    const existingLayout = this.weapons.exportLayout();
    this.enemies.clear();
    this.projectiles.count = 0;
    this.projectiles.droppedProjectiles = 0;
    this.weapons.reset();
    this.applyPermanentBonuses();
    const savedLayout = existingLayout.length > 0 ? existingLayout : this.readLayout();
    this.weapons.importLayout(savedLayout);
    this.threatMap.rebuild(this.weapons.towers);
    this.wallHp = this.wallMaxHp;
    this.buildPoints = Math.max(0, this.progression.bonuses.startingBuildPoints - this.weapons.totalCost());
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
    this.pendingAbility = null;
    this.mapIntroTimer = 2;
    this.highestCombo = 0;
    this.phase = 'build';
  }

  start(): void {
    this.restart();
  }

  loadMap(map: MapDefinition): void {
    this.map = map;
    this.terrain = new TerrainGrid(map);
    this.flowField = new FlowField(this.terrain, map.goalCell);
    this.congestion = new CongestionGrid(this.terrain);
    this.threatMap = new ThreatMap(this.terrain);
    this.mapSpawns = new MapSpawnSystem(map);
    this.renderer = new Renderer(this.canvas.getContext('2d')!, map);
    this.weapons = new WeaponManager(TUNING.logicalHeight - TUNING.wallHeight, TUNING.logicalWidth, this.terrain);
    this.restart();
  }

  get activeMap(): MapDefinition {
    return this.map;
  }

  startBattle(): void {
    if (this.phase !== 'build' || this.gameOver) return;
    if (!this.weapons.allAimed()) return;
    this.phase = 'battle';
    this.selectedId = 0;
    this.waveDirector.startWave(this.map.enemySettings.enemyCount);
  }

  returnToMainMenu(): void {
    if (this.phase === 'idle') return;
    this.gameOver = false;
    this.phase = 'idle';
    this.weapons.reset();
    this.enemies.clear();
    this.projectiles.count = 0;
    this.selectedId = 0;
    this.hoveredId = 0;
    this.armed = null;
    this.pendingAbility = null;
    this.kills = 0;
    this.elapsed = 0;
    this.waveDirector.reset();
    this.chaos.reset();
    this.feedback.reset();
    this.renderer.clearDecals();
    this.camera.reset();
    this.mapIntroTimer = 0;
    this.highestCombo = 0;
    this.selectedId = 0;
    this.threatMap.rebuild(this.weapons.towers);
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
      cost: this.weapons.costOf(config.kind),
      affordable: this.buildPoints >= this.weapons.costOf(config.kind),
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
    if (id === 4) {
      if (this.chaos.activate(id, this.enemies, this.grid, () => this.registerKill())) this.feedback.triggerShake(14);
      return;
    }
    this.pendingAbility = this.pendingAbility === id ? null : id;
  }

  abilityTargeting(): boolean {
    return this.pendingAbility !== null;
  }

  useAbilityAt(x: number, y: number): void {
    if (this.pendingAbility === null) return;
    if (x < 0 || y < 0) {
      this.pendingAbility = null;
      return;
    }
    const ability = this.pendingAbility;
    this.pendingAbility = null;
    if (this.chaos.activate(ability, this.enemies, this.grid, () => this.registerKill(), x, y)) this.feedback.triggerShake(7);
  }

  isAbilityUnlocked(id: AbilityIdValue): boolean {
    const unlocks: readonly FeatureUnlockId[] = ['meteor', 'artillery', 'dragon', 'deathBeam', 'apocalypse'];
    return this.progression.isUnlocked(unlocks[id]);
  }

  repairWall(): void {
    const bonuses = this.progression.bonuses;
    const cost = Math.max(10, 40 - bonuses.repairCostReduction);
    if (this.buildPoints < cost || this.wallHp >= this.wallMaxHp) return;
    this.buildPoints -= cost;
    this.wallHp = Math.min(this.wallMaxHp, this.wallHp + 25 + bonuses.repairBonus);
  }

  getAbilityCooldown(id: AbilityIdValue): number {
    return this.chaos.getCooldown(id);
  }

  getAbilityTotalCooldown(id: AbilityIdValue): number {
    return this.chaos.getTotalCooldown(id);
  }

  get economyState() {
    return { buildPoints: this.buildPoints, wallFull: this.wallHp >= this.wallMaxHp };
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
    const cost = this.weapons.costOf(this.armed);
    if (this.buildPoints < cost) return;
    const spot = this.weapons.clampToBuildZone(x, y);
    const placed = this.weapons.place(this.armed, spot.x, spot.y);
    if (!placed) return;
    this.buildPoints -= cost;
    this.selectedId = placed.id;
    this.armed = null;
    const aimTargetX = (Math.abs(this.pointerX - spot.x) > 2 || Math.abs(this.pointerY - spot.y) > 2) ? this.pointerX : spot.x;
    const aimTargetY = (Math.abs(this.pointerX - spot.x) > 2 || Math.abs(this.pointerY - spot.y) > 2) ? this.pointerY : spot.y - 100;
    this.weapons.aimTower(placed.id, aimTargetX, aimTargetY);
    this.saveLayout();
    this.threatMap.rebuild(this.weapons.towers);
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
    this.saveLayout();
    this.threatMap.rebuild(this.weapons.towers);
  }

  aimTower(id: number, x: number, y: number): void {
    if (this.phase === 'build') this.weapons.aimTower(id, x, y);
    this.saveLayout();
    this.threatMap.rebuild(this.weapons.towers);
  }

  removeTower(id: number): void {
    if (this.phase !== 'build') return;
    const kind = this.weapons.remove(id);
    if (!kind) return;
    this.buildPoints += this.weapons.costOf(kind);
    if (this.selectedId === id) this.selectedId = 0;
    this.saveLayout();
    this.threatMap.rebuild(this.weapons.towers);
  }

  removeAllTowers(): void {
    if (this.phase !== 'build') return;
    for (const kind of this.weapons.removeAll()) this.buildPoints += this.weapons.costOf(kind);
    this.selectedId = 0;
    this.saveLayout();
    this.threatMap.rebuild(this.weapons.towers);
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
    this.buildPoints += 10000;
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
      stuckRecoveries: this.enemies.stuckRecoveries,
      minimumEnemyY: this.enemies.minimumY,
      maximumEnemyY: this.enemies.maximumY,
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
    if (event.key === 't' || event.key === 'T') this.showThreatMap = !this.showThreatMap;
  }

  private ghostTower(): GhostTower | null {
    if (this.phase !== 'build' || !this.armed || !this.pointerOverCanvas) return null;
    const spot = this.weapons.clampToBuildZone(this.pointerX, this.pointerY);
    return {
      kind: this.armed,
      x: spot.x,
      y: spot.y,
      valid: this.weapons.canPlaceAt(this.armed, spot.x, spot.y) && this.buildPoints >= this.weapons.costOf(this.armed),
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

  private damageWall(damage: number): void {
    if (this.invincible) return;
    this.wallHp = Math.max(0, this.wallHp - Math.max(1, damage - this.wallArmor));
    if (this.wallHp === 0) this.endRun();
  }

  private registerKill(): void {
    this.kills++;
    this.renderer.addDeathDecal(this.enemies.lastDeathX, this.enemies.lastDeathY);
    this.feedback.registerKill(this.kills);
    this.highestCombo = Math.max(this.highestCombo, this.feedback.currentCombo);
    // Removed kill rewards
  }

  private damageArea(x: number, y: number, damage: number, radius: number): void {
    const count = this.grid.collectInRange(x, y, radius, this.enemies, 320);
    for (let index = 0; index < count; index++) {
      const killed = this.enemies.damage(this.grid.resultAt(index), damage);
      if (this.enemies.lastDamageDealt > 0) this.feedback.registerDamage(x, y, this.enemies.lastDamageDealt, this.progression.settings.damageNumbers);
      if (killed > 0) this.registerKill();
    }
  }

  private saveLayout(): void {
    try { localStorage.setItem(`the-last-wall-layout-${this.map.id}`, JSON.stringify(this.weapons.exportLayout())); } catch { /* optional storage */ }
  }

  private readLayout(): TowerLayoutEntry[] {
    try {
      const parsed = JSON.parse(localStorage.getItem(`the-last-wall-layout-${this.map.id}`) ?? '[]') as TowerLayoutEntry[];
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
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
    const survived = this.wallHp > 0;
    if (survived && !this.map.custom) this.progression.completeCampaign(this.map.id);
    const breakdown = this.progression.awardTokens(this.kills, this.elapsed, this.buildPoints, this.highestCombo, !this.map.custom);
    this.onRunEnd(breakdown, survived);
  }

  private applyPermanentBonuses(): void {
    const bonuses = this.progression.bonuses;
    this.wallMaxHp = bonuses.wallMaxHp;
    this.wallArmor = bonuses.wallArmor;
    this.chaos.setCooldownHaste(bonuses.abilityHaste);
    this.chaos.setAbilityPower(bonuses.abilityPower);
    this.weapons.setPermanentBonuses(bonuses.damageMultiplier, bonuses.ballistaSpeedMultiplier);
    for (const config of TOWER_CONFIG) {
      this.weapons.setLimitBonus(config.kind, bonuses.towerSlots[config.kind]);
      this.weapons.setTowerBonuses(config.kind, bonuses.towerDamage[config.kind], bonuses.towerSpeed[config.kind]);
      this.weapons.setTowerCostMultiplier(config.kind, bonuses.towerCost[config.kind]);
    }
    this.wallHp = this.wallMaxHp;
  }

}
