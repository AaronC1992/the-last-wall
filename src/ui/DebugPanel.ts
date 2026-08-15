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
    this.mode.textContent = `Speed ${state.gameSpeed}x  Invincible ${state.invincible ? 'On' : 'Off'}  Enemy Y ${Math.round(state.minimumEnemyY)} to ${Math.round(state.maximumEnemyY)}`;
  }

  private bind(id: string, action: () => void): void {
    document.querySelector<HTMLButtonElement>(`#${id}`)!.addEventListener('click', action);
  }

  private element(id: string): HTMLElement {
    return document.querySelector<HTMLElement>(`#${id}`)!;
  }
}
