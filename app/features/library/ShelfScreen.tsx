import React, {useState} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';

import {BookCover} from '../../components/BookCover';
import {getBook} from '../../data/catalogue';
import {RootStackScreenProps} from '../../navigator/types';
import {useLibrary} from '../../state/library';
import {useTheme} from '../../theme/ThemeProvider';
import {
  Button,
  EmptyState,
  IconButton,
  Screen,
  Sheet,
  SheetRow,
  TextField,
  Txt,
} from '../../ui';

const ShelfScreen = ({navigation, route}: RootStackScreenProps<'Shelf'>) => {
  const {colors} = useTheme();
  const library = useLibrary();
  const shelf = library.shelf(route.params.shelfId);
  const books = (shelf?.bookIds ?? []).map(getBook);
  // Want to listen and Finished follow your listening status; only shelves
  // you made can be edited.
  const editable = Boolean(shelf?.custom);
  const [sheet, setSheet] = useState<'options' | 'rename' | 'delete' | null>(
    null,
  );
  const [name, setName] = useState(shelf?.name ?? '');

  return (
    <Screen scroll>
      <View style={styles.bar}>
        <IconButton
          icon="back"
          label="Back"
          onPress={() => navigation.goBack()}
        />
        {editable ? (
          <IconButton
            icon="more"
            label="Shelf options"
            onPress={() => setSheet('options')}
          />
        ) : null}
      </View>
      <Txt variant="display">{shelf?.name ?? 'Shelf'}</Txt>

      {books.length ? (
        books.map(book => (
          <View
            key={book.id}
            style={[styles.row, {borderBottomColor: colors.hairline}]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${book.title}, ${book.author}`}
              onPress={() => navigation.navigate('Book', {bookId: book.id})}
              style={styles.open}>
              <BookCover book={book} size={64} />
              <View style={styles.rowText}>
                <Txt variant="strong" numberOfLines={1}>
                  {book.title}
                </Txt>
                <Txt variant="caption">{book.author}</Txt>
              </View>
            </Pressable>
            {editable && shelf ? (
              <IconButton
                icon="close"
                label={`Remove ${book.title} from ${shelf.name}`}
                onPress={() => library.toggleOnShelf(shelf.id, book.id)}
              />
            ) : null}
          </View>
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

      <Sheet
        visible={sheet === 'options'}
        title={shelf?.name ?? 'Shelf'}
        onClose={() => setSheet(null)}>
        <SheetRow
          label="Rename"
          onPress={() => {
            setName(shelf?.name ?? '');
            setSheet('rename');
          }}
        />
        <SheetRow label="Delete shelf" onPress={() => setSheet('delete')} />
      </Sheet>

      <Sheet
        visible={sheet === 'rename'}
        title="Rename shelf"
        onClose={() => setSheet(null)}>
        <TextField
          label="Shelf name"
          value={name}
          onChangeText={setName}
          autoFocus
        />
        <Button
          label="Save"
          disabled={!name.trim()}
          onPress={() => {
            if (shelf) library.renameShelf(shelf.id, name);
            setSheet(null);
          }}
        />
      </Sheet>

      <Sheet
        visible={sheet === 'delete'}
        title="Delete shelf"
        onClose={() => setSheet(null)}>
        <Txt style={styles.confirm}>
          {`Delete ${shelf?.name ?? 'this shelf'}? The books stay in your library.`}
        </Txt>
        <Button
          label="Delete"
          onPress={() => {
            setSheet(null);
            if (shelf) library.deleteShelf(shelf.id);
            navigation.goBack();
          }}
        />
        <View style={styles.cancel}>
          <Button
            label="Cancel"
            kind="secondary"
            onPress={() => setSheet(null)}
          />
        </View>
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 84,
    borderBottomWidth: 1,
  },
  open: {flex: 1, flexDirection: 'row', alignItems: 'center'},
  rowText: {flex: 1, marginLeft: 14},
  confirm: {marginBottom: 16},
  cancel: {marginTop: 10},
});

export default ShelfScreen;
