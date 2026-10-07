import type {AudioEngine} from '../../../audio/AudioEngine';
import {RntpAudioEngine} from '../../../audio/rntp/RntpAudioEngine';
import {Media3Driver} from './Media3Driver';

export const createNativeMedia3AudioEngine =
  async (): Promise<AudioEngine> =>
    new RntpAudioEngine(new Media3Driver());
