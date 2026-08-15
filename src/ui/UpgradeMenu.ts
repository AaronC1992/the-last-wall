import type { UpgradeDefinition } from '../systems/UpgradeDefinitions';

export class UpgradeMenu {
  private readonly menu = document.querySelector<HTMLElement>('#upgrade-menu')!;
  private readonly cards = Array.from(document.querySelectorAll<HTMLButtonElement>('.upgrade-card'));

  constructor(onChoose: (index: number) => void) {
    for (let index = 0; index < this.cards.length; index++) {
      this.cards[index].addEventListener('click', () => onChoose(index));
    }
  }

  show(choices: readonly UpgradeDefinition[] | null): void {
    if (!choices) {
      this.menu.hidden = true;
      return;
    }
    for (let index = 0; index < choices.length; index++) {
      const choice = choices[index];
      const card = this.cards[index];
      card.dataset.rarity = choice.rarity;
      card.querySelector<HTMLElement>('.upgrade-rarity')!.textContent = choice.rarity;
      card.querySelector<HTMLElement>('.upgrade-name')!.textContent = choice.title;
      card.querySelector<HTMLElement>('.upgrade-description')!.textContent = choice.description;
    }
    this.menu.hidden = false;
  }

  hide(): void {
    this.menu.hidden = true;
  }
}
