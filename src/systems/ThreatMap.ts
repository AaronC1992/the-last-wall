import { TerrainCell } from '../map/TerrainTypes';
import { TerrainGrid } from '../map/TerrainGrid';
import type { PlacedTower } from '../weapons/WeaponManager';

export class ThreatMap {
  readonly values: Float32Array;

  constructor(private readonly terrain: TerrainGrid) {
    this.values = new Float32Array(terrain.width * terrain.height);
  }

  rebuild(towers: readonly PlacedTower[]): void {
    this.values.fill(0);
    for (const tower of towers) {
      if (!tower.instance.hasAim) continue;
      const targeting = tower.instance.targeting;
      const baseThreat = tower.kind === 'ballista' ? 1.3 : tower.kind === 'cannon' ? 2.1 : tower.kind === 'mortar' ? 2.4 : tower.kind === 'fireTower' ? 1.6 : 1.8;
      for (let y = 0; y < this.terrain.height; y++) for (let x = 0; x < this.terrain.width; x++) {
        const cell = this.terrain.get(x, y);
        if (cell !== TerrainCell.Path && cell !== TerrainCell.Spawn && cell !== TerrainCell.Goal) continue;
        const point = this.terrain.cellToWorld(x, y);
        let contribution = 0;
        if (targeting.mode === 'line') {
          const along = (point.x - tower.instance.x) * Math.cos(targeting.angle) + (point.y - tower.instance.y) * Math.sin(targeting.angle);
          const across = Math.abs((point.x - tower.instance.x) * Math.sin(targeting.angle) - (point.y - tower.instance.y) * Math.cos(targeting.angle));
          if (along >= 0 && along <= targeting.distance && across <= targeting.width + this.terrain.cellSize * 0.45) contribution = baseThreat;
          if (tower.kind === 'cannon' && Math.hypot(point.x - tower.instance.aimX, point.y - tower.instance.aimY) <= 90) contribution += baseThreat;
        } else if (targeting.mode === 'cone') {
          contribution = tower.instance.isInFixedCone(point.x, point.y) ? baseThreat : 0;
        } else {
          const radius = targeting.radius + this.terrain.cellSize * 0.5;
          contribution = Math.hypot(point.x - targeting.targetX, point.y - targeting.targetY) <= radius ? baseThreat : 0;
        }
        this.values[this.terrain.index(x, y)] += contribution;
      }
    }
  }

  at(x: number, y: number): number {
    return this.terrain.inBounds(x, y) ? this.values[this.terrain.index(x, y)] : 0;
  }

  render(context: CanvasRenderingContext2D): void {
    let maximum = 0;
    for (const value of this.values) maximum = Math.max(maximum, value);
    if (maximum <= 0) return;
    context.save();
    for (let y = 0; y < this.terrain.height; y++) for (let x = 0; x < this.terrain.width; x++) {
      const value = this.values[this.terrain.index(x, y)];
      if (value <= 0) continue;
      context.fillStyle = `rgba(224, 70, 79, ${Math.min(0.5, value / maximum * 0.5)})`;
      context.fillRect(x * this.terrain.cellSize, y * this.terrain.cellSize, this.terrain.cellSize, this.terrain.cellSize);
    }
    context.restore();
  }
}
