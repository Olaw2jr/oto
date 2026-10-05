import type {
  AssetProvider,
  JsonHttpClient,
  ProviderAssetManifest,
  ProviderAssetSource,
  ProviderAudioRendition,
} from '../contracts';
import type {MediaFormat} from '../../../../app/domain';

type ArchiveFile = {
  name?: string;
  size?: string;
  md5?: string;
  sha1?: string;
  format?: string;
};
type ArchiveMetadata = {files?: ArchiveFile[]};

const mediaFormat = (file: ArchiveFile): MediaFormat | null => {
  const name = file.name?.toLowerCase() ?? '';
  const format = file.format?.toLowerCase() ?? '';
  if (name.endsWith('.mp3') || format.includes('mp3')) return 'mp3';
  if (name.endsWith('.m4b')) return 'm4b';
  if (name.endsWith('.aac')) return 'aac';
  if (name.endsWith('.opus') || format.includes('opus')) return 'opus';
  return null;
};

const positiveInt = (value?: string): number | undefined => {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : undefined;
};

export class InternetArchiveProvider implements AssetProvider {
  readonly id = 'internetarchive';

  constructor(
    private readonly http: JsonHttpClient,
    private readonly baseUrl = 'https://archive.org',
  ) {}

  async resolveAssets(
    rendition: ProviderAudioRendition,
  ): Promise<ProviderAssetManifest[]> {
    const refs = (rendition.assetRefs ?? []).filter(
      ref => ref.providerId === this.id && ref.externalId,
    );
    const manifests: ProviderAssetManifest[] = [];

    for (const ref of refs) {
      const metadata = await this.http.getJson<ArchiveMetadata>(
        `${this.baseUrl}/metadata/${encodeURIComponent(ref.externalId)}`,
      );
      const files = metadata.files ?? [];
      const torrent = files.find(file =>
        file.name?.toLowerCase().endsWith('_archive.torrent'),
      );

      for (const file of files) {
        if (!file.name) continue;
        const format = mediaFormat(file);
        if (!format) continue;

        const encodedName = file.name.split('/').map(encodeURIComponent).join('/');
        const sources: ProviderAssetSource[] = [{
          kind: 'https',
          uri: `${this.baseUrl}/download/${encodeURIComponent(ref.externalId)}/${encodedName}`,
          trustedSourceId: this.id,
        }];
        if (torrent?.name) {
          const torrentName = torrent.name.split('/').map(encodeURIComponent).join('/');
          sources.push({
            kind: 'torrent',
            torrentUri: `${this.baseUrl}/download/${encodeURIComponent(ref.externalId)}/${torrentName}`,
            filePath: file.name,
            trustedSourceId: this.id,
          });
        }

        manifests.push({
          ref: {
            providerId: this.id,
            externalId: `${ref.externalId}/${file.name}`,
          },
          renditionRef: rendition.ref,
          format,
          sizeBytes: positiveInt(file.size),
          checksum: file.sha1 ?? file.md5,
          sources,
          rights: rendition.rights,
        });
      }
    }

    return manifests;
  }
}
