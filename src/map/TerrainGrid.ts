import { TerrainCell, isWalkable } from './TerrainTypes';
import type { MapDefinition, MapPoint } from './TerrainTypes';

export class TerrainGrid {
  readonly width: number;
  readonly height: number;
  readonly cellSize: number;
  readonly cells: Uint8Array;

  constructor(definition: MapDefinition) {
    this.width = definition.width;
    this.height = definition.height;
    this.cellSize = definition.cellSize;
    this.cells = Uint8Array.from(definition.terrain);
  }

  index(x: number, y: number): number {
    return y * this.width + x;
  }

  inBounds(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
  }

  get(x: number, y: number): TerrainCell {
    if (!this.inBounds(x, y)) return TerrainCell.Blocked;
    return this.cells[this.index(x, y)] as TerrainCell;
  }

  set(x: number, y: number, cell: TerrainCell): void {
    if (this.inBounds(x, y)) this.cells[this.index(x, y)] = cell;
  }

  worldToCell(x: number, y: number): MapPoint {
    return { x: Math.floor(x / this.cellSize), y: Math.floor(y / this.cellSize) };
  }

  cellToWorld(x: number, y: number): MapPoint {
    return { x: (x + 0.5) * this.cellSize, y: (y + 0.5) * this.cellSize };
  }

  isWalkableAtWorld(x: number, y: number): boolean {
    const cell = this.worldToCell(x, y);
    return isWalkable(this.get(cell.x, cell.y));
  }

  segmentHitsBuildable(startX: number, startY: number, endX: number, endY: number): boolean {
    const startCell = this.worldToCell(startX, startY);
    const distance = Math.hypot(endX - startX, endY - startY);
    const samples = Math.max(2, Math.ceil(distance / (this.cellSize * 0.25)));
    let enteredValley = isWalkable(this.get(startCell.x, startCell.y));
    for (let sample = 1; sample <= samples; sample++) {
      const amount = sample / samples;
      const pointX = startX + (endX - startX) * amount;
      const pointY = startY + (endY - startY) * amount;
      const cell = this.worldToCell(pointX, pointY);
      if (cell.x === startCell.x && cell.y === startCell.y) continue;
      const cellType = this.get(cell.x, cell.y);
      if (isWalkable(cellType)) { enteredValley = true; continue; }
      if (enteredValley || cellType === TerrainCell.Blocked) return true;
    }
    return false;
  }

  isBuildableFootprint(x: number, y: number, radius: number): boolean {
    const minX = Math.floor((x - radius) / this.cellSize);
    const maxX = Math.floor((x + radius) / this.cellSize);
    const minY = Math.floor((y - radius) / this.cellSize);
    const maxY = Math.floor((y + radius) / this.cellSize);
    for (let cellY = minY; cellY <= maxY; cellY++) {
      for (let cellX = minX; cellX <= maxX; cellX++) {
        if (!this.inBounds(cellX, cellY) || this.get(cellX, cellY) !== TerrainCell.Buildable) return false;
      }
    }
    return true;
  }

  cloneDefinition(base: MapDefinition): MapDefinition {
    return { ...base, terrain: Array.from(this.cells) };
  }
}
