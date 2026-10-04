import React, {useEffect, useState} from 'react';
import {View, ScrollView, Text} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {useTailwind} from 'tailwind-rn';
import Nav from './components/Nav';
import NavItem from './components/NavItem';
import List from './components/List';
import ListItem from './components/ListItem';

import {Book, getBooks as getBooksApi} from '../../utils/MockData';
import {RootStackScreenProps} from '../../navigator/types';

const BooksScreen = ({navigation}: RootStackScreenProps<'BooksScreen'>) => {
  const tailwind = useTailwind();
  const [books, setBooks] = useState<Book[]>([]);

  useEffect(() => {
    getBooksApi().then(data => {
      setBooks(data);
    });
  }, []);

  return (
    <SafeAreaView style={tailwind('flex-1 bg-slate-100 dark:bg-slate-900')}>
      <ScrollView style={tailwind('mx-4')} showsVerticalScrollIndicator={false}>
        <View style={tailwind('')}>
          <Nav>
            <NavItem href={() => {}} isActive>
              <Text style={tailwind('text-sm font-medium')}>New Releases</Text>
            </NavItem>
            <NavItem href={() => {}}>
              <Text style={tailwind('text-sm font-medium')}>Top Rated</Text>
            </NavItem>
            <NavItem href={() => {}}>
              <Text style={tailwind('text-sm font-medium')}>
                Vincent’s Picks
              </Text>
            </NavItem>
          </Nav>
          <List>
            {books.map(book => (
              <ListItem
                href={() => navigation.navigate('SingleBooksScreen', {book})}
                key={book.id}
                book={book}
              />
            ))}
          </List>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default BooksScreen;
