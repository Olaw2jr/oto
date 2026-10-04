import React, {useState} from 'react';
import {Pressable, ScrollView, StyleSheet, View} from 'react-native';
import Svg, {Circle, Path} from 'react-native-svg';

import {BookCover} from '../../components/BookCover';
import {LoadingState} from '../../components/LoadingState';
import {catalogue, CatalogueBook, getBook} from '../../data/catalogue';
import {filterRules} from '../../data/moods';
import {picksForTaste} from '../../data/taste';
import {discoverFilters, moods, trending} from '../../data/social';
import {TabScreenProps} from '../../navigator/types';
import {useFirstLoad} from '../../state/firstLoad';
import {useLibrary} from '../../state/library';
import {useTaste} from '../../state/taste';
import {useTheme} from '../../theme/ThemeProvider';
import {Chip, Icon, IconButton, Screen, Txt} from '../../ui';

const MoodGlyph = ({shape, color}: {shape: string; color: string}) => (
  <Svg width={26} height={26} viewBox="0 0 26 26">
    {shape === 'circle' ? (
      <Circle
        cx={13}
        cy={13}
        r={10}
        fill="none"
        stroke={color}
        strokeWidth={1.6}
      />
    ) : shape === 'arc' ? (
      <Path
        d="M3 18a10 10 0 0 1 20 0z"
        fill="none"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
    ) : shape === 'dots' ? (
      <>
        <Circle cx={5} cy={13} r={2.2} fill={color} />
        <Circle cx={13} cy={13} r={2.2} fill={color} />
        <Circle cx={21} cy={13} r={2.2} fill={color} />
      </>
    ) : (
      <Path
        d="M21 15.5A9 9 0 0 1 10.5 5a9 9 0 1 0 10.5 10.5z"
        fill="none"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
    )}
  </Svg>
);

const BookRow = ({
  book,
  rank,
  note,
  onPress,
}: {
  book: CatalogueBook;
  rank?: number;
  note?: string;
  onPress: () => void;
}) => {
  const library = useLibrary();
  const wanted = library.status(book.id) !== undefined;

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={[
          rank ? `${rank}. ${book.title}` : book.title,
          book.author,
          note,
        ]
          .filter(Boolean)
          .join(', ')}
        onPress={onPress}
        style={styles.rowMain}>
        {rank ? (
          <Txt variant="title" color="graphite" style={styles.rank}>
            {String(rank)}
          </Txt>
        ) : null}
        <BookCover book={book} size={62} />
        <View style={styles.rowText}>
          <Txt variant="strong" numberOfLines={1}>
            {book.title}
          </Txt>
          <Txt variant="caption" numberOfLines={1}>
            {book.author}
          </Txt>
          {note ? (
            <Txt variant="small" style={styles.note} numberOfLines={1}>
              {note}
            </Txt>
          ) : null}
        </View>
      </Pressable>
      <IconButton
        icon={wanted ? 'check' : 'plus'}
        label={
          wanted
            ? `${book.title} is on your want list`
            : `Add ${book.title} to want to listen`
        }
        onPress={() => !wanted && library.setStatus(book.id, 'want')}
      />
    </View>
  );
};

const DiscoverScreen = ({navigation}: TabScreenProps<'Discover'>) => {
  const {colors} = useTheme();
  const [filter, setFilter] = useState(discoverFilters[0]);
  const openBook = (id: string) => navigation.navigate('Book', {bookId: id});
  const loading = useFirstLoad('discover');
  const taste = useTaste();
  const picks = picksForTaste(taste.genres, taste.authors);

  return (
    <Screen scroll>
      <Txt variant="display">Discover</Txt>

      {/* Opens the full Search screen. */}
      <Pressable
        accessibilityRole="search"
        accessibilityLabel="Search"
        onPress={() => navigation.navigate('Search')}
        style={[styles.search, {backgroundColor: colors.raised}]}>
        <Icon name="search" color="graphite" size={20} />
        <Txt color="graphite" style={styles.searchText}>
          Titles, authors, clubs, people
        </Txt>
      </Pressable>

      {loading ? (
        <LoadingState message="Finding your next listen" layout="tiles" />
      ) : (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chips}
            contentContainerStyle={styles.chipsContent}>
            {discoverFilters.map(f => (
              <Chip
                key={f}
                label={f}
                selected={f === filter}
                onPress={() => setFilter(f)}
              />
            ))}
          </ScrollView>

          {filterRules[filter] ? (
            <>
              <Txt variant="heading" style={styles.heading}>
                {filter}
              </Txt>
              {catalogue.filter(filterRules[filter]).map(book => (
                <BookRow
                  key={book.id}
                  book={book}
                  onPress={() => openBook(book.id)}
                />
              ))}
            </>
          ) : (
            <>
              {picks.length ? (
                <>
                  <Txt variant="heading" style={styles.heading}>
                    Picked for your taste
                  </Txt>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.picks}
                    contentContainerStyle={styles.picksContent}>
                    {picks.slice(0, 8).map(book => (
                      <Pressable
                        key={book.id}
                        accessibilityRole="button"
                        accessibilityLabel={`${book.title}, ${book.author}`}
                        onPress={() => openBook(book.id)}
                        style={styles.pick}>
                        <BookCover book={book} size={108} />
                        <Txt
                          variant="caption"
                          color="ink"
                          weight="semibold"
                          numberOfLines={2}
                          style={styles.pickTitle}>
                          {book.title}
                        </Txt>
                        <Txt variant="small" numberOfLines={1}>
                          {book.author}
                        </Txt>
                      </Pressable>
                    ))}
                  </ScrollView>
                </>
              ) : null}
              <Txt variant="heading" style={styles.heading}>
                Trending with people you follow
              </Txt>
              {trending.map((t, i) => (
                <BookRow
                  key={t.bookId}
                  book={getBook(t.bookId)}
                  rank={i + 1}
                  note={t.note}
                  onPress={() => openBook(t.bookId)}
                />
              ))}
            </>
          )}

          <Txt variant="heading" style={styles.heading}>
            Listen by mood
          </Txt>
          <View style={styles.moods}>
            {moods.map(mood => (
              <Pressable
                key={mood.label}
                accessibilityRole="button"
                accessibilityLabel={mood.label}
                onPress={() => navigation.navigate('Mood', {mood: mood.label})}
                style={[styles.mood, {backgroundColor: colors.raised}]}>
                <Txt style={styles.moodLabel}>{mood.label}</Txt>
                <MoodGlyph shape={mood.shape} color={colors.ink} />
              </Pressable>
            ))}
          </View>
        </>
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 24,
    paddingHorizontal: 16,
    marginTop: 10,
  },
  searchText: {flex: 1, marginLeft: 10},
  chips: {marginTop: 8, marginHorizontal: -20},
  chipsContent: {paddingHorizontal: 17},
  heading: {marginTop: 14, marginBottom: 6},
  picks: {marginHorizontal: -20, marginTop: 8},
  picksContent: {paddingHorizontal: 20},
  pick: {width: 108, marginRight: 13},
  pickTitle: {marginTop: 9},
  row: {flexDirection: 'row', alignItems: 'center', height: 76},
  rowMain: {flex: 1, flexDirection: 'row', alignItems: 'center'},
  rank: {width: 20, textAlign: 'center', marginRight: 14},
  rowText: {flex: 1, marginLeft: 14},
  note: {marginTop: 2},
  moods: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  mood: {
    width: '48.5%',
    height: 74,
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  moodLabel: {fontSize: 16.5, lineHeight: 21, flex: 1},
});

export default DiscoverScreen;
