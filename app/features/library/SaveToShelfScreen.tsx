import React, {useState} from 'react';
import {Platform, Pressable, StyleSheet, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {BookCover} from '../../components/BookCover';
import {getBook} from '../../data/catalogue';
import {RootStackScreenProps} from '../../navigator/types';
import {useLibrary} from '../../state/library';
import {useTheme} from '../../theme/ThemeProvider';
import {Icon, TextLink, Txt} from '../../ui';
import {NewShelfForm} from './NewShelfForm';

const SaveToShelfScreen = ({
  navigation,
  route,
}: RootStackScreenProps<'SaveToShelf'>) => {
  const {colors} = useTheme();
  const insets = useSafeAreaInsets();
  const library = useLibrary();
  const book = getBook(route.params.bookId);
  const [creating, setCreating] = useState(false);
  const shelves = library.shelves.filter(s => s.custom);

  return (
    <View
      style={[
        styles.sheet,
        {
          backgroundColor: colors.paper,
          paddingTop: (Platform.OS === 'android' ? insets.top : 0) + 8,
        },
      ]}>
      <View style={[styles.handle, {backgroundColor: colors.switchOff}]} />
      <View style={styles.header}>
        <View style={styles.headerSide} />
        <Txt variant="heading" style={styles.title}>
          Save to a list
        </Txt>
        <TextLink
          label="Done"
          role="button"
          onPress={() => navigation.goBack()}
        />
      </View>

      <View style={styles.book}>
        <BookCover book={book} size={48} />
        <Txt variant="strong" numberOfLines={1} style={styles.bookTitle}>
          {book.title}
        </Txt>
      </View>

      {shelves.map(shelf => {
        const on = shelf.bookIds.includes(book.id);
        return (
          <Pressable
            key={shelf.id}
            accessibilityRole="checkbox"
            accessibilityLabel={shelf.name}
            accessibilityState={{checked: on}}
            onPress={() => library.toggleOnShelf(shelf.id, book.id)}
            style={[styles.row, {borderBottomColor: colors.hairline}]}>
            <Txt>{shelf.name}</Txt>
            <View
              style={[
                styles.box,
                {borderColor: colors.ink},
                on && {backgroundColor: colors.ink},
              ]}>
              {on ? (
                <Icon name="check" size={16} color="onInk" strokeWidth={2.4} />
              ) : null}
            </View>
          </Pressable>
        );
      })}

      {creating ? (
        <NewShelfForm
          onCancel={() => setCreating(false)}
          onCreate={name => {
            library.createShelf(name, book.id);
            setCreating(false);
          }}
        />
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="New shelf"
          onPress={() => setCreating(true)}
          style={styles.newRow}>
          <Icon name="plus" size={20} />
          <Txt weight="semibold" style={styles.newText}>
            New shelf
          </Txt>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  sheet: {flex: 1, paddingHorizontal: 20},
  handle: {width: 38, height: 5, borderRadius: 3, alignSelf: 'center'},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    marginTop: 2,
  },
  headerSide: {width: 48},
  title: {fontSize: 19},
  book: {flexDirection: 'row', alignItems: 'center', marginVertical: 12},
  bookTitle: {flex: 1, marginLeft: 12},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
    borderBottomWidth: 1,
  },
  box: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newRow: {flexDirection: 'row', alignItems: 'center', minHeight: 52},
  newText: {marginLeft: 10},
});

export default SaveToShelfScreen;
