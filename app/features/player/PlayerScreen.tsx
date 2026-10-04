import React, {useEffect, useState} from 'react';
import {Pressable, StyleSheet, useWindowDimensions, View} from 'react-native';

import {BookCover} from '../../components/BookCover';
import {chapterAt} from '../../data/catalogue';
import {clubs} from '../../data/clubs';
import {formatClock} from '../../data/format';
import {shareBook} from '../../utils/share';
import {firstName, getPerson} from '../../data/people';
import {marginNotes} from '../../data/social';
import {RootStackScreenProps} from '../../navigator/types';
import {useLibrary} from '../../state/library';
import {useSettings} from '../../state/settings';
import {SleepTimer, usePlayer} from '../../state/player';
import {useTheme} from '../../theme/ThemeProvider';
import {
  Avatar,
  Card,
  Icon,
  IconButton,
  IconName,
  Screen,
  Sheet,
  SheetRow,
  Txt,
} from '../../ui';

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

const sleepOptions: {label: string; timer: SleepTimer}[] = [
  {label: 'Off', timer: null},
  {label: '15 minutes', timer: {kind: 'minutes', minutes: 15}},
  {label: '30 minutes', timer: {kind: 'minutes', minutes: 30}},
  {label: '45 minutes', timer: {kind: 'minutes', minutes: 45}},
  {label: '60 minutes', timer: {kind: 'minutes', minutes: 60}},
  {label: 'End of chapter', timer: {kind: 'chapter'}},
];

const sameTimer = (a: SleepTimer, b: SleepTimer) =>
  a === b ||
  (a !== null &&
    b !== null &&
    a.kind === b.kind &&
    (a.kind === 'chapter' ||
      (b.kind === 'minutes' && a.minutes === b.minutes)));

const sleepLabel = (timer: SleepTimer) =>
  timer === null
    ? 'Sleep timer'
    : timer.kind === 'chapter'
    ? 'Sleep timer, end of chapter'
    : `Sleep timer, ${timer.minutes} minutes`;

const PlayerScreen = ({navigation}: RootStackScreenProps<'Player'>) => {
  const {colors} = useTheme();
  const {width} = useWindowDimensions();
  const player = usePlayer();
  const library = useLibrary();
  const {skip} = useSettings();
  const [sheet, setSheet] = useState<'sleep' | 'more' | 'bookmarks' | null>(
    null,
  );
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timer = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

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
        <IconButton
          icon="more"
          label="More"
          size={48}
          onPress={() => setSheet('more')}
        />
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
          onPress={() => {
            library.addBookmark(book.id, position);
            setToast(`Bookmarked at ${formatClock(position)}`);
          }}
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
          player.skip(
            e.nativeEvent.actionName === 'increment'
              ? skip.forward
              : -skip.back,
          )
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
          seconds={skip.back}
          label={`Back ${skip.back} seconds`}
          onPress={() => player.skip(-skip.back)}
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
          seconds={skip.forward}
          label={`Forward ${skip.forward} seconds`}
          onPress={() => player.skip(skip.forward)}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={sleepLabel(player.sleepTimer)}
          onPress={() => setSheet('sleep')}
          style={styles.sleep}>
          <Icon name="sleep" />
          {player.sleepTimer ? (
            <Txt
              variant="small"
              color="ink"
              weight="semibold"
              style={styles.sleepText}>
              {player.sleepTimer.kind === 'chapter'
                ? 'Ch.'
                : `${player.sleepTimer.minutes}m`}
            </Txt>
          ) : null}
        </Pressable>
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
      {toast ? (
        <View
          accessibilityRole="alert"
          style={[styles.toast, {backgroundColor: colors.ink}]}>
          <Txt variant="caption" color="onInk" weight="semibold">
            {toast}
          </Txt>
        </View>
      ) : null}

      <Sheet
        visible={sheet === 'sleep'}
        title="Sleep timer"
        onClose={() => setSheet(null)}>
        {sleepOptions.map(option => (
          <SheetRow
            key={option.label}
            label={option.label}
            selected={sameTimer(player.sleepTimer, option.timer)}
            onPress={() => {
              player.setSleepTimer(option.timer);
              setSheet(null);
            }}
          />
        ))}
      </Sheet>

      <Sheet
        visible={sheet === 'more'}
        title={book.title}
        onClose={() => setSheet(null)}>
        <SheetRow
          icon="book"
          label="View book"
          onPress={() => {
            setSheet(null);
            navigation.navigate('Book', {bookId: book.id});
          }}
        />
        <SheetRow
          icon="share"
          label="Share"
          onPress={() => {
            setSheet(null);
            shareBook(book);
          }}
        />
        <SheetRow
          icon="bookmark"
          label="Bookmarks"
          value={String(library.bookmarks(book.id).length)}
          onPress={() => setSheet('bookmarks')}
        />
      </Sheet>

      <Sheet
        visible={sheet === 'bookmarks'}
        title="Bookmarks"
        onClose={() => setSheet(null)}>
        {library.bookmarks(book.id).length ? (
          library.bookmarks(book.id).map(at => (
            <SheetRow
              key={at}
              icon="play"
              label={`${formatClock(at)} · Chapter ${chapterAt(book, at)}`}
              accessibilityLabel={`Play from ${formatClock(at)}`}
              onPress={() => {
                player.seekTo(at);
                setSheet(null);
              }}
            />
          ))
        ) : (
          <Txt color="graphite" style={styles.noBookmarks}>
            Tap the bookmark while you listen to save a moment.
          </Txt>
        )}
      </Sheet>
    </Screen>
  );
};

const styles = StyleSheet.create({
  sleep: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sleepText: {position: 'absolute', bottom: 0, fontSize: 10},
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  noBookmarks: {marginVertical: 16},
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
