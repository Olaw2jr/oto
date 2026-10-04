import React from 'react';
import {render, screen} from '@testing-library/react-native';
import {Circle} from 'react-native-svg';

import OtoLogo from '../../app/components/OtoLogo';
import {colors} from '../../app/theme/colors';

const circles = () => screen.UNSAFE_getAllByType(Circle);

describe('OtoLogo', () => {
  it('is an accessible image labelled with the brand name', () => {
    render(<OtoLogo size={44} />);

    const logo = screen.getByLabelText('oto');
    expect(logo).toHaveProp('accessibilityRole', 'image');
  });

  it('can be hidden from assistive tech when decorative', () => {
    render(<OtoLogo size={30} decorative />);

    expect(screen.queryByLabelText('oto')).toBeNull();
  });

  it('draws an open ink ring with a kaki dot', () => {
    render(<OtoLogo size={44} />);

    const [ring, dot] = circles();
    expect(ring.props.stroke).toBe(colors.light.ink);
    expect(ring.props.strokeDasharray).toBeTruthy();
    expect(dot.props.fill).toBe(colors.light.kaki);
  });

  it('uses the dark palette when inverted', () => {
    render(<OtoLogo size={44} inverted />);

    const [ring, dot] = circles();
    expect(ring.props.stroke).toBe(colors.dark.ink);
    expect(dot.props.fill).toBe(colors.dark.kaki);
  });
});
