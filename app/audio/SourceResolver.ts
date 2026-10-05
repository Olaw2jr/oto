import type {
  LocalMediaSource,
  MediaAsset,
  MediaSource,
  RightsInfo,
} from '../domain';
import {RightsPolicy} from '../domain/rights';
import type {PlayableSource, PrepareContext} from '../transports';
import {TransportRegistry} from '../transports';

export interface DownloadedAssetLocator {
  locate(assetId: string): Promise<LocalMediaSource | null>;
}

const order = (source: MediaSource): number => {
  switch (source.kind) {
    case 'local':
      return 0;
    case 'https':
      return 1;
    case 'torrent':
      return 2;
  }
};

export class SourceResolver {
  constructor(
    private readonly transports: TransportRegistry,
    private readonly rightsPolicy: RightsPolicy,
    private readonly downloaded: DownloadedAssetLocator,
  ) {}

  async resolve(
    asset: MediaAsset,
    rights: RightsInfo,
    context?: PrepareContext,
  ): Promise<PlayableSource> {
    const local = await this.downloaded.locate(asset.id);
    const candidates = [
      ...(local ? [local] : []),
      ...asset.sources,
    ].sort((a, b) => order(a) - order(b));

    let lastError: unknown;
    for (const source of candidates) {
      if (!this.rightsPolicy.evaluate(rights, source).allowed) {
        continue;
      }
      try {
        return await this.transports.forSource(source).prepare(source, context);
      } catch (error) {
        lastError = error;
      }
    }

    const suffix =
      lastError instanceof Error ? `: ${lastError.message}` : '';
    throw new Error(`No authorized media source is playable${suffix}`);
  }
}
