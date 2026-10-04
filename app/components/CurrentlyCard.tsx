import React from "react";
import {
  Text,
  View,
  Image,
  TouchableOpacity,
  Dimensions,
  Pressable,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTailwind } from "tailwind-rn";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StackPrams } from "../../App";

type ReadingProps = {
  id: string;
  title: string;
  author: string;
  naratedby: string;
  cover_url: string;
  timeStamp: string;
  length: string;
  updated_at: string;
};

const CurrentlyCard: React.FC<ReadingProps> = ({ ...props }) => {
  const tailwind = useTailwind();
  const navigation = useNavigation<NativeStackNavigationProp<StackPrams>>();
  const SCREEN_WIDTH = Dimensions.get("window").width;

  return (
    <Pressable
      style={{ width: SCREEN_WIDTH * 0.8 }}
      onPress={() => navigation.navigate("PlayerScreen")}
    >
      <View
        style={tailwind(
          "p-2 mr-4 flex-row rounded-md bg-slate-100 dark:bg-slate-800"
        )}
      >
        <Image
          style={tailwind("w-24 h-24 rounded-md flex-none")}
          source={props.cover_url}
          accessibilityLabel={`${props.title} by ${props.author}`}
        />
        <View style={tailwind("pl-2 flex-auto")}>
          <Text
            numberOfLines={2}
            style={tailwind(
              "text-slate-900 dark:text-slate-100 text-base font-medium"
            )}
          >
            {props.title}
          </Text>
          <TouchableOpacity style={tailwind("")}>
            <Text style={tailwind("text-sm text-cyan-500 dark:text-cyan-400")}>
              {props.author}
            </Text>
          </TouchableOpacity>
          <Text
            style={tailwind("mb-2 text-sm text-slate-700 dark:text-slate-500")}
          >
            {`${props.timeStamp} of ${props.length}`}
          </Text>
          <View
            style={tailwind(
              "w-full rounded-full h-1 mb-2 bg-slate-700 dark:bg-slate-500"
            )}
          >
            <View
              style={tailwind(
                "h-1 rounded-full bg-cyan-500 dark:bg-cyan-400 w-1/4"
              )}
            />
          </View>
          <View style={tailwind("flex-row justify-end")}>
            <Text
              style={tailwind("text-sm text-slate-700 dark:text-slate-500")}
            >
              Updated on {`${props.updated_at}`}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
};

export default CurrentlyCard;
