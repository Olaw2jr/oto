import React, {useState} from 'react';
import {Pressable, StyleSheet, TextInput, View} from 'react-native';

import {BookCover} from '../../components/BookCover';
import {LoadingState} from '../../components/LoadingState';
import OtoLogo from '../../components/OtoLogo';
import {chapterAt, getBook} from '../../data/catalogue';
import {getClub, MY_CLUB} from '../../data/clubs';
import {formatClock} from '../../data/format';
import {getPerson, ME} from '../../data/people';
import {RootStackScreenProps, TabScreenProps} from '../../navigator/types';
import {useLibrary} from '../../state/library';
import {useSettings} from '../../state/settings';
import {usePlayer} from '../../state/player';
import {useSocial} from '../../state/social';
import {useFirstLoad} from '../../state/firstLoad';
import {useTheme} from '../../theme/ThemeProvider';
import {fonts} from '../../theme/typography';
import {
  Avatar,
  Button,
  Card,
  Icon,
  IconButton,
  ProgressBar,
  Screen,
  Switch,
  Txt,
} from '../../ui';

type ClubScreenProps = RootStackScreenProps<'Club'> | TabScreenProps<'Clubs'>;

// Used both as the Clubs tab (your club) and as the Club route. Either way
// the navigator can reach the root routes used here (Book, Player).
const ClubScreen = ({navigation: nav, route}: ClubScreenProps) => {
  const navigation = nav as RootStackScreenProps<'Club'>['navigation'];
  const {colors, colorScheme} = useTheme();
  const library = useLibrary();
  const player = usePlayer();
  const social = useSocial();
  const clubId =
    (route.params as {clubId?: string} | undefined)?.clubId ?? MY_CLUB;
  const club = getClub(clubId);
  const loading = useFirstLoad(`club:${club.id}`);
  const book = getBook(club.bookId);
  const myPosition = library.positionSec(book.id);
  const settings = useSettings();
  const [spoilerSafe, setSpoilerSafe] = useState(settings.spoilerSafe);
  const [draft, setDraft] = useState('');

  const joined = social.joined(club.id);
  const going = social.going(club.id);
  const posts = social.clubPosts(club.id);
  const visible = spoilerSafe
    ? posts.filter(p => p.at === undefined || p.at <= myPosition)
    : posts;
  const hidden = posts.length - visible.length;

  const playFrom = (at: number) => {
    library.setPosition(book.id, at);
    player.play(book.id);
    navigation.navigate('Player');
  };

  const send = () => {
    social.addClubPost(club.id, draft.trim());
    setDraft('');
  };

  if (loading) {
    return (
      <Screen>
        {route.name === 'Club' ? (
          <View style={styles.bar}>
            <IconButton
              icon="back"
              label="Back"
              onPress={() => navigation.goBack()}
            />
          </View>
        ) : null}
        <LoadingState message={`Opening ${club.name}`} layout="list" />
      </Screen>
    );
  }

  return (
    <Screen
      scroll
      footer={
        <View style={styles.composer}>
          <Avatar name={getPerson(ME).name} size={36} />
          <View style={[styles.field, {backgroundColor: colors.raised}]}>
            <TextInput
              accessibilityLabel="Add to the discussion"
              placeholder="Add to the discussion"
              placeholderTextColor={colors.graphite}
              value={draft}
              onChangeText={setDraft}
              style={[styles.input, {color: colors.ink}]}
            />
          </View>
          <IconButton
            icon="send"
            label="Send"
            size={48}
            background="ink"
            color="onInk"
            onPress={() => draft.trim() && send()}
          />
        </View>
      }>
      <View style={styles.bar}>
        {route.name === 'Club' ? (
          <IconButton
            icon="back"
            label="Back"
            onPress={() => navigation.goBack()}
          />
        ) : (
          <View />
        )}
        <IconButton icon="more" label="More" onPress={() => {}} />
      </View>

      <View style={styles.header}>
        <View style={[styles.badge, {backgroundColor: colors.surface}]}>
          <OtoLogo size={40} decorative inverted={colorScheme === 'dark'} />
        </View>
        <View style={styles.headerText}>
          <Txt variant="title" style={styles.name}>
            {club.name}
          </Txt>
          <Txt variant="caption" style={styles.tagline}>
            {`${club.tagline} · ${club.members} members`}
          </Txt>
        </View>
      </View>

      <View style={styles.membership}>
        <Button
          kind="tonal"
          size="small"
          label={joined ? 'Joined' : 'Join'}
          onPress={() => social.toggleJoined(club.id)}
          stretch
        />
        <View style={styles.bell}>
          <IconButton
            icon="bell"
            label="Notifications"
            background="segment"
            onPress={() => {}}
          />
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`This month: ${book.title}`}
        onPress={() => navigation.navigate('Book', {bookId: book.id})}>
        <Card style={styles.month}>
          <View style={styles.row}>
            <BookCover book={book} size={68} />
            <View style={styles.monthText}>
              <Txt variant="label">This month</Txt>
              <Txt
                variant="heading"
                style={styles.monthTitle}
                numberOfLines={1}>
                {book.title}
              </Txt>
              <Txt variant="caption">
                {`${club.deadline} · you're on chapter ${chapterAt(
                  book,
                  myPosition,
                )}`}
              </Txt>
            </View>
          </View>
          <View style={[styles.row, styles.clubProgress]}>
            <ProgressBar value={club.progress} label="Club progress" />
            <Txt variant="small" style={styles.percent}>
              {`Club ${Math.round(club.progress * 100)}%`}
            </Txt>
          </View>
        </Card>
      </Pressable>

      <View style={[styles.session, {backgroundColor: colors.raised}]}>
        <View style={styles.sessionText}>
          <View style={styles.row}>
            <View style={[styles.liveDot, {backgroundColor: colors.kaki}]} />
            <Txt variant="label">Listening together</Txt>
          </View>
          <Txt variant="strong" style={styles.when}>
            {club.session.when}
          </Txt>
          <Txt variant="caption">
            {`Chapter ${club.session.chapter} · ${
              club.session.going + (going ? 1 : 0)
            } going`}
          </Txt>
        </View>
        <Button
          size="small"
          kind={going ? 'tonal' : 'primary'}
          label={going ? 'Going' : 'RSVP'}
          onPress={() => social.toggleGoing(club.id)}
        />
      </View>

      <View style={styles.discussionHead}>
        <Txt variant="heading">Discussion</Txt>
        <View style={styles.row}>
          <Txt variant="small" style={styles.safeLabel}>
            Spoiler-safe
          </Txt>
          <Switch
            small
            label="Spoiler-safe to where you are"
            value={spoilerSafe}
            onChange={setSpoilerSafe}
          />
        </View>
      </View>

      {visible.map(post => {
        const person = getPerson(post.by);
        return (
          <View key={post.id} style={styles.post}>
            <Avatar name={person.name} size={34} />
            <View style={styles.postBody}>
              <View style={[styles.row, styles.wrap]}>
                <Txt variant="caption" color="ink" weight="semibold">
                  {post.by === ME ? 'You' : person.short}
                </Txt>
                <Txt variant="small" style={styles.ago}>
                  {post.ago}
                </Txt>
                {post.at !== undefined ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Play from ${formatClock(post.at)}`}
                    onPress={() => playFrom(post.at!)}
                    style={styles.stampHit}>
                    <View
                      style={[styles.stamp, {backgroundColor: colors.segment}]}>
                      <Icon name="play" size={11} />
                      <Txt
                        variant="small"
                        color="ink"
                        weight="semibold"
                        style={styles.stampText}>
                        {formatClock(post.at)}
                      </Txt>
                    </View>
                  </Pressable>
                ) : null}
              </View>
              <Txt variant="quote" style={styles.postText}>
                {post.body}
              </Txt>
              {post.likes || post.replies ? (
                <View style={styles.row}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`${
                      social.liked(post.id) ? 'Unlike' : 'Like'
                    }, ${social.likeCount(post.id, post.likes)} likes`}
                    onPress={() => social.toggleLike(post.id)}
                    style={styles.action}>
                    <Icon
                      name={social.liked(post.id) ? 'heartFilled' : 'heart'}
                      size={18}
                      color={social.liked(post.id) ? 'kaki' : 'graphite'}
                    />
                    <Txt variant="caption" style={styles.count}>
                      {String(social.likeCount(post.id, post.likes))}
                    </Txt>
                  </Pressable>
                  {post.replies ? (
                    <View style={styles.action}>
                      <Txt variant="caption">{`Reply · ${post.replies}`}</Txt>
                    </View>
                  ) : null}
                </View>
              ) : null}
            </View>
          </View>
        );
      })}
      {hidden ? (
        <Txt variant="caption" style={styles.hidden}>
          {hidden === 1
            ? '1 post ahead of you is hidden'
            : `${hidden} posts ahead of you are hidden`}
        </Txt>
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
  row: {flexDirection: 'row', alignItems: 'center'},
  wrap: {flexWrap: 'wrap'},
  header: {flexDirection: 'row', alignItems: 'center', marginTop: 2},
  badge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1B1B19',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 6},
    elevation: 3,
  },
  headerText: {flex: 1, marginLeft: 16},
  name: {fontSize: 30, lineHeight: 34},
  tagline: {marginTop: 4},
  membership: {flexDirection: 'row', marginTop: 14},
  bell: {marginLeft: 10},
  month: {marginTop: 16, paddingVertical: 14, paddingHorizontal: 16},
  monthText: {flex: 1, marginLeft: 14},
  monthTitle: {marginTop: 3},
  clubProgress: {marginTop: 12},
  percent: {marginLeft: 10},
  session: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 22,
  },
  sessionText: {flex: 1, marginRight: 12},
  liveDot: {width: 8, height: 8, borderRadius: 4, marginRight: 7},
  when: {fontSize: 14.5, marginTop: 4},
  discussionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
  },
  safeLabel: {marginRight: 8},
  post: {flexDirection: 'row', marginTop: 12},
  postBody: {flex: 1, marginLeft: 12},
  ago: {marginLeft: 8},
  stampHit: {
    minHeight: 44,
    justifyContent: 'center',
    marginLeft: 8,
    marginVertical: -10,
  },
  stamp: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 26,
    paddingHorizontal: 10,
    borderRadius: 13,
  },
  stampText: {marginLeft: 5},
  postText: {fontSize: 15, marginTop: 4},
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingHorizontal: 4,
    marginRight: 12,
  },
  count: {marginLeft: 6},
  hidden: {marginTop: 14},
  composer: {flexDirection: 'row', alignItems: 'center'},
  field: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    paddingHorizontal: 16,
    marginHorizontal: 10,
    justifyContent: 'center',
  },
  input: {fontFamily: fonts.sans.regular, fontSize: 15, padding: 0},
});

export default ClubScreen;
