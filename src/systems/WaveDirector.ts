import { EnemyType } from '../enemies/EnemyTypes';
import type { EnemyTypeId } from '../enemies/EnemyTypes';
import type { MapEnemySettings } from '../map/TerrainTypes';

export class WaveDirector {
  private readonly queueType = new Uint8Array(200000);
  private readonly queueElite = new Uint8Array(200000);
  private queueHead = 0;
  private queueTail = 0;
  private spawnTimer = 0;
  private announcementTimer = 0;
  private announcementText = '';
  private wave = 0;
  private waveBudget = 0;
  private mapSettings: MapEnemySettings | null = null;

  update(deltaTime: number, _activeEnemies: number, spawn: (type: EnemyTypeId, elite: boolean) => void): void {
    this.announcementTimer = Math.max(0, this.announcementTimer - deltaTime);
    this.spawnTimer -= deltaTime;
    if (this.spawnTimer > 0) return;
    const burst = Math.min(this.queueTail - this.queueHead, Math.min(this.mapSettings?.spawnBurst ?? 400, 60 + this.wave * 10));
    for (let index = 0; index < burst; index++) {
      spawn(this.queueType[this.queueHead] as EnemyTypeId, this.queueElite[this.queueHead] !== 0);
      this.queueHead++;
    }
    this.spawnTimer = Math.max(0.025, (this.mapSettings?.spawnInterval ?? 0.14) - this.wave * 0.003);
  }

  reset(): void {
    this.queueHead = 0;
    this.queueTail = 0;
    this.spawnTimer = 0;
    this.wave = 0;
    this.waveBudget = 0;
    this.announcementTimer = 0;
    this.announcementText = '';
    this.mapSettings = null;
  }

  get currentWave(): number {
    return this.wave;
  }

  get currentBudget(): number {
    return this.waveBudget;
  }

  get announcement(): string {
    return this.announcementTimer > 0 ? this.announcementText : '';
  }

  startWave(enemyCount?: number, mapSettings?: MapEnemySettings): void {
    this.mapSettings = mapSettings ?? null;
    this.beginWave(enemyCount);
  }

  isWaveCleared(activeEnemies: number): boolean {
    return this.wave > 0 && this.queueHead >= this.queueTail && activeEnemies === 0;
  }

  get remainingInQueue(): number {
    return Math.max(0, this.queueTail - this.queueHead);
  }

  private beginWave(enemyCount?: number): void {
    this.wave++;
    this.waveBudget = Math.min(5200, Math.floor(40 + 17 * Math.pow(this.wave, 1.5)));
    this.queueHead = 0;
    this.queueTail = 0;
    const style = this.wave % 10;
    this.announcementText = 'THE HORDE IS COMING';
    if (style === 2) this.announcementText = 'SWARM INCOMING';
    if (style === 4) this.announcementText = 'RUSH INCOMING';
    if (style === 6) this.announcementText = 'ARMORED ASSAULT';
    if (style === 7) this.announcementText = 'EXPLOSIVE WAVE';
    if (style === 8) this.announcementText = 'ELITE HUNT';
    if (style === 0) this.announcementText = 'BOSS APPROACHING';
    this.announcementTimer = 2.5;
    let budget = this.waveBudget;
    if (enemyCount !== undefined) {
      const count = Math.min(this.queueType.length, Math.max(1, Math.floor(enemyCount)));
      for (let index = 0; index < count; index++) {
        const next = this.pickEnemy(style, Math.max(8, budget));
        this.enqueue(next.type, next.elite);
        budget = Math.max(0, budget - next.cost);
      }
      return;
    }
    if (style === 0) {
      this.enqueue(EnemyType.Boss, false);
      budget = Math.max(0, budget - 90);
    }
    while (budget > 0 && this.queueTail < this.queueType.length) {
      const next = this.pickEnemy(style, budget);
      this.enqueue(next.type, next.elite);
      budget -= next.cost;
    }
  }

  private pickEnemy(style: number, budget: number): { type: EnemyTypeId; elite: boolean; cost: number } {
    const eliteChance = this.mapSettings?.variety === 'basic' ? 0 : this.mapSettings?.variety === 'elite' ? 0.35 : 0.08;
    const elite = this.mapSettings?.difficulty === 'easy' ? false : style === 8 ? Math.random() < Math.max(0.28, eliteChance) : this.wave > 8 && Math.random() < Math.min(0.2, eliteChance + this.wave * 0.004);
    if (this.mapSettings?.variety === 'basic') return { type: style === 4 ? EnemyType.Runner : EnemyType.Grunt, elite: false, cost: style === 4 ? 2 : 1 };
    if (style === 2) return { type: EnemyType.Grunt, elite: false, cost: 1 };
    if (style === 4) return { type: EnemyType.Runner, elite, cost: 2 };
    if (style === 6 && budget >= 5) return Math.random() < 0.72 ? { type: EnemyType.Armored, elite, cost: 5 } : { type: EnemyType.Brute, elite, cost: 8 };
    if (style === 7 && budget >= 7) return { type: EnemyType.Exploder, elite, cost: 7 };
    const roll = Math.random();
    if (this.wave > 12 && budget >= 8 && roll < 0.09) return { type: EnemyType.Brute, elite, cost: 8 };
    if (this.wave > 7 && budget >= 7 && roll < 0.18) return { type: EnemyType.Exploder, elite, cost: 7 };
    if (this.wave > 5 && budget >= 5 && roll < 0.29) return { type: EnemyType.Armored, elite, cost: 5 };
    if (this.wave > 2 && budget >= 2 && roll < 0.45) return { type: EnemyType.Runner, elite, cost: 2 };
    return { type: EnemyType.Grunt, elite, cost: 1 };
  }

  private enqueue(type: EnemyTypeId, elite: boolean): void {
    this.queueType[this.queueTail] = type;
    this.queueElite[this.queueTail] = elite ? 1 : 0;
    this.queueTail++;
  }
}
