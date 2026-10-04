import React from 'react';
import {
  View,
  StatusBar,
  ScrollView,
  Text,
  Image,
  TouchableOpacity,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {useTailwind} from 'tailwind-rn';
import {
  StarIcon,
  ChevronLeftIcon,
  ClockIcon,
  CalendarIcon,
} from 'react-native-heroicons/outline';
import List from './components/List';
import {RootStackScreenProps} from '../../navigator/types';

const SingleBooksScreen = ({
  navigation: {goBack},
  route,
}: RootStackScreenProps<'SingleBooksScreen'>) => {
  const tailwind = useTailwind();
  const {book} = route.params;

  return (
    <SafeAreaView style={tailwind('flex-1 bg-slate-100 dark:bg-slate-900')}>
      <StatusBar translucent backgroundColor="transparent" />

      <View style={tailwind('flex-row justify-between px-4 mt-4')}>
        <TouchableOpacity onPress={() => goBack()} style={tailwind('')}>
          <ChevronLeftIcon
            style={tailwind('text-slate-700 dark:text-slate-400')}
          />
        </TouchableOpacity>
        <Text
          style={tailwind(
            'text-slate-900 dark:text-slate-100 text-lg font-medium',
          )}>
          Book Details
        </Text>
      </View>

      <ScrollView
        style={tailwind('mx-4 mt-4')}
        showsVerticalScrollIndicator={false}>
        <View style={tailwind('')}>
          <List>
            <View style={tailwind('flex-row mb-2')}>
              <Image
                source={book.image}
                accessibilityLabel=""
                style={tailwind('w-28 h-28 flex-none rounded-md bg-slate-100')}
              />
              <View style={tailwind('relative flex-auto ml-2')}>
                <Text
                  style={tailwind('font-semibold text-base text-slate-400')}>
                  {book.title}
                </Text>
                <Text style={tailwind('font-semibold text-sm text-slate-400')}>
                  {book.subtitle}
                </Text>
                <View style={tailwind('mt-1 flex flex-wrap')}>
                  <View style={tailwind('flex-none w-full font-normal')}>
                    <Text style={tailwind('text-slate-400')}>
                      {`Author: ${book.cast}`}
                    </Text>
                  </View>
                  <View style={tailwind('flex-none w-full font-normal')}>
                    <Text style={tailwind('text-slate-400')}>
                      {`Narrator: ${book.narrator}`}
                    </Text>
                  </View>
                  {book.series ? (
                    <View style={tailwind('flex-none w-full font-normal')}>
                      <Text style={tailwind('text-slate-400')}>
                        {`Series: ${book.series}`}
                      </Text>
                    </View>
                  ) : null}
                  <View>
                    <View style={tailwind('flex-row items-center')}>
                      <Text
                        style={tailwind(
                          'text-slate-400 text-sm leading-6 font-normal',
                        )}>
                        {book.genre}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </List>
        </View>

        <View style={tailwind('flex-row justify-between mt-2')}>
          <View style={tailwind('')}>
            <ClockIcon
              style={tailwind('text-slate-700 dark:text-slate-500 text-center')}
            />
            <Text
              style={tailwind(
                'text-slate-700 dark:text-slate-500 text-center',
              )}>
              {book.runtime}
            </Text>
          </View>
          <View style={tailwind('')}>
            <CalendarIcon
              style={tailwind('text-slate-700 dark:text-slate-500 text-center')}
            />
            <Text
              style={tailwind(
                'text-slate-700 dark:text-slate-500 text-center',
              )}>
              {book.year}
            </Text>
          </View>
          <View style={tailwind('')}>
            <StarIcon style={tailwind('text-yellow-400 text-center')} />
            <Text
              style={tailwind(
                'text-slate-700 dark:text-slate-500 text-center',
              )}>
              {`${book.starRating} stars`}
            </Text>
          </View>
        </View>

        <View style={tailwind('mt-4')}>
          <Text>{book.summary}</Text>
        </View>

        <View style={tailwind('w-full mt-4')}>
          <Text style={tailwind('text-base font-medium tracking-tight')}>
            Rate this book
          </Text>
          <View style={tailwind('flex-row items-center')}>
            <View>
              <StarIcon style={tailwind('text-yellow-400')} />
            </View>
            <View>
              <StarIcon style={tailwind('text-yellow-400')} />
            </View>
            <View>
              <StarIcon style={tailwind('text-yellow-400')} />
            </View>
            <View>
              <StarIcon style={tailwind('text-yellow-400')} />
            </View>
            <View>
              <StarIcon style={tailwind('text-yellow-400')} />
            </View>
          </View>
          <Text style={tailwind('py-1 text-sm text-slate-400')}>
            Please give your star rating 1 to 5.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SingleBooksScreen;
