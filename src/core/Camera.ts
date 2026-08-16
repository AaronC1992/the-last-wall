export class Camera {
  x: number;
  y: number;
  zoom = 0.82;
  readonly minZoom = 0.62;
  readonly maxZoom = 3.5;

  constructor(
    private readonly viewportWidth: number,
    private readonly viewportHeight: number,
    private readonly worldWidth: number,
    private readonly worldHeight: number,
  ) {
    this.x = worldWidth / 2;
    this.y = worldHeight / 2;
  }

  apply(context: CanvasRenderingContext2D): void {
    context.translate(this.viewportWidth / 2, this.viewportHeight / 2);
    context.scale(this.zoom, this.zoom);
    context.translate(-this.x, -this.y);
  }

  screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    return {
      x: (screenX - this.viewportWidth / 2) / this.zoom + this.x,
      y: (screenY - this.viewportHeight / 2) / this.zoom + this.y,
    };
  }

  panByScreen(deltaX: number, deltaY: number): void {
    this.x -= deltaX / this.zoom;
    this.y -= deltaY / this.zoom;
    this.clamp();
  }

  /** Zooms toward the given screen point so the world position under the cursor stays put. */
  zoomAt(screenX: number, screenY: number, steps: number): void {
    const before = this.screenToWorld(screenX, screenY);
    this.zoom = Math.min(this.maxZoom, Math.max(this.minZoom, this.zoom * Math.pow(1.12, steps)));
    const after = this.screenToWorld(screenX, screenY);
    this.x += before.x - after.x;
    this.y += before.y - after.y;
    this.clamp();
  }

  reset(): void {
    this.zoom = 0.82;
    this.x = this.worldWidth / 2;
    this.y = this.worldHeight / 2;
    this.clamp();
  }

  private clamp(): void {
    const halfWidth = this.viewportWidth / 2 / this.zoom;
    const halfHeight = this.viewportHeight / 2 / this.zoom;
    this.x = halfWidth * 2 >= this.worldWidth ? this.worldWidth / 2 : Math.min(this.worldWidth - halfWidth, Math.max(halfWidth, this.x));
    this.y = halfHeight * 2 >= this.worldHeight ? this.worldHeight / 2 : Math.min(this.worldHeight - halfHeight, Math.max(halfHeight, this.y));
  }
}
