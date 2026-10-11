import React, {useEffect, useState} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';

import {chapterAt, chaptersOf} from '../../data/catalogue';
import {formatClock} from '../../data/format';
import {RootStackScreenProps} from '../../navigator/types';
import {useLibrary} from '../../state/library';
import {usePlayer} from '../../state/player';
import {useTheme} from '../../theme/ThemeProvider';
import {Icon, IconButton, IconName, Screen, Txt} from '../../ui';

// Skips in Car Mode are always 30 seconds: one big, predictable target.
const CAR_SKIP_SEC = 30;

const Big = ({
  icon,
  label,
  caption,
  onPress,
}: {
  icon: IconName;
  label: string;
  caption: string;
  onPress: () => void;
}) => {
  const {colors} = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.big, {backgroundColor: colors.segment}]}>
      <Icon name={icon} size={44} />
      <Txt variant="strong" style={styles.bigCaption}>
        {caption}
      </Txt>
    </Pressable>
  );
};

// Few, large controls for listening while driving: play or pause, skip 30
// seconds either way and bookmark. Nothing to read beyond the chapter.
const CarModeScreen = ({navigation}: RootStackScreenProps<'CarMode'>) => {
  const player = usePlayer();
  const library = useLibrary();
  const {book, position, playing} = player;
  const chapter = chaptersOf(book)[chapterAt(book, position) - 1];
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.bar}>
        <IconButton
          icon="close"
          label="Exit Car Mode"
          size={56}
          iconSize={28}
          onPress={() => navigation.goBack()}
        />
        <Txt variant="label">Car Mode</Txt>
        <View style={styles.barSpacer} />
      </View>

      <View style={styles.now}>
        <Txt variant="title" numberOfLines={2} align="center">
          {book.title}
        </Txt>
        <Txt
          color="graphite"
          numberOfLines={1}
          align="center"
          style={styles.chapter}>
          {chapter?.title}
        </Txt>
      </View>

      <View style={styles.playRow}>
        <IconButton
          icon={playing ? 'pause' : 'play'}
          label={playing ? 'Pause' : 'Play'}
          size={168}
          iconSize={72}
          background="ink"
          color="onInk"
          onPress={player.toggle}
        />
      </View>

      <View style={styles.row}>
        <Big
          icon="skipBack"
          label={`Back ${CAR_SKIP_SEC} seconds`}
          caption={`${CAR_SKIP_SEC}`}
          onPress={() => player.skip(-CAR_SKIP_SEC)}
        />
        <View style={styles.spaced} />
        <Big
          icon="skipForward"
          label={`Forward ${CAR_SKIP_SEC} seconds`}
          caption={`${CAR_SKIP_SEC}`}
          onPress={() => player.skip(CAR_SKIP_SEC)}
        />
      </View>
      <View style={styles.row}>
        <Big
          icon="bookmark"
          label="Bookmark this moment"
          caption="Bookmark"
          onPress={() => {
            library.addBookmark(book.id, position);
            setToast(`Bookmarked at ${formatClock(position)}`);
          }}
        />
      </View>

      {toast ? (
        <Txt
          accessibilityRole="alert"
          variant="strong"
          align="center"
          style={styles.toast}>
          {toast}
        </Txt>
      ) : null}
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: {paddingHorizontal: 20, flexGrow: 1},
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: -8,
  },
  barSpacer: {width: 56},
  now: {marginTop: 12, alignItems: 'center'},
  chapter: {marginTop: 6},
  playRow: {alignItems: 'center', marginVertical: 28},
  row: {flexDirection: 'row', marginTop: 14},
  spaced: {marginLeft: 14},
  big: {
    flex: 1,
    height: 104,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigCaption: {marginTop: 4},
  toast: {marginTop: 18},
});

export default CarModeScreen;
