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
  commitNavigation(): void;
  abilityTargeting(): boolean;
  useAbilityAt(x: number, y: number): void;
  removeModeEnabled(): boolean;
  setRemoveMode(enabled: boolean): void;
  moveModeEnabled(): boolean;
  setMoveMode(enabled: boolean): void;
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
  private readonly activePointers = new Map<number, { x: number; y: number }>();
  private lastPinchDistance = 0;

  private readonly prefersTouch = window.matchMedia('(pointer: coarse)').matches;

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
    canvas.addEventListener('pointerleave', (event) => {
      if (!this.activePointers.has(event.pointerId)) this.actions.setPointer(0, 0, false);
    });
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
    this.activePointers.set(event.pointerId, { x: screen.x, y: screen.y });

    if (this.activePointers.size >= 2) {
      this.dragMode = 'none';
      this.moved = true;
      this.lastPinchDistance = 0;
      return;
    }

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
    if (event.button === 0 && this.actions.abilityTargeting()) {
      this.actions.useAbilityAt(world.x, world.y);
      event.preventDefault();
      return;
    }
    const towerId = this.actions.towerIdAt(world.x, world.y);

    if (event.button === 2) {
      if (towerId > 0) this.actions.removeTower(towerId);
      return;
    }
    if (event.button !== 0) return;
    if (this.actions.removeModeEnabled()) {
      if (towerId > 0) this.actions.removeTower(towerId);
      this.moved = true;
      return;
    }

    this.pressedTowerId = towerId;
    if (towerId > 0) {
      if (this.prefersTouch || event.pointerType === 'touch') {
        this.dragMode = towerId === this.actions.selectedTowerId()
          ? 'aim'
          : this.actions.moveModeEnabled() ? 'move' : 'none';
      } else {
        this.dragMode = towerId === this.actions.selectedTowerId() ? 'aim' : 'move';
      }
      this.draggedTowerId = this.dragMode === 'none' ? 0 : towerId;
      return;
    }
    if (this.actions.selectedTowerId() > 0 && !this.actions.armedKind()) {
      this.dragMode = 'aim';
      this.draggedTowerId = this.actions.selectedTowerId();
    } else if (!this.actions.armedKind()) {
      this.dragMode = 'pan';
    }
  }

  private onPointerMove(event: PointerEvent): void {
    if (!this.activePointers.has(event.pointerId)) return;
    const screen = this.toLogical(event);
    this.activePointers.set(event.pointerId, { x: screen.x, y: screen.y });

    if (this.activePointers.size >= 2) {
      const [a, b] = Array.from(this.activePointers.values());
      const dist = Math.hypot(b.x - a.x, b.y - a.y);
      if (this.lastPinchDistance > 0 && dist > 0) {
        const steps = Math.log(dist / this.lastPinchDistance) / Math.log(1.12);
        this.camera.zoomAt((a.x + b.x) / 2, (a.y + b.y) / 2, steps);
      }
      this.lastPinchDistance = dist;
      return;
    }
    this.lastPinchDistance = 0;

    const world = this.camera.screenToWorld(screen.x, screen.y);
    const inside = screen.x >= 0 && screen.y >= 0 && screen.x <= this.logicalWidth && screen.y <= this.logicalHeight;
    this.actions.setPointer(world.x, world.y, inside);

    if (this.dragMode === 'none') {
      this.actions.setHoveredTower(inside ? this.actions.towerIdAt(world.x, world.y) : 0);
      if (this.actions.selectedTowerId() > 0 && !this.actions.armedKind() && inside) {
        this.actions.aimTower(this.actions.selectedTowerId(), world.x, world.y);
      }
      return;
    }
    if (Math.abs(screen.x - this.pressScreenX) > DRAG_THRESHOLD || Math.abs(screen.y - this.pressScreenY) > DRAG_THRESHOLD) this.moved = true;

    if (this.dragMode === 'pan') {
      this.camera.panByScreen(screen.x - this.lastScreenX, screen.y - this.lastScreenY);
    } else if (this.dragMode === 'move' && this.moved) {
      this.actions.moveTower(this.draggedTowerId, world.x, world.y);
    } else if (this.dragMode === 'aim') {
      this.actions.aimTower(this.draggedTowerId, world.x, world.y);
    }
    this.lastScreenX = screen.x;
    this.lastScreenY = screen.y;
  }

  private onPointerUp(event: PointerEvent): void {
    if (!this.activePointers.has(event.pointerId)) return;
    this.activePointers.delete(event.pointerId);
    this.lastPinchDistance = 0;
    if (this.activePointers.size > 0) {
      const remaining = this.activePointers.values().next().value;
      if (remaining) {
        this.lastScreenX = remaining.x;
        this.lastScreenY = remaining.y;
      }
      return;
    }
    if (this.dragMode === 'none' && event.button !== 0) return;
    const screen = this.toLogical(event);
    const world = this.camera.screenToWorld(screen.x, screen.y);

    if (event.button === 0 && !this.moved && this.dragMode !== 'pan') {
      if (this.pressedTowerId > 0) {
        if (this.pressedTowerId === this.actions.selectedTowerId()) {
          this.actions.selectTower(0);
        } else {
          this.actions.selectTower(this.pressedTowerId);
        }
      } else if (this.actions.armedKind()) {
        this.actions.placeTower(world.x, world.y);
      } else if (this.actions.selectedTowerId() > 0) {
        if (this.prefersTouch || event.pointerType === 'touch') {
          if (this.actions.moveModeEnabled()) {
            this.actions.moveTower(this.actions.selectedTowerId(), world.x, world.y);
          } else {
            this.actions.aimTower(this.actions.selectedTowerId(), world.x, world.y);
            this.actions.selectTower(0);
          }
        } else {
          this.actions.aimTower(this.actions.selectedTowerId(), world.x, world.y);
          this.actions.selectTower(0);
        }
      } else {
        this.actions.selectTower(0);
      }
    }
    this.dragMode = 'none';
    this.draggedTowerId = 0;
    this.pressedTowerId = 0;
    this.actions.commitNavigation();
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
    if (event.key === 'Escape') {
      this.actions.selectTower(0);
      this.actions.setRemoveMode(false);
      this.actions.setMoveMode(false);
      this.actions.useAbilityAt(-1, -1);
    }
    if (event.key === 'z' || event.key === 'Z') {
      this.camera.fitToView();
    }
    const panAmount = 80;
    if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') this.camera.panByScreen(-panAmount, 0);
    if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') this.camera.panByScreen(panAmount, 0);
    if (event.key === 'ArrowUp' || event.key.toLowerCase() === 'w') this.camera.panByScreen(0, -panAmount);
    if (event.key === 'ArrowDown' || event.key.toLowerCase() === 's') this.camera.panByScreen(0, panAmount);
  }
}
