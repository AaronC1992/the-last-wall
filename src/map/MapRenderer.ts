import { TUNING } from '../core/Constants';
import { SeededRandom } from './SeededRandom';
import { TerrainCell } from './TerrainTypes';
import type { MapDefinition } from './TerrainTypes';
import { TerrainGrid } from './TerrainGrid';
import type { TowerKind } from '../weapons/TowerConfig';
import type { GraphicsQuality } from '../systems/SaveSystem';

export class MapRenderer {
  private readonly cache: HTMLCanvasElement;
  private readonly cachedContext: CanvasRenderingContext2D;
  private readonly random: SeededRandom;
  private readonly grid: TerrainGrid;

  constructor(private readonly definition: MapDefinition) {
    this.grid = new TerrainGrid(definition);
    this.random = new SeededRandom(definition.seed);
    this.cache = document.createElement('canvas');
    this.cache.width = definition.width * definition.cellSize;
    this.cache.height = definition.height * definition.cellSize;
    this.cachedContext = this.cache.getContext('2d')!;
    this.generateStaticTerrain();
  }

  renderBackground(context: CanvasRenderingContext2D, quality: GraphicsQuality = 'high'): void {
    context.drawImage(this.cache, 0, 0);
    if (quality === 'low') {
      context.fillStyle = 'rgba(5, 8, 10, 0.16)';
      context.fillRect(0, 0, this.cache.width, this.cache.height);
    }
  }

  renderDefenseLine(context: CanvasRenderingContext2D, wallHp: number, wallMaxHp: number, animateTorches = true): void {
    const wallY = this.definition.height * this.definition.cellSize - TUNING.wallHeight;
    const goal = this.grid.cellToWorld(this.definition.goalCell.x, this.definition.goalCell.y);
    const gateX = goal.x;

    this.drawPixelWall(context, wallY, gateX);
    this.drawPixelGate(context, wallY, gateX, animateTorches);
    this.drawPixelHealthBar(context, wallY, wallHp, wallMaxHp);
  }

  private drawPixelWall(context: CanvasRenderingContext2D, wallY: number, gateX: number): void {
    const width = this.definition.width * this.definition.cellSize;
    const wallHeight = TUNING.wallHeight + 10;

    context.fillStyle = 'rgba(15, 12, 10, 0.4)';
    context.fillRect(0, wallY - 14, width, 14);

    context.fillStyle = '#2b241d';
    context.fillRect(0, wallY, width, wallHeight);

    const brickW = 16;
    const brickH = 8;
    const rows = Math.ceil(wallHeight / brickH) + 1;
    const cols = Math.ceil(width / brickW) + 1;

    for (let row = 0; row < rows; row++) {
      const y = wallY + row * brickH;
      const offsetX = (row % 2) * (brickW / 2);
      for (let col = -1; col < cols; col++) {
        const x = col * brickW + offsetX;

        if (x + brickW > gateX - 44 && x < gateX + 44 && y >= wallY - 10) continue;

        const shadeIndex = (col * 3 + row * 7) % 3;
        const bodyColor = shadeIndex === 0 ? '#6c6253' : shadeIndex === 1 ? '#5d5446' : '#797062';
        context.fillStyle = bodyColor;
        context.fillRect(x, y, brickW - 1, brickH - 1);

        context.fillStyle = '#8f8473';
        context.fillRect(x, y, brickW - 1, 1);
        context.fillRect(x, y, 1, brickH - 1);

        context.fillStyle = '#3a3328';
        context.fillRect(x, y + brickH - 2, brickW - 1, 1);
        context.fillRect(x + brickW - 2, y, 1, brickH - 1);
      }
    }

    const merlonW = 14;
    const merlonH = 12;
    const merlonGap = 10;
    const step = merlonW + merlonGap;

    for (let x = 0; x < width; x += step) {
      if (x + merlonW > gateX - 74 && x < gateX + 74) continue;

      const y = wallY - merlonH;

      context.fillStyle = '#6c6253';
      context.fillRect(x, y, merlonW, merlonH);

      context.fillStyle = '#9e9381';
      context.fillRect(x - 1, y, merlonW + 2, 3);

      context.fillStyle = '#b0a492';
      context.fillRect(x, y + 3, 1, merlonH - 3);
      context.fillStyle = '#3a3328';
      context.fillRect(x + merlonW - 1, y + 3, 1, merlonH - 3);
      context.fillRect(x, y + merlonH - 1, merlonW, 1);
    }
  }

  private drawPixelGate(context: CanvasRenderingContext2D, wallY: number, gateX: number, animateTorches: boolean): void {
    const towerW = 44;
    const towerH = 110;
    const towerTopY = wallY - 62;
    const leftTowerX = gateX - 70;
    const rightTowerX = gateX + 26;

    this.drawPixelTower(context, leftTowerX, towerTopY, towerW, towerH);
    this.drawPixelTower(context, rightTowerX, towerTopY, towerW, towerH);

    const bridgeX = gateX - 26;
    const bridgeW = 52;
    const bridgeTopY = wallY - 44;
    const bridgeH = wallY - bridgeTopY + TUNING.wallHeight;

    context.fillStyle = '#5d5446';
    context.fillRect(bridgeX, bridgeTopY, bridgeW, bridgeH);

    for (let ry = bridgeTopY; ry < wallY; ry += 8) {
      const rowOffset = (Math.floor(ry / 8) % 2) * 8;
      for (let rx = bridgeX - 8; rx < bridgeX + bridgeW + 8; rx += 16) {
        const bx = rx + rowOffset;
        if (bx >= bridgeX && bx + 15 <= bridgeX + bridgeW) {
          context.fillStyle = '#6c6253';
          context.fillRect(bx, ry, 15, 7);
          context.fillStyle = '#8f8473';
          context.fillRect(bx, ry, 15, 1);
          context.fillStyle = '#3a3328';
          context.fillRect(bx, ry + 6, 15, 1);
        }
      }
    }

    for (let bx = bridgeX + 3; bx < bridgeX + bridgeW - 8; bx += 16) {
      const my = bridgeTopY - 10;
      context.fillStyle = '#6c6253';
      context.fillRect(bx, my, 12, 10);
      context.fillStyle = '#a09583';
      context.fillRect(bx - 1, my, 14, 2);
      context.fillStyle = '#3a3328';
      context.fillRect(bx + 11, my + 2, 1, 8);
    }

    const archW = 48;
    const archH = 58;
    const archX = gateX - archW / 2;
    const archY = wallY - 18;

    context.fillStyle = '#110e0c';
    context.fillRect(archX, archY, archW, archH);
    context.fillRect(archX + 4, archY - 8, archW - 8, 8);
    context.fillRect(archX + 10, archY - 14, archW - 20, 6);

    const doorW = 20;
    const doorH = 46;
    const leftDoorX = gateX - doorW;
    const rightDoorX = gateX;
    const doorY = archY + 12;

    this.drawPixelDoorPanel(context, leftDoorX, doorY, doorW, doorH, true);
    this.drawPixelDoorPanel(context, rightDoorX, doorY, doorW, doorH, false);

    const portcullisY = archY - 10;
    context.fillStyle = '#4a5763';
    for (let barX = archX + 6; barX <= archX + archW - 6; barX += 6) {
      context.fillRect(barX, portcullisY, 2, 28);
      context.fillStyle = '#899da8';
      context.fillRect(barX - 1, portcullisY + 26, 4, 2);
      context.fillRect(barX, portcullisY + 28, 2, 2);
      context.fillStyle = '#4a5763';
    }
    context.fillRect(archX + 4, portcullisY + 8, archW - 8, 2);
    context.fillRect(archX + 4, portcullisY + 18, archW - 8, 2);

    this.drawPixelArchFrame(context, gateX, archY, archW);

    this.drawPixelTorch(context, leftTowerX + towerW - 4, wallY - 12, animateTorches);
    this.drawPixelTorch(context, rightTowerX + 4, wallY - 12, animateTorches);
    this.drawPixelTorch(context, archX - 10, wallY - 10, animateTorches);
    this.drawPixelTorch(context, archX + archW + 10, wallY - 10, animateTorches);

    this.drawPixelBanner(context, leftTowerX + 16, towerTopY - 26);
    this.drawPixelBanner(context, rightTowerX + 16, towerTopY - 26);
  }

  private drawPixelTower(context: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
    context.fillStyle = '#5d5446';
    context.fillRect(x, y, w, h);

    for (let qy = y; qy < y + h; qy += 12) {
      const toggle = (Math.floor(qy / 12) % 2) === 0;
      const qw1 = toggle ? 8 : 12;
      const qw2 = toggle ? 12 : 8;

      context.fillStyle = '#8f8473';
      context.fillRect(x, qy, qw1, 11);
      context.fillStyle = '#3a3328';
      context.fillRect(x + qw1 - 1, qy, 1, 11);
      context.fillRect(x, qy + 10, qw1, 1);

      context.fillStyle = '#4a4338';
      context.fillRect(x + w - qw2, qy, qw2, 11);
      context.fillStyle = '#2c2720';
      context.fillRect(x + w - qw2, qy + 10, qw2, 1);
    }

    for (let ry = y + 4; ry < y + h - 8; ry += 8) {
      const rowOffset = (Math.floor(ry / 8) % 2) * 8;
      for (let rx = x + 6; rx < x + w - 10; rx += 16) {
        const bx = rx + rowOffset;
        if (bx >= x + 6 && bx + 13 <= x + w - 6) {
          context.fillStyle = '#6c6253';
          context.fillRect(bx, ry, 13, 7);
          context.fillStyle = '#9e9381';
          context.fillRect(bx, ry, 13, 1);
          context.fillStyle = '#3a3328';
          context.fillRect(bx, ry + 6, 13, 1);
        }
      }
    }

    const merlonW = 10;
    const merlonH = 12;
    for (let i = 0; i < 3; i++) {
      const mx = x + i * 14 + 2;
      const my = y - merlonH;

      context.fillStyle = '#6c6253';
      context.fillRect(mx, my, merlonW, merlonH);

      context.fillStyle = '#a89d8b';
      context.fillRect(mx - 1, my, merlonW + 2, 3);

      context.fillStyle = '#3a3328';
      context.fillRect(mx + merlonW - 1, my + 3, 1, merlonH - 3);
    }

    const slitX = x + w / 2 - 2;
    for (const slitY of [y + 24, y + 54]) {
      context.fillStyle = '#12100e';
      context.fillRect(slitX, slitY, 4, 14);
      context.fillStyle = '#9e9381';
      context.fillRect(slitX - 1, slitY - 1, 6, 1);
      context.fillRect(slitX - 1, slitY + 14, 6, 1);
    }
  }

  private drawPixelDoorPanel(context: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, isLeft: boolean): void {
    context.fillStyle = '#4d311b';
    context.fillRect(x, y, w, h);

    context.fillStyle = '#2c190a';
    for (let px = x + 5; px < x + w; px += 5) {
      context.fillRect(px, y, 1, h);
    }
    context.fillStyle = '#6b452b';
    for (let px = x + 1; px < x + w; px += 5) {
      context.fillRect(px, y + 2, 1, h - 4);
    }

    const strapY1 = y + 8;
    const strapY2 = y + h - 14;
    context.fillStyle = '#3a4852';
    context.fillRect(x, strapY1, w, 4);
    context.fillRect(x, strapY2, w, 4);

    context.fillStyle = '#899da8';
    context.fillRect(x, strapY1, w, 1);
    context.fillRect(x, strapY2, w, 1);
    context.fillStyle = '#1f272e';
    context.fillRect(x, strapY1 + 3, w, 1);
    context.fillRect(x, strapY2 + 3, w, 1);

    context.fillStyle = '#b0c4d0';
    for (let sx = x + 2; sx < x + w; sx += 6) {
      context.fillRect(sx, strapY1 + 1, 2, 2);
      context.fillRect(sx, strapY2 + 1, 2, 2);
    }

    const handleX = isLeft ? x + w - 5 : x + 5;
    const handleY = y + Math.floor(h / 2);
    context.fillStyle = '#899da8';
    context.fillRect(handleX - 2, handleY - 2, 5, 2);
    context.fillRect(handleX - 3, handleY, 2, 5);
    context.fillRect(handleX + 2, handleY, 2, 5);
    context.fillRect(handleX - 2, handleY + 4, 5, 2);
  }

  private drawPixelArchFrame(context: CanvasRenderingContext2D, gateX: number, archY: number, archW: number): void {
    const halfW = archW / 2;
    const stones = 9;
    for (let i = 0; i < stones; i++) {
      const angle = Math.PI + (Math.PI * (i + 0.5)) / stones;
      const isKeystone = i === Math.floor(stones / 2);
      const radius = halfW + 4;
      const stoneX = gateX + Math.cos(angle) * radius;
      const stoneY = archY + Math.sin(angle) * (radius * 0.7) + 8;

      context.fillStyle = isKeystone ? '#d1c2a5' : (i % 2 === 0 ? '#8a7e6c' : '#736d5b');
      context.fillRect(stoneX - 4, stoneY - 4, isKeystone ? 10 : 8, isKeystone ? 10 : 8);

      context.fillStyle = '#a89a85';
      context.fillRect(stoneX - 4, stoneY - 4, isKeystone ? 10 : 8, 1);
      context.fillStyle = '#3a3328';
      context.fillRect(stoneX - 4, stoneY + (isKeystone ? 5 : 3), isKeystone ? 10 : 8, 1);
    }
  }

  private drawPixelTorch(context: CanvasRenderingContext2D, x: number, y: number, animated: boolean): void {
    if (!animated) {
      context.fillStyle = '#2c353d';
      context.fillRect(x - 2, y, 5, 8);
      context.fillStyle = '#5c3a21';
      context.fillRect(x - 1, y - 4, 3, 5);
      context.fillStyle = '#d35400';
      context.fillRect(x - 3, y - 11, 7, 8);
      context.fillStyle = '#f1c40f';
      context.fillRect(x - 1, y - 10, 3, 5);
      return;
    }
    const time = performance.now() * 0.008;
    const seed = (x * 17 + y * 31) % 100;
    const t = time + seed;

    const glowRadius = 26 + Math.sin(t * 4) * 4 + Math.cos(t * 9) * 2;
    const glowAlpha = 0.35 + Math.sin(t * 6) * 0.08;
    const glow = context.createRadialGradient(x, y - 4, 2, x, y - 4, Math.max(8, glowRadius));
    glow.addColorStop(0, `rgba(255, 205, 40, ${glowAlpha.toFixed(2)})`);
    glow.addColorStop(0.5, `rgba(230, 110, 20, ${(glowAlpha * 0.45).toFixed(2)})`);
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    context.fillStyle = glow;
    context.beginPath();
    context.arc(x, y - 4, Math.max(8, glowRadius), 0, Math.PI * 2);
    context.fill();

    context.fillStyle = '#2c353d';
    context.fillRect(x - 2, y, 5, 8);
    context.fillRect(x - 4, y + 4, 9, 2);

    context.fillStyle = '#5c3a21';
    context.fillRect(x - 1, y - 4, 3, 5);

    const f1X = Math.sin(t * 7) * 1.5;
    const f1Y = Math.cos(t * 5) * 1.5;
    context.fillStyle = '#d35400';
    context.fillRect(Math.round(x - 3 + f1X), Math.round(y - 11 + f1Y), 7, 8);
    context.fillRect(Math.round(x - 2 + f1X), Math.round(y - 14 + f1Y), 5, 4);

    const f2X = Math.cos(t * 8) * 1.2;
    const f2Y = Math.sin(t * 11) * 1.2;
    context.fillStyle = '#e67e22';
    context.fillRect(Math.round(x - 2 + f2X), Math.round(y - 10 + f2Y), 5, 6);
    context.fillRect(Math.round(x - 1 + f2X), Math.round(y - 15 + f2Y), 3, 6);

    const f3X = Math.sin(t * 12) * 0.8;
    const f3Y = Math.cos(t * 10) * 0.8;
    context.fillStyle = '#f1c40f';
    context.fillRect(Math.round(x - 1 + f3X), Math.round(y - 9 + f3Y), 3, 5);
    context.fillRect(Math.round(x + f3X), Math.round(y - 13 + f3Y), 1, 5);

    context.fillStyle = '#ffffff';
    context.fillRect(Math.round(x + f3X), Math.round(y - 8 + f3Y), 1, 3);

    for (let i = 0; i < 3; i++) {
      const sparkCycle = (t * 0.9 + i * 1.4) % 2.5;
      const sparkY = y - 12 - sparkCycle * 7;
      const sparkX = x + Math.sin(t * 3 + i * 2) * (2 + sparkCycle);
      const sparkAlpha = Math.max(0, 1 - sparkCycle / 2.5);

      context.fillStyle = i % 2 === 0 ? '#ffcc00' : '#ff5722';
      context.globalAlpha = sparkAlpha;
      context.fillRect(Math.round(sparkX), Math.round(sparkY), 2, 2);
    }
    context.globalAlpha = 1.0;
  }

  private drawPixelBanner(context: CanvasRenderingContext2D, poleX: number, poleY: number): void {
    context.fillStyle = '#5c3d23';
    context.fillRect(poleX, poleY, 2, 28);
    context.fillStyle = '#f1c40f';
    context.fillRect(poleX - 1, poleY - 2, 4, 3);

    const bx = poleX + 2;
    const by = poleY + 2;
    const bw = 20;
    const bh = 18;

    context.fillStyle = '#b82e2e';
    context.fillRect(bx, by, bw, bh);

    context.fillStyle = '#851e1e';
    context.fillRect(bx + 6, by, 3, bh);
    context.fillRect(bx + 14, by, 3, bh - 3);

    context.fillStyle = '#f1c40f';
    context.fillRect(bx, by, bw, 1);
    context.fillRect(bx, by, 1, bh);
    context.fillRect(bx, by + bh - 1, bw, 1);
    context.fillRect(bx + bw - 1, by, 1, bh);

    context.fillRect(bx + 9, by + 5, 3, 8);
    context.fillRect(bx + 6, by + 8, 9, 3);

    context.clearRect(bx + 8, by + bh - 4, 4, 4);
  }

  private drawPixelHealthBar(context: CanvasRenderingContext2D, wallY: number, wallHp: number, wallMaxHp: number): void {
    const x = 20;
    const y = wallY - 24;
    const w = 190;
    const h = 14;

    context.fillStyle = '#10161a';
    context.fillRect(x - 2, y - 2, w + 4, h + 4);

    context.fillStyle = '#7a6238';
    context.fillRect(x - 1, y - 1, w + 2, 1);
    context.fillRect(x - 1, y + h, w + 2, 1);
    context.fillRect(x - 1, y - 1, 1, h + 2);
    context.fillRect(x + w, y - 1, 1, h + 2);

    context.fillStyle = '#d4b66e';
    context.fillRect(x - 1, y - 1, 2, 2);
    context.fillRect(x + w - 1, y - 1, 2, 2);
    context.fillRect(x - 1, y + h - 1, 2, 2);
    context.fillRect(x + w - 1, y + h - 1, 2, 2);

    context.fillStyle = '#221214';
    context.fillRect(x, y, w, h);

    const ratio = wallMaxHp > 0 ? Math.max(0, Math.min(1, wallHp / wallMaxHp)) : 0;
    const fillW = Math.floor(ratio * w);

    if (fillW > 0) {
      const isCritical = ratio <= 0.35;
      const mainColor = isCritical ? '#d9383a' : '#3cb85c';
      const shadowColor = isCritical ? '#962325' : '#227840';
      const highlightColor = isCritical ? '#f2797a' : '#72e093';

      context.fillStyle = mainColor;
      context.fillRect(x, y, fillW, h);

      context.fillStyle = highlightColor;
      context.fillRect(x, y, fillW, 2);

      context.fillStyle = shadowColor;
      context.fillRect(x, y + h - 2, fillW, 2);

      context.fillStyle = 'rgba(0, 0, 0, 0.25)';
      for (let segX = x + 16; segX < x + fillW; segX += 16) {
        context.fillRect(segX, y, 1, h);
      }
    }

    context.fillStyle = '#ffffff';
    context.font = 'bold 10px Verdana, sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.shadowColor = '#000000';
    context.shadowBlur = 3;
    context.fillText(`WALL  ${Math.ceil(wallHp)} / ${wallMaxHp}`, x + w / 2, y + h / 2 + 1);
    context.shadowBlur = 0;
  }

  drawTower(context: CanvasRenderingContext2D, kind: TowerKind, x: number, y: number, ghost: boolean, angle: number = -Math.PI / 2, quality: GraphicsQuality = 'high'): void {
    context.save();
    if (ghost) context.globalAlpha = 0.55;

    if (quality === 'low') {
      context.fillStyle = ghost ? 'rgba(220, 230, 235, 0.7)' : this.towerColor(kind);
      context.fillRect(x - 10, y - 10, 20, 20);
      context.restore();
      return;
    }

    this.drawPixelTowerBase(context, kind, x, y);

    context.translate(x, y);
    context.rotate(angle + Math.PI / 2);

    if (kind === 'ballista') this.drawPixelBallista(context);
    else if (kind === 'cannon') this.drawPixelCannon(context);
    else if (kind === 'fireTower') this.drawPixelFireTower(context);
    else if (kind === 'lightningTower') this.drawPixelLightningTower(context);
    else if (kind === 'mortar') this.drawPixelMortar(context);

    context.restore();
  }

  private towerColor(kind: TowerKind): string {
    if (kind === 'ballista') return '#c9b184';
    if (kind === 'cannon') return '#8f9aa4';
    if (kind === 'fireTower') return '#c4713c';
    if (kind === 'lightningTower') return '#6f8fc4';
    return '#8f6f56';
  }

  private drawPixelTowerBase(context: CanvasRenderingContext2D, kind: TowerKind, x: number, y: number): void {
    context.fillStyle = 'rgba(10, 8, 6, 0.45)';
    context.fillRect(x - 22, y - 18, 44, 42);

    context.fillStyle = '#26201b';
    context.fillRect(x - 22, y - 22, 44, 44);

    context.fillStyle = '#595043';
    context.fillRect(x - 20, y - 20, 40, 40);

    context.fillStyle = '#8f8170';
    context.fillRect(x - 20, y - 20, 40, 2);
    context.fillRect(x - 20, y - 20, 2, 40);

    context.fillStyle = '#3a332a';
    context.fillRect(x - 20, y + 18, 40, 2);
    context.fillRect(x + 18, y - 20, 2, 40);

    context.fillStyle = '#d4b66e';
    context.fillRect(x - 18, y - 18, 3, 3);
    context.fillRect(x + 15, y - 18, 3, 3);
    context.fillRect(x - 18, y + 15, 3, 3);
    context.fillRect(x + 15, y + 15, 3, 3);

    context.fillStyle = '#1c2126';
    context.beginPath(); context.arc(x, y, 15, 0, Math.PI * 2); context.fill();
    context.fillStyle = '#3a424a';
    context.beginPath(); context.arc(x, y, 13, 0, Math.PI * 2); context.fill();
    context.fillStyle = '#1a1d21';
    context.beginPath(); context.arc(x, y, 11, 0, Math.PI * 2); context.fill();

    if (kind === 'fireTower') {
      context.fillStyle = '#b45309';
      context.fillRect(x - 14, y - 14, 28, 28);
      context.fillStyle = '#1c1917';
      context.fillRect(x - 12, y - 12, 24, 24);
      context.fillStyle = '#ea580c';
      context.fillRect(x - 8, y - 2, 4, 4);
      context.fillRect(x + 4, y - 2, 4, 4);
      context.fillRect(x - 2, y - 8, 4, 4);
      context.fillRect(x - 2, y + 4, 4, 4);
      context.fillStyle = '#fef08a';
      context.fillRect(x - 7, y - 1, 2, 2);
      context.fillRect(x + 5, y - 1, 2, 2);
    } else if (kind === 'lightningTower') {
      context.fillStyle = '#00d2d3';
      context.fillRect(x - 15, y - 1, 3, 2);
      context.fillRect(x + 12, y - 1, 3, 2);
      context.fillRect(x - 1, y - 15, 2, 3);
      context.fillRect(x - 1, y + 12, 2, 3);
    } else if (kind === 'mortar') {
      context.fillStyle = '#8f9aa4';
      context.fillRect(x - 14, y - 14, 2, 2);
      context.fillRect(x + 12, y - 14, 2, 2);
      context.fillRect(x - 14, y + 12, 2, 2);
      context.fillRect(x + 12, y + 12, 2, 2);
    } else if (kind === 'cannon') {
      context.fillStyle = '#2c3238';
      context.fillRect(x - 19, y - 19, 4, 4);
      context.fillRect(x + 15, y - 19, 4, 4);
      context.fillRect(x - 19, y + 15, 4, 4);
      context.fillRect(x + 15, y + 15, 4, 4);
    }
  }

  private drawPixelBallista(context: CanvasRenderingContext2D): void {
    context.fillStyle = '#3a271b';
    context.fillRect(-4, -26, 8, 36);
    context.fillStyle = '#5c3e29';
    context.fillRect(-3, -26, 3, 34);
    context.fillStyle = '#211710';
    context.fillRect(-1, -26, 2, 34);

    context.fillStyle = '#8c592a';
    context.fillRect(-22, -22, 20, 5);
    context.fillRect(-26, -26, 6, 6);
    context.fillStyle = '#b8753a';
    context.fillRect(-22, -22, 20, 1);
    context.fillStyle = '#d1a74e';
    context.fillRect(-27, -27, 3, 8);

    context.fillStyle = '#8c592a';
    context.fillRect(2, -22, 20, 5);
    context.fillRect(20, -26, 6, 6);
    context.fillStyle = '#b8753a';
    context.fillRect(2, -22, 20, 1);
    context.fillStyle = '#d1a74e';
    context.fillRect(24, -27, 3, 8);

    context.strokeStyle = '#f5d77f';
    context.lineWidth = 1.5;
    context.beginPath();
    context.moveTo(-25, -24);
    context.lineTo(0, -6);
    context.lineTo(25, -24);
    context.stroke();

    context.fillStyle = '#5c3e29';
    context.fillRect(-1, -30, 2, 24);
    context.fillStyle = '#b82e2e';
    context.fillRect(-3, -8, 2, 5);
    context.fillRect(1, -8, 2, 5);
    context.fillStyle = '#d6e0e8';
    context.beginPath();
    context.moveTo(0, -35);
    context.lineTo(-3.5, -28);
    context.lineTo(3.5, -28);
    context.closePath();
    context.fill();
    context.fillStyle = '#ffffff';
    context.fillRect(-1, -33, 2, 2);

    context.fillStyle = '#23282e';
    context.fillRect(-8, 5, 16, 3);
    context.fillStyle = '#d1a74e';
    context.fillRect(-9, 4, 3, 5);
    context.fillRect(6, 4, 3, 5);
  }

  private drawPixelCannon(context: CanvasRenderingContext2D): void {
    context.fillStyle = '#231c17';
    context.fillRect(-16, -10, 4, 18);
    context.fillStyle = '#5c493a';
    context.fillRect(-15, -9, 2, 16);

    context.fillStyle = '#231c17';
    context.fillRect(12, -10, 4, 18);
    context.fillStyle = '#5c493a';
    context.fillRect(13, -9, 2, 16);

    context.fillStyle = '#423325';
    context.fillRect(-12, -14, 24, 22);
    context.fillStyle = '#6b533c';
    context.fillRect(-12, -14, 24, 2);
    context.fillStyle = '#22282e';
    context.fillRect(-12, -14, 3, 22);
    context.fillRect(9, -14, 3, 22);

    context.fillStyle = '#1b1f24';
    context.fillRect(-9, 2, 18, 9);
    context.fillStyle = '#3a434c';
    context.fillRect(-8, 2, 16, 2);

    context.fillStyle = '#2b333a';
    context.fillRect(-8, -30, 16, 32);
    context.fillStyle = '#687782';
    context.fillRect(-6, -30, 3, 32);
    context.fillStyle = '#1b1f24';
    context.fillRect(6, -30, 2, 32);

    context.fillStyle = '#181c20';
    context.fillRect(-9, -16, 18, 4);
    context.fillStyle = '#d4b66e';
    context.fillRect(-9, -14, 18, 1);

    context.fillStyle = '#3c4752';
    context.fillRect(-9.5, -34, 19, 5);
    context.fillStyle = '#7a8994';
    context.fillRect(-9.5, -34, 19, 1);
    context.fillStyle = '#0b0d0f';
    context.fillRect(-6.5, -34, 13, 2);

    context.fillStyle = '#e67e22';
    context.fillRect(-1, 11, 2, 3);
    context.fillStyle = '#f1c40f';
    context.fillRect(-1, 14, 2, 2);
  }

  private drawPixelFireTower(context: CanvasRenderingContext2D): void {
    // Side fuel tanks & pressure canisters
    context.fillStyle = '#1c1917';
    context.fillRect(-15, -10, 5, 20);
    context.fillRect(10, -10, 5, 20);

    context.fillStyle = '#78350f';
    context.fillRect(-14, -9, 3, 18);
    context.fillRect(11, -9, 3, 18);

    context.fillStyle = '#f97316';
    context.fillRect(-13, -6, 1, 12);
    context.fillRect(12, -6, 1, 12);
    context.fillStyle = '#fef08a';
    context.fillRect(-13, -2, 1, 4);
    context.fillRect(12, -2, 1, 4);

    // Fuel conduits connecting tanks to central furnace
    context.fillStyle = '#b45309';
    context.fillRect(-10, -2, 4, 4);
    context.fillRect(6, -2, 4, 4);

    // Main furnace housing
    context.fillStyle = '#18181b';
    context.fillRect(-11, -12, 22, 22);

    context.fillStyle = '#27272a';
    context.fillRect(-10, -11, 20, 20);

    context.fillStyle = '#451a03';
    context.fillRect(-8, -9, 16, 16);

    // Heat vents / grates on the furnace body
    context.fillStyle = '#dc2626';
    context.fillRect(-6, -6, 12, 10);
    context.fillStyle = '#f97316';
    context.fillRect(-5, -5, 10, 8);
    context.fillStyle = '#fef08a';
    context.fillRect(-3, -3, 6, 4);

    context.fillStyle = '#18181b';
    context.fillRect(-6, -3, 12, 1);
    context.fillRect(-6, 1, 12, 1);
    context.fillRect(-1, -6, 2, 10);

    // Forward Flame Ejector / Flared Nozzle Assembly (-Y direction)
    context.fillStyle = '#27272a';
    context.fillRect(-8, -24, 16, 13);

    context.fillStyle = '#78350f';
    context.fillRect(-7, -22, 14, 3);
    context.fillRect(-7, -15, 14, 2);

    context.fillStyle = '#1c1917';
    context.fillRect(-10, -31, 20, 7);

    context.fillStyle = '#92400e';
    context.fillRect(-10, -31, 20, 2);
    context.fillRect(-10, -31, 2, 7);
    context.fillRect(8, -31, 2, 7);

    // Internal Incendiary Chamber & Muzzle Igniter
    context.fillStyle = '#b91c1c';
    context.fillRect(-7, -29, 14, 4);
    context.fillStyle = '#ea580c';
    context.fillRect(-5, -30, 10, 4);
    context.fillStyle = '#facc15';
    context.fillRect(-3, -31, 6, 4);
    context.fillStyle = '#ffffff';
    context.fillRect(-1, -31, 2, 3);

    // Pilot flame embers floating off nozzle
    context.fillStyle = '#f97316';
    context.fillRect(-4, -35, 2, 2);
    context.fillRect(3, -34, 2, 2);
    context.fillStyle = '#fef08a';
    context.fillRect(-1, -37, 2, 2);
  }

  private drawPixelLightningTower(context: CanvasRenderingContext2D): void {
    context.fillStyle = '#1e272e';
    context.fillRect(-12, -4, 24, 12);

    context.fillStyle = '#a84c20';
    context.fillRect(-10, -12, 20, 9);
    context.fillStyle = '#d96e36';
    context.fillRect(-10, -12, 20, 2);
    context.fillRect(-10, -7, 20, 2);

    context.fillStyle = '#1e272e';
    context.fillRect(-8, -16, 16, 4);
    context.fillStyle = '#a84c20';
    context.fillRect(-6, -24, 12, 8);
    context.fillStyle = '#d96e36';
    context.fillRect(-6, -22, 12, 2);

    const glow = context.createRadialGradient(0, -28, 2, 0, -28, 18);
    glow.addColorStop(0, 'rgba(0, 242, 254, 0.5)');
    glow.addColorStop(0.5, 'rgba(79, 172, 254, 0.2)');
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    context.fillStyle = glow;
    context.beginPath(); context.arc(0, -28, 18, 0, Math.PI * 2); context.fill();

    context.fillStyle = '#00d2d3';
    context.beginPath(); context.arc(0, -28, 7, 0, Math.PI * 2); context.fill();

    context.fillStyle = '#ffffff';
    context.beginPath(); context.arc(0, -28, 3, 0, Math.PI * 2); context.fill();

    context.fillStyle = '#8395a7';
    context.fillRect(-1.5, -39, 3, 10);
    context.fillStyle = '#00f2fe';
    context.fillRect(-1, -41, 2, 3);

    context.fillStyle = '#8395a7';
    context.fillRect(-10, -36, 3, 8);
    context.fillStyle = '#00f2fe';
    context.fillRect(-11, -38, 2, 3);

    context.fillStyle = '#8395a7';
    context.fillRect(7, -36, 3, 8);
    context.fillStyle = '#00f2fe';
    context.fillRect(9, -38, 2, 3);

    context.strokeStyle = '#ffffff';
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(-5, -28); context.lineTo(-10, -36);
    context.moveTo(0, -28); context.lineTo(0, -39);
    context.moveTo(5, -28); context.lineTo(8, -36);
    context.stroke();
  }

  private drawPixelMortar(context: CanvasRenderingContext2D): void {
    context.fillStyle = '#1d252c';
    context.fillRect(-14, -10, 28, 20);
    context.fillStyle = '#37434d';
    context.fillRect(-14, -10, 28, 2);
    context.fillRect(-14, 8, 28, 2);
    context.fillStyle = '#8f9aa4';
    context.fillRect(-12, -8, 2, 2);
    context.fillRect(10, -8, 2, 2);
    context.fillRect(-12, 6, 2, 2);
    context.fillRect(10, 6, 2, 2);

    context.fillStyle = '#2c3e50';
    context.fillRect(-11, -12, 22, 16);
    context.fillStyle = '#b8964e';
    context.fillRect(11, -6, 4, 8);
    context.fillRect(13, -8, 2, 12);

    context.fillStyle = '#1f2a36';
    context.fillRect(-10, -2, 20, 10);

    context.fillStyle = '#34495e';
    context.fillRect(-10, -24, 20, 22);
    context.fillStyle = '#7f8c8d';
    context.fillRect(-8, -24, 3, 22);
    context.fillStyle = '#1a252f';
    context.fillRect(-11, -14, 22, 4);
    context.fillStyle = '#d4b66e';
    context.fillRect(-11, -12, 22, 1);

    context.fillStyle = '#22313f';
    context.fillRect(-12, -28, 24, 5);
    context.fillStyle = '#526373';
    context.fillRect(-12, -28, 24, 1);

    context.fillStyle = '#080b0e';
    context.fillRect(-8, -28, 16, 2);
    context.fillStyle = '#7f8c8d';
    context.fillRect(-4, -27, 8, 2);
    context.fillStyle = '#d6e0e8';
    context.fillRect(-2, -27, 4, 1);
  }

  private generateStaticTerrain(): void {
    const context = this.cachedContext;
    context.fillStyle = '#a0875d'; context.fillRect(0, 0, this.cache.width, this.cache.height);
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
}
