const DECAL_CAPACITY = 420;

type DecalKind = 'blood' | 'crater' | 'scorch';

export class DecalSystem {
  private readonly x = new Float32Array(DECAL_CAPACITY);
  private readonly y = new Float32Array(DECAL_CAPACITY);
  private readonly size = new Float32Array(DECAL_CAPACITY);
  private readonly kind: DecalKind[] = [];
  private count = 0;
  private nextIndex = 0;

  add(x: number, y: number, kind: DecalKind = 'blood', size = 1): void {
    const index = this.nextIndex;
    this.x[index] = x;
    this.y[index] = y;
    this.size[index] = size;
    this.kind[index] = kind;
    this.nextIndex = (this.nextIndex + 1) % DECAL_CAPACITY;
    this.count = Math.min(DECAL_CAPACITY, this.count + 1);
  }

  render(context: CanvasRenderingContext2D): void {
    const start = this.count === DECAL_CAPACITY ? this.nextIndex : 0;
    for (let offset = 0; offset < this.count; offset++) {
      const index = (start + offset) % DECAL_CAPACITY;
      const kind = this.kind[index];
      if (kind === 'crater') this.drawCrater(context, index);
      else if (kind === 'scorch') this.drawScorch(context, index);
      else this.drawBlood(context, index);
    }
  }

  clear(): void {
    this.count = 0;
    this.nextIndex = 0;
  }

  private drawBlood(context: CanvasRenderingContext2D, index: number): void {
    const scale = this.size[index];
    context.fillStyle = 'rgba(82, 36, 34, .42)';
    context.beginPath();
    context.ellipse(this.x[index], this.y[index], 3.5 * scale, 2 * scale, index * 0.73, 0, Math.PI * 2);
    context.fill();
  }

  private drawCrater(context: CanvasRenderingContext2D, index: number): void {
    const radius = 9 * this.size[index];
    context.fillStyle = 'rgba(48, 38, 30, .32)';
    context.beginPath(); context.arc(this.x[index], this.y[index], radius, 0, Math.PI * 2); context.fill();
    context.strokeStyle = 'rgba(116, 83, 55, .34)';
    context.lineWidth = 2;
    context.stroke();
  }

  private drawScorch(context: CanvasRenderingContext2D, index: number): void {
    const radius = 16 * this.size[index];
    context.fillStyle = 'rgba(48, 32, 28, .3)';
    context.beginPath(); context.ellipse(this.x[index], this.y[index], radius, radius * 0.72, 0, 0, Math.PI * 2); context.fill();
  }
}
