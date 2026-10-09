import React from 'react';
import {StyleSheet, Text, TextProps, TextStyle} from 'react-native';

import {ColorToken} from '../theme/colors';
import {useTheme} from '../theme/ThemeProvider';
import {fonts} from '../theme/typography';

const variants = StyleSheet.create({
  display: {fontFamily: fonts.serif.medium, fontSize: 34, lineHeight: 44},
  title: {fontFamily: fonts.serif.medium, fontSize: 26, lineHeight: 30},
  heading: {fontFamily: fonts.serif.medium, fontSize: 20, lineHeight: 26},
  bookTitle: {fontFamily: fonts.serif.medium, fontSize: 17, lineHeight: 21},
  quote: {fontFamily: fonts.serif.medium, fontSize: 15.5, lineHeight: 23},
  body: {fontFamily: fonts.sans.regular, fontSize: 15, lineHeight: 21},
  strong: {fontFamily: fonts.sans.semibold, fontSize: 15, lineHeight: 21},
  caption: {fontFamily: fonts.sans.regular, fontSize: 13, lineHeight: 18},
  small: {fontFamily: fonts.sans.regular, fontSize: 12, lineHeight: 16},
  label: {
    fontFamily: fonts.sans.semibold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.3,
    textTransform: 'uppercase',
  },
});

export type TxtVariant = keyof typeof variants;

const mutedByDefault: TxtVariant[] = ['caption', 'small', 'label'];
const headings: TxtVariant[] = ['display', 'title', 'heading'];

type TxtProps = TextProps & {
  variant?: TxtVariant;
  color?: ColorToken;
  weight?: keyof typeof fonts.sans;
  align?: TextStyle['textAlign'];
};

export const Txt = ({
  variant = 'body',
  color,
  weight,
  align,
  style,
  ...props
}: TxtProps) => {
  const {colors} = useTheme();
  const tone = color ?? (mutedByDefault.includes(variant) ? 'graphite' : 'ink');

  return (
    <Text
      accessibilityRole={headings.includes(variant) ? 'header' : undefined}
      // Follow the system font size, capped so layouts stay usable.
      maxFontSizeMultiplier={headings.includes(variant) ? 1.5 : 2}
      {...props}
      style={[
        variants[variant],
        {color: colors[tone]},
        weight && {fontFamily: fonts.sans[weight]},
        align && {textAlign: align},
        style,
      ]}
    />
  );
};
