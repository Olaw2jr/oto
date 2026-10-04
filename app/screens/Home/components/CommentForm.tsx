import React, { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";

import { useTailwind } from "tailwind-rn";

type CommentFormProps = {
  handleSubmit: (text: string) => void;
  submitLabel: string;
};

const CommentForm = ({ handleSubmit, submitLabel }: CommentFormProps) => {
    const tailwind = useTailwind();
    const [text, setText] = useState("");

    const onSubmit = () => {
      if (!text.trim()) {
        return;
      }
      handleSubmit(text);
      setText("");
    };

    return (
        <View style={tailwind("flex px-4")}>
          <View style={tailwind("flex -mx-3 mb-6")}>
            <Text
              style={tailwind(
                "pt-3 pb-2 text-slate-900 dark:text-slate-100 text-base"
              )}
            >
              Add a new comment
            </Text>
            <View style={tailwind("w-full mb-2 mt-2")}>
              <TextInput
                style={tailwind(
                  "rounded border border-slate-400 leading-normal px-3 font-medium"
                )}
                numberOfLines={3}
                placeholder="Type Your Comment"
                value={text}
                onChangeText={setText}
              />
            </View>
            <View style={tailwind("flex items-end")}>
              <TouchableOpacity
                onPress={onSubmit}
                style={tailwind(
                  "bg-slate-600 py-1 px-4 border border-slate-400 rounded-md"
                )}
              >
                <Text
                  style={tailwind(
                    "text-slate-400 font-medium text-base tracking-wide"
                  )}
                >
                  {submitLabel}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
  </View>
  );
};

export default CommentForm;
