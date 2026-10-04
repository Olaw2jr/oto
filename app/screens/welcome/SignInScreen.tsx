import React, {useState} from 'react';
import {StyleSheet, View} from 'react-native';

import OtoLogo from '../../components/OtoLogo';
import {RootStackScreenProps} from '../../navigator/types';
import {useSession} from '../../state/session';
import {useTheme} from '../../theme/ThemeProvider';
import {Button, Screen, TextField, TextLink, Txt} from '../../ui';
import {OrDivider} from './OrDivider';

const SignInScreen = ({navigation}: RootStackScreenProps<'SignIn'>) => {
  const {colorScheme} = useTheme();
  const {signIn} = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <Screen scroll contentStyle={styles.content}>
      <View style={styles.brand}>
        <OtoLogo size={30} decorative inverted={colorScheme === 'dark'} />
        <Txt weight="semibold" style={styles.wordmark}>
          oto
        </Txt>
      </View>

      <Txt variant="display" style={styles.title}>
        Welcome back.
      </Txt>
      <Txt color="graphite" style={styles.subtitle}>
        Sign in to pick up where you left off.
      </Txt>

      <View style={styles.sso}>
        <Button kind="secondary" label="Continue with Apple" onPress={signIn} />
        <View style={styles.spacer} />
        <Button
          kind="secondary"
          label="Continue with Google"
          onPress={signIn}
        />
      </View>

      <OrDivider />

      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
      />
      <TextField
        label="Password"
        secret
        value={password}
        onChangeText={setPassword}
        placeholder="Your password"
        autoComplete="password"
        textContentType="password"
      />
      <View style={styles.forgot}>
        <TextLink label="Forgot password?" role="button" onPress={() => {}} />
      </View>

      <Button label="Sign in" onPress={signIn} />

      <View style={styles.switch}>
        <Txt variant="caption">New to oto?</Txt>
        <TextLink
          label="Create an account"
          onPress={() => navigation.replace('SignUp')}
        />
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: {paddingTop: 64},
  brand: {flexDirection: 'row', alignItems: 'center'},
  wordmark: {fontSize: 22, lineHeight: 28, marginLeft: 9, letterSpacing: -0.3},
  title: {fontSize: 38, lineHeight: 43, marginTop: 34},
  subtitle: {marginTop: 8},
  sso: {marginTop: 26},
  spacer: {height: 10},
  forgot: {flexDirection: 'row', justifyContent: 'flex-end'},
  switch: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
  },
});

export default SignInScreen;
