import React from 'react';
import * as Outline from 'react-native-heroicons/outline';
import * as Solid from 'react-native-heroicons/solid';

import {ColorToken} from '../theme/colors';
import {useTheme} from '../theme/ThemeProvider';

const icons = {
  home: Outline.HomeIcon,
  search: Outline.MagnifyingGlassIcon,
  following: Outline.Bars3BottomLeftIcon,
  clubs: Outline.UserGroupIcon,
  you: Outline.UserIcon,
  back: Outline.ChevronLeftIcon,
  down: Outline.ChevronDownIcon,
  forward: Outline.ChevronRightIcon,
  more: Outline.EllipsisHorizontalIcon,
  bookmark: Outline.BookmarkIcon,
  share: Outline.ArrowUpOnSquareIcon,
  heart: Outline.HeartIcon,
  heartFilled: Solid.HeartIcon,
  comment: Outline.ChatBubbleOvalLeftIcon,
  plus: Outline.PlusIcon,
  star: Outline.StarIcon,
  starFilled: Solid.StarIcon,
  settings: Outline.Cog6ToothIcon,
  bell: Outline.BellIcon,
  send: Outline.ArrowUpIcon,
  sleep: Outline.MoonIcon,
  play: Solid.PlayIcon,
  pause: Solid.PauseIcon,
  skipBack: Outline.ArrowUturnLeftIcon,
  skipForward: Outline.ArrowUturnRightIcon,
  note: Outline.PencilSquareIcon,
  check: Outline.CheckIcon,
  clock: Outline.ClockIcon,
  close: Outline.XMarkIcon,
  calendar: Outline.CalendarIcon,
};

export type IconName = keyof typeof icons;

type IconProps = {
  name: IconName;
  size?: number;
  color?: ColorToken;
  strokeWidth?: number;
};

export const Icon = ({
  name,
  size = 24,
  color = 'ink',
  strokeWidth = 1.7,
}: IconProps) => {
  const {colors} = useTheme();
  const Glyph = icons[name];
  return <Glyph size={size} color={colors[color]} strokeWidth={strokeWidth} />;
};
