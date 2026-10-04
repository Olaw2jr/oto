import React from 'react';
import {fireEvent, screen} from '@testing-library/react-native';

import {
  Avatar,
  Button,
  Chip,
  IconButton,
  ProgressBar,
  Segmented,
  Switch,
  Txt,
} from '../../app/ui';
import {colors} from '../../app/theme/colors';
import {fonts} from '../../app/theme/typography';
import {renderWithTheme} from '../test-utils';

describe('Txt', () => {
  it('uses the serif face for display text and sans for body', async () => {
    await renderWithTheme(
      <>
        <Txt variant="display">Discover</Txt>
        <Txt>Body copy</Txt>
        <Txt variant="caption">Muted</Txt>
      </>,
    );

    expect(screen.getByText('Discover')).toHaveStyle({
      fontFamily: fonts.serif.medium,
      fontSize: 34,
      color: colors.light.ink,
    });
    expect(screen.getByText('Body copy')).toHaveStyle({
      fontFamily: fonts.sans.regular,
    });
    expect(screen.getByText('Muted')).toHaveStyle({
      color: colors.light.graphite,
    });
  });

  it('marks headings for assistive tech', async () => {
    await renderWithTheme(<Txt variant="display">Settings</Txt>);
    expect(screen.getByRole('header', {name: 'Settings'})).toBeOnTheScreen();
  });
});

describe('Button', () => {
  it('is an accessible button that fires onPress', async () => {
    const onPress = jest.fn();
    await renderWithTheme(<Button label="Continue" onPress={onPress} />);

    fireEvent.press(screen.getByRole('button', {name: 'Continue'}));
    expect(onPress).toHaveBeenCalled();
  });

  it('has a 44pt minimum touch target', async () => {
    await renderWithTheme(
      <Button label="Join" size="small" onPress={jest.fn()} />,
    );
    const height = screen.getByRole('button', {name: 'Join'}).props.style;
    expect(JSON.stringify(height)).toMatch(/"(minHeight|height)":(4[4-9]|5\d)/);
  });
});

describe('IconButton', () => {
  it('requires and exposes an accessibility label', async () => {
    const onPress = jest.fn();
    await renderWithTheme(
      <IconButton icon="back" label="Back" onPress={onPress} />,
    );
    fireEvent.press(screen.getByRole('button', {name: 'Back'}));
    expect(onPress).toHaveBeenCalled();
  });
});

describe('Segmented', () => {
  it('is a radio group whose selection can change', async () => {
    const onChange = jest.fn();
    await renderWithTheme(
      <Segmented
        label="Your status"
        options={[
          {value: 'want', label: 'Want to listen'},
          {value: 'listening', label: 'Listening'},
          {value: 'finished', label: 'Finished'},
        ]}
        value="listening"
        onChange={onChange}
      />,
    );

    expect(
      screen.getByRole('radio', {name: 'Listening'}),
    ).toHaveAccessibilityState({
      checked: true,
    });
    fireEvent.press(screen.getByRole('radio', {name: 'Finished'}));
    expect(onChange).toHaveBeenCalledWith('finished');
  });
});

describe('Switch', () => {
  it('toggles and reports its state', async () => {
    const onChange = jest.fn();
    await renderWithTheme(
      <Switch label="Private profile" value={false} onChange={onChange} />,
    );

    const toggle = screen.getByRole('switch', {name: 'Private profile'});
    expect(toggle).toHaveAccessibilityState({checked: false});
    fireEvent.press(toggle);
    expect(onChange).toHaveBeenCalledWith(true);
  });
});

describe('Chip', () => {
  it('reports whether it is selected', async () => {
    await renderWithTheme(
      <Chip label="For you" selected onPress={jest.fn()} />,
    );
    expect(
      screen.getByRole('button', {name: 'For you'}),
    ).toHaveAccessibilityState({
      selected: true,
    });
  });
});

describe('ProgressBar', () => {
  it('exposes its value as a percentage', async () => {
    await renderWithTheme(<ProgressBar value={0.28} label="Progress" />);
    expect(screen.getByLabelText('Progress')).toHaveProp(
      'accessibilityValue',
      {min: 0, max: 100, now: 28},
    );
  });
});

describe('Avatar', () => {
  it('shows initials and is labelled with the full name', async () => {
    await renderWithTheme(<Avatar name="Amani Wekesa" />);
    expect(screen.getByText('AW')).toBeOnTheScreen();
    expect(screen.getByLabelText('Amani Wekesa')).toBeOnTheScreen();
  });
});
