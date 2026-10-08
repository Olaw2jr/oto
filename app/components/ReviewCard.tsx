import React from 'react';
import {StyleSheet, View} from 'react-native';

import {getPerson} from '../data/people';
import type {Review} from '../data/social';
import {Avatar, Card, Icon, Txt} from '../ui';
import {PersonLink} from './PersonLink';

// A review by someone you follow, with their rating and reactions.
export const ReviewCard = ({
  review,
  onOpenPerson,
}: {
  review: Review;
  onOpenPerson: (personId: string) => void;
}) => {
  const person = getPerson(review.by);
  const score = review.rating.toFixed(1);
  return (
    <Card style={styles.review}>
      <View style={styles.reviewHead}>
        <PersonLink personId={review.by} onOpen={onOpenPerson}>
          <Avatar name={person.name} size={32} />
        </PersonLink>
        <Txt
          variant="caption"
          color="ink"
          weight="semibold"
          style={styles.reviewer}>
          {person.short}
        </Txt>
        <View
          accessible
          accessibilityLabel={`${person.short} rated it ${score}`}
          style={styles.score}>
          <Icon name="starFilled" size={14} />
          <Txt
            variant="caption"
            color="ink"
            weight="semibold"
            style={styles.scoreText}>
            {score}
          </Txt>
        </View>
      </View>
      <Txt variant="quote" style={styles.reviewBody}>
        {review.body}
      </Txt>
      <View style={styles.reviewStats}>
        <Icon name="heart" size={16} color="graphite" />
        <Txt variant="small" style={styles.stat}>
          {String(review.likes)}
        </Txt>
        <Icon name="comment" size={16} color="graphite" />
        <Txt variant="small" style={styles.stat}>
          {String(review.comments)}
        </Txt>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  review: {marginTop: 6, paddingVertical: 14, paddingHorizontal: 16},
  reviewHead: {flexDirection: 'row', alignItems: 'center'},
  reviewer: {flex: 1, marginLeft: 10},
  score: {flexDirection: 'row', alignItems: 'center'},
  scoreText: {marginLeft: 3},
  reviewBody: {marginTop: 8},
  reviewStats: {flexDirection: 'row', alignItems: 'center', marginTop: 8},
  stat: {marginLeft: 6, marginRight: 18},
});
