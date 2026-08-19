import { MetaProgression } from '../progression/MetaProgression';
import { SKILL_NODES, BRANCH_COLORS, BRANCH_ORDER } from '../progression/SkillTreeLayout';
import type { SkillNode, SkillBranch } from '../progression/SkillTreeLayout';

export class MetaMenu {
  private readonly panel = document.querySelector<HTMLElement>('#meta-menu')!;
  private readonly tabBar = document.querySelector<HTMLElement>('#skill-tab-bar')!;
  private readonly branchColumn = document.querySelector<HTMLElement>('#skill-branch-column')!;
  private readonly tooltip = document.querySelector<HTMLElement>('#skill-tooltip')!;
  private readonly mobileDialog = document.querySelector<HTMLElement>('#skill-mobile-dialog')!;
  private readonly mobileDialogTitle = document.querySelector<HTMLElement>('#skill-mobile-title')!;
  private readonly mobileDialogLevel = document.querySelector<HTMLElement>('#skill-mobile-level')!;
  private readonly mobileDialogDescription = document.querySelector<HTMLElement>('#skill-mobile-description')!;
  private readonly mobileDialogStatus = document.querySelector<HTMLElement>('#skill-mobile-status')!;
  private readonly mobileDialogBuy = document.querySelector<HTMLButtonElement>('#skill-mobile-buy')!;
  private readonly mobileDialogClose = document.querySelector<HTMLButtonElement>('#skill-mobile-close')!;
  private readonly tokenValue = document.querySelector<HTMLElement>('#tokens-value')!;
  private readonly metaButton = document.querySelector<HTMLButtonElement>('#meta-button')!;
  private inBattle = false;
  private endRoundAction = (): void => undefined;
  private backAction: () => void;
  private selectedNode: SkillNode | null = null;
  private activeBranch: SkillBranch = BRANCH_ORDER[0].branch;

  constructor(
    private readonly progression: MetaProgression,
    private readonly onVisibilityChange: (visible: boolean) => void,
    private readonly onCloseToMenu: () => void = () => undefined,
  ) {
    this.backAction = onCloseToMenu;
    this.metaButton.addEventListener('click', () => {
      if (this.inBattle) this.endRoundAction();
      else this.show();
    });
    document.querySelector<HTMLButtonElement>('#skill-play')!.addEventListener('click', () => { this.hide(); this.backAction(); });
    document.querySelector<HTMLButtonElement>('#skill-hints-close')!.addEventListener('click', () => {
      document.querySelector<HTMLElement>('#skill-hints')!.hidden = true;
    });
    this.mobileDialogBuy.addEventListener('click', () => this.purchaseSelectedNode());
    this.mobileDialogClose.addEventListener('click', () => this.hideMobileDialog());
    this.buildTabBar();
  }

  setBattleMode(inBattle: boolean, onEndRound: () => void): void {
    this.inBattle = inBattle;
    this.endRoundAction = onEndRound;
    this.metaButton.textContent = inBattle ? 'End Round' : 'Upgrades';
  }

  show(backAction: () => void = this.onCloseToMenu): void {
    this.backAction = backAction;
    this.panel.hidden = false;
    this.onVisibilityChange(true);
    this.renderBranch(this.activeBranch);
  }

  hide(): void {
    this.panel.hidden = true;
    this.hideTooltip();
    this.hideMobileDialog();
    this.onVisibilityChange(false);
  }

  private buildTabBar(): void {
    this.tabBar.innerHTML = '';
    for (const { branch, label } of BRANCH_ORDER) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.role = 'tab';
      btn.className = 'skill-tab' + (branch === this.activeBranch ? ' active' : '');
      btn.dataset['branch'] = branch;
      btn.textContent = label;
      btn.style.setProperty('--tab-color', BRANCH_COLORS[branch]);
      btn.setAttribute('aria-selected', branch === this.activeBranch ? 'true' : 'false');
      btn.addEventListener('click', () => {
        this.activeBranch = branch;
        for (const b of this.tabBar.querySelectorAll<HTMLButtonElement>('.skill-tab')) {
          const active = b.dataset['branch'] === branch;
          b.classList.toggle('active', active);
          b.setAttribute('aria-selected', active ? 'true' : 'false');
        }
        this.renderBranch(branch);
      });
      this.tabBar.appendChild(btn);
    }
  }

  private renderBranch(branch: SkillBranch): void {
    this.tokenValue.textContent = this.progression.warTokens.toLocaleString();

    const branchNodes = SKILL_NODES.filter((n) => n.branch === branch || n.id === 'core');
    const color = BRANCH_COLORS[branch];

    // Build a flat ordered list: walk the parent chain from branch-root down
    const inBranch = SKILL_NODES.filter((n) => n.branch === branch);
    const ordered = this.topoSort(inBranch);

    this.branchColumn.innerHTML = '';
    this.branchColumn.style.setProperty('--branch-color', color);

    // Find the root of this branch (its parent is 'core' or another branch)
    const coreNode = SKILL_NODES.find((n) => n.id === 'core')!;

    for (let i = 0; i < ordered.length; i++) {
      const node = ordered[i];
      const hasNext = i < ordered.length - 1;

      // Connector line above each card (except the first)
      if (i > 0) {
        const connector = document.createElement('div');
        connector.className = 'skill-connector';
        this.branchColumn.appendChild(connector);
      } else {
        // First card: show a mini "War Council" root link
        const rootLink = document.createElement('div');
        rootLink.className = 'skill-root-link';
        rootLink.innerHTML = `<div class="skill-root-node" title="${coreNode.title}">${coreNode.title.charAt(0)}</div><div class="skill-connector skill-connector--root"></div>`;
        this.branchColumn.appendChild(rootLink);
      }

      const card = this.buildCard(node);
      this.branchColumn.appendChild(card);

      void branchNodes;
      void hasNext;
    }
  }

  private topoSort(nodes: readonly SkillNode[]): SkillNode[] {
    const result: SkillNode[] = [];
    const visited = new Set<string>();

    const visit = (node: SkillNode): void => {
      if (visited.has(node.id)) return;
      visited.add(node.id);
      // Visit parent first if it's within the same branch
      if (node.parent) {
        const parent = nodes.find((n) => n.id === node.parent);
        if (parent) visit(parent);
      }
      result.push(node);
    };

    for (const node of nodes) visit(node);
    return result;
  }

  private buildCard(node: SkillNode): HTMLElement {
    const level = this.progression.nodeLevel(node.id);
    const cost = this.progression.nodeCost(node.id);
    const locked = !this.progression.isNodeUnlocked(node.id);
    const capped = level >= node.maxLevel;
    const affordable = this.progression.warTokens >= cost;
    const owned = level > 0;
    const color = BRANCH_COLORS[node.branch];

    const card = document.createElement('div');
    card.className = 'skill-card';
    if (owned) card.classList.add('owned');
    else if (locked) card.classList.add('locked');
    else if (affordable) card.classList.add('purchasable');
    card.style.setProperty('--node-color', color);
    card.dataset['nodeId'] = node.id;

    const pips = node.maxLevel > 1
      ? `<span class="skill-pips">${Array.from({ length: node.maxLevel }, (_, i) =>
          `<i class="skill-pip${i < level ? ' filled' : ''}"></i>`).join('')}</span>`
      : `<span class="skill-level-badge">${level > 0 ? '✓' : (locked ? '🔒' : '◈')}</span>`;

    const statusLine = locked
      ? `<span class="skill-status locked">Locked</span>`
      : capped
        ? `<span class="skill-status complete">Complete</span>`
        : `<span class="skill-status cost${affordable ? '' : ' unaffordable'}">${cost} WT</span>`;

    card.innerHTML = `
      <div class="skill-card-glyph">${node.title.charAt(0)}</div>
      <div class="skill-card-body">
        <div class="skill-card-top">
          <strong class="skill-card-title">${node.title}</strong>
          ${pips}
        </div>
        <p class="skill-card-desc">${node.description}</p>
        <div class="skill-card-footer">${statusLine}</div>
      </div>`;

    card.addEventListener('pointerenter', (event) => this.showTooltip(node, event));
    card.addEventListener('pointerleave', () => this.hideTooltip());
    card.addEventListener('click', () => this.onCardClick(node));

    return card;
  }

  private onCardClick(node: SkillNode): void {
    if (this.isCompactLayout()) {
      this.showMobileDialog(node);
      return;
    }
    if (this.progression.purchaseNode(node.id)) {
      this.refreshCards();
    }
  }

  private refreshCards(): void {
    this.tokenValue.textContent = this.progression.warTokens.toLocaleString();
    const cards = this.branchColumn.querySelectorAll<HTMLElement>('.skill-card');
    for (const card of cards) {
      const id = card.dataset['nodeId'];
      if (!id) continue;
      const node = SKILL_NODES.find((n) => n.id === id);
      if (!node) continue;
      const level = this.progression.nodeLevel(node.id);
      const cost = this.progression.nodeCost(node.id);
      const locked = !this.progression.isNodeUnlocked(node.id);
      const capped = level >= node.maxLevel;
      const affordable = this.progression.warTokens >= cost;
      const owned = level > 0;

      card.classList.toggle('owned', owned);
      card.classList.toggle('locked', !owned && locked);
      card.classList.toggle('purchasable', !owned && !locked && affordable);

      // Update pips
      const pipContainer = card.querySelector('.skill-pips');
      if (pipContainer) {
        pipContainer.innerHTML = Array.from({ length: node.maxLevel }, (_, i) =>
          `<i class="skill-pip${i < level ? ' filled' : ''}"></i>`).join('');
      }

      const badge = card.querySelector('.skill-level-badge');
      if (badge) badge.textContent = owned ? '✓' : locked ? '🔒' : '◈';

      const status = card.querySelector('.skill-status');
      if (status) {
        status.className = 'skill-status' + (locked ? ' locked' : capped ? ' complete' : affordable ? ' cost' : ' cost unaffordable');
        status.textContent = locked ? 'Locked' : capped ? 'Complete' : `${cost} WT`;
      }
    }
  }

  private showMobileDialog(node: SkillNode): void {
    this.selectedNode = node;
    const level = this.progression.nodeLevel(node.id);
    const cost = this.progression.nodeCost(node.id);
    const locked = !this.progression.isNodeUnlocked(node.id);
    const capped = level >= node.maxLevel;
    const affordable = this.progression.warTokens >= cost;
    this.mobileDialogTitle.textContent = node.title;
    this.mobileDialogLevel.textContent = `${level}/${node.maxLevel}`;
    this.mobileDialogDescription.textContent = node.description;
    this.mobileDialogBuy.setAttribute('aria-label', `Buy ${node.title}`);
    this.mobileDialogStatus.textContent = this.mobileStatusText(cost, locked, capped, affordable);
    this.mobileDialogBuy.disabled = locked || capped || !affordable;
    this.mobileDialog.hidden = false;
  }

  private mobileStatusText(cost: number, locked: boolean, capped: boolean, affordable: boolean): string {
    if (locked) return 'Locked: prerequisites not met';
    if (capped) return 'Complete';
    return affordable ? `${cost} War Tokens` : `Need ${cost} War Tokens`;
  }

  private hideMobileDialog(): void {
    this.mobileDialog.hidden = true;
    this.selectedNode = null;
  }

  private purchaseSelectedNode(): void {
    const node = this.selectedNode;
    if (!node) return;
    if (this.progression.purchaseNode(node.id)) {
      this.refreshCards();
      this.hideMobileDialog();
      return;
    }
    this.showMobileDialog(node);
    if (!this.mobileDialogBuy.disabled) this.mobileDialogStatus.textContent = 'Purchase failed. Try again.';
  }

  private showTooltip(node: SkillNode, event: PointerEvent): void {
    const level = this.progression.nodeLevel(node.id);
    const cost = node.kind === 'core' ? 0 : this.progression.nodeCost(node.id);
    const locked = !this.progression.isNodeUnlocked(node.id);
    const capped = level >= node.maxLevel;
    this.tooltip.innerHTML = `<header><strong>${node.title}</strong><span>${node.kind === 'core' ? '' : `${level}/${node.maxLevel}`}</span></header><p>${node.description}</p><footer>${locked ? 'Locked, unlock the previous node' : capped ? 'Complete' : `${cost} War Tokens`}</footer>`;
    this.tooltip.hidden = false;

    const panelBounds = this.panel.getBoundingClientRect();
    const ex = event.clientX - panelBounds.left + 14;
    const ey = event.clientY - panelBounds.top - 10;
    this.tooltip.style.left = `${Math.min(ex, panelBounds.width - this.tooltip.offsetWidth - 4)}px`;
    this.tooltip.style.top = `${Math.max(0, Math.min(ey, panelBounds.height - this.tooltip.offsetHeight - 4))}px`;
  }

  private hideTooltip(): void {
    this.tooltip.hidden = true;
  }

  private isCompactLayout(): boolean {
    return window.matchMedia('(max-width: 760px)').matches || window.matchMedia('(pointer: coarse)').matches;
  }
}

