export class FeedbackSystem {
  private readonly x = new Float32Array(80);
  private readonly y = new Float32Array(80);
  private readonly value = new Float32Array(80);
  private readonly time = new Float32Array(80);
  private numberIndex = 0;
  private combo = 0;
  private comboTimer = 0;
  private milestone = '';
  private milestoneTime = 0;
  private shake = 0;

  registerKill(x: number, y: number, reward: number, totalKills: number, enabled: boolean): void {
    this.combo++;
    this.comboTimer = 2;
    if (enabled && this.time[this.numberIndex] <= 0) {
      this.x[this.numberIndex] = x;
      this.y[this.numberIndex] = y;
      this.value[this.numberIndex] = reward;
      this.time[this.numberIndex] = 0.65;
      this.numberIndex = (this.numberIndex + 1) % this.time.length;
    }
    if (totalKills === 100 || totalKills === 1000 || totalKills === 5000 || totalKills === 10000 || totalKills === 50000) {
      this.milestone = `${totalKills.toLocaleString()} KILLS`;
      this.milestoneTime = 2.2;
      this.shake = Math.max(this.shake, 6);
    }
  }

  update(deltaTime: number): void {
    for (let index = 0; index < this.time.length; index++) if (this.time[index] > 0) this.time[index] -= deltaTime;
    this.comboTimer -= deltaTime;
    if (this.comboTimer <= 0) this.combo = 0;
    this.milestoneTime = Math.max(0, this.milestoneTime - deltaTime);
    this.shake = Math.max(0, this.shake - deltaTime * 18);
  }

  render(context: CanvasRenderingContext2D, damageNumbers: boolean): void {
    if (damageNumbers) {
      context.fillStyle = '#f2c46d';
      context.font = 'bold 15px Verdana';
      for (let index = 0; index < this.time.length; index++) {
        if (this.time[index] <= 0) continue;
        context.fillText(Math.ceil(this.value[index]).toString(), this.x[index], this.y[index] - (0.65 - this.time[index]) * 35);
      }
    }
    if (this.combo >= 25) {
      context.fillStyle = '#f06c61';
      context.font = 'bold 17px Verdana';
      context.fillText(`MASSACRE x${this.combo}`, 24, 46);
    }
    if (this.milestoneTime > 0) {
      context.fillStyle = '#f2c46d';
      context.font = 'bold 30px Georgia';
      context.fillText(this.milestone, 470, 110);
    }
  }

  triggerShake(amount: number): void { this.shake = Math.max(this.shake, amount); }
  get shakeAmount(): number { return this.shake; }
  get currentCombo(): number { return this.combo; }
  reset(): void { this.time.fill(0); this.combo = 0; this.comboTimer = 0; this.milestoneTime = 0; this.shake = 0; }
}
