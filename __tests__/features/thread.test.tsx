import React from 'react';
import {act, fireEvent, screen} from '@testing-library/react-native';

import FollowingScreen from '../../app/features/following/FollowingScreen';
import ThreadScreen from '../../app/features/following/ThreadScreen';
import {mockNavigation, renderScreen} from '../test-utils';

const press = (el: any) =>
  act(async () => {
    fireEvent.press(el);
  });

describe('FollowingScreen comments', () => {
  it('opens a thread from the comment count', async () => {
    const navigation = mockNavigation();
    await renderScreen(
      <FollowingScreen
        navigation={navigation}
        route={{key: 'F', name: 'Following'} as any}
      />,
    );
    await press(screen.getByRole('button', {name: '5 comments'}));
    expect(navigation.navigate).toHaveBeenCalledWith('Thread', {itemId: 'f2'});
  });

  it('previews the first comments on the card', async () => {
    await renderScreen(
      <FollowingScreen
        navigation={mockNavigation()}
        route={{key: 'F', name: 'Following'} as any}
      />,
    );
    expect(
      screen.getByText('Wait until the chapter on borders.'),
    ).toBeOnTheScreen();
    // Replies stay in the thread.
    expect(screen.queryByText('Almost. I had to pause on the bus.')).toBeNull();
  });
});

describe('ThreadScreen', () => {
  const setup = async () => {
    const navigation = mockNavigation();
    await renderScreen(
      <ThreadScreen
        navigation={navigation}
        route={{key: 'T', name: 'Thread', params: {itemId: 'f2'}} as any}
      />,
    );
    return navigation;
  };

  it('shows the post and its comments with replies', async () => {
    await setup();
    expect(screen.getByRole('header', {name: 'Update'})).toBeOnTheScreen();
    expect(screen.getByText('finished a book')).toBeOnTheScreen();
    expect(
      screen.getByText(
        'Short, plain and heartbreaking. The kind of book you finish in one sitting.',
      ),
    ).toBeOnTheScreen();
    expect(screen.getByText('5 comments')).toBeOnTheScreen();
    expect(
      screen.getByText('The ending is so quiet. Did the last chapter get you?'),
    ).toBeOnTheScreen();
    expect(screen.getByText('Poster · 2 h ago')).toBeOnTheScreen();
    expect(
      screen.getByLabelText('Reply from Zawadi O. to Mika T.'),
    ).toBeOnTheScreen();
  });

  it('replies to a comment', async () => {
    await setup();
    await press(screen.getAllByRole('button', {name: 'Reply to Mika T.'})[0]);
    expect(screen.getByText('Mika')).toBeOnTheScreen();
    expect(screen.getByText(/^Replying to/)).toBeOnTheScreen();

    fireEvent.changeText(
      screen.getByLabelText('Write a reply'),
      'The last line!',
    );
    await press(screen.getByRole('button', {name: 'Send'}));

    // The seed already has one reply from You to Mika.
    expect(screen.getAllByLabelText('Reply from You to Mika T.')).toHaveLength(
      2,
    );
    expect(screen.getByText('6 comments')).toBeOnTheScreen();
    expect(screen.queryByText(/^Replying to/)).toBeNull();
  });

  it('cancels a reply and comments on the post', async () => {
    await setup();
    await press(screen.getAllByRole('button', {name: 'Reply to Daniel K.'})[0]);
    await press(screen.getByRole('button', {name: 'Cancel reply'}));
    expect(screen.queryByText(/^Replying to/)).toBeNull();

    fireEvent.changeText(screen.getByLabelText('Write a reply'), 'Agreed.');
    await press(screen.getByRole('button', {name: 'Send'}));
    expect(screen.getByLabelText('Comment from You')).toBeOnTheScreen();
  });

  it('likes a comment', async () => {
    await setup();
    await press(screen.getByRole('button', {name: 'Like, 4 likes'}));
    expect(
      screen.getByRole('button', {name: 'Unlike, 5 likes'}),
    ).toBeOnTheScreen();
  });

  it('will not send an empty reply', async () => {
    await setup();
    expect(screen.getByRole('button', {name: 'Send'})).toHaveAccessibilityState(
      {disabled: true},
    );
  });

  it('goes back', async () => {
    const navigation = await setup();
    await press(screen.getByRole('button', {name: 'Back'}));
    expect(navigation.goBack).toHaveBeenCalled();
  });
});
