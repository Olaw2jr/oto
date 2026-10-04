import React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';

import {BookCover} from '../../components/BookCover';
import {getBook} from '../../data/catalogue';
import {getClub} from '../../data/clubs';
import {firstName, getPerson, ME} from '../../data/people';
import {FeedItem} from '../../data/social';
import {useLibrary} from '../../state/library';
import {useSocial} from '../../state/social';
import {useTheme} from '../../theme/ThemeProvider';
import {Avatar, Card, Icon, ProgressBar, Txt} from '../../ui';

type FeedCardProps = {item: FeedItem; onOpenBook: (bookId: string) => void};

export const FeedCard = ({item, onOpenBook}: FeedCardProps) => {
  const {colors} = useTheme();
  const social = useSocial();
  const library = useLibrary();
  const person = getPerson(item.by);
  const book = getBook(item.bookId);
  const liked = social.liked(item.id);
  const likes = social.likeCount(item.id, item.likes);
  const myStatus = library.status(book.id);
  const shelfLabel = {
    want: 'On your want list',
    listening: "You're listening",
    finished: 'You finished this',
  };
  const verb = item.clubId
    ? `posted in ${getClub(item.clubId).name}`
    : item.verb;

  return (
    <Card style={styles.card}>
      <View style={styles.head}>
        <Avatar name={person.name} size={38} />
        <View style={styles.who}>
          <Txt variant="caption" color="ink">
            <Txt variant="caption" color="ink" weight="semibold">
              {item.by === ME ? 'You' : person.short}
            </Txt>{' '}
            <Txt variant="caption">{verb}</Txt>
          </Txt>
          <Txt variant="small">{item.ago}</Txt>
        </View>
        {item.rating ? (
          <View style={styles.rating}>
            <Icon name="starFilled" size={14} />
            <Txt
              variant="caption"
              color="ink"
              weight="semibold"
              style={styles.ratingText}>
              {item.rating.toFixed(1)}
            </Txt>
          </View>
        ) : null}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${book.title}, ${book.author}`}
        onPress={() => onOpenBook(book.id)}
        style={styles.book}>
        <BookCover book={book} size={68} />
        <View style={styles.bookText}>
          <Txt variant="bookTitle" numberOfLines={2}>
            {book.title}
          </Txt>
          <Txt variant="caption" style={styles.author}>
            {book.author}
          </Txt>
          {item.progress !== undefined && item.verb !== 'finished a book' ? (
            <View style={styles.progress}>
              <ProgressBar
                value={item.progress}
                label={`${firstName(item.by)}'s progress`}
              />
              <Txt variant="small" style={styles.percent}>
                {`${Math.round(item.progress * 100)}%`}
              </Txt>
            </View>
          ) : null}
        </View>
      </Pressable>

      {item.body ? (
        <Txt variant="quote" style={styles.body}>
          {item.spoiler ? `Spoiler · ${item.body}` : item.body}
        </Txt>
      ) : null}

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${liked ? 'Unlike' : 'Like'}, ${likes} likes`}
          accessibilityState={{selected: liked}}
          onPress={() => social.toggleLike(item.id)}
          style={styles.action}>
          <Icon
            name={liked ? 'heartFilled' : 'heart'}
            size={20}
            color={liked ? 'kaki' : 'graphite'}
          />
          <Txt variant="caption" style={styles.count}>
            {String(likes)}
          </Txt>
        </Pressable>
        <View
          accessible
          accessibilityLabel={`${item.replies.length} replies`}
          style={styles.action}>
          <Icon name="comment" size={20} color="graphite" />
          <Txt variant="caption" style={styles.count}>
            {String(item.replies.length)}
          </Txt>
        </View>
        <View style={styles.spacer} />
        {item.by === ME ? null : myStatus ? (
          <Txt variant="caption" style={styles.wantDone}>
            {shelfLabel[myStatus]}
          </Txt>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Add ${book.title} to want`}
            onPress={() => library.setStatus(book.id, 'want')}
            style={styles.action}>
            <Txt variant="caption" color="ink" weight="semibold">
              Add to want
            </Txt>
          </Pressable>
        )}
      </View>

      {item.replies.length ? (
        <View style={[styles.replies, {borderTopColor: colors.hairline}]}>
          {item.replies.map((reply, i) => (
            <Txt
              key={i}
              variant="caption"
              color="ink"
              style={i > 0 && styles.reply}>
              <Txt variant="caption" color="ink" weight="semibold">
                {firstName(reply.by)}
              </Txt>{' '}
              <Txt variant="caption">{reply.body}</Txt>
            </Txt>
          ))}
        </View>
      ) : null}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginTop: 14,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  head: {flexDirection: 'row', alignItems: 'center'},
  who: {flex: 1, marginLeft: 12},
  rating: {flexDirection: 'row', alignItems: 'center'},
  ratingText: {marginLeft: 4},
  book: {flexDirection: 'row', alignItems: 'center', marginTop: 14},
  bookText: {flex: 1, marginLeft: 14},
  author: {marginTop: 2},
  progress: {flexDirection: 'row', alignItems: 'center', marginTop: 9},
  percent: {marginLeft: 10},
  body: {marginTop: 12},
  actions: {flexDirection: 'row', alignItems: 'center', marginTop: 6},
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingHorizontal: 4,
    marginRight: 10,
  },
  count: {marginLeft: 6},
  spacer: {flex: 1},
  wantDone: {paddingHorizontal: 4},
  replies: {borderTopWidth: 1, paddingTop: 10, paddingBottom: 12},
  reply: {marginTop: 4},
});
