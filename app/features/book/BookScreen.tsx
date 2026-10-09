import React, {useState} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';

import {AuthorLinks} from '../../components/AuthorLinks';
import {BookCover} from '../../components/BookCover';
import {LoadingState} from '../../components/LoadingState';
import {DownloadControl} from '../../components/DownloadControl';
import {ReviewCard} from '../../components/ReviewCard';
import {getBook} from '../../data/catalogue';
import {formatDuration} from '../../data/format';
import {firstName, getPerson} from '../../data/people';
import {listeners, Status} from '../../data/social';
import {openPerson} from '../../navigator/openPerson';
import {RootStackScreenProps} from '../../navigator/types';
import {useBookReviews} from '../../state/reviews';
import {useFirstLoad} from '../../state/firstLoad';
import {useLibrary} from '../../state/library';
import {usePlayer} from '../../state/player';
import {shareBook} from '../../utils/share';
import {
  Avatar,
  Button,
  Icon,
  IconButton,
  Screen,
  Segmented,
  Sheet,
  SheetRow,
  TextLink,
  Txt,
} from '../../ui';

const statusOptions: {value: Status; label: string}[] = [
  {value: 'want', label: 'Want to listen'},
  {value: 'listening', label: 'Listening'},
  {value: 'finished', label: 'Finished'},
];

// Reviews shown on the book before See all.
const REVIEW_PREVIEW = 2;

const listenersLine = (bookId: string) => {
  const entry = listeners[bookId];
  if (!entry) {
    return null;
  }
  const named = entry.people.slice(0, 2).map(firstName);
  const others = entry.people.length - named.length + entry.others;
  const names =
    others > 0
      ? `${named.join(', ')} and ${others} others`
      : named.join(' and ');
  return {
    people: entry.people,
    text: `${names} ${
      entry.people.length + entry.others === 1 ? 'is' : 'are'
    } listening`,
  };
};

const BookScreen = ({navigation, route}: RootStackScreenProps<'Book'>) => {
  const book = getBook(route.params.bookId);
  const [moreOpen, setMoreOpen] = useState(false);
  const loading = useFirstLoad(`book:${book.id}`);
  const library = useLibrary();
  const player = usePlayer();
  const position = library.positionSec(book.id);
  const status = library.status(book.id);
  const following = listenersLine(book.id);
  const bookReviews = useBookReviews(book.id);

  const listen = () => {
    player.play(book.id);
    navigation.navigate('Player');
  };

  if (loading) {
    return (
      <Screen>
        <View style={styles.bar}>
          <IconButton
            icon="back"
            label="Back"
            onPress={() => navigation.goBack()}
          />
        </View>
        <LoadingState message={'Opening the book'} layout="detail" />
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <View style={styles.bar}>
        <IconButton
          icon="back"
          label="Back"
          onPress={() => navigation.goBack()}
        />
        <View style={styles.barRight}>
          <IconButton
            icon="bookmark"
            label="Save to a list"
            onPress={() =>
              navigation.navigate('SaveToShelf', {bookId: book.id})
            }
          />
          <IconButton
            icon="more"
            label="More"
            onPress={() => setMoreOpen(true)}
          />
        </View>
      </View>

      <View style={styles.cover}>
        <BookCover book={book} size={172} radius={12} decorative={false} />
      </View>

      <View style={styles.titleBlock}>
        <Txt variant="display" align="center" style={styles.title}>
          {book.title}
        </Txt>
        <View style={styles.author}>
          <AuthorLinks
            author={book.author}
            center
            onOpen={name => navigation.navigate('Author', {name})}
          />
        </View>
        <Txt variant="caption" align="center" style={styles.meta}>
          {`${book.rating.toFixed(1)} · ${book.ratingsCount.toLocaleString(
            'en-US',
          )} ratings · ${formatDuration(book.durationSec)}`}
        </Txt>
      </View>

      <View style={styles.actions}>
        <Button
          icon="play"
          label={
            position > 0 && status !== 'finished'
              ? `Resume · ${formatDuration(position)} in`
              : 'Listen'
          }
          onPress={listen}
          stretch
        />
        <View style={styles.share}>
          <IconButton
            icon="share"
            label="Share"
            size={52}
            background="segment"
            onPress={() => shareBook(book)}
          />
        </View>
      </View>

      <DownloadControl bookId={book.id} />

      <View style={styles.status}>
        <Segmented
          label="Your status"
          options={statusOptions}
          value={status}
          onChange={value => library.setStatus(book.id, value)}
        />
      </View>

      {following ? (
        <View style={styles.listeners}>
          <View style={styles.faces}>
            {following.people.map((id, i) => (
              <View key={id} style={i > 0 && styles.overlap}>
                <Avatar name={getPerson(id).name} size={30} ring />
              </View>
            ))}
          </View>
          <Txt variant="caption" style={styles.listenersText}>
            {following.text}
          </Txt>
        </View>
      ) : null}

      {bookReviews.length ? (
        <>
          <View style={styles.sectionHead}>
            <Txt variant="heading" style={styles.sectionHeading}>
              From people you follow
            </Txt>
            {bookReviews.length > REVIEW_PREVIEW ? (
              <TextLink
                label="See all"
                accessibilityLabel={`See all ${bookReviews.length} reviews`}
                onPress={() =>
                  navigation.navigate('Reviews', {bookId: book.id})
                }
              />
            ) : null}
          </View>
          {bookReviews.slice(0, REVIEW_PREVIEW).map(review => (
            <ReviewCard
              key={review.id}
              review={review}
              onOpenPerson={id => openPerson(navigation, id)}
            />
          ))}
        </>
      ) : null}

      <Pressable
        accessibilityRole="link"
        accessibilityLabel="About this book"
        onPress={() => navigation.navigate('BookDetails', {bookId: book.id})}
        style={styles.about}>
        <Txt variant="strong" weight="semibold">
          About this book
        </Txt>
        <Icon name="forward" size={18} color="graphite" />
      </Pressable>
      <Sheet
        visible={moreOpen}
        title={book.title}
        onClose={() => setMoreOpen(false)}>
        <SheetRow
          icon="share"
          label="Share"
          onPress={() => {
            setMoreOpen(false);
            shareBook(book);
          }}
        />
        <SheetRow
          icon="bookmark"
          label="Save to a list"
          onPress={() => {
            setMoreOpen(false);
            navigation.navigate('SaveToShelf', {bookId: book.id});
          }}
        />
        <SheetRow
          icon="book"
          label="Details"
          onPress={() => {
            setMoreOpen(false);
            navigation.navigate('BookDetails', {bookId: book.id});
          }}
        />
      </Sheet>
    </Screen>
  );
};

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: -10,
  },
  barRight: {flexDirection: 'row'},
  cover: {alignItems: 'center', marginTop: 6},
  titleBlock: {marginTop: 22},
  title: {lineHeight: 38},
  author: {marginTop: 2},
  meta: {marginTop: 6},
  actions: {flexDirection: 'row', marginTop: 20},
  share: {marginLeft: 10},
  status: {marginTop: 14},
  listeners: {flexDirection: 'row', alignItems: 'center', marginTop: 16},
  faces: {flexDirection: 'row', paddingLeft: 2},
  overlap: {marginLeft: -8},
  listenersText: {flex: 1, marginLeft: 12},
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  sectionTitle: {fontSize: 19, marginTop: 20},
  about: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    marginTop: 14,
  },
  sectionHeading: {fontSize: 19},
});

export default BookScreen;
