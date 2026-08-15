import { TerrainCell, isWalkable } from './TerrainTypes';
import type { MapDefinition } from './TerrainTypes';
import { TerrainGrid } from './TerrainGrid';
import { FlowField } from './FlowField';

export interface MapValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateMap(definition: MapDefinition): MapValidationResult {
  const errors: string[] = [];
  if (definition.version !== 1) errors.push('Unsupported map version.');
  if (!Number.isInteger(definition.width) || !Number.isInteger(definition.height) || definition.width < 10 || definition.height < 10) errors.push('Map dimensions are invalid.');
  if (definition.terrain.length !== definition.width * definition.height) errors.push('Terrain data does not match map dimensions.');
  if (definition.spawnCells.length < 1) errors.push('Your map needs a Spawn.');
  if (!definition.goalCell || !Number.isInteger(definition.goalCell.x) || !Number.isInteger(definition.goalCell.y)) errors.push('Your map needs a Gate.');
  if (errors.length > 0) return { valid: false, errors };
  const grid = new TerrainGrid(definition);
  for (let index = 0; index < grid.cells.length; index++) if (grid.cells[index] > TerrainCell.Goal) errors.push('Terrain contains an invalid cell type.');
  const goal = grid.get(definition.goalCell.x, definition.goalCell.y);
  if (goal !== TerrainCell.Goal && !isWalkable(goal)) errors.push('The Gate must be on a valley cell.');
  const field = new FlowField(grid, definition.goalCell);
  for (let index = 0; index < definition.spawnCells.length; index++) {
    const spawn = definition.spawnCells[index];
    const cell = grid.get(spawn.x, spawn.y);
    if (cell !== TerrainCell.Spawn && cell !== TerrainCell.Path) errors.push(`Spawn ${index + 1} must be on a valley cell.`);
    if (grid.inBounds(spawn.x, spawn.y) && field.costs[grid.index(spawn.x, spawn.y)] < 0) errors.push(`Spawn ${index + 1} cannot reach the Gate.`);
  }
  const buildable = grid.cells.reduce((count, cell) => count + (cell === TerrainCell.Buildable ? 1 : 0), 0);
  if (buildable < 20) errors.push('Your map needs more Buildable high ground.');
  return { valid: errors.length === 0, errors };
}
