import React, {useState} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';

import {TabScreenProps} from '../../navigator/types';
import {useSocial} from '../../state/social';
import {useTheme} from '../../theme/ThemeProvider';
import {IconButton, Screen, Txt} from '../../ui';
import {FeedCard} from './FeedCard';

const filters = ['Friends', 'Clubs', 'Reviews'] as const;
type Filter = typeof filters[number];

const FollowingScreen = ({navigation}: TabScreenProps<'Following'>) => {
  const {colors} = useTheme();
  const {feed} = useSocial();
  const [filter, setFilter] = useState<Filter>('Friends');

  const items = feed.filter(item =>
    filter === 'Clubs'
      ? item.clubId
      : filter === 'Reviews'
      ? item.rating !== undefined
      : !item.clubId,
  );

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

      {items.length ? (
        items.map(item => (
          <FeedCard
            key={item.id}
            item={item}
            onOpenBook={bookId => navigation.navigate('Book', {bookId})}
            onOpenThread={itemId => navigation.navigate('Thread', {itemId})}
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
});

export default FollowingScreen;
