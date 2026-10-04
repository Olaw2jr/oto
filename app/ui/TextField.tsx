import React, {useState} from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';

import {useTheme} from '../theme/ThemeProvider';
import {fonts} from '../theme/typography';
import {Txt} from './Txt';

type TextFieldProps = Omit<TextInputProps, 'style'> & {
  label: string;
  secret?: boolean;
};

export const TextField = ({
  label,
  secret = false,
  ...props
}: TextFieldProps) => {
  const {colors} = useTheme();
  const [revealed, setRevealed] = useState(false);

  return (
    <View style={styles.field}>
      <Txt variant="caption" color="ink" weight="semibold" style={styles.label}>
        {label}
      </Txt>
      <View
        style={[
          styles.box,
          {backgroundColor: colors.surface, borderColor: colors.switchOff},
        ]}>
        <TextInput
          accessibilityLabel={label}
          placeholderTextColor={colors.graphite}
          secureTextEntry={secret && !revealed}
          autoCapitalize={secret ? 'none' : props.autoCapitalize}
          {...props}
          style={[styles.input, {color: colors.ink}]}
        />
        {secret ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Hide password' : 'Show password'}
            onPress={() => setRevealed(r => !r)}
            style={styles.reveal}>
            <Txt variant="caption" color="ink" weight="semibold">
              {revealed ? 'Hide' : 'Show'}
            </Txt>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  field: {marginTop: 14},
  label: {marginBottom: 6},
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    paddingLeft: 16,
    paddingRight: 6,
  },
  input: {flex: 1, fontFamily: fonts.sans.regular, fontSize: 16, padding: 0},
  reveal: {
    minWidth: 52,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
