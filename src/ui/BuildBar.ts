import { TOWER_CONFIG } from '../weapons/TowerConfig';
import type { TowerKind } from '../weapons/TowerConfig';

export interface BuildSlotState {
  kind: TowerKind;
  unlocked: boolean;
  count: number;
  limit: number;
  cost: number;
  affordable: boolean;
}

export class BuildBar {
  private readonly root = document.querySelector<HTMLElement>('#build-bar')!;
  private readonly buttons = new Map<TowerKind, HTMLButtonElement>();
  private armed: TowerKind | null = null;

  constructor(private readonly onArm: (kind: TowerKind | null) => void) {
    let markup = '';
    for (const config of TOWER_CONFIG) {
      markup += `<button type="button" class="build-slot" data-kind="${config.kind}" style="--slot-color:${config.accent}"><span class="slot-key">${config.hotkey}</span><span class="slot-glyph">${config.glyph}</span><span class="slot-count">0/${config.limit}</span><span class="slot-cost">${config.cost}</span></button>`;
    }
    this.root.innerHTML = markup;
    for (const config of TOWER_CONFIG) {
      const button = this.root.querySelector<HTMLButtonElement>(`[data-kind="${config.kind}"]`)!;
      this.buttons.set(config.kind, button);
      button.addEventListener('click', () => this.arm(config.kind));
    }
    window.addEventListener('keydown', (event) => {
      if (event.target instanceof HTMLInputElement) return;
      const config = TOWER_CONFIG.find((entry) => entry.hotkey === event.key);
      if (config) this.arm(config.kind);
    });
  }

  get armedKind(): TowerKind | null {
    return this.armed;
  }

  arm(kind: TowerKind | null): void {
    const button = kind ? this.buttons.get(kind) : null;
    if (button?.disabled) return;
    this.armed = this.armed === kind ? null : kind;
    for (const [slotKind, slotButton] of this.buttons) slotButton.classList.toggle('armed', slotKind === this.armed);
    this.onArm(this.armed);
  }

  update(states: readonly BuildSlotState[], visible: boolean, armedKind: TowerKind | null = this.armed): void {
    this.armed = armedKind;
    this.root.hidden = !visible;
    for (const state of states) {
      const button = this.buttons.get(state.kind)!;
      button.hidden = !state.unlocked;
      button.querySelector<HTMLElement>('.slot-count')!.textContent = `${state.count}/${state.limit}`;
      button.querySelector<HTMLElement>('.slot-cost')!.textContent = state.cost.toString();
      button.disabled = !state.unlocked || state.count >= state.limit || !state.affordable;
      button.classList.toggle('full', state.count >= state.limit);
    }
    if (this.armed && this.buttons.get(this.armed)!.disabled) this.arm(null);
    for (const [slotKind, slotButton] of this.buttons) slotButton.classList.toggle('armed', slotKind === this.armed);
  }
}
