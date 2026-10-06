import type {AudioEngine} from '../AudioEngine';
import type {PlaybackControlConfiguration} from '../types';

const DEFAULTS: PlaybackControlConfiguration = {
  backwardSec: 15,
  forwardSec: 30,
};

const validate = (
  configuration: PlaybackControlConfiguration,
): PlaybackControlConfiguration => {
  if (
    !Number.isFinite(configuration.backwardSec) ||
    !Number.isFinite(configuration.forwardSec) ||
    configuration.backwardSec <= 0 ||
    configuration.forwardSec <= 0
  ) {
    throw new Error('Skip intervals must be positive finite seconds');
  }
  return {...configuration};
};

export class PlaybackControlService {
  private configuration: PlaybackControlConfiguration;

  constructor(
    private readonly engine: AudioEngine,
    configuration: PlaybackControlConfiguration = DEFAULTS,
  ) {
    this.configuration = validate(configuration);
  }

  async initialize(): Promise<void> {
    await this.engine.configureControls(this.configuration);
  }

  async setSkipIntervals(
    configuration: PlaybackControlConfiguration,
  ): Promise<void> {
    this.configuration = validate(configuration);
    await this.engine.configureControls(this.configuration);
  }

  async skipBackward(): Promise<void> {
    await this.engine.skipBy(-this.configuration.backwardSec);
  }

  async skipForward(): Promise<void> {
    await this.engine.skipBy(this.configuration.forwardSec);
  }

  async seekTo(positionSec: number): Promise<void> {
    await this.engine.seekTo(positionSec);
  }

  async setRate(rate: number): Promise<void> {
    await this.engine.setRate(rate);
  }

  async play(): Promise<void> {
    await this.engine.play();
  }

  async pause(): Promise<void> {
    await this.engine.pause();
  }

  getSkipIntervals(): PlaybackControlConfiguration {
    return {...this.configuration};
  }
}
