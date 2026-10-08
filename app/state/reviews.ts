import {ME} from '../data/people';
import {Review, reviews} from '../data/social';
import {useSocial} from './social';

// Reviews of a book from people you follow: written reviews plus any
// rating someone posted with a few words in your feed.
export const useBookReviews = (bookId: string): Review[] => {
  const social = useSocial();
  const written = reviews.filter(
    r => r.bookId === bookId && social.followsPerson(r.by),
  );
  const posted = social.feed
    .filter(
      item =>
        item.bookId === bookId &&
        item.by !== ME &&
        item.rating !== undefined &&
        item.body.trim() !== '',
    )
    .map(item => ({
      id: item.id,
      bookId,
      by: item.by,
      rating: item.rating!,
      body: item.body,
      likes: item.likes,
      comments: item.comments.length,
    }));
  return [...written, ...posted];
};
