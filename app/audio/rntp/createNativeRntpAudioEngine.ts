import type {AudioEngine} from '../AudioEngine';
import {RntpAudioEngine} from './RntpAudioEngine';

export const createNativeRntpAudioEngine =
  async (): Promise<AudioEngine> => {
    const {NativeRntpDriver} = await import(
      '../../adapters/audio/NativeRntpDriver'
    );
    return new RntpAudioEngine(new NativeRntpDriver());
  };
