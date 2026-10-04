import React from 'react';
import {Image, Text, TouchableOpacity, View} from 'react-native';
import {
  ChatBubbleLeftRightIcon,
  HandThumbUpIcon,
} from 'react-native-heroicons/outline';

import {useTailwind} from 'tailwind-rn';

const Comment = ({comment, replies}) => {
  const tailwind = useTailwind();

  return (
    <View style={tailwind('w-full my-4')}>
      <View style={tailwind('flex flex-row')}>
        <Image
          style={tailwind('w-12 h-12 border-2 border-slate-300 rounded-full')}
          source={comment.userAvatar}
        />
        <View style={tailwind('flex-col mt-1')}>
          <View style={tailwind('flex flex-1 px-4')}>
            <Text
              style={tailwind('font-bold  text-slate-500 dark:text-slate-400')}>
              {comment.username}
            </Text>
            <Text
              style={tailwind(
                'text-xs font-normal text-slate-500 dark:text-slate-400',
              )}>
              {comment.createdAt}
            </Text>
          </View>
          <View style={tailwind('flex-1 px-2 ml-2')}>
            <Text
              style={tailwind('text-sm text-slate-500 dark:text-slate-400')}>
              {comment.body}
            </Text>
          </View>
          <View style={tailwind('flex-row')}>
            <TouchableOpacity style={tailwind('items-center px-1 pt-2')}>
              <ChatBubbleLeftRightIcon
                style={tailwind('ml-2 text-slate-500 dark:text-slate-400')}
                size={18}
              />
            </TouchableOpacity>
            <TouchableOpacity style={tailwind('items-center px-1 pt-2')}>
              <HandThumbUpIcon
                style={tailwind('text-slate-500 dark:text-slate-400')}
                size={18}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
      {replies.length > 0 && (
        <View style={tailwind('mt-1 ml-6')}>
          {replies.map(reply => (
            <Comment comment={reply} key={reply.id} replies={[]} />
          ))}
        </View>
      )}
    </View>
  );
};

export default Comment;
