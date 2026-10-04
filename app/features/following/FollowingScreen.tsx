import React, {useState} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';

import {BookCover} from '../../components/BookCover';
import OtoLogo from '../../components/OtoLogo';
import {LoadingState} from '../../components/LoadingState';
import {chapterAt} from '../../data/catalogue';
import {formatRemaining} from '../../data/format';
import {TabScreenProps} from '../../navigator/types';
import {retryConnection, useOnline} from '../../state/network';
import {usePlayer} from '../../state/player';
import {useSocial} from '../../state/social';
import {useFirstLoad} from '../../state/firstLoad';
import {useTheme} from '../../theme/ThemeProvider';
import {Button, Card, Icon, IconButton, Screen, Txt} from '../../ui';
import {FeedCard} from './FeedCard';

const filters = ['Friends', 'Clubs', 'Reviews'] as const;
type Filter = typeof filters[number];

const FollowingScreen = ({navigation}: TabScreenProps<'Following'>) => {
  const loading = useFirstLoad('following');
  const {colors, colorScheme} = useTheme();
  const {feed} = useSocial();
  const [filter, setFilter] = useState<Filter>('Friends');
  const [reported, setReported] = useState(false);
  const online = useOnline();
  const player = usePlayer();

  const items = feed.filter(item =>
    filter === 'Clubs'
      ? item.clubId
      : filter === 'Reviews'
      ? item.rating !== undefined
      : !item.clubId,
  );

  if (!online) {
    const {book, position} = player;
    const where = `Chapter ${chapterAt(book, position)} · ${formatRemaining(
      book.durationSec - position,
    )}`;
    return (
      <Screen scroll>
        <Txt variant="display">Following</Txt>
        <View
          accessibilityRole="alert"
          style={[styles.banner, {backgroundColor: colors.raised}]}>
          <OtoLogo size={24} decorative inverted={colorScheme === 'dark'} />
          <Txt variant="caption" color="ink" style={styles.bannerText}>
            <Txt variant="caption" color="ink" weight="semibold">
              You are offline.
            </Txt>{' '}
            <Txt variant="caption">Downloaded books still play.</Txt>
          </Txt>
        </View>

        <View style={styles.offline}>
          <OtoLogo
            size={72}
            label="oto, offline"
            inverted={colorScheme === 'dark'}
          />
          <Txt variant="heading" align="center" style={styles.offlineTitle}>
            Can't reach your friends.
          </Txt>
          <Txt color="graphite" align="center" style={styles.offlineBody}>
            Check your connection and try again. Your updates will post as soon
            as you are back online.
          </Txt>
          <View style={styles.retry}>
            <Button label="Try again" size="small" onPress={retryConnection} />
          </View>
        </View>

        <Txt variant="label" style={styles.availableLabel}>
          Available offline
        </Txt>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Play ${book.title}, ${where}`}
          onPress={() => {
            player.play(book.id);
            navigation.navigate('Player');
          }}>
          <Card style={styles.available}>
            <BookCover book={book} size={52} />
            <View style={styles.availableText}>
              <Txt variant="bookTitle" numberOfLines={1}>
                {book.title}
              </Txt>
              <Txt variant="small">{where}</Txt>
            </View>
            <Icon name="play" size={24} />
          </Card>
        </Pressable>
      </Screen>
    );
  }

  if (loading) {
    return (
      <Screen>
        <Txt variant="display">Following</Txt>
        <LoadingState message={'Catching up with friends'} layout="list" />
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <View style={styles.head}>
        <Txt variant="display">Following</Txt>
        <IconButton
          icon="plus"
          label="Update your status"
          background="ink"
          color="onInk"
          onPress={() => navigation.navigate('UpdateCompose', undefined)}
        />
      </View>

      <View style={styles.filters}>
        {filters.map(f => {
          const selected = f === filter;
          return (
            <Pressable
              key={f}
              accessibilityRole="button"
              accessibilityLabel={f}
              accessibilityState={{selected}}
              onPress={() => setFilter(f)}
              style={styles.filter}>
              <Txt
                color={selected ? 'ink' : 'graphite'}
                weight={selected ? 'semibold' : 'medium'}>
                {f}
              </Txt>
              <View
                style={[styles.dot, selected && {backgroundColor: colors.kaki}]}
              />
            </Pressable>
          );
        })}
      </View>

      {reported ? (
        <View
          accessibilityRole="alert"
          style={[styles.banner, {backgroundColor: colors.raised}]}>
          <Txt variant="caption" color="ink" style={styles.bannerText}>
            Thanks. We'll take a look.
          </Txt>
        </View>
      ) : null}

      {items.length ? (
        items.map(item => (
          <FeedCard
            key={item.id}
            item={item}
            onOpenBook={bookId => navigation.navigate('Book', {bookId})}
            onOpenThread={itemId => navigation.navigate('Thread', {itemId})}
            onReported={() => setReported(true)}
          />
        ))
      ) : (
        <Txt color="graphite" style={styles.empty}>
          Nothing here yet.
        </Txt>
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filters: {flexDirection: 'row', marginTop: 2},
  filter: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 22,
  },
  dot: {width: 6, height: 6, borderRadius: 3, marginTop: 4},
  empty: {marginTop: 24},
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 18,
  },
  bannerText: {flex: 1, marginLeft: 12, fontSize: 14, lineHeight: 20},
  offline: {alignItems: 'center', marginTop: 70},
  offlineTitle: {fontSize: 24, lineHeight: 30, marginTop: 24},
  offlineBody: {fontSize: 15.5, lineHeight: 24, marginTop: 8, maxWidth: 280},
  retry: {marginTop: 24},
  availableLabel: {marginTop: 44, marginBottom: 10},
  available: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  availableText: {flex: 1, marginHorizontal: 14},
});

export default FollowingScreen;
