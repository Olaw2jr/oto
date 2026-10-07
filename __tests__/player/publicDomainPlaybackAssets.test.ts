import {
  PUBLIC_DOMAIN_ARCHIVE_ID,
  PublicDomainPlaybackAssetRepository,
  SeedRenditionRepository,
  seedRenditionId,
} from '../../app/adapters/catalogue';
import {
  PUBLIC_DOMAIN_SAMPLE_ID,
} from '../../app/data/catalogue';

describe('public-domain playback assets', () => {
  it('resolves the Sherlock Holmes sample to the whole-book Archive M4B', async () => {
    const client = {
      get: jest.fn(async () => ({
        files: [
          {
            name: 'adventures_sherlock_holmes_rg_01_doyle_64kb.mp3',
            size: '123',
          },
          {
            name: 'adventures_sherlock_holmes_rg_librivox.m4b',
            size: '386000000',
          },
        ],
      })),
    };
    const repository =
      new PublicDomainPlaybackAssetRepository(client);

    const bindings = await repository.listForRendition(
      seedRenditionId(PUBLIC_DOMAIN_SAMPLE_ID),
    );

    expect(client.get).toHaveBeenCalledWith(
      PUBLIC_DOMAIN_ARCHIVE_ID,
    );
    expect(bindings).toEqual([
      {
        chapterId: `${PUBLIC_DOMAIN_SAMPLE_ID}:chapter-1`,
        asset: expect.objectContaining({
          renditionId: seedRenditionId(PUBLIC_DOMAIN_SAMPLE_ID),
          format: 'm4b',
          sizeBytes: 386000000,
          sources: [
            {
              kind: 'https',
              uri:
                'https://archive.org/download/' +
                PUBLIC_DOMAIN_ARCHIVE_ID +
                '/adventures_sherlock_holmes_rg_librivox.m4b',
              trustedSourceId: 'internetarchive',
            },
          ],
        }),
      },
    ]);
  });

  it('does not make a network request for commercial seed renditions', async () => {
    const client = {get: jest.fn()};
    const repository =
      new PublicDomainPlaybackAssetRepository(client);

    await expect(
      repository.listForRendition('where-the-crawdads-sing:seed'),
    ).resolves.toEqual([]);
    expect(client.get).not.toHaveBeenCalled();
  });

  it('marks only the validation sample as public domain', async () => {
    const renditions = new SeedRenditionRepository();

    await expect(
      renditions.get(seedRenditionId(PUBLIC_DOMAIN_SAMPLE_ID)),
    ).resolves.toMatchObject({
      rights: {
        status: 'public-domain',
        source: 'librivox',
      },
    });

    await expect(
      renditions.get('where-the-crawdads-sing:seed'),
    ).resolves.toMatchObject({
      rights: {status: 'unknown'},
    });
  });

  it('fails closed if the Archive item no longer exposes a whole-book M4B', async () => {
    const repository =
      new PublicDomainPlaybackAssetRepository({
        get: async () => ({
          files: [{name: 'chapter-01.mp3'}],
        }),
      });

    await expect(
      repository.listForRendition(
        seedRenditionId(PUBLIC_DOMAIN_SAMPLE_ID),
      ),
    ).rejects.toThrow('no whole-book M4B asset');
  });
});
