import React from 'react';
import {Text, View, Image, TouchableOpacity} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useTailwind} from 'tailwind-rn';

import {ShelfData} from '../utils/MockData';

const Shelf: React.FC<ShelfData> = ({...props}) => {
  const tailwind = useTailwind();
  const navigation = useNavigation();

  return (
    <TouchableOpacity
      style={tailwind(
        'p-2 rounded-md bg-slate-100 dark:bg-slate-800 w-[48%] mr-3 mb-3',
      )}
      onPress={() => navigation.navigate('PlayerScreen')}>
      <View style={tailwind('items-start')}>
        <View>
          <Text style={tailwind('text-sm text-slate-900 dark:text-slate-100')}>
            {props.title}
          </Text>
        </View>
        <View>
          <Text style={tailwind('text-xs text-slate-500 dark:text-slate-400')}>
            {props.count} Books
          </Text>
        </View>
        <View style={tailwind('mt-2')}>
          <View style={tailwind('flex-row')}>
            <Image
              source={require('../assets/images/books/51QMk4Lt1kL.jpg')}
              accessibilityLabel="Becoming by Michelle Obama"
              style={tailwind(
                'w-6 h-6 rounded-full bg-slate-100 border-2 border-slate-100',
              )}
            />
            <Image
              source={require('../assets/images/books/41k+OevSHfL.jpg')}
              accessibilityLabel="The Moment of Lift How Empowering Women Changes the World by Melinda Gates"
              style={tailwind(
                'w-6 h-6 rounded-full bg-slate-100 border-2 border-slate-100 -ml-1.5',
              )}
            />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default Shelf;
