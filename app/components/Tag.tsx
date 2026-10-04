import React from 'react';
import {Text, TouchableOpacity} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useTailwind} from 'tailwind-rn';

type AuthorProps = {
  id: string;
  name: string;
};

const Tag: React.FC<AuthorProps> = ({...props}) => {
  const tailwind = useTailwind();
  const navigation = useNavigation();

  return (
    <TouchableOpacity
      style={tailwind('items-start mr-3')}
      onPress={() => navigation.navigate('Player')}>
      <Text
        style={tailwind(
          'border border-cyan-100 text-cyan-800 text-sm mb-3 px-2.5 py-1 rounded dark:border-cyan-200 dark:text-cyan-500',
        )}>
        {props.name}
      </Text>
    </TouchableOpacity>
  );
};

export default Tag;
