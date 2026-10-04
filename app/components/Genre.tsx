import React from 'react';
import {Text, View, Image, TouchableOpacity} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {StarIcon} from 'react-native-heroicons/outline';
import {useTailwind} from 'tailwind-rn';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {StackPrams} from '../../App';

type ReadingProps = {
  id: string;
  genre: string;
  cover_url: string;
};

const Genre: React.FC<ReadingProps> = ({...props}) => {
  const tailwind = useTailwind();
  const navigation = useNavigation<NativeStackNavigationProp<StackPrams>>();

  return (
    <TouchableOpacity
      style={tailwind(
        'rounded-md bg-slate-100 dark:bg-slate-800 w-[48%] mr-3 mb-3',
      )}
      onPress={() => navigation.navigate('PlayerScreen')}>
      <View style={tailwind('p-2 flex-row items-start')}>
        <View style={tailwind('flex-1')}>
          <Text
            style={tailwind('text-base text-slate-900 dark:text-slate-100')}>
            {props.genre}
          </Text>
        </View>
        <View style={tailwind('flex-none')}>
          <Image
            source={props.cover_url}
            accessibilityLabel={props.genre}
            style={tailwind('w-14 h-14 rounded-md bg-slate-100')}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default Genre;
