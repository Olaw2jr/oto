import React from 'react';
import {StyleSheet, View} from 'react-native';

import {TextLink, Txt, TxtVariant} from '../ui';

type AuthorLinksProps = {
  author: string;
  onOpen: (name: string) => void;
  variant?: TxtVariant;
  center?: boolean;
};

// One link per author for co-authored books ("Peter Baker, Susan Glasser").
export const AuthorLinks = ({
  author,
  onOpen,
  variant = 'body',
  center = false,
}: AuthorLinksProps) => {
  const names = author.split(/,\s*/);
  return (
    <View style={[styles.row, center && styles.center]}>
      {names.map((name, i) => (
        <View key={name} style={styles.item}>
          <TextLink
            label={name}
            variant={variant}
            color="ink"
            onPress={() => onOpen(name)}
          />
          {i < names.length - 1 ? <Txt variant={variant}>,</Txt> : null}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {flexDirection: 'row', flexWrap: 'wrap'},
  center: {justifyContent: 'center'},
  item: {flexDirection: 'row', alignItems: 'center'},
});
