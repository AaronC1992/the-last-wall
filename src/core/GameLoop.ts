import { TUNING } from './Constants';

export class GameLoop {
  private readonly simulate: (deltaTime: number) => void;
  private readonly render: (fps: number) => void;
  private previousTime = 0;
  private accumulator = 0;
  private frames = 0;
  private fpsTimer = 0;
  private fps = 60;

  constructor(simulate: (deltaTime: number) => void, render: (fps: number) => void) {
    this.simulate = simulate;
    this.render = render;
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
      this.simulate(TUNING.fixedStep);
      this.accumulator -= TUNING.fixedStep;
    }
    this.render(this.fps);
    requestAnimationFrame((nextTime) => this.frame(nextTime));
  }
}
