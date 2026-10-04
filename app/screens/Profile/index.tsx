import React from 'react';
import {
  Text,
  View,
  Image,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {useTailwind} from 'tailwind-rn';

const ProfileScreen = () => {
  const tailwind = useTailwind();
  const SCREEN_WIDTH = Dimensions.get('window').width;

  return (
    <SafeAreaView style={tailwind('flex-1 bg-slate-100 dark:bg-slate-900')}>
      <StatusBar translucent backgroundColor="transparent" />

      <ScrollView style={tailwind('mx-4')}>
        <View style={tailwind('flex-row items-center mt-6')}>
          <Image
            style={tailwind('w-20 h-20 rounded-full')}
            source={require('../../assets/images/avatar/Memoji-18.png')}
            accessibilityLabel="Jese Leos"
          />

          <View style={tailwind('ml-4')}>
            <Text style={tailwind('text-slate-900 dark:text-slate-100')}>
              Jese Leos
            </Text>
            <Text
              style={tailwind('text-sm text-slate-700 dark:text-slate-500')}>
              Member since August 2022
            </Text>

            <View style={{width: SCREEN_WIDTH * 0.65}}>
              <View style={tailwind('flex-row justify-between mt-2')}>
                <TouchableOpacity style={tailwind('')}>
                  <Text
                    style={tailwind(
                      'text-slate-700 dark:text-slate-500 text-center',
                    )}>
                    102
                  </Text>
                  <Text
                    style={tailwind(
                      'text-slate-700 dark:text-slate-500 text-center',
                    )}>
                    Books
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={tailwind('')}>
                  <Text
                    style={tailwind(
                      'text-slate-700 dark:text-slate-500 text-center',
                    )}>
                    91
                  </Text>
                  <Text
                    style={tailwind(
                      'text-slate-700 dark:text-slate-500 text-center',
                    )}>
                    Groups
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={tailwind('')}>
                  <Text
                    style={tailwind(
                      'text-slate-700 dark:text-slate-500 text-center',
                    )}>
                    465
                  </Text>
                  <Text
                    style={tailwind(
                      'text-slate-700 dark:text-slate-500 text-center',
                    )}>
                    Friends
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        <View style={tailwind('w-full mt-4')}>
          <Text style={tailwind('text-sm text-slate-700 dark:text-slate-500')}>
            There are two motives for reading a book; one, that you enjoy it;
            the other, that you can boast about it [ on oto ].
          </Text>
          <Text style={tailwind('text-sm text-slate-700 dark:text-slate-500')}>
            @jese
          </Text>

          <View style={tailwind('flex-row mt-4')}>
            <TouchableOpacity
              style={tailwind(
                'bg-slate-600 px-4 py-1 rounded-md text-slate-100',
              )}>
              <Text>Follow</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;
