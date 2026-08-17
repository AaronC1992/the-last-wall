import { MetaProgression } from '../progression/MetaProgression';
import { SKILL_NODES, BRANCH_COLORS } from '../progression/SkillTreeLayout';
import type { SkillNode } from '../progression/SkillTreeLayout';

const NODE_SIZE = 30;
const VIEW_WIDTH = 1280;
const VIEW_HEIGHT = 760;
const TREE_PADDING = 120;

const TREE_BOUNDS = SKILL_NODES.reduce((bounds, node) => ({
  minX: Math.min(bounds.minX, node.x - NODE_SIZE / 2),
  maxX: Math.max(bounds.maxX, node.x + NODE_SIZE / 2),
  minY: Math.min(bounds.minY, node.y - NODE_SIZE / 2),
  maxY: Math.max(bounds.maxY, node.y + NODE_SIZE / 2 + (node.kind === 'core' ? 0 : 16)),
}), {
  minX: Number.POSITIVE_INFINITY,
  maxX: Number.NEGATIVE_INFINITY,
  minY: Number.POSITIVE_INFINITY,
  maxY: Number.NEGATIVE_INFINITY,
});

export class MetaMenu {
  private readonly panel = document.querySelector<HTMLElement>('#meta-menu')!;
  private readonly canvas = document.querySelector<HTMLCanvasElement>('#skill-tree-canvas')!;
  private readonly context = this.canvas.getContext('2d')!;
  private readonly legend = document.querySelector<HTMLElement>('#skill-legend')!;
  private readonly legendToggle = document.querySelector<HTMLButtonElement>('#skill-legend-toggle')!;
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
  private offsetX = VIEW_WIDTH / 2;
  private offsetY = VIEW_HEIGHT / 2;
  private zoom = 1;
  private hovered: SkillNode | null = null;
  private dragging = false;
  private moved = false;
  private lastX = 0;
  private lastY = 0;
  private readonly activePointers = new Map<number, { x: number; y: number }>();
  private lastPinchDistance = 0;
  private backAction: () => void;
  private selectedNode: SkillNode | null = null;

  constructor(
    private readonly progression: MetaProgression,
    private readonly onVisibilityChange: (visible: boolean) => void,
    private readonly onCloseToMenu: () => void = () => undefined,
  ) {
    this.backAction = onCloseToMenu;
    this.canvas.width = VIEW_WIDTH;
    this.canvas.height = VIEW_HEIGHT;
    this.metaButton.addEventListener('click', () => {
      if (this.inBattle) this.endRoundAction();
      else this.show();
    });
    document.querySelector<HTMLButtonElement>('#meta-close')!.addEventListener('click', () => { this.hide(); this.onCloseToMenu(); });
    document.querySelector<HTMLButtonElement>('#skill-play')!.addEventListener('click', () => { this.hide(); this.backAction(); });
    this.legendToggle.addEventListener('click', () => this.setLegendVisible(this.legend.hidden === true));
    document.querySelector<HTMLButtonElement>('#skill-hints-close')!.addEventListener('click', () => {
      document.querySelector<HTMLElement>('#skill-hints')!.hidden = true;
    });
    this.mobileDialogBuy.addEventListener('click', () => this.purchaseSelectedNode());
    this.mobileDialogClose.addEventListener('click', () => this.hideMobileDialog());
    this.canvas.addEventListener('pointerdown', (event) => this.onPointerDown(event));
    window.addEventListener('pointermove', (event) => this.onPointerMove(event));
    window.addEventListener('pointerup', (event) => this.onPointerUp(event));
    this.canvas.addEventListener('pointerleave', () => { if (!this.dragging && this.activePointers.size === 0) this.hideTooltip(); });
    this.canvas.addEventListener('wheel', (event) => this.onWheel(event), { passive: false });
    this.canvas.addEventListener('click', (event) => this.onClick(event));
  }

  setBattleMode(inBattle: boolean, onEndRound: () => void): void {
    this.inBattle = inBattle;
    this.endRoundAction = onEndRound;
    this.metaButton.textContent = inBattle ? 'End Round' : 'Upgrades';
  }

  show(backAction: () => void = this.onCloseToMenu): void {
    this.backAction = backAction;
    this.resetView();
    this.setLegendVisible(!this.isCompactLayout());
    this.panel.hidden = false;
    this.onVisibilityChange(true);
    this.render();
  }

  hide(): void {
    this.panel.hidden = true;
    this.hideTooltip();
    this.hideMobileDialog();
    this.dragging = false;
    this.activePointers.clear();
    this.lastPinchDistance = 0;
    this.onVisibilityChange(false);
  }

  private toCanvas(event: PointerEvent | MouseEvent | WheelEvent): { x: number; y: number } {
    const bounds = this.canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - bounds.left) / bounds.width) * VIEW_WIDTH,
      y: ((event.clientY - bounds.top) / bounds.height) * VIEW_HEIGHT,
    };
  }

  private toTree(event: PointerEvent | MouseEvent | WheelEvent): { x: number; y: number } {
    const point = this.toCanvas(event);
    return { x: (point.x - this.offsetX) / this.zoom, y: (point.y - this.offsetY) / this.zoom };
  }

  private nodeAt(x: number, y: number): SkillNode | null {
    const half = NODE_SIZE / 2 + 4;
    for (const node of SKILL_NODES) {
      if (Math.abs(node.x - x) <= half && Math.abs(node.y - y) <= half) return node;
    }
    return null;
  }

  private onPointerDown(event: PointerEvent): void {
    const point = this.toCanvas(event);
    this.activePointers.set(event.pointerId, point);

    if (this.activePointers.size >= 2) {
      this.dragging = false;
      this.moved = true;
      this.lastPinchDistance = 0;
      return;
    }

    this.dragging = true;
    this.moved = false;
    this.lastX = point.x;
    this.lastY = point.y;
  }

  private onPointerMove(event: PointerEvent): void {
    const point = this.toCanvas(event);

    if (this.activePointers.has(event.pointerId)) {
      this.activePointers.set(event.pointerId, point);

      if (this.activePointers.size >= 2) {
        const [a, b] = Array.from(this.activePointers.values());
        const dist = Math.hypot(b.x - a.x, b.y - a.y);
        if (this.lastPinchDistance > 0 && dist > 0) {
          const midX = (a.x + b.x) / 2;
          const midY = (a.y + b.y) / 2;
          const beforeX = (midX - this.offsetX) / this.zoom;
          const beforeY = (midY - this.offsetY) / this.zoom;
          this.zoom = Math.min(2.2, Math.max(0.45, this.zoom * (dist / this.lastPinchDistance)));
          this.offsetX = midX - beforeX * this.zoom;
          this.offsetY = midY - beforeY * this.zoom;
          this.render();
        }
        this.lastPinchDistance = dist;
        return;
      }
      this.lastPinchDistance = 0;

      if (this.dragging) {
        if (Math.abs(point.x - this.lastX) > 2 || Math.abs(point.y - this.lastY) > 2) this.moved = true;
        this.offsetX += point.x - this.lastX;
        this.offsetY += point.y - this.lastY;
        this.lastX = point.x;
        this.lastY = point.y;
        this.render();
        return;
      }
    } else {
      const bounds = this.canvas.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) return;
    }

    const tree = this.toTree(event);
    const node = this.nodeAt(tree.x, tree.y);
    if (node !== this.hovered) {
      this.hovered = node;
      this.render();
    }
    if (node) this.showTooltip(node, point.x, point.y);
    else this.hideTooltip();
  }

  private onPointerUp(event: PointerEvent): void {
    this.activePointers.delete(event.pointerId);
    this.lastPinchDistance = 0;
    if (this.activePointers.size > 0) {
      const remaining = this.activePointers.values().next().value!;
      this.lastX = remaining.x;
      this.lastY = remaining.y;
      this.dragging = true;
      return;
    }
    this.dragging = false;
  }

  private onWheel(event: WheelEvent): void {
    event.preventDefault();
    const before = this.toTree(event);
    this.zoom = Math.min(2.2, Math.max(0.45, this.zoom * (event.deltaY > 0 ? 0.9 : 1.1)));
    const point = this.toCanvas(event);
    this.offsetX = point.x - before.x * this.zoom;
    this.offsetY = point.y - before.y * this.zoom;
    this.render();
  }

  private onClick(event: MouseEvent): void {
    if (this.moved) return;
    const tree = this.toTree(event);
    const node = this.nodeAt(tree.x, tree.y);
    if (!node || node.kind === 'core') return;
    if (this.isCompactLayout()) {
      this.showMobileDialog(node);
      return;
    }
    if (this.progression.purchaseNode(node.id)) {
      this.render();
      this.showTooltip(node, this.toCanvas(event).x, this.toCanvas(event).y);
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
    this.mobileDialogStatus.textContent = locked ? 'Locked, unlock the previous node' : capped ? 'Complete' : affordable ? `${cost} War Tokens` : `Need ${cost} War Tokens`;
    this.mobileDialogBuy.disabled = locked || capped || !affordable;
    this.mobileDialog.hidden = false;
  }

  private hideMobileDialog(): void {
    this.mobileDialog.hidden = true;
    this.selectedNode = null;
  }

  private purchaseSelectedNode(): void {
    const node = this.selectedNode;
    if (!node) return;
    if (this.progression.purchaseNode(node.id)) {
      this.render();
      this.hideMobileDialog();
      return;
    }
    this.showMobileDialog(node);
  }

  private showTooltip(node: SkillNode, screenX: number, screenY: number): void {
    const level = this.progression.nodeLevel(node.id);
    const cost = node.kind === 'core' ? 0 : this.progression.nodeCost(node.id);
    const locked = !this.progression.isNodeUnlocked(node.id);
    const capped = level >= node.maxLevel;
    const canvasBounds = this.canvas.getBoundingClientRect();
    const panelBounds = this.panel.getBoundingClientRect();
    const scale = canvasBounds.width / VIEW_WIDTH;
    const offsetLeft = canvasBounds.left - panelBounds.left;
    const offsetTop = canvasBounds.top - panelBounds.top;
    this.tooltip.innerHTML = `<header><strong>${node.title}</strong><span>${node.kind === 'core' ? '' : `${level}/${node.maxLevel}`}</span></header><p>${node.description}</p><footer>${locked ? 'Locked, unlock the previous node' : capped ? 'Complete' : `${cost} War Tokens`}</footer>`;
    this.tooltip.hidden = false;
    const x = screenX * scale + offsetLeft + 20;
    const y = screenY * scale + offsetTop - 10;
    this.tooltip.style.left = `${Math.min(x, panelBounds.width - this.tooltip.offsetWidth - 4)}px`;
    this.tooltip.style.top = `${Math.max(0, Math.min(y, panelBounds.height - this.tooltip.offsetHeight - 4))}px`;
  }

  private hideTooltip(): void {
    this.tooltip.hidden = true;
    if (this.hovered) {
      this.hovered = null;
      this.render();
    }
  }

  private isCompactLayout(): boolean {
    return window.matchMedia('(max-width: 760px)').matches || window.matchMedia('(pointer: coarse)').matches;
  }

  private setLegendVisible(visible: boolean): void {
    this.legend.hidden = !visible;
    this.legendToggle.setAttribute('aria-expanded', visible ? 'true' : 'false');
    this.legendToggle.textContent = visible ? 'Hide Legend' : 'Show Legend';
  }

  private resetView(): void {
    const width = TREE_BOUNDS.maxX - TREE_BOUNDS.minX;
    const height = TREE_BOUNDS.maxY - TREE_BOUNDS.minY;
    const zoomX = (VIEW_WIDTH - TREE_PADDING) / width;
    const zoomY = (VIEW_HEIGHT - TREE_PADDING) / height;
    this.zoom = Math.min(1, zoomX, zoomY);
    const centerX = (TREE_BOUNDS.minX + TREE_BOUNDS.maxX) / 2;
    const centerY = (TREE_BOUNDS.minY + TREE_BOUNDS.maxY) / 2;
    this.offsetX = VIEW_WIDTH / 2 - centerX * this.zoom;
    this.offsetY = VIEW_HEIGHT / 2 - centerY * this.zoom;
  }

  private render(): void {
    this.tokenValue.textContent = this.progression.warTokens.toLocaleString();
    const context = this.context;
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = '#05070a';
    context.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
    const glow = context.createRadialGradient(VIEW_WIDTH / 2, VIEW_HEIGHT / 2, 20, VIEW_WIDTH / 2, VIEW_HEIGHT / 2, VIEW_HEIGHT);
    glow.addColorStop(0, 'rgba(90, 30, 40, .35)');
    glow.addColorStop(1, 'rgba(5, 7, 10, 0)');
    context.fillStyle = glow;
    context.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);

    context.setTransform(this.zoom, 0, 0, this.zoom, this.offsetX, this.offsetY);
    this.renderEdges(context);
    for (const node of SKILL_NODES) this.renderNode(context, node);
    context.setTransform(1, 0, 0, 1, 0, 0);
  }

  private renderEdges(context: CanvasRenderingContext2D): void {
    for (const node of SKILL_NODES) {
      if (!node.parent) continue;
      const parent = SKILL_NODES.find((entry) => entry.id === node.parent)!;
      const owned = this.progression.nodeLevel(node.id) > 0;
      const reachable = this.progression.isNodeUnlocked(node.id);
      context.strokeStyle = BRANCH_COLORS[node.branch];
      context.globalAlpha = owned ? 0.95 : reachable ? 0.45 : 0.16;
      context.lineWidth = owned ? 2.5 : 1.5;
      context.beginPath();
      context.moveTo(parent.x, parent.y);
      context.lineTo(node.x, node.y);
      context.stroke();
    }
    context.globalAlpha = 1;
  }

  private renderNode(context: CanvasRenderingContext2D, node: SkillNode): void {
    const level = this.progression.nodeLevel(node.id);
    const owned = level > 0;
    const reachable = this.progression.isNodeUnlocked(node.id);
    const color = BRANCH_COLORS[node.branch];
    const half = NODE_SIZE / 2;
    const hovered = this.hovered === node;

    context.globalAlpha = owned ? 1 : reachable ? 0.75 : 0.3;
    if (owned) {
      context.save();
      context.shadowColor = color;
      context.shadowBlur = hovered ? 26 : 14;
      context.fillStyle = color;
      context.fillRect(node.x - half, node.y - half, NODE_SIZE, NODE_SIZE);
      context.restore();
    } else {
      context.fillStyle = '#101720';
      context.fillRect(node.x - half, node.y - half, NODE_SIZE, NODE_SIZE);
    }
    context.strokeStyle = hovered ? '#ffffff' : color;
    context.lineWidth = hovered ? 2.5 : 1.5;
    context.strokeRect(node.x - half, node.y - half, NODE_SIZE, NODE_SIZE);

    context.fillStyle = owned ? '#0b1016' : color;
    context.font = 'bold 15px Verdana, sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(node.title.charAt(0), node.x, node.y - 1);

    if (node.kind !== 'core') {
      context.fillStyle = owned ? color : '#7d8894';
      context.font = '10px Verdana, sans-serif';
      context.fillText(`${level}/${node.maxLevel}`, node.x, node.y + half + 9);
    }
    context.globalAlpha = 1;
  }
}
