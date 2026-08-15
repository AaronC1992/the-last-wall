import type { MapDefinition } from './TerrainTypes';
import { validateMap } from './MapValidator';

const STORAGE_KEY = 'the-last-wall-custom-maps';

export class CustomMapStorage {
  list(): MapDefinition[] {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as MapDefinition[];
      return parsed.filter((map) => validateMap(map).valid);
    } catch {
      return [];
    }
  }

  save(map: MapDefinition): boolean {
    if (!validateMap(map).valid) return false;
    const maps = this.list().filter((entry) => entry.id !== map.id);
    const now = new Date().toISOString();
    maps.push({ ...map, terrain: Array.from(map.terrain), custom: true, createdDate: map.createdDate ?? now, modifiedDate: now });
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(maps)); return true; } catch { return false; }
  }

  delete(id: string): void {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.list().filter((map) => map.id !== id))); } catch { /* optional storage */ }
  }

  export(map: MapDefinition): void {
    const blob = new Blob([JSON.stringify(map, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${map.id}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async import(file: File): Promise<MapDefinition | null> {
    try {
      const parsed = JSON.parse(await file.text()) as MapDefinition;
      return validateMap(parsed).valid ? { ...parsed, custom: true } : null;
    } catch { return null; }
  }
}
