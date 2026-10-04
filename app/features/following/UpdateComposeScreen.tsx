import React, {useState} from 'react';
import {
  GestureResponderEvent,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {BookCover} from '../../components/BookCover';
import {chapterAt, getBook} from '../../data/catalogue';
import {clubs} from '../../data/clubs';
import {formatClock} from '../../data/format';
import {CURRENT_BOOK, Status} from '../../data/social';
import {RootStackScreenProps} from '../../navigator/types';
import {useLibrary} from '../../state/library';
import {usePlayer} from '../../state/player';
import {useSocial} from '../../state/social';
import {useTheme} from '../../theme/ThemeProvider';
import {fonts} from '../../theme/typography';
import {Button, Card, Icon, Segmented, Switch, TextLink, Txt} from '../../ui';

const statusOptions: {value: Status; label: string}[] = [
  {value: 'want', label: 'Want to listen'},
  {value: 'listening', label: 'Listening'},
  {value: 'finished', label: 'Finished'},
];

const UpdateComposeScreen = ({
  navigation,
  route,
}: RootStackScreenProps<'UpdateCompose'>) => {
  const {colors} = useTheme();
  const insets = useSafeAreaInsets();
  const library = useLibrary();
  const player = usePlayer();
  const social = useSocial();

  const listening = library.byStatus('listening');
  const [bookId, setBookId] = useState(
    route.params?.bookId ??
      (listening.includes(player.book.id) ? player.book.id : CURRENT_BOOK),
  );
  const book = getBook(bookId);
  const club = clubs.find(c => c.bookId === bookId);

  const [status, setStatus] = useState<Status>(
    library.status(bookId) ?? 'listening',
  );
  const [progress, setProgress] = useState(library.progress(bookId));
  const [rating, setRating] = useState<number | undefined>();
  const [body, setBody] = useState('');
  const [withNote, setWithNote] = useState(true);
  const [spoiler, setSpoiler] = useState(false);
  const [share, setShare] = useState(true);
  const [trackWidth, setTrackWidth] = useState(1);

  const positionSec = progress * book.durationSec;
  const percent = Math.round(progress * 100);
  const nudge = (delta: number) =>
    setProgress(p =>
      Math.min(1, Math.max(0, Math.round((p + delta) * 100) / 100)),
    );

  const changeBook = () => {
    const options = listening.length ? listening : [CURRENT_BOOK];
    const next = options[(options.indexOf(bookId) + 1) % options.length];
    setBookId(next);
    setStatus(library.status(next) ?? 'listening');
    setProgress(library.progress(next));
  };

  const post = () => {
    library.setStatus(bookId, status);
    if (status !== 'finished') {
      library.setPosition(bookId, positionSec);
    }
    social.postUpdate({
      bookId,
      status,
      progress,
      rating,
      body: body.trim(),
      noteAt: withNote ? positionSec : undefined,
      spoiler,
      shareToClub: Boolean(club) && share,
    });
    navigation.goBack();
  };

  return (
    <View
      style={[
        styles.sheet,
        {
          backgroundColor: colors.paper,
          paddingBottom: Math.max(insets.bottom, 16) + 18,
        },
      ]}>
      <View style={[styles.handle, {backgroundColor: colors.switchOff}]} />
      <View style={styles.header}>
        <TextLink
          label="Cancel"
          role="button"
          variant="body"
          color="graphite"
          onPress={() => navigation.goBack()}
        />
        <Txt variant="heading" style={styles.headerTitle}>
          Your update
        </Txt>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.bookRow}>
        <BookCover book={book} size={56} />
        <View style={styles.bookText}>
          <Txt variant="heading" style={styles.bookTitle} numberOfLines={1}>
            {book.title}
          </Txt>
          <Txt variant="caption">{book.author}</Txt>
        </View>
        <TextLink
          label="Change"
          accessibilityLabel="Change book"
          role="button"
          onPress={changeBook}
        />
      </View>

      <View style={styles.block}>
        <Segmented
          label="Status"
          options={statusOptions}
          value={status}
          onChange={setStatus}
        />
      </View>

      {status === 'listening' ? (
        <View style={styles.block}>
          <View style={styles.between}>
            <Txt variant="label">Where are you?</Txt>
            <Txt variant="caption" color="ink" weight="semibold">
              {`${percent}% · Ch. ${chapterAt(book, positionSec)}`}
            </Txt>
          </View>
          <Pressable
            accessible
            accessibilityRole="adjustable"
            accessibilityLabel="Where are you?"
            accessibilityValue={{min: 0, max: 100, now: percent}}
            accessibilityActions={[{name: 'increment'}, {name: 'decrement'}]}
            onAccessibilityAction={e =>
              nudge(e.nativeEvent.actionName === 'increment' ? 0.01 : -0.01)
            }
            onLayout={e => setTrackWidth(e.nativeEvent.layout.width)}
            onPress={(e: GestureResponderEvent) =>
              setProgress(
                Math.min(1, Math.max(0, e.nativeEvent.locationX / trackWidth)),
              )
            }
            style={styles.slider}>
            <View style={[styles.track, {backgroundColor: colors.track}]} />
            <View
              style={[
                styles.track,
                {width: `${progress * 100}%`, backgroundColor: colors.ink},
              ]}
            />
            <View
              style={[
                styles.thumb,
                {left: `${progress * 100}%`, backgroundColor: colors.kaki},
              ]}
            />
          </Pressable>
        </View>
      ) : null}

      <View style={[styles.between, styles.ratingRow]}>
        <Txt variant="label">Rating</Txt>
        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map(n => (
            <Pressable
              key={n}
              accessibilityRole="button"
              accessibilityLabel={n === 1 ? '1 star' : `${n} stars`}
              accessibilityState={{
                selected: rating !== undefined && n <= rating,
              }}
              onPress={() => setRating(rating === n ? undefined : n)}
              style={styles.star}>
              <Icon
                name={
                  rating !== undefined && n <= rating ? 'starFilled' : 'star'
                }
                size={26}
              />
            </Pressable>
          ))}
        </View>
      </View>

      <Card style={styles.thoughts}>
        <Txt variant="label">Thoughts</Txt>
        <TextInput
          accessibilityLabel="Thoughts"
          multiline
          value={body}
          onChangeText={setBody}
          placeholder="What stayed with you?"
          placeholderTextColor={colors.graphite}
          style={[styles.input, {color: colors.ink}]}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Margin note at ${formatClock(positionSec)}`}
          accessibilityState={{selected: withNote}}
          onPress={() => setWithNote(v => !v)}
          style={[
            styles.noteChip,
            {
              backgroundColor: withNote ? colors.raised : colors.paper,
              borderColor: colors.raised,
            },
          ]}>
          <Icon name="note" size={14} color={withNote ? 'ink' : 'graphite'} />
          <Txt
            variant="small"
            color={withNote ? 'ink' : 'graphite'}
            weight="semibold"
            style={styles.noteText}>
            {`Margin note at ${formatClock(positionSec)}`}
          </Txt>
        </Pressable>
      </Card>

      <View
        style={[
          styles.option,
          club && [styles.divider, {borderBottomColor: colors.hairline}],
        ]}>
        <Txt>Contains spoilers</Txt>
        <Switch
          label="Contains spoilers"
          value={spoiler}
          onChange={setSpoiler}
        />
      </View>
      {club ? (
        <View style={styles.option}>
          <Txt>
            Share to <Txt weight="semibold">{club.name}</Txt>
          </Txt>
          <Switch
            label={`Share to ${club.name}`}
            value={share}
            onChange={setShare}
          />
        </View>
      ) : null}

      <View style={styles.footer}>
        <Button
          label="Post update"
          onPress={post}
          disabled={!body.trim() && rating === undefined}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sheet: {flex: 1, paddingHorizontal: 20, paddingTop: 8},
  handle: {width: 38, height: 5, borderRadius: 3, alignSelf: 'center'},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    marginTop: 2,
  },
  headerTitle: {fontSize: 19},
  headerSpacer: {width: 56},
  bookRow: {flexDirection: 'row', alignItems: 'center', marginTop: 6},
  bookText: {flex: 1, marginLeft: 14},
  bookTitle: {fontSize: 19},
  block: {marginTop: 18},
  between: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  slider: {height: 30, marginTop: 6, justifyContent: 'center'},
  track: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 13,
    height: 4,
    borderRadius: 2,
  },
  thumb: {
    position: 'absolute',
    top: 7,
    width: 16,
    height: 16,
    marginLeft: -8,
    borderRadius: 8,
  },
  ratingRow: {alignItems: 'center', marginTop: 8},
  stars: {flexDirection: 'row', marginRight: -6},
  star: {width: 44, height: 44, alignItems: 'center', justifyContent: 'center'},
  thoughts: {
    marginTop: 4,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 22,
  },
  input: {
    fontFamily: fonts.serif.medium,
    fontSize: 16.5,
    lineHeight: 24,
    minHeight: 72,
    padding: 0,
    marginTop: 6,
    textAlignVertical: 'top',
  },
  noteChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    height: 30,
    paddingHorizontal: 12,
    borderRadius: 15,
    borderWidth: 1,
    marginTop: 6,
  },
  noteText: {marginLeft: 6},
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
  },
  divider: {borderBottomWidth: 1},
  footer: {marginTop: 'auto', paddingTop: 12},
});

export default UpdateComposeScreen;
