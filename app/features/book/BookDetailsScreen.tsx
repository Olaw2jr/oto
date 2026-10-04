import React, {useState} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';

import {BookCover} from '../../components/BookCover';
import {getBook} from '../../data/catalogue';
import {formatDuration} from '../../data/format';
import {RootStackScreenProps} from '../../navigator/types';
import {useLibrary} from '../../state/library';
import {useTheme} from '../../theme/ThemeProvider';
import {
  Button,
  Icon,
  IconButton,
  IconName,
  Screen,
  StarRating,
  Txt,
} from '../../ui';

const Fact = ({
  icon,
  value,
  label,
}: {
  icon: IconName;
  value: string;
  label: string;
}) => (
  <View accessible accessibilityLabel={label} style={styles.fact}>
    <Icon name={icon} size={22} color="graphite" />
    <Txt
      variant="caption"
      color="ink"
      weight="semibold"
      style={styles.factText}>
      {value}
    </Txt>
  </View>
);

const BookDetailsScreen = ({
  navigation,
  route,
}: RootStackScreenProps<'BookDetails'>) => {
  const {colors} = useTheme();
  const library = useLibrary();
  const book = getBook(route.params.bookId);
  const [expanded, setExpanded] = useState(false);
  const myRating = library.rating(book.id);

  const rows: [string, string][] = [
    ['Author', book.author],
    ['Narrator', book.narrator],
    ...(book.series ? ([['Series', book.series]] as [string, string][]) : []),
    ['Language', book.language],
  ];

  return (
    <Screen
      scroll
      footer={
        <View style={[styles.footer, {borderTopColor: colors.hairline}]}>
          <Button
            label="Write a review"
            onPress={() =>
              navigation.navigate('UpdateCompose', {bookId: book.id})
            }
          />
        </View>
      }>
      <View style={styles.bar}>
        <IconButton
          icon="back"
          label="Back"
          onPress={() => navigation.goBack()}
        />
        <Txt variant="heading" style={styles.barTitle}>
          Details
        </Txt>
        <View style={styles.barSpacer} />
      </View>

      <View style={styles.head}>
        <BookCover book={book} size={76} />
        <View style={styles.headText}>
          <Txt variant="title" accessibilityRole="header">
            {book.title}
          </Txt>
          <Txt variant="caption" color="ink" style={styles.author}>
            {book.author}
          </Txt>
          <Txt variant="small">{`Narrated by ${book.narrator}`}</Txt>
        </View>
      </View>

      <View style={[styles.facts, {borderColor: colors.hairline}]}>
        <Fact
          icon="clock"
          value={formatDuration(book.durationSec)}
          label={`Length ${formatDuration(book.durationSec)}`}
        />
        <Fact
          icon="calendar"
          value={String(book.releasedYear)}
          label={`Released ${book.releasedYear}`}
        />
        <Fact
          icon="star"
          value={`${book.rating.toFixed(1)} stars`}
          label={`Rated ${book.rating.toFixed(1)} stars`}
        />
      </View>

      <Txt
        variant="quote"
        numberOfLines={expanded ? undefined : 4}
        style={styles.summary}>
        {book.summary}
      </Txt>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={expanded ? 'Show less' : 'Read more'}
        onPress={() => setExpanded(e => !e)}
        style={styles.more}>
        <Txt variant="caption" color="ink" weight="semibold">
          {expanded ? 'Show less' : 'Read more'}
        </Txt>
      </Pressable>

      <View style={styles.chips}>
        {book.genres.map(genre => (
          <Txt
            key={genre}
            variant="caption"
            color="ink"
            weight="medium"
            style={[styles.chip, {backgroundColor: colors.raised}]}>
            {genre}
          </Txt>
        ))}
      </View>

      <View style={styles.rows}>
        {rows.map(([label, value], i) => (
          <View
            key={label}
            accessible
            accessibilityLabel={`${label}, ${value}`}
            style={[
              styles.row,
              i < rows.length - 1 && [
                styles.divider,
                {borderBottomColor: colors.hairline},
              ],
            ]}>
            <Txt variant="caption">{label}</Txt>
            <Txt
              variant="caption"
              color="ink"
              align="right"
              style={styles.rowValue}>
              {value}
            </Txt>
          </View>
        ))}
      </View>

      <View style={styles.rate}>
        <View>
          <Txt variant="heading" style={styles.rateTitle}>
            Rate this book
          </Txt>
          <Txt variant="small">
            {myRating
              ? `You rated it ${myRating} ${myRating === 1 ? 'star' : 'stars'}`
              : 'Tap a star'}
          </Txt>
        </View>
        <View style={styles.stars}>
          <StarRating
            value={myRating}
            onChange={stars => library.setRating(book.id, stars)}
            size={28}
          />
        </View>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: -10,
  },
  barTitle: {fontSize: 18},
  barSpacer: {width: 44},
  head: {flexDirection: 'row', alignItems: 'center', marginTop: 6},
  headText: {flex: 1, marginLeft: 16},
  author: {fontSize: 14, marginTop: 3},
  facts: {
    flexDirection: 'row',
    marginTop: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  fact: {flex: 1, alignItems: 'center'},
  factText: {fontSize: 14, marginTop: 4},
  summary: {fontSize: 16, lineHeight: 25, marginTop: 16},
  more: {minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start'},
  chips: {flexDirection: 'row', flexWrap: 'wrap', marginTop: 4},
  chip: {
    height: 32,
    lineHeight: 32,
    paddingHorizontal: 14,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 8,
    marginBottom: 8,
  },
  rows: {marginTop: 6},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 46,
  },
  divider: {borderBottomWidth: 1},
  rowValue: {flex: 1, marginLeft: 24, fontSize: 14.5},
  rate: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  rateTitle: {fontSize: 18},
  stars: {marginRight: -8},
  footer: {
    borderTopWidth: 1,
    paddingTop: 10,
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
});

export default BookDetailsScreen;
