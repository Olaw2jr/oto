import type {
  AudioCatalogueProvider,
  CanonicalBookHint,
  JsonHttpClient,
  ProviderAudioRendition,
} from '../contracts';

type LibriVoxAuthor = {first_name?: string; last_name?: string};
type LibriVoxReader = {display_name?: string};
type LibriVoxSection = {
  id?: string;
  title?: string;
  playtime?: string;
  readers?: LibriVoxReader[];
};
type LibriVoxBook = {
  id?: string;
  title?: string;
  language?: string;
  totaltimesecs?: string;
  authors?: LibriVoxAuthor[];
  sections?: LibriVoxSection[];
};
type LibriVoxResponse = {books?: LibriVoxBook[]};

type Options = {
  userAgent: string;
  baseUrl?: string;
  now?: () => string;
};

const authorName = (author: LibriVoxAuthor): string =>
  [author.first_name, author.last_name].filter(Boolean).join(' ').trim();

const seconds = (value?: string): number | undefined => {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
};

export class LibriVoxProvider implements AudioCatalogueProvider {
  readonly id = 'librivox';
  private readonly baseUrl: string;
  private readonly now: () => string;

  constructor(
    private readonly http: JsonHttpClient,
    private readonly options: Options,
  ) {
    this.baseUrl = options.baseUrl ?? 'https://librivox.org/api/feed/audiobooks';
    this.now = options.now ?? (() => new Date().toISOString());
  }

  async findRenditions(book: CanonicalBookHint): Promise<ProviderAudioRendition[]> {
    const url =
      `${this.baseUrl}/title/${encodeURIComponent(book.title)}` +
      '?format=json&extended=1';
    const response = await this.http.getJson<LibriVoxResponse>(url, {
      'User-Agent': this.options.userAgent,
    });

    return (response.books ?? []).flatMap(item => {
      if (!item.id || !item.title) return [];

      let startSec = 0;
      const narrators = new Set<string>();
      const chapters = (item.sections ?? []).map((section, index) => {
        const durationSec = seconds(section.playtime);
        for (const reader of section.readers ?? []) {
          if (reader.display_name) narrators.add(reader.display_name);
        }
        const chapter = {
          id: section.id ?? `${item.id}-section-${index + 1}`,
          title: section.title ?? `Chapter ${index + 1}`,
          startSec,
          ...(durationSec !== undefined ? {durationSec} : {}),
        };
        startSec += durationSec ?? 0;
        return chapter;
      });

      return [{
        ref: {providerId: this.id, externalId: item.id},
        workHint: {
          title: item.title,
          authors: (item.authors ?? []).map(authorName).filter(Boolean),
          identifiers: book.identifiers,
        },
        narrators: [...narrators],
        language: item.language ?? 'unknown',
        durationSec: seconds(item.totaltimesecs),
        chapters,
        rights: {
          status: 'public-domain' as const,
          source: this.id,
          verifiedAt: this.now(),
        },
      }];
    });
  }
}
