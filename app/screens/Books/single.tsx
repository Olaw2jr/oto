import React from "react";
import {
  View,
  StatusBar,
  ScrollView,
  Text,
  Image,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTailwind } from "tailwind-rn";
import {
  StarIcon,
  ChevronLeftIcon,
  ClockIcon,
  CalendarIcon,
} from "react-native-heroicons/outline";
import List from "./components/List";

const SingleBooksScreen = ({ navigation: { goBack }, route }) => {
  const tailwind = useTailwind();

  return (
    <SafeAreaView style={tailwind("flex-1 bg-slate-100 dark:bg-slate-900")}>
      <StatusBar translucent backgroundColor="transparent" />

      <View style={tailwind("flex-row justify-between px-4 mt-4")}>
        <TouchableOpacity onPress={() => goBack()} style={tailwind("")}>
          <ChevronLeftIcon
            style={tailwind("text-slate-700 dark:text-slate-400")}
          />
        </TouchableOpacity>
        <Text
          style={tailwind(
            "text-slate-900 dark:text-slate-100 text-lg font-medium"
          )}
        >
          Book Details
        </Text>
      </View>

      <ScrollView
        style={tailwind("mx-4 mt-4")}
        showsVerticalScrollIndicator={false}
      >
        <View style={tailwind("")}>
          <List>
            <View style={tailwind("flex-row mb-2")}>
              <Image
                source={route.params.image}
                accessibilityLabel=""
                style={tailwind("w-28 h-28 flex-none rounded-md bg-slate-100")}
              />
              <View style={tailwind("relative flex-auto ml-2")}>
                <Text
                  style={tailwind("font-semibold text-base text-slate-400")}
                >
                  Atomic Habits
                </Text>
                <Text style={tailwind("font-semibold text-sm text-slate-400")}>
                  An Easy & Proven Way to Build Good Habits & Break Bad Ones
                </Text>
                <View style={tailwind("mt-1 flex flex-wrap")}>
                  <View style={tailwind("flex-none w-full font-normal")}>
                    <Text style={tailwind("text-slate-400")}>
                      Author: James Clear
                    </Text>
                  </View>
                  <View style={tailwind("flex-none w-full font-normal")}>
                    <Text style={tailwind("text-slate-400")}>
                      Narrator: James Clear
                    </Text>
                  </View>
                  <View>
                    <View style={tailwind("flex-row items-center")}>
                      <Text
                        style={tailwind(
                          "text-slate-400 text-sm leading-6 font-normal"
                        )}
                      >
                        Supernatural, Suspense, Fantasy
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </List>
        </View>

        <View style={tailwind("flex-row justify-between mt-2")}>
          <View style={tailwind("")}>
            <ClockIcon
              style={tailwind("text-slate-700 dark:text-slate-500 text-center")}
            />
            <Text
              style={tailwind("text-slate-700 dark:text-slate-500 text-center")}
            >
              5 Hrs 35 Min
            </Text>
          </View>
          <View style={tailwind("")}>
            <CalendarIcon
              style={tailwind("text-slate-700 dark:text-slate-500 text-center")}
            />
            <Text
              style={tailwind("text-slate-700 dark:text-slate-500 text-center")}
            >
              16 Oct 2018
            </Text>
          </View>
          <View style={tailwind("")}>
            <StarIcon style={tailwind("text-yellow-400 text-center")} />
            <Text
              style={tailwind("text-slate-700 dark:text-slate-500 text-center")}
            >
              35 Reviews
            </Text>
          </View>
        </View>

        <View style={tailwind("mt-4")}>
          <Text>
            The number one New York Times best seller. Over one million copies
            sold!(\r\n\r\n)Tiny Changes, Remarkable Results(\r\n\r\n)No matter
            your goals, Atomic Habits offers a proven framework for improving -
            every day. James Clear, one of the world's leading experts on habit
            formation, reveals practical strategies that will teach you exactly
            how to form good habits, break bad ones, and master the tiny
            behaviors that lead to remarkable results.(\r\n\r\n)If you're having
            trouble changing your habits, the problem isn't you. The problem is
            your system. Bad habits repeat themselves again and again not
            because you don't want to change, but because you have the wrong
            system for change. You do not rise to the level of your goals. You
            fall to the level of your systems. Here, you'll get a proven system
            that can take you to new heights.(\r\n\r\n)Clear is known for his
            ability to distill complex topics into simple behaviors that can be
            easily applied to daily life and work. Here, he draws on the most
            proven ideas from biology, psychology, and neuroscience to create an
            easy-to-understand guide for making good habits inevitable and bad
            habits impossible. Along the way, listeners will be inspired and
            entertained with true stories from Olympic gold medalists,
            award-winning artists, business leaders, life-saving physicians, and
            star comedians who have used the science of small habits to master
            their craft and vault to the top of their field.(\r\n\r\n)Learn how
            to:(\r\n\r\n)Make time for new habits (even when life gets
            crazy)(\r\n)Overcome a lack of motivation and willpower\r\nDesign
            your environment to make success easier\r\nGet back on track when
            you fall off course(\r\n)And much more(\r\n)Atomic Habits will
            reshape the way you think about progress and success, and give you
            the tools and strategies you need to transform your habits - whether
            you are a team looking to win a championship, an organization hoping
            to redefine an industry, or simply an individual who wishes to quit
            smoking, lose weight, reduce stress, or achieve any other
            goal.(\r\n\r\n\u)00a92018 James Clear (P)2018 Penguin Audio
          </Text>
        </View>

        <View style={tailwind("w-full mt-4")}>
          <Text style={tailwind("text-base font-medium tracking-tight")}>
            Rate this book
          </Text>
          <View style={tailwind("flex-row items-center")}>
            <View>
              <StarIcon style={tailwind("text-yellow-400")} />
            </View>
            <View>
              <StarIcon style={tailwind("text-yellow-400")} />
            </View>
            <View>
              <StarIcon style={tailwind("text-yellow-400")} />
            </View>
            <View>
              <StarIcon style={tailwind("text-yellow-400")} />
            </View>
            <View>
              <StarIcon style={tailwind("text-yellow-400")} />
            </View>
          </View>
          <Text style={tailwind("py-1 text-sm text-slate-400")}>
            Please give your star rating 1 to 5.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SingleBooksScreen;
