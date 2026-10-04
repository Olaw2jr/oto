import React from 'react';
import {act, fireEvent, screen} from '@testing-library/react-native';

import Comments from '../../../app/screens/Home/components/Comments';
import {renderWithProviders} from '../../test-utils';

jest.mock('../../../app/utils/MockData', () => ({
  ...jest.requireActual('../../../app/utils/MockData'),
  getComments: async () => [
    {
      id: 'root-1',
      body: 'Root comment',
      username: 'Mika',
      parentId: null,
      createdAt: '2022-08-16T20:00:00.000Z',
    },
    {
      id: 'reply-late',
      body: 'Later reply',
      username: 'Ren',
      parentId: 'root-1',
      createdAt: '2022-08-16T22:00:00.000Z',
    },
    {
      id: 'reply-early',
      body: 'Earlier reply',
      username: 'Zawadi',
      parentId: 'root-1',
      createdAt: '2022-08-16T21:00:00.000Z',
    },
  ],
}));

describe('Comments', () => {
  it('shows root comments with their replies in chronological order', async () => {
    await renderWithProviders(<Comments currentUserId="me" />);

    expect(screen.getByText('Root comment')).toBeOnTheScreen();
    const replies = screen.getAllByText(/reply$/).map(n => n.props.children);
    expect(replies).toEqual(['Earlier reply', 'Later reply']);
  });

  it('adds a posted comment to the thread', async () => {
    await renderWithProviders(<Comments currentUserId="me" />);

    fireEvent.changeText(
      screen.getByPlaceholderText('Type Your Comment'),
      'New thought',
    );
    await act(async () => {
      fireEvent.press(screen.getByText('Post Comment'));
    });

    expect(screen.getByText('New thought')).toBeOnTheScreen();
  });
});
