import type {MediaSource, TorrentMediaSource} from '../../domain';
import type {ContentTransport, PlayableSource} from '../ContentTransport';
import type {TorrentEngine, TorrentFile} from './TorrentEngine';
import {LocalhostRangeGateway} from './LocalhostRangeGateway';

export class TorrentStreamTransport implements ContentTransport {
  readonly kind = 'torrent' as const;

  constructor(
    private readonly engine: TorrentEngine,
    private readonly gateway: LocalhostRangeGateway,
  ) {}

  canHandle(source: MediaSource): source is TorrentMediaSource {
    return source.kind === this.kind;
  }

  private async select(
    sessionId: string,
    files: TorrentFile[],
    source: TorrentMediaSource,
  ): Promise<TorrentFile> {
    if (source.fileIndex !== undefined || source.filePath !== undefined) {
      return this.engine.selectFile(sessionId, {
        fileIndex: source.fileIndex,
        filePath: source.filePath,
      });
    }
    if (files.length === 1) return files[0];
    throw new Error('Torrent stream requires a file selector for multi-file torrents');
  }

  async prepare(source: MediaSource): Promise<PlayableSource> {
    if (!this.canHandle(source)) {
      throw new Error('TorrentStreamTransport requires a torrent source');
    }

    const session = await this.engine.open(source);
    try {
      const file = await this.select(session.id, session.files, source);
      await this.engine.setFilePriority(session.id, file.index, 'high');
      const route = await this.gateway.open(session.id, file.index);

      return {
        uri: route.url,
        transport: this.kind,
        cleanup: async () => {
          await this.gateway.close(route.routeId);
          await this.engine.close(session.id);
        },
      };
    } catch (error) {
      await this.engine.close(session.id);
      throw error;
    }
  }
}
