import React from 'react';
import Svg, {Circle, Path} from 'react-native-svg';

// An outline car in the Heroicons style (24×24, round strokes); Heroicons
// has no car.
export const CarIcon = ({
  size = 24,
  color = 'currentColor',
  strokeWidth = 1.7,
}: {
  size?: number;
  color?: string;
  strokeWidth?: number;
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4.5 13.5 6.2 8.4A2 2 0 0 1 8.1 7h7.8a2 2 0 0 1 1.9 1.4l1.7 5.1M4.5 13.5h15M4.5 13.5A1.5 1.5 0 0 0 3 15v2.25c0 .41.34.75.75.75H5.25M19.5 13.5A1.5 1.5 0 0 1 21 15v2.25a.75.75 0 0 1-.75.75H18.75M9 18h6"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx={7} cy={18} r={1.75} stroke={color} strokeWidth={strokeWidth} />
    <Circle cx={17} cy={18} r={1.75} stroke={color} strokeWidth={strokeWidth} />
  </Svg>
);
