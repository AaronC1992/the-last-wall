import { AbilityId } from '../systems/ChaosSystem';
import type { AbilityIdValue } from '../systems/ChaosSystem';

const ABILITIES: readonly { id: AbilityIdValue; name: string; key: string }[] = [
  { id: AbilityId.Meteor, name: 'Meteor', key: '1' },
  { id: AbilityId.Artillery, name: 'Artillery', key: '2' },
  { id: AbilityId.Dragon, name: 'Dragon', key: '3' },
  { id: AbilityId.DeathBeam, name: 'Death Beam', key: '4' },
  { id: AbilityId.Apocalypse, name: 'Apocalypse', key: '5' },
];

export class AbilityPanel {
  private readonly activate: (id: AbilityIdValue) => void;
  private readonly buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('.ability-button'));

  constructor(activate: (id: AbilityIdValue) => void) {
    this.activate = activate;
    for (let index = 0; index < this.buttons.length; index++) this.buttons[index].addEventListener('click', () => this.activate(ABILITIES[index].id));
    window.addEventListener('keydown', (event) => {
      const ability = ABILITIES.find((candidate) => candidate.key === event.key);
      if (!ability) return;
      event.preventDefault();
      this.activate(ability.id);
    });
  }

  update(getCooldown: (id: AbilityIdValue) => number): void {
    for (let index = 0; index < this.buttons.length; index++) {
      const cooldown = getCooldown(ABILITIES[index].id);
      const button = this.buttons[index];
      button.disabled = cooldown > 0;
      button.querySelector<HTMLElement>('small')!.textContent = cooldown > 0 ? `${Math.ceil(cooldown)}s` : ABILITIES[index].key;
    }
  }
}
