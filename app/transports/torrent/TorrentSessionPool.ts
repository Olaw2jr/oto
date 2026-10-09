import type {TorrentMediaSource} from '../../domain';
import type {
  TorrentEngine,
  TorrentFile,
  TorrentFileProgress,
  TorrentFileSelector,
  TorrentSession,
} from './TorrentEngine';

export type TorrentSessionLease = {
  key: string;
  source: TorrentMediaSource;
  session: TorrentSession;
};

type PoolEntry = {
  source: TorrentMediaSource;
  session: TorrentSession;
  references: number;
  fileReferences: Map<number, {download: number; stream: number}>;
};

const sourceKey = (source: TorrentMediaSource): string => {
  const key = source.infoHash ?? source.magnetUri ?? source.torrentUri;
  if (!key) {
    throw new Error('Torrent source requires a descriptor, magnet URI or info hash');
  }
  return key;
};

export class TorrentSessionPool {
  private readonly entries = new Map<string, PoolEntry>();

  constructor(private readonly engine: TorrentEngine) {}

  async acquire(
    source: TorrentMediaSource,
    resumeData?: string,
  ): Promise<TorrentSessionLease> {
    const key = sourceKey(source);
    const existing = this.entries.get(key);
    if (existing) {
      existing.references += 1;
      return {key, source, session: existing.session};
    }

    const session = await this.engine.open(source, resumeData);
    this.entries.set(key, {
      source,
      session,
      references: 1,
      fileReferences: new Map(),
    });
    return {key, source, session};
  }

  private entry(lease: TorrentSessionLease): PoolEntry {
    const entry = this.entries.get(lease.key);
    if (!entry || entry.session.id !== lease.session.id) {
      throw new Error('Torrent session lease is no longer active');
    }
    return entry;
  }

  selectFile(
    lease: TorrentSessionLease,
    selector: TorrentFileSelector,
  ): Promise<TorrentFile> {
    if (selector.filePath === undefined) {
      return this.engine.selectFile(lease.session.id, selector);
    }

    const expectedPath = selector.filePath
      .replace(/\\/g, '/')
      .replace(/^\.\//, '');
    if (
      expectedPath.length === 0 ||
      expectedPath.split('/').some(part => part === '.' || part === '..')
    ) {
      throw new Error('Torrent file selector does not identify one exact file');
    }

    // Multi-file torrents expose paths beneath the torrent's root directory,
    // while catalogue metadata commonly stores the archive-relative path.
    // Resolve that path against the session manifest, then send the native
    // engine the exact path and index it reported. Never guess when ambiguous.
    const matches = lease.session.files.filter(file => {
      const candidate = file.path.replace(/\\/g, '/').replace(/^\.\//, '');
      return (
        candidate === expectedPath ||
        candidate.endsWith(`/${expectedPath}`)
      );
    });
    const selected = matches.length === 1 ? matches[0] : undefined;
    if (
      !selected ||
      (selector.fileIndex !== undefined && selector.fileIndex !== selected.index)
    ) {
      throw new Error('Torrent file selector does not identify one exact file');
    }

    return this.engine.selectFile(lease.session.id, {
      fileIndex: selected.index,
      filePath: selected.path,
    });
  }

  // Streaming keeps a file open but fetches only the ranges the player asks
  // for; an offline download wants the whole file.
  async retainFile(
    lease: TorrentSessionLease,
    fileIndex: number,
    purpose: TorrentFilePurpose = 'download',
  ): Promise<void> {
    const entry = this.entry(lease);
    const refs = entry.fileReferences.get(fileIndex) ?? {download: 0, stream: 0};
    const before = priorityFor(refs);
    const next = {...refs, [purpose]: refs[purpose] + 1};
    entry.fileReferences.set(fileIndex, next);
    if (refs.download + refs.stream === 0 || priorityFor(next) !== before) {
      await this.engine.setFilePriority(lease.session.id, fileIndex, priorityFor(next));
    }
  }

  async releaseFile(
    lease: TorrentSessionLease,
    fileIndex: number,
    purpose: TorrentFilePurpose = 'download',
  ): Promise<void> {
    const entry = this.entry(lease);
    const refs = entry.fileReferences.get(fileIndex);
    if (!refs) return;
    const next = {...refs, [purpose]: Math.max(0, refs[purpose] - 1)};
    if (next.download + next.stream === 0) {
      entry.fileReferences.delete(fileIndex);
      await this.engine.setFilePriority(lease.session.id, fileIndex, 'off');
      return;
    }
    entry.fileReferences.set(fileIndex, next);
    if (priorityFor(next) !== priorityFor(refs)) {
      await this.engine.setFilePriority(lease.session.id, fileIndex, priorityFor(next));
    }
  }

  prioritizeRange(
    lease: TorrentSessionLease,
    fileIndex: number,
    startByte: number,
    endByte: number,
  ): Promise<void> {
    this.entry(lease);
    return this.engine.prioritizeRange(
      lease.session.id,
      fileIndex,
      startByte,
      endByte,
    );
  }

  progress(
    lease: TorrentSessionLease,
    fileIndex: number,
  ): Promise<TorrentFileProgress> {
    this.entry(lease);
    return this.engine.getProgress(lease.session.id, fileIndex);
  }

  exportResumeData(lease: TorrentSessionLease): Promise<string | null> {
    this.entry(lease);
    return this.engine.exportResumeData(lease.session.id);
  }

  async release(lease: TorrentSessionLease): Promise<void> {
    const entry = this.entry(lease);
    entry.references -= 1;
    if (entry.references > 0) return;

    for (const fileIndex of entry.fileReferences.keys()) {
      await this.engine.setFilePriority(entry.session.id, fileIndex, 'off');
    }
    await this.engine.close(entry.session.id);
    this.entries.delete(lease.key);
  }
}

export type TorrentFilePurpose = 'download' | 'stream';

const priorityFor = (refs: {download: number}) =>
  refs.download > 0 ? ('high' as const) : ('off' as const);

export {sourceKey as torrentSourceKey};
