import type {MediaSource} from '../domain';
import type {
  ContentTransport,
  DownloadDestination,
  DownloadHandle,
  PlayableSource,
} from './ContentTransport';

class FakeDownloadHandle implements DownloadHandle {
  readonly id: string;

  constructor(
    kind: MediaSource['kind'],
    private readonly destination: DownloadDestination,
  ) {
    this.id = `fake-${kind}-download`;
  }

  async wait() {
    return {uri: this.destination.uri};
  }

  async cancel(): Promise<void> {}
}

export class FakeContentTransport implements ContentTransport {
  constructor(readonly kind: MediaSource['kind']) {}

  canHandle(source: MediaSource): boolean {
    return source.kind === this.kind;
  }

  async prepare(source: MediaSource): Promise<PlayableSource> {
    return {
      uri: `fake://${this.kind}/${encodeURIComponent(JSON.stringify(source))}`,
      transport: this.kind,
    };
  }

  async download(
    _source: MediaSource,
    destination: DownloadDestination,
  ): Promise<DownloadHandle> {
    return new FakeDownloadHandle(this.kind, destination);
  }
}
