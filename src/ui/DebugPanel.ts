export interface DebugState {
  fps: number;
  enemies: number;
  projectiles: number;
  droppedProjectiles: number;
  gridCells: number;
  totalSpawned: number;
  activeEffects: number;
  stuckRecoveries: number;
  minimumEnemyY: number;
  maximumEnemyY: number;
  invincible: boolean;
  gameSpeed: number;
  navigationRebuildCount: number;
  timings: { enemy: number; grid: number; congestion: number; towers: number; projectiles: number; compact: number; threat: number; armoredFlow: number; bossFlow: number };
}

export interface DebugActions {
  spawnHorde: (count: number) => void;
  killAll: () => void;
  addGold: () => void;
  healWall: () => void;
  toggleInvincibility: () => void;
  increaseGameSpeed: () => void;
  spawnBoss: () => void;
  spawnElite: () => void;
  endRun: () => void;
}

export class DebugPanel {
  private readonly panel = document.querySelector<HTMLElement>('#debug-panel')!;
  private readonly fps = this.element('debug-fps');
  private readonly enemies = this.element('debug-enemies');
  private readonly projectiles = this.element('debug-projectiles');
  private readonly droppedProjectiles = this.element('debug-dropped-projectiles');
  private readonly cells = this.element('debug-cells');
  private readonly spawned = this.element('debug-spawned');
  private readonly effects = this.element('debug-effects');
  private readonly stuck = this.element('debug-stuck');
  private readonly mode = this.element('debug-mode');

  constructor(actions: DebugActions) {
    window.addEventListener('keydown', (event) => {
      if (event.key === 'F2') {
        event.preventDefault();
        this.panel.hidden = !this.panel.hidden;
      }
    });
    this.bind('debug-spawn-100', () => actions.spawnHorde(100));
    this.bind('debug-spawn-500', () => actions.spawnHorde(500));
    this.bind('debug-spawn-1000', () => actions.spawnHorde(1000));
    this.bind('debug-spawn-5000', () => actions.spawnHorde(5000));
    this.bind('debug-spawn-10000', () => actions.spawnHorde(10000));
    this.bind('debug-kill-all', actions.killAll);
    this.bind('debug-gold', actions.addGold);
    this.bind('debug-heal', actions.healWall);
    this.bind('debug-invincible', actions.toggleInvincibility);
    this.bind('debug-speed', actions.increaseGameSpeed);
    this.bind('debug-boss', actions.spawnBoss);
    this.bind('debug-elite', actions.spawnElite);
    this.bind('debug-end-run', actions.endRun);
  }

  update(state: DebugState): void {
    this.fps.textContent = Math.round(state.fps).toString();
    this.enemies.textContent = state.enemies.toLocaleString();
    this.projectiles.textContent = state.projectiles.toLocaleString();
    this.droppedProjectiles.textContent = state.droppedProjectiles.toLocaleString();
    this.cells.textContent = state.gridCells.toString();
    this.spawned.textContent = state.totalSpawned.toLocaleString();
    this.effects.textContent = state.activeEffects.toString();
    this.stuck.textContent = state.stuckRecoveries.toString();
    const timings = state.timings;
    this.mode.textContent = `Speed ${state.gameSpeed}x  Nav Rebuilds ${state.navigationRebuildCount}  Enemy ${timings.enemy.toFixed(1)}ms  Grid ${timings.grid.toFixed(1)}ms  Congestion ${timings.congestion.toFixed(1)}ms  Towers ${timings.towers.toFixed(1)}ms  Projectiles ${timings.projectiles.toFixed(1)}ms  Compact ${timings.compact.toFixed(1)}ms  Threat ${timings.threat.toFixed(1)}ms  Armored Flow ${timings.armoredFlow.toFixed(1)}ms  Boss Flow ${timings.bossFlow.toFixed(1)}ms  Invincible ${state.invincible ? 'On' : 'Off'}`;
  }

  private bind(id: string, action: () => void): void {
    document.querySelector<HTMLButtonElement>(`#${id}`)!.addEventListener('click', action);
  }

  private element(id: string): HTMLElement {
    return document.querySelector<HTMLElement>(`#${id}`)!;
  }
}
