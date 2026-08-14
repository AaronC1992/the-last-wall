import { EnemyType } from '../enemies/EnemyTypes';
import type { EnemyTypeId } from '../enemies/EnemyTypes';

export class WaveDirector {
  private readonly queueType = new Uint8Array(12000);
  private readonly queueElite = new Uint8Array(12000);
  private queueHead = 0;
  private queueTail = 0;
  private spawnTimer = 0;
  private announcementTimer = 0;
  private announcementText = '';
  private wave = 0;
  private waveBudget = 0;

  update(deltaTime: number, activeEnemies: number, spawn: (type: EnemyTypeId, elite: boolean) => void): void {
    this.announcementTimer = Math.max(0, this.announcementTimer - deltaTime);
    if (this.queueHead >= this.queueTail && activeEnemies <= Math.max(8, this.wave * 4)) this.beginWave();
    this.spawnTimer -= deltaTime;
    if (this.spawnTimer > 0) return;
    const burst = Math.min(this.queueTail - this.queueHead, Math.min(70, 8 + this.wave * 3));
    for (let index = 0; index < burst; index++) {
      spawn(this.queueType[this.queueHead] as EnemyTypeId, this.queueElite[this.queueHead] !== 0);
      this.queueHead++;
    }
    this.spawnTimer = Math.max(0.045, 0.22 - this.wave * 0.004);
  }

  reset(): void {
    this.queueHead = 0;
    this.queueTail = 0;
    this.spawnTimer = 0;
    this.wave = 0;
    this.waveBudget = 0;
    this.announcementTimer = 0;
    this.announcementText = '';
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

  private beginWave(): void {
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
    const elite = style === 8 ? Math.random() < 0.28 : this.wave > 8 && Math.random() < Math.min(0.12, this.wave * 0.004);
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
