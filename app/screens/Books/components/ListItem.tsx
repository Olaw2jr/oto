import React from 'react';
import {Image, Text, TouchableOpacity, View} from 'react-native';

import {useTailwind} from 'tailwind-rn';
import {StarIcon, MinusSmallIcon} from 'react-native-heroicons/outline';

import {Book} from '../../../utils/MockData';

type ListItemProps = {
  book: Book;
  href: () => void;
};

const ListItem = ({href, book}: ListItemProps) => {
  const tailwind = useTailwind();

  return (
    <TouchableOpacity style={tailwind('flex-row mb-2')} onPress={href}>
      <Image
        source={book.image}
        accessibilityLabel={`Cover of ${book.title}`}
        style={tailwind('w-20 h-20 flex-none rounded-md bg-slate-100')}
      />
      <View style={tailwind('relative flex-auto ml-2')}>
        <Text style={tailwind('font-semibold text-base text-slate-400')}>
          {book.title}
        </Text>
        <View style={tailwind('mt-1 flex-row flex-wrap')}>
          <View
            style={tailwind('absolute top-0 right-0 flex-row items-center')}>
            <View style={tailwind('')}>
              <StarIcon style={tailwind('text-yellow-400 mr-2')} size={18} />
            </View>
            <Text style={tailwind('text-slate-400 text-base font-medium')}>
              {book.starRating}
            </Text>
          </View>
          <View style={tailwind('')}>
            <Text
              style={tailwind('text-slate-400 text-sm leading-6 font-normal')}>
              {book.rating}
            </Text>
          </View>
          <View style={tailwind('ml-2')}>
            <Text
              style={tailwind('text-slate-400 text-sm leading-6 font-normal')}>
              {book.year}
            </Text>
          </View>
          <View>
            <View style={tailwind('flex-row items-center')}>
              <MinusSmallIcon style={tailwind('mx-1 text-slate-400')} />
              <Text
                style={tailwind(
                  'text-slate-400 text-sm leading-6 font-normal',
                )}>
                {book.genre}
              </Text>
            </View>
          </View>
          <View>
            <View style={tailwind('flex-row items-center')}>
              <MinusSmallIcon style={tailwind('mx-1 text-slate-400')} />
              <Text
                style={tailwind(
                  'text-slate-400 text-sm leading-6 font-normal',
                )}>
                {book.runtime}
              </Text>
            </View>
          </View>
          <View style={tailwind('flex-none w-full font-normal')}>
            <Text style={tailwind('text-slate-400')}>{book.cast}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default ListItem;
