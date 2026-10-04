import React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';

import {BookCover} from '../../components/BookCover';
import OtoLogo from '../../components/OtoLogo';
import {chapterAt, getBook} from '../../data/catalogue';
import {getClub, MY_CLUB} from '../../data/clubs';
import {formatRemaining} from '../../data/format';
import {firstName, getPerson, ME} from '../../data/people';
import {becauseYouFinished, homeFriendActivity} from '../../data/social';
import {dayGreeting} from '../../data/time';
import {TabScreenProps} from '../../navigator/types';
import {usePlayer} from '../../state/player';
import {useTheme} from '../../theme/ThemeProvider';
import {
  Avatar,
  Button,
  Card,
  IconButton,
  ProgressBar,
  Screen,
  Txt,
} from '../../ui';

const HomeScreen = ({navigation}: TabScreenProps<'Home'>) => {
  const {colors, colorScheme} = useTheme();
  const player = usePlayer();
  const {book, position} = player;
  const club = getClub(MY_CLUB);
  const clubBook = getBook(club.bookId);
  const finished = getBook(becauseYouFinished.bookId);
  const friend = getPerson(homeFriendActivity.by);
  const friendBook = getBook(homeFriendActivity.bookId);
  const {label, hello} = dayGreeting();

  const resume = () => {
    if (!player.playing) {
      player.toggle();
    }
    navigation.navigate('Player');
  };

  return (
    <Screen scroll>
      <View style={styles.top}>
        <View style={styles.brand}>
          <OtoLogo size={30} decorative inverted={colorScheme === 'dark'} />
          <Txt weight="semibold" style={styles.wordmark}>
            oto
          </Txt>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Your profile"
          onPress={() => navigation.navigate('You')}>
          <Avatar name={getPerson(ME).name} size={44} />
        </Pressable>
      </View>

      <Txt variant="caption" style={styles.day}>
        {label}
      </Txt>
      <Txt variant="title" style={styles.greeting}>
        {`${hello}, ${firstName(ME)}.`}
      </Txt>

      <Card style={styles.continue}>
        <View style={styles.row}>
          <BookCover book={book} size={96} />
          <View style={styles.continueText}>
            <Txt variant="label">Continue listening</Txt>
            <Txt
              variant="heading"
              style={styles.continueTitle}
              numberOfLines={2}>
              {book.title}
            </Txt>
            <Txt variant="caption">{book.author}</Txt>
            <Txt variant="caption" style={styles.pushDown}>
              {`Chapter ${chapterAt(book, position)} · ${formatRemaining(
                book.durationSec - position,
              )}`}
            </Txt>
          </View>
        </View>
        <View style={[styles.row, styles.resumeRow]}>
          <ProgressBar
            value={position / book.durationSec}
            label={`${book.title} progress`}
          />
          <View style={styles.resumeButton}>
            <IconButton
              icon="play"
              label={`Resume ${book.title}`}
              size={48}
              background="ink"
              color="onInk"
              onPress={resume}
            />
          </View>
        </View>
      </Card>

      <View style={[styles.live, {backgroundColor: colors.raised}]}>
        <View style={styles.liveText}>
          <View style={styles.row}>
            <View style={[styles.liveDot, {backgroundColor: colors.kaki}]} />
            <Txt variant="label" color="ink">
              Live now
            </Txt>
          </View>
          <Txt variant="strong" style={styles.liveTitle}>
            {`${club.name} is listening to ${clubBook.title}`}
          </Txt>
          <Txt variant="caption">
            {`${club.listeningNow} listening · Chapter ${club.session.chapter}`}
          </Txt>
        </View>
        <Button
          label="Join"
          size="small"
          accessibilityLabel={`Join ${club.name}`}
          onPress={() => navigation.navigate('Club', {clubId: club.id})}
        />
      </View>

      <Txt variant="heading" style={styles.section}>
        {`Because you finished ${finished.title}`}
      </Txt>
      <View style={styles.picks}>
        {becauseYouFinished.picks.map(getBook).map(pick => (
          <Pressable
            key={pick.id}
            accessibilityRole="button"
            accessibilityLabel={pick.title}
            onPress={() => navigation.navigate('Book', {bookId: pick.id})}
            style={styles.pick}>
            <BookCover book={pick} size={108} />
            <Txt
              variant="caption"
              color="ink"
              weight="semibold"
              numberOfLines={2}
              style={styles.pickTitle}>
              {pick.title}
            </Txt>
            <Txt variant="small" numberOfLines={1}>
              {pick.author}
            </Txt>
          </Pressable>
        ))}
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => navigation.navigate('Book', {bookId: friendBook.id})}>
        <Card style={[styles.row, styles.friend]}>
          <Avatar name={friend.name} />
          <View style={styles.friendText}>
            <Txt variant="caption" color="ink">
              <Txt variant="caption" color="ink" weight="semibold">
                {friend.short}
              </Txt>
              <Txt variant="caption">{` ${homeFriendActivity.verb} ${friendBook.title}`}</Txt>
            </Txt>
            <Txt variant="quote" style={styles.quote}>
              {homeFriendActivity.quote}
            </Txt>
          </View>
          <BookCover book={friendBook} size={48} raised={false} />
        </Card>
      </Pressable>
    </Screen>
  );
};

const styles = StyleSheet.create({
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
  },
  brand: {flexDirection: 'row', alignItems: 'center'},
  wordmark: {fontSize: 22, lineHeight: 28, marginLeft: 9},
  day: {marginTop: 18},
  greeting: {fontSize: 31, lineHeight: 37, marginTop: 4},
  row: {flexDirection: 'row', alignItems: 'center'},
  continue: {marginTop: 20, padding: 16},
  continueText: {flex: 1, marginLeft: 16, alignSelf: 'stretch'},
  continueTitle: {fontSize: 23, lineHeight: 27, marginTop: 6},
  pushDown: {marginTop: 'auto'},
  resumeRow: {marginTop: 16},
  resumeButton: {marginLeft: 14},
  live: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 22,
  },
  liveText: {flex: 1, marginRight: 12},
  liveDot: {width: 8, height: 8, borderRadius: 4, marginRight: 7},
  liveTitle: {marginTop: 5},
  section: {marginTop: 26},
  picks: {flexDirection: 'row', marginTop: 14},
  pick: {width: 108, marginRight: 13},
  pickTitle: {marginTop: 9},
  friend: {marginTop: 22, paddingVertical: 14, paddingHorizontal: 16},
  friendText: {flex: 1, marginHorizontal: 14},
  quote: {fontSize: 15, lineHeight: 21, marginTop: 3},
});

export default HomeScreen;
