import React from "react";
import {
  FlatList,
  Image,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

import { useTailwind } from "tailwind-rn";
import Shelf from "../../components/Shelf";
import Tag from "../../components/Tag";
import state from "../../utils/MockData";

const BoookScreen = () => {
  const tailwind = useTailwind();

  return (
    <SafeAreaView style={tailwind("flex-1 bg-slate-100 dark:bg-slate-900")}>
      <StatusBar translucent backgroundColor="transparent" />

      <ScrollView style={tailwind("mx-4")}>
        <View style={tailwind("mt-4 flex-row justify-between")}>
          <Text
            style={tailwind("text-slate-900 dark:text-slate-100 text-base")}
          >
            Shelves
          </Text>
          <TouchableOpacity style={tailwind("")}>
            <Text style={tailwind("text-cyan-500 dark:text-cyan-400 text-sm")}>
              See all
            </Text>
          </TouchableOpacity>
        </View>

        <View style={tailwind("mt-4")}>
          <FlatList
            data={state.shelves}
            horizontal={false}
            showsHorizontalScrollIndicator={false}
            numColumns={2}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => <Shelf {...item} />}
          />

          {/* <TouchableOpacity
            style={tailwind(
              "mt-4 w-[48%] flex flex-col items-center justify-center rounded-md border border-dashed border-slate-300 py-3"
            )}
          >
            <Svg
              style={tailwind("mb-1 text-slate-400")}
              width="20"
              height="20"
              fill="currentColor"
              aria-hidden="true"
            >
              <Path d="M10 5a1 1 0 0 1 1 1v3h3a1 1 0 1 1 0 2h-3v3a1 1 0 1 1-2 0v-3H6a1 1 0 1 1 0-2h3V6a1 1 0 0 1 1-1Z" />
            </Svg>
            <Text
              style={tailwind(
                "text-sm leading-6 text-slate-900 dark:text-slate-400"
              )}
            >
              New shelf
            </Text>
          </TouchableOpacity> */}
        </View>

        <View style={tailwind("mt-5 flex-row justify-between")}>
          <Text
            style={tailwind("text-slate-900 dark:text-slate-100 text-base")}
          >
            Tags
          </Text>
        </View>

        <View style={tailwind("mt-3")}>
          <FlatList
            data={state.tags}
            horizontal={false}
            showsHorizontalScrollIndicator={false}
            numColumns={4}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => <Tag {...item} />}
          />
        </View>

        <View style={tailwind("mt-5 flex-row justify-between")}>
          <Text
            style={tailwind("text-slate-900 dark:text-slate-100 text-base")}
          >
            Listening challenge
          </Text>
        </View>

        <View style={tailwind("mt-3 p-2")}>
          <View style={tailwind("flex-row items-center")}>
            <View
              style={tailwind(
                "flex overflow-hidden relative justify-center items-center w-10 h-10 bg-slate-100 rounded-full dark:bg-slate-600"
              )}
            >
              <Text
                style={tailwind("text-xs text-slate-600 dark:text-slate-300")}
              >
                2022
              </Text>
            </View>
            <View style={tailwind("ml-4 flex-auto")}>
              <Text
                style={tailwind("text-xs text-slate-700 dark:text-slate-500")}
              >
                Listened to 4 book out of 12 books
              </Text>
              <View
                style={tailwind(
                  "w-full rounded-full mt-2 h-1 bg-slate-700 dark:bg-slate-500"
                )}
              >
                <View
                  style={tailwind(
                    "h-1 rounded-full bg-cyan-500 dark:bg-cyan-400 w-1/4"
                  )}
                />
              </View>
            </View>
            <Text
              style={tailwind(
                "ml-4 flex-none py-[0.3125rem] px-2 font-medium text-slate-700 dark:text-slate-500"
              )}
            >
              25%
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default BoookScreen;
