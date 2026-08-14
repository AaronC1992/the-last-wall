import { KING_APPROACH } from './MapConfig';
import { SeededRandom } from './SeededRandom';

export class MapSpawnSystem {
  private readonly random = new SeededRandom(KING_APPROACH.seed + 19);
  private readonly burstZones: number[] = [];
  private burstRemaining = 0;

  nextSpawn(): { x: number; y: number; targetX: number } {
    if (this.burstRemaining <= 0) this.beginBurst();
    const zone = KING_APPROACH.spawnZones[this.burstZones[Math.floor(this.random.next() * this.burstZones.length)]];
    this.burstRemaining--;
    return {
      x: zone.x + this.random.range(-zone.width / 2, zone.width / 2),
      y: zone.y + this.random.range(-zone.height / 2, zone.height / 2),
      targetX: zone.targetX + this.random.range(-95, 95),
    };
  }

  reset(): void {
    this.burstZones.length = 0;
    this.burstRemaining = 0;
  }

  private beginBurst(): void {
    this.burstZones.length = 0;
    const zoneCount = 1 + Math.floor(this.random.next() * 3);
    while (this.burstZones.length < zoneCount) {
      const zoneIndex = Math.floor(this.random.next() * KING_APPROACH.spawnZones.length);
      if (!this.burstZones.includes(zoneIndex)) this.burstZones.push(zoneIndex);
    }
    this.burstRemaining = 8 + Math.floor(this.random.next() * 10);
  }
}
