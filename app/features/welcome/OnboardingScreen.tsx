import React, {useState} from 'react';
import {Image, StyleSheet, View} from 'react-native';
import Svg, {Circle} from 'react-native-svg';

import {RootStackScreenProps} from '../../navigator/types';
import {useSession} from '../../state/session';
import {useTheme} from '../../theme/ThemeProvider';
import {catalogue} from '../../data/catalogue';
import {Avatar, Button, Screen, TextLink, Txt} from '../../ui';

const cover = (title: string) => catalogue.find(b => b.title === title)!.cover;

const steps = [
  {
    title: 'Find your next listen.',
    body: 'Browse by mood, follow people whose taste you trust, and see what they are finishing.',
  },
  {
    title: 'Say where you are.',
    body: 'Set your status, mark your progress, and leave a short review when you finish.',
  },
  {
    title: 'Listen together.',
    body: 'Join a book club, pin notes to the exact moment, and keep spoilers where they belong.',
  },
];

const Covers = () => (
  <View style={styles.coverStage}>
    <Image
      source={cover('Project Hail Mary')}
      style={[styles.cover, styles.coverA]}
    />
    <Image
      source={cover('Tuesdays with Morrie')}
      style={[styles.cover, styles.coverB]}
    />
    <Image
      source={cover('Where the Crawdads Sing')}
      style={[styles.cover, styles.coverC]}
    />
  </View>
);

const Progress = () => {
  const {colors} = useTheme();
  const statuses = ['Want', 'Listening', 'Finished'];
  return (
    <View style={styles.center}>
      <View>
        <Svg width={220} height={220} viewBox="0 0 220 220">
          <Circle
            cx={110}
            cy={110}
            r={90}
            fill="none"
            stroke={colors.track}
            strokeWidth={6}
          />
          <Circle
            cx={110}
            cy={110}
            r={90}
            fill="none"
            stroke={colors.ink}
            strokeWidth={6}
            strokeLinecap="round"
            strokeDasharray={[158.3, 565.5]}
            rotation={-90}
            origin="110, 110"
          />
          <Circle cx={198.4} cy={126.9} r={11} fill={colors.kaki} />
        </Svg>
        <View style={styles.ringLabel}>
          <Txt variant="title" style={styles.percent}>
            28%
          </Txt>
          <Txt variant="caption">Where the Crawdads Sing · Ch. 14</Txt>
        </View>
      </View>
      <View style={styles.pills}>
        {statuses.map(s => (
          <Txt
            key={s}
            variant="caption"
            weight={s === 'Listening' ? 'semibold' : 'medium'}
            color={s === 'Listening' ? 'onInk' : 'graphite'}
            style={[
              styles.pill,
              {backgroundColor: s === 'Listening' ? colors.ink : colors.field},
            ]}>
            {s}
          </Txt>
        ))}
      </View>
    </View>
  );
};

const Together = () => {
  const {colors} = useTheme();
  return (
    <View style={styles.center}>
      <View style={styles.faces}>
        {['Mika Tanaka', 'Zawadi Otieno', 'Daniel Kimani'].map((name, i) => (
          <View key={name} style={i > 0 && styles.overlap}>
            <Avatar name={name} size={76} ring />
          </View>
        ))}
      </View>
      <View style={[styles.note, {backgroundColor: colors.paper}]}>
        <View style={styles.noteHead}>
          <Txt
            variant="small"
            color="ink"
            weight="semibold"
            style={[styles.stamp, {backgroundColor: colors.segment}]}>
            3:12:12
          </Txt>
          <Txt variant="caption">Mika</Txt>
        </View>
        <Txt variant="quote" style={styles.noteBody}>
          Read this passage twice. It changes everything before it.
        </Txt>
      </View>
      <View style={styles.live}>
        <View style={[styles.liveDot, {backgroundColor: colors.kaki}]} />
        <Txt variant="label" color="ink">
          Quiet Pages · 8 listening
        </Txt>
      </View>
    </View>
  );
};

const OnboardingScreen = ({navigation}: RootStackScreenProps<'Onboarding'>) => {
  const {colors} = useTheme();
  const {completeOnboarding} = useSession();
  const [step, setStep] = useState(0);
  const last = step === steps.length - 1;

  const finish = () => {
    completeOnboarding();
    navigation.replace('SignUp');
  };

  return (
    <Screen
      footer={
        <View style={styles.footer}>
          <View
            accessible
            accessibilityLabel={`Step ${step + 1} of ${steps.length}`}
            style={styles.dots}>
            {steps.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  {backgroundColor: i === step ? colors.ink : colors.dotIdle},
                  i === step && styles.dotActive,
                ]}
              />
            ))}
          </View>
          <Button
            label={last ? 'Get started' : 'Continue'}
            onPress={last ? finish : () => setStep(step + 1)}
          />
        </View>
      }>
      <View style={styles.skip}>
        <TextLink
          label="Skip"
          role="button"
          color="graphite"
          variant="body"
          onPress={finish}
        />
      </View>
      <View style={[styles.stage, {backgroundColor: colors.surface}]}>
        {step === 0 ? <Covers /> : step === 1 ? <Progress /> : <Together />}
      </View>
      <View style={styles.copy}>
        <Txt variant="display" style={styles.title}>
          {steps[step].title}
        </Txt>
        <Txt color="graphite" style={styles.body}>
          {steps[step].body}
        </Txt>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  skip: {flexDirection: 'row', justifyContent: 'flex-end', marginTop: -4},
  stage: {height: 400, borderRadius: 32, overflow: 'hidden', marginTop: 10},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  coverStage: {width: 350, height: 400, alignSelf: 'center'},
  cover: {position: 'absolute', borderRadius: 10},
  coverA: {width: 150, height: 150, left: 30, top: 44},
  coverB: {width: 150, height: 150, left: 172, top: 112},
  coverC: {width: 176, height: 176, left: 66, top: 196},
  ringLabel: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  percent: {fontSize: 52, lineHeight: 58},
  pills: {flexDirection: 'row', marginTop: 28},
  pill: {
    height: 36,
    lineHeight: 36,
    paddingHorizontal: 16,
    borderRadius: 18,
    marginHorizontal: 4,
    overflow: 'hidden',
    fontSize: 13.5,
  },
  faces: {flexDirection: 'row', paddingLeft: 20},
  overlap: {marginLeft: -20},
  note: {
    width: 290,
    borderRadius: 22,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: 26,
  },
  noteHead: {flexDirection: 'row', alignItems: 'center'},
  stamp: {
    height: 26,
    lineHeight: 26,
    paddingHorizontal: 10,
    borderRadius: 13,
    overflow: 'hidden',
    marginRight: 8,
  },
  noteBody: {marginTop: 8, fontSize: 16},
  live: {flexDirection: 'row', alignItems: 'center', marginTop: 26},
  liveDot: {width: 8, height: 8, borderRadius: 4, marginRight: 8},
  copy: {paddingHorizontal: 8, marginTop: 28},
  title: {fontSize: 36, lineHeight: 42},
  body: {fontSize: 16, lineHeight: 25, marginTop: 12},
  footer: {alignItems: 'stretch'},
  dots: {flexDirection: 'row', justifyContent: 'center', marginBottom: 22},
  dot: {width: 6, height: 6, borderRadius: 3, marginHorizontal: 4},
  dotActive: {width: 22},
});

export default OnboardingScreen;
