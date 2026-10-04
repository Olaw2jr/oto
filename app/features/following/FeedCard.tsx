import React, {useState} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';

import {BookCover} from '../../components/BookCover';
import {getBook} from '../../data/catalogue';
import {getClub} from '../../data/clubs';
import {firstName, getPerson, ME} from '../../data/people';
import {formatDuration} from '../../data/format';
import {FeedItem} from '../../data/social';
import {useLibrary} from '../../state/library';
import {useSocial} from '../../state/social';
import {useTheme} from '../../theme/ThemeProvider';
import {Avatar, Card, Icon, IconButton, ProgressBar, Txt} from '../../ui';

type FeedCardProps = {
  item: FeedItem;
  onOpenBook: (bookId: string) => void;
  onOpenThread: (itemId: string) => void;
  onReported?: () => void;
};

export const FeedCard = ({
  item,
  onOpenBook,
  onOpenThread,
  onReported,
}: FeedCardProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const {colors, colorScheme} = useTheme();
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
  const comments = social.comments(item.id);
  // The card previews the first two top-level comments; replies stay in the thread.
  const preview = comments.filter(c => !c.parentId).slice(0, 2);
  const commentLabel =
    comments.length === 1 ? '1 comment' : `${comments.length} comments`;
  const name = item.by === ME ? 'You' : person.short;
  const wants = item.verb === 'wants to listen';
  const subtitle = wants
    ? `${book.author} · ${formatDuration(book.durationSec)}`
    : item.verb === 'made progress' && item.progress !== undefined
    ? `${formatDuration(item.progress * book.durationSec)} of ${formatDuration(
        book.durationSec,
      )}`
    : book.author;
  const verb = item.clubId
    ? `posted in ${getClub(item.clubId).name}`
    : item.verb;

  return (
    <Card style={styles.card} testID={`update-${name}`}>
      <View style={styles.head}>
        <Avatar name={person.name} size={38} />
        <View style={styles.who}>
          <Txt variant="caption" color="ink">
            <Txt variant="caption" color="ink" weight="semibold">
              {name}
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
        {item.by === ME ? null : (
          <View style={styles.more}>
            <IconButton
              icon="more"
              label="More options for this update"
              background={menuOpen ? 'raised' : undefined}
              onPress={() => setMenuOpen(open => !open)}
            />
          </View>
        )}
      </View>
      {menuOpen ? (
        <View
          accessibilityRole="menu"
          accessibilityLabel="Update options"
          style={[
            styles.menu,
            // On dark cards the surface colour would blend in; lift it.
            colorScheme === 'dark'
              ? [
                  styles.menuEdge,
                  {
                    backgroundColor: colors.raised,
                    borderColor: colors.hairline,
                  },
                ]
              : {backgroundColor: colors.surface},
          ]}>
          {[
            {
              label: 'Hide this update',
              icon: 'eyeSlash' as const,
              run: () => social.hideUpdate(item.id),
            },
            {
              label: `Mute ${firstName(item.by)}`,
              icon: 'mute' as const,
              run: () => social.mute(item.by),
            },
            {
              label: 'Report',
              icon: 'flag' as const,
              danger: true,
              run: () => {
                social.reportUpdate(item.id);
                onReported?.();
              },
            },
          ].map(option => (
            <Pressable
              key={option.label}
              accessibilityRole="menuitem"
              accessibilityLabel={option.label}
              onPress={() => {
                setMenuOpen(false);
                option.run();
              }}
              style={styles.menuItem}>
              <Icon
                name={option.icon}
                size={20}
                color={option.danger ? 'danger' : 'ink'}
              />
              <Txt
                color={option.danger ? 'danger' : 'ink'}
                style={styles.menuText}>
                {option.label}
              </Txt>
            </Pressable>
          ))}
        </View>
      ) : null}

      <View style={styles.book}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${book.title}, ${book.author}`}
          onPress={() => onOpenBook(book.id)}
          style={styles.bookMain}>
          <BookCover book={book} size={68} />
          <View style={styles.bookText}>
            <Txt variant="bookTitle" numberOfLines={2}>
              {book.title}
            </Txt>
            <Txt variant="caption" style={styles.author}>
              {subtitle}
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
        {wants && !myStatus ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Add ${book.title}`}
            onPress={() => library.setStatus(book.id, 'want')}
            style={[styles.addPill, {backgroundColor: colors.segment}]}>
            <Txt variant="caption" color="ink" weight="semibold">
              Add
            </Txt>
          </Pressable>
        ) : null}
      </View>

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
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={commentLabel}
          onPress={() => onOpenThread(item.id)}
          style={styles.action}>
          <Icon name="comment" size={20} color="graphite" />
          <Txt variant="caption" style={styles.count}>
            {String(comments.length)}
          </Txt>
        </Pressable>
        <View style={styles.spacer} />
        {item.by === ME || (wants && !myStatus) ? null : myStatus ? (
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

      {preview.length ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`View ${commentLabel}`}
          onPress={() => onOpenThread(item.id)}
          style={[styles.replies, {borderTopColor: colors.hairline}]}>
          {preview.map((reply, i) => (
            <Txt
              key={reply.id}
              variant="caption"
              color="ink"
              style={i > 0 && styles.reply}>
              <Txt variant="caption" color="ink" weight="semibold">
                {firstName(reply.by)}
              </Txt>{' '}
              <Txt variant="caption">{reply.body}</Txt>
            </Txt>
          ))}
        </Pressable>
      ) : null}
    </Card>
  );
};

const styles = StyleSheet.create({
  more: {marginRight: -10},
  menu: {
    position: 'absolute',
    right: 16,
    top: 56,
    width: 210,
    borderRadius: 16,
    paddingVertical: 4,
    zIndex: 5,
    elevation: 8,
    shadowColor: '#1B1B19',
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: {width: 0, height: 12},
  },
  menuEdge: {borderWidth: 1},
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 46,
    paddingHorizontal: 16,
  },
  menuText: {marginLeft: 12, fontSize: 14.5},
  addPill: {
    marginLeft: 12,
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 22,
    justifyContent: 'center',
  },
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
  bookMain: {flex: 1, flexDirection: 'row', alignItems: 'center'},
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
