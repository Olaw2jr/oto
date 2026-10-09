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
  it('resolves the Sherlock Holmes sample to its 24 authorized chapter files', async () => {
    const client = {
      get: jest.fn(async () => ({
        files: Array.from({length: 24}, (_, index) => ({
          name: `adventuresholmes_${String(index + 1).padStart(2, '0')}_doyle_64kb.mp3`,
          size: String(1000 + index),
        })),
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
    expect(bindings).toHaveLength(24);
    expect(bindings[0]).toEqual({
      chapterId: `${PUBLIC_DOMAIN_SAMPLE_ID}:chapter-1`,
      asset: expect.objectContaining({
        renditionId: seedRenditionId(PUBLIC_DOMAIN_SAMPLE_ID),
        format: 'mp3',
        sizeBytes: 1000,
        sources: [
          {
            kind: 'torrent',
            torrentUri:
              `https://archive.org/download/${PUBLIC_DOMAIN_ARCHIVE_ID}/` +
              `${PUBLIC_DOMAIN_ARCHIVE_ID}_archive.torrent`,
            filePath: 'adventuresholmes_01_doyle_64kb.mp3',
            trustedSourceId: 'internetarchive',
          },
          {
            kind: 'https',
            uri:
              'https://archive.org/download/' +
              PUBLIC_DOMAIN_ARCHIVE_ID +
              '/adventuresholmes_01_doyle_64kb.mp3',
            trustedSourceId: 'internetarchive',
          },
        ],
      }),
    });
    expect(bindings[23]?.chapterId).toBe(
      `${PUBLIC_DOMAIN_SAMPLE_ID}:chapter-24`,
    );
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

  it('maps exact recording sections and durations into its rendition chapters', async () => {
    const rendition = await new SeedRenditionRepository().get(
      seedRenditionId(PUBLIC_DOMAIN_SAMPLE_ID),
    );

    expect(rendition?.chapters).toHaveLength(24);
    expect(rendition?.chapters[0]).toMatchObject({
      title: 'A Scandal in Bohemia, Part 1',
      startSec: 0,
      durationSec: 1670,
    });
    expect(rendition?.chapters[23]).toMatchObject({
      title: 'The Adventure of the Copper Beeches, Part 2',
      startSec: 45969,
      durationSec: 2598,
    });
    expect(rendition?.chapters.reduce(
      (total, chapter) => total + (chapter.durationSec ?? 0),
      0,
    )).toBe(48567);
  });

  it('fails closed if the Archive item is missing a chapter file', async () => {
    const repository =
      new PublicDomainPlaybackAssetRepository({
        get: async () => ({
          files: [{name: 'adventuresholmes_01_doyle_64kb.mp3'}],
        }),
      });

    await expect(
      repository.listForRendition(
        seedRenditionId(PUBLIC_DOMAIN_SAMPLE_ID),
      ),
    ).rejects.toThrow(
      'missing chapter asset adventuresholmes_02_doyle_64kb.mp3',
    );
  });
});
