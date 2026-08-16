import { TOWER_CONFIG } from '../weapons/TowerConfig';
import type { TowerKind } from '../weapons/TowerConfig';

export interface TowerReadout {
  kind: TowerKind;
  count: number;
  limit: number;
  unlocked: boolean;
}

export interface HudState {
  wallHp: number;
  maxWallHp: number;
  buildPoints: number;
  kills: number;
  enemyCount: number;
  fps: number;
  announcement: string;
  mapIntro: boolean;
  warTokens: number;
  buildPhase: boolean;
  towers: readonly TowerReadout[];
}

export class HUD {
  private readonly healthFill = this.element('health-fill');
  private readonly healthText = this.element('health-text');
  private readonly buildPoints = this.element('build-points-value');
  private readonly kills = this.element('kills-value');
  private readonly enemies = this.element('enemy-value');
  private readonly fps = this.element('fps-value');
  private readonly announcement = this.element('horde-announcement');
  private readonly mapIntro = this.element('map-intro');
  private readonly buildBanner = this.element('build-banner');
  private readonly startBattle = document.querySelector<HTMLButtonElement>('#start-battle')!;
  private readonly stockRoot = this.element('tower-stock');
  private readonly stockRows = new Map<TowerKind, { row: HTMLElement; fill: HTMLElement; value: HTMLElement }>();

  constructor(onStartBattle: () => void) {
    let markup = '';
    for (const config of TOWER_CONFIG) {
      markup += `<div class="stock-row" data-kind="${config.kind}" style="--stock-color:${config.accent}"><span class="stock-glyph">${config.glyph}</span><span class="stock-bar"><i></i></span><span class="stock-value">0</span></div>`;
    }
    this.stockRoot.innerHTML = markup;
    for (const config of TOWER_CONFIG) {
      const row = this.stockRoot.querySelector<HTMLElement>(`[data-kind="${config.kind}"]`)!;
      this.stockRows.set(config.kind, { row, fill: row.querySelector<HTMLElement>('.stock-bar i')!, value: row.querySelector<HTMLElement>('.stock-value')! });
    }
    this.startBattle.addEventListener('click', onStartBattle);
  }

  update(state: HudState): void {
    const showBuildControls = state.buildPhase;
    const ratio = state.maxWallHp > 0 ? Math.max(0, state.wallHp / state.maxWallHp) : 0;
    this.healthFill.style.width = `${ratio * 100}%`;
    this.healthFill.classList.toggle('critical', ratio <= 0.35);
    this.healthText.textContent = `${Math.ceil(state.wallHp)} / ${state.maxWallHp}`;
    this.buildPoints.textContent = this.compact(state.buildPoints);
    this.kills.textContent = this.compact(state.kills);
    this.enemies.textContent = this.compact(state.enemyCount);
    this.fps.textContent = Math.round(state.fps).toString();
    this.announcement.textContent = state.announcement;
    this.announcement.hidden = state.announcement.length === 0 || showBuildControls;
    this.mapIntro.hidden = !state.mapIntro;
    this.buildBanner.hidden = !showBuildControls;
    this.startBattle.hidden = !showBuildControls;

    for (const readout of state.towers) {
      const row = this.stockRows.get(readout.kind)!;
      row.row.hidden = !readout.unlocked;
      row.fill.style.width = `${readout.limit > 0 ? (readout.count / readout.limit) * 100 : 0}%`;
      row.value.textContent = readout.count.toString();
    }
  }

  private compact(value: number): string {
    if (value >= 100000) return `${Math.round(value / 1000)}K`;
    if (value >= 10000) return `${(value / 1000).toFixed(1)}K`;
    return value.toLocaleString();
  }

  private element(id: string): HTMLElement {
    return document.querySelector<HTMLElement>(`#${id}`)!;
  }
}
