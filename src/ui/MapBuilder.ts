import { TerrainCell } from '../map/TerrainTypes';
import type { MapDefinition, MapPoint } from '../map/TerrainTypes';
import { DEFAULT_MAP_CELL_SIZE, DEFAULT_MAP_HEIGHT, DEFAULT_MAP_WIDTH } from '../map/TerrainTypes';
import { TerrainGrid } from '../map/TerrainGrid';
import { validateMap } from '../map/MapValidator';
import { FlowField } from '../map/FlowField';
import { CustomMapStorage } from '../map/CustomMapStorage';

const EDITOR_CELL_SIZE = 14;

export class MapBuilder {
  private readonly root = document.querySelector<HTMLElement>('#map-builder')!;
  private readonly canvas = document.querySelector<HTMLCanvasElement>('#map-builder-canvas')!;
  private readonly context = this.canvas.getContext('2d')!;
  private readonly storage = new CustomMapStorage();
  private readonly history: number[][] = [];
  private historyIndex = -1;
  private terrain = new Uint8Array(DEFAULT_MAP_WIDTH * DEFAULT_MAP_HEIGHT).fill(TerrainCell.Buildable);
  private spawns: MapPoint[] = [];
  private goal: MapPoint = { x: 30, y: 34 };
  private tool: TerrainCell | 'erase' = TerrainCell.Path;
  private brush = 1;
  private painting = false;
  private draft: MapDefinition;

  constructor(private readonly onPlay: (map: MapDefinition) => void) {
    this.draft = this.createDraft();
    this.root.querySelector<HTMLInputElement>('#map-enemy-count')!.max = '200000';
    this.canvas.width = DEFAULT_MAP_WIDTH * EDITOR_CELL_SIZE; this.canvas.height = DEFAULT_MAP_HEIGHT * EDITOR_CELL_SIZE;
    this.terrain[this.goal.y * DEFAULT_MAP_WIDTH + this.goal.x] = TerrainCell.Goal;
    this.root.querySelector<HTMLButtonElement>('#map-builder-close')!.addEventListener('click', () => { this.hide(); document.querySelector<HTMLElement>('#main-menu')!.hidden = false; });
    for (const button of this.root.querySelectorAll<HTMLButtonElement>('[data-tool]')) button.addEventListener('click', () => this.setTool(button.dataset.tool ?? 'path'));
    for (const button of this.root.querySelectorAll<HTMLButtonElement>('[data-brush]')) button.addEventListener('click', () => { this.brush = Number(button.dataset.brush); });
    this.root.querySelector<HTMLButtonElement>('#map-builder-undo')!.addEventListener('click', () => this.restore(this.historyIndex - 1));
    this.root.querySelector<HTMLButtonElement>('#map-builder-redo')!.addEventListener('click', () => this.restore(this.historyIndex + 1));
    this.root.querySelector<HTMLButtonElement>('#map-builder-test-paths')!.addEventListener('click', () => this.testPaths());
    this.root.querySelector<HTMLButtonElement>('#map-builder-configure')!.addEventListener('click', () => {
      const panel = this.root.querySelector<HTMLElement>('#map-builder-config')!;
      panel.hidden = !panel.hidden;
    });
    this.root.querySelector<HTMLButtonElement>('#map-builder-save')!.addEventListener('click', () => this.save());
    this.root.querySelector<HTMLButtonElement>('#map-builder-play')!.addEventListener('click', () => this.play());
    this.root.querySelector<HTMLInputElement>('#map-builder-import')!.addEventListener('change', (event) => this.import((event.target as HTMLInputElement).files?.[0] ?? null));
    this.canvas.addEventListener('pointerdown', (event) => { this.painting = true; this.paint(event); this.canvas.setPointerCapture(event.pointerId); });
    this.canvas.addEventListener('pointermove', (event) => { if (this.painting) this.paint(event); });
    this.canvas.addEventListener('pointerup', () => { this.painting = false; this.commitHistory(); });
    this.canvas.addEventListener('pointerleave', () => { this.painting = false; });
    this.pushHistory(); this.render();
  }

  show(): void { this.root.hidden = false; this.render(); }
  hide(): void { this.root.hidden = true; }

  open(map: MapDefinition): void {
    this.draft = map;
    this.terrain = Uint8Array.from(map.terrain);
    this.spawns = [...map.spawnCells];
    this.goal = map.goalCell;
    document.querySelector<HTMLInputElement>('#map-builder-name')!.value = map.name;
    this.loadBattleSettings(map);
    this.history.length = 0;
    this.historyIndex = -1;
    this.pushHistory();
    this.show();
  }

  private setTool(tool: string): void {
    this.tool = tool === 'erase' ? 'erase' : tool === 'buildable' ? TerrainCell.Buildable : tool === 'blocked' ? TerrainCell.Blocked : tool === 'spawn' ? TerrainCell.Spawn : tool === 'goal' ? TerrainCell.Goal : TerrainCell.Path;
  }

  private paint(event: PointerEvent): void {
    const bounds = this.canvas.getBoundingClientRect();
    const x = Math.floor((event.clientX - bounds.left) / bounds.width * DEFAULT_MAP_WIDTH);
    const y = Math.floor((event.clientY - bounds.top) / bounds.height * DEFAULT_MAP_HEIGHT);
    for (let cellY = y - this.brush; cellY <= y + this.brush; cellY++) for (let cellX = x - this.brush; cellX <= x + this.brush; cellX++) {
      if (cellX < 0 || cellY < 0 || cellX >= DEFAULT_MAP_WIDTH || cellY >= DEFAULT_MAP_HEIGHT) continue;
      const index = cellY * DEFAULT_MAP_WIDTH + cellX;
      if (this.tool === 'erase') {
        this.terrain[index] = TerrainCell.Buildable;
        this.spawns = this.spawns.filter((point) => point.x !== cellX || point.y !== cellY);
      }
      else if (this.tool === TerrainCell.Spawn) { this.terrain[index] = TerrainCell.Spawn; if (!this.spawns.some((point) => point.x === cellX && point.y === cellY)) this.spawns.push({ x: cellX, y: cellY }); }
      else if (this.tool === TerrainCell.Goal) { this.terrain[this.goal.y * DEFAULT_MAP_WIDTH + this.goal.x] = TerrainCell.Buildable; this.terrain[index] = TerrainCell.Goal; this.spawns = this.spawns.filter((point) => point.x !== cellX || point.y !== cellY); this.goal = { x: cellX, y: cellY }; }
      else { this.terrain[index] = this.tool; this.spawns = this.spawns.filter((point) => point.x !== cellX || point.y !== cellY); }
    }
    this.render();
  }

  private commitHistory(): void { this.pushHistory(); }
  private pushHistory(): void { this.history.splice(this.historyIndex + 1); this.history.push(Array.from(this.terrain)); this.historyIndex = this.history.length - 1; }
  private restore(index: number): void { if (index < 0 || index >= this.history.length) return; this.historyIndex = index; this.terrain = Uint8Array.from(this.history[index]); this.render(); }

  private createDraft(): MapDefinition { return { version: 1, id: `custom-${Date.now()}`, name: 'MY VALLEY', width: DEFAULT_MAP_WIDTH, height: DEFAULT_MAP_HEIGHT, cellSize: DEFAULT_MAP_CELL_SIZE, terrain: Array.from(this.terrain), spawnCells: [], goalCell: this.goal, seed: Date.now(), enemySettings: { difficulty: 'normal', enemyCount: 500, variety: 'mixed', spawnBurst: 80, spawnInterval: 0.14 }, custom: true }; }

  private currentMap(): MapDefinition {
    const name = document.querySelector<HTMLInputElement>('#map-builder-name')!.value.trim().slice(0, 40) || 'MY VALLEY';
    const terrain = Array.from(this.terrain);
    terrain[this.goal.y * DEFAULT_MAP_WIDTH + this.goal.x] = TerrainCell.Goal;
    for (const spawn of this.spawns) terrain[spawn.y * DEFAULT_MAP_WIDTH + spawn.x] = TerrainCell.Spawn;
    return { ...this.draft, name, terrain, spawnCells: this.spawns, goalCell: this.goal, enemySettings: this.readBattleSettings() };
  }

  private readBattleSettings(): MapDefinition['enemySettings'] {
    return {
      enemyCount: Math.max(100, Math.min(200000, Number(this.root.querySelector<HTMLInputElement>('#map-enemy-count')!.value) || 500)),
      spawnBurst: Math.max(1, Math.min(400, Number(this.root.querySelector<HTMLInputElement>('#map-spawn-burst')!.value) || 80)),
      spawnInterval: Math.max(0.025, Math.min(1, Number(this.root.querySelector<HTMLInputElement>('#map-spawn-interval')!.value) || 0.14)),
      difficulty: this.root.querySelector<HTMLSelectElement>('#map-difficulty')!.value as MapDefinition['enemySettings']['difficulty'],
      variety: this.root.querySelector<HTMLSelectElement>('#map-variety')!.value as MapDefinition['enemySettings']['variety'],
    };
  }

  private loadBattleSettings(map: MapDefinition): void {
    const settings = map.enemySettings;
    this.root.querySelector<HTMLInputElement>('#map-enemy-count')!.value = String(settings.enemyCount ?? 500);
    this.root.querySelector<HTMLInputElement>('#map-spawn-burst')!.value = String(settings.spawnBurst ?? 80);
    this.root.querySelector<HTMLInputElement>('#map-spawn-interval')!.value = String(settings.spawnInterval ?? 0.14);
    this.root.querySelector<HTMLSelectElement>('#map-difficulty')!.value = settings.difficulty;
    this.root.querySelector<HTMLSelectElement>('#map-variety')!.value = settings.variety;
  }

  private validate(): MapDefinition | null {
    const map = this.currentMap();
    const result = validateMap(map);
    document.querySelector<HTMLElement>('#map-builder-status')!.textContent = result.valid ? 'Map valid' : result.errors.join(' ');
    return result.valid ? map : null;
  }

  private save(): void { const map = this.validate(); if (map) { this.storage.save(map); this.draft = map; } }
  private play(): void { const map = this.validate(); if (map) { this.storage.save(map); this.onPlay(map); this.hide(); } }
  private testPaths(): void { const map = this.validate(); if (!map) return; const grid = new TerrainGrid(map); const field = new FlowField(grid, map.goalCell); const context = this.context; context.save(); context.strokeStyle = '#f2c46d'; context.lineWidth = 1; for (let y = 0; y < DEFAULT_MAP_HEIGHT; y++) for (let x = 0; x < DEFAULT_MAP_WIDTH; x++) { const direction = field.directionAtWorld((x + 0.5) * DEFAULT_MAP_CELL_SIZE, (y + 0.5) * DEFAULT_MAP_CELL_SIZE); const centerX = (x + 0.5) * EDITOR_CELL_SIZE; const centerY = (y + 0.5) * EDITOR_CELL_SIZE; context.beginPath(); context.moveTo(centerX, centerY); context.lineTo(centerX + direction.x * 7, centerY + direction.y * 7); context.stroke(); } context.restore(); }
  private async import(file: File | null): Promise<void> { if (!file) return; const map = await this.storage.import(file); if (!map) { document.querySelector<HTMLElement>('#map-builder-status')!.textContent = 'Import rejected.'; return; } this.draft = map; this.terrain = Uint8Array.from(map.terrain); this.spawns = [...map.spawnCells]; this.goal = map.goalCell; document.querySelector<HTMLInputElement>('#map-builder-name')!.value = map.name; this.loadBattleSettings(map); this.render(); }

  private render(): void {
    const context = this.context; context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (let y = 0; y < DEFAULT_MAP_HEIGHT; y++) for (let x = 0; x < DEFAULT_MAP_WIDTH; x++) { const cell = this.terrain[y * DEFAULT_MAP_WIDTH + x]; context.fillStyle = cell === TerrainCell.Path || cell === TerrainCell.Spawn || cell === TerrainCell.Goal ? '#746552' : cell === TerrainCell.Blocked ? '#3b443b' : '#a0875d'; context.fillRect(x * EDITOR_CELL_SIZE, y * EDITOR_CELL_SIZE, EDITOR_CELL_SIZE, EDITOR_CELL_SIZE); context.strokeStyle = 'rgba(20,20,20,.16)'; context.strokeRect(x * EDITOR_CELL_SIZE, y * EDITOR_CELL_SIZE, EDITOR_CELL_SIZE, EDITOR_CELL_SIZE); }
    context.fillStyle = '#e06458'; for (const spawn of this.spawns) context.fillRect(spawn.x * EDITOR_CELL_SIZE + 3, spawn.y * EDITOR_CELL_SIZE + 3, 8, 8); context.fillStyle = '#77c377'; context.fillRect(this.goal.x * EDITOR_CELL_SIZE + 2, this.goal.y * EDITOR_CELL_SIZE + 2, 10, 10);
  }
}
