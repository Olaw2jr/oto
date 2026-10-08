import {
  PUBLIC_DOMAIN_SAMPLE_CHAPTERS,
  PUBLIC_DOMAIN_SAMPLE_ID,
} from '../../data/catalogue';
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
    const files = metadata.files ?? [];
    return PUBLIC_DOMAIN_SAMPLE_CHAPTERS.map((chapter, index) => {
      const fileName =
        `adventuresholmes_${String(index + 1).padStart(2, '0')}_doyle_64kb.mp3`;
      const file = files.find(candidate => candidate.name === fileName);
      if (!file?.name) {
        throw new Error(
          `Public-domain playback sample is missing chapter asset ${fileName}`,
        );
      }

      const asset: MediaAsset = {
        id: `${PUBLIC_DOMAIN_ARCHIVE_ID}:${file.name}`,
        renditionId,
        format: 'mp3',
        ...(positiveInt(file.size) !== undefined
          ? {sizeBytes: positiveInt(file.size)}
          : {}),
        sources: [
          {
            kind: 'torrent',
            torrentUri:
              `https://archive.org/download/${PUBLIC_DOMAIN_ARCHIVE_ID}/` +
              `${PUBLIC_DOMAIN_ARCHIVE_ID}_archive.torrent`,
            filePath: file.name,
            trustedSourceId: 'internetarchive',
          },
          {
            kind: 'https',
            uri:
              `https://archive.org/download/${PUBLIC_DOMAIN_ARCHIVE_ID}/` +
              encodedPath(file.name),
            trustedSourceId: 'internetarchive',
          },
        ],
      };

      return {
        chapterId: `${PUBLIC_DOMAIN_SAMPLE_ID}:chapter-${index + 1}`,
        asset,
      };
    });
  }
}
