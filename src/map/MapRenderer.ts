import { TUNING } from '../core/Constants';
import { SeededRandom } from './SeededRandom';
import { KING_APPROACH } from './MapConfig';
import type { TowerKind } from '../weapons/TowerConfig';

export class MapRenderer {
  private readonly cache: HTMLCanvasElement;
  private readonly cachedContext: CanvasRenderingContext2D;
  private readonly random = new SeededRandom(KING_APPROACH.seed);

  constructor() {
    this.cache = document.createElement('canvas');
    this.cache.width = TUNING.logicalWidth;
    this.cache.height = TUNING.logicalHeight;
    this.cachedContext = this.cache.getContext('2d')!;
    this.generateStaticTerrain();
  }

  renderBackground(context: CanvasRenderingContext2D): void {
    context.drawImage(this.cache, 0, 0);
  }

  renderDefenseLine(context: CanvasRenderingContext2D, wallHp: number, wallMaxHp: number): void {
    this.renderWall(context);
    const wallY = TUNING.logicalHeight - TUNING.wallHeight;
    const healthWidth = Math.max(0, wallHp / wallMaxHp * 180);
    context.fillStyle = '#242b28';
    context.fillRect(20, wallY - 21, 180, 10);
    context.fillStyle = wallHp > wallMaxHp * 0.35 ? '#77c377' : '#e06458';
    context.fillRect(20, wallY - 21, healthWidth, 10);
  }

  private generateStaticTerrain(): void {
    const context = this.cachedContext;
    const palette = KING_APPROACH.palette;
    // Plain ground fill
    context.fillStyle = palette.grass;
    context.fillRect(0, 0, TUNING.logicalWidth, TUNING.logicalHeight);
    // Simple subtle texture
    this.drawTerrainTexture(context);
    // Draw the road path with edge shadow
    this.drawRoads(context);
    // Draw castle gate at the bottom
    this.drawCastleGate(context);
  }

  private drawRoads(context: CanvasRenderingContext2D): void {
    const palette = KING_APPROACH.palette;
    // Draw path shadow/edge
    for (const road of KING_APPROACH.roadPaths) {
      this.strokeRoad(context, road, road.width + 20, palette.dirtEdge);
      this.strokeRoad(context, road, road.width, palette.dirt);
    }
  }

  private strokeRoad(context: CanvasRenderingContext2D, road: typeof KING_APPROACH.roadPaths[number], width: number, color: string): void {
    context.strokeStyle = color;
    context.lineWidth = width;
    context.lineCap = 'round';
    context.beginPath();
    context.moveTo(road.startX, road.startY);
    context.bezierCurveTo(road.controlX1, road.controlY1, road.controlX2, road.controlY2, road.endX, road.endY);
    context.stroke();
  }

  private drawTerrainTexture(context: CanvasRenderingContext2D): void {
    const palette = KING_APPROACH.palette;
    context.save();
    // Add subtle grass texture variation
    for (let index = 0; index < 300; index++) {
      const x = this.random.range(0, TUNING.logicalWidth);
      const y = this.random.range(0, TUNING.logicalHeight);
      context.strokeStyle = palette.grassLight;
      context.globalAlpha = this.random.range(0.06, 0.12);
      context.lineWidth = this.random.range(1, 2);
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(x + this.random.range(-1, 2), y - this.random.range(1, 3));
      context.stroke();
    }
    context.restore();
  }

  private drawCastleGate(context: CanvasRenderingContext2D): void {
    const palette = KING_APPROACH.palette;
    const wallY = TUNING.logicalHeight - TUNING.wallHeight;

    // Castle gate outline
    context.fillStyle = palette.wallDark;
    context.fillRect(450, wallY - 80, 300, 80);

    // Gate towers
    context.fillStyle = palette.stone;
    context.fillRect(450, wallY - 90, 40, 90);
    context.fillRect(710, wallY - 90, 40, 90);

    // Gate door
    context.fillStyle = '#3d3d3d';
    context.fillRect(500, wallY - 70, 200, 70);

    // Gate door detail
    context.strokeStyle = '#5a5a5a';
    context.lineWidth = 2;
    context.strokeRect(520, wallY - 60, 160, 50);
  }

  drawTower(context: CanvasRenderingContext2D, kind: TowerKind, x: number, y: number, ghost: boolean): void {
    context.save();
    if (ghost) context.globalAlpha = 0.55;
    context.fillStyle = '#514d43';
    context.beginPath(); context.arc(x, y + 5, 24, 0, Math.PI * 2); context.fill();
    context.fillStyle = '#827b68';
    context.beginPath(); context.arc(x, y, 19, 0, Math.PI * 2); context.fill();
    context.strokeStyle = '#b7a889';
    context.lineWidth = 2;
    context.stroke();
    if (kind === 'ballista') this.drawBallista(context, x, y);
    else if (kind === 'cannon') this.drawCannon(context, x, y);
    else if (kind === 'fireTower') this.drawFireTower(context, x, y);
    else this.drawLightningTower(context, x, y);
    context.restore();
  }

  private drawBallista(context: CanvasRenderingContext2D, x: number, y: number): void {
    context.fillStyle = '#5b3f2d'; context.fillRect(x - 17, y - 28, 34, 15);
    context.strokeStyle = '#d1b477'; context.lineWidth = 4; context.beginPath(); context.moveTo(x - 20, y - 30); context.lineTo(x + 20, y - 30); context.stroke();
    context.fillStyle = '#bd8b4e'; context.fillRect(x - 3, y - 47, 6, 28);
  }

  private drawCannon(context: CanvasRenderingContext2D, x: number, y: number): void {
    context.fillStyle = '#343b3b'; context.fillRect(x - 19, y - 25, 38, 19); context.fillStyle = '#1d2729'; context.fillRect(x - 5, y - 48, 10, 30);
    context.fillStyle = '#ab8d61'; context.beginPath(); context.arc(x - 16, y - 3, 7, 0, Math.PI * 2); context.arc(x + 16, y - 3, 7, 0, Math.PI * 2); context.fill();
  }

  private drawFireTower(context: CanvasRenderingContext2D, x: number, y: number): void {
    context.fillStyle = '#75402d'; context.fillRect(x - 16, y - 27, 32, 22); context.fillStyle = '#d9673d'; context.beginPath(); context.arc(x, y - 35, 12, 0, Math.PI * 2); context.fill(); context.fillStyle = '#ffd17a'; context.beginPath(); context.arc(x, y - 37, 5, 0, Math.PI * 2); context.fill();
  }

  private drawLightningTower(context: CanvasRenderingContext2D, x: number, y: number): void {
    context.fillStyle = '#4f6371'; context.fillRect(x - 15, y - 26, 30, 22); context.fillStyle = '#b4d7d5'; context.beginPath(); context.moveTo(x, y - 63); context.lineTo(x - 11, y - 35); context.lineTo(x + 5, y - 40); context.lineTo(x - 2, y - 24); context.lineTo(x + 14, y - 47); context.lineTo(x + 1, y - 44); context.closePath(); context.fill();
  }

  private renderWall(context: CanvasRenderingContext2D): void {
    const palette = KING_APPROACH.palette;
    const wallY = TUNING.logicalHeight - TUNING.wallHeight;
    context.fillStyle = palette.wallDark;
    context.fillRect(0, wallY, TUNING.logicalWidth, TUNING.wallHeight);
    context.fillStyle = palette.wall;
    context.fillRect(0, wallY + 8, TUNING.logicalWidth, 50);
    context.fillStyle = palette.stoneLight;
    for (let x = 0; x < TUNING.logicalWidth; x += 48) {
      context.fillRect(x + 3, wallY, 28, 12);
      context.fillStyle = palette.wallDark;
      context.fillRect(x + 31, wallY + 12, 3, 15);
      context.fillStyle = palette.stoneLight;
    }
    context.strokeStyle = palette.wallDark;
    context.lineWidth = 2;
    for (let row = 0; row < 2; row++) for (let x = (row % 2) * 23; x < TUNING.logicalWidth; x += 46) {
      context.beginPath(); context.moveTo(x, wallY + 14 + row * 21); context.lineTo(x, wallY + 34 + row * 21); context.stroke();
    }
    context.fillStyle = '#3d3027'; context.fillRect(530, wallY + 18, 140, 40);
    context.fillStyle = '#1e272b'; context.fillRect(550, wallY + 22, 100, 36);
    context.fillStyle = '#8d6d49'; context.fillRect(541, wallY + 18, 10, 40); context.fillRect(649, wallY + 18, 10, 40);
    context.fillStyle = palette.wallDark;
    context.fillRect(70, wallY - 13, 76, 22); context.fillRect(1054, wallY - 13, 76, 22);
    context.fillStyle = palette.banner;
    context.fillRect(105, wallY - 45, 4, 32); context.fillRect(109, wallY - 43, 27, 14);
    context.fillRect(1090, wallY - 45, 4, 32); context.fillRect(1094, wallY - 43, 27, 14);
    context.fillStyle = '#47382b';
    for (let x = 8; x < TUNING.logicalWidth; x += 66) context.fillRect(x, wallY + 55, 6, 13);
  }
}
