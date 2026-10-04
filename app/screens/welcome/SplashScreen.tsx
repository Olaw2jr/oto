import React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';

import OtoLogo from '../../components/OtoLogo';
import {RootStackScreenProps} from '../../navigator/types';
import {useSession} from '../../state/session';
import {useTheme} from '../../theme/ThemeProvider';
import {Txt} from '../../ui';

const SplashScreen = ({navigation}: RootStackScreenProps<'Splash'>) => {
  const {colors, colorScheme} = useTheme();
  const {hasOnboarded} = useSession();
  const next = hasOnboarded ? 'SignIn' : 'Onboarding';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        hasOnboarded ? 'Continue to sign in' : 'Continue to onboarding'
      }
      onPress={() => navigation.replace(next)}
      style={[styles.root, {backgroundColor: colors.paper}]}>
      <View
        style={[styles.halo, styles.haloLarge, {borderColor: colors.hairline}]}
      />
      <View
        style={[styles.halo, styles.haloSmall, {borderColor: colors.hairline}]}
      />
      <View style={styles.mark}>
        <OtoLogo size={116} inverted={colorScheme === 'dark'} />
        <Txt weight="semibold" style={styles.wordmark}>
          oto
        </Txt>
      </View>
      <Txt
        variant="quote"
        color="graphite"
        align="center"
        style={styles.tagline}>
        A quiet place to listen, together.
      </Txt>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  halo: {position: 'absolute', borderWidth: 1, borderRadius: 999},
  haloLarge: {
    width: 700,
    height: 700,
    top: '50%',
    left: '50%',
    marginTop: -380,
    marginLeft: -350,
  },
  haloSmall: {
    width: 460,
    height: 460,
    top: '50%',
    left: '50%',
    marginTop: -380,
    marginLeft: -230,
  },
  mark: {alignItems: 'center', marginTop: -110},
  wordmark: {fontSize: 44, lineHeight: 52, letterSpacing: -0.9, marginTop: 18},
  tagline: {position: 'absolute', left: 0, right: 0, bottom: 78, fontSize: 15},
});

export default SplashScreen;
