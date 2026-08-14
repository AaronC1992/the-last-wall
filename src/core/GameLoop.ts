import { TUNING } from './Constants';

export class GameLoop {
  private readonly update: (deltaTime: number, fps: number) => void;
  private previousTime = 0;
  private accumulator = 0;
  private frames = 0;
  private fpsTimer = 0;
  private fps = 60;

  constructor(update: (deltaTime: number, fps: number) => void) {
    this.update = update;
  }

  start(): void {
    requestAnimationFrame((time) => this.frame(time));
  }

  private frame(time: number): void {
    if (this.previousTime === 0) this.previousTime = time;
    const frameTime = Math.min((time - this.previousTime) / 1000, TUNING.maxFrameTime);
    this.previousTime = time;
    this.accumulator += frameTime;
    this.frames++;
    this.fpsTimer += frameTime;
    if (this.fpsTimer >= 0.5) {
      this.fps = this.frames / this.fpsTimer;
      this.frames = 0;
      this.fpsTimer = 0;
    }
    while (this.accumulator >= TUNING.fixedStep) {
      this.update(TUNING.fixedStep, this.fps);
      this.accumulator -= TUNING.fixedStep;
    }
    requestAnimationFrame((nextTime) => this.frame(nextTime));
  }
}
