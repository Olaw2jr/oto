import React from 'react';
import {
  Image,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import {SafeAreaView} from 'react-native-safe-area-context';
import {
  StarIcon,
  ChevronLeftIcon,
  HandThumbUpIcon,
  ChatBubbleLeftRightIcon,
} from 'react-native-heroicons/outline';
import {useTailwind} from 'tailwind-rn';
import Comments from './components/Comments';
import {UpdateStackScreenProps} from '../../navigator/types';

const UpdateDetailsScreen = ({
  navigation: {goBack},
}: UpdateStackScreenProps<'UpdateDetailsScreen'>) => {
  const tailwind = useTailwind();

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
          Update Details
        </Text>
      </View>

      <ScrollView style={tailwind('mx-4')} showsVerticalScrollIndicator={false}>
        <View style={tailwind('p-2 mt-6')}>
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
                  <StarIcon
                    style={tailwind('w-5 h-5 text-yellow-400')}
                    size={18}
                  />
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
                  style={tailwind('text-sm text-teal-500 dark:text-teal-600')}>
                  Trevor Noah
                </Text>
              </TouchableOpacity>
              <Text
                style={tailwind('text-slate-500 dark:text-slate-400 text-sm')}>
                I was really surprised when Trevor Noah was named Jon Stewart's
                successor on The Daily Show . I inherently knew that they
                wouldn't pick someone with a sense of humor and style identical
                to Stewart's, but I felt that Noah was so different that his
                selection meant the show would have a really different feel,
                which might not appeal to long-time fans of the show. But I
                always root for the underdog, so as he was getting savaged by
                critics and fans in his first few days on the job, I kept hoping
                he'd be able to tough it out and show the stuff—comedic and
                otherwise—of which he was made.
              </Text>
            </View>
          </View>
        </View>

        <Comments currentUserId="bd7acbea-c1b1-46c2-aed5-3ad53abb2823" />

        <View style={tailwind('relative flex')}>
          <View style={tailwind('px-0')}>
            <View style={tailwind('flex-col w-full py-4')}>
              <View style={tailwind('flex flex-row')}>
                <Image
                  style={tailwind(
                    'w-12 h-12 border-2 border-slate-300 rounded-full',
                  )}
                  source={require('../../assets/images/avatar/Memoji-17.png')}
                />
                <View style={tailwind('flex-col mt-1')}>
                  <View style={tailwind('flex flex-1 px-4')}>
                    <Text
                      style={tailwind(
                        'font-bold  text-slate-500 dark:text-slate-400',
                      )}>
                      Noob master
                    </Text>
                    <Text
                      style={tailwind(
                        'text-xs font-normal text-slate-500 dark:text-slate-400',
                      )}>
                      2 weeks ago
                    </Text>
                  </View>
                  <View style={tailwind('flex-1 px-2 ml-2')}>
                    <Text
                      style={tailwind(
                        'text-sm text-slate-500 dark:text-slate-400',
                      )}>
                      I just couldn't put this book down. There are many moments
                      of comedy gold (that come across even better on audio, but
                      still drew out-loud laughter when I read them in print)
                      and lots of insight into what it was like growing up in
                      South Africa under the later years of apartheid, and after
                      its collapse (which I prefer reading in print so I can
                      take my time to appreciate the gravity of the issues).
                    </Text>
                  </View>
                  <View style={tailwind('flex-row')}>
                    <TouchableOpacity
                      style={tailwind('items-center px-1 pt-2')}>
                      <ChatBubbleLeftRightIcon
                        style={tailwind(
                          'ml-2 text-slate-500 dark:text-slate-400',
                        )}
                        size={18}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={tailwind('items-center px-1 pt-2')}>
                      <HandThumbUpIcon
                        style={tailwind('text-slate-500 dark:text-slate-400')}
                        size={18}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <View style={tailwind('my-2 ml-16 border-slate-600')} />

              <View style={tailwind('flex flex-row pt-1 ml-6')}>
                <Image
                  style={tailwind(
                    'w-12 h-12 border-2 border-slate-300 rounded-full',
                  )}
                  source={require('../../assets/images/avatar/Memoji-01.png')}
                />
                <View style={tailwind('flex-col mt-1')}>
                  <View style={tailwind('flex flex-1 px-4')}>
                    <Text
                      style={tailwind(
                        'font-bold text-slate-500 dark:text-slate-400',
                      )}>
                      John Doe
                    </Text>
                    <Text
                      style={tailwind(
                        'text-xs font-normal text-slate-500 dark:text-slate-400',
                      )}>
                      5 days ago
                    </Text>
                  </View>
                  <Text
                    style={tailwind(
                      'flex-1 px-2 ml-2 text-sm font-medium  text-slate-500 dark:text-slate-400',
                    )}>
                    Listened to this on eyy?
                  </Text>
                  <View style={tailwind('flex-row')}>
                    <TouchableOpacity
                      style={tailwind('items-center px-1 pt-2')}>
                      <ChatBubbleLeftRightIcon
                        style={tailwind(
                          'ml-2 text-slate-500 dark:text-slate-400',
                        )}
                        size={18}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={tailwind('items-center px-1 pt-2')}>
                      <HandThumbUpIcon
                        style={tailwind('text-slate-500 dark:text-slate-400')}
                        size={18}
                        fill={'#94b8a3'}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>

            <View style={tailwind('flex-col w-full py-4 mx-auto mt-2')}>
              <View style={tailwind('flex flex-row')}>
                <Image
                  style={tailwind(
                    'w-12 h-12 border-2 border-slate-300 rounded-full',
                  )}
                  source={require('../../assets/images/avatar/Memoji-18.png')}
                />
                <View style={tailwind('flex-col mt-1')}>
                  <View style={tailwind('flex flex-1 px-4')}>
                    <Text
                      style={tailwind(
                        'font-bold text-slate-500 dark:text-slate-400',
                      )}>
                      Anonymous
                    </Text>
                    <Text
                      style={tailwind(
                        'text-xs font-normal text-slate-500 dark:text-slate-400',
                      )}>
                      3 days ago
                    </Text>
                  </View>
                  <Text
                    style={tailwind(
                      'flex-1 px-2 ml-2 text-sm  text-slate-500 dark:text-slate-400',
                    )}>
                    If you're going to read this book, definitely listen to the
                    audio version. Trevor Noah is one of the most effortless
                    narrators I've ever listened to. It genuinely feels like he
                    is sitting down with you and telling you his life story. Not
                    only that, but you get to learn quite a bit about pre- and
                    post-Apartheid South Africa from the perspective of someone
                    who hypothetically shouldn't exist. Noah's mother is black
                    and his father is white, and when he was born any mixed-race
                    relationships were illegal. I was instantly intrigued by his
                    story, not only because of this unique perspective but also
                    because he is such a wonderful storyteller.
                  </Text>
                  <View style={tailwind('flex-row')}>
                    <TouchableOpacity
                      style={tailwind('items-center px-1 pt-2')}>
                      <ChatBubbleLeftRightIcon
                        style={tailwind(
                          'ml-2 text-slate-500 dark:text-slate-400',
                        )}
                        size={18}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={tailwind('items-center px-1 pt-2')}>
                      <HandThumbUpIcon
                        style={tailwind('text-slate-500 dark:text-slate-400')}
                        size={18}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={tailwind('flex px-4')}>
          <View style={tailwind('flex -mx-3 mb-6')}>
            <Text
              style={tailwind(
                'pt-3 pb-2 text-slate-900 dark:text-slate-100 text-base',
              )}>
              Add a new comment
            </Text>
            <View style={tailwind('w-full mb-2 mt-2')}>
              <TextInput
                style={tailwind(
                  'rounded border border-slate-400 leading-normal px-3 font-medium',
                )}
                numberOfLines={3}
                placeholder="Type Your Comment"
              />
            </View>
            <View style={tailwind('flex items-end')}>
              <TouchableOpacity
                style={tailwind(
                  'bg-slate-600 py-1 px-4 border border-slate-400 rounded-md',
                )}>
                <Text
                  style={tailwind(
                    'text-slate-400 font-medium text-base tracking-wide',
                  )}>
                  Post Comment
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default UpdateDetailsScreen;
