import React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';

import {chapterAt} from '../data/catalogue';
import {formatRemaining} from '../data/format';
import {usePlayer} from '../state/player';
import {useTheme} from '../theme/ThemeProvider';
import {IconButton, Txt} from '../ui';
import {BookCover} from './BookCover';

export const MiniPlayer = () => {
  const navigation = useNavigation();
  const {colors, colorScheme} = useTheme();
  const {book, position, playing, toggle} = usePlayer();
  const progress = position / book.durationSec;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor:
            colorScheme === 'dark' ? colors.raised : colors.surface,
        },
      ]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open player: ${book.title}, ${
          playing ? 'playing' : 'paused'
        }`}
        onPress={() => navigation.navigate('Player')}
        style={styles.open}>
        <BookCover book={book} size={44} radius={8} raised={false} />
        <View style={styles.text}>
          <Txt variant="strong" numberOfLines={1} style={styles.title}>
            {book.title}
          </Txt>
          <Txt variant="small" numberOfLines={1}>
            {`Chapter ${chapterAt(book, position)} · ${formatRemaining(
              book.durationSec - position,
            )}`}
          </Txt>
        </View>
      </Pressable>
      <IconButton
        icon={playing ? 'pause' : 'play'}
        label={playing ? 'Pause' : 'Play'}
        iconSize={26}
        onPress={toggle}
      />
      <View
        style={[
          styles.bar,
          {width: `${progress * 100}%`, backgroundColor: colors.ink},
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 62,
    marginHorizontal: 10,
    marginBottom: 8,
    paddingLeft: 9,
    paddingRight: 6,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#1B1B19',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: {width: 0, height: 8},
    elevation: 6,
  },
  open: {flex: 1, flexDirection: 'row', alignItems: 'center', minHeight: 44},
  text: {flex: 1, marginLeft: 12},
  title: {fontSize: 14, lineHeight: 18},
  bar: {position: 'absolute', left: 0, bottom: 0, height: 2.5},
});
