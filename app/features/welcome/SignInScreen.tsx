import React, {useState} from 'react';
import {StyleSheet, View} from 'react-native';

import OtoLogo from '../../components/OtoLogo';
import {RootStackScreenProps} from '../../navigator/types';
import {useSession} from '../../state/session';
import {useTheme} from '../../theme/ThemeProvider';
import {Button, Screen, TextField, TextLink, Txt} from '../../ui';
import {DeveloperSignIn} from './DeveloperSignIn';
import {OrDivider} from './OrDivider';
import {useAccountSignIn} from './useAccountSignIn';

const SignInScreen = ({navigation}: RootStackScreenProps<'SignIn'>) => {
  const {colorScheme} = useTheme();
  const {signIn} = useSession();
  const account = useAccountSignIn();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // No backend yet, so password resets only explain what would happen.
  const [resetNote, setResetNote] = useState(false);

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
          onPress={account.continueWithGoogle}
        />
      </View>
      {account.failed ? (
        <Txt variant="caption" accessibilityRole="alert" style={styles.failed}>
          Couldn't sign you in. Please try again.
        </Txt>
      ) : null}

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
        <TextLink
          label="Forgot password?"
          role="button"
          onPress={() => setResetNote(true)}
        />
      </View>

      {resetNote ? (
        <Txt
          variant="caption"
          accessibilityRole="alert"
          style={styles.resetNote}>
          {email.trim()
            ? `We'll email a reset link to ${email.trim()}.`
            : 'Enter your email above and we will send you a reset link.'}
        </Txt>
      ) : null}
      <Button label="Sign in" onPress={signIn} />

      <View style={styles.switch}>
        <Txt variant="caption">New to oto?</Txt>
        <TextLink
          label="Create an account"
          onPress={() => navigation.replace('SignUp')}
        />
      </View>

      <DeveloperSignIn
        readers={account.developerReaders}
        onPick={account.signInAsDeveloper}
      />
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
  resetNote: {marginBottom: 12},
  failed: {marginTop: 12},
  forgot: {flexDirection: 'row', justifyContent: 'flex-end'},
  switch: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
  },
});

export default SignInScreen;
