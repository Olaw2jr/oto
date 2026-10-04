import React, {ReactNode} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';

import {getPerson, ME} from '../../data/people';
import {RootStackScreenProps} from '../../navigator/types';
import {usePlayer} from '../../state/player';
import {useSession} from '../../state/session';
import {useSettings} from '../../state/settings';
import {AppearancePreference, useTheme} from '../../theme/ThemeProvider';
import {Avatar, Card, Icon, Screen, Segmented, Switch, Txt} from '../../ui';

const appearanceOptions: {value: AppearancePreference; label: string}[] = [
  {value: 'system', label: 'System'},
  {value: 'light', label: 'Light'},
  {value: 'dark', label: 'Dark'},
];

const Row = ({
  children,
  last = false,
}: {
  children: ReactNode;
  last?: boolean;
}) => {
  const {colors} = useTheme();
  return (
    <View
      style={[
        styles.row,
        !last && [styles.divider, {borderBottomColor: colors.hairline}],
      ]}>
      {children}
    </View>
  );
};

const ValueRow = ({
  label,
  value,
  onPress,
  last,
}: {
  label: string;
  value: string;
  onPress?: () => void;
  last?: boolean;
}) => (
  <Pressable
    accessibilityRole="button"
    accessibilityLabel={`${label}, ${value}`}
    onPress={onPress}>
    <Row last={last}>
      <Txt>{label}</Txt>
      <View style={styles.value}>
        <Txt variant="caption" style={styles.valueText}>
          {value}
        </Txt>
        <Icon name="forward" size={18} color="graphite" />
      </View>
    </Row>
  </Pressable>
);

const SwitchRow = ({
  label,
  value,
  onChange,
  last,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  last?: boolean;
}) => (
  <Row last={last}>
    <Txt>{label}</Txt>
    <Switch label={label} value={value} onChange={onChange} />
  </Row>
);

const SettingsScreen = ({navigation}: RootStackScreenProps<'Settings'>) => {
  const {preference, setPreference} = useTheme();
  const {signOut} = useSession();
  const settings = useSettings();
  const player = usePlayer();
  const me = getPerson(ME);

  return (
    <Screen scroll>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back to You"
        onPress={() => navigation.goBack()}
        style={styles.back}>
        <Icon name="back" size={22} />
        <Txt style={styles.backText}>You</Txt>
      </Pressable>
      <Txt variant="display">Settings</Txt>

      <Card style={styles.group}>
        <Row last>
          <View style={styles.profile}>
            <Avatar name={me.name} size={44} />
            <View style={styles.profileText}>
              <Txt variant="strong">{me.name}</Txt>
              <Txt variant="caption">{`@${me.handle}`}</Txt>
            </View>
          </View>
          <Icon name="forward" size={18} color="graphite" />
        </Row>
      </Card>

      <Txt variant="label" style={styles.label}>
        Listening
      </Txt>
      <Card style={styles.group}>
        <ValueRow
          label="Playback speed"
          value={`${player.rate}×`}
          onPress={player.cycleRate}
        />
        <ValueRow label="Skip back and forward" value="15 s · 30 s" />
        <SwitchRow
          label="Download on Wi-Fi only"
          value={settings.wifiOnly}
          onChange={v => settings.set('wifiOnly', v)}
          last
        />
      </Card>

      <Txt variant="label" style={styles.label}>
        Social
      </Txt>
      <Card style={styles.group}>
        <SwitchRow
          label="Private profile"
          value={settings.privateProfile}
          onChange={v => settings.set('privateProfile', v)}
        />
        <SwitchRow
          label="Spoiler-safe by default"
          value={settings.spoilerSafe}
          onChange={v => settings.set('spoilerSafe', v)}
        />
        <ValueRow label="Notifications" value="Club sessions" last />
      </Card>

      <Txt variant="label" style={styles.label}>
        Appearance
      </Txt>
      <Segmented
        label="Appearance"
        options={appearanceOptions}
        value={preference}
        onChange={setPreference}
      />

      <Card style={[styles.group, styles.signOutGroup]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sign out"
          onPress={signOut}>
          <Row last>
            <Txt variant="strong" color="danger">
              Sign out
            </Txt>
          </Row>
        </Pressable>
      </Card>
    </Screen>
  );
};

const styles = StyleSheet.create({
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    alignSelf: 'flex-start',
    marginLeft: -6,
  },
  backText: {marginLeft: 2},
  group: {borderRadius: 20, overflow: 'hidden', marginTop: 12},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
    paddingHorizontal: 16,
  },
  divider: {borderBottomWidth: 1},
  profile: {flexDirection: 'row', alignItems: 'center', paddingVertical: 12},
  profileText: {marginLeft: 14},
  value: {flexDirection: 'row', alignItems: 'center'},
  valueText: {fontSize: 14.5, marginRight: 4},
  label: {marginTop: 20, marginBottom: -4, marginLeft: 6},
  signOutGroup: {marginTop: 20},
});

export default SettingsScreen;
