import React, {useEffect, useRef, useState} from 'react';
import {Pressable, StyleSheet, useWindowDimensions, View} from 'react-native';

import {AuthorLinks} from '../../components/AuthorLinks';
import {BookCover} from '../../components/BookCover';
import {chapterAt, chaptersOf} from '../../data/catalogue';
import {clubs} from '../../data/clubs';
import {formatClock} from '../../data/format';
import {shareBook} from '../../utils/share';
import {firstName, getPerson} from '../../data/people';
import {marginNotes} from '../../data/social';
import {RootStackScreenProps} from '../../navigator/types';
import {useLibrary} from '../../state/library';
import {useSettings} from '../../state/settings';
import {formatMegabytes, useBookDownload} from '../../state/downloads';
import {SleepTimer, SPEEDS, usePlayer} from '../../state/player';
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
  StarRating,
  TextLink,
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

const Action = ({
  label,
  accessibilityLabel,
  onPress,
  children,
}: {
  label: string;
  accessibilityLabel: string;
  onPress: () => void;
  children: React.ReactNode;
}) => (
  <Pressable
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel}
    onPress={onPress}
    style={styles.action}>
    <View style={styles.actionIcon}>{children}</View>
    <Txt variant="small" style={styles.actionLabel}>
      {label}
    </Txt>
  </Pressable>
);

// Download, its progress or removal, for books with rights-cleared audio.
const DownloadRow = ({bookId}: {bookId: string}) => {
  const {available, status, download, remove} = useBookDownload(bookId);
  if (!available) return null;
  const percent = status.totalBytes
    ? Math.floor((status.bytesDownloaded / status.totalBytes) * 100)
    : 0;
  if (status.state === 'completed') {
    return (
      <SheetRow
        icon="download"
        label="Remove download"
        value={formatMegabytes(status.totalBytes)}
        onPress={remove}
      />
    );
  }
  if (status.state === 'downloading' || status.state === 'queued') {
    return (
      <SheetRow
        icon="download"
        label="Cancel download"
        value={`${percent}%`}
        onPress={remove}
      />
    );
  }
  return (
    <SheetRow
      icon="download"
      label={
        status.state === 'failed' ? 'Download failed · Try again' : 'Download'
      }
      onPress={download}
    />
  );
};

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
  const [sheet, setSheet] = useState<
    'sleep' | 'more' | 'bookmarks' | 'speed' | 'chapters' | 'rate' | null
  >(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timer = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  const {book, playing, rate} = player;
  // While you drag the scrubber, the times preview where you'll land.
  const [dragSec, setDragSec] = useState<number | null>(null);
  const scrubberWidth = useRef(0);
  const position = dragSec ?? player.position;
  const scrubTo = (locationX: number) => {
    const trackWidth = scrubberWidth.current;
    if (trackWidth <= 0) return null;
    const fraction = Math.min(1, Math.max(0, locationX / trackWidth));
    const sec = fraction * book.durationSec;
    setDragSec(sec);
    return sec;
  };
  const club = clubs.find(c => c.bookId === book.id);
  const notes = marginNotes
    .filter(n => n.bookId === book.id)
    .sort((a, b) => Math.abs(a.at - position) - Math.abs(b.at - position));
  const nearest = notes[0];
  const progress = position / book.durationSec;
  const chapters = chaptersOf(book);
  const chapter = chapters[chapterAt(book, position) - 1] ?? chapters[0];
  const rating = library.rating(book.id);
  // Like a CD player: partway into a chapter, go back to its start first.
  const previousChapter = () =>
    player.seekTo(
      position - chapter.startSec > 3 || chapter.number === 1
        ? chapter.startSec
        : chapters[chapter.number - 2].startSec,
    );
  const nextChapter = () => {
    const next = chapters[chapter.number];
    if (next) player.seekTo(next.startSec);
  };
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

      {player.error ? (
        <View
          accessibilityRole="alert"
          style={[styles.error, {backgroundColor: colors.segment}]}>
          <Txt variant="caption" color="ink" style={styles.errorText}>
            {player.error}
          </Txt>
          <TextLink
            label="Dismiss"
            role="button"
            onPress={player.dismissError}
          />
        </View>
      ) : null}

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
          <AuthorLinks
            author={book.author}
            variant="caption"
            onOpen={name => navigation.navigate('Author', {name})}
          />
        </View>
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
        // Tap to seek, or drag and let go. Children ignore touches so
        // locationX is always measured from the scrubber itself.
        onLayout={e => {
          scrubberWidth.current = e.nativeEvent.layout.width;
        }}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderTerminationRequest={() => false}
        onResponderGrant={e => {
          scrubTo(e.nativeEvent.locationX);
        }}
        onResponderMove={e => {
          scrubTo(e.nativeEvent.locationX);
        }}
        onResponderRelease={e => {
          const sec = scrubTo(e.nativeEvent.locationX);
          if (sec !== null) player.seekTo(sec);
          setDragSec(null);
        }}
        onResponderTerminate={() => setDragSec(null)}
        hitSlop={{top: 12, bottom: 12}}
        style={styles.scrubber}>
        {notes.map(n => (
          <View
            key={n.id}
            pointerEvents="none"
            style={[
              styles.marker,
              {
                left: `${(n.at / book.durationSec) * 100}%`,
                backgroundColor: colors.graphite,
              },
            ]}
          />
        ))}
        <View
          pointerEvents="none"
          style={[styles.track, {backgroundColor: colors.track}]}
        />
        <View
          pointerEvents="none"
          style={[
            styles.track,
            {width: `${progress * 100}%`, backgroundColor: colors.ink},
          ]}
        />
        <View
          pointerEvents="none"
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
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Chapters, chapter ${chapter.number} of ${chapters.length}, ${chapter.title}`}
          hitSlop={8}
          onPress={() => setSheet('chapters')}
          style={styles.chapter}>
          <Icon name="chapters" size={16} color="graphite" />
          <Txt variant="small" numberOfLines={1} style={styles.chapterText}>
            {chapter.title}
          </Txt>
        </Pressable>
        <Txt variant="small" accessibilityLabel="Remaining">
          {`−${formatClock(book.durationSec - position)}`}
        </Txt>
      </View>

      <View style={styles.controls}>
        <IconButton
          icon="previousChapter"
          label="Previous chapter"
          size={48}
          iconSize={22}
          onPress={previousChapter}
        />
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
        <IconButton
          icon="nextChapter"
          label="Next chapter"
          size={48}
          iconSize={22}
          onPress={nextChapter}
        />
      </View>

      <View style={styles.actions}>
        <Action
          label="Speed"
          accessibilityLabel={`Playback speed ${rate} times`}
          onPress={() => setSheet('speed')}>
          <Txt variant="strong" style={styles.rateText}>{`${rate}×`}</Txt>
        </Action>
        <Action
          label="Car Mode"
          accessibilityLabel="Car Mode"
          onPress={() => navigation.navigate('CarMode')}>
          <Icon name="car" />
        </Action>
        <Action
          label="Timer"
          accessibilityLabel={sleepLabel(player.sleepTimer)}
          onPress={() => setSheet('sleep')}>
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
        </Action>
        <Action
          label="Bookmark"
          accessibilityLabel="Bookmark this moment"
          onPress={() => {
            library.addBookmark(book.id, position);
            setToast(`Bookmarked at ${formatClock(position)}`);
          }}>
          <Icon name="bookmark" />
        </Action>
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
          label="Title details"
          onPress={() => {
            setSheet(null);
            navigation.navigate('Book', {bookId: book.id});
          }}
        />
        <SheetRow
          icon="plus"
          label="Add to a shelf"
          onPress={() => {
            setSheet(null);
            navigation.navigate('SaveToShelf', {bookId: book.id});
          }}
        />
        <DownloadRow bookId={book.id} />
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
        {library.status(book.id) === 'finished' ? (
          <SheetRow
            icon="finished"
            label="Finished"
            value="In your library"
            onPress={() => setSheet(null)}
          />
        ) : (
          <SheetRow
            icon="finished"
            label="Mark as finished"
            onPress={() => {
              // Stop first, so playback doesn't move a finished book's
              // position back into the middle.
              if (playing) player.toggle();
              library.setStatus(book.id, 'finished');
              setSheet(null);
            }}
          />
        )}
        <SheetRow
          icon="star"
          label="Rate and review"
          value={
            rating ? `${rating} ${rating === 1 ? 'star' : 'stars'}` : undefined
          }
          onPress={() => setSheet('rate')}
        />
        <SheetRow
          icon="settings"
          label="Player settings"
          onPress={() => {
            setSheet(null);
            navigation.navigate('Settings');
          }}
        />
      </Sheet>

      <Sheet
        visible={sheet === 'speed'}
        title="Playback speed"
        onClose={() => setSheet(null)}>
        {SPEEDS.map(speed => (
          <SheetRow
            key={speed}
            label={`${speed}×`}
            selected={rate === speed}
            onPress={() => {
              player.setRate(speed);
              setSheet(null);
            }}
          />
        ))}
      </Sheet>

      <Sheet
        visible={sheet === 'chapters'}
        title="Chapters"
        onClose={() => setSheet(null)}>
        {chapters.map(c => (
          <SheetRow
            key={c.number}
            label={c.title}
            value={
              c.number === chapter.number ? 'Now' : formatClock(c.startSec)
            }
            accessibilityLabel={`${c.title}, starts at ${formatClock(
              c.startSec,
            )}`}
            onPress={() => {
              player.seekTo(c.startSec);
              setSheet(null);
            }}
          />
        ))}
      </Sheet>

      <Sheet
        visible={sheet === 'rate'}
        title="Rate and review"
        onClose={() => setSheet(null)}>
        <View style={styles.rating}>
          <StarRating
            value={rating}
            size={34}
            onChange={stars => {
              library.setRating(book.id, stars);
              setSheet(null);
            }}
          />
        </View>
        <SheetRow
          icon="note"
          label="Write a review"
          onPress={() => {
            setSheet(null);
            navigation.navigate('UpdateCompose', {bookId: book.id});
          }}
        />
      </Sheet>

      <Sheet
        visible={sheet === 'bookmarks'}
        title="Bookmarks"
        onClose={() => setSheet(null)}>
        {library.bookmarks(book.id).length ? (
          library.bookmarks(book.id).map(at => (
            <View key={at} style={styles.bookmarkRow}>
              <View style={styles.bookmarkPlay}>
                <SheetRow
                  icon="play"
                  label={`${formatClock(at)} · Chapter ${chapterAt(book, at)}`}
                  accessibilityLabel={`Play from ${formatClock(at)}`}
                  onPress={() => {
                    player.seekTo(at);
                    setSheet(null);
                  }}
                />
              </View>
              <IconButton
                icon="close"
                label={`Delete bookmark at ${formatClock(at)}`}
                onPress={() => library.removeBookmark(book.id, at)}
              />
            </View>
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
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 14,
  },
  action: {alignItems: 'center', minWidth: 64, paddingVertical: 4},
  actionIcon: {height: 30, alignItems: 'center', justifyContent: 'center'},
  actionLabel: {marginTop: 2},
  sleepText: {position: 'absolute', bottom: -6, fontSize: 9},
  chapter: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    marginHorizontal: 10,
  },
  chapterText: {marginLeft: 4, flexShrink: 1},
  rating: {alignItems: 'center', paddingVertical: 16},
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  noBookmarks: {marginVertical: 16},
  bookmarkRow: {flexDirection: 'row', alignItems: 'center'},
  bookmarkPlay: {flex: 1},
  content: {paddingHorizontal: 22},
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: -10,
  },
  with: {alignItems: 'center'},
  error: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingLeft: 16,
    paddingRight: 8,
    marginTop: 8,
  },
  errorText: {flex: 1, paddingVertical: 12},
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
