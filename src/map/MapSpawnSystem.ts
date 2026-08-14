import { KING_APPROACH } from './MapConfig';
import { SeededRandom } from './SeededRandom';

export class MapSpawnSystem {
  private readonly random = new SeededRandom(KING_APPROACH.seed + 19);

  nextSpawn(): { x: number; targetX: number } {
    const zone = KING_APPROACH.spawnZones[Math.floor(this.random.next() * KING_APPROACH.spawnZones.length)];
    return { x: zone.x + this.random.range(-zone.width / 2, zone.width / 2), targetX: zone.targetX + this.random.range(-95, 95) };
  }
}
