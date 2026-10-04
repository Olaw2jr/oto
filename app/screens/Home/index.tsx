import React from 'react';
import {
  Image,
  Text,
  TouchableOpacity,
  ScrollView,
  View,
  FlatList,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ChevronDownIcon, StarIcon} from 'react-native-heroicons/outline';
import {useTailwind} from 'tailwind-rn';

import CurrentlyCard from '../../components/CurrentlyCard';
import LikeButton from '../../components/LikeButton';
import CommentButton from '../../components/CommentButton';
import state from '../../utils/MockData';
import {UpdateStackScreenProps} from '../../navigator/types';

const HomeScreen = ({navigation}: UpdateStackScreenProps<'HomeScreen'>) => {
  const tailwind = useTailwind();

  return (
    <SafeAreaView
      style={tailwind('flex-1 bg-slate-100 dark:bg-slate-900 pb-12')}>
      <ScrollView
        style={tailwind('mx-4 mt-4')}
        showsVerticalScrollIndicator={false}>
        <View style={tailwind('flex-row justify-between')}>
          <Text style={tailwind('text-slate-900 dark:text-slate-100 text-lg')}>
            Currently listening
          </Text>
          <TouchableOpacity style={tailwind('')}>
            <Text
              style={tailwind('text-cyan-500 dark:text-cyan-400 text-base')}>
              See all
            </Text>
          </TouchableOpacity>
        </View>

        <View style={tailwind('mt-4')}>
          <FlatList
            data={state.fetchCurrentlyListen}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={item => item.id.toString()}
            renderItem={({item}) => <CurrentlyCard {...item} />}
          />
        </View>

        <View style={tailwind('mt-3 flex-row justify-between')}>
          <Text style={tailwind('text-slate-900 dark:text-slate-100 text-lg')}>
            Updates
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate('UpdateDetailsScreen')}
          style={tailwind(
            'bg-slate-100 dark:bg-slate-800 rounded-md p-2 mt-3',
          )}>
          <View style={tailwind('flex-row')}>
            <Image
              style={tailwind('w-10 h-10 rounded-full')}
              source={require('../../assets/images/avatar/Memoji-18.png')}
              accessibilityLabel="Pauly Morefuss"
            />
            <View style={tailwind('ml-2 flex-1')}>
              <View style={tailwind('flex-row')}>
                <Text
                  style={tailwind(
                    'text-base font-medium text-slate-900 dark:text-slate-100',
                  )}>
                  Pauly Morefuss
                </Text>
                <Text
                  style={tailwind(
                    'ml-2 text-base font-medium text-slate-500 dark:text-slate-400',
                  )}>
                  rated
                </Text>
                <View style={tailwind('flex-row ml-2')}>
                  <StarIcon style={tailwind('text-yellow-400')} size={16} />
                  <Text
                    style={tailwind(
                      'ml-2 text-base font-medium text-slate-500 dark:text-slate-400',
                    )}>
                    4.1
                  </Text>
                </View>
              </View>
              <Text
                style={tailwind('text-sm text-slate-500 dark:text-slate-400')}>
                3 days ago
              </Text>
            </View>
            <TouchableOpacity style={tailwind('')}>
              <ChevronDownIcon
                style={tailwind('text-slate-500 dark:text-slate-400')}
              />
            </TouchableOpacity>
          </View>

          <View style={tailwind('flex-row mt-3')}>
            <Image
              style={tailwind('w-24 h-24 rounded-md flex-none')}
              source={require('../../assets/images/books/51xFefhj2iL._SL500_.jpg')}
              accessibilityLabel="Hard Choices"
            />
            <View style={tailwind('pl-2 flex-1')}>
              <Text
                style={tailwind(
                  'text-slate-900 dark:text-slate-100 text-base font-medium',
                )}>
                Hard Choices
              </Text>
              <TouchableOpacity style={tailwind('')}>
                <Text
                  style={tailwind('text-sm text-cyan-500 dark:text-cyan-400')}>
                  Hillary Rodham Clinton
                </Text>
              </TouchableOpacity>
              <Text
                style={tailwind('text-slate-500 dark:text-slate-400 text-sm')}>
                For me, this is a truly beautiful book. It is a surprising blend
                of being well-researched, historic, and heart-warming. I am in
                awe of her accomplishments, intelligence, and patriotic service
                to our country.
              </Text>
            </View>
          </View>

          <View style={tailwind('flex-row justify-end mt-3')}>
            <LikeButton />

            <CommentButton />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('UpdateDetailsScreen')}
          style={tailwind(
            'bg-slate-100 dark:bg-slate-800 rounded-md p-2 mt-3',
          )}>
          <View style={tailwind('flex-row')}>
            <Image
              style={tailwind('w-10 h-10 rounded-full')}
              source={require('../../assets/images/avatar/Memoji-01.png')}
              accessibilityLabel="Jese Leos"
            />
            <View style={tailwind('ml-2 flex-1')}>
              <View style={tailwind('flex-row')}>
                <Text
                  style={tailwind(
                    'text-base font-medium text-slate-900 dark:text-slate-100',
                  )}>
                  Jese Leos
                </Text>
                <Text
                  style={tailwind(
                    'ml-2 text-base font-medium text-slate-500 dark:text-slate-400',
                  )}>
                  wants to listen
                </Text>
              </View>
              <Text
                style={tailwind('text-sm text-slate-500 dark:text-slate-400')}>
                4 days ago
              </Text>
            </View>
            <TouchableOpacity style={tailwind('right-0')}>
              <ChevronDownIcon
                style={tailwind('text-slate-500 dark:text-slate-400')}
              />
            </TouchableOpacity>
          </View>

          <View style={tailwind('flex-row mt-3')}>
            <Image
              style={tailwind('w-24 h-24 rounded-md flex-none')}
              source={require('../../assets/images/books/51xWgLZHDCL.jpg')}
              accessibilityLabel="Born a Crime Stories from a South African Childhood"
            />
            <View style={tailwind('pl-2 flex-1')}>
              <Text
                style={tailwind(
                  'text-slate-900 dark:text-slate-100 text-base font-medium',
                )}>
                Radical Candor Be a Kick-Ass Boss Without Losing Your Humanity
              </Text>
              <TouchableOpacity style={tailwind('')}>
                <Text
                  style={tailwind('text-sm text-cyan-500 dark:text-cyan-400')}>
                  Kim Scott
                </Text>
              </TouchableOpacity>
              <Text
                style={tailwind('text-sm text-slate-500 dark:text-slate-400')}>
                10 hrs and 2 mins
              </Text>
              <View style={tailwind('flex-row items-center mt-2')}>
                <StarIcon style={tailwind('text-yellow-400')} size={16} />
                <Text
                  style={tailwind(
                    'ml-2 text-sm text-slate-500 dark:text-slate-400',
                  )}>
                  4.95
                </Text>
                <View
                  style={tailwind(
                    'w-1 h-1 mx-1.5 bg-slate-500 rounded-full dark:bg-slate-400',
                  )}
                />
                <Text
                  style={tailwind(
                    'text-sm text-slate-500 dark:text-slate-400',
                  )}>
                  73 Reviews
                </Text>
              </View>
            </View>
          </View>

          <View style={tailwind('flex-row justify-end mt-3')}>
            <LikeButton />

            <CommentButton />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('UpdateDetailsScreen')}
          style={tailwind(
            'bg-slate-100 dark:bg-slate-800 rounded-md p-2 mt-3',
          )}>
          <View style={tailwind('flex-row')}>
            <Image
              style={tailwind('w-10 h-10 rounded-full')}
              source={require('../../assets/images/avatar/Memoji-17.png')}
              accessibilityLabel="Jese Leos"
            />
            <View style={tailwind('ml-2 flex-1')}>
              <View style={tailwind('flex-row')}>
                <Text
                  style={tailwind(
                    'text-base font-medium text-slate-900 dark:text-slate-100',
                  )}>
                  Jane Doe
                </Text>
                <Text
                  style={tailwind(
                    'ml-2 text-base font-medium text-slate-500 dark:text-slate-400',
                  )}>
                  made progress...
                </Text>
              </View>
              <Text
                style={tailwind('text-sm text-slate-500 dark:text-slate-400')}>
                3 days ago
              </Text>
            </View>
            <TouchableOpacity style={tailwind('right-0')}>
              <ChevronDownIcon
                style={tailwind('text-slate-500 dark:text-slate-400')}
              />
            </TouchableOpacity>
          </View>

          <View style={tailwind('flex-row mt-3')}>
            <Image
              style={tailwind('w-24 h-24 rounded-md flex-none')}
              source={require('../../assets/images/books/41AbpgAXGoL.jpg')}
              accessibilityLabel="Born a Crime Stories from a South African Childhood"
            />
            <View style={tailwind('pl-2 flex-1')}>
              <Text
                style={tailwind(
                  'text-slate-900 dark:text-slate-100 text-base font-medium',
                )}>
                Bad Blood Secrets and Lies in a Silicon Valley Startup
              </Text>
              <TouchableOpacity style={tailwind('')}>
                <Text
                  style={tailwind('text-sm text-cyan-500 dark:text-cyan-400')}>
                  John Carreyrou
                </Text>
              </TouchableOpacity>
              <Text
                style={tailwind(
                  'my-2 text-sm text-slate-700 dark:text-slate-500',
                )}>
                4 hrs of 11 hrs and 37 mins
              </Text>
              <View
                style={tailwind(
                  'w-full rounded-full h-1 mb-2 bg-slate-700 dark:bg-slate-500',
                )}>
                <View
                  style={tailwind(
                    'h-1 rounded-full bg-cyan-500 dark:bg-cyan-400 w-1/4',
                  )}
                />
              </View>
            </View>
          </View>

          <View style={tailwind('flex-row justify-end mt-3')}>
            <LikeButton />

            <CommentButton />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('UpdateDetailsScreen')}
          style={tailwind(
            'bg-slate-100 dark:bg-slate-800 rounded-md p-2 mt-3',
          )}>
          <View style={tailwind('flex-row')}>
            <Image
              style={tailwind('w-10 h-10 rounded-full')}
              source={require('../../assets/images/avatar/Memoji-18.png')}
              accessibilityLabel="Jese Leos"
            />
            <View style={tailwind('ml-2 flex-1')}>
              <View style={tailwind('flex-row')}>
                <Text
                  style={tailwind(
                    'text-base font-medium text-slate-900 dark:text-slate-100',
                  )}>
                  John Doe
                </Text>
                <Text
                  style={tailwind(
                    'ml-2 text-base font-medium text-slate-500 dark:text-slate-400',
                  )}>
                  rated
                </Text>
                <View style={tailwind('flex-row ml-2')}>
                  <StarIcon style={tailwind('text-yellow-400')} size={16} />
                  <Text
                    style={tailwind(
                      'ml-2 text-base font-medium text-slate-500 dark:text-slate-400',
                    )}>
                    4.95
                  </Text>
                </View>
              </View>
              <Text
                style={tailwind('text-sm text-slate-500 dark:text-slate-400')}>
                3 days ago
              </Text>
            </View>
            <TouchableOpacity style={tailwind('')}>
              <ChevronDownIcon
                style={tailwind('text-slate-500 dark:text-slate-400')}
              />
            </TouchableOpacity>
          </View>

          <View style={tailwind('flex-row mt-3')}>
            <Image
              style={tailwind('w-24 h-24 rounded-md flex-none')}
              source={require('../../assets/images/books/51Mc--F6zGL.jpg')}
              accessibilityLabel="Born a Crime Stories from a South African Childhood"
            />
            <View style={tailwind('pl-2 flex-1')}>
              <Text
                style={tailwind(
                  'text-slate-900 dark:text-slate-100 text-base font-medium',
                )}>
                Born a Crime Stories from a South African Childhood
              </Text>
              <TouchableOpacity style={tailwind('')}>
                <Text
                  style={tailwind('text-sm text-cyan-500 dark:text-cyan-400')}>
                  Trevor Noah
                </Text>
              </TouchableOpacity>
              <Text
                style={tailwind('text-slate-500 dark:text-slate-400 text-sm')}>
                I was really surprised when Trevor Noah was named Jon Stewarts
                successor on the daily show. I inherently knew that the wouldn't
                pick some...
              </Text>
            </View>
          </View>

          <View style={tailwind('flex-row justify-end mt-3')}>
            <LikeButton />

            <CommentButton />
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;
