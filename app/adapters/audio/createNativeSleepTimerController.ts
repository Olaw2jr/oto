import TrackPlayer from 'react-native-track-player';

import {SleepTimerController} from '../../audio/sleep/SleepTimerController';
import {AsyncStorageSleepTimerStore} from './AsyncStorageSleepTimerStore';

export class NativeSleepTimerController extends SleepTimerController {
  async setEndOfCurrentChapter(): Promise<void> {
    const index = await TrackPlayer.getActiveTrackIndex();
    if (index === undefined) {
      throw new Error('Cannot arm chapter sleep timer without an active track');
    }
    await this.setEndOfChapter(index);
  }
}

export const createNativeSleepTimerController =
  (): NativeSleepTimerController =>
    new NativeSleepTimerController(
      new AsyncStorageSleepTimerStore('oto.audio.sleepTimer'),
    );
