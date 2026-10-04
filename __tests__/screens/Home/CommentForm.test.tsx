import React from 'react';
import {fireEvent, screen} from '@testing-library/react-native';

import CommentForm from '../../../app/screens/Home/components/CommentForm';
import {renderWithProviders} from '../../test-utils';

describe('CommentForm', () => {
  it('submits the typed comment and clears the field', async () => {
    const handleSubmit = jest.fn();
    await renderWithProviders(
      <CommentForm handleSubmit={handleSubmit} submitLabel="Post Comment" />,
    );

    const input = screen.getByPlaceholderText('Type Your Comment');
    fireEvent.changeText(input, 'Loved chapter 3');
    fireEvent.press(screen.getByText('Post Comment'));

    expect(handleSubmit).toHaveBeenCalledWith('Loved chapter 3');
    expect(input).toHaveProp('value', '');
  });

  it('does not submit an empty comment', async () => {
    const handleSubmit = jest.fn();
    await renderWithProviders(
      <CommentForm handleSubmit={handleSubmit} submitLabel="Post Comment" />,
    );

    fireEvent.press(screen.getByText('Post Comment'));

    expect(handleSubmit).not.toHaveBeenCalled();
  });
});
