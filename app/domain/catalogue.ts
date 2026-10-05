import type {BookId} from './library';

export type Contributor = {
  id?: string;
  name: string;
};

export type BookIdentifiers = {
  isbn10?: string[];
  isbn13?: string[];
  openLibraryWorkId?: string;
  googleBooksVolumeId?: string;
  gutenbergId?: string;
};

export type BookWork = {
  id: BookId;
  title: string;
  subtitle?: string;
  authors: Contributor[];
  description?: string;
  subjects: string[];
  identifiers: BookIdentifiers;
};

export type EditionId = string;

export type BookEdition = {
  id: EditionId;
  workId: BookId;
  publisher?: string;
  publishedAt?: string;
  language: string;
  isbn10?: string;
  isbn13?: string;
  coverUri?: string;
};

export type AudioChapter = {
  id: string;
  title: string;
  startSec: number;
  durationSec?: number;
};

export type RenditionId = string;

export type RightsStatus =
  | 'public-domain'
  | 'open-license'
  | 'user-owned'
  | 'licensed'
  | 'unknown';

export type RightsInfo = {
  status: RightsStatus;
  license?: string;
  licenseUrl?: string;
  territories?: string[];
  source: string;
  verifiedAt: string;
};

export type AudioRendition = {
  id: RenditionId;
  workId: BookId;
  editionId?: EditionId;
  narrators: Contributor[];
  language: string;
  durationSec?: number;
  chapters: AudioChapter[];
  rights: RightsInfo;
};

export type MediaAssetId = string;

export type HttpsMediaSource = {
  kind: 'https';
  uri: string;
  trustedSourceId?: string;
};

export type LocalMediaSource = {
  kind: 'local';
  uri: string;
};

export type TorrentMediaSource = {
  kind: 'torrent';
  torrentUri?: string;
  magnetUri?: string;
  infoHash?: string;
  fileIndex?: number;
  trustedSourceId?: string;
};

export type MediaSource =
  | HttpsMediaSource
  | LocalMediaSource
  | TorrentMediaSource;

export type MediaFormat = 'mp3' | 'm4b' | 'aac' | 'opus' | 'unknown';

export type MediaAsset = {
  id: MediaAssetId;
  renditionId: RenditionId;
  format: MediaFormat;
  sizeBytes?: number;
  checksum?: string;
  sources: MediaSource[];
};
