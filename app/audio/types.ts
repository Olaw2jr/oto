import type {BookId} from '../domain';

export type AudioSource = {
  kind: 'remote' | 'local';
  uri: string;
  mimeType?: string;
};

export type AudioTrack = {
  id: string;
  bookId: BookId;
  chapterId: string;
  title: string;
  durationSec?: number;
  source: AudioSource;
};

export type PlaybackState =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'playing'
  | 'paused'
  | 'ended'
  | 'error';

export type PlaybackSnapshot = {
  state: PlaybackState;
  trackId?: string;
  positionSec: number;
  durationSec?: number;
  rate: number;
};

export type LoadOptions = {
  startIndex?: number;
  positionSec?: number;
};

export type PlaybackListener = (snapshot: PlaybackSnapshot) => void;
