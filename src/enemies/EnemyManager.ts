import { TUNING } from '../core/Constants';
import { ENEMY_DATA } from './EnemyData';
import { EnemyType } from './EnemyTypes';
import type { EnemyTypeId } from './EnemyTypes';
import { ENEMY_BEHAVIOR } from './EnemyBehavior';
import type { FlowField } from '../map/FlowField';
import type { TerrainGrid } from '../map/TerrainGrid';
import type { CongestionGrid } from '../systems/CongestionGrid';
import type { ThreatMap } from '../systems/ThreatMap';
import type { SpatialGrid } from '../systems/SpatialGrid';
import { TerrainCell } from '../map/TerrainTypes';

export class EnemyManager {
  readonly capacity = TUNING.maxEnemies;
  readonly x = new Float32Array(this.capacity);
  readonly y = new Float32Array(this.capacity);
  readonly hp = new Float32Array(this.capacity);
  readonly speed = new Float32Array(this.capacity);
  readonly drift = new Float32Array(this.capacity);
  readonly velocityX = new Float32Array(this.capacity);
  readonly velocityY = new Float32Array(this.capacity);
  readonly targetX = new Float32Array(this.capacity);
  readonly maxHp = new Float32Array(this.capacity);
  readonly armor = new Float32Array(this.capacity);
  readonly radius = new Float32Array(this.capacity);
  readonly reward = new Uint16Array(this.capacity);
  readonly wallDamage = new Float32Array(this.capacity);
  readonly burnTime = new Float32Array(this.capacity);
  readonly burnDps = new Float32Array(this.capacity);
  readonly stunTime = new Float32Array(this.capacity);
  readonly type = new Uint8Array(this.capacity);
  readonly elite = new Uint8Array(this.capacity);
  readonly active = new Uint8Array(this.capacity);
  private readonly previousCost = new Int32Array(this.capacity);
  private readonly stuckTimer = new Float32Array(this.capacity);
  private readonly routeCommit = new Float32Array(this.capacity);
  private readonly routeBias = new Int8Array(this.capacity);
  private readonly lastX = new Float32Array(this.capacity);
  private readonly lastY = new Float32Array(this.capacity);
  count = 0;
  totalSpawned = 0;
  stuckRecoveries = 0;
  minimumY = 0;
  maximumY = 0;
  lastDamageDealt = 0;
  lastDeathX = 0;
  lastDeathY = 0;

  spawn(x: number, speedMultiplier = 1, hpMultiplier = 1, type: EnemyTypeId = EnemyType.Grunt, isElite = false, targetX = x): boolean {
    if (this.count >= this.capacity) return false;
    const index = this.count++;
    this.x[index] = x;
    this.y[index] = -TUNING.enemyRadius * 2;
    this.configure(index, x, speedMultiplier, hpMultiplier, type, isElite, targetX);
    return true;
  }

  spawnAt(x: number, y: number, speedMultiplier = 1, hpMultiplier = 1, type: EnemyTypeId = EnemyType.Grunt, isElite = false, targetX = x): boolean {
    if (this.count >= this.capacity) return false;
    const index = this.count++;
    this.y[index] = y;
    this.configure(index, x, speedMultiplier, hpMultiplier, type, isElite, targetX);
    return true;
  }

  update(deltaTime: number, width: number, wallY: number, onWallHit: (damage: number) => void, onDeath: (reward: number, index: number, burning: boolean) => void = () => undefined, flowField?: FlowField, terrain?: TerrainGrid, congestion?: CongestionGrid, threat?: ThreatMap, spatial?: SpatialGrid): void {
    this.minimumY = Number.POSITIVE_INFINITY;
    this.maximumY = Number.NEGATIVE_INFINITY;
    for (let index = 0; index < this.count; index++) {
      if (this.active[index] === 0) continue;
      this.minimumY = Math.min(this.minimumY, this.y[index]);
      this.maximumY = Math.max(this.maximumY, this.y[index]);
      if (this.burnTime[index] > 0) {
        this.burnTime[index] -= deltaTime;
        const reward = this.damage(index, this.burnDps[index] * deltaTime);
        if (reward > 0) { onDeath(reward, index, true); continue; }
      }
      this.stunTime[index] = Math.max(0, this.stunTime[index] - deltaTime);
      if (this.stunTime[index] > 0) continue;
      if (flowField && terrain) this.updateOnTerrain(index, deltaTime, onWallHit, flowField, terrain, congestion, threat, spatial);
      else this.updateLegacy(index, deltaTime, wallY, onWallHit, width);
    }
  }

  damage(index: number, damage: number): number {
    if (index < 0 || index >= this.count || this.active[index] === 0) { this.lastDamageDealt = 0; return 0; }
    this.lastDamageDealt = Math.max(1, damage - this.armor[index]);
    this.hp[index] -= this.lastDamageDealt;
    if (this.hp[index] > 0) return 0;
    this.active[index] = 0;
    this.lastDeathX = this.x[index];
    this.lastDeathY = this.y[index];
    return this.reward[index];
  }

  applyBurn(index: number, duration: number, damagePerSecond: number): void {
    if (index < 0 || index >= this.count || this.active[index] === 0) return;
    this.burnTime[index] = Math.max(this.burnTime[index], duration);
    this.burnDps[index] = Math.max(this.burnDps[index], damagePerSecond);
  }

  stun(index: number, duration: number): void {
    if (index < 0 || index >= this.count || this.active[index] === 0) return;
    this.stunTime[index] = Math.max(this.stunTime[index], duration);
  }

  compact(): void {
    let writeIndex = 0;
    for (let readIndex = 0; readIndex < this.count; readIndex++) {
      if (this.active[readIndex] === 0) continue;
      if (writeIndex !== readIndex) {
        this.x[writeIndex] = this.x[readIndex]; this.y[writeIndex] = this.y[readIndex]; this.hp[writeIndex] = this.hp[readIndex]; this.speed[writeIndex] = this.speed[readIndex]; this.drift[writeIndex] = this.drift[readIndex]; this.velocityX[writeIndex] = this.velocityX[readIndex]; this.velocityY[writeIndex] = this.velocityY[readIndex]; this.targetX[writeIndex] = this.targetX[readIndex]; this.maxHp[writeIndex] = this.maxHp[readIndex]; this.armor[writeIndex] = this.armor[readIndex]; this.radius[writeIndex] = this.radius[readIndex]; this.reward[writeIndex] = this.reward[readIndex]; this.wallDamage[writeIndex] = this.wallDamage[readIndex]; this.burnTime[writeIndex] = this.burnTime[readIndex]; this.burnDps[writeIndex] = this.burnDps[readIndex]; this.stunTime[writeIndex] = this.stunTime[readIndex]; this.type[writeIndex] = this.type[readIndex]; this.elite[writeIndex] = this.elite[readIndex]; this.active[writeIndex] = 1; this.previousCost[writeIndex] = this.previousCost[readIndex]; this.stuckTimer[writeIndex] = this.stuckTimer[readIndex]; this.routeCommit[writeIndex] = this.routeCommit[readIndex]; this.routeBias[writeIndex] = this.routeBias[readIndex]; this.lastX[writeIndex] = this.lastX[readIndex]; this.lastY[writeIndex] = this.lastY[readIndex];
      }
      writeIndex++;
    }
    this.count = writeIndex;
  }

  clear(): void { this.count = 0; this.stuckRecoveries = 0; this.minimumY = 0; this.maximumY = 0; }

  private updateOnTerrain(index: number, deltaTime: number, onWallHit: (damage: number) => void, flowField: FlowField, terrain: TerrainGrid, congestion?: CongestionGrid, threat?: ThreatMap, spatial?: SpatialGrid): void {
    const behavior = ENEMY_BEHAVIOR[this.type[index] as EnemyTypeId];
    const cell = terrain.worldToCell(this.x[index], this.y[index]);
    const cellIndex = terrain.inBounds(cell.x, cell.y) ? terrain.index(cell.x, cell.y) : -1;
    const currentCost = cellIndex >= 0 ? flowField.costs[cellIndex] : -1;
    this.routeCommit[index] = Math.max(0, this.routeCommit[index] - deltaTime);
    let direction = this.recoveryVector(this.x[index], this.y[index], cell.x, cell.y, currentCost, flowField, terrain);
    if (Math.hypot(direction.x, direction.y) < 0.15) direction = flowField.smoothDirectionAtWorld(this.x[index], this.y[index], this.routeBias[index]);
    if (behavior.smartRouting || this.routeCommit[index] <= 0) {
      direction = this.chooseDirection(index, cell.x, cell.y, currentCost, behavior, flowField, terrain, congestion, threat);
      this.routeCommit[index] = behavior.routeCommitment;
    }
    const lookAheadX = this.x[index] + direction.x * terrain.cellSize * 0.65;
    const lookAheadY = this.y[index] + direction.y * terrain.cellSize * 0.65;
    if (!terrain.isWalkableAtWorld(lookAheadX, lookAheadY)) direction = this.recoveryVector(this.x[index], this.y[index], cell.x, cell.y, currentCost, flowField, terrain);
    const repulsion = this.wallRepulsion(this.x[index], this.y[index], cell.x, cell.y, flowField, terrain);
    direction.x += repulsion.x * behavior.wallAvoidance * 0.05;
    direction.y += repulsion.y * behavior.wallAvoidance * 0.05;
    if (spatial) {
      const separation = this.separationVector(index, spatial);
      direction.x += separation.x * 0.9;
      direction.y += separation.y * 0.9;
    }
    const directionLength = Math.hypot(direction.x, direction.y) || 1;
    direction.x /= directionLength; direction.y /= directionLength;
    const response = Math.min(1, behavior.steeringResponsiveness * deltaTime);
    this.velocityX[index] += (direction.x * this.speed[index] - this.velocityX[index]) * response;
    this.velocityY[index] += (direction.y * this.speed[index] - this.velocityY[index]) * response;
    const nextX = this.x[index] + this.velocityX[index] * deltaTime;
    const nextY = this.y[index] + this.velocityY[index] * deltaTime;
    if (terrain.isWalkableAtWorld(nextX, nextY)) { this.x[index] = nextX; this.y[index] = nextY; }
    else {
      const recovery = this.recoveryVector(this.x[index], this.y[index], cell.x, cell.y, currentCost, flowField, terrain);
      const recoveryX = this.x[index] + recovery.x * this.speed[index] * deltaTime;
      const recoveryY = this.y[index] + recovery.y * this.speed[index] * deltaTime;
      if (terrain.isWalkableAtWorld(recoveryX, recoveryY)) { this.x[index] = recoveryX; this.y[index] = recoveryY; this.velocityX[index] = recovery.x * this.speed[index]; this.velocityY[index] = recovery.y * this.speed[index]; }
      else {
        this.velocityX[index] *= 0.35; this.velocityY[index] *= 0.35;
        if (this.stuckTimer[index] > 0.45) {
          const nearest = this.nearestLowerCostCell(cell.x, cell.y, currentCost, flowField, terrain);
          if (nearest) { const center = terrain.cellToWorld(nearest.x, nearest.y); this.x[index] = center.x; this.y[index] = center.y; this.previousCost[index] = flowField.costs[terrain.index(nearest.x, nearest.y)]; this.stuckTimer[index] = 0; this.routeCommit[index] = 0; this.stuckRecoveries++; }
        }
      }
      this.stuckTimer[index] += deltaTime;
    }
    const updated = terrain.worldToCell(this.x[index], this.y[index]);
    const updatedIndex = terrain.inBounds(updated.x, updated.y) ? terrain.index(updated.x, updated.y) : -1;
    const updatedCost = updatedIndex >= 0 ? flowField.costs[updatedIndex] : -1;
    const movedDistance = Math.hypot(this.x[index] - this.lastX[index], this.y[index] - this.lastY[index]);
    if (movedDistance > 0.25 || (updatedCost >= 0 && (this.previousCost[index] < 0 || updatedCost < this.previousCost[index]))) this.stuckTimer[index] = 0;
    else this.stuckTimer[index] += deltaTime;
    this.lastX[index] = this.x[index]; this.lastY[index] = this.y[index];
    this.previousCost[index] = updatedCost;
    if (this.stuckTimer[index] > 0.9 && updatedCost !== 0) {
      const recovery = this.recoveryVector(this.x[index], this.y[index], updated.x, updated.y, updatedCost, flowField, terrain);
      this.velocityX[index] = recovery.x * this.speed[index]; this.velocityY[index] = recovery.y * this.speed[index]; this.stuckTimer[index] = 0; this.routeCommit[index] = 0; this.stuckRecoveries++;
    }
    if (updatedCost === 0) { onWallHit(this.wallDamage[index]); this.active[index] = 0; }
  }

  private separationVector(index: number, spatial: SpatialGrid): { x: number; y: number } {
    const range = this.radius[index] + 22;
    const nearby = spatial.collectInRange(this.x[index], this.y[index], range, this, 24);
    let forceX = 0;
    let forceY = 0;
    for (let resultIndex = 0; resultIndex < nearby; resultIndex++) {
      const otherIndex = spatial.resultAt(resultIndex);
      if (otherIndex === index || this.active[otherIndex] === 0) continue;
      const deltaX = this.x[index] - this.x[otherIndex];
      const deltaY = this.y[index] - this.y[otherIndex];
      const distance = Math.hypot(deltaX, deltaY);
      const minimumDistance = this.radius[index] + this.radius[otherIndex] + 2;
      if (distance >= minimumDistance) continue;
      if (distance < 0.01) {
        forceX += (index & 1) === 0 ? 1 : -1;
        continue;
      }
      const strength = (minimumDistance - distance) / minimumDistance;
      forceX += deltaX / distance * strength;
      forceY += deltaY / distance * strength;
    }
    const length = Math.hypot(forceX, forceY);
    return length > 0 ? { x: forceX / length, y: forceY / length } : { x: 0, y: 0 };
  }

  private updateLegacy(index: number, deltaTime: number, wallY: number, onWallHit: (damage: number) => void, width: number): void {
    this.y[index] += this.speed[index] * deltaTime;
    this.x[index] += (this.targetX[index] - this.x[index]) * deltaTime * 0.08 + this.drift[index] * deltaTime;
    if (this.x[index] < TUNING.enemyRadius || this.x[index] > width - TUNING.enemyRadius) this.drift[index] *= -1;
    if (this.y[index] >= wallY - this.radius[index]) { onWallHit(this.wallDamage[index]); this.active[index] = 0; }
  }

  private chooseDirection(index: number, x: number, y: number, currentCost: number, behavior: typeof ENEMY_BEHAVIOR[EnemyTypeId], flowField: FlowField, terrain: TerrainGrid, congestion?: CongestionGrid, threat?: ThreatMap): { x: number; y: number } {
    let bestScore = Number.POSITIVE_INFINITY;
    let best = flowField.directionAtCell(x, y, this.routeBias[index]);
    for (let direction = 0; direction < 4; direction++) {
      const neighbor = flowField.neighborAt(x, y, direction);
      if (!neighbor || !terrain.isWalkableAtWorld((neighbor.x + 0.5) * terrain.cellSize, (neighbor.y + 0.5) * terrain.cellSize)) continue;
      const neighborIndex = terrain.index(neighbor.x, neighbor.y);
      const cost = flowField.costs[neighborIndex];
      if (cost < 0 || (currentCost >= 0 && cost > currentCost + 1)) continue;
      if (this.type[index] === EnemyType.Boss && this.radius[index] > flowField.clearance[neighborIndex] * terrain.cellSize * 0.45) continue;
      const currentX = this.velocityX[index] / Math.max(1, this.speed[index]);
      const currentY = this.velocityY[index] / Math.max(1, this.speed[index]);
      const continuity = currentX * (neighbor.x - x) + currentY * (neighbor.y - y);
      const score = cost * behavior.distanceWeight + (congestion?.at(neighbor.x, neighbor.y) ?? 0) * behavior.congestionWeight + (threat?.at(neighbor.x, neighbor.y) ?? 0) * behavior.threatWeight - continuity * 0.7;
      if (score < bestScore) { bestScore = score; best = { x: neighbor.x - x, y: neighbor.y - y }; }
    }
    return best;
  }

  private recoveryDirection(x: number, y: number, currentCost: number, flowField: FlowField, terrain: TerrainGrid): { x: number; y: number } {
    let best = { x: 0, y: 0 }; let bestCost = currentCost;
    for (let direction = 0; direction < 4; direction++) {
      const neighbor = flowField.neighborAt(x, y, direction);
      if (!neighbor) continue;
      const cost = flowField.costs[terrain.index(neighbor.x, neighbor.y)];
      if (cost >= 0 && (bestCost < 0 || cost < bestCost)) { bestCost = cost; best = { x: neighbor.x - x, y: neighbor.y - y }; }
    }
    return best.x === 0 && best.y === 0 ? flowField.directionAtCell(x, y) : best;
  }

  private recoveryVector(worldX: number, worldY: number, x: number, y: number, currentCost: number, flowField: FlowField, terrain: TerrainGrid): { x: number; y: number } {
    let best = { x: 0, y: 0 };
    let bestCost = currentCost;
    for (let direction = 0; direction < 4; direction++) {
      const neighbor = flowField.neighborAt(x, y, direction);
      if (!neighbor) continue;
      const cost = flowField.costs[terrain.index(neighbor.x, neighbor.y)];
      if (cost < 0 || (bestCost >= 0 && cost >= bestCost)) continue;
      const center = terrain.cellToWorld(neighbor.x, neighbor.y);
      best.x = center.x - worldX;
      best.y = center.y - worldY;
      bestCost = cost;
    }
    const length = Math.hypot(best.x, best.y);
    return length > 0 ? { x: best.x / length, y: best.y / length } : this.recoveryDirection(x, y, currentCost, flowField, terrain);
  }

  private nearestLowerCostCell(x: number, y: number, currentCost: number, flowField: FlowField, terrain: TerrainGrid): { x: number; y: number } | null {
    let best: { x: number; y: number } | null = null;
    let bestCost = currentCost;
    for (let offsetY = -2; offsetY <= 2; offsetY++) for (let offsetX = -2; offsetX <= 2; offsetX++) {
      const candidateX = x + offsetX; const candidateY = y + offsetY;
      if (!terrain.inBounds(candidateX, candidateY) || !terrain.isWalkableAtWorld((candidateX + 0.5) * terrain.cellSize, (candidateY + 0.5) * terrain.cellSize)) continue;
      const cost = flowField.costs[terrain.index(candidateX, candidateY)];
      if (cost >= 0 && (bestCost < 0 || cost < bestCost)) { bestCost = cost; best = { x: candidateX, y: candidateY }; }
    }
    return best;
  }

  private wallRepulsion(worldX: number, worldY: number, cellX: number, cellY: number, flowField: FlowField, terrain: TerrainGrid): { x: number; y: number } {
    let x = 0; let y = 0;
    for (let direction = 0; direction < 4; direction++) {
      const neighbor = flowField.neighborAt(cellX, cellY, direction);
      if (!neighbor || terrain.get(neighbor.x, neighbor.y) !== TerrainCell.Buildable) continue;
      const point = terrain.cellToWorld(neighbor.x, neighbor.y);
      const deltaX = worldX - point.x; const deltaY = worldY - point.y; const distance = Math.hypot(deltaX, deltaY) || 1;
      if (distance < terrain.cellSize * 0.7) { const force = 1 - distance / (terrain.cellSize * 0.7); x += deltaX / distance * force; y += deltaY / distance * force; }
    }
    return { x, y };
  }

  private configure(index: number, x: number, speedMultiplier: number, hpMultiplier: number, type: EnemyTypeId, isElite: boolean, targetX: number): void {
    const definition = ENEMY_DATA[type]; const eliteMultiplier = isElite ? 2.5 : 1;
    const groupedBias = type === EnemyType.Armored || type === EnemyType.Boss ? Math.floor(this.totalSpawned / 6) % 2 : Math.floor(Math.random() * 7);
    this.maxHp[index] = definition.hp * hpMultiplier * eliteMultiplier; this.hp[index] = this.maxHp[index]; this.speed[index] = definition.speed * speedMultiplier * TUNING.enemyMovementSpeedMultiplier * (isElite ? 1.12 : 1); this.drift[index] = (Math.random() - 0.5) * 18; this.velocityX[index] = 0; this.velocityY[index] = 0; this.x[index] = x; this.lastX[index] = x; this.lastY[index] = this.y[index]; this.targetX[index] = targetX; this.armor[index] = definition.armor + (isElite ? 2 : 0); this.radius[index] = definition.radius * (isElite ? 1.25 : 1); this.reward[index] = definition.reward * (isElite ? 3 : 1); this.wallDamage[index] = definition.wallDamage * (isElite ? 1.5 : 1); this.burnTime[index] = 0; this.burnDps[index] = 0; this.stunTime[index] = 0; this.type[index] = type; this.elite[index] = isElite ? 1 : 0; this.active[index] = 1; this.previousCost[index] = -1; this.stuckTimer[index] = 0; this.routeCommit[index] = 0.4 + Math.random() * 0.8; this.routeBias[index] = groupedBias; this.totalSpawned++;
  }
}
