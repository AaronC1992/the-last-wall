import { Camera } from './Camera';
import type { TowerKind } from '../weapons/TowerConfig';

export interface BattlefieldActions {
  isInteractive(): boolean;
  armedKind(): TowerKind | null;
  placeTower(x: number, y: number): void;
  towerIdAt(x: number, y: number): number;
  selectTower(id: number): void;
  selectedTowerId(): number;
  moveTower(id: number, x: number, y: number): void;
  aimTower(id: number, x: number, y: number): void;
  removeTower(id: number): void;
  removeAllTowers(): void;
  setPointer(x: number, y: number, overCanvas: boolean): void;
  setHoveredTower(id: number): void;
}

type DragMode = 'none' | 'pan' | 'move' | 'aim';

const DRAG_THRESHOLD = 4;

export class BattlefieldInput {
  private dragMode: DragMode = 'none';
  private draggedTowerId = 0;
  private pressedTowerId = 0;
  private lastScreenX = 0;
  private lastScreenY = 0;
  private pressScreenX = 0;
  private pressScreenY = 0;
  private moved = false;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly camera: Camera,
    private readonly logicalWidth: number,
    private readonly logicalHeight: number,
    private readonly actions: BattlefieldActions,
  ) {
    canvas.addEventListener('contextmenu', (event) => event.preventDefault());
    canvas.addEventListener('pointerdown', (event) => this.onPointerDown(event));
    window.addEventListener('pointermove', (event) => this.onPointerMove(event));
    window.addEventListener('pointerup', (event) => this.onPointerUp(event));
    canvas.addEventListener('wheel', (event) => this.onWheel(event), { passive: false });
    canvas.addEventListener('pointerleave', () => this.actions.setPointer(0, 0, false));
    window.addEventListener('keydown', (event) => this.onKeyDown(event));
  }

  private toLogical(event: PointerEvent | WheelEvent): { x: number; y: number } {
    const bounds = this.canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - bounds.left) / bounds.width) * this.logicalWidth,
      y: ((event.clientY - bounds.top) / bounds.height) * this.logicalHeight,
    };
  }

  private onPointerDown(event: PointerEvent): void {
    const screen = this.toLogical(event);
    this.lastScreenX = screen.x;
    this.lastScreenY = screen.y;
    this.pressScreenX = screen.x;
    this.pressScreenY = screen.y;
    this.moved = false;

    if (event.button === 1) {
      this.dragMode = 'pan';
      event.preventDefault();
      return;
    }
    if (!this.actions.isInteractive()) return;

    const world = this.camera.screenToWorld(screen.x, screen.y);
    const towerId = this.actions.towerIdAt(world.x, world.y);

    if (event.button === 2) {
      if (towerId > 0) this.actions.removeTower(towerId);
      return;
    }
    if (event.button !== 0) return;

    this.pressedTowerId = towerId;
    if (towerId > 0) {
      this.dragMode = 'move';
      this.draggedTowerId = towerId;
      return;
    }
    if (this.actions.selectedTowerId() > 0 && !this.actions.armedKind()) {
      this.dragMode = 'aim';
      this.draggedTowerId = this.actions.selectedTowerId();
    }
  }

  private onPointerMove(event: PointerEvent): void {
    const screen = this.toLogical(event);
    const world = this.camera.screenToWorld(screen.x, screen.y);
    const inside = screen.x >= 0 && screen.y >= 0 && screen.x <= this.logicalWidth && screen.y <= this.logicalHeight;
    this.actions.setPointer(world.x, world.y, inside);

    if (this.dragMode === 'none') {
      this.actions.setHoveredTower(inside ? this.actions.towerIdAt(world.x, world.y) : 0);
      return;
    }
    if (Math.abs(screen.x - this.pressScreenX) > DRAG_THRESHOLD || Math.abs(screen.y - this.pressScreenY) > DRAG_THRESHOLD) this.moved = true;

    if (this.dragMode === 'pan') {
      this.camera.panByScreen(screen.x - this.lastScreenX, screen.y - this.lastScreenY);
    } else if (this.dragMode === 'move' && this.moved) {
      this.actions.moveTower(this.draggedTowerId, world.x, world.y);
    } else if (this.dragMode === 'aim' && this.moved) {
      this.actions.aimTower(this.draggedTowerId, world.x, world.y);
    }
    this.lastScreenX = screen.x;
    this.lastScreenY = screen.y;
  }

  private onPointerUp(event: PointerEvent): void {
    if (this.dragMode === 'none' && event.button === 0 && this.actions.isInteractive()) return;
    const screen = this.toLogical(event);
    const world = this.camera.screenToWorld(screen.x, screen.y);

    if (event.button === 0 && !this.moved && this.dragMode !== 'pan') {
      if (this.pressedTowerId > 0) this.actions.selectTower(this.pressedTowerId);
      else if (this.actions.armedKind()) this.actions.placeTower(world.x, world.y);
      else this.actions.selectTower(0);
    }
    this.dragMode = 'none';
    this.draggedTowerId = 0;
    this.pressedTowerId = 0;
  }

  private onWheel(event: WheelEvent): void {
    event.preventDefault();
    const screen = this.toLogical(event);
    this.camera.zoomAt(screen.x, screen.y, event.deltaY > 0 ? -1 : 1);
  }

  private onKeyDown(event: KeyboardEvent): void {
    if (event.target instanceof HTMLInputElement) return;
    if (event.key === 'r' || event.key === 'R') {
      if (this.actions.isInteractive()) this.actions.removeAllTowers();
    }
    if (event.key === 'Escape') this.actions.selectTower(0);
  }
}
