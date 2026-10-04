import React, {useEffect, useState} from 'react';
import {Text, View} from 'react-native';

import {useTailwind} from 'tailwind-rn';
import {getComments as getCommentsApi} from '../../../utils/MockData';
import Comment from './Comment';
import CommentForm from './CommentForm';

const Comments = ({currentUserId}) => {
  const tailwind = useTailwind();
  const [backendComments, setBackendComments] = useState([]);

  const rootComments = backendComments.filter(backendComments => {
    backendComments.parentId === null;
  });

  const getReplies = commentID => {
    return backendComments
      .filter(backendComments => backendComments.parentId === commentID)
      .sort(
        (a, b) =>
          newDate(a.createdAt).getTime() - newDate(b.createdAt).getTime(),
      );
  };

  useEffect(() => {
    getCommentsApi().then(data => {
      setBackendComments(data);
    });
  }, []);

  const addComment = (text, parrentId) => {};

  return (
    <>
      <View style={tailwind('relative flex')}>
        <View style={tailwind('px-0')}>
          {rootComments.map(rootComment => (
            <Comment
              key={rootComment.id}
              comment={rootComment}
              replies={getReplies(rootComment.id)}
            />
          ))}
        </View>
      </View>
      <CommentForm
        submitLabel={`Add a new comment`}
        handleSubmit={addComment()}
      />
    </>
  );
};

export default Comments;
