import type {BookIdentifiers, MediaFormat, RightsInfo} from '../../../app/domain';

export type ProviderId = string;

export type ExternalBookRef = {
  providerId: ProviderId;
  externalId: string;
};

export type BookSearchQuery = {
  text: string;
  language?: string;
  limit?: number;
};

export type Provenanced<T> = {
  value: T;
  providerId: ProviderId;
  externalId?: string;
  fetchedAt: string;
};

export type ProviderBookCandidate = {
  ref: ExternalBookRef;
  title: string;
  authors: string[];
  identifiers: BookIdentifiers;
  score?: number;
};

export type ProviderBookRecord = {
  ref: ExternalBookRef;
  title: Provenanced<string>;
  subtitle?: Provenanced<string>;
  authors: Provenanced<string[]>;
  description?: Provenanced<string>;
  subjects: Provenanced<string[]>;
  identifiers: BookIdentifiers;
  publishedAt?: Provenanced<string>;
  publisher?: Provenanced<string>;
  language?: Provenanced<string>;
  coverUri?: Provenanced<string>;
};

export type CanonicalBookHint = {
  title: string;
  authors: string[];
  identifiers: BookIdentifiers;
};

export type ProviderChapter = {
  id: string;
  title: string;
  startSec: number;
  durationSec?: number;
};

export type ProviderAudioRendition = {
  ref: ExternalBookRef;
  assetRefs?: ExternalBookRef[];
  workHint: CanonicalBookHint;
  narrators: string[];
  language: string;
  durationSec?: number;
  chapters: ProviderChapter[];
  rights: RightsInfo;
};

type TrustedSource = {trustedSourceId?: string};

export type ProviderAssetSource =
  | ({kind: 'https'; uri: string} & TrustedSource)
  | ({
      kind: 'torrent';
      torrentUri?: string;
      magnetUri?: string;
      infoHash?: string;
      fileIndex?: number;
      filePath?: string;
    } & TrustedSource);

export type ProviderAssetManifest = {
  ref: ExternalBookRef;
  renditionRef: ExternalBookRef;
  format: MediaFormat;
  sizeBytes?: number;
  checksum?: string;
  sources: ProviderAssetSource[];
  rights: RightsInfo;
};

export interface MetadataProvider {
  readonly id: ProviderId;
  search(query: BookSearchQuery): Promise<ProviderBookCandidate[]>;
  get(reference: ExternalBookRef): Promise<ProviderBookRecord | null>;
}

export interface AudioCatalogueProvider {
  readonly id: ProviderId;
  findRenditions(book: CanonicalBookHint): Promise<ProviderAudioRendition[]>;
}

export interface AssetProvider {
  readonly id: ProviderId;
  resolveAssets(rendition: ProviderAudioRendition): Promise<ProviderAssetManifest[]>;
}

export interface JsonHttpClient {
  getJson<T>(url: string, headers?: Record<string, string>): Promise<T>;
}
