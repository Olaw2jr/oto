import {NavigatorScreenParams} from '@react-navigation/native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';

import {Book} from '../utils/MockData';

export type UpdateStackParamList = {
  HomeScreen: undefined;
  UpdateDetailsScreen: undefined;
};

export type TabParamList = {
  UpdateStack: NavigatorScreenParams<UpdateStackParamList> | undefined;
  DiscoverScreen: undefined;
  BoookScreen: undefined;
  ProfileScreen: undefined;
};

export type RootStackParamList = {
  TabScreen: NavigatorScreenParams<TabParamList> | undefined;
  PlayerScreen: undefined;
  BooksScreen: undefined;
  SingleBooksScreen: {book: Book};
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type UpdateStackScreenProps<T extends keyof UpdateStackParamList> =
  NativeStackScreenProps<UpdateStackParamList, T>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
