import { AbilityId } from '../systems/ChaosSystem';
import type { AbilityIdValue } from '../systems/ChaosSystem';

const ABILITIES: readonly { id: AbilityIdValue; name: string; key: string; icon: string }[] = [
  { id: AbilityId.Meteor, name: 'Meteor', key: 'q', icon: '☄️' },
  { id: AbilityId.Artillery, name: 'Artillery', key: 'w', icon: '💥' },
  { id: AbilityId.Dragon, name: 'Dragon', key: 'e', icon: '🐉' },
  { id: AbilityId.DeathBeam, name: 'Death Beam', key: 'f', icon: '⚡' },
  { id: AbilityId.Apocalypse, name: 'Apocalypse', key: 'g', icon: '🌋' },
];

export class AbilityPanel {
  private readonly activate: (id: AbilityIdValue) => void;
  private readonly isUnlocked: (id: AbilityIdValue) => boolean;
  private readonly buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('.ability-button'));

  constructor(activate: (id: AbilityIdValue) => void, isUnlocked: (id: AbilityIdValue) => boolean) {
    this.activate = activate;
    this.isUnlocked = isUnlocked;

    for (let index = 0; index < this.buttons.length && index < ABILITIES.length; index++) {
      const button = this.buttons[index];
      const ability = ABILITIES[index];
      button.innerHTML = `<div class="ability-cd-overlay"></div><span class="ability-info"><span class="ability-icon">${ability.icon}</span><strong>${ability.name}</strong></span><small>${ability.key.toUpperCase()}</small>`;
      button.addEventListener('click', () => this.activate(ability.id));
    }

    window.addEventListener('keydown', (event) => {
      const ability = ABILITIES.find((candidate) => candidate.key === event.key.toLowerCase());
      if (!ability) return;
      event.preventDefault();
      this.activate(ability.id);
    });
  }

  update(getCooldown: (id: AbilityIdValue) => number, getTotalCooldown: (id: AbilityIdValue) => number): void {
    for (let index = 0; index < this.buttons.length && index < ABILITIES.length; index++) {
      const ability = ABILITIES[index];
      const cooldown = getCooldown(ability.id);
      const totalCooldown = Math.max(0.1, getTotalCooldown(ability.id));
      const button = this.buttons[index];
      const unlocked = this.isUnlocked(ability.id);
      const overlay = button.querySelector<HTMLElement>('.ability-cd-overlay');

      button.style.display = unlocked ? 'flex' : 'none';
      button.disabled = cooldown > 0 || !unlocked;

      if (!unlocked) {
        button.classList.remove('ready');
        if (overlay) overlay.style.width = '0%';
        button.querySelector<HTMLElement>('small')!.textContent = 'Locked';
      } else if (cooldown > 0) {
        button.classList.remove('ready');
        const pct = Math.min(100, Math.max(0, (cooldown / totalCooldown) * 100));
        if (overlay) overlay.style.width = `${pct.toFixed(1)}%`;
        button.querySelector<HTMLElement>('small')!.textContent = `${Math.ceil(cooldown)}s`;
      } else {
        button.classList.add('ready');
        if (overlay) overlay.style.width = '0%';
        button.querySelector<HTMLElement>('small')!.textContent = ability.key.toUpperCase();
      }
    }
  }
}
