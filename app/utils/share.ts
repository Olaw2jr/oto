import {Share} from 'react-native';

import {CatalogueBook} from '../data/catalogue';
import {Club} from '../data/clubs';

// Opens the system share sheet. Dismissing it is not an error.
const share = (message: string) =>
  Share.share({message}).catch(() => undefined);

export const shareBook = (book: CatalogueBook) =>
  share(`${book.title} by ${book.author}. Listening on oto.`);

export const shareClub = (club: Club) =>
  share(`Join ${club.name} on oto: ${club.tagline.toLowerCase()}.`);

export const shareUpdate = (who: string, book: CatalogueBook, body: string) =>
  share(`${who} on ${book.title}: “${body}” Shared from oto.`);
