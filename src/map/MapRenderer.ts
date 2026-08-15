import { TUNING } from '../core/Constants';
import { SeededRandom } from './SeededRandom';
import { TerrainCell } from './TerrainTypes';
import type { MapDefinition } from './TerrainTypes';
import { TerrainGrid } from './TerrainGrid';
import type { TowerKind } from '../weapons/TowerConfig';

export class MapRenderer {
  private readonly cache: HTMLCanvasElement;
  private readonly cachedContext: CanvasRenderingContext2D;
  private readonly random: SeededRandom;
  private readonly grid: TerrainGrid;

  constructor(private readonly definition: MapDefinition) {
    this.grid = new TerrainGrid(definition);
    this.random = new SeededRandom(definition.seed);
    this.cache = document.createElement('canvas');
    this.cache.width = TUNING.logicalWidth;
    this.cache.height = TUNING.logicalHeight;
    this.cachedContext = this.cache.getContext('2d')!;
    this.generateStaticTerrain();
  }

  renderBackground(context: CanvasRenderingContext2D): void { context.drawImage(this.cache, 0, 0); }

  renderDefenseLine(context: CanvasRenderingContext2D, wallHp: number, wallMaxHp: number): void {
    const wallY = TUNING.logicalHeight - TUNING.wallHeight;
    context.fillStyle = '#40382f'; context.fillRect(0, wallY, TUNING.logicalWidth, TUNING.wallHeight);
    context.fillStyle = '#8f8774'; context.fillRect(0, wallY + 8, TUNING.logicalWidth, 42);
    context.fillStyle = '#262c2c'; context.fillRect(20, wallY - 21, 180, 10);
    context.fillStyle = wallHp > wallMaxHp * 0.35 ? '#77c377' : '#e06458'; context.fillRect(20, wallY - 21, Math.max(0, wallHp / wallMaxHp * 180), 10);
    const goal = this.grid.cellToWorld(this.definition.goalCell.x, this.definition.goalCell.y);
    context.fillStyle = '#1f2424'; context.fillRect(goal.x - 42, wallY - 48, 84, 42);
    context.strokeStyle = '#d4b66e'; context.lineWidth = 3; context.strokeRect(goal.x - 42, wallY - 48, 84, 42);
  }

  drawTower(context: CanvasRenderingContext2D, kind: TowerKind, x: number, y: number, ghost: boolean): void {
    context.save();
    if (ghost) context.globalAlpha = 0.55;
    context.fillStyle = '#514d43'; context.beginPath(); context.arc(x, y + 5, 24, 0, Math.PI * 2); context.fill();
    context.fillStyle = '#827b68'; context.beginPath(); context.arc(x, y, 19, 0, Math.PI * 2); context.fill();
    context.strokeStyle = '#b7a889'; context.lineWidth = 2; context.stroke();
    if (kind === 'ballista') this.drawBallista(context, x, y);
    else if (kind === 'cannon') this.drawCannon(context, x, y);
    else if (kind === 'fireTower') this.drawFireTower(context, x, y);
    else this.drawLightningTower(context, x, y);
    context.restore();
  }

  private generateStaticTerrain(): void {
    const context = this.cachedContext;
    context.fillStyle = '#a0875d'; context.fillRect(0, 0, TUNING.logicalWidth, TUNING.logicalHeight);
    for (let y = 0; y < this.grid.height; y++) for (let x = 0; x < this.grid.width; x++) {
      const cell = this.grid.get(x, y); const left = x * this.grid.cellSize; const top = y * this.grid.cellSize;
      if (cell === TerrainCell.Blocked) {
        context.fillStyle = '#3b443b'; context.fillRect(left, top, this.grid.cellSize, this.grid.cellSize);
      } else if (cell === TerrainCell.Path || cell === TerrainCell.Spawn || cell === TerrainCell.Goal) {
        context.fillStyle = cell === TerrainCell.Goal ? '#51453a' : '#776956'; context.fillRect(left, top, this.grid.cellSize, this.grid.cellSize);
        context.fillStyle = '#8f806b'; context.globalAlpha = 0.22; context.fillRect(left + 4, top + 5, this.grid.cellSize - 8, 3); context.globalAlpha = 1;
      } else {
        context.fillStyle = '#a0875d'; context.fillRect(left, top, this.grid.cellSize, this.grid.cellSize);
        context.fillStyle = '#b89a6b'; context.globalAlpha = 0.13; context.fillRect(left + 5 + this.random.range(0, 8), top + 8 + this.random.range(0, 12), 2, 5); context.globalAlpha = 1;
      }
    }
    this.drawCliffEdges(context);
  }

  private drawCliffEdges(context: CanvasRenderingContext2D): void {
    context.strokeStyle = '#4f4437'; context.lineWidth = 4;
    for (let y = 0; y < this.grid.height; y++) for (let x = 0; x < this.grid.width; x++) {
      const cell = this.grid.get(x, y);
      if (cell !== TerrainCell.Path && cell !== TerrainCell.Spawn && cell !== TerrainCell.Goal) continue;
      const left = x * this.grid.cellSize; const top = y * this.grid.cellSize;
      if (this.grid.get(x - 1, y) === TerrainCell.Buildable) this.edge(context, left, top, left, top + this.grid.cellSize);
      if (this.grid.get(x + 1, y) === TerrainCell.Buildable) this.edge(context, left + this.grid.cellSize, top, left + this.grid.cellSize, top + this.grid.cellSize);
      if (this.grid.get(x, y - 1) === TerrainCell.Buildable) this.edge(context, left, top, left + this.grid.cellSize, top);
      if (this.grid.get(x, y + 1) === TerrainCell.Buildable) this.edge(context, left, top + this.grid.cellSize, left + this.grid.cellSize, top + this.grid.cellSize);
    }
  }

  private edge(context: CanvasRenderingContext2D, x: number, y: number, endX: number, endY: number): void { context.beginPath(); context.moveTo(x, y); context.lineTo(endX, endY); context.stroke(); }

  private drawBallista(context: CanvasRenderingContext2D, x: number, y: number): void {
    context.fillStyle = '#5b3f2d'; context.fillRect(x - 17, y - 28, 34, 15); context.strokeStyle = '#d1b477'; context.lineWidth = 4; context.beginPath(); context.moveTo(x - 20, y - 30); context.lineTo(x + 20, y - 30); context.stroke(); context.fillStyle = '#bd8b4e'; context.fillRect(x - 3, y - 47, 6, 28);
  }
  private drawCannon(context: CanvasRenderingContext2D, x: number, y: number): void {
    context.fillStyle = '#343b3b'; context.fillRect(x - 19, y - 25, 38, 19); context.fillStyle = '#1d2729'; context.fillRect(x - 5, y - 48, 10, 30); context.fillStyle = '#ab8d61'; context.beginPath(); context.arc(x - 16, y - 3, 7, 0, Math.PI * 2); context.arc(x + 16, y - 3, 7, 0, Math.PI * 2); context.fill();
  }
  private drawFireTower(context: CanvasRenderingContext2D, x: number, y: number): void {
    context.fillStyle = '#75402d'; context.fillRect(x - 16, y - 27, 32, 22); context.fillStyle = '#d9673d'; context.beginPath(); context.arc(x, y - 35, 12, 0, Math.PI * 2); context.fill(); context.fillStyle = '#ffd17a'; context.beginPath(); context.arc(x, y - 37, 5, 0, Math.PI * 2); context.fill();
  }
  private drawLightningTower(context: CanvasRenderingContext2D, x: number, y: number): void {
    context.fillStyle = '#4f6371'; context.fillRect(x - 15, y - 26, 30, 22); context.fillStyle = '#b4d7d5'; context.beginPath(); context.moveTo(x, y - 63); context.lineTo(x - 11, y - 35); context.lineTo(x + 5, y - 40); context.lineTo(x - 2, y - 24); context.lineTo(x + 14, y - 47); context.lineTo(x + 1, y - 44); context.closePath(); context.fill();
  }
}
