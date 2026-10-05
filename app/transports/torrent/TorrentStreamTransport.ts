import type {MediaSource, TorrentMediaSource} from '../../domain';
import type {
  ContentTransport,
  PlayableSource,
  PrepareContext,
} from '../ContentTransport';
import type {TorrentEngine, TorrentFile} from './TorrentEngine';
import {LocalhostRangeGateway} from './LocalhostRangeGateway';
import {TorrentPiecePlanner} from './TorrentPiecePlanner';
import {
  TorrentSessionPool,
  type TorrentSessionLease,
} from './TorrentSessionPool';

export class TorrentStreamTransport implements ContentTransport {
  readonly kind = 'torrent' as const;
  private readonly pool: TorrentSessionPool;

  constructor(
    engineOrPool: TorrentEngine | TorrentSessionPool,
    private readonly gateway: LocalhostRangeGateway,
    private readonly planner = new TorrentPiecePlanner(),
  ) {
    this.pool =
      engineOrPool instanceof TorrentSessionPool
        ? engineOrPool
        : new TorrentSessionPool(engineOrPool);
  }

  canHandle(source: MediaSource): source is TorrentMediaSource {
    return source.kind === this.kind;
  }

  private async select(
    lease: TorrentSessionLease,
    source: TorrentMediaSource,
  ): Promise<TorrentFile> {
    if (source.fileIndex !== undefined || source.filePath !== undefined) {
      return this.pool.selectFile(lease, {
        fileIndex: source.fileIndex,
        filePath: source.filePath,
      });
    }
    if (lease.session.files.length === 1) return lease.session.files[0];
    throw new Error('Torrent stream requires a file selector for multi-file torrents');
  }

  private async prioritize(
    lease: TorrentSessionLease,
    file: TorrentFile,
    context: PrepareContext,
    positionSec: number,
  ): Promise<void> {
    if (!context.durationSec) return;
    const range = this.planner.plan({
      fileSizeBytes: file.sizeBytes,
      durationSec: context.durationSec,
      positionSec,
      lookBehindSec: context.lookBehindSec,
      bufferAheadSec: context.bufferAheadSec,
    });
    await this.pool.prioritizeRange(
      lease,
      file.index,
      range.startByte,
      range.endByte,
    );
  }

  async prepare(
    source: MediaSource,
    context: PrepareContext = {},
  ): Promise<PlayableSource> {
    if (!this.canHandle(source)) {
      throw new Error('TorrentStreamTransport requires a torrent source');
    }

    const lease = await this.pool.acquire(source);
    let file: TorrentFile | undefined;
    let route: Awaited<ReturnType<LocalhostRangeGateway['open']>> | undefined;
    let positionSec = context.positionSec ?? 0;
    let closed = false;

    const close = async () => {
      if (closed) return;
      closed = true;
      if (route) await this.gateway.close(route.routeId);
      if (file) await this.pool.releaseFile(lease, file.index);
      await this.pool.release(lease);
    };

    try {
      file = await this.select(lease, source);
      await this.pool.retainFile(lease, file.index);
      await this.prioritize(lease, file, context, positionSec);
      route = await this.gateway.open(lease.session.id, file.index);

      return {
        uri: route.url,
        transport: this.kind,
        control: {
          seek: async nextPositionSec => {
            positionSec = Math.max(0, nextPositionSec);
            if (file) {
              await this.prioritize(
                lease,
                file,
                context,
                positionSec,
              );
            }
          },
          recover: async () => {
            if (!file) throw new Error('Torrent playback file is unavailable');
            if (route) await this.gateway.close(route.routeId);
            route = await this.gateway.open(lease.session.id, file.index);
            await this.prioritize(lease, file, context, positionSec);
            return route.url;
          },
        },
        cleanup: close,
      };
    } catch (error) {
      await close();
      throw error;
    }
  }
}
