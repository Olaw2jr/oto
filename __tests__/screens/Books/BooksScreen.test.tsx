import React from 'react';
import {fireEvent, screen} from '@testing-library/react-native';

import BooksScreen from '../../../app/screens/Books';
import {getBooks} from '../../../app/utils/MockData';
import {renderWithProviders} from '../../test-utils';

describe('BooksScreen', () => {
  it('lists books and opens the selected one', async () => {
    const navigation = {navigate: jest.fn()};
    const [first] = await getBooks();

    await renderWithProviders(
      <BooksScreen navigation={navigation as any} route={{} as any} />,
    );

    fireEvent.press(screen.getByText(first.title));

    expect(navigation.navigate).toHaveBeenCalledWith('SingleBooksScreen', {
      book: first,
    });
  });
});
