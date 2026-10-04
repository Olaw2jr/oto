import {ME} from '../data/people';

type Navigate = {navigate: (...args: any[]) => void};

// Your own avatar leads to the You tab; anyone else's to their profile.
export const openPerson = (navigation: Navigate, personId: string) =>
  personId === ME
    ? navigation.navigate('Tabs', {screen: 'You'})
    : navigation.navigate('Person', {personId});
