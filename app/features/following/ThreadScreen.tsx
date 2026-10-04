import React, {useState} from 'react';
import {Pressable, StyleSheet, TextInput, View} from 'react-native';

import {BookCover} from '../../components/BookCover';
import {PersonLink} from '../../components/PersonLink';
import {LoadingState} from '../../components/LoadingState';
import {getBook} from '../../data/catalogue';
import {firstName, getPerson, ME} from '../../data/people';
import {FeedComment} from '../../data/social';
import {openPerson} from '../../navigator/openPerson';
import {RootStackScreenProps} from '../../navigator/types';
import {useSocial} from '../../state/social';
import {shareUpdate} from '../../utils/share';
import {useFirstLoad} from '../../state/firstLoad';
import {useTheme} from '../../theme/ThemeProvider';
import {fonts} from '../../theme/typography';
import {Avatar, Icon, IconButton, Screen, Sheet, SheetRow, Txt} from '../../ui';

const nameOf = (id: string) => (id === ME ? 'You' : getPerson(id).short);

const LikeButton = ({id, base}: {id: string; base: number}) => {
  const social = useSocial();
  const liked = social.liked(id);
  const count = social.likeCount(id, base);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${liked ? 'Unlike' : 'Like'}, ${count} likes`}
      accessibilityState={{selected: liked}}
      onPress={() => social.toggleLike(id)}
      style={styles.action}>
      <Icon
        name={liked ? 'heartFilled' : 'heart'}
        size={18}
        color={liked ? 'kaki' : 'graphite'}
      />
      <Txt variant="caption" style={styles.count}>
        {String(count)}
      </Txt>
    </Pressable>
  );
};

type CommentProps = {
  comment: FeedComment;
  parent?: FeedComment;
  posterId: string;
  onOpenPerson: (personId: string) => void;
  onReply: (comment: FeedComment) => void;
};

const Comment = ({
  comment,
  parent,
  posterId,
  onOpenPerson,
  onReply,
}: CommentProps) => {
  const {colors} = useTheme();
  return (
    <View style={[styles.comment, parent && styles.reply]}>
      {parent ? (
        <View style={[styles.thread, {backgroundColor: colors.hairline}]} />
      ) : null}
      <PersonLink personId={comment.by} onOpen={onOpenPerson}>
        <Avatar name={getPerson(comment.by).name} size={parent ? 30 : 34} />
      </PersonLink>
      <View style={styles.commentBody}>
        <View
          accessible
          accessibilityLabel={
            parent
              ? `Reply from ${nameOf(comment.by)} to ${nameOf(parent.by)}`
              : `Comment from ${nameOf(comment.by)}`
          }>
          <View style={styles.meta}>
            <Txt variant="caption" color="ink" weight="semibold">
              {nameOf(comment.by)}
            </Txt>
            <Txt variant="small" style={styles.ago}>
              {comment.by === posterId
                ? `Poster · ${comment.ago}`
                : comment.ago}
            </Txt>
          </View>
          <Txt variant="quote" style={styles.commentText}>
            {comment.body}
          </Txt>
        </View>
        {comment.by === ME ? null : (
          <View style={styles.actions}>
            <LikeButton id={comment.id} base={comment.likes} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Reply to ${nameOf(comment.by)}`}
              onPress={() => onReply(comment)}
              style={styles.action}>
              <Txt variant="caption" color="ink" weight="semibold">
                Reply
              </Txt>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
};

const ThreadScreen = ({navigation, route}: RootStackScreenProps<'Thread'>) => {
  const {colors} = useTheme();
  const social = useSocial();
  const item = social.findUpdate(route.params.itemId)!;
  const loading = useFirstLoad(`thread:${item.id}`);
  const book = getBook(item.bookId);
  const comments = social.comments(item.id);
  const [draft, setDraft] = useState('');
  const [moreOpen, setMoreOpen] = useState(false);
  const [replyTo, setReplyTo] = useState<FeedComment | null>(null);

  const topLevel = comments.filter(c => !c.parentId);
  const repliesTo = (id: string) => comments.filter(c => c.parentId === id);

  const send = () => {
    // Replies always hang off the top-level comment, as on the canvas.
    social.addComment(
      item.id,
      draft.trim(),
      replyTo ? replyTo.parentId ?? replyTo.id : undefined,
    );
    setDraft('');
    setReplyTo(null);
  };

  if (loading) {
    return (
      <Screen>
        <View style={styles.bar}>
          <IconButton
            icon="back"
            label="Back"
            onPress={() => navigation.goBack()}
          />
        </View>
        <LoadingState message={'Loading the conversation'} layout="list" />
      </Screen>
    );
  }

  return (
    <Screen
      scroll
      footer={
        <View>
          {replyTo ? (
            <View style={styles.replying}>
              <Txt variant="small">
                Replying to{' '}
                <Txt variant="small" color="ink" weight="semibold">
                  {replyTo.by === ME ? 'yourself' : firstName(replyTo.by)}
                </Txt>
              </Txt>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cancel reply"
                onPress={() => setReplyTo(null)}
                style={styles.cancel}>
                <Txt variant="small" color="ink" weight="semibold">
                  Cancel
                </Txt>
              </Pressable>
            </View>
          ) : null}
          <View style={styles.composer}>
            <View style={[styles.field, {backgroundColor: colors.raised}]}>
              <TextInput
                accessibilityLabel="Write a reply"
                placeholder="Write a reply"
                placeholderTextColor={colors.graphite}
                value={draft}
                onChangeText={setDraft}
                style={[styles.input, {color: colors.ink}]}
              />
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Send"
              accessibilityState={{disabled: !draft.trim()}}
              disabled={!draft.trim()}
              onPress={send}
              style={[
                styles.send,
                {backgroundColor: colors.ink},
                !draft.trim() && styles.disabled,
              ]}>
              <Icon name="send" color="onInk" />
            </Pressable>
          </View>
        </View>
      }>
      <View style={styles.bar}>
        <IconButton
          icon="back"
          label="Back"
          onPress={() => navigation.goBack()}
        />
        <Txt
          variant="heading"
          accessibilityRole="header"
          style={styles.barTitle}>
          Update
        </Txt>
        <IconButton
          icon="more"
          label="More"
          onPress={() => setMoreOpen(true)}
        />
      </View>

      <View style={styles.head}>
        <PersonLink
          personId={item.by}
          onOpen={id => openPerson(navigation, id)}>
          <Avatar name={getPerson(item.by).name} size={40} />
        </PersonLink>
        <View style={styles.who}>
          <Txt variant="caption" color="ink">
            <Txt variant="caption" color="ink" weight="semibold">
              {nameOf(item.by)}
            </Txt>{' '}
            <Txt variant="caption">{item.verb}</Txt>
          </Txt>
          <Txt variant="small">{item.ago}</Txt>
        </View>
        {item.rating ? (
          <View style={styles.rating}>
            <Icon name="starFilled" size={14} />
            <Txt
              variant="caption"
              color="ink"
              weight="semibold"
              style={styles.ratingText}>
              {item.rating.toFixed(1)}
            </Txt>
          </View>
        ) : null}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${book.title}, ${book.author}`}
        onPress={() => navigation.navigate('Book', {bookId: book.id})}
        style={styles.book}>
        <BookCover book={book} size={64} />
        <View style={styles.bookText}>
          <Txt variant="bookTitle">{book.title}</Txt>
          <Txt variant="caption" style={styles.author}>
            {book.author}
          </Txt>
        </View>
      </Pressable>

      <Txt variant="quote" style={styles.body}>
        {item.body}
      </Txt>

      <View style={[styles.postActions, {borderBottomColor: colors.hairline}]}>
        <LikeButton id={item.id} base={item.likes} />
        <Txt variant="caption" color="ink" weight="semibold">
          {comments.length === 1 ? '1 comment' : `${comments.length} comments`}
        </Txt>
      </View>

      <View style={styles.comments}>
        {topLevel.map(comment => (
          <View key={comment.id} style={styles.group}>
            <Comment
              comment={comment}
              posterId={item.by}
              onOpenPerson={id => openPerson(navigation, id)}
              onReply={setReplyTo}
            />
            {repliesTo(comment.id).map(reply => (
              <Comment
                key={reply.id}
                comment={reply}
                parent={comment}
                posterId={item.by}
                onOpenPerson={id => openPerson(navigation, id)}
                onReply={setReplyTo}
              />
            ))}
          </View>
        ))}
      </View>
      <Sheet
        visible={moreOpen}
        title="Update"
        onClose={() => setMoreOpen(false)}>
        <SheetRow
          icon="share"
          label="Share update"
          onPress={() => {
            setMoreOpen(false);
            shareUpdate(nameOf(item.by), book, item.body);
          }}
        />
        {item.by === ME ? null : (
          <SheetRow
            icon="flag"
            label="Report"
            onPress={() => {
              setMoreOpen(false);
              social.reportUpdate(item.id);
              navigation.goBack();
            }}
          />
        )}
      </Sheet>
    </Screen>
  );
};

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: -10,
  },
  barTitle: {fontSize: 18},
  head: {flexDirection: 'row', alignItems: 'center', marginTop: 4},
  who: {flex: 1, marginLeft: 12},
  rating: {flexDirection: 'row', alignItems: 'center'},
  ratingText: {marginLeft: 4},
  book: {flexDirection: 'row', alignItems: 'center', marginTop: 12},
  bookText: {flex: 1, marginLeft: 14},
  author: {marginTop: 2},
  body: {fontSize: 16, lineHeight: 24, marginTop: 10},
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    marginTop: 2,
  },
  comments: {marginTop: 14},
  group: {marginBottom: 10},
  comment: {flexDirection: 'row'},
  reply: {paddingLeft: 46},
  thread: {position: 'absolute', left: 16, top: -14, bottom: 30, width: 1.5},
  commentBody: {flex: 1, marginLeft: 12},
  meta: {flexDirection: 'row', alignItems: 'baseline'},
  ago: {marginLeft: 8},
  commentText: {fontSize: 15, lineHeight: 22, marginTop: 3},
  actions: {flexDirection: 'row'},
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingHorizontal: 4,
    marginRight: 8,
  },
  count: {marginLeft: 6},
  replying: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    paddingBottom: 6,
  },
  cancel: {
    minHeight: 30,
    minWidth: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  composer: {flexDirection: 'row', alignItems: 'center'},
  field: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    paddingHorizontal: 16,
    justifyContent: 'center',
    marginRight: 10,
  },
  input: {fontFamily: fonts.sans.regular, fontSize: 15, padding: 0},
  disabled: {opacity: 0.4},
  send: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ThreadScreen;
