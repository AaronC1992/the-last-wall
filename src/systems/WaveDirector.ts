import { EnemyType } from '../enemies/EnemyTypes';
import type { EnemyTypeId } from '../enemies/EnemyTypes';

export class WaveDirector {
  private nextBossAt = 70;

  chooseEnemy(elapsed: number): { type: EnemyTypeId; elite: boolean } {
    if (elapsed >= this.nextBossAt) {
      this.nextBossAt += 70;
      return { type: EnemyType.Boss, elite: false };
    }
    const roll = Math.random();
    let type: EnemyTypeId = EnemyType.Grunt;
    if (elapsed > 35 && roll < 0.13) type = EnemyType.Runner;
    else if (elapsed > 70 && roll < 0.20) type = EnemyType.Armored;
    else if (elapsed > 105 && roll < 0.27) type = EnemyType.Brute;
    else if (elapsed > 135 && roll < 0.33) type = EnemyType.Exploder;
    const eliteChance = Math.min(0.14, elapsed / 1500);
    return { type, elite: elapsed > 55 && Math.random() < eliteChance };
  }

  reset(): void {
    this.nextBossAt = 70;
  }
}
