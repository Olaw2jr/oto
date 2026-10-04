import React from 'react';
import Svg, {Circle} from 'react-native-svg';

import {colors} from '../theme/colors';
import logo from '../theme/logo';

type OtoLogoProps = {
  size: number;
  // Draw for dark backgrounds.
  inverted?: boolean;
  // Hide from assistive tech when the word "oto" sits next to the mark.
  decorative?: boolean;
  // What screen readers hear; defaults to the brand name.
  label?: string;
};

const OtoLogo = ({
  size,
  inverted = false,
  decorative = false,
  label = 'oto',
}: OtoLogoProps) => {
  const palette = inverted ? colors.dark : colors.light;
  const {ring, dot, viewBox} = logo;

  return (
    <Svg
      width={size}
      height={size}
      viewBox={`0 0 ${viewBox} ${viewBox}`}
      accessible={!decorative}
      accessibilityRole={decorative ? undefined : 'image'}
      accessibilityLabel={decorative ? undefined : label}
      importantForAccessibility={decorative ? 'no-hide-descendants' : 'yes'}>
      <Circle
        cx={ring.cx}
        cy={ring.cy}
        r={ring.r}
        fill="none"
        stroke={palette.ink}
        strokeWidth={ring.strokeWidth}
        strokeLinecap="round"
        strokeDasharray={ring.dashArray}
        rotation={ring.rotation}
        origin={`${ring.cx}, ${ring.cy}`}
      />
      <Circle cx={dot.cx} cy={dot.cy} r={dot.r} fill={palette.kaki} />
    </Svg>
  );
};

export default OtoLogo;
