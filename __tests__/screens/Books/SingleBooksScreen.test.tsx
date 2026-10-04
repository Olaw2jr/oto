import React from 'react';
import {screen} from '@testing-library/react-native';

import SingleBooksScreen from '../../../app/screens/Books/single';
import {Book, getBooks} from '../../../app/utils/MockData';
import {renderWithProviders} from '../../test-utils';

const renderBook = (book: Book) =>
  renderWithProviders(
    <SingleBooksScreen
      navigation={{goBack: jest.fn()} as any}
      route={{key: 'k', name: 'SingleBooksScreen', params: {book}}}
    />,
  );

describe('SingleBooksScreen', () => {
  it('shows the selected book, its author, narrator and synopsis', async () => {
    const [book] = await getBooks();
    await renderBook(book);

    expect(screen.getByText(book.title)).toBeOnTheScreen();
    expect(screen.getByText(`Author: ${book.cast}`)).toBeOnTheScreen();
    expect(screen.getByText(`Narrator: ${book.narrator}`)).toBeOnTheScreen();
    expect(screen.getByText(book.genre)).toBeOnTheScreen();
    expect(screen.getByText(book.runtime)).toBeOnTheScreen();
    expect(screen.getByText(book.summary)).toBeOnTheScreen();
    expect(screen.queryByText('Atomic Habits')).not.toBeOnTheScreen();
  });

  it('shows the series when the book belongs to one', async () => {
    const book = (await getBooks()).find(b => b.series)!;
    await renderBook(book);

    expect(screen.getByText(`Series: ${book.series}`)).toBeOnTheScreen();
  });
});
