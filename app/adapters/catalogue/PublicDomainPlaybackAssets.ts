import {PUBLIC_DOMAIN_SAMPLE_ID} from '../../data/catalogue';
import type {MediaAsset} from '../../domain';
import type {
  PlaybackAssetBinding,
  PlaybackAssetRepository,
} from '../../player/PlaybackQueueResolver';
import {seedRenditionId} from './SeedCatalogueRepositories';

export const PUBLIC_DOMAIN_ARCHIVE_ID =
  'adventures_sherlock_holmes_rg_librivox';

type ArchiveFile = {
  name?: string;
  size?: string;
  format?: string;
};

type ArchiveMetadata = {
  files?: ArchiveFile[];
};

export interface ArchiveMetadataClient {
  get(identifier: string): Promise<ArchiveMetadata>;
}

class FetchArchiveMetadataClient implements ArchiveMetadataClient {
  async get(identifier: string): Promise<ArchiveMetadata> {
    const response = await fetch(
      `https://archive.org/metadata/${encodeURIComponent(identifier)}`,
    );
    if (!response.ok) {
      throw new Error(
        `Internet Archive metadata request failed: ${response.status}`,
      );
    }
    return response.json() as Promise<ArchiveMetadata>;
  }
}

const positiveInt = (value?: string): number | undefined => {
  if (!value) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0
    ? parsed
    : undefined;
};

const encodedPath = (name: string): string =>
  name.split('/').map(encodeURIComponent).join('/');

export class PublicDomainPlaybackAssetRepository
  implements PlaybackAssetRepository
{
  constructor(
    private readonly client: ArchiveMetadataClient =
      new FetchArchiveMetadataClient(),
  ) {}

  async listForRendition(
    renditionId: string,
  ): Promise<PlaybackAssetBinding[]> {
    if (renditionId !== seedRenditionId(PUBLIC_DOMAIN_SAMPLE_ID)) {
      return [];
    }

    const metadata = await this.client.get(PUBLIC_DOMAIN_ARCHIVE_ID);
    const m4b = (metadata.files ?? []).find(file =>
      file.name?.toLowerCase().endsWith('.m4b'),
    );
    if (!m4b?.name) {
      throw new Error(
        'Public-domain playback sample has no whole-book M4B asset',
      );
    }

    const asset: MediaAsset = {
      id: `${PUBLIC_DOMAIN_ARCHIVE_ID}:${m4b.name}`,
      renditionId,
      format: 'm4b',
      ...(positiveInt(m4b.size) !== undefined
        ? {sizeBytes: positiveInt(m4b.size)}
        : {}),
      sources: [
        {
          kind: 'https',
          uri:
            `https://archive.org/download/${PUBLIC_DOMAIN_ARCHIVE_ID}/` +
            encodedPath(m4b.name),
          trustedSourceId: 'internetarchive',
        },
      ],
    };

    return [
      {
        chapterId: `${PUBLIC_DOMAIN_SAMPLE_ID}:chapter-1`,
        asset,
      },
    ];
  }
}
