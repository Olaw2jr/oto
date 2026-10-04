import React, {useState} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';

import {BookCover} from '../../components/BookCover';
import {catalogue, CatalogueBook} from '../../data/catalogue';
import {formatDuration} from '../../data/format';
import {editorsPicks} from '../../data/social';
import {RootStackScreenProps} from '../../navigator/types';
import {useLibrary} from '../../state/library';
import {useTheme} from '../../theme/ThemeProvider';
import {Icon, IconButton, Screen, Txt} from '../../ui';

const tabs = ['New releases', 'Top rated', "Editors' picks"] as const;
type Tab = typeof tabs[number];

// Source dates are MM-DD-YY.
const releaseKey = (book: CatalogueBook) => {
  const [m, d, y] = book.released.split('-').map(Number);
  return y * 10000 + m * 100 + d;
};

const listFor = (tab: Tab) =>
  tab === 'New releases'
    ? [...catalogue].sort((a, b) => releaseKey(b) - releaseKey(a))
    : tab === 'Top rated'
    ? [...catalogue].sort((a, b) => b.rating - a.rating)
    : editorsPicks.map(id => catalogue.find(b => b.id === id)!);

const CatalogScreen = ({navigation}: RootStackScreenProps<'Catalog'>) => {
  const {colors} = useTheme();
  const library = useLibrary();
  const [tab, setTab] = useState<Tab>('New releases');

  return (
    <Screen scroll>
      <View style={styles.bar}>
        <IconButton
          icon="back"
          label="Back"
          onPress={() => navigation.goBack()}
        />
      </View>
      <Txt variant="display">Audiobooks</Txt>
      <View style={styles.tabs}>
        {tabs.map(t => {
          const selected = t === tab;
          return (
            <Pressable
              key={t}
              accessibilityRole="button"
              accessibilityLabel={t}
              accessibilityState={{selected}}
              onPress={() => setTab(t)}
              style={styles.tab}>
              <Txt
                color={selected ? 'ink' : 'graphite'}
                weight={selected ? 'semibold' : 'medium'}>
                {t}
              </Txt>
              <View
                style={[styles.dot, selected && {backgroundColor: colors.kaki}]}
              />
            </Pressable>
          );
        })}
      </View>

      {listFor(tab).map(book => {
        const wanted = library.status(book.id) !== undefined;
        return (
          <View
            key={book.id}
            style={[styles.row, {borderBottomColor: colors.hairline}]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Open ${book.title}`}
              onPress={() => navigation.navigate('Book', {bookId: book.id})}
              style={styles.rowMain}>
              <BookCover book={book} size={64} />
              <View style={styles.rowText}>
                <Txt variant="strong" numberOfLines={1}>
                  {book.title}
                </Txt>
                <Txt variant="caption" numberOfLines={1}>
                  {book.author}
                </Txt>
                <View style={styles.meta}>
                  <Icon name="starFilled" size={12} />
                  <Txt
                    variant="small"
                    style={styles.metaText}
                    numberOfLines={1}>
                    {`${book.rating.toFixed(1)} · ${formatDuration(
                      book.durationSec,
                    )} · ${book.genres[0]}`}
                  </Txt>
                </View>
              </View>
            </Pressable>
            <IconButton
              icon={wanted ? 'check' : 'plus'}
              label={
                wanted
                  ? `${book.title} is in your library`
                  : `Add ${book.title} to want to listen`
              }
              onPress={() => !wanted && library.setStatus(book.id, 'want')}
            />
          </View>
        );
      })}
    </Screen>
  );
};

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: -10,
  },
  tabs: {flexDirection: 'row', marginTop: 2, marginBottom: 6},
  tab: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 22,
  },
  dot: {width: 6, height: 6, borderRadius: 3, marginTop: 4},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 84,
    borderBottomWidth: 1,
  },
  rowMain: {flex: 1, flexDirection: 'row', alignItems: 'center'},
  rowText: {flex: 1, marginLeft: 14},
  meta: {flexDirection: 'row', alignItems: 'center', marginTop: 3},
  metaText: {marginLeft: 4, flex: 1},
});

export default CatalogScreen;
