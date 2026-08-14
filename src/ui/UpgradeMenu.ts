import type { UpgradeDefinition } from '../systems/UpgradeDefinitions';

export interface ShopState {
  gold: number;
  damageCost: number;
  speedCost: number;
}

export class UpgradeMenu {
  private readonly menu = document.querySelector<HTMLElement>('#upgrade-menu')!;
  private readonly cards = Array.from(document.querySelectorAll<HTMLButtonElement>('.upgrade-card'));
  private readonly damageButton = document.querySelector<HTMLButtonElement>('#buy-damage')!;
  private readonly speedButton = document.querySelector<HTMLButtonElement>('#buy-speed')!;

  constructor(onChoose: (index: number) => void, onBuyDamage: () => void, onBuySpeed: () => void) {
    for (let index = 0; index < this.cards.length; index++) {
      this.cards[index].addEventListener('click', () => onChoose(index));
    }
    this.damageButton.addEventListener('click', onBuyDamage);
    this.speedButton.addEventListener('click', onBuySpeed);
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

  updateShop(state: ShopState): void {
    this.damageButton.disabled = state.gold < state.damageCost;
    this.speedButton.disabled = state.gold < state.speedCost;
    this.damageButton.querySelector<HTMLElement>('small')!.textContent = `${state.damageCost} Gold`;
    this.speedButton.querySelector<HTMLElement>('small')!.textContent = `${state.speedCost} Gold`;
  }

  hide(): void {
    this.menu.hidden = true;
  }
}
