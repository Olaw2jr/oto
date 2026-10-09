import React, {ReactNode, useState} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';

import {getPerson, ME} from '../../data/people';
import {RootStackScreenProps} from '../../navigator/types';
import {usePlayer} from '../../state/player';
import {useSession} from '../../state/session';
import {useSocial} from '../../state/social';
import {NotificationsSheet} from '../../components/NotificationsSheet';
import {
  NOTIFICATION_LABELS,
  SKIP_OPTIONS,
  SkipIntervals,
  useSettings,
} from '../../state/settings';
import {AppearancePreference, useTheme} from '../../theme/ThemeProvider';
import {
  Avatar,
  Button,
  Card,
  Icon,
  Screen,
  Segmented,
  Sheet,
  SheetRow,
  Switch,
  Txt,
} from '../../ui';

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

const skipLabel = (s: SkipIntervals) => `${s.back} s · ${s.forward} s`;

const SettingsScreen = ({navigation}: RootStackScreenProps<'Settings'>) => {
  const [sheet, setSheet] = useState<
    'skip' | 'notifications' | 'muted' | 'hidden' | null
  >(null);
  const social = useSocial();
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
          <View
            accessible
            accessibilityLabel={`Signed in as ${me.name}, @${me.handle}`}
            style={styles.profile}>
            <Avatar name={me.name} size={44} />
            <View style={styles.profileText}>
              <Txt variant="strong">{me.name}</Txt>
              <Txt variant="caption">{`@${me.handle}`}</Txt>
            </View>
          </View>
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
        <ValueRow
          label="Skip back and forward"
          value={skipLabel(settings.skip)}
          onPress={() => setSheet('skip')}
        />
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
        <ValueRow
          label="Muted people"
          value={
            social.mutedPeople.length
              ? String(social.mutedPeople.length)
              : 'None'
          }
          onPress={() => setSheet('muted')}
        />
        <ValueRow
          label="Hidden updates"
          value={social.hiddenCount ? String(social.hiddenCount) : 'None'}
          onPress={() => setSheet('hidden')}
        />
        <ValueRow
          label="Notifications"
          value={NOTIFICATION_LABELS[settings.notifications]}
          onPress={() => setSheet('notifications')}
          last
        />
      </Card>

      <Txt variant="label" style={styles.label}>
        Appearance
      </Txt>
      <View style={styles.appearance}>
        <Segmented
          label="Appearance"
          options={appearanceOptions}
          value={preference}
          onChange={setPreference}
        />
      </View>

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
      <Sheet
        visible={sheet === 'skip'}
        title="Skip back and forward"
        onClose={() => setSheet(null)}>
        {SKIP_OPTIONS.map(option => (
          <SheetRow
            key={skipLabel(option)}
            label={skipLabel(option)}
            selected={
              option.back === settings.skip.back &&
              option.forward === settings.skip.forward
            }
            onPress={() => {
              settings.set('skip', option);
              setSheet(null);
            }}
          />
        ))}
      </Sheet>
      <NotificationsSheet
        visible={sheet === 'notifications'}
        onClose={() => setSheet(null)}
      />
      <Sheet
        visible={sheet === 'muted'}
        title="Muted people"
        onClose={() => setSheet(null)}>
        {social.mutedPeople.length ? (
          social.mutedPeople.map(id => (
            <SheetRow
              key={id}
              icon="mute"
              label={getPerson(id).short}
              value="Unmute"
              accessibilityLabel={`Unmute ${getPerson(id).short}`}
              onPress={() => social.unmute(id)}
            />
          ))
        ) : (
          <Txt color="graphite" style={styles.sheetNote}>
            You haven't muted anyone.
          </Txt>
        )}
      </Sheet>
      <Sheet
        visible={sheet === 'hidden'}
        title="Hidden updates"
        onClose={() => setSheet(null)}>
        <Txt color="graphite" style={styles.sheetNote}>
          {social.hiddenCount
            ? `${social.hiddenCount} ${
                social.hiddenCount === 1 ? 'update is' : 'updates are'
              } hidden from your feed.`
            : 'Nothing is hidden from your feed.'}
        </Txt>
        {social.hiddenCount ? (
          <Button
            label="Show hidden updates again"
            onPress={() => {
              social.unhideAll();
              setSheet(null);
            }}
          />
        ) : null}
      </Sheet>
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
  sheetNote: {marginVertical: 12},
  profile: {flexDirection: 'row', alignItems: 'center', paddingVertical: 12},
  profileText: {marginLeft: 14},
  value: {flexDirection: 'row', alignItems: 'center'},
  valueText: {fontSize: 14.5, marginRight: 4},
  label: {marginTop: 20, marginBottom: -4, marginLeft: 6},
  appearance: {marginTop: 12},
  signOutGroup: {marginTop: 20},
});

export default SettingsScreen;
