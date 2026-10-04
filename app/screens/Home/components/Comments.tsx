import React, {useEffect, useState} from 'react';
import {View} from 'react-native';

import {useTailwind} from 'tailwind-rn';
import {getComments as getCommentsApi} from '../../../utils/MockData';
import Comment from './Comment';
import CommentForm from './CommentForm';

type CommentData = {
  id: string;
  body: string;
  username: string;
  userId?: string;
  userAvatar?: number;
  parentId: string | null;
  createdAt: string;
};

type CommentsProps = {
  currentUserId: string;
};

const byCreatedAt = (a: CommentData, b: CommentData) =>
  new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();

const Comments = ({currentUserId}: CommentsProps) => {
  const tailwind = useTailwind();
  const [comments, setComments] = useState<CommentData[]>([]);

  useEffect(() => {
    getCommentsApi().then(data => {
      setComments(data);
    });
  }, []);

  const rootComments = comments.filter(comment => comment.parentId === null);

  const getReplies = (commentId: string) =>
    comments
      .filter(comment => comment.parentId === commentId)
      .sort(byCreatedAt);

  const addComment = (text: string, parentId: string | null = null) => {
    setComments(current => [
      ...current,
      {
        id: `${currentUserId}-${Date.now()}`,
        body: text,
        username: 'You',
        userId: currentUserId,
        parentId,
        createdAt: new Date().toISOString(),
      },
    ]);
  };

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
        submitLabel="Post Comment"
        handleSubmit={text => addComment(text)}
      />
    </>
  );
};

export default Comments;
