import type {AudioTrack} from '../types';

export type PreloadHandle = {
  trackId: string;
  release(): Promise<void>;
};

export interface AudioPreloadBackend {
  preload(
    track: AudioTrack,
    bufferSec: number,
  ): Promise<PreloadHandle>;
}

export type ChapterPreloadPolicy = {
  currentBufferSec: number;
  nextBufferSec: number;
  chaptersAhead: number;
};
