import {
  LocalhostRangeGateway,
  NativeTorrentEngine,
  TorrentDownloadManager,
  TorrentSessionPool,
  TorrentStreamTransport,
} from '../../transports/torrent';
import {AsyncStorageTorrentResumeStore} from '../../transports/torrent/AsyncStorageTorrentResumeStore';
import {createNativeAndroidTorrentBridge} from './NativeAndroidTorrentBridge';

export const createAndroidTorrentRuntime = () => {
  const native = createNativeAndroidTorrentBridge();
  const engine = new NativeTorrentEngine(native);
  const pool = new TorrentSessionPool(engine);
  const gateway = new LocalhostRangeGateway(native);
  const resume = new AsyncStorageTorrentResumeStore(
    'oto.torrent.resume.',
  );

  return {
    pool,
    streaming: new TorrentStreamTransport(pool, gateway),
    downloads: new TorrentDownloadManager(pool, resume),
  };
};
