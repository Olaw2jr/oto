import {
  CompositeScreenProps,
  NavigatorScreenParams,
} from '@react-navigation/native';
import {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import {NativeStackScreenProps} from '@react-navigation/native-stack';

export type TabParamList = {
  Home: undefined;
  Discover: undefined;
  Following: undefined;
  Clubs: undefined;
  You: undefined;
};

export type RootStackParamList = {
  // Signed out
  Splash: undefined;
  Onboarding: undefined;
  SignIn: undefined;
  SignUp: undefined;
  // Signed in
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  Book: {bookId: string};
  Player: undefined;
  Club: {clubId: string};
  UpdateCompose: {bookId?: string} | undefined;
  Settings: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

// Tab screens can also navigate to routes on the root stack.
export type TabScreenProps<T extends keyof TabParamList> = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
