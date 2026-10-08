import React from 'react';
import {StyleSheet, View} from 'react-native';

import {ReviewCard} from '../../components/ReviewCard';
import {getBook} from '../../data/catalogue';
import {openPerson} from '../../navigator/openPerson';
import {RootStackScreenProps} from '../../navigator/types';
import {useBookReviews} from '../../state/reviews';
import {IconButton, Screen, Txt} from '../../ui';

// Every review of a book from people you follow.
const ReviewsScreen = ({
  navigation,
  route,
}: RootStackScreenProps<'Reviews'>) => {
  const book = getBook(route.params.bookId);
  const bookReviews = useBookReviews(book.id);

  return (
    <Screen scroll>
      <View style={styles.bar}>
        <IconButton
          icon="back"
          label="Back"
          onPress={() => navigation.goBack()}
        />
      </View>
      <Txt variant="display">Reviews</Txt>
      <Txt variant="caption" style={styles.book}>
        {book.title}
      </Txt>
      {bookReviews.map(review => (
        <ReviewCard
          key={review.id}
          review={review}
          onOpenPerson={id => openPerson(navigation, id)}
        />
      ))}
    </Screen>
  );
};

const styles = StyleSheet.create({
  bar: {flexDirection: 'row', marginHorizontal: -10},
  book: {marginTop: 4, marginBottom: 14},
});

export default ReviewsScreen;
