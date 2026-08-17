import type { TokenBreakdown } from '../progression/MetaProgression';

export class ResultsScreen {
  private readonly panel = document.querySelector<HTMLElement>('#results-screen')!;
  private readonly title = document.querySelector<HTMLElement>('#results-title')!;
  private readonly rows = document.querySelector<HTMLElement>('#results-rows')!;
  private readonly nextLevel = document.querySelector<HTMLButtonElement>('#results-next-level')!;
  private lastSurvived = false;
  private lastBreakdown: TokenBreakdown | null = null;

  constructor(onUpgrades: () => void, onPlayAgain: () => void, onNextLevel: () => void) {
    document.querySelector<HTMLButtonElement>('#results-upgrades')!.addEventListener('click', onUpgrades);
    document.querySelector<HTMLButtonElement>('#results-play-again')!.addEventListener('click', onPlayAgain);
    this.nextLevel.addEventListener('click', onNextLevel);
  }

  show(survived: boolean, breakdown: TokenBreakdown, nextMapName: string | null = null): void {
    this.lastSurvived = survived;
    this.lastBreakdown = breakdown;
    this.title.textContent = survived ? 'Survived' : 'The Wall Has Fallen';
    const row = (label: string, value: number) => `<div class="results-row"><span>${label}</span><strong>${value.toLocaleString()}<i class="token-gem"></i></strong></div>`;
    let markup = row(`Kills (${this.compact(breakdown.kills)})`, breakdown.base);
    if (breakdown.percentBonus > 0) markup += row(`Bonus (${breakdown.percentLabel})`, breakdown.percentBonus);
    if (breakdown.flatBonus > 0) markup += row('Bonus', breakdown.flatBonus);
    if (breakdown.firstClearBonus > 0) markup += row('First Clear', breakdown.firstClearBonus);
    if (breakdown.rating > 0) markup += `<div class="results-row"><span>Gate Rating</span><strong>${'★'.repeat(breakdown.rating)}</strong></div>`;
    markup += `<div class="results-row total"><span>Total</span><strong>${breakdown.total.toLocaleString()}<i class="token-gem"></i></strong></div>`;
    this.rows.innerHTML = markup;
    this.nextLevel.hidden = !survived || nextMapName === null;
    if (nextMapName) this.nextLevel.textContent = `Next Level: ${nextMapName}`;
    this.panel.hidden = false;
  }

  showLast(): void {
    if (this.lastBreakdown) this.show(this.lastSurvived, this.lastBreakdown);
  }

  hide(): void {
    this.panel.hidden = true;
  }

  private compact(value: number): string {
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  }
}
