import type {
  AudioRendition,
  BookEdition,
  BookWork,
  MediaAsset,
} from '../../app/domain';

describe('catalogue domain model', () => {
  it('keeps a literary work separate from its edition, audio rendition and media asset', () => {
    const work: BookWork = {
      id: 'work-crime-and-punishment',
      title: 'Crime and Punishment',
      authors: [{name: 'Fyodor Dostoevsky'}],
      subjects: ['Fiction'],
      identifiers: {openLibraryWorkId: 'OL166894W'},
    };
    const edition: BookEdition = {
      id: 'edition-en',
      workId: work.id,
      language: 'en',
      publisher: 'Example Publisher',
    };
    const rendition: AudioRendition = {
      id: 'rendition-librivox',
      workId: work.id,
      editionId: edition.id,
      narrators: [{name: 'Volunteer Narrator'}],
      language: 'en',
      durationSec: 3600,
      chapters: [{id: 'chapter-1', title: 'Chapter 1', startSec: 0}],
      rights: {
        status: 'public-domain',
        source: 'test',
        verifiedAt: '2026-10-05T00:00:00Z',
      },
    };
    const asset: MediaAsset = {
      id: 'asset-mp3',
      renditionId: rendition.id,
      format: 'mp3',
      sources: [{kind: 'https', uri: 'https://example.test/chapter.mp3'}],
    };

    expect(rendition.workId).toBe(work.id);
    expect(edition.workId).toBe(work.id);
    expect(asset.renditionId).toBe(rendition.id);
    expect('narrators' in work).toBe(false);
  });
});
