import type {LocalMediaSource, MediaSource} from '../../domain';
import type {ContentTransport, PlayableSource} from '../ContentTransport';

const isLocalUri = (uri: string): boolean =>
  uri.startsWith('file://') || uri.startsWith('content://');

export class LocalFileTransport implements ContentTransport {
  readonly kind = 'local' as const;

  canHandle(source: MediaSource): source is LocalMediaSource {
    return source.kind === this.kind;
  }

  async prepare(source: MediaSource): Promise<PlayableSource> {
    if (!this.canHandle(source) || !isLocalUri(source.uri)) {
      throw new Error('Local source must use file:// or content://');
    }
    return {uri: source.uri, transport: this.kind};
  }
}
