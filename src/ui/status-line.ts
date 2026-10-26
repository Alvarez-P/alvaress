import type { HarnessState, HarnessUI } from '../core/contracts.js';
import { defaultPalette } from './colors.js';
import type { Palette } from './colors.js';

export interface StatusLineOptions {
  stream?: NodeJS.WriteStream;
  palette?: Palette;
  intervalMs?: number;
  animated?: boolean;
}

const STATE_LABEL: Record<HarnessState, string> = {
  Exploring: 'EXPLORING',
  Working: 'WORKING',
  Checking: 'CHECKING',
  Fixing: 'FIXING',
  Ready: 'READY',
  Halted: 'HALTED'
};

const TERMINAL_STATES: HarnessState[] = ['Ready', 'Halted'];

export class StatusLine implements HarnessUI {
  private readonly stream: NodeJS.WriteStream;
  private readonly palette: Palette;
  private readonly intervalMs: number;
  private readonly animated: boolean;
  private timer: NodeJS.Timeout | undefined;
  private state: HarnessState = 'Exploring';
  private dots = 1;
  private active = false;

  constructor(options: StatusLineOptions = {}) {
    this.stream = options.stream ?? process.stdout;
    this.palette = options.palette ?? defaultPalette();
    this.intervalMs = options.intervalMs ?? 350;
    this.animated = options.animated ?? Boolean(this.stream.isTTY);
  }

  start(state: HarnessState = 'Exploring'): void {
    this.active = true;
    this.state = state;
    this.dots = 1;
    this.render();

    if (this.animated && this.timer === undefined) {
      this.timer = setInterval(() => this.tick(), this.intervalMs);
      this.timer.unref?.();
    }
  }

  setState(state: HarnessState): void {
    this.state = state;
    this.dots = 1;
    this.active = true;
    this.render();

    if (TERMINAL_STATES.includes(state)) {
      this.stopAnimation();
    }
  }

  tick(): void {
    this.dots = this.dots >= 3 ? 1 : this.dots + 1;
    this.render();
  }

  stop(): void {
    this.active = false;
    this.stopAnimation();
    if (this.animated) {
      this.clearLine();
    }
  }

  private stopAnimation(): void {
    if (this.timer !== undefined) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  private render(): void {
    if (!this.active) {
      return;
    }

    const label = STATE_LABEL[this.state];
    const painted =
      this.state === 'Halted'
        ? this.palette.warning(`${label}${'.'.repeat(this.dots)}`)
        : this.palette.accent(`${label}${'.'.repeat(this.dots)}`);
    const line = `${this.palette.text('[alvaress]')} ${painted}`;

    if (this.animated) {
      this.clearLine();
      this.stream.write(line);
      return;
    }

    this.stream.write(`${line}\n`);
  }

  private clearLine(): void {
    this.stream.write('\r\x1b[2K');
  }
}
