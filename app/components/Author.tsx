import React from 'react';
import {Text, View, Image, TouchableOpacity} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useTailwind} from 'tailwind-rn';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {StackPrams} from '../../App';

type AuthorProps = {
  id: string;
  name: string;
  avatar: string;
};

const Author: React.FC<AuthorProps> = ({...props}) => {
  const tailwind = useTailwind();
  const navigation = useNavigation<NativeStackNavigationProp<StackPrams>>();

  return (
    <TouchableOpacity
      style={tailwind('flex-none pr-3')}
      onPress={() => navigation.navigate('PlayerScreen')}>
      <View style={tailwind('flex flex-col items-center justify-center')}>
        <Image
          style={tailwind('w-20 h-20 rounded-full mb-3')}
          source={props.avatar}
        />
        <Text style={tailwind('text-slate-900 text-sm dark:text-slate-200')}>
          {props.name}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default Author;
