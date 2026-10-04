import React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';

import {BookCover} from '../../components/BookCover';
import {catalogue} from '../../data/catalogue';
import {formatDuration} from '../../data/format';
import {RootStackScreenProps} from '../../navigator/types';
import {useSocial} from '../../state/social';
import {useTheme} from '../../theme/ThemeProvider';
import {Avatar, Button, IconButton, Screen, Txt} from '../../ui';

const AuthorScreen = ({navigation, route}: RootStackScreenProps<'Author'>) => {
  const {colors} = useTheme();
  const social = useSocial();
  const {name} = route.params;
  // Books list co-authors together ("Peter Baker, Susan Glasser").
  const books = catalogue.filter(b => b.author.split(/,\s*/).includes(name));
  const following = social.followsAuthor(name);

  return (
    <Screen scroll>
      <View style={styles.bar}>
        <IconButton
          icon="back"
          label="Back"
          onPress={() => navigation.goBack()}
        />
      </View>
      <View style={styles.header}>
        <Avatar name={name} size={68} />
        <View style={styles.headerText}>
          <Txt variant="title">{name}</Txt>
          <Txt variant="caption" style={styles.count}>
            {books.length === 1 ? '1 audiobook' : `${books.length} audiobooks`}
          </Txt>
        </View>
      </View>
      <View style={styles.follow}>
        <Button
          kind={following ? 'tonal' : 'primary'}
          size="small"
          label={following ? 'Following' : 'Follow'}
          accessibilityLabel={`${following ? 'Unfollow' : 'Follow'} ${name}`}
          onPress={() => social.toggleFollowAuthor(name)}
          stretch
        />
      </View>

      <Txt variant="heading" style={styles.heading}>
        Audiobooks
      </Txt>
      {books.map(book => (
        <Pressable
          key={book.id}
          accessibilityRole="button"
          accessibilityLabel={`${book.title}, ${formatDuration(
            book.durationSec,
          )}`}
          onPress={() => navigation.navigate('Book', {bookId: book.id})}
          style={[styles.row, {borderBottomColor: colors.hairline}]}>
          <BookCover book={book} size={64} />
          <View style={styles.rowText}>
            <Txt variant="strong" numberOfLines={1}>
              {book.title}
            </Txt>
            <Txt variant="caption">{`${book.rating.toFixed(
              1,
            )} · ${formatDuration(book.durationSec)}`}</Txt>
          </View>
        </Pressable>
      ))}
    </Screen>
  );
};

const styles = StyleSheet.create({
  bar: {flexDirection: 'row', marginHorizontal: -10},
  header: {flexDirection: 'row', alignItems: 'center'},
  headerText: {flex: 1, marginLeft: 16},
  count: {marginTop: 2},
  follow: {flexDirection: 'row', marginTop: 16},
  heading: {marginTop: 22, marginBottom: 6},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 84,
    borderBottomWidth: 1,
  },
  rowText: {flex: 1, marginLeft: 14},
});

export default AuthorScreen;
