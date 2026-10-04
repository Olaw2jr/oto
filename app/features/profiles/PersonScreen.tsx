import React from 'react';
import {Pressable, ScrollView, StyleSheet, View} from 'react-native';

import {BookCover} from '../../components/BookCover';
import {getBook} from '../../data/catalogue';
import {getPerson} from '../../data/people';
import {RootStackScreenProps} from '../../navigator/types';
import {openPerson} from '../../navigator/openPerson';
import {useSocial} from '../../state/social';
import {Avatar, Button, IconButton, ProgressBar, Screen, Txt} from '../../ui';
import {FeedCard} from '../following/FeedCard';

const listeningVerbs = ['started listening', 'is listening', 'made progress'];

const PersonScreen = ({navigation, route}: RootStackScreenProps<'Person'>) => {
  const social = useSocial();
  const person = getPerson(route.params.personId);
  const following = social.followsPerson(person.id);
  // Their updates, even while unfollowed, so the profile stays readable.
  const updates = social.updatesBy(person.id);
  const listening = updates.filter(
    u => listeningVerbs.includes(u.verb) && u.progress !== undefined,
  );

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
        <Avatar name={person.name} size={68} />
        <View style={styles.headerText}>
          <Txt variant="title">{person.name}</Txt>
          <Txt variant="caption" style={styles.handle}>
            {person.city
              ? `@${person.handle} · ${person.city}`
              : `@${person.handle}`}
          </Txt>
        </View>
      </View>
      <View style={styles.follow}>
        <Button
          kind={following ? 'tonal' : 'primary'}
          size="small"
          label={following ? 'Following' : 'Follow'}
          accessibilityLabel={`${following ? 'Unfollow' : 'Follow'} ${
            person.name
          }`}
          onPress={() => social.toggleFollowPerson(person.id)}
          stretch
        />
      </View>

      {listening.length ? (
        <>
          <Txt variant="heading" style={styles.heading}>
            Listening to
          </Txt>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.strip}
            contentContainerStyle={styles.stripContent}>
            {listening.map(u => {
              const book = getBook(u.bookId);
              return (
                <Pressable
                  key={u.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${book.title}, ${Math.round(
                    u.progress! * 100,
                  )}%`}
                  onPress={() => navigation.navigate('Book', {bookId: book.id})}
                  style={styles.book}>
                  <BookCover book={book} size={108} />
                  <View style={styles.progress}>
                    <ProgressBar
                      value={u.progress!}
                      height={3}
                      label={`${book.title} progress`}
                    />
                  </View>
                  <Txt
                    variant="caption"
                    color="ink"
                    weight="semibold"
                    numberOfLines={2}
                    style={styles.bookTitle}>
                    {book.title}
                  </Txt>
                  <Txt variant="small">{`${Math.round(
                    u.progress! * 100,
                  )}%`}</Txt>
                </Pressable>
              );
            })}
          </ScrollView>
        </>
      ) : null}

      <Txt variant="heading" style={styles.heading}>
        Recent updates
      </Txt>
      {updates.length ? (
        updates.map(item => (
          <FeedCard
            key={item.id}
            item={item}
            onOpenBook={bookId => navigation.navigate('Book', {bookId})}
            onOpenThread={itemId => navigation.navigate('Thread', {itemId})}
            onOpenPerson={id => openPerson(navigation, id)}
          />
        ))
      ) : (
        <Txt color="graphite">Nothing shared yet.</Txt>
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  bar: {flexDirection: 'row', marginHorizontal: -10},
  header: {flexDirection: 'row', alignItems: 'center'},
  headerText: {flex: 1, marginLeft: 16},
  handle: {fontSize: 13.5, marginTop: 2},
  follow: {flexDirection: 'row', marginTop: 16},
  heading: {marginTop: 22, marginBottom: 6},
  strip: {marginHorizontal: -20, marginTop: 8},
  stripContent: {paddingHorizontal: 20},
  book: {width: 108, marginRight: 13},
  progress: {flexDirection: 'row', marginTop: 8},
  bookTitle: {marginTop: 7},
});

export default PersonScreen;
