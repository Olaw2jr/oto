import React, {useState} from 'react';
import {Pressable, ScrollView, StyleSheet, View} from 'react-native';

import {BookCover} from '../../components/BookCover';
import {LoadingState} from '../../components/LoadingState';
import {chapterAt, getBook} from '../../data/catalogue';
import {getPerson, ME} from '../../data/people';
import {listeningDays, profileStats, Status} from '../../data/social';
import {TabScreenProps} from '../../navigator/types';
import {useLibrary} from '../../state/library';
import {useFirstLoad} from '../../state/firstLoad';
import {useTheme} from '../../theme/ThemeProvider';
import {
  Avatar,
  Card,
  EmptyState,
  IconButton,
  ProgressBar,
  Screen,
  Segmented,
  TextLink,
  Txt,
} from '../../ui';

const shelves: {value: Status; label: string}[] = [
  {value: 'listening', label: 'Listening'},
  {value: 'want', label: 'Want'},
  {value: 'finished', label: 'Finished'},
];

const Stat = ({value, label}: {value: number; label: string}) => (
  <View accessible accessibilityLabel={`${value} ${label}`} style={styles.stat}>
    <Txt variant="title">{String(value)}</Txt>
    <Txt variant="small">{label}</Txt>
  </View>
);

const YouScreen = ({navigation}: TabScreenProps<'You'>) => {
  const loading = useFirstLoad('you');
  const {colors} = useTheme();
  const library = useLibrary();
  const me = getPerson(ME);
  const [shelf, setShelf] = useState<Status>('listening');
  const books = library.byStatus(shelf).map(getBook);
  const daysListened = listeningDays.slice(0, -1).filter(Boolean).length;

  if (loading) {
    return (
      <Screen>
        <LoadingState message={'Gathering your shelves'} layout="tiles" />
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Avatar name={me.name} size={68} />
        <View style={styles.headerText}>
          <Txt variant="title">{me.name}</Txt>
          <Txt variant="caption" style={styles.handle}>
            {`@${me.handle} · ${me.city}`}
          </Txt>
        </View>
        <IconButton
          icon="settings"
          label="Settings"
          background="segment"
          onPress={() => navigation.navigate('Settings')}
        />
      </View>

      <View style={styles.stats}>
        <Stat value={library.byStatus('listening').length} label="Listening" />
        <Stat value={profileStats.finished} label="Finished" />
        <Stat value={profileStats.clubs} label="Clubs" />
        <Stat value={profileStats.following} label="Following" />
      </View>

      <Card style={styles.weeks}>
        <View style={styles.weeksHead}>
          <Txt variant="label">Last five weeks</Txt>
          <Txt variant="caption" color="ink" weight="semibold">
            {`${daysListened} days listened`}
          </Txt>
        </View>
        <View
          accessible
          accessibilityLabel={`Listened on ${daysListened} of the last ${listeningDays.length} days`}
          style={styles.dots}>
          {listeningDays.map((listened, i) => {
            const today = i === listeningDays.length - 1;
            return (
              <View key={i} style={styles.dotCell}>
                <View
                  style={[
                    styles.dot,
                    {
                      backgroundColor: today
                        ? colors.kaki
                        : listened
                        ? colors.ink
                        : colors.track,
                    },
                  ]}
                />
              </View>
            );
          })}
        </View>
      </Card>

      <View style={styles.shelfHead}>
        <Txt variant="heading">Shelves</Txt>
        <TextLink
          label="Library"
          onPress={() => navigation.navigate('Library')}
        />
      </View>
      <View style={styles.shelf}>
        <Segmented
          label="Shelf"
          options={shelves}
          value={shelf}
          onChange={setShelf}
        />
      </View>

      {books.length ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.books}>
          {books.map(book => {
            const progress = library.progress(book.id);
            const position = library.positionSec(book.id);
            const detail =
              shelf === 'listening'
                ? `${Math.round(progress * 100)}% · Ch. ${chapterAt(
                    book,
                    position,
                  )}`
                : book.author;
            return (
              <Pressable
                key={book.id}
                accessibilityRole="button"
                accessibilityLabel={`${book.title}, ${detail}`}
                onPress={() => navigation.navigate('Book', {bookId: book.id})}
                style={styles.book}>
                <BookCover book={book} size={108} />
                {shelf === 'listening' ? (
                  <View style={styles.bookProgress}>
                    <ProgressBar
                      value={progress}
                      height={3}
                      label={`${book.title} progress`}
                    />
                  </View>
                ) : null}
                <Txt
                  variant="caption"
                  color="ink"
                  weight="semibold"
                  numberOfLines={2}
                  style={styles.bookTitle}>
                  {book.title}
                </Txt>
                <Txt variant="small" numberOfLines={1}>
                  {detail}
                </Txt>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : (
        <EmptyState
          title="Nothing here yet."
          body="Add books you would like to hear later, and they will wait for you here."
          action={{
            label: 'Find a book',
            onPress: () => navigation.navigate('Discover'),
          }}
        />
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  header: {flexDirection: 'row', alignItems: 'center', height: 72},
  headerText: {flex: 1, marginLeft: 16},
  handle: {fontSize: 13.5, marginTop: 2},
  stats: {flexDirection: 'row', marginTop: 18},
  stat: {flex: 1, alignItems: 'center'},
  weeks: {
    marginTop: 18,
    paddingTop: 16,
    paddingHorizontal: 18,
    paddingBottom: 8,
  },
  weeksHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  dots: {flexDirection: 'row', flexWrap: 'wrap', marginTop: 14},
  dotCell: {width: `${100 / 7}%`, alignItems: 'center', marginBottom: 10},
  dot: {width: 12, height: 12, borderRadius: 6},
  shelfHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  shelf: {marginTop: 4},
  books: {marginTop: 16, marginHorizontal: -20, paddingHorizontal: 20},
  book: {width: 108, marginRight: 13},
  bookProgress: {marginTop: 8, flexDirection: 'row'},
  bookTitle: {marginTop: 7},
});

export default YouScreen;
