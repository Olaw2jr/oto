import React from 'react';
import {StyleSheet, View} from 'react-native';

import type {DeveloperReader} from '../../auth';
import {Button, Txt} from '../../ui';

// Seeded readers on a development backend (DEV_LOGIN in oto-api). Hidden
// whenever the backend doesn't offer them.
export const DeveloperSignIn = ({
  readers,
  onPick,
}: {
  readers: DeveloperReader[];
  onPick: (handle: string) => void;
}) =>
  readers.length ? (
    <View style={styles.box}>
      <Txt variant="label">Developer sign-in</Txt>
      {readers.map(reader => (
        <View key={reader.handle} style={styles.reader}>
          <Button
            kind="secondary"
            label={reader.name}
            accessibilityLabel={`Sign in as ${reader.name}`}
            onPress={() => onPick(reader.handle)}
          />
        </View>
      ))}
    </View>
  ) : null;

const styles = StyleSheet.create({
  box: {marginTop: 28},
  reader: {marginTop: 10},
});
