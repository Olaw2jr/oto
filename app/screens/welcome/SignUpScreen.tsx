import React, {useState} from 'react';
import {StyleSheet, View} from 'react-native';

import {RootStackScreenProps} from '../../navigator/types';
import {useSession} from '../../state/session';
import {
  Button,
  Checkbox,
  IconButton,
  Screen,
  TextField,
  TextLink,
  Txt,
} from '../../ui';
import {OrDivider} from './OrDivider';

const TERMS = 'I agree to the Terms and Privacy Policy.';

const SignUpScreen = ({navigation}: RootStackScreenProps<'SignUp'>) => {
  const {signIn} = useSession();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(true);

  return (
    <Screen scroll>
      <View style={styles.back}>
        <IconButton
          icon="back"
          label="Back"
          onPress={() => navigation.goBack()}
        />
      </View>

      <Txt variant="display" style={styles.title}>
        Create your account.
      </Txt>
      <Txt color="graphite" style={styles.subtitle}>
        It takes a minute. Your shelf starts empty, which is fine.
      </Txt>

      <View style={styles.form}>
        <TextField
          label="Name"
          value={name}
          onChangeText={setName}
          placeholder="How friends will see you"
          autoComplete="name"
          textContentType="name"
        />
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
          placeholder="At least 8 characters"
          autoComplete="password-new"
          textContentType="newPassword"
        />
      </View>

      <Checkbox label={TERMS} value={agreed} onChange={setAgreed}>
        <Txt variant="caption">
          I agree to the{' '}
          <Txt variant="caption" color="ink" weight="semibold">
            Terms
          </Txt>{' '}
          and{' '}
          <Txt variant="caption" color="ink" weight="semibold">
            Privacy Policy
          </Txt>
          .
        </Txt>
      </Checkbox>

      <Button label="Create account" onPress={signIn} disabled={!agreed} />

      <OrDivider />
      <View style={styles.sso}>
        <Button
          kind="secondary"
          label="Apple"
          accessibilityLabel="Continue with Apple"
          onPress={signIn}
          stretch
        />
        <View style={styles.spacer} />
        <Button
          kind="secondary"
          label="Google"
          accessibilityLabel="Continue with Google"
          onPress={signIn}
          stretch
        />
      </View>

      <View style={styles.switch}>
        <Txt variant="caption">Already have an account?</Txt>
        <TextLink
          label="Sign in"
          onPress={() => navigation.replace('SignIn')}
        />
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  back: {marginLeft: -12, alignSelf: 'flex-start'},
  title: {fontSize: 38, lineHeight: 43, marginTop: 10},
  subtitle: {marginTop: 8},
  form: {marginTop: 12},
  sso: {flexDirection: 'row'},
  spacer: {width: 10},
  switch: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
});

export default SignUpScreen;
