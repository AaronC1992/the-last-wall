export interface HudState {
  wallHp: number;
  maxWallHp: number;
  gold: number;
  kills: number;
  enemyCount: number;
  fps: number;
  level: number;
  wave: number;
  waveBudget: number;
  announcement: string;
  warTokens: number;
  earnedTokens: number;
  gameOver: boolean;
}

export class HUD {
  private readonly wall: HTMLElement;
  private readonly gold: HTMLElement;
  private readonly kills: HTMLElement;
  private readonly enemies: HTMLElement;
  private readonly fps: HTMLElement;
  private readonly level: HTMLElement;
  private readonly gameOver: HTMLDivElement;
  private readonly tokens: HTMLElement;
  private readonly earnedTokens: HTMLElement;
  private readonly wave: HTMLElement;
  private readonly announcement: HTMLElement;

  constructor(onRestart: () => void) {
    this.wall = this.element('wall-value');
    this.gold = this.element('gold-value');
    this.kills = this.element('kills-value');
    this.enemies = this.element('enemy-value');
    this.fps = this.element('fps-value');
    this.level = this.element('level-value');
    this.gameOver = document.querySelector<HTMLDivElement>('#game-over')!;
    this.tokens = this.element('tokens-value');
    this.earnedTokens = this.element('earned-tokens');
    this.wave = this.element('wave-value');
    this.announcement = this.element('horde-announcement');
    document.querySelector<HTMLButtonElement>('#restart-button')!.addEventListener('click', onRestart);
  }

  update(state: HudState): void {
    this.wall.textContent = `${Math.ceil(state.wallHp)} / ${state.maxWallHp}`;
    this.gold.textContent = state.gold.toLocaleString();
    this.kills.textContent = state.kills.toLocaleString();
    this.enemies.textContent = state.enemyCount.toLocaleString();
    this.fps.textContent = Math.round(state.fps).toString();
    this.level.textContent = state.level.toString();
    this.tokens.textContent = state.warTokens.toLocaleString();
    this.earnedTokens.textContent = state.earnedTokens.toLocaleString();
    this.wave.textContent = state.wave > 0 ? `${state.wave} / ${state.waveBudget}` : 'Ready';
    this.announcement.textContent = state.announcement;
    this.announcement.hidden = state.announcement.length === 0;
    this.gameOver.hidden = !state.gameOver;
  }

  private element(id: string): HTMLElement {
    return document.querySelector<HTMLElement>(`#${id}`)!;
  }
}
