import React from "react";
import { Text, View, Image, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StarIcon } from "react-native-heroicons/outline";
import { useTailwind } from "tailwind-rn";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StackPrams } from "../../App";

type ReadingProps = {
  id: string;
  title: string;
  author: string;
  cover_url: string;
  rating: number;
};

const Recommend: React.FC<ReadingProps> = ({ ...props }) => {
  const tailwind = useTailwind();
  const navigation = useNavigation<NativeStackNavigationProp<StackPrams>>();

  return (
    <TouchableOpacity
      style={tailwind("flex w-32 items-center")}
      onPress={() => navigation.navigate("BooksScreen")}
    >
      <Image
        style={tailwind("w-28 h-28 rounded-md")}
        source={props.cover_url}
      />
      <View style={tailwind("flex-col mt-1")}>
        <Text
          ellipsizeMode="tail"
          numberOfLines={1}
          style={tailwind("text-slate-900 text-sm dark:text-slate-200")}
        >
          {props.title}
        </Text>

        <Text style={tailwind("text-sm text-slate-500 dark:text-slate-400")}>
          {props.author}
        </Text>

        <View style={tailwind("flex-row items-center")}>
          <StarIcon style={tailwind("text-yellow-400")} size={16} />
          <Text
            style={tailwind("ml-2 text-sm text-slate-500 dark:text-slate-400")}
          >
            {props.rating}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default Recommend;
