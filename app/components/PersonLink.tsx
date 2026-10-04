import React, {ReactNode} from 'react';
import {Pressable, StyleProp, ViewStyle} from 'react-native';

import {getPerson, ME} from '../data/people';

type PersonLinkProps = {
  personId: string;
  onOpen: (personId: string) => void;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

// Wraps an avatar (and name) so it opens that person's profile.
export const PersonLink = ({
  personId,
  onOpen,
  children,
  style,
}: PersonLinkProps) => (
  <Pressable
    accessibilityRole="button"
    accessibilityLabel={
      personId === ME
        ? 'Your profile'
        : `${getPerson(personId).short}'s profile`
    }
    onPress={() => onOpen(personId)}
    style={style}>
    {children}
  </Pressable>
);
