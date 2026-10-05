import type {HttpsMediaSource, MediaSource} from '../../domain';
import type {
  ContentTransport,
  DownloadDestination,
  DownloadHandle,
  PlayableSource,
} from '../ContentTransport';

export interface HttpFileTransferClient {
  start(uri: string, destination: DownloadDestination): Promise<DownloadHandle>;
}

export class HttpsTransport implements ContentTransport {
  readonly kind = 'https' as const;

  constructor(private readonly transfer: HttpFileTransferClient) {}

  canHandle(source: MediaSource): source is HttpsMediaSource {
    return source.kind === this.kind;
  }

  async prepare(source: MediaSource): Promise<PlayableSource> {
    if (!this.canHandle(source) || !/^https:\/\//i.test(source.uri)) {
      throw new Error('HTTPS source must use an https:// URI');
    }
    return {uri: source.uri, transport: this.kind};
  }

  async download(
    source: MediaSource,
    destination: DownloadDestination,
  ): Promise<DownloadHandle> {
    if (!this.canHandle(source) || !/^https:\/\//i.test(source.uri)) {
      throw new Error('HTTPS source must use an https:// URI');
    }
    return this.transfer.start(source.uri, destination);
  }
}
