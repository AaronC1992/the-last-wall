import { TerrainCell, isWalkable } from './TerrainTypes';
import type { MapPoint } from './TerrainTypes';
import { TerrainGrid } from './TerrainGrid';

export class FlowField {
  readonly costs: Float32Array;
  readonly directions: Int8Array;
  readonly clearance: Uint8Array;

  constructor(readonly grid: TerrainGrid, goal: MapPoint, threat?: { at(x: number, y: number): number }, threatWeight = 0) {
    const size = grid.width * grid.height;
    this.costs = new Float32Array(size);
    this.directions = new Int8Array(size * 2);
    this.clearance = new Uint8Array(size);
    this.costs.fill(Number.POSITIVE_INFINITY);
    this.clearance.fill(0);
    this.rebuild(goal, threat, threatWeight);
  }

  rebuild(goal: MapPoint, threat?: { at(x: number, y: number): number }, threatWeight = 0): void {
    this.costs.fill(Number.POSITIVE_INFINITY);
    const heapNodes: number[] = [];
    const heapCosts: number[] = [];
    const goalIndex = this.grid.index(goal.x, goal.y);
    if (this.grid.get(goal.x, goal.y) !== TerrainCell.Goal && !isWalkable(this.grid.get(goal.x, goal.y))) return;
    this.costs[goalIndex] = 0;
    this.pushHeap(heapNodes, heapCosts, goalIndex, 0);
    while (heapNodes.length > 0) {
      const current = this.popHeap(heapNodes, heapCosts);
      const currentCost = this.costs[current];
      if (currentCost === Number.POSITIVE_INFINITY) continue;
      const x = current % this.grid.width;
      const y = Math.floor(current / this.grid.width);
      for (let direction = 0; direction < 4; direction++) {
        const neighbor = this.neighborAt(x, y, direction);
        if (!neighbor) continue;
        const neighborIndex = this.grid.index(neighbor.x, neighbor.y);
        if (!isWalkable(this.grid.get(neighbor.x, neighbor.y))) continue;
        const nextCost = currentCost + 1 + (threat ? threat.at(neighbor.x, neighbor.y) * threatWeight : 0);
        if (nextCost >= this.costs[neighborIndex]) continue;
        this.costs[neighborIndex] = nextCost;
        this.pushHeap(heapNodes, heapCosts, neighborIndex, nextCost);
      }
    }
    for (let index = 0; index < this.costs.length; index++) if (!Number.isFinite(this.costs[index])) this.costs[index] = -1;
    this.buildClearance();
    for (let y = 0; y < this.grid.height; y++) for (let x = 0; x < this.grid.width; x++) {
      const index = this.grid.index(x, y);
      let bestCost = this.costs[index];
      let dx = 0;
      let dy = 0;
      for (let direction = 0; direction < 4; direction++) {
        const neighbor = this.neighborAt(x, y, direction);
        if (!neighbor) continue;
        const neighborCost = this.costs[this.grid.index(neighbor.x, neighbor.y)];
        if (neighborCost >= 0 && (bestCost < 0 || neighborCost < bestCost)) {
          bestCost = neighborCost;
          dx = neighbor.x - x;
          dy = neighbor.y - y;
        }
      }
      this.directions[index * 2] = dx;
      this.directions[index * 2 + 1] = dy;
    }
  }

  directionAtWorld(x: number, y: number, variation = 0): MapPoint {
    const cell = this.grid.worldToCell(x, y);
    if (!this.grid.inBounds(cell.x, cell.y)) return { x: 0, y: 1 };
    return this.directionAtCell(cell.x, cell.y, variation);
  }

  smoothDirectionAtWorld(x: number, y: number, variation = 0): MapPoint {
    const cell = this.grid.worldToCell(x, y);
    const localX = x / this.grid.cellSize - cell.x;
    const localY = y / this.grid.cellSize - cell.y;
    const topLeft = this.directionAtCell(cell.x, cell.y, variation);
    const topRight = this.directionAtCell(cell.x + 1, cell.y, variation);
    const bottomLeft = this.directionAtCell(cell.x, cell.y + 1, variation);
    const bottomRight = this.directionAtCell(cell.x + 1, cell.y + 1, variation);
    const horizontal = { x: topLeft.x * (1 - localX) + topRight.x * localX, y: topLeft.y * (1 - localX) + topRight.y * localX };
    return { x: horizontal.x * (1 - localY) + (bottomLeft.x * (1 - localX) + bottomRight.x * localX) * localY, y: horizontal.y * (1 - localY) + (bottomLeft.y * (1 - localX) + bottomRight.y * localX) * localY };
  }

  directionAtCell(x: number, y: number, variation = 0): MapPoint {
    if (!this.grid.inBounds(x, y)) return { x: 0, y: 0 };
    const index = this.grid.index(x, y);
    const baseX = this.directions[index * 2];
    const baseY = this.directions[index * 2 + 1];
    if (variation === 0 || (baseX === 0 && baseY === 0)) return { x: baseX, y: baseY };
    const currentCost = this.costs[index];
    let optionCount = 0;
    let selected = { x: baseX, y: baseY };
    for (let direction = 0; direction < 4; direction++) {
      const neighbor = this.neighborAt(x, y, direction);
      if (!neighbor) continue;
      const cost = this.costs[this.grid.index(neighbor.x, neighbor.y)];
      if (cost < 0 || (currentCost >= 0 && cost > currentCost + 2)) continue;
      optionCount++;
      if (Math.abs(variation) % optionCount === 0) selected = { x: neighbor.x - x, y: neighbor.y - y };
    }
    return selected;
  }

  neighborAt(x: number, y: number, direction: number): MapPoint | null {
    const neighbor = direction === 0 ? { x: x + 1, y } : direction === 1 ? { x: x - 1, y } : direction === 2 ? { x, y: y + 1 } : { x, y: y - 1 };
    return this.grid.inBounds(neighbor.x, neighbor.y) ? neighbor : null;
  }

  private buildClearance(): void {
    const size = this.grid.width * this.grid.height;
    const queue = new Int32Array(size);
    let head = 0;
    let tail = 0;
    for (let y = 0; y < this.grid.height; y++) for (let x = 0; x < this.grid.width; x++) {
      const index = this.grid.index(x, y);
      if (!isWalkable(this.grid.get(x, y))) { this.clearance[index] = 0; queue[tail++] = index; }
      else this.clearance[index] = 255;
    }
    while (head < tail) {
      const current = queue[head++];
      const x = current % this.grid.width;
      const y = Math.floor(current / this.grid.width);
      for (let direction = 0; direction < 4; direction++) {
        const neighbor = this.neighborAt(x, y, direction);
        if (!neighbor) continue;
        const neighborIndex = this.grid.index(neighbor.x, neighbor.y);
        if (this.clearance[neighborIndex] > this.clearance[current] + 1) { this.clearance[neighborIndex] = Math.min(255, this.clearance[current] + 1); queue[tail++] = neighborIndex; }
      }
    }
  }

  private pushHeap(nodes: number[], costs: number[], node: number, cost: number): void {
    let index = nodes.length;
    nodes.push(node);
    costs.push(cost);
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (costs[parent] <= cost) break;
      nodes[index] = nodes[parent];
      costs[index] = costs[parent];
      index = parent;
    }
    nodes[index] = node;
    costs[index] = cost;
  }

  private popHeap(nodes: number[], costs: number[]): number {
    const node = nodes[0];
    const lastNode = nodes.pop()!;
    const lastCost = costs.pop()!;
    if (nodes.length === 0) return node;
    let index = 0;
    while (index * 2 + 1 < nodes.length) {
      let child = index * 2 + 1;
      if (child + 1 < nodes.length && costs[child + 1] < costs[child]) child++;
      if (costs[child] >= lastCost) break;
      nodes[index] = nodes[child];
      costs[index] = costs[child];
      index = child;
    }
    nodes[index] = lastNode;
    costs[index] = lastCost;
    return node;
  }
}
