import React, {useEffect, useState} from 'react';
import {Pressable, ScrollView, StyleSheet, TextInput, View} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {BookCover} from '../../components/BookCover';
import {catalogue, CatalogueBook, getBook} from '../../data/catalogue';
import {clubs} from '../../data/clubs';
import {
  authorsForYou,
  becauseYouFinished,
  recentSearchesSeed,
} from '../../data/social';
import {RootStackScreenProps} from '../../navigator/types';
import {useSocial} from '../../state/social';
import {useTheme} from '../../theme/ThemeProvider';
import {fonts} from '../../theme/typography';
import {
  Avatar,
  Chip,
  Icon,
  IconButton,
  Pill,
  Screen,
  TextLink,
  Txt,
} from '../../ui';

export const RECENT_SEARCHES_KEY = 'oto.searches';
const MAX_RECENT = 8;

const scopes = ['All', 'Titles', 'Authors', 'Narrators', 'Clubs'] as const;
type Scope = typeof scopes[number];

const matches = (book: CatalogueBook, scope: Scope, needle: string) => {
  const fields =
    scope === 'Titles'
      ? [book.title]
      : scope === 'Authors'
      ? [book.author]
      : scope === 'Narrators'
      ? [book.narrator]
      : [book.title, book.author, book.narrator];
  return fields.some(f => f.toLowerCase().includes(needle));
};

const SearchScreen = ({navigation}: RootStackScreenProps<'Search'>) => {
  const {colors} = useTheme();
  const social = useSocial();
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<Scope>('All');
  const [recent, setRecent] = useState<string[]>(recentSearchesSeed);

  useEffect(() => {
    AsyncStorage.getItem(RECENT_SEARCHES_KEY)
      .then(raw => {
        const stored = raw ? JSON.parse(raw) : null;
        if (Array.isArray(stored)) {
          setRecent(stored.filter(x => typeof x === 'string'));
        }
      })
      .catch(() => {});
  }, []);

  const saveRecent = (next: string[]) => {
    setRecent(next);
    AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next)).catch(
      () => {},
    );
  };

  const remember = () => {
    const term = query.trim();
    if (term) {
      saveRecent(
        [
          term,
          ...recent.filter(r => r.toLowerCase() !== term.toLowerCase()),
        ].slice(0, MAX_RECENT),
      );
    }
  };

  const needle = query.trim().toLowerCase();
  const scopeLabel = scope === 'All' ? 'results' : scope.toLowerCase();
  const bookResults =
    needle && scope !== 'Clubs'
      ? catalogue.filter(b => matches(b, scope, needle))
      : [];
  const clubResults =
    needle && (scope === 'All' || scope === 'Clubs')
      ? clubs.filter(c =>
          `${c.name} ${c.tagline}`.toLowerCase().includes(needle),
        )
      : [];
  const pick = getBook(becauseYouFinished.picks[0]);
  const finished = getBook(becauseYouFinished.bookId);

  return (
    <Screen scroll>
      <View style={styles.top}>
        <View
          style={[
            styles.field,
            {backgroundColor: colors.raised, borderColor: colors.ink},
          ]}>
          <Icon name="search" color="graphite" size={20} />
          <TextInput
            accessibilityLabel="Search"
            autoFocus
            placeholder="Titles, authors, clubs, people"
            placeholderTextColor={colors.graphite}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={remember}
            returnKeyType="search"
            style={[styles.input, {color: colors.ink}]}
          />
        </View>
        <TextLink
          label="Cancel"
          role="button"
          variant="body"
          onPress={() => navigation.goBack()}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chips}
        contentContainerStyle={styles.chipsContent}>
        {scopes.map(s => (
          <Chip
            key={s}
            label={s}
            selected={s === scope}
            onPress={() => setScope(s)}
          />
        ))}
      </ScrollView>

      {needle ? (
        <View style={styles.results}>
          {clubResults.map(club => (
            <Pressable
              key={club.id}
              accessibilityRole="button"
              accessibilityLabel={`${club.name}, club, ${club.members} members`}
              onPress={() => navigation.navigate('Club', {clubId: club.id})}
              style={styles.row}>
              <Avatar name={club.name} size={56} />
              <View style={styles.rowText}>
                <Txt variant="strong">{club.name}</Txt>
                <Txt variant="caption">{`Club · ${club.members} members`}</Txt>
              </View>
            </Pressable>
          ))}
          {bookResults.map(book => (
            <Pressable
              key={book.id}
              accessibilityRole="button"
              accessibilityLabel={`${book.title}, ${book.author}, narrated by ${book.narrator}`}
              onPress={() => {
                remember();
                navigation.navigate('Book', {bookId: book.id});
              }}
              style={styles.row}>
              <BookCover book={book} size={56} />
              <View style={styles.rowText}>
                <Txt variant="strong" numberOfLines={1}>
                  {book.title}
                </Txt>
                <Txt variant="caption" numberOfLines={1}>
                  {scope === 'Narrators'
                    ? `Narrated by ${book.narrator}`
                    : book.author}
                </Txt>
              </View>
            </Pressable>
          ))}
          {!bookResults.length && !clubResults.length ? (
            <Txt color="graphite" style={styles.empty}>
              {`No ${scopeLabel} match “${query.trim()}”.`}
            </Txt>
          ) : null}
        </View>
      ) : (
        <>
          {recent.length ? (
            <>
              <View style={styles.sectionHead}>
                <Txt variant="heading">Recent</Txt>
                <TextLink
                  label="Clear"
                  accessibilityLabel="Clear recent searches"
                  role="button"
                  onPress={() => saveRecent([])}
                />
              </View>
              {recent.map(term => (
                <View key={term} style={styles.recent}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Search for ${term}`}
                    onPress={() => setQuery(term)}
                    style={styles.recentMain}>
                    <Icon name="clock" size={20} color="graphite" />
                    <Txt style={styles.recentText}>{term}</Txt>
                  </Pressable>
                  <IconButton
                    icon="close"
                    label={`Remove ${term}`}
                    iconSize={18}
                    color="graphite"
                    onPress={() => saveRecent(recent.filter(r => r !== term))}
                  />
                </View>
              ))}
            </>
          ) : null}

          <Txt variant="heading" style={styles.heading}>
            Authors for you
          </Txt>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.authors}
            contentContainerStyle={styles.authorsContent}>
            {authorsForYou.map(name => {
              const following = social.followsAuthor(name);
              return (
                <View key={name} style={styles.author}>
                  <Avatar name={name} size={64} />
                  <Txt
                    variant="caption"
                    color="ink"
                    weight="semibold"
                    align="center"
                    numberOfLines={2}
                    style={styles.authorName}>
                    {name}
                  </Txt>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`${
                      following ? 'Unfollow' : 'Follow'
                    } ${name}`}
                    accessibilityState={{selected: following}}
                    onPress={() => social.toggleFollowAuthor(name)}
                    style={styles.followHit}>
                    <Pill
                      label={following ? 'Following' : 'Follow'}
                      height={30}
                      variant="small"
                      weight="semibold"
                      color={following ? 'onInk' : 'ink'}
                      background={following ? 'ink' : undefined}
                      border={following ? 'ink' : 'switchOff'}
                      style={styles.follow}
                    />
                  </Pressable>
                </View>
              );
            })}
          </ScrollView>

          <Txt variant="heading" style={styles.heading}>
            {`Because you finished ${finished.title}`}
          </Txt>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${pick.title}, ${pick.author}`}
            onPress={() => navigation.navigate('Book', {bookId: pick.id})}
            style={styles.row}>
            <BookCover book={pick} size={60} />
            <View style={styles.rowText}>
              <Txt variant="strong">{pick.title}</Txt>
              <Txt variant="caption">{pick.author}</Txt>
            </View>
          </Pressable>
        </>
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  top: {flexDirection: 'row', alignItems: 'center', marginRight: -6},
  field: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    paddingHorizontal: 14,
    marginRight: 6,
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontFamily: fonts.sans.regular,
    fontSize: 16,
    padding: 0,
  },
  chips: {marginTop: 6, marginHorizontal: -20},
  chipsContent: {paddingHorizontal: 17},
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  recent: {flexDirection: 'row', alignItems: 'center', minHeight: 48},
  recentMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
  },
  recentText: {marginLeft: 14, fontSize: 15.5},
  heading: {marginTop: 14, marginBottom: 12},
  authors: {marginHorizontal: -20},
  authorsContent: {paddingHorizontal: 20},
  author: {width: 84, alignItems: 'center', marginRight: 10},
  authorName: {marginTop: 6, lineHeight: 16},
  followHit: {minHeight: 44, justifyContent: 'center'},
  follow: {paddingHorizontal: 14},
  results: {marginTop: 8},
  row: {flexDirection: 'row', alignItems: 'center', minHeight: 76},
  rowText: {flex: 1, marginLeft: 14},
  empty: {marginTop: 20},
});

export default SearchScreen;
