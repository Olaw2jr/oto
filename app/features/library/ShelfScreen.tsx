import React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';

import {BookCover} from '../../components/BookCover';
import {getBook} from '../../data/catalogue';
import {RootStackScreenProps} from '../../navigator/types';
import {useLibrary} from '../../state/library';
import {useTheme} from '../../theme/ThemeProvider';
import {EmptyState, IconButton, Screen, Txt} from '../../ui';

const ShelfScreen = ({navigation, route}: RootStackScreenProps<'Shelf'>) => {
  const {colors} = useTheme();
  const library = useLibrary();
  const shelf = library.shelf(route.params.shelfId);
  const books = (shelf?.bookIds ?? []).map(getBook);

  return (
    <Screen scroll>
      <View style={styles.bar}>
        <IconButton
          icon="back"
          label="Back"
          onPress={() => navigation.goBack()}
        />
      </View>
      <Txt variant="display">{shelf?.name ?? 'Shelf'}</Txt>

      {books.length ? (
        books.map(book => (
          <Pressable
            key={book.id}
            accessibilityRole="button"
            accessibilityLabel={`${book.title}, ${book.author}`}
            onPress={() => navigation.navigate('Book', {bookId: book.id})}
            style={[styles.row, {borderBottomColor: colors.hairline}]}>
            <BookCover book={book} size={64} />
            <View style={styles.rowText}>
              <Txt variant="strong" numberOfLines={1}>
                {book.title}
              </Txt>
              <Txt variant="caption">{book.author}</Txt>
            </View>
          </Pressable>
        ))
      ) : (
        <EmptyState
          title="Nothing here yet."
          body="Add books you would like to hear later, and they will wait for you here."
          action={{
            label: 'Find a book',
            onPress: () => navigation.navigate('Tabs', {screen: 'Discover'}),
          }}
        />
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  bar: {flexDirection: 'row', marginHorizontal: -10},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 84,
    borderBottomWidth: 1,
  },
  rowText: {flex: 1, marginLeft: 14},
});

export default ShelfScreen;
