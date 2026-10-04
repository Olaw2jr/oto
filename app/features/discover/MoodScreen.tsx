import React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';

import {BookCover} from '../../components/BookCover';
import {formatDuration} from '../../data/format';
import {booksForMood, moodRules} from '../../data/moods';
import {RootStackScreenProps} from '../../navigator/types';
import {useTheme} from '../../theme/ThemeProvider';
import {EmptyState, IconButton, Screen, Txt} from '../../ui';

const MoodScreen = ({navigation, route}: RootStackScreenProps<'Mood'>) => {
  const {colors} = useTheme();
  const {mood} = route.params;
  const books = booksForMood(mood);

  return (
    <Screen scroll>
      <View style={styles.bar}>
        <IconButton
          icon="back"
          label="Back"
          onPress={() => navigation.goBack()}
        />
      </View>
      <Txt variant="display">{mood}</Txt>
      <Txt color="graphite" style={styles.description}>
        {moodRules[mood]?.description}
      </Txt>
      {books.length ? (
        books.map(book => (
          <Pressable
            key={book.id}
            accessibilityRole="button"
            accessibilityLabel={`${book.title}, ${
              book.author
            }, ${formatDuration(book.durationSec)}`}
            onPress={() => navigation.navigate('Book', {bookId: book.id})}
            style={[styles.row, {borderBottomColor: colors.hairline}]}>
            <BookCover book={book} size={64} />
            <View style={styles.rowText}>
              <Txt variant="strong" numberOfLines={1}>
                {book.title}
              </Txt>
              <Txt variant="caption">{`${book.author} · ${formatDuration(
                book.durationSec,
              )}`}</Txt>
            </View>
          </Pressable>
        ))
      ) : (
        <EmptyState
          title="Nothing for this mood yet."
          body="Try another mood, or search for something specific."
        />
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  bar: {flexDirection: 'row', marginHorizontal: -10},
  description: {marginTop: 6, marginBottom: 8},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 84,
    borderBottomWidth: 1,
  },
  rowText: {flex: 1, marginLeft: 14},
});

export default MoodScreen;
