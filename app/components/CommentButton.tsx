import React, {useState} from 'react';
import {Pressable} from 'react-native';
import {ChatBubbleLeftIcon} from 'react-native-heroicons/outline';
import {useTailwind} from 'tailwind-rn';

const LikeButton = () => {
  const tailwind = useTailwind();
  const [liked, setLiked] = useState(false);

  return (
    <Pressable
      style={tailwind('flex-row items-center mr-4')}
      onPress={() => setLiked(isLiked => !isLiked)}>
      <ChatBubbleLeftIcon
        fill={liked ? '#94a3b8' : '#0f172a'}
        color={'#94a3b8'}
        size={20}
      />
    </Pressable>
  );
};

export default LikeButton;
