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
    context.fillStyle = palette.grass;
    context.fillRect(0, 0, TUNING.logicalWidth, TUNING.logicalHeight);
    this.drawHorizon(context);
    this.drawRoads(context);
    this.drawTerrainTexture(context);
    this.drawForestEdges(context);
    this.drawSideStream(context);
    this.drawBattlefieldHistory(context);
    this.drawCity(context);
  }

  private drawHorizon(context: CanvasRenderingContext2D): void {
    const palette = KING_APPROACH.palette;
    context.fillStyle = '#344838';
    context.fillRect(0, 0, TUNING.logicalWidth, 78);
    context.fillStyle = '#2a3b31';
    context.beginPath();
    context.moveTo(0, 74);
    for (let x = 0; x <= TUNING.logicalWidth; x += 80) context.lineTo(x, 45 + Math.sin(x * 0.018) * 18);
    context.lineTo(TUNING.logicalWidth, 115);
    context.lineTo(0, 115);
    context.closePath();
    context.fill();
    for (let index = 0; index < 12; index++) this.drawTree(context, 35 + index * 100 + this.random.range(-24, 24), this.random.range(24, 66), this.random.range(14, 24));
    for (const zone of KING_APPROACH.spawnZones) {
      context.fillStyle = '#554437';
      context.fillRect(zone.x - zone.width * 0.3, zone.y + 20, zone.width * 0.6, 3);
      context.fillStyle = '#8b5d3b';
      context.beginPath();
      context.moveTo(zone.x - 13, zone.y + 20);
      context.lineTo(zone.x, zone.y - 2);
      context.lineTo(zone.x + 13, zone.y + 20);
      context.closePath();
      context.fill();
      context.fillStyle = palette.torch;
      context.beginPath();
      context.arc(zone.x + zone.width * 0.3, zone.y + 13, 3, 0, Math.PI * 2);
      context.fill();
    }
    context.fillStyle = palette.banner;
    context.fillRect(454, 21, 3, 42);
    context.fillRect(457, 24, 22, 12);
    context.fillStyle = '#6b3d34';
    context.fillRect(738, 30, 3, 33);
    context.fillRect(741, 32, 20, 10);
  }

  private drawRoads(context: CanvasRenderingContext2D): void {
    const palette = KING_APPROACH.palette;
    for (const road of KING_APPROACH.roadPaths) {
      this.strokeRoad(context, road, road.width + 14, palette.dirtEdge);
      this.strokeRoad(context, road, road.width, palette.dirt);
    }
    context.save();
    context.globalAlpha = 0.32;
    context.setLineDash([22, 18]);
    this.strokeRoad(context, KING_APPROACH.roadPaths[0], 8, '#403529');
    context.restore();
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
    for (let index = 0; index < 620; index++) {
      const x = this.random.range(35, 1165);
      const y = this.random.range(125, 690);
      context.strokeStyle = index % 4 === 0 ? palette.dryGrass : palette.grassLight;
      context.globalAlpha = this.random.range(0.12, 0.28);
      context.lineWidth = this.random.range(1, 2);
      context.beginPath();
      context.moveTo(x, y + 3);
      context.lineTo(x + this.random.range(-2, 3), y - this.random.range(2, 6));
      context.stroke();
    }
    for (let index = 0; index < 90; index++) {
      context.fillStyle = index % 3 === 0 ? palette.mud : palette.stone;
      context.globalAlpha = 0.28;
      context.beginPath();
      context.ellipse(this.random.range(170, 1030), this.random.range(150, 625), this.random.range(2, 6), this.random.range(1, 3), this.random.next(), 0, Math.PI * 2);
      context.fill();
    }
    context.restore();
  }

  private drawForestEdges(context: CanvasRenderingContext2D): void {
    for (let index = 0; index < 62; index++) {
      const x = index % 2 === 0 ? this.random.range(12, 165) : this.random.range(1035, 1188);
      this.drawTree(context, x, this.random.range(86, 635), this.random.range(12, 25));
    }
    context.fillStyle = KING_APPROACH.palette.stone;
    for (let index = 0; index < 18; index++) {
      const x = index % 2 === 0 ? this.random.range(25, 175) : this.random.range(1025, 1175);
      const y = this.random.range(140, 635);
      context.beginPath();
      context.moveTo(x - 8, y + 7);
      context.lineTo(x - 3, y - 7);
      context.lineTo(x + 10, y - 4);
      context.lineTo(x + 13, y + 6);
      context.closePath();
      context.fill();
    }
  }

  private drawTree(context: CanvasRenderingContext2D, x: number, y: number, size: number): void {
    const palette = KING_APPROACH.palette;
    context.fillStyle = 'rgba(27, 32, 25, .28)';
    context.beginPath(); context.ellipse(x + 4, y + 6, size, size * 0.55, 0, 0, Math.PI * 2); context.fill();
    context.fillStyle = '#4b3829';
    context.fillRect(x - 3, y + size * 0.1, 6, size * 0.7);
    context.fillStyle = palette.forest;
    context.beginPath(); context.arc(x, y, size * 0.75, 0, Math.PI * 2); context.fill();
    context.fillStyle = palette.forestLight;
    context.beginPath(); context.arc(x - size * 0.35, y - size * 0.28, size * 0.42, 0, Math.PI * 2); context.fill();
    context.beginPath(); context.arc(x + size * 0.34, y - size * 0.12, size * 0.34, 0, Math.PI * 2); context.fill();
  }

  private drawSideStream(context: CanvasRenderingContext2D): void {
    context.save();
    context.globalAlpha = 0.32;
    context.strokeStyle = KING_APPROACH.palette.water;
    context.lineWidth = 10;
    context.lineCap = 'round';
    context.beginPath();
    context.moveTo(30, 184); context.bezierCurveTo(65, 250, 26, 340, 67, 430); context.bezierCurveTo(105, 515, 55, 588, 88, 675); context.stroke();
    context.restore();
  }

  private drawBattlefieldHistory(context: CanvasRenderingContext2D): void {
    const palette = KING_APPROACH.palette;
    context.save();
    context.globalAlpha = 0.65;
    context.strokeStyle = '#49382e';
    context.lineWidth = 4;
    context.beginPath(); context.moveTo(237, 382); context.lineTo(282, 402); context.lineTo(254, 425); context.stroke();
    context.beginPath(); context.moveTo(915, 286); context.lineTo(947, 308); context.lineTo(902, 317); context.stroke();
    context.fillStyle = palette.stone;
    context.fillRect(226, 377, 22, 9); context.fillRect(930, 279, 18, 8);
    context.fillStyle = palette.mud;
    context.fillRect(885, 458, 42, 20); context.fillRect(891, 478, 7, 13); context.fillRect(916, 478, 7, 13);
    context.fillStyle = palette.blood;
    for (let index = 0; index < 8; index++) { context.beginPath(); context.arc(320 + index * 7, 520 + (index % 2) * 5, 2, 0, Math.PI * 2); context.fill(); }
    context.restore();
  }

  private drawCity(context: CanvasRenderingContext2D): void {
    const palette = KING_APPROACH.palette;
    context.fillStyle = palette.city;
    context.fillRect(35, 687, 120, 73); context.fillRect(1005, 684, 155, 76); context.fillRect(505, 670, 190, 90);
    context.fillStyle = '#2e393a';
    context.beginPath(); context.moveTo(35, 687); context.lineTo(95, 650); context.lineTo(155, 687); context.fill();
    context.beginPath(); context.moveTo(1005, 684); context.lineTo(1080, 644); context.lineTo(1160, 684); context.fill();
    context.fillStyle = '#242e30';
    context.fillRect(555, 630, 74, 92);
    context.beginPath(); context.moveTo(548, 630); context.lineTo(592, 594); context.lineTo(636, 630); context.fill();
    context.fillStyle = palette.torch;
    context.fillRect(80, 677, 5, 7); context.fillRect(1090, 674, 5, 7); context.fillRect(582, 649, 7, 9); context.fillRect(615, 649, 7, 9);
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
