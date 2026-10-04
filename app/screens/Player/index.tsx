import React, {useState} from 'react';
import {StatusBar, TouchableOpacity, View, Image, Text} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import {
  PlayIcon,
  PauseIcon,
  ShareIcon,
  ChevronDownIcon,
  BookmarkIcon,
  ArrowUturnRightIcon,
  ArrowUturnLeftIcon,
} from 'react-native-heroicons/outline';
import {useTailwind} from 'tailwind-rn';

import toHHMMSS from '../../utils/time';
import {RootStackScreenProps} from '../../navigator/types';

const PlayerScreen = ({
  navigation: {goBack},
}: RootStackScreenProps<'PlayerScreen'>) => {
  const tailwind = useTailwind();

  const [paused, setPaused] = useState(true);
  const [totalLength] = useState(68580);
  const [currentPosition, setCurrentPosition] = useState(18000);

  const togglePlay = () => {
    setPaused(!paused);
  };

  return (
    <SafeAreaView style={tailwind('flex-1 bg-slate-100 dark:bg-slate-900')}>
      <StatusBar translucent backgroundColor="transparent" />

      <View style={tailwind('flex flex-row justify-between mx-4 mt-8')}>
        <TouchableOpacity onPress={() => goBack()} style={tailwind('')}>
          <ChevronDownIcon
            style={tailwind('text-slate-700 dark:text-slate-400')}
          />
        </TouchableOpacity>

        <View style={tailwind('flex flex-row')}>
          <TouchableOpacity style={tailwind('flex-grow-0')}>
            <ShareIcon style={tailwind('text-slate-700 dark:text-slate-400')} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={tailwind('mx-4 mt-16')}>
        <View style={tailwind('flex items-center')}>
          <Image
            source={require('../../assets/images/books/51QMk4Lt1kL.jpg')}
            style={tailwind('rounded-md bg-slate-100 w-80 h-80')}
          />
          <View style={tailwind('items-center mt-8')}>
            <Text
              style={tailwind(
                'text-slate-500 dark:text-slate-400 text-sm leading-6',
              )}>
              Chapter 12
            </Text>
            <Text
              style={tailwind(
                'text-slate-900 dark:text-slate-100 text-base leading-6 mt-2',
              )}>
              Becoming
            </Text>
            <Text
              style={tailwind('text-cyan-500 dark:text-cyan-400 text-sm mt-2')}>
              Michelle Obama
            </Text>
          </View>
        </View>

        <View style={tailwind('mt-8')}>
          <Slider
            style={tailwind('w-full')}
            minimumValue={0}
            maximumValue={Math.max(totalLength, 1, currentPosition + 1)}
            minimumTrackTintColor="#22d3ee"
            maximumTrackTintColor="#94a3b8"
            thumbTintColor="#22d3ee"
            value={currentPosition}
            onValueChange={value => setCurrentPosition(value)}
          />
          <View
            style={tailwind(
              'flex-row justify-between text-sm leading-6 font-medium tabular-nums',
            )}>
            <Text style={tailwind('text-slate-500 dark:text-slate-400')}>
              {toHHMMSS(currentPosition)}
            </Text>
            <Text style={tailwind('text-slate-500 dark:text-slate-400')}>
              {toHHMMSS(totalLength)}
            </Text>
          </View>
        </View>
      </View>

      <View style={tailwind('flex-row items-center mt-8')}>
        <View
          style={tailwind('flex-auto flex-row items-center justify-evenly')}>
          <TouchableOpacity aria-label="Add to favorites">
            <BookmarkIcon
              style={tailwind('text-slate-500 dark:text-slate-400')}
            />
          </TouchableOpacity>

          <TouchableOpacity aria-label="Rewind 10 seconds">
            <ArrowUturnLeftIcon
              style={tailwind('text-slate-500 dark:text-slate-400')}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={tailwind(
            'bg-slate-800 dark:bg-slate-100 flex-none -my-2 mx-auto w-20 h-20 rounded-full items-center justify-center',
          )}
          onPress={togglePlay}
          aria-label="Pause">
          {paused ? (
            <PlayIcon
              style={tailwind('text-slate-500 dark:text-slate-400 ml-1.5')}
              size={38}
            />
          ) : (
            <PauseIcon
              style={tailwind('text-slate-500 dark:text-slate-400')}
              size={38}
            />
          )}
        </TouchableOpacity>

        <View
          style={tailwind('flex-auto flex-row items-center justify-evenly')}>
          <TouchableOpacity aria-label="Skip 10 seconds">
            <ArrowUturnRightIcon
              style={tailwind('text-slate-500 dark:text-slate-400')}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={tailwind('rounded-md px-2 border dark:border-slate-400')}>
            <Text
              style={tailwind(
                'text-sm leading-6 font-semibold text-slate-500 dark:text-slate-400',
              )}>
              1x
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default PlayerScreen;
