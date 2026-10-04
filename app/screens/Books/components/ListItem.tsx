/**
 * Render the Breadcrumbs component.
 *
 * @author WebDevStudios
 * @param {object} props             The component attributes as props.
 * @param {Array}  props.breadcrumbs The breadcrumb array.
 * @return {Element}                 The Breadcrumbs component.
 */

import React from 'react';
import {Image, Text, TouchableOpacity, View} from 'react-native';

import {useTailwind} from 'tailwind-rn';
import {StarIcon, MinusSmallIcon} from 'react-native-heroicons/outline';

type BookProps = {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  starRating: string;
  rating: string;
  year: string;
  genre: string;
  runtime: string;
  cast: string;
};

const ListItem: React.FC<BookProps> = ({href, ...book}) => {
  const tailwind = useTailwind();

  return (
    <TouchableOpacity style={tailwind('flex-row mb-2')} onPress={href}>
      <Image
        source={book.image}
        accessibilityLabel=""
        style={tailwind('w-20 h-20 flex-none rounded-md bg-slate-100')}
      />
      <View style={tailwind('relative flex-auto ml-2')}>
        <Text style={tailwind('font-semibold text-base text-slate-400')}>
          Project Hail Mary
        </Text>
        <View style={tailwind('mt-1 flex-row flex-wrap')}>
          <View
            style={tailwind('absolute top-0 right-0 flex-row items-center')}>
            <View style={tailwind('')}>
              <StarIcon style={tailwind('text-yellow-400 mr-2')} size={18} />
            </View>
            <Text style={tailwind('text-slate-400 text-base font-medium')}>
              5
            </Text>
          </View>
          <View style={tailwind('')}>
            <Text
              style={tailwind('text-slate-400 text-sm leading-6 font-normal')}>
              En
            </Text>
          </View>
          <View style={tailwind('ml-2')}>
            <Text
              style={tailwind('text-slate-400 text-sm leading-6 font-normal')}>
              May 4 2021
            </Text>
          </View>
          <View>
            <View style={tailwind('flex-row items-center')}>
              <MinusSmallIcon style={tailwind('mx-1 text-slate-400')} />
              <Text
                style={tailwind(
                  'text-slate-400 text-sm leading-6 font-normal',
                )}>
                Adventure
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
                16h and 10m
              </Text>
            </View>
          </View>
          <View style={tailwind('flex-none w-full font-normal')}>
            <Text style={tailwind('text-slate-400')}>Andy Weir</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default ListItem;
