import React from 'react';
import {StyleSheet} from 'react-native';

import {Screen, Txt} from '../ui';

// Interim tab content until the screen's own PR lands.
const ComingSoonScreen = ({title}: {title: string}) => (
  <Screen>
    <Txt variant="display">{title}</Txt>
    <Txt color="graphite" style={styles.body}>
      Arriving in the next update.
    </Txt>
  </Screen>
);

const styles = StyleSheet.create({body: {marginTop: 8}});

export default ComingSoonScreen;
