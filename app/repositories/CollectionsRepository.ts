import type {BookId, PersonalCollections, ShelfRecord} from '../domain';

export interface CollectionsRepository {
  load(): Promise<PersonalCollections>;
  // null clears your rating.
  saveRating(bookId: BookId, stars: number | null): Promise<void>;
  // Saves the shelf's name and replaces its books.
  saveShelf(shelf: ShelfRecord): Promise<void>;
  addBookmark(bookId: BookId, atSec: number): Promise<void>;
  removeBookmark(bookId: BookId, atSec: number): Promise<void>;
}
