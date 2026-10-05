import {RightsPolicy} from '../../../app/domain/rights';
import type {
  AssetProvider,
  ProviderAssetManifest,
  ProviderAudioRendition,
} from '../providers';

export class PolicyEnforcedAssetProvider implements AssetProvider {
  readonly id: string;

  constructor(
    private readonly provider: AssetProvider,
    private readonly policy: RightsPolicy,
  ) {
    this.id = `policy:${provider.id}`;
  }

  async resolveAssets(
    rendition: ProviderAudioRendition,
  ): Promise<ProviderAssetManifest[]> {
    const manifests = await this.provider.resolveAssets(rendition);

    return manifests.flatMap(manifest => {
      const sources = manifest.sources.filter(
        source => this.policy.evaluate(manifest.rights, source).allowed,
      );
      return sources.length ? [{...manifest, sources}] : [];
    });
  }
}
