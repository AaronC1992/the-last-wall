import { MetaProgression } from '../progression/MetaProgression';
import type { MetaUpgradeId } from '../progression/UpgradeDefinitions';
import type { FeatureUnlockId } from '../progression/FeatureUnlocks';

export class MetaMenu {
  private readonly progression: MetaProgression;
  private readonly onVisibilityChange: (visible: boolean) => void;
  private readonly panel = document.querySelector<HTMLElement>('#meta-menu')!;
  private readonly tokenValue = document.querySelector<HTMLElement>('#meta-tokens')!;
  private readonly list = document.querySelector<HTMLElement>('#meta-upgrades')!;

  constructor(progression: MetaProgression, onVisibilityChange: (visible: boolean) => void) {
    this.progression = progression;
    this.onVisibilityChange = onVisibilityChange;
    document.querySelector<HTMLButtonElement>('#meta-button')!.addEventListener('click', () => this.show());
    document.querySelector<HTMLButtonElement>('#meta-close')!.addEventListener('click', () => this.hide());
    this.list.addEventListener('click', (event) => {
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-upgrade]');
      if (!button) return;
      if (button.dataset.unlock) this.progression.purchaseUnlock(button.dataset.unlock as FeatureUnlockId);
      else this.progression.purchase(button.dataset.upgrade as MetaUpgradeId);
      this.render();
    });
  }

  show(): void {
    this.render();
    this.panel.hidden = false;
    this.onVisibilityChange(true);
  }

  hide(): void {
    this.panel.hidden = true;
    this.onVisibilityChange(false);
  }

  private render(): void {
    this.tokenValue.textContent = this.progression.warTokens.toLocaleString();
    let markup = '';
    for (const upgrade of this.progression.upgrades) {
      const level = this.progression.getLevel(upgrade.id);
      const cost = this.progression.getCost(upgrade.id);
      const capped = level >= upgrade.maxLevel;
      const disabled = capped || this.progression.warTokens < cost ? ' disabled' : '';
      markup += `<button type="button" class="meta-upgrade" data-upgrade="${upgrade.id}"${disabled}><span>${upgrade.category}</span><strong>${upgrade.title}</strong><small>${upgrade.description}</small><em>Level ${level} of ${upgrade.maxLevel}</em><b>${capped ? 'Complete' : `${cost} Tokens`}</b></button>`;
    }
    for (const feature of this.progression.features) {
      const unlocked = this.progression.isUnlocked(feature.id);
      const disabled = unlocked || this.progression.warTokens < feature.cost ? ' disabled' : '';
      markup += `<button type="button" class="meta-upgrade" data-unlock="${feature.id}"${disabled}><span>${feature.category}</span><strong>${feature.title}</strong><small>${feature.description}</small><em>${unlocked ? 'Unlocked' : 'Permanent unlock'}</em><b>${unlocked ? 'Online' : `${feature.cost} Tokens`}</b></button>`;
    }
    this.list.innerHTML = markup;
  }
}
