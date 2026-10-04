import React, {useState} from 'react';
import {StyleSheet, TextInput, View} from 'react-native';

import {useTheme} from '../../theme/ThemeProvider';
import {fonts} from '../../theme/typography';
import {Button, Card, TextLink} from '../../ui';

type NewShelfFormProps = {
  onCreate: (name: string) => void;
  onCancel: () => void;
};

export const NewShelfForm = ({onCreate, onCancel}: NewShelfFormProps) => {
  const {colors} = useTheme();
  const [name, setName] = useState('');
  const create = () => name.trim() && onCreate(name.trim());

  return (
    <Card style={styles.card}>
      <TextInput
        accessibilityLabel="Shelf name"
        autoFocus
        placeholder="Name your shelf"
        placeholderTextColor={colors.graphite}
        value={name}
        onChangeText={setName}
        onSubmitEditing={create}
        returnKeyType="done"
        style={[
          styles.input,
          {color: colors.ink, borderBottomColor: colors.hairline},
        ]}
      />
      <View style={styles.actions}>
        <TextLink
          label="Cancel"
          role="button"
          color="graphite"
          onPress={onCancel}
        />
        <Button
          label="Create"
          accessibilityLabel="Create shelf"
          size="small"
          disabled={!name.trim()}
          onPress={create}
        />
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {padding: 16, borderRadius: 22, marginTop: 12},
  input: {
    fontFamily: fonts.sans.regular,
    fontSize: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
});
