import React, {useState} from 'react';
import {Pressable, ScrollView, StyleSheet, View} from 'react-native';

import {BookCover} from '../../components/BookCover';
import {getBook} from '../../data/catalogue';
import {formatDuration} from '../../data/format';
import {RootStackScreenProps} from '../../navigator/types';
import {useLibrary} from '../../state/library';
import {useTheme} from '../../theme/ThemeProvider';
import {Card, Icon, IconButton, ProgressBar, Screen, Txt} from '../../ui';
import {NewShelfForm} from './NewShelfForm';

const countLabel = (n: number) => (n === 1 ? '1 book' : `${n} books`);

const LibraryScreen = ({navigation}: RootStackScreenProps<'Library'>) => {
  const {colors} = useTheme();
  const library = useLibrary();
  const [creating, setCreating] = useState(false);
  const listening = library.byStatus('listening').map(getBook);

  return (
    <Screen scroll>
      <View style={styles.bar}>
        <IconButton
          icon="back"
          label="Back"
          onPress={() => navigation.goBack()}
        />
      </View>
      <Txt variant="display">Library</Txt>

      <Txt variant="heading" style={styles.heading}>
        Currently listening
      </Txt>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.strip}
        contentContainerStyle={styles.stripContent}>
        {listening.map(book => (
          <Pressable
            key={book.id}
            accessibilityRole="button"
            accessibilityLabel={`${book.title}, ${Math.round(
              library.progress(book.id) * 100,
            )}%`}
            onPress={() => navigation.navigate('Book', {bookId: book.id})}>
            <Card style={styles.current}>
              <BookCover book={book} size={82} />
              <View style={styles.currentText}>
                <Txt variant="bookTitle" numberOfLines={2}>
                  {book.title}
                </Txt>
                <Txt variant="small" style={styles.listened}>
                  {`${formatDuration(
                    library.positionSec(book.id),
                  )} of ${formatDuration(book.durationSec)}`}
                </Txt>
                <View style={styles.bar2}>
                  <ProgressBar
                    value={library.progress(book.id)}
                    label={`${book.title} progress`}
                  />
                </View>
              </View>
            </Card>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.shelvesHead}>
        <Txt variant="heading">Shelves</Txt>
        <Txt variant="caption">{`${library.shelves.length} shelves`}</Txt>
      </View>
      <View style={styles.grid}>
        {library.shelves.map(shelf => (
          <Pressable
            key={shelf.id}
            accessibilityRole="button"
            accessibilityLabel={`${shelf.name}, ${countLabel(
              shelf.bookIds.length,
            )}`}
            onPress={() => navigation.navigate('Shelf', {shelfId: shelf.id})}
            style={styles.cell}>
            <Card style={styles.shelf}>
              <View>
                <Txt variant="strong">{shelf.name}</Txt>
                <Txt variant="small">{countLabel(shelf.bookIds.length)}</Txt>
              </View>
              <View style={styles.stack}>
                {shelf.bookIds.slice(0, 3).map((id, i) => (
                  <View
                    key={id}
                    style={[
                      styles.stacked,
                      i > 0 && styles.overlap,
                      {borderColor: colors.surface},
                    ]}>
                    <BookCover
                      book={getBook(id)}
                      size={32}
                      radius={6}
                      raised={false}
                    />
                  </View>
                ))}
              </View>
            </Card>
          </Pressable>
        ))}
        {creating ? null : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="New shelf"
            onPress={() => setCreating(true)}
            style={[
              styles.cell,
              styles.newShelf,
              {borderColor: colors.switchOff},
            ]}>
            <Icon name="plus" size={22} />
            <Txt
              variant="caption"
              color="ink"
              weight="semibold"
              style={styles.newText}>
              New shelf
            </Txt>
          </Pressable>
        )}
      </View>
      {creating ? (
        <NewShelfForm
          onCancel={() => setCreating(false)}
          onCreate={name => {
            library.createShelf(name);
            setCreating(false);
          }}
        />
      ) : null}
    </Screen>
  );
};

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: -10,
  },
  heading: {marginTop: 16, marginBottom: 12},
  strip: {marginHorizontal: -20},
  stripContent: {paddingHorizontal: 20},
  current: {
    width: 300,
    flexDirection: 'row',
    padding: 14,
    borderRadius: 22,
    marginRight: 12,
  },
  currentText: {flex: 1, marginLeft: 14},
  listened: {marginTop: 2},
  bar2: {flexDirection: 'row', marginTop: 10},
  shelvesHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cell: {width: '48.5%', marginBottom: 12},
  shelf: {
    minHeight: 112,
    padding: 14,
    borderRadius: 22,
    justifyContent: 'space-between',
  },
  stack: {flexDirection: 'row', marginTop: 12},
  stacked: {borderWidth: 2, borderRadius: 8},
  overlap: {marginLeft: -10},
  newShelf: {
    minHeight: 112,
    borderRadius: 22,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  newText: {marginTop: 6},
});

export default LibraryScreen;
