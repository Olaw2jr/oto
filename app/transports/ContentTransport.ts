import type {MediaSource} from '../domain';

export type PrepareContext = {
  durationSec?: number;
  positionSec?: number;
  lookBehindSec?: number;
  bufferAheadSec?: number;
};

export type PlaybackControl = {
  seek(positionSec: number): Promise<void>;
  recover(): Promise<string>;
};

export type PlayableSource = {
  uri: string;
  transport: MediaSource['kind'];
  control?: PlaybackControl;
  cleanup?: () => Promise<void>;
};

export type DownloadDestination = {
  uri: string;
};

export type DownloadedSource = {
  uri: string;
  sizeBytes?: number;
};

export interface DownloadHandle {
  readonly id: string;
  wait(): Promise<DownloadedSource>;
  cancel(): Promise<void>;
}

export interface ContentTransport {
  readonly kind: MediaSource['kind'];
  canHandle(source: MediaSource): boolean;
  prepare(
    source: MediaSource,
    context?: PrepareContext,
  ): Promise<PlayableSource>;
  download?(
    source: MediaSource,
    destination: DownloadDestination,
  ): Promise<DownloadHandle>;
}
