import {NativeModules} from 'react-native';

import type {SleepTimerState} from '../../../audio/sleep/types';
import type {PlayerSleepTimerController} from '../../../player/PlayerController';

export interface Media3SleepTimerBridge {
  setSleepTimerMinutes(minutes: number): Promise<void>;
  setSleepTimerEndOfChapter(trackIndex: number): Promise<void>;
  clearSleepTimer(): Promise<void>;
  getSleepTimerState(): Promise<SleepTimerState | null>;
}

const nativeBridge =
  NativeModules.OtoMedia3 as Media3SleepTimerBridge;

export class Media3SleepTimerController
  implements PlayerSleepTimerController
{
  constructor(
    private readonly bridge: Media3SleepTimerBridge = nativeBridge,
  ) {}

  setMinutes(minutes: number): Promise<void> {
    if (!Number.isFinite(minutes) || minutes <= 0) {
      return Promise.reject(
        new Error('Sleep timer minutes must be positive finite minutes'),
      );
    }
    return this.bridge.setSleepTimerMinutes(minutes);
  }

  setEndOfChapter(trackIndex: number): Promise<void> {
    if (!Number.isInteger(trackIndex) || trackIndex < 0) {
      return Promise.reject(
        new Error('Sleep timer chapter index must be non-negative'),
      );
    }
    return this.bridge.setSleepTimerEndOfChapter(trackIndex);
  }

  clear(): Promise<void> {
    return this.bridge.clearSleepTimer();
  }

  getState(): Promise<SleepTimerState | null> {
    return this.bridge.getSleepTimerState();
  }
}
