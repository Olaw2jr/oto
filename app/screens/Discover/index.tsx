import React from "react";
import {
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import {
  BellIcon,
  StarIcon,
  MagnifyingGlassIcon,
} from "react-native-heroicons/outline";
import { useTailwind } from "tailwind-rn";
import Recommend from "../../components/Recommend";
import Genre from "../../components/Genre";
import Author from "../../components/Author";
import state from "../../utils/MockData";

const DiscoverScreen = () => {
  const tailwind = useTailwind();
  const SCREEN_WIDTH = Dimensions.get("window").width;

  return (
    <SafeAreaView
      style={tailwind("flex-1 bg-slate-100 dark:bg-slate-900 pb-8")}
    >
      <StatusBar translucent backgroundColor="transparent" />

      <View style={{ width: SCREEN_WIDTH }}>
        <View style={tailwind("m-4 flex-row relative")}>
          <View
            style={tailwind(
              "flex-none absolute pl-3 py-3 pointer-events-none z-10"
            )}
          >
            <MagnifyingGlassIcon
              style={tailwind("text-slate-500 dark:text-slate-400 h-6 w-6")}
            />
          </View>

          <TextInput
            style={tailwind(
              "flex-1 bg-slate-100 border border-slate-300 rounded-md w-full pl-10 dark:bg-slate-800 dark:border-slate-700"
            )}
            placeholder="Search for a books or an author"
            placeholderTextColor={"#94a3b8"}
          />
        </View>
      </View>

      <ScrollView
        style={tailwind("mx-4 mb-6")}
        showsVerticalScrollIndicator={false}
      >
        <View style={tailwind("flex-row justify-between")}>
          <Text
            style={tailwind("text-slate-900 dark:text-slate-100 text-base")}
          >
            Recommended for you
          </Text>
          <TouchableOpacity style={tailwind("")}>
            <Text style={tailwind("text-cyan-500 dark:text-cyan-400 text-sm")}>
              See all
            </Text>
          </TouchableOpacity>
        </View>

        <View style={tailwind("mt-3 rounded-md flex-row")}>
          <FlatList
            data={state.recommended}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => <Recommend {...item} />}
          />
        </View>

        <View style={tailwind("mt-6 flex-row")}>
          <Text
            style={tailwind("text-slate-900 dark:text-slate-100 text-base")}
          >
            Because you have read{" "}
          </Text>
          <TouchableOpacity style={tailwind("")}>
            <Text
              ellipsizeMode="tail"
              style={tailwind("text-cyan-500 dark:text-cyan-400 text-base")}
            >
              Shoe Dog A Memoir by the Creator of Nike
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={tailwind(
            "bg-slate-100 dark:bg-slate-800 rounded-md p-2 mt-4 flex-row"
          )}
        >
          <Image
            style={tailwind("w-28 h-28 rounded-md flex-none")}
            source={require("../../assets/images/books/515JEwTAtbL.jpg")}
            accessibilityLabel="The Sound of Gravel A Memoir"
          />
          <View style={tailwind("pl-2 flex-1")}>
            <Text
              style={tailwind(
                "text-slate-900 dark:text-slate-100 text-base font-medium"
              )}
            >
              The Sound of Gravel A Memoir
            </Text>
            <TouchableOpacity style={tailwind("")}>
              <Text
                style={tailwind("text-sm text-cyan-500 dark:text-cyan-400")}
              >
                Ruth Wariner
              </Text>
            </TouchableOpacity>
            <View style={tailwind("flex-row items-center")}>
              <StarIcon style={tailwind("text-yellow-400")} size={16} />
              <Text
                style={tailwind(
                  "ml-2 text-sm text-slate-500 dark:text-slate-400"
                )}
              >
                4.95
              </Text>
              <View
                style={tailwind(
                  "w-1 h-1 mx-1.5 bg-slate-500 rounded-full dark:bg-slate-400"
                )}
              />
              <Text
                style={tailwind("text-sm text-slate-500 dark:text-slate-400")}
              >
                73 reviews
              </Text>
            </View>
            <Text
              numberOfLines={3}
              style={tailwind("text-slate-500 dark:text-slate-400 text-sm")}
            >
              A riveting, deeply-affecting audiobook memoir of one girl's
              coming-of-age experiences in a polygamist cult. Ruth Wariner was
              the 39th of her father's 42 children. Growing up on a farm in
              rural Mexico, where authorities turned a blind eye to the
              practices of her community, Ruth lives in a ramshackle house
              without indoor plumbing or electricity.
            </Text>
          </View>
        </TouchableOpacity>

        <View style={tailwind("mt-6 flex-row justify-between")}>
          <Text
            style={tailwind("text-slate-900 dark:text-slate-100 text-base")}
          >
            Top Genres
          </Text>
          <TouchableOpacity style={tailwind("")}>
            <Text style={tailwind("text-cyan-500 dark:text-cyan-400 text-sm")}>
              See all
            </Text>
          </TouchableOpacity>
        </View>

        <View style={tailwind("mt-4 flex-row items-stretch flex-wrap")}>
          <FlatList
            data={state.genres}
            horizontal={false}
            showsHorizontalScrollIndicator={false}
            numColumns={2}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => <Genre {...item} />}
          />
        </View>

        <View style={tailwind("mt-6 flex-row justify-between")}>
          <Text
            style={tailwind("text-slate-900 dark:text-slate-100 text-base")}
          >
            Top Authors
          </Text>
          <TouchableOpacity style={tailwind("")}>
            <Text style={tailwind("text-cyan-500 dark:text-cyan-400 text-sm")}>
              See all
            </Text>
          </TouchableOpacity>
        </View>

        <View style={tailwind("mt-4 flex-row items-stretch flex-wrap")}>
          <FlatList
            data={state.authors}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => <Author {...item} />}
          />
        </View>

        <View style={tailwind("mt-6 flex-row justify-between")}>
          <Text
            style={tailwind("text-slate-900 dark:text-slate-100 text-base")}
          >
            News and interviews
          </Text>
          <TouchableOpacity style={tailwind("")}>
            <Text
              style={tailwind("text-cyan-500 dark:text-cyan-400 text-base")}
            >
              See all
            </Text>
          </TouchableOpacity>
        </View>

        <View
          style={tailwind("mt-3 p-2 bg-slate-100 dark:bg-slate-800 rounded-md")}
        >
          <TouchableOpacity>
            <Text
              style={tailwind(
                "mb-2 text-base tracking-tight text-slate-900 dark:text-slate-100"
              )}
            >
              The most read book of the 2021 reading challenge
            </Text>
          </TouchableOpacity>
          <Text
            style={tailwind(
              "text-sm mb-2 font-normal text-slate-700 dark:text-slate-400"
            )}
          >
            We all want to spend more time lost in the pages of great books.
            That's the idea behind our annual 2021 Goodreads Reading Challenge!
            It's simple: Every January readers set a goal of how many books they
            want to read that year, and we help them keep track of it. This year
            more than 4 million readers have joined the Challenge, pledging to
            read a total of 218 million books!
          </Text>
          <TouchableOpacity
            style={tailwind(
              "bg-cyan-500 dark:bg-cyan-400 w-full py-2 items-center rounded-md"
            )}
          >
            <Text
              style={tailwind("text-sm font-medium text-center text-slate-100")}
            >
              Read more
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default DiscoverScreen;
