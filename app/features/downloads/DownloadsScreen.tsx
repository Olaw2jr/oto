import React from 'react';
import {StyleSheet, View} from 'react-native';

import {BookCover} from '../../components/BookCover';
import {getBook} from '../../data/catalogue';
import {RootStackScreenProps} from '../../navigator/types';
import {formatMegabytes, useDownloadedBooks} from '../../state/downloads';
import {useTheme} from '../../theme/ThemeProvider';
import {EmptyState, IconButton, Screen, Txt} from '../../ui';

const label = (state: string, percent: number, bytes: number) =>
  state === 'completed'
    ? `Downloaded · ${formatMegabytes(bytes)}`
    : state === 'paused'
    ? 'Waiting for Wi-Fi'
    : state === 'failed'
    ? 'Download failed'
    : `Downloading · ${percent}%`;

// Books saved for offline listening.
const DownloadsScreen = ({navigation}: RootStackScreenProps<'Downloads'>) => {
  const {colors} = useTheme();
  const {entries, remove} = useDownloadedBooks();

  return (
    <Screen scroll>
      <View style={styles.bar}>
        <IconButton icon="back" label="Back" onPress={() => navigation.goBack()} />
      </View>
      <Txt variant="display">Downloads</Txt>
      {entries.length ? (
        entries.map(({bookId, status}) => {
          const book = getBook(bookId);
          const percent = status.totalBytes
            ? Math.floor((status.bytesDownloaded / status.totalBytes) * 100)
            : 0;
          return (
            <View key={bookId} style={[styles.row, {borderBottomColor: colors.hairline}]}>
              <BookCover book={book} size={56} />
              <View style={styles.text}>
                <Txt variant="strong" numberOfLines={1}>
                  {book.title}
                </Txt>
                <Txt variant="caption">
                  {label(status.state, percent, status.totalBytes)}
                </Txt>
              </View>
              <IconButton
                icon="close"
                label={`Remove ${book.title}`}
                onPress={() => remove(bookId)}
              />
            </View>
          );
        })
      ) : (
        <EmptyState
          title="Nothing downloaded yet."
          body="Download a book from its page to listen without a connection."
        />
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  bar: {flexDirection: 'row', marginHorizontal: -10},
  row: {flexDirection: 'row', alignItems: 'center', minHeight: 76, borderBottomWidth: 1},
  text: {flex: 1, marginLeft: 14},
});

export default DownloadsScreen;
