import React from 'react';
import {Pressable, StyleSheet, useWindowDimensions, View} from 'react-native';

import {BookCover} from '../../components/BookCover';
import {chapterAt} from '../../data/catalogue';
import {clubs} from '../../data/clubs';
import {formatClock} from '../../data/format';
import {firstName, getPerson} from '../../data/people';
import {marginNotes} from '../../data/social';
import {RootStackScreenProps} from '../../navigator/types';
import {usePlayer} from '../../state/player';
import {useTheme} from '../../theme/ThemeProvider';
import {Avatar, Card, Icon, IconButton, IconName, Screen, Txt} from '../../ui';

const Skip = ({
  icon,
  seconds,
  label,
  onPress,
}: {
  icon: IconName;
  seconds: number;
  label: string;
  onPress: () => void;
}) => (
  <Pressable
    accessibilityRole="button"
    accessibilityLabel={label}
    onPress={onPress}
    style={styles.skip}>
    <Icon name={icon} size={30} />
    <Txt variant="small" color="ink" weight="bold" style={styles.skipText}>
      {String(seconds)}
    </Txt>
  </Pressable>
);

const PlayerScreen = ({navigation}: RootStackScreenProps<'Player'>) => {
  const {colors} = useTheme();
  const {width} = useWindowDimensions();
  const player = usePlayer();
  const {book, position, playing, rate} = player;
  const club = clubs.find(c => c.bookId === book.id);
  const notes = marginNotes
    .filter(n => n.bookId === book.id)
    .sort((a, b) => Math.abs(a.at - position) - Math.abs(b.at - position));
  const nearest = notes[0];
  const progress = position / book.durationSec;
  const coverSize = Math.min(292, width - 98);

  return (
    <Screen scroll contentStyle={styles.content}>
      <View style={styles.bar}>
        <IconButton
          icon="down"
          label="Close player"
          size={48}
          onPress={() => navigation.goBack()}
        />
        <View style={styles.with}>
          {club ? (
            <>
              <Txt variant="label">Listening with</Txt>
              <Txt variant="caption" color="ink" weight="semibold">
                {club.name}
              </Txt>
            </>
          ) : null}
        </View>
        <IconButton icon="more" label="More" size={48} onPress={() => {}} />
      </View>

      <View style={styles.cover}>
        <BookCover
          book={book}
          size={coverSize}
          radius={16}
          decorative={false}
        />
      </View>

      <View style={styles.titleRow}>
        <View style={styles.titleText}>
          <Txt variant="title" accessibilityRole="header" numberOfLines={2}>
            {book.title}
          </Txt>
          <Txt variant="caption" style={styles.author}>
            {book.author}
          </Txt>
        </View>
        <IconButton
          icon="bookmark"
          label="Bookmark this moment"
          size={48}
          background="segment"
          onPress={() => {}}
        />
      </View>

      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel="Position"
        accessibilityValue={{
          text: `${formatClock(position)} of ${formatClock(book.durationSec)}`,
        }}
        accessibilityActions={[{name: 'increment'}, {name: 'decrement'}]}
        onAccessibilityAction={e =>
          player.skip(e.nativeEvent.actionName === 'increment' ? 30 : -15)
        }
        style={styles.scrubber}>
        {notes.map(n => (
          <View
            key={n.id}
            style={[
              styles.marker,
              {
                left: `${(n.at / book.durationSec) * 100}%`,
                backgroundColor: colors.graphite,
              },
            ]}
          />
        ))}
        <View style={[styles.track, {backgroundColor: colors.track}]} />
        <View
          style={[
            styles.track,
            {width: `${progress * 100}%`, backgroundColor: colors.ink},
          ]}
        />
        <View
          style={[
            styles.head,
            {left: `${progress * 100}%`, backgroundColor: colors.kaki},
          ]}
        />
      </View>
      <View style={styles.times}>
        <Txt variant="small" accessibilityLabel="Elapsed">
          {formatClock(position)}
        </Txt>
        <Txt variant="small">{`Chapter ${chapterAt(book, position)}`}</Txt>
        <Txt variant="small" accessibilityLabel="Remaining">
          {`−${formatClock(book.durationSec - position)}`}
        </Txt>
      </View>

      <View style={styles.controls}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Playback speed ${rate} times`}
          onPress={player.cycleRate}
          style={styles.rate}>
          <Txt variant="strong" style={styles.rateText}>{`${rate}×`}</Txt>
        </Pressable>
        <Skip
          icon="skipBack"
          seconds={15}
          label="Back 15 seconds"
          onPress={() => player.skip(-15)}
        />
        <IconButton
          icon={playing ? 'pause' : 'play'}
          label={playing ? 'Pause' : 'Play'}
          size={76}
          iconSize={34}
          background="ink"
          color="onInk"
          onPress={player.toggle}
        />
        <Skip
          icon="skipForward"
          seconds={30}
          label="Forward 30 seconds"
          onPress={() => player.skip(30)}
        />
        <IconButton
          icon="sleep"
          label="Sleep timer"
          size={52}
          onPress={() => {}}
        />
      </View>

      {nearest ? (
        <Card style={styles.notes}>
          <View style={styles.notesHead}>
            <Txt variant="label">Margin notes · here</Txt>
            <Txt variant="small">{`${notes.length} notes`}</Txt>
          </View>
          <View style={styles.note}>
            <Avatar name={getPerson(nearest.by).name} size={34} />
            <View style={styles.noteText}>
              <Txt variant="caption" color="ink">
                <Txt variant="caption" color="ink" weight="semibold">
                  {firstName(nearest.by)}
                </Txt>
                <Txt variant="caption">{` at ${formatClock(nearest.at)}`}</Txt>
              </Txt>
              <Txt variant="quote" style={styles.noteBody}>
                {nearest.body}
              </Txt>
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Add a note at ${formatClock(position)}`}
            onPress={() =>
              navigation.navigate('UpdateCompose', {bookId: book.id})
            }
            style={[styles.addNote, {backgroundColor: colors.field}]}>
            <Icon name="note" size={20} color="graphite" />
            <Txt variant="caption" style={styles.addNoteText}>
              {`Add a note at ${formatClock(position)}`}
            </Txt>
          </Pressable>
        </Card>
      ) : null}
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: {paddingHorizontal: 22},
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: -10,
  },
  with: {alignItems: 'center'},
  cover: {alignItems: 'center', marginTop: 10},
  titleRow: {flexDirection: 'row', alignItems: 'center', marginTop: 20},
  titleText: {flex: 1, marginRight: 12},
  author: {fontSize: 14, marginTop: 2},
  scrubber: {height: 30, marginTop: 16, justifyContent: 'flex-start'},
  marker: {
    position: 'absolute',
    top: 2,
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  track: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 19,
    height: 4,
    borderRadius: 2,
  },
  head: {
    position: 'absolute',
    top: 14,
    width: 14,
    height: 14,
    marginLeft: -7,
    borderRadius: 7,
  },
  times: {flexDirection: 'row', justifyContent: 'space-between', marginTop: 6},
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  rate: {width: 52, height: 48, alignItems: 'center', justifyContent: 'center'},
  rateText: {fontSize: 14},
  skip: {width: 56, height: 56, alignItems: 'center', justifyContent: 'center'},
  skipText: {position: 'absolute', bottom: 3, fontSize: 10},
  notes: {marginTop: 14, padding: 14, paddingLeft: 16, borderRadius: 22},
  notesHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  note: {flexDirection: 'row', alignItems: 'flex-start', marginTop: 10},
  noteText: {flex: 1, marginLeft: 10},
  noteBody: {fontSize: 15, lineHeight: 21, marginTop: 2},
  addNote: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 16,
    marginTop: 12,
  },
  addNoteText: {marginLeft: 10, fontSize: 14},
});

export default PlayerScreen;
