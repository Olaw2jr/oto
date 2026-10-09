import type {ShelfRecord} from '../domain';
import type {LibraryStatus} from '../domain/library';
import type {MutationOutbox} from './MutationOutbox';
import {bookEntityId, editionEntityId, isUuid, randomUuid} from './ids';
import type {MutationKind, MutationPayload} from './types';

// Steady listening is recorded at most this often per book. Seeks back are
// recorded at once, and settle() records whatever the throttle held back.
const PROGRESS_EVERY_MS = 30_000;

type Options = {
  outbox: MutationOutbox;
  now?: () => Date;
  newId?: () => string;
};

// Turns changes in the app into mutations in the outbox, in the shape
// oto-api's POST /v1/sync/mutations expects (docs/sync-protocol.md there).
export class SyncRecorder {
  private readonly now: () => Date;
  private readonly newId: () => string;
  private readonly lastProgress = new Map<string, {positionSec: number; atMs: number}>();
  private readonly heldBack = new Map<string, number>();

  constructor(private readonly options: Options) {
    this.now = options.now ?? (() => new Date());
    this.newId = options.newId ?? randomUuid;
  }

  private record(kind: MutationKind, entityId: string, payload: MutationPayload) {
    return this.options.outbox.enqueue({
      id: this.newId(),
      kind,
      entityId,
      payload,
      createdAt: this.now().toISOString(),
    });
  }

  libraryStatus(bookId: string, status: LibraryStatus | 'removed') {
    return this.record('library.status', bookEntityId(bookId), {status});
  }

  async progress(bookId: string, positionSec: number) {
    const position = Math.floor(positionSec);
    const nowMs = this.now().getTime();
    const last = this.lastProgress.get(bookId);
    if (!last && position === 0) {
      // Nothing listened yet, e.g. a book just added to Want to listen.
      return;
    }
    // Moving back is a seek; the server lets a newer seek win.
    const seek = last !== undefined && position < last.positionSec;
    if (last && !seek && nowMs - last.atMs < PROGRESS_EVERY_MS) {
      this.heldBack.set(bookId, position);
      return;
    }
    this.heldBack.delete(bookId);
    this.lastProgress.set(bookId, {positionSec: position, atMs: nowMs});
    await this.record(
      'progress.update',
      editionEntityId(bookId),
      seek ? {position_sec: position, seek: true} : {position_sec: position},
    );
  }

  // Records positions the throttle held back, e.g. when playback pauses or
  // the app goes to the background.
  async settle() {
    const held = [...this.heldBack];
    this.heldBack.clear();
    for (const [bookId, position] of held) {
      this.lastProgress.set(bookId, {positionSec: position, atMs: this.now().getTime()});
      await this.record('progress.update', editionEntityId(bookId), {position_sec: position});
    }
  }

  // Shelves made before shelf ids were UUIDs stay on this device.
  shelf(shelf: ShelfRecord) {
    if (!isUuid(shelf.id)) {
      return Promise.resolve();
    }
    return this.record('shelf.upsert', shelf.id, {
      name: shelf.name,
      book_ids: shelf.bookIds.map(bookEntityId),
    });
  }

  shelfDeleted(shelfId: string) {
    if (!isUuid(shelfId)) {
      return Promise.resolve();
    }
    return this.record('shelf.upsert', shelfId, {deleted: true});
  }

  rating(bookId: string, stars: number | null) {
    return this.record('rating.set', bookEntityId(bookId), {rating: stars});
  }
}
