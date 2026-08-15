import type { TokenBreakdown } from '../progression/MetaProgression';

export class ResultsScreen {
  private readonly panel = document.querySelector<HTMLElement>('#results-screen')!;
  private readonly title = document.querySelector<HTMLElement>('#results-title')!;
  private readonly rows = document.querySelector<HTMLElement>('#results-rows')!;

  constructor(onUpgrades: () => void, onPlayAgain: () => void) {
    document.querySelector<HTMLButtonElement>('#results-upgrades')!.addEventListener('click', onUpgrades);
    document.querySelector<HTMLButtonElement>('#results-play-again')!.addEventListener('click', onPlayAgain);
  }

  show(survived: boolean, breakdown: TokenBreakdown): void {
    this.title.textContent = survived ? 'Survived' : 'The Wall Has Fallen';
    const row = (label: string, value: number) => `<div class="results-row"><span>${label}</span><strong>${value.toLocaleString()}<i class="token-gem"></i></strong></div>`;
    let markup = row(`Kills (${this.compact(breakdown.kills)})`, breakdown.base);
    if (breakdown.percentBonus > 0) markup += row(`Bonus (${breakdown.percentLabel})`, breakdown.percentBonus);
    if (breakdown.flatBonus > 0) markup += row('Bonus', breakdown.flatBonus);
    markup += `<div class="results-row total"><span>Total</span><strong>${breakdown.total.toLocaleString()}<i class="token-gem"></i></strong></div>`;
    this.rows.innerHTML = markup;
    this.panel.hidden = false;
  }

  hide(): void {
    this.panel.hidden = true;
  }

  private compact(value: number): string {
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  }
}
