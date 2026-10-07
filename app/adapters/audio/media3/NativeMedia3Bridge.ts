import {
  NativeEventEmitter,
  NativeModules,
} from 'react-native';

export type Media3Snapshot = {
  state: string;
  trackId?: string;
  positionSec: number;
  durationSec: number;
  rate: number;
  activeIndex: number;
};

export interface Media3Bridge {
  setup(): Promise<void>;
  reset(): Promise<void>;
  setQueue(tracks: unknown[]): Promise<void>;
  skip(index: number, positionSec: number): Promise<void>;
  play(): Promise<void>;
  pause(): Promise<void>;
  seekTo(positionSec: number): Promise<void>;
  seekBy(deltaSec: number): Promise<void>;
  setRate(rate: number): Promise<void>;
  getSnapshot(): Promise<Media3Snapshot>;
  updateOptions(options: unknown): Promise<void>;
  warmCache(
    uri: string,
    cacheKey: string,
    bufferSec: number,
  ): Promise<void>;
  evictCache(cacheKey: string): Promise<void>;
}

export const nativeMedia3Bridge =
  NativeModules.OtoMedia3 as Media3Bridge;

export const subscribeToNativeMedia3 = (
  listener: () => void,
): (() => void) => {
  const emitter = new NativeEventEmitter(
    NativeModules.OtoMedia3,
  );
  const subscription = emitter.addListener(
    'oto-media3-playback',
    listener,
  );
  return () => subscription.remove();
};
