import { TUNING } from '../core/Constants';
import { SeededRandom } from './SeededRandom';
import { KING_APPROACH } from './MapConfig';
import type { WeaponManager } from '../weapons/WeaponManager';

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

  renderDefenseLine(context: CanvasRenderingContext2D, weapons: WeaponManager, wallHp: number, wallMaxHp: number): void {
    const palette = KING_APPROACH.palette;
    const wallY = TUNING.logicalHeight - TUNING.wallHeight;
    this.renderTowerPad(context, KING_APPROACH.towerPads.ballista.x, KING_APPROACH.towerPads.ballista.y, '#9c7654', true);
    this.renderTowerPad(context, KING_APPROACH.towerPads.cannon.x, KING_APPROACH.towerPads.cannon.y, '#8a97a5', weapons.isBuilt('cannon'));
    this.renderTowerPad(context, KING_APPROACH.towerPads.fireTower.x, KING_APPROACH.towerPads.fireTower.y, '#e16b45', weapons.isBuilt('fireTower'));
    this.renderTowerPad(context, KING_APPROACH.towerPads.lightning.x, KING_APPROACH.towerPads.lightning.y, '#79b8e8', weapons.isBuilt('lightningTower'));

    context.fillStyle = palette.wallDark;
    context.fillRect(0, wallY, TUNING.logicalWidth, TUNING.wallHeight);
    context.fillStyle = palette.wall;
    context.fillRect(0, wallY + 7, TUNING.logicalWidth, 43);
    context.fillStyle = palette.wallDark;
    for (let x = 0; x < TUNING.logicalWidth; x += 42) {
      context.fillRect(x + 4, wallY, 24, 10);
      context.fillRect(x + 3, wallY + 24, 34, 2);
    }
    context.fillStyle = '#3d3027';
    context.fillRect(535, wallY + 17, 130, 33);
    context.fillStyle = '#1e272b';
    context.fillRect(554, wallY + 21, 92, 29);
    context.fillStyle = palette.banner;
    context.fillRect(595, wallY - 34, 4, 34);
    context.fillRect(599, wallY - 33, 25, 13);

    const healthWidth = Math.max(0, wallHp / wallMaxHp * 180);
    context.fillStyle = '#242b28'; context.fillRect(20, wallY - 21, 180, 10);
    context.fillStyle = wallHp > wallMaxHp * 0.35 ? '#77c377' : '#e06458'; context.fillRect(20, wallY - 21, healthWidth, 10);
  }

  private generateStaticTerrain(): void {
    const context = this.cachedContext;
    const palette = KING_APPROACH.palette;
    context.fillStyle = palette.grass; context.fillRect(0, 0, TUNING.logicalWidth, TUNING.logicalHeight);
    for (let index = 0; index < 950; index++) {
      context.fillStyle = this.random.next() > 0.55 ? palette.grassLight : palette.dryGrass;
      context.globalAlpha = 0.18;
      context.fillRect(this.random.range(30, 1170), this.random.range(85, 650), this.random.range(1, 4), this.random.range(1, 4));
    }
    context.globalAlpha = 1;
    this.drawRoad(context, 600, 45, 600, 690, 105);
    this.drawRoad(context, 170, 95, 390, 690, 56);
    this.drawRoad(context, 1025, 95, 810, 690, 56);
    this.drawForestEdges(context);
    this.drawDebris(context);
    this.drawCity(context);
  }

  private drawRoad(context: CanvasRenderingContext2D, startX: number, startY: number, endX: number, endY: number, width: number): void {
    context.strokeStyle = KING_APPROACH.palette.dirtEdge; context.lineWidth = width + 12; context.lineCap = 'round';
    context.beginPath(); context.moveTo(startX, startY); context.bezierCurveTo(startX + (endX - startX) * 0.1, 260, endX + (startX - endX) * 0.13, 480, endX, endY); context.stroke();
    context.strokeStyle = KING_APPROACH.palette.dirt; context.lineWidth = width;
    context.beginPath(); context.moveTo(startX, startY); context.bezierCurveTo(startX + (endX - startX) * 0.1, 260, endX + (startX - endX) * 0.13, 480, endX, endY); context.stroke();
  }

  private drawForestEdges(context: CanvasRenderingContext2D): void {
    for (let index = 0; index < 78; index++) {
      const side = index % 2 === 0 ? this.random.range(10, 185) : this.random.range(1015, 1190);
      const y = this.random.range(35, 630); const size = this.random.range(10, 24);
      context.fillStyle = 'rgba(28, 44, 31, .35)'; context.beginPath(); context.arc(side + 4, y + 5, size, 0, Math.PI * 2); context.fill();
      context.fillStyle = KING_APPROACH.palette.forest; context.beginPath(); context.arc(side, y, size, 0, Math.PI * 2); context.fill();
      context.fillStyle = '#36513a'; context.beginPath(); context.arc(side - size * .32, y - size * .28, size * .55, 0, Math.PI * 2); context.fill();
    }
  }

  private drawDebris(context: CanvasRenderingContext2D): void {
    for (let index = 0; index < 44; index++) {
      const x = this.random.range(205, 995); const y = this.random.range(145, 610);
      context.fillStyle = index % 3 === 0 ? KING_APPROACH.palette.stone : KING_APPROACH.palette.mud;
      context.fillRect(x, y, this.random.range(3, 10), this.random.range(2, 6));
    }
    context.strokeStyle = '#6c5140'; context.lineWidth = 3; context.beginPath(); context.moveTo(260, 420); context.lineTo(285, 432); context.lineTo(268, 445); context.stroke();
    context.fillStyle = '#5b4633'; context.fillRect(890, 275, 31, 16); context.fillStyle = '#3d3027'; context.fillRect(895, 291, 7, 7); context.fillRect(912, 291, 7, 7);
  }

  private drawCity(context: CanvasRenderingContext2D): void {
    context.fillStyle = KING_APPROACH.palette.city;
    context.fillRect(40, 711, 95, 30); context.fillRect(1010, 711, 110, 30); context.fillRect(930, 692, 35, 48);
    context.fillStyle = '#2e393a'; context.beginPath(); context.moveTo(40, 711); context.lineTo(87, 681); context.lineTo(135, 711); context.fill(); context.beginPath(); context.moveTo(1010, 711); context.lineTo(1065, 676); context.lineTo(1120, 711); context.fill();
    context.fillStyle = KING_APPROACH.palette.torch; context.fillRect(76, 701, 4, 5); context.fillRect(1110, 701, 4, 5);
  }

  private renderTowerPad(context: CanvasRenderingContext2D, x: number, y: number, color: string, built: boolean): void {
    context.fillStyle = '#5c5a50'; context.beginPath(); context.arc(x, y, 23, 0, Math.PI * 2); context.fill();
    context.fillStyle = '#777267'; context.beginPath(); context.arc(x, y, 17, 0, Math.PI * 2); context.fill();
    if (!built) return;
    context.fillStyle = color; context.fillRect(x - 12, y - 21, 24, 24);
    context.fillStyle = '#d8b479'; context.fillRect(x - 3, y - 41, 6, 25);
  }
}
